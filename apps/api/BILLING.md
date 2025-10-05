# Billing Service Documentation

Complete implementation of billing and subscription management with Stripe integration for the Whalli API.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Webhook Integration](#webhook-integration)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Production Checklist](#production-checklist)

## 🎯 Overview

The BillingService provides comprehensive subscription management with Stripe integration, supporting three subscription tiers (BASIC, PRO, ENTERPRISE) with features including:

- Customer creation and management
- Subscription lifecycle management
- Webhook event handling
- Stripe Checkout integration
- Billing portal access
- Trial period support

## ✨ Features

### Customer Management
- ✅ Create Stripe customers automatically
- ✅ Link customers to user accounts
- ✅ Store customer IDs in PostgreSQL

### Subscription Management
- ✅ Create subscriptions with trial periods
- ✅ Update subscription plans (with proration)
- ✅ Cancel subscriptions
- ✅ Get subscription status
- ✅ Support for BASIC, PRO, ENTERPRISE plans

### Stripe Integration
- ✅ Checkout session creation
- ✅ Billing portal session creation
- ✅ Webhook event handling
- ✅ Automatic status synchronization

### Webhook Events Handled
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

## 🏗️ Architecture

```
┌─────────────────┐
│   Client App    │
│  (Next.js Web)  │
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼────────────────────────────────┐
│          NestJS API Server              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    BillingController             │  │
│  │  - POST /billing/subscriptions   │  │
│  │  - GET  /billing/subscriptions/me│  │
│  │  - PATCH /billing/subscriptions  │  │
│  │  - POST /billing/checkout        │  │
│  │  - POST /billing/webhooks/stripe │  │
│  └───────────┬──────────────────────┘  │
│              │                          │
│  ┌───────────▼──────────────────────┐  │
│  │      BillingService              │  │
│  │  - createCustomer()              │  │
│  │  - createSubscription()          │  │
│  │  - updateSubscriptionPlan()      │  │
│  │  - handleWebhook()               │  │
│  └───────────┬──────────────────────┘  │
│              │                          │
│  ┌───────────▼──────────────────────┐  │
│  │      PrismaService               │  │
│  │  - User model                    │  │
│  │  - Subscription model            │  │
│  └───────────┬──────────────────────┘  │
└──────────────┼──────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
     ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Stripe  │ │PostgreSQL│ │  Redis  │
│   API   │ │    DB   │ │ (Cache) │
└─────────┘ └─────────┘ └─────────┘
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd apps/api
pnpm add stripe
pnpm add -D @types/stripe
```

### 2. Configure Environment Variables

Add to `apps/api/.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_BASIC_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

### 3. Get Stripe Credentials

1. Sign up at https://stripe.com
2. Get your API keys from Dashboard → Developers → API keys
3. Create products and prices in Dashboard → Products
4. Copy Price IDs for each plan

### 4. Set Up Webhook Endpoint

1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.com/billing/webhooks/stripe`
3. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Database Schema

The Subscription model is already defined in your Prisma schema:

```prisma
model Subscription {
  id                   String           @id @default(cuid())
  userId               String           @unique
  stripeCustomerId     String?          @unique
  stripeSubscriptionId String?          @unique
  plan                 SubscriptionPlan @default(BASIC)
  status               String
  trialEndsAt          DateTime?
  createdAt            DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum SubscriptionPlan {
  BASIC
  PRO
  ENTERPRISE
}
```

### 6. Test the Setup

```bash
# Start the API server
pnpm --filter=@whalli/api start:dev

# Test with curl
curl http://localhost:3001/billing/plans
```

## 📡 API Endpoints

### Create Subscription

```http
POST /api/billing/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "PRO",
  "trialPeriodDays": 14
}
```

**Response:**
```json
{
  "id": "cm_123456",
  "userId": "user_123",
  "plan": "PRO",
  "status": "trialing",
  "stripeCustomerId": "cus_123",
  "stripeSubscriptionId": "sub_123",
  "trialEndsAt": "2025-10-16T00:00:00.000Z",
  "createdAt": "2025-10-02T00:00:00.000Z"
}
```

### Get Current User's Subscription

```http
GET /api/billing/subscriptions/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "hasSubscription": true,
  "subscription": {
    "id": "cm_123456",
    "userId": "user_123",
    "plan": "PRO",
    "status": "active",
    "stripeCustomerId": "cus_123",
    "stripeSubscriptionId": "sub_123",
    "trialEndsAt": null,
    "createdAt": "2025-10-02T00:00:00.000Z"
  }
}
```

### Update Subscription Plan

```http
PATCH /api/billing/subscriptions/plan
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "ENTERPRISE"
}
```

### Cancel Subscription

```http
DELETE /api/billing/subscriptions
Authorization: Bearer {token}
```

### Create Checkout Session

```http
POST /api/billing/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "PRO",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

### Create Billing Portal Session

```http
POST /api/billing/portal
Authorization: Bearer {token}
Content-Type: application/json

{
  "returnUrl": "https://yourapp.com/settings"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/xxxxx"
}
```

### Get Available Plans

```http
GET /api/billing/plans
```

**Response:**
```json
{
  "plans": [
    {
      "id": "BASIC",
      "name": "Basic",
      "description": "Perfect for individuals and small teams",
      "price": "$9/month",
      "features": [
        "5 projects",
        "10 GB storage",
        "Basic support"
      ]
    },
    {
      "id": "PRO",
      "name": "Pro",
      "description": "For growing teams and businesses",
      "price": "$29/month",
      "features": [
        "Unlimited projects",
        "100 GB storage",
        "Priority support"
      ]
    },
    {
      "id": "ENTERPRISE",
      "name": "Enterprise",
      "description": "For large organizations",
      "price": "Contact us",
      "features": [
        "Everything in Pro",
        "Unlimited storage",
        "24/7 dedicated support"
      ]
    }
  ]
}
```

### Stripe Webhook Endpoint

```http
POST /api/billing/webhooks/stripe
stripe-signature: t=1234567890,v1=xxxxx
Content-Type: application/json

{
  "id": "evt_xxxxx",
  "type": "customer.subscription.updated",
  "data": { ... }
}
```

## 🔔 Webhook Integration

### Local Testing with Stripe CLI

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3001/billing/webhooks/stripe
```

4. Copy the webhook signing secret and add to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

5. Trigger test events:
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Production Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourapp.com/billing/webhooks/stripe`
3. Select events
4. Copy signing secret
5. Update production environment variable

## 💻 Usage Examples

### Frontend Integration (React/Next.js)

#### Subscribe to a Plan

```typescript
async function subscribeToPlan(plan: 'BASIC' | 'PRO' | 'ENTERPRISE') {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      plan,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/pricing`,
    }),
  });

  const { url } = await response.json();
  
  // Redirect to Stripe Checkout
  window.location.href = url;
}
```

#### Get Current Subscription

```typescript
async function getCurrentSubscription() {
  const response = await fetch('/api/billing/subscriptions/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (data.hasSubscription) {
    console.log('Current plan:', data.subscription.plan);
    console.log('Status:', data.subscription.status);
  }
}
```

#### Open Billing Portal

```typescript
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
  
  // Redirect to Stripe Billing Portal
  window.location.href = url;
}
```

#### Cancel Subscription

```typescript
async function cancelSubscription() {
  const response = await fetch('/api/billing/subscriptions', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log('Subscription canceled:', data);
}
```

### Pricing Page Component

```tsx
'use client';

import { useState } from 'react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: string) => {
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
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Basic Plan */}
      <div className="border rounded-lg p-6">
        <h3 className="text-2xl font-bold">Basic</h3>
        <p className="text-gray-600">$9/month</p>
        <button
          onClick={() => handleSubscribe('BASIC')}
          disabled={loading}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
        >
          Subscribe
        </button>
      </div>

      {/* Pro Plan */}
      <div className="border rounded-lg p-6 border-blue-500">
        <h3 className="text-2xl font-bold">Pro</h3>
        <p className="text-gray-600">$29/month</p>
        <button
          onClick={() => handleSubscribe('PRO')}
          disabled={loading}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
        >
          Subscribe
        </button>
      </div>

      {/* Enterprise Plan */}
      <div className="border rounded-lg p-6">
        <h3 className="text-2xl font-bold">Enterprise</h3>
        <p className="text-gray-600">Contact us</p>
        <button
          onClick={() => handleSubscribe('ENTERPRISE')}
          disabled={loading}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
        >
          Contact Sales
        </button>
      </div>
    </div>
  );
}
```

## 🧪 Testing

### Manual Testing

1. **Create a subscription:**
```bash
curl -X POST http://localhost:3001/billing/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PRO",
    "trialPeriodDays": 14
  }'
```

2. **Get subscription:**
```bash
curl http://localhost:3001/billing/subscriptions/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Test webhook locally:**
```bash
stripe trigger customer.subscription.updated
```

### Unit Tests (Example)

```typescript
import { Test } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should create a subscription', async () => {
    const result = await service.createSubscription({
      userId: 'user_123',
      plan: 'PRO',
      trialPeriodDays: 14,
    });

    expect(result.plan).toBe('PRO');
    expect(result.status).toBe('trialing');
  });
});
```

## ✅ Production Checklist

### Before Going Live

- [ ] Set up production Stripe account
- [ ] Create production products and prices
- [ ] Configure production webhook endpoint
- [ ] Update environment variables with production keys
- [ ] Test webhook delivery in production
- [ ] Set up monitoring and alerts
- [ ] Configure Stripe tax settings
- [ ] Set up Stripe billing emails
- [ ] Test subscription lifecycle end-to-end
- [ ] Implement proper error handling
- [ ] Add logging and monitoring
- [ ] Set up backup payment methods
- [ ] Configure retry logic for failed payments
- [ ] Add customer email notifications
- [ ] Test edge cases (expired cards, etc.)
- [ ] Set up Stripe Radar for fraud prevention

### Security Considerations

- [ ] Webhook signature verification enabled
- [ ] API keys stored in environment variables
- [ ] Rate limiting on webhook endpoint
- [ ] HTTPS only in production
- [ ] Proper authentication on all endpoints
- [ ] Input validation on all DTOs
- [ ] Error messages don't leak sensitive data
- [ ] Database queries parameterized
- [ ] Audit logging enabled

### Monitoring

- [ ] Track subscription creation rate
- [ ] Monitor failed payments
- [ ] Alert on webhook delivery failures
- [ ] Track churn rate
- [ ] Monitor trial conversion rate
- [ ] Set up Stripe Dashboard monitoring
- [ ] Configure email alerts for critical events
- [ ] Track revenue metrics

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Testing Stripe](https://stripe.com/docs/testing)

## 🐛 Troubleshooting

### Webhook not receiving events

1. Check webhook endpoint is publicly accessible
2. Verify webhook signing secret is correct
3. Check Stripe Dashboard → Webhooks for delivery logs
4. Ensure events are selected in webhook configuration

### Subscription not created

1. Check Stripe API keys are correct
2. Verify price IDs are valid
3. Check user exists in database
4. Review application logs for errors

### Payment failed

1. Check card is valid (use test cards in development)
2. Verify customer has valid payment method
3. Check Stripe Dashboard for decline reason
4. Review webhook events for payment failure

## 📝 License

MIT
