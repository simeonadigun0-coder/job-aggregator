-- Run in Supabase SQL Editor

create table if not exists saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

create index if not exists idx_saved_jobs_user on saved_jobs(user_id, created_at desc);
alter table saved_jobs enable row level security;
create policy "Users manage own saved jobs" on saved_jobs for all using (auth.uid() = user_id);
