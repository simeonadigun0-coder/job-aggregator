-- Run this in Supabase SQL Editor

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  resume_text text, -- extracted plain text from resume PDF
  resume_filename text,
  resume_uploaded_at timestamptz,
  preferred_countries text[] default array['Nigeria','United Kingdom','United States','Denmark','Germany','Remote'],
  preferred_job_types text[] default array['remote','hybrid'],
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Jobs table (shared pool, fetched daily)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null, -- dedupe key from source API
  source text not null, -- 'remotive', 'wwr', 'jsearch', 'themuse', 'adzuna'
  title text not null,
  company text,
  location text,
  country text,
  job_type text, -- 'remote', 'hybrid', 'onsite'
  description text,
  apply_url text,
  salary_text text,
  posted_at timestamptz,
  fetched_at timestamptz default now(),
  raw_data jsonb
);

create index idx_jobs_posted_at on jobs(posted_at desc);
create index idx_jobs_job_type on jobs(job_type);
create index idx_jobs_country on jobs(country);
create index idx_jobs_external_id on jobs(external_id);

alter table jobs enable row level security;

create policy "Anyone authenticated can read jobs"
  on jobs for select using (auth.role() = 'authenticated');

-- Job matches (per-user scoring against their resume)
create table job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  match_score int not null, -- 0-100
  match_reason text,
  is_strong_match boolean default false,
  status text default 'new', -- 'new', 'viewed', 'applied', 'dismissed'
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

create index idx_job_matches_user on job_matches(user_id, match_score desc);

alter table job_matches enable row level security;

create policy "Users can view own matches"
  on job_matches for select using (auth.uid() = user_id);

create policy "Users can update own matches"
  on job_matches for update using (auth.uid() = user_id);

-- Service role will insert matches via cron job (bypasses RLS automatically)
