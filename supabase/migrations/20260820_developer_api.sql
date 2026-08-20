-- Orbit Developer API
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

-- ============================================================
-- 1. API keys
-- Authenticates merchant applications against the Orbit API.
--   publishable keys: read plans/products (pricing table component)
--   secret keys:      everything else (checkout, customers, subscriptions)
-- ============================================================

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  key text not null unique,
  type text not null check (type in ('publishable', 'secret')),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_organisation_id_idx on public.api_keys (organisation_id);
create index if not exists api_keys_key_idx on public.api_keys (key);

-- Row level security: only the owning organisation's members can see
-- and manage their keys through the dashboard.
alter table public.api_keys enable row level security;

create policy "Org members can manage their API keys"
  on public.api_keys
  for all
  using (
    organisation_id in (
      select id from public.organisations where user_id = auth.uid()
    )
  )
  with check (
    organisation_id in (
      select id from public.organisations where user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Webhook endpoints
-- Where Orbit delivers subscription / payment events.
-- Each endpoint has its own HMAC-SHA256 signing secret.
-- ============================================================

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists webhook_endpoints_organisation_id_idx
  on public.webhook_endpoints (organisation_id);

alter table public.webhook_endpoints enable row level security;

create policy "Org members can manage their webhook endpoints"
  on public.webhook_endpoints
  for all
  using (
    organisation_id in (
      select id from public.organisations where user_id = auth.uid()
    )
  )
  with check (
    organisation_id in (
      select id from public.organisations where user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. Outgoing event log
-- Every event Orbit delivers to a merchant endpoint.
-- ============================================================

create table if not exists public.outgoing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  endpoint_id uuid references public.webhook_endpoints (id) on delete set null,
  event_type text not null,
  event_id text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  response_status integer,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists outgoing_webhook_events_organisation_id_idx
  on public.outgoing_webhook_events (organisation_id);

create index if not exists outgoing_webhook_events_event_id_idx
  on public.outgoing_webhook_events (event_id);

alter table public.outgoing_webhook_events enable row level security;

create policy "Org members can read their outgoing webhook events"
  on public.outgoing_webhook_events
  for select
  using (
    organisation_id in (
      select id from public.organisations where user_id = auth.uid()
    )
  );