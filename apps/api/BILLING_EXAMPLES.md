# Billing Service - Quick Start Guide

## Example Usage Scenarios

### 1. User Signs Up and Creates a Subscription

```typescript
// Step 1: User signs up (handled by Better-Auth)
// Step 2: Create subscription with trial period

POST /api/billing/subscriptions
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "plan": "PRO",
  "trialPeriodDays": 14
}

// Response:
{
  "id": "sub_clxxx123",
  "userId": "user_123",
  "plan": "PRO",
  "status": "trialing",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "trialEndsAt": "2025-10-16T00:00:00.000Z",
  "createdAt": "2025-10-02T00:00:00.000Z"
}
```

### 2. User Wants to Subscribe via Stripe Checkout

```typescript
// Frontend code
async function subscribeWithStripe(plan: 'BASIC' | 'PRO' | 'ENTERPRISE') {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      plan,
      successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/pricing`,
    }),
  });

  const { url } = await response.json();
  
  // Redirect user to Stripe Checkout
  window.location.href = url;
}

// Call it:
subscribeWithStripe('PRO');
```

### 3. User Checks Their Subscription Status

```typescript
// Frontend code
async function getSubscriptionStatus() {
  const response = await fetch('/api/billing/subscriptions/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (data.hasSubscription) {
    console.log('Plan:', data.subscription.plan);
    console.log('Status:', data.subscription.status);
    console.log('Trial ends:', data.subscription.trialEndsAt);
  } else {
    console.log('No active subscription');
  }
}
```

### 4. User Upgrades from BASIC to PRO

```typescript
POST /api/billing/subscriptions/plan
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "plan": "PRO"
}

// Stripe will automatically:
// - Prorate the charges
// - Update the subscription
// - Send webhook events
```

### 5. User Manages Billing in Stripe Portal

```typescript
// Frontend code
async function openBillingPortal() {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      returnUrl: window.location.href,
    }),
  });

  const { url } = await response.json();
  
  // Redirect to Stripe Customer Portal
  // User can update payment methods, view invoices, cancel subscription
  window.location.href = url;
}
```

### 6. Webhook Handles Subscription Updates

```typescript
// Stripe sends webhook when subscription status changes
// Your API automatically handles:

POST /api/billing/webhooks/stripe
stripe-signature: t=1234567890,v1=abc123...

{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_xxx",
      "status": "active",
      "customer": "cus_xxx",
      ...
    }
  }
}

// BillingService.handleWebhook() processes the event
// Updates subscription status in PostgreSQL
// No action needed from frontend!
```

## Complete React Component Example

```tsx
'use client';

import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: string;
  trialEndsAt: string | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscriptions/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      
      if (data.hasSubscription) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/billing/success`,
          cancelUrl: `${window.location.origin}/billing`,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {subscription ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          <div className="space-y-2">
            <p><strong>Plan:</strong> {subscription.plan}</p>
            <p><strong>Status:</strong> {subscription.status}</p>
            {subscription.trialEndsAt && (
              <p><strong>Trial Ends:</strong> {new Date(subscription.trialEndsAt).toLocaleDateString()}</p>
            )}
          </div>
          <button
            onClick={handleManageBilling}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Manage Billing
          </button>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <p className="text-yellow-800">You don't have an active subscription.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanCard
          name="Basic"
          price="$9/month"
          features={['5 projects', '10 GB storage', 'Basic support']}
          onSubscribe={() => handleUpgrade('BASIC')}
          currentPlan={subscription?.plan === 'BASIC'}
        />
        <PlanCard
          name="Pro"
          price="$29/month"
          features={['Unlimited projects', '100 GB storage', 'Priority support']}
          onSubscribe={() => handleUpgrade('PRO')}
          currentPlan={subscription?.plan === 'PRO'}
          recommended
        />
        <PlanCard
          name="Enterprise"
          price="Contact us"
          features={['Everything in Pro', 'Unlimited storage', '24/7 support']}
          onSubscribe={() => handleUpgrade('ENTERPRISE')}
          currentPlan={subscription?.plan === 'ENTERPRISE'}
        />
      </div>
    </div>
  );
}

function PlanCard({ name, price, features, onSubscribe, currentPlan, recommended }: any) {
  return (
    <div className={`border rounded-lg p-6 ${recommended ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}>
      {recommended && (
        <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Recommended</span>
      )}
      <h3 className="text-xl font-bold mt-2">{name}</h3>
      <p className="text-2xl font-bold text-blue-600 my-4">{price}</p>
      <ul className="space-y-2 mb-6">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      {currentPlan ? (
        <button disabled className="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed">
          Current Plan
        </button>
      ) : (
        <button
          onClick={onSubscribe}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Subscribe
        </button>
      )}
    </div>
  );
}
```

## Testing Locally

### 1. Set Up Stripe Test Mode

```bash
# Get test API keys from Stripe Dashboard
# Add to apps/api/.env

