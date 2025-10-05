# Billing Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend Applications                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Web App        │  │   Admin Panel    │  │   Mobile App     │     │
│  │  (Next.js)       │  │  (Next.js)       │  │  (React Native)  │     │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘     │
└───────────┼────────────────────┼────────────────────────┼──────────────┘
            │                     │                        │
            │ HTTP/REST          │                        │
            └────────────────────┼────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NestJS API Server                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       BillingController                          │  │
│  │  GET  /billing/plans                                             │  │
│  │  GET  /billing/subscriptions/me                                  │  │
│  │  POST /billing/subscriptions                                     │  │
│  │  PATCH /billing/subscriptions/plan                               │  │
│  │  DELETE /billing/subscriptions                                    │  │
│  │  POST /billing/checkout                                          │  │
│  │  POST /billing/portal                                            │  │
│  │  POST /billing/webhooks/stripe                                   │  │
│  └─────────────────────────┬────────────────────────────────────────┘  │
│                             │                                            │
│  ┌─────────────────────────▼────────────────────────────────────────┐  │
│  │                      BillingService                              │  │
│  │  • createCustomer(email)                                         │  │
│  │  • createSubscription(userId, plan, trialPeriodDays)             │  │
│  │  • updateSubscriptionPlan(userId, plan)                          │  │
│  │  • cancelSubscription(userId)                                     │  │
│  │  • getSubscription(userId)                                        │  │
│  │  • handleWebhook(event)                                          │  │
│  │  • createCheckoutSession(...)                                     │  │
│  │  • createPortalSession(...)                                       │  │
│  │  • verifyWebhookSignature(...)                                    │  │
│  └─────────────────────────┬────────────────────────────────────────┘  │
│                             │                                            │
│  ┌─────────────────────────▼────────────────────────────────────────┐  │
│  │                      PrismaService                               │  │
│  │  Database ORM for PostgreSQL operations                          │  │
│  └─────────────────────────┬────────────────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐         ┌──────────┐         ┌─────────┐
    │ Stripe  │         │PostgreSQL│         │  Redis  │
    │   API   │         │    DB    │         │ (Cache) │
    │         │         │          │         │         │
    │ • Customers       │ • Users  │         │ • Sessions
    │ • Subscriptions   │ • Subscriptions    │ • Cache │
    │ • Invoices        │ • Projects│         │         │
    │ • Webhooks        │ • Tasks  │         │         │
    └─────────┘         └──────────┘         └─────────┘
```

## Data Flow Diagrams

### 1. Create Subscription Flow

```
User                Frontend           BillingController       BillingService        Stripe API        Database
 │                     │                      │                      │                   │               │
 │  Click Subscribe    │                      │                      │                   │               │
 ├────────────────────>│                      │                      │                   │               │
 │                     │  POST /subscriptions │                      │                   │               │
 │                     ├─────────────────────>│                      │                   │               │
 │                     │  (plan, trial days)  │                      │                   │               │
 │                     │                      │  createSubscription()│                   │               │
 │                     │                      ├─────────────────────>│                   │               │
 │                     │                      │                      │  Create Customer  │               │
 │                     │                      │                      ├──────────────────>│               │
 │                     │                      │                      │<──────────────────┤               │
 │                     │                      │                      │  Customer ID      │               │
 │                     │                      │                      │                   │               │
 │                     │                      │                      │  Create Subscription              │
 │                     │                      │                      ├──────────────────>│               │
 │                     │                      │                      │<──────────────────┤               │
 │                     │                      │                      │  Subscription ID  │               │
 │                     │                      │                      │                   │               │
 │                     │                      │                      │  Save to DB       │               │
 │                     │                      │                      ├──────────────────────────────────>│
 │                     │                      │                      │<──────────────────────────────────┤
 │                     │                      │<─────────────────────┤                   │               │
 │                     │<─────────────────────┤                      │                   │               │
 │<────────────────────┤                      │                      │                   │               │
 │  Subscription data  │                      │                      │                   │               │
