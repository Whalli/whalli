# Subscription ID User Extension - Implementation Guide

## Overview

This update extends the Better-Auth User model to include a `subscriptionId` field, creating a direct reference from users to their subscriptions. This improves query performance and simplifies access to subscription data.

## Schema Changes

### User Model Update

**Before:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  subscription   Subscription?
  // ... other relations
}
```

**After:**
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  avatar         String?
  role           String   @default("user")
  subscriptionId String?  @unique  // ✅ NEW FIELD
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  subscription   Subscription?
  // ... other relations
}
```

### Key Changes:
- Added `subscriptionId` field to User model
- Field is optional (`String?`) to support users without subscriptions
- Field is unique (`@unique`) to maintain 1:1 relationship
- Bi-directional relationship maintained with Subscription model

## Migration Steps

### 1. Update Schema

The schema has been updated in `/apps/api/prisma/schema.prisma`:

```bash
# Generate Prisma Client
cd apps/api
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_user_subscription_id
```

### 2. Migration SQL

The migration will add the new column:

```sql
-- Add subscriptionId column to users table
ALTER TABLE "users" ADD COLUMN "subscriptionId" TEXT;

-- Add unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_subscriptionId_key" 
  UNIQUE ("subscriptionId");

-- Optional: Backfill existing data
UPDATE "users" u
SET "subscriptionId" = s.id
FROM "subscriptions" s
WHERE u.id = s."userId";
```

## BillingService Updates

### 1. CreateSubscription Method

**Updated to set subscriptionId on user:**

```typescript
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

// ✅ NEW: Update user with subscriptionId
await this.prisma.user.update({
  where: { id: dto.userId },
  data: { subscriptionId: subscription.id },
});
```

### 2. Webhook Handlers Updated

#### subscription.created
```typescript
private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const updatedSubscription = await this.prisma.subscription.upsert({
    where: { userId },
    create: { /* ... */ },
    update: { /* ... */ },
  });

  // ✅ Update user with subscriptionId
  await this.prisma.user.update({
    where: { id: userId },
    data: { subscriptionId: updatedSubscription.id },
  });
}
```

#### subscription.updated
```typescript
private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const existing = await this.prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true }, // ✅ Include user
  });

  // Update subscription...

  // ✅ Ensure user.subscriptionId is set
  if (!existing.user.subscriptionId) {
    await this.prisma.user.update({
      where: { id: existing.userId },
      data: { subscriptionId: existing.id },
    });
  }
}
```

#### subscription.deleted
```typescript
private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const existing = await this.prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (existing) {
    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: { status: 'canceled' },
    });

    // ✅ Keep subscriptionId for historical records
    // Optionally set to null if needed:
    // await this.prisma.user.update({
    //   where: { id: existing.userId },
    //   data: { subscriptionId: null },
    // });
  }
}
```

#### invoice.payment_succeeded
```typescript
private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const existing = await this.prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (existing) {
    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: { status: 'active' },
    });

    // ✅ Ensure user.subscriptionId is set
    await this.prisma.user.update({
      where: { id: existing.userId },
      data: { subscriptionId: existing.id },
    });
  }
}
```

#### invoice.payment_failed
```typescript
private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const existing = await this.prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (existing) {
    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: { status: 'past_due' },
    });

    // ✅ User keeps subscriptionId even if payment failed
  }
}
```

## Benefits

### 1. Improved Query Performance
**Before:**
```typescript
// Required join to get subscription
const user = await prisma.user.findUnique({
  where: { id },
  include: { subscription: true },
});
```

**After:**
```typescript
// Direct access to subscription ID
const user = await prisma.user.findUnique({
  where: { id },
});
// user.subscriptionId is immediately available

// Or get full subscription when needed
const subscription = await prisma.subscription.findUnique({
  where: { id: user.subscriptionId },
});
```

### 2. Simplified Middleware/Guards
```typescript
// Check if user has active subscription
@Injectable()
export class SubscriptionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Quick check without database query
    if (!user.subscriptionId) {
      throw new UnauthorizedException('Subscription required');
    }

    // Optional: Verify subscription is active
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: user.subscriptionId },
    });

    return subscription?.status === 'active';
  }
}
```

### 3. Better Analytics
```typescript
// Count users with subscriptions
const subscribedUsers = await prisma.user.count({
  where: { subscriptionId: { not: null } },
});

// Get users without subscriptions (for marketing)
const freeUsers = await prisma.user.findMany({
  where: { subscriptionId: null },
  select: { email: true, name: true },
});
```

## Usage Examples

