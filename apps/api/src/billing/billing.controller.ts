import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { BillingService, CreateSubscriptionDto } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubscriptionPlan } from '@prisma/client';
import { Request } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Create a subscription for the current user
   */
  @Post('subscriptions')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @CurrentUser() user: any,
    @Body() body: { plan: SubscriptionPlan; trialPeriodDays?: number },
  ) {
    const dto: CreateSubscriptionDto = {
      userId: user.id,
      plan: body.plan,
      trialPeriodDays: body.trialPeriodDays,
    };

    return await this.billingService.createSubscription(dto);
  }

  /**
   * Get current user's subscription
   */
  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() user: any) {
    const subscription = await this.billingService.getSubscription(user.id);
    
    if (!subscription) {
      return {
        hasSubscription: false,
        message: 'No subscription found',
      };
    }

    return {
      hasSubscription: true,
      subscription,
    };
  }

  /**
   * Get subscription by user ID (admin only)
   */
  @Get('subscriptions/:userId')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Param('userId') userId: string) {
    return await this.billingService.getSubscription(userId);
  }

  /**
   * Update subscription plan
   */
  @Patch('subscriptions/plan')
  @UseGuards(JwtAuthGuard)
  async updatePlan(
    @CurrentUser() user: any,
    @Body() body: { plan: SubscriptionPlan },
  ) {
    if (!Object.values(SubscriptionPlan).includes(body.plan)) {
      throw new BadRequestException('Invalid plan');
    }

    return await this.billingService.updateSubscriptionPlan(user.id, body.plan);
  }

  /**
   * Cancel subscription
   */
  @Delete('subscriptions')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@CurrentUser() user: any) {
    return await this.billingService.cancelSubscription(user.id);
  }

  /**
   * Create Stripe Checkout Session
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @CurrentUser() user: any,
    @Body() body: {
      plan: SubscriptionPlan;
      successUrl: string;
      cancelUrl: string;
    },
  ) {
    if (!Object.values(SubscriptionPlan).includes(body.plan)) {
      throw new BadRequestException('Invalid plan');
    }

    const session = await this.billingService.createCheckoutSession(
      user.id,
      body.plan,
      body.successUrl,
      body.cancelUrl,
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create Stripe Billing Portal Session
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(
    @CurrentUser() user: any,
    @Body() body: { returnUrl: string },
  ) {
    const session = await this.billingService.createPortalSession(
      user.id,
      body.returnUrl,
    );

    return {
      url: session.url,
    };
  }

  /**
   * Handle Stripe webhooks
   */
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body
    const rawBody = req.rawBody;
    
    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }

    // Verify and construct event
    const event = this.billingService.verifyWebhookSignature(rawBody, signature);

    // Handle event
    await this.billingService.handleWebhook(event);

    return { received: true };
  }

  /**
   * Get available plans (public endpoint)
   */
  @Get('plans')
  async getPlans() {
    return {
      plans: [
        {
          id: SubscriptionPlan.BASIC,
          name: 'Basic',
          description: 'Perfect for individuals and small teams',
          price: '$9/month',
          features: [
            '5 projects',
            '10 GB storage',
            'Basic support',
            'Email notifications',
          ],
        },
        {
          id: SubscriptionPlan.PRO,
          name: 'Pro',
          description: 'For growing teams and businesses',
          price: '$29/month',
          features: [
            'Unlimited projects',
            '100 GB storage',
            'Priority support',
            'Advanced analytics',
            'Custom integrations',
          ],
        },
        {
          id: SubscriptionPlan.ENTERPRISE,
          name: 'Enterprise',
          description: 'For large organizations',
          price: 'Contact us',
          features: [
            'Everything in Pro',
            'Unlimited storage',
            '24/7 dedicated support',
            'Custom development',
            'SLA guarantee',
            'On-premise deployment',
          ],
        },
      ],
    };
  }
}
