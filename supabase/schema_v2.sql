-- Run this in Supabase SQL Editor (additions to existing schema)

-- Add new columns to profiles
alter table profiles
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text,
  add column if not exists signature_image_url text,
  add column if not exists cover_letter_template text,
  add column if not exists gmail_address text,
  add column if not exists gmail_app_password text,
  add column if not exists gmail_refresh_token text,
  add column if not exists auto_apply_enabled boolean default false;

-- Messages / Inbox
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null, -- 'manual_apply', 'application_sent', 'strong_match', 'system'
  title text not null,
  body text,
  action_url text,
  action_label text,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_user on messages(user_id, created_at desc);
alter table messages enable row level security;
create policy "Users can view own messages" on messages for select using (auth.uid() = user_id);
create policy "Users can update own messages" on messages for update using (auth.uid() = user_id);

-- Applications tracker
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade,
  company text not null,
  job_title text not null,
  apply_url text,
  hr_email text,
  generated_letter text,
  status text default 'draft', -- 'draft', 'reviewed', 'sent', 'manual_required'
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_applications_user on applications(user_id, created_at desc);
alter table applications enable row level security;
create policy "Users can manage own applications" on applications for all using (auth.uid() = user_id);

-- Storage bucket for signature images
insert into storage.buckets (id, name, public) values ('signatures', 'signatures', true) on conflict do nothing;
create policy "Users can upload signatures" on storage.objects for insert with check (bucket_id = 'signatures' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Signatures are public" on storage.objects for select using (bucket_id = 'signatures');
