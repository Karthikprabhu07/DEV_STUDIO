-- Migration: 20260917000010_allow_director_email.sql
-- Explicitly allow devilknight2534@gmail.com as authorized Dev Director alongside @mite.ac.in institutional emails.

-- 1. INSTITUTIONAL & DIRECTOR EMAIL VALIDATION TRIGGER
create or replace function public.check_institutional_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_email text := lower(trim(new.email));
begin
  -- Strictly enforce @mite.ac.in institutional domain, with explicit Dev Director allowed
  if clean_email !~* '^[a-z0-9._%+-]+@mite\.ac\.in$' and clean_email != 'devilknight2534@gmail.com' then
    raise exception 'DevStudio requires an authorized institutional email ending with @mite.ac.in or authorized Dev Director credentials.';
  end if;

  return new;
end;
$$;

-- 2. PROFILE PROVISIONING TRIGGER (AUTOMATIC DEV DIRECTOR PRIVILEGES)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_email text := lower(trim(new.email));
  user_full_name text;
  is_director boolean := (clean_email = 'devilknight2534@gmail.com');
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    case when is_director then 'Dev Director' else split_part(clean_email, '@', 1) end
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
    case when is_director then 'admin' else 'member' end,
    case when is_director then 'active' else 'pending' end,
    'default',
    'approved',
    case when is_director then 'DS26-0001' else null end,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case when clean_email = 'devilknight2534@gmail.com' then 'admin' else profiles.role end,
    membership_status = case when clean_email = 'devilknight2534@gmail.com' then 'active' else profiles.membership_status end,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

-- Refresh triggers on auth.users
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
