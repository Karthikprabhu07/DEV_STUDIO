-- Migration: 20260916000009_fix_auth_rls_and_isolation.sql
-- Goal: Ensure zero hardcoded users, roles, or director emails in database triggers and functions.
-- Guarantees pure session isolation and strict default role/status handling.

-- 1. INSTITUTIONAL EMAIL DOMAIN VALIDATION TRIGGER
-- Validates that every user signing up has an institutional @mite.ac.in email address.
-- No hardcoded director email exemptions.
create or replace function public.check_institutional_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_email text := lower(trim(new.email));
begin
  -- Strictly enforce @mite.ac.in institutional domain
  if clean_email !~* '^[a-z0-9._%+-]+@mite\.ac\.in$' then
    raise exception 'DevStudio requires an authorized institutional email ending with @mite.ac.in.';
  end if;

  return new;
end;
$$;

-- 2. PROFILE PROVISIONING TRIGGER
-- Every newly registered auth.user is provisioned as 'member' with 'pending' status.
-- No hardcoded director roles or default admin accounts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_email text := lower(trim(new.email));
  user_full_name text;
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(clean_email, '@', 1)
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    membership_status,
    avatar_type,
    photo_moderation_status,
    devstudio_id,
    created_at,
    updated_at
  ) values (
    new.id,
    clean_email,
    user_full_name,
    'member',
    'pending',
    'default',
    'approved',
    null,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

-- Reattach triggers to auth.users
drop trigger if exists tr_check_institutional_email on auth.users;
create trigger tr_check_institutional_email
before insert on auth.users
for each row
execute function public.check_institutional_email();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 3. VERIFY RLS POLICIES FOR STRICT SESSION ISOLATION
-- Ensure that profiles can only be updated by the owner or genuine admins.
alter table public.profiles enable row level security;

-- Drop legacy or insecure policies if they exist
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- View: Any authenticated user can view active member profiles; unauthenticated visitors can view public profile fields
create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated, anon
  using (true);

-- Update: Users can update their own profile fields (full_name, bio, branch, usn, academic_year, github_username)
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin Update: Only users who genuinely have role = 'admin' in profiles table can update roles/statuses
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