STRIPE_SECRET_KEY=sk_test_51xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...
STRIPE_BASIC_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

### 2. Create Products and Prices in Stripe

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Create three products:
   - Basic Plan - $9/month
   - Pro Plan - $29/month  
   - Enterprise Plan - $99/month
4. Copy each Price ID and add to .env

### 3. Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3001/billing/webhooks/stripe

# In another terminal, trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.updated
```

### 4. Test with curl

```bash
# Get auth token first (login to your app)
TOKEN="your_bearer_token_here"

# Create subscription
curl -X POST http://localhost:3001/billing/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "PRO", "trialPeriodDays": 14}'

# Get subscription
curl http://localhost:3001/billing/subscriptions/me \
  -H "Authorization: Bearer $TOKEN"

# Get available plans (public endpoint)
curl http://localhost:3001/billing/plans
```

### 5. Test Stripe Checkout Flow

1. Start your API: `pnpm --filter=@whalli/api start:dev`
2. Start your web app: `pnpm --filter=@whalli/web dev`
3. Navigate to billing/subscription page
4. Click "Subscribe" on any plan
5. Complete checkout with test card: `4242 4242 4242 4242`
6. Check webhook events in Stripe Dashboard

## Common Issues and Solutions

### Issue: "Webhook signature verification failed"

**Solution:** Make sure your `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI or Dashboard.

```bash
# For local testing with Stripe CLI
stripe listen --forward-to localhost:3001/billing/webhooks/stripe
# Copy the webhook signing secret and update .env
```

### Issue: "No price configured for plan"

**Solution:** Ensure all price IDs are set in `.env`:

```bash
STRIPE_BASIC_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

### Issue: "User already has an active subscription"

**Solution:** Check database or cancel existing subscription first:

```bash
# Cancel subscription
curl -X DELETE http://localhost:3001/billing/subscriptions \
  -H "Authorization: Bearer $TOKEN"
```

### Issue: Webhook not receiving events

**Solution:** 
1. Check endpoint is publicly accessible
2. Verify webhook is registered in Stripe Dashboard
3. Check event types are selected
4. Review webhook delivery logs in Stripe Dashboard

## Next Steps

1. **Customize Plans**: Update plan features and pricing in `billing.controller.ts`
2. **Add Email Notifications**: Implement email service for trial ending, payment failed, etc.
3. **Usage-Based Billing**: Add metered billing for API calls or storage
4. **Add Seats**: Implement per-seat pricing for team plans
5. **Coupon Support**: Add promotion codes and discounts
6. **Invoice Management**: Display invoice history to users
7. **Payment Method Management**: Allow users to update cards
8. **Tax Calculation**: Enable Stripe Tax for automatic tax calculation

## Production Deployment

Before going live:

1. Switch to production Stripe keys
2. Create production products and prices
3. Set up production webhook endpoint
4. Enable Stripe Radar for fraud prevention
5. Configure email notifications
6. Test complete subscription lifecycle
7. Set up monitoring and alerts
8. Review Stripe compliance requirements
