-- Run in Supabase SQL Editor

alter table profiles
  add column if not exists is_exempt boolean default false, -- permanent free (you + wife)
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text default 'trial', -- 'trial', 'active', 'expired'
  add column if not exists subscription_code text, -- Paystack subscription code
  add column if not exists paystack_customer_code text,
  add column if not exists subscribed_at timestamptz;

-- Set trial_ends_at for existing users (7 days from now)
update profiles
set trial_ends_at = now() + interval '7 days'
where trial_ends_at is null;

-- Subscription events log
create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  event_type text not null, -- 'trial_started', 'subscription_created', 'charge_success', 'subscription_cancelled'
  paystack_event jsonb,
  created_at timestamptz default now()
);

alter table subscription_events enable row level security;
create policy "Users can view own events" on subscription_events for select using (auth.uid() = user_id);

-- Add archived flag to jobs table
alter table jobs add column if not exists is_archived boolean default false;
create index if not exists idx_jobs_archived on jobs(is_archived);