### 1. Check User Subscription Status
```typescript
async checkUserSubscription(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscriptionId: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          trialEndsAt: true,
        },
      },
    },
  });

  return {
    hasSubscription: !!user?.subscriptionId,
    subscriptionId: user?.subscriptionId,
    plan: user?.subscription?.plan,
    status: user?.subscription?.status,
    inTrial: user?.subscription?.trialEndsAt 
      ? new Date() < user.subscription.trialEndsAt 
      : false,
  };
}
```

### 2. Get Users by Subscription Plan
```typescript
async getUsersByPlan(plan: SubscriptionPlan) {
  return this.prisma.user.findMany({
    where: {
      subscriptionId: { not: null },
      subscription: { plan },
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
}
```

### 3. Authorization Decorator
```typescript
// Create a custom decorator for subscription checks
export const RequireSubscription = (
  ...plans: SubscriptionPlan[]
) => SetMetadata('required_plans', plans);

// Usage in controller
@RequireSubscription(SubscriptionPlan.PRO, SubscriptionPlan.ENTERPRISE)
@Get('premium-feature')
async getPremiumFeature(@CurrentUser() user: User) {
  // User is guaranteed to have PRO or ENTERPRISE subscription
}
```

## Testing

### Unit Tests

```typescript
describe('BillingService - subscriptionId', () => {
  it('should set subscriptionId on user when creating subscription', async () => {
    const userId = 'test-user-id';
    
    await billingService.createSubscription({
      userId,
      plan: SubscriptionPlan.PRO,
      trialPeriodDays: 14,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(user.subscriptionId).toBeDefined();
  });

  it('should update subscriptionId on webhook', async () => {
    const event = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
          metadata: { userId: 'user_123', plan: 'PRO' },
        },
      },
    };

    await billingService.handleWebhook(event as Stripe.Event);

    const user = await prisma.user.findUnique({
      where: { id: 'user_123' },
    });

    expect(user.subscriptionId).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
describe('Subscription Flow', () => {
  it('should maintain subscriptionId throughout lifecycle', async () => {
    // Create user
    const user = await createTestUser();
    expect(user.subscriptionId).toBeNull();

    // Create subscription
    const subscription = await billingService.createSubscription({
      userId: user.id,
      plan: SubscriptionPlan.PRO,
    });

    // Verify subscriptionId is set
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(updatedUser.subscriptionId).toBe(subscription.id);

    // Update subscription
    await billingService.updateSubscriptionPlan(
      user.id,
      SubscriptionPlan.ENTERPRISE,
    );

    // Verify subscriptionId unchanged
    const afterUpdate = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(afterUpdate.subscriptionId).toBe(subscription.id);

    // Cancel subscription
    await billingService.cancelSubscription(user.id);

    // Verify subscriptionId still present (historical)
    const afterCancel = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(afterCancel.subscriptionId).toBe(subscription.id);
  });
});
```

## Backwards Compatibility

### Data Migration

For existing databases with users and subscriptions:

```typescript
// Migration script
async function backfillSubscriptionIds() {
  const users = await prisma.user.findMany({
    where: {
      subscriptionId: null,
      subscription: { isNot: null },
    },
    include: { subscription: true },
  });

  for (const user of users) {
    if (user.subscription) {
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionId: user.subscription.id },
      });
    }
  }

  console.log(`Backfilled ${users.length} subscription IDs`);
}
```

## Troubleshooting

### Issue: subscriptionId not set after webhook

**Solution:** Ensure webhook handler is receiving userId in metadata:

```typescript
// When creating Stripe subscription
const stripeSubscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  metadata: {
    userId: user.id,  // ✅ Required
    plan: dto.plan,
  },
});
```

### Issue: Duplicate key error on subscriptionId

**Solution:** Check if user already has a subscription:

```typescript
const existingUser = await prisma.user.findUnique({
  where: { id: userId },
  include: { subscription: true },
});

if (existingUser.subscription) {
  throw new BadRequestException('User already has a subscription');
}
```

## Summary

### Files Modified:
- ✅ `apps/api/prisma/schema.prisma` - Added subscriptionId to User model
- ✅ `apps/api/src/billing/billing.service.ts` - Updated 6 methods to maintain subscriptionId

### Database Changes:
- ✅ New column: `users.subscriptionId` (TEXT, UNIQUE, NULLABLE)
- ✅ Maintains 1:1 relationship with subscriptions

### Benefits:
- 🚀 Improved query performance
- 🔍 Easier subscription checks
- 📊 Better analytics capabilities
- 🛡️ Simplified authorization logic

### Next Steps:
1. Run migration: `npx prisma migrate dev --name add_user_subscription_id`
2. Backfill existing data if needed
3. Update any existing code that queries subscriptions
4. Add tests for new functionality
5. Deploy to production

**Implementation Status:** ✅ Complete and ready for migration!
