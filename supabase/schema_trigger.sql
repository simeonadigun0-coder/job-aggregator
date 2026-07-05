-- Run this in Supabase SQL Editor
-- This creates a profile row automatically whenever a new user signs up
-- This is the most reliable fix for missing profile rows

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    trial_ends_at,
    subscription_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now() + interval '7 days',
    'trial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if it already exists and recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Also fix any existing users who might be missing profile rows
insert into public.profiles (id, display_name, trial_ends_at, subscription_status)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  now() + interval '7 days',
  'trial'
from auth.users
on conflict (id) do nothing;