```

### 2. Stripe Checkout Flow

```
User                Frontend           BillingController       BillingService        Stripe API        
 │                     │                      │                      │                   │
 │  Click Upgrade      │                      │                      │                   │
 ├────────────────────>│                      │                      │                   │
 │                     │  POST /checkout      │                      │                   │
 │                     ├─────────────────────>│                      │                   │
 │                     │  (plan, URLs)        │                      │                   │
 │                     │                      │  createCheckoutSession()                │
 │                     │                      ├─────────────────────>│                   │
 │                     │                      │                      │  Create Session   │
 │                     │                      │                      ├──────────────────>│
 │                     │                      │                      │<──────────────────┤
 │                     │                      │<─────────────────────┤  Session URL      │
 │                     │<─────────────────────┤                      │                   │
 │<────────────────────┤  {url}               │                      │                   │
 │                     │                      │                      │                   │
 │  Redirect to Stripe Checkout                                      │                   │
 ├───────────────────────────────────────────────────────────────────>│                   │
 │                     │                      │                      │                   │
 │  Complete Payment   │                      │                      │                   │
 ├───────────────────────────────────────────────────────────────────>│                   │
 │                     │                      │                      │  Webhook: subscription.created
 │                     │                      │                      │<──────────────────┤
 │                     │                      │                      │                   │
 │  Redirect to successUrl                    │                      │                   │
 │<────────────────────┤                      │                      │                   │
```

### 3. Webhook Processing Flow

```
Stripe              Webhook Endpoint    BillingService         Database
  │                        │                   │                   │
  │  subscription.updated  │                   │                   │
  ├───────────────────────>│                   │                   │
  │  (with signature)      │                   │                   │
  │                        │  verifySignature()│                   │
  │                        ├──────────────────>│                   │
  │                        │<──────────────────┤                   │
  │                        │  Valid ✓          │                   │
  │                        │                   │                   │
  │                        │  handleWebhook()  │                   │
  │                        ├──────────────────>│                   │
  │                        │                   │  Update Status    │
  │                        │                   ├──────────────────>│
  │                        │                   │<──────────────────┤
  │                        │<──────────────────┤                   │
  │<───────────────────────┤                   │                   │
  │  200 OK                │                   │                   │
```

## Database Schema

```
┌─────────────────────────────────────────────┐
│                   User                      │
├─────────────────────────────────────────────┤
│ id         String  @id                      │
│ email      String  @unique                  │
│ name       String?                          │
│ avatar     String?                          │
│ createdAt  DateTime                         │
│ updatedAt  DateTime                         │
└─────────────┬───────────────────────────────┘
              │
              │ 1:1
              │
┌─────────────▼───────────────────────────────┐
│              Subscription                   │
├─────────────────────────────────────────────┤
│ id                   String  @id            │
│ userId               String  @unique        │
│ stripeCustomerId     String? @unique        │
│ stripeSubscriptionId String? @unique        │
│ plan                 SubscriptionPlan       │
│ status               String                 │
│ trialEndsAt          DateTime?              │
│ createdAt            DateTime               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          SubscriptionPlan Enum              │
├─────────────────────────────────────────────┤
│ • BASIC                                     │
│ • PRO                                       │
│ • ENTERPRISE                                │
└─────────────────────────────────────────────┘
```

## Subscription State Machine

```
                    ┌──────────┐
                    │   New    │
                    │   User   │
                    └─────┬────┘
                          │
                 Create Subscription
                          │
                          ▼
              ┌────────────────────┐
              │     trialing       │◄──────┐
              │  (trial period)    │       │
              └─────┬──────────────┘       │
                    │                      │
         Trial Ends │            Trial     │
         Payment OK │           Extended   │
                    │                      │
                    ▼                      │
              ┌────────────┐               │
         ┌───►│   active   │◄──────────────┤
         │    │  (paying)  │               │
         │    └─────┬──────┘               │
         │          │                      │
    Payment│    Payment Failed         Update│
    Success│          │                  Plan │
         │          ▼                      │
         │    ┌────────────┐               │
         └────┤  past_due  │               │
              │ (payment   │               │
              │  issue)    │               │
              └─────┬──────┘               │
                    │                      │
         Too Many   │         Payment      │
         Failures   │         Received     │
                    │                      │
              ┌─────┴──────┐               │
              ▼            │               │
        ┌──────────┐       └───────────────┘
        │ canceled │
        │          │
        └──────────┘
