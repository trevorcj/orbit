# Orbit

Orbit is a multi-tenant subscription infrastructure platform that helps businesses create products, configure pricing plans, collect recurring payments, and manage customer subscriptions through a hosted checkout and billing system powered by Nomba.

The goal of Orbit is to provide businesses with the infrastructure needed to launch subscription-based products without building their own billing engine, payment workflows, renewal systems, or customer management dashboards.

## Links

### Live Application

[https://orbit-billing-nomba.vercel.app/](https://orbit-billing-nomba.vercel.app/)

<img src="./public/preview4.png" alt="Orbit">
<img src="./public/preview5.png" alt="Orbit">
<img src="./public/preview1.png" alt="Orbit">
<img src="./public/preview11.png" alt="Orbit">

## Product Overview

Modern businesses rely on recurring revenue models, but building subscription infrastructure requires handling:

- Customer management
- Product and pricing configuration
- Payment processing
- Recurring billing
- Payment retries
- Subscription lifecycle management
- Webhooks
- Customer self-service
- Merchant analytics

Orbit solves this by providing a complete subscription management layer.

Businesses can create products, attach pricing plans, generate checkout links, collect payments, and automatically manage recurring subscriptions.

## Core Features

### 1. Multi-Tenant Merchant Dashboard

Orbit supports multiple businesses using the same platform while keeping each organisation's data isolated.

Each organisation has access to:

- Products
- Plans
- Customers
- Payments
- Subscriptions
- Analytics

Every query is scoped by:

```
organisation_id
```

This ensures merchants can only access their own billing data.

### 2. Product Management

Businesses can create and manage products.

Each product contains:

- Product name
- Description
- Brand colour
- Checkout slug
- Active/inactive status

**Example:**

```
Product
├── SaaS Starter
├── Fitness Membership
└── Premium Community Access
```

Merchants can:

- Create products
- View products
- Copy checkout links
- Delete products
- Manage pricing plans attached to products

### 3. Pricing Plans

Each product can have multiple pricing plans.

Supported billing intervals:

- Monthly
- Yearly
- Custom intervals
- Demo/test intervals

**Example:**

```
Product: Fitness Membership
Plans:
  Starter     — ₦5,000/month
  Premium     — ₦15,000/month
  Enterprise  — ₦150,000/year
```

Plans determine:

- Amount
- Billing frequency
- Renewal schedule
- Subscription behaviour

### 4. Hosted Checkout System

Orbit provides a hosted checkout page where customers can subscribe.

**Checkout flow:**

```
Customer opens checkout link
        ↓
Customer enters details
        ↓
Payment processed through Nomba
        ↓
Transaction verified
        ↓
Subscription created
        ↓
Card token stored
        ↓
Future renewals handled automatically
```

### 5. Recurring Subscription Engine

Orbit includes an automated subscription renewal system.

When a subscription reaches its renewal date:

```
Cron Job
   ↓
Find subscriptions where:
   renews_at <= current_time
   ↓
Charge saved card token
   ↓
Create payment record
   ↓
Update subscription
   ↓
Generate next renewal date
```

### 6. Subscription State Management

Subscriptions move through different states:

```
ACTIVE
PAST_DUE
CANCELED
TRIALING
```

**Example lifecycle:**

```
Customer subscribes
        ↓
     ACTIVE
        ↓
Renewal date reached
        ↓
   Payment succeeds ──► Renewal date extended
   Payment fails    ──► PAST_DUE ──► Retry payment
```

### 7. Automated Renewal Cron

Orbit uses a scheduled cron process to handle recurring payments.

**Cron location:**

```
/app/api/cron/renew-subscriptions/route.ts
```

**Purpose:**

- Check upcoming renewals
- Charge saved cards
- Update subscription status
- Record payment history

The cron runs automatically based on the configured schedule.

**Example:**

```json
{
  "schedule": "* * * * *"
}
```

### 8. Webhook Processing

Orbit receives payment events through Nomba webhooks.

**Webhook endpoint:**

```
/api/webhooks/nomba
```

**Responsibilities:**

- Receive payment events
- Validate webhook signatures
- Update payment status
- Activate subscriptions
- Handle failed payments

**Webhook security:**

Nomba signs webhook payloads using:

```
HMAC-SHA256
```

The signature is verified before processing events.

**Flow:**

```
Nomba
  ↓
Webhook Request
  ↓
Signature Verification
  ↓
Payment Update
  ↓
Subscription Update
```

### 9. Customer Management

Merchants can view all customers who have interacted with their products.

**Customer information:**

- Name
- Email
- Subscription status
- Total spending
- Join date

**Example:**

```
John Doe
john@example.com
Active subscription
₦50,000 spent
```

### 10. Payments Dashboard

Orbit provides payment tracking.

Merchants can view:

- Payment amount
- Customer
- Payment provider
- Payment status
- Transaction reference
- Payment date

**Supported statuses:**

- `SUCCESS`
- `FAILED`
- `PENDING`
- `REVERSED`

### 11. Merchant Analytics Dashboard

The dashboard provides real-time subscription insights.

**Metrics:**

- **Gross Revenue** — Total successful payments collected.
- **Monthly Recurring Revenue (MRR)** — Normalized recurring subscription revenue.

**Calculation:**

```
Monthly Plan:
  MRR = plan amount

Yearly Plan:
  MRR = yearly amount / 12
```

- **Active Subscribers** — Number of currently active subscriptions.
- **Top Products** — Ranks products based on generated revenue.

### 12. Customer Self-Service Portal

Orbit includes a customer portal where customers can manage their subscriptions.

https://orbit-billing-nomba.vercel.app/portal/{token}

Customers can:

- View subscription details
- View billing information
- Access payment history
- Manage their subscription lifecycle

**Portal flow:**

```
Customer
   ↓
Portal Link
   ↓
Authentication
   ↓
Subscription Dashboard
   ↓
Manage Billing
```

## Database Architecture

Orbit uses Supabase PostgreSQL.

**Main tables:**

- `users`
- `organisations`
- `products`
- `plans`
- `customers`
- `subscriptions`
- `payments`

**Relationship:**

```
Organisation
    └── Products
            └── Plans

Customers
    └── Subscriptions
            └── Payments
```

## Tech Stack

**Frontend**

- Next.js App Router
- React
- Tailwind CSS
- Lucide Icons

**Backend**

- Next.js Server Actions
- Next.js Route Handlers

**Database**

- Supabase PostgreSQL

**Authentication**

- Supabase Auth

**Payments**

- Nomba Payment API

**Deployment**

- Vercel / Cloud hosting

## Project Structure

```
src
├── app
│   ├── dashboard
│   │   ├── products
│   │   ├── subscriptions
│   │   ├── customers
│   │   ├── payments
│   │   └── settings
│   ├── checkout
│   ├── portal
│   └── api
│       ├── cron
│       │   └── renew-subscriptions
│       └── webhooks
│           └── nomba
│
├── components
│
├── actions
│
├── lib
│   ├── nomba.ts
│   ├── supabase
│   └── subscription-engine
│
└── types
```

## Security

Orbit implements:

- Organisation-level data isolation
- Supabase authentication
- Secure server-side database access
- Webhook signature verification
- Protected merchant routes

## Screenshots

- Dashboard
- Products
- Checkout
- Subscription Management

## Future Development Plans

### Advanced Subscription Management

Future improvements:

- Subscription pause/resume
- Upgrade and downgrade plans
- Proration calculations
- Subscription cancellation workflows

### Payment Recovery System

Implement:

- Automatic retry schedules
- Failed payment emails
- Dunning workflows
- Customer notifications

### Developer API Platform

Allow developers to integrate Orbit directly.

Features:

- 
