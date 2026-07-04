-- Run this in Supabase SQL Editor
-- Ensures all columns exist for all users regardless of when they signed up

alter table profiles
  add column if not exists resume_text text,
  add column if not exists resume_filename text,
  add column if not exists resume_uploaded_at timestamptz,
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text,
  add column if not exists signature_image_url text,
  add column if not exists cover_letter_template text,
  add column if not exists gmail_address text,
  add column if not exists gmail_app_password text,
  add column if not exists auto_apply_enabled boolean default false,
  add column if not exists is_exempt boolean default false,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text default 'trial',
  add column if not exists subscription_code text,
  add column if not exists paystack_customer_code text,
  add column if not exists subscribed_at timestamptz;

-- Set trial for any users missing it
update profiles
set trial_ends_at = now() + interval '7 days'
where trial_ends_at is null;

-- Ensure jobs table has is_archived column
alter table jobs
  add column if not exists is_archived boolean default false;

create index if not exists idx_jobs_archived on jobs(is_archived);
create index if not exists idx_jobs_fetched_at on jobs(fetched_at desc);