```

## Component Dependencies

```
┌────────────────────────────────────────────────┐
│              BillingModule                     │
│                                                │
│  ┌──────────────────────────────────────┐    │
│  │       BillingController              │    │
│  │  - @UseGuards(AuthGuard)             │    │
│  │  - @CurrentUser() decorator          │    │
│  └─────────┬────────────────────────────┘    │
│            │ depends on                       │
│  ┌─────────▼────────────────────────────┐    │
│  │        BillingService                │    │
│  │  - Stripe SDK                        │    │
│  │  - PrismaService                     │    │
│  │  - ConfigService                     │    │
│  └─────────┬────────────────────────────┘    │
└────────────┼─────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌───────────┐  ┌───────────┐
│  Prisma   │  │   Auth    │
│  Module   │  │  Module   │
└───────────┘  └───────────┘
```

## Webhook Event Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Webhook Event Router                     │
└─────────────┬───────────────────────────────────────────────┘
              │
      ┌───────┴────────┬──────────┬──────────┬──────────┐
      │                │          │          │          │
      ▼                ▼          ▼          ▼          ▼
┌──────────┐   ┌──────────┐  ┌─────────┐ ┌─────────┐ ┌────────┐
│subscription   │subscription │ trial   │ │ invoice │ │ invoice│
│  .created │   │  .updated│  │will_end │ │.payment_│ │.payment│
│           │   │          │  │         │ │succeeded│ │ failed │
└─────┬─────┘   └─────┬────┘  └────┬────┘ └────┬────┘ └───┬────┘
      │               │            │           │          │
      └───────┬───────┴────────┬───┴───────────┴──────────┘
              │                │
              ▼                ▼
     ┌─────────────┐    ┌─────────────┐
     │  Update DB  │    │Send Email   │
     │ Subscription│    │Notification │
     └─────────────┘    └─────────────┘
```

## Security Layers

```
┌───────────────────────────────────────────────────────────┐
│  Request from Client                                      │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      ▼
     ┌─────────────────────────────────────────────┐
     │  Layer 1: HTTPS/TLS Encryption              │
     │  - Secure transport                         │
     └──────────────────┬──────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────┐
     │  Layer 2: Authentication                    │
     │  - AuthGuard validates session              │
     │  - Better-Auth integration                  │
     └──────────────────┬──────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────┐
     │  Layer 3: Input Validation                  │
     │  - class-validator DTOs                     │
     │  - Type checking                            │
     └──────────────────┬──────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────┐
     │  Layer 4: Authorization                     │
     │  - User can only access own subscription    │
     │  - Project membership validation            │
     └──────────────────┬──────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────┐
     │  Layer 5: Webhook Signature Verification    │
     │  - Stripe signature validation              │
     │  - Prevent replay attacks                   │
     └──────────────────┬──────────────────────────┘
                        │
                        ▼
     ┌─────────────────────────────────────────────┐
     │  Layer 6: Database Security                 │
     │  - Parameterized queries (Prisma)           │
     │  - No SQL injection                         │
     └─────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────┐
│              Request Processing                    │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   Try Block     │
        │  - Validate     │
        │  - Process      │
        │  - Respond      │
        └────┬────────┬───┘
             │        │
     Success │        │ Error
             │        │
             ▼        ▼
    ┌──────────┐  ┌──────────────────────┐
    │  Return  │  │  Catch Block         │
    │  200 OK  │  │  - Log error         │
    └──────────┘  │  - Identify type     │
                  └──────┬───────────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │  Bad     │ │  Not     │ │  Internal│
      │  Request │ │  Found   │ │  Error   │
      │  400     │ │  404     │ │  500     │
      └──────────┘ └──────────┘ └──────────┘
              │          │          │
              └──────────┼──────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Return Error    │
              │  Response        │
              │  - Message       │
              │  - Status Code   │
              └──────────────────┘
```

This architecture provides:
- 🔒 **Security**: Multi-layered authentication and validation
- 🔄 **Scalability**: Stateless design, event-driven webhooks
- 🛡️ **Reliability**: Error handling, retry logic, idempotent operations
- 📊 **Observability**: Logging at every layer
- 🚀 **Performance**: Async operations, database indexing
