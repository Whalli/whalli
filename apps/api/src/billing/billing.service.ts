import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import Stripe from 'stripe';
import { SubscriptionPlan } from '@prisma/client';

export interface CreateCustomerDto {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionDto {
  userId: string;
  plan: SubscriptionPlan;
  trialPeriodDays?: number;
}

export interface SubscriptionResponse {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;
  private readonly planPriceIds: Record<SubscriptionPlan, string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Billing features will be limited.');
    }

    this.stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
      apiVersion: '2025-09-30.clover',
    });

    // Map subscription plans to Stripe Price IDs
    // These should be configured in your environment variables
    this.planPriceIds = {
      BASIC: this.configService.get<string>('STRIPE_BASIC_PRICE_ID') || '',
      PRO: this.configService.get<string>('STRIPE_PRO_PRICE_ID') || '',
      ENTERPRISE: this.configService.get<string>('STRIPE_ENTERPRISE_PRICE_ID') || '',
    };
  }

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(dto: CreateCustomerDto): Promise<Stripe.Customer> {
    try {
      this.logger.log(`Creating Stripe customer for email: ${dto.email}`);

      const customer = await this.stripe.customers.create({
        email: dto.email,
        name: dto.name,
        metadata: dto.metadata || {},
      });

      this.logger.log(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create Stripe customer: ${message}`, stack);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<SubscriptionResponse> {
    try {
      this.logger.log(`Creating subscription for user: ${dto.userId}, plan: ${dto.plan}`);

      // Validate plan
      if (!Object.values(SubscriptionPlan).includes(dto.plan)) {
        throw new BadRequestException(`Invalid plan: ${dto.plan}`);
      }

      // Get or create user
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        include: { subscription: true },
      });

      if (!user) {
        throw new NotFoundException(`User not found: ${dto.userId}`);
      }

      // Check if user already has a subscription
      if (user.subscription) {
        this.logger.warn(`User ${dto.userId} already has a subscription`);
        throw new BadRequestException('User already has an active subscription');
      }

      let stripeCustomerId = user.subscription?.stripeCustomerId;
      let stripeSubscriptionId: string | null = null;
      let trialEndsAt: Date | null = null;

      // Create Stripe customer if not exists
      if (!stripeCustomerId) {
        const customer = await this.createCustomer({
          email: user.email,
          name: user.name || undefined,
          metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;
      }

      // Create Stripe subscription
      const priceId = this.planPriceIds[dto.plan];
      
      if (priceId) {
        const subscriptionParams: Stripe.SubscriptionCreateParams = {
          customer: stripeCustomerId,
          items: [{ price: priceId }],
          metadata: {
            userId: dto.userId,
            plan: dto.plan,
          },
        };

        // Add trial period if specified
        if (dto.trialPeriodDays && dto.trialPeriodDays > 0) {
          subscriptionParams.trial_period_days = dto.trialPeriodDays;
          trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + dto.trialPeriodDays);
        }

        const stripeSubscription = await this.stripe.subscriptions.create(subscriptionParams);
        stripeSubscriptionId = stripeSubscription.id;

        this.logger.log(`Stripe subscription created: ${stripeSubscriptionId}`);
      } else {
        this.logger.warn(`No Stripe Price ID configured for plan: ${dto.plan}`);
      }

      // Create subscription in database
      const subscription = await this.prisma.subscription.create({
        data: {
          userId: dto.userId,
          plan: dto.plan,
          status: dto.trialPeriodDays ? 'trialing' : 'active',
          stripeCustomerId,
          stripeSubscriptionId,
          trialEndsAt,
        },
      });

      // Update user with subscriptionId
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: { subscriptionId: subscription.id },
      });

      this.logger.log(`Subscription created in database: ${subscription.id}`);

      return {
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        trialEndsAt: subscription.trialEndsAt,
        createdAt: subscription.createdAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create subscription: ${message}`, stack);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(userId: string, newPlan: SubscriptionPlan): Promise<SubscriptionResponse> {
    try {
      this.logger.log(`Updating subscription for user: ${userId} to plan: ${newPlan}`);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Update Stripe subscription if exists
      if (subscription.stripeSubscriptionId) {
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
        );

        const newPriceId = this.planPriceIds[newPlan];
        
        if (newPriceId) {
          await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            items: [
              {
                id: stripeSubscription.items.data[0].id,
                price: newPriceId,
              },
            ],
            proration_behavior: 'create_prorations',
          });
        }
      }

      // Update database
      const updated = await this.prisma.subscription.update({
        where: { userId },
        data: { plan: newPlan },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        plan: updated.plan,
        status: updated.status,
        stripeCustomerId: updated.stripeCustomerId,
        stripeSubscriptionId: updated.stripeSubscriptionId,
        trialEndsAt: updated.trialEndsAt,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update subscription: ${message}`, stack);
      throw new BadRequestException('Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      this.logger.log(`Canceling subscription for user: ${userId}`);

      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Cancel Stripe subscription if exists
      if (subscription.stripeSubscriptionId) {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      // Update database
      const updated = await this.prisma.subscription.update({
        where: { userId },
        data: { status: 'canceled' },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        plan: updated.plan,
        status: updated.status,
        stripeCustomerId: updated.stripeCustomerId,
        stripeSubscriptionId: updated.stripeSubscriptionId,
        trialEndsAt: updated.trialEndsAt,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to cancel subscription: ${message}`, stack);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Get subscription by user ID
   */
  async getSubscription(userId: string): Promise<SubscriptionResponse | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      trialEndsAt: subscription.trialEndsAt,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      this.logger.log(`Processing webhook event: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to handle webhook: ${message}`, stack);
      throw error;
    }
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Handling subscription created: ${subscription.id}`);

    const userId = subscription.metadata.userId;
    
    if (!userId) {
      this.logger.warn('No userId in subscription metadata');
      return;
    }

    const plan = subscription.metadata.plan as SubscriptionPlan;
    
    const updatedSubscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: plan || SubscriptionPlan.BASIC,
        status: subscription.status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
      update: {
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });

    // Update user with subscriptionId
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionId: updatedSubscription.id },
    });
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Handling subscription updated: ${subscription.id}`);

    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true },
    });

    if (!existing) {
      this.logger.warn(`Subscription not found in database: ${subscription.id}`);
      return;
    }

    // Determine plan from subscription items
    let plan = existing.plan;
    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      plan = this.getPlanFromPriceId(priceId) || existing.plan;
    }

    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan,
        status: subscription.status,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });

    // Ensure user.subscriptionId is set
    if (!existing.user.subscriptionId) {
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: { subscriptionId: existing.id },
      });
    }
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Handling subscription deleted: ${subscription.id}`);

    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { status: 'canceled' },
      });

      // Send subscription expired notification
      await this.notificationsService.notifySubscriptionExpired(
        existing.user.id,
        existing.user.email,
      );

      // Keep subscriptionId on user for historical records
      // Optionally, you can set it to null:
      // await this.prisma.user.update({
      //   where: { id: existing.userId },
      //   data: { subscriptionId: null },
      // });
    }
  }

  /**
   * Handle trial will end event
   */
  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Handling trial will end: ${subscription.id}`);

    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true },
    });

    if (existing && subscription.trial_end) {
      const expiresAt = new Date(subscription.trial_end * 1000);
      
      // Send notification
      await this.notificationsService.notifySubscriptionExpiring(
        existing.user.id,
        existing.user.email,
        expiresAt,
      );
      
      this.logger.log(`Trial ending soon for user: ${existing.user.email}`);
    }
  }

  /**
   * Handle payment succeeded event
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Handling payment succeeded: ${invoice.id}`);

    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string' 
      ? invoiceAny.subscription 
      : invoiceAny.subscription?.id;
    
    if (subscriptionId) {
      const existing = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        include: { user: true },
      });

      if (existing) {
        await this.prisma.subscription.update({
          where: { id: existing.id },
          data: { status: 'active' },
        });

        // Ensure user.subscriptionId is set
        await this.prisma.user.update({
          where: { id: existing.userId },
          data: { subscriptionId: existing.id },
        });

        // Send payment success notification
        const amount = invoice.amount_paid / 100; // Convert cents to dollars
        const currency = invoice.currency.toUpperCase();
        
        await this.notificationsService.notifyPaymentSuccess(
          existing.user.id,
          existing.user.email,
          amount,
          currency,
        );
      }
    }
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Handling payment failed: ${invoice.id}`);

    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string' 
      ? invoiceAny.subscription 
      : invoiceAny.subscription?.id;
    
    if (subscriptionId) {
      const existing = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        include: { user: true },
      });

      if (existing) {
        await this.prisma.subscription.update({
          where: { id: existing.id },
          data: { status: 'past_due' },
        });

        // Send payment failed notification
        const amount = invoice.amount_due / 100; // Convert cents to dollars
        const currency = invoice.currency.toUpperCase();
        
        await this.notificationsService.notifyPaymentFailed(
          existing.user.id,
          existing.user.email,
          amount,
          currency,
        );

        // User still has subscriptionId reference even if payment failed
      }
    }
  }

  /**
   * Get plan from Stripe Price ID
   */
  private getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
    for (const [plan, id] of Object.entries(this.planPriceIds)) {
      if (id === priceId) {
        return plan as SubscriptionPlan;
      }
    }
    return null;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Create a checkout session for a user
   */
  async createCheckoutSession(
    userId: string,
    plan: SubscriptionPlan,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let customerId = user.subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await this.createCustomer({
          email: user.email,
          name: user.name || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
      }

      const priceId = this.planPriceIds[plan];
      
      if (!priceId) {
        throw new BadRequestException(`No price configured for plan: ${plan}`);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          plan,
        },
      });

      return session;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create checkout session: ${message}`, stack);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Get Stripe portal session for customer management
   */
  async createPortalSession(userId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        throw new NotFoundException('No Stripe customer found');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create portal session: ${message}`, stack);
      throw new BadRequestException('Failed to create portal session');
    }
  }
}
