-- Orbit Payouts & Settlement Schema
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  gross_amount numeric not null,
  fee_amount numeric not null, -- 5% Orbit platform fee retained in Orbit master account
  net_amount numeric not null,   -- 95% transferred to merchant bank account
  currency text not null default 'NGN',
  status text not null default 'success' check (status in ('pending', 'processing', 'success', 'failed')),
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  recipient_code text,
  transfer_code text,
  reference text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists payouts_organisation_id_idx on public.payouts (organisation_id);
create index if not exists payouts_reference_idx on public.payouts (reference);

-- Enable RLS
alter table public.payouts enable row level security;

create policy "Org members can view their payouts"
  on public.payouts
  for select
  using (
    organisation_id in (
      select id from public.organisations where user_id = auth.uid()
    )
  );
