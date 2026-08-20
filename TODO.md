# TODO:

1. Implement the bank validator in onboarding (Set up payouts. Tell us where subscription payments should be settled.) with https://paystack.com/docs/identity-verification/verify-account-number/
2. Connect to paystack for initial payment and recurring payments (add to the respective tables, store the token/mandate, then auto-bill)
3. Polish the UI
4. Add toasts where necessary (user exists, incorrect password etc.)
5. Show onboarding once
6. fix dashbaord, use a real chart, simple analytics:
7. pricing table code (optional) for dev teams
8. auto-bill functionality
9. customer portal (cancel subscription, then sub stays till the existing sub paid is over)
10. trial period functionality
11. send mails (to customers when they subscribe and to the merchant/org. and when cancelled and other mails, maybe using resend?)
12. dont do the developer api part yet
13. we need to setup webhooks too as that will make verifying payments real?

here is my paystack stuff (what i have so use it in the code and define it in the env, so ill use the keys where necessary):

- Test Secret Key
- Test Public Key
- Test Callback URL (empty rn)
- Test Webhook URL (empty rn)

paystack is the fintech that will give us access to financial apis and capabilities

my supabase creds are in my env
and here is my table schema: if we need to modify anything or create more tables or columns, let me know:

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
id uuid NOT NULL,
first_name text,
last_name text,
email text UNIQUE,
avatar_url text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone,
CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.organisations (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
user_id uuid,
name text,
slug text,
logo_url text,
settlement_bank_name text,
settlement_bank_code text,
settlement_account_number text,
settlement_account_name text,
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT organisations_pkey PRIMARY KEY (id),
CONSTRAINT organisations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.products (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
organisation_id uuid NOT NULL,
name text,
slug text,
description text,
brand_color text,
is_active boolean DEFAULT true,
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT products_pkey PRIMARY KEY (id),
CONSTRAINT products_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
);
CREATE TABLE public.plans (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_at timestamp with time zone NOT NULL DEFAULT now(),
organisation_id uuid DEFAULT gen_random_uuid(),
product_id uuid DEFAULT gen_random_uuid(),
name text,
description text,
features ARRAY,
currency text DEFAULT 'NGN'::text,
amount numeric,
trial_period_days bigint DEFAULT '0'::bigint,
is_active boolean DEFAULT true,
updated_at timestamp with time zone DEFAULT now(),
billing_interval text,
slug text,
custom_interval_days integer,
billing_interval_days integer,
billing_interval_minutes integer,
CONSTRAINT plans_pkey PRIMARY KEY (id),
CONSTRAINT plans_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id),
CONSTRAINT plans_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.customers (
id uuid NOT NULL DEFAULT gen_random_uuid(),
organisation_id uuid NOT NULL,
email text NOT NULL,
first_name text,
last_name text,
phone text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
portal_token text UNIQUE,
CONSTRAINT customers_pkey PRIMARY KEY (id),
CONSTRAINT customers_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
);
CREATE TABLE public.subscriptions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
organisation_id uuid NOT NULL,
customer_id uuid NOT NULL,
product_id uuid NOT NULL,
plan_id uuid NOT NULL,
status text NOT NULL DEFAULT 'ACTIVE'::text,
card_token text,
provider text DEFAULT 'nomba'::text,
provider_customer_id text,
starts_at timestamp with time zone NOT NULL DEFAULT now(),
renews_at timestamp with time zone,
ends_at timestamp with time zone,
cancelled_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
renewal_count integer DEFAULT 0,
last_payment_at timestamp with time zone,
cancel_at_period_end boolean DEFAULT false,
failed_payment_attempts integer DEFAULT 0,
last_failed_payment_at timestamp with time zone,
CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
CONSTRAINT subscriptions_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id),
CONSTRAINT subscriptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
CONSTRAINT subscriptions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.payments (
id uuid NOT NULL DEFAULT gen_random_uuid(),
organisation_id uuid NOT NULL,
subscription_id uuid,
customer_id uuid,
amount bigint NOT NULL,
currency text NOT NULL DEFAULT 'NGN'::text,
status text NOT NULL,
provider text DEFAULT 'nomba'::text,
provider_reference text,
paid_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT payments_pkey PRIMARY KEY (id),
CONSTRAINT payments_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id),
CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id),
CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.webhook_events (
id uuid NOT NULL DEFAULT gen_random_uuid(),
provider text NOT NULL,
event_type text NOT NULL,
payload jsonb NOT NULL,
processed boolean DEFAULT false,
received_at timestamp with time zone DEFAULT now(),
request_id text,
CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_orders (
id uuid NOT NULL DEFAULT gen_random_uuid(),
order_reference text NOT NULL UNIQUE,
plan_id uuid NOT NULL,
product_id uuid NOT NULL,
customer_email text,
created_at timestamp without time zone DEFAULT now(),
status text DEFAULT 'pending'::text,
customer_first_name text,
customer_last_name text,
CONSTRAINT payment_orders_pkey PRIMARY KEY (id),
CONSTRAINT payment_orders_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id),
CONSTRAINT payment_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.customer_payment_methods (
id uuid NOT NULL DEFAULT gen_random_uuid(),
organisation_id uuid NOT NULL,
customer_id uuid NOT NULL,
provider text NOT NULL DEFAULT 'nomba'::text,
card_token text NOT NULL,
card_brand text,
card_last4 text,
card_expiry text,
is_default boolean DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT customer_payment_methods_pkey PRIMARY KEY (id),
CONSTRAINT customer_payment_methods_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
CONSTRAINT customer_payment_methods_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
);

my supabase and all env:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key

NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

BILLING_CRON_SECRET=your_billing_cron_secret_here

about the cron, maybe ignore it for now, except we need it, so give me steps on setting up, i was using cron-job.org

GOAL: have a working product that works end to end, don't mock anything

here is the idea:

### Orbit: Product Summary

Orbit is financial infrastructure for African businesses to launch and manage recurring payments and subscriptions.

A business creates an organization, adds products and pricing plans, and gets a ready-to-use checkout page. Customers subscribe and pay through Orbit, while Orbit handles the underlying payment provider, recurring billing, payment status, renewals, cancellations, and subscription state.

The business does not need to build its own billing infrastructure. Its application simply uses Orbit to know whether a customer is on Free, Pro, Premium, etc., and can give them the appropriate access.

**Core flow:**
Business → Create product → Create plans → Orbit checkout → Customer subscribes → Orbit handles billing → Business checks customer's subscription status → Customer gets the right product access.

Orbit's long-term vision is to become **subscription and payment infrastructure for African businesses**, abstracting away the complexity of different payment providers and markets.

do you need anything else?

===============

1. make settings work (use real data and use our supabase backend, if there new stuff i need to add to supabase like storage biucke and name all that, tell me, for user avatar i think?) also, how do the merchants then get the money (disbursement i think to the account they supplied?)

- also, in the auto-bill, we need to set a 1 minute demo time so we can see it, taht means we need resend to work, so i know ehen tehuyve neen biilled, ill configure cron, i already have the link format, im using outray to expose localhost and my outray url is https://passive-granite.outray.app
- is trial period working?
- make modals work (like setting to inactive and other settings - should be a modal?)
- can we disable other forms of payment since its cards that can be tokenised? or will auto billing work with transfer?
- no resend mail sent when the customer paid, i added my resend api already, check the .env, do i have to add the webhook url to resend too? but they asked this:
  Add webhook
  Endpoint URL
  https://passive-granite.outray.app/api/webhooks/paystack
  Select events to listen...

2. also, the customer should see a button in their email (every email) to go to their portal: customer portal: http://localhost:3000/portal/[customer_portal_token]

3. Next Steps for Deployment / Live Testing:

- Setup Recurring Cron Job:
  - Trigger GET https://yourdomain.com/api/cron/renew (e.g. every hour or daily at midnight via Vercel Cron, GitHub Actions, or cron-job.org) with header Authorization: Bearer <BILLING_CRON_SECRET>.

========

1. use real chart for the dashbaord and improve the dashbaord design, check dribbble for inspo
