-- ==============================================================================
-- DEVSTUDIO — PHASE 1 FOUNDATION MIGRATION
-- Tables: profiles, devstudio_ids, memberships
-- Security: RLS with Clerk JWT auth, is_staff() helper, @mite.ac.in constraint
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null unique check (email ~* '^[A-Za-z0-9._%+-]+@mite\.ac\.in$' or email = 'devilknight2534@gmail.com'),
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'organizer', 'member')),
  membership_status text not null default 'pending' check (membership_status in ('pending', 'active', 'alumni', 'suspended', 'inactive', 'rejected', 'revoked')),
  academic_year int check (academic_year between 2000 and 2100),
  branch text,
  usn text,
  bio text,
  avatar_type text not null default 'default' check (avatar_type in ('photo', 'devstudio_avatar', 'default')),
  avatar_url text,
  photo_moderation_status text not null default 'approved' check (photo_moderation_status in ('pending', 'approved', 'rejected')),
  pending_photo_url text,
  photo_rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for profiles
create index if not exists idx_profiles_clerk_user_id on public.profiles(clerk_user_id);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_membership_status on public.profiles(membership_status);

-- 3. DEVSTUDIO IDS TABLE
create table if not exists public.devstudio_ids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  devstudio_id text not null unique,
  sequence_year int not null,
  sequence_number int not null,
  assigned_at timestamptz not null default now(),
  constraint uq_devstudio_seq unique (sequence_year, sequence_number)
);

create index if not exists idx_devstudio_ids_devstudio_id on public.devstudio_ids(devstudio_id);
create index if not exists idx_devstudio_ids_user_id on public.devstudio_ids(user_id);

-- 4. MEMBERSHIPS AUDIT LOG TABLE
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'alumni', 'suspended', 'inactive', 'rejected', 'revoked')),
  changed_by uuid references public.profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_user_id on public.memberships(user_id);
create index if not exists idx_memberships_created_at on public.memberships(created_at desc);

-- 5. ATOMIC ID GENERATION FUNCTION
create or replace function public.assign_devstudio_id(p_user_id uuid)
returns text language plpgsql security definer as $$
declare
  yr text := to_char(now(), 'YY');
  seq_name text := 'devstudio_seq_' || yr;
  next_num int;
  new_id text;
begin
  if not exists (select 1 from pg_sequences where sequencename = seq_name) then
    execute format('create sequence %I start 1', seq_name);
  end if;
  execute format('select nextval(%L)', seq_name) into next_num;
  new_id := 'DS' || yr || '-' || lpad(next_num::text, 4, '0');
  insert into public.devstudio_ids (user_id, devstudio_id, sequence_year, sequence_number)
  values (p_user_id, new_id, yr::int, next_num);
  return new_id;
end;
$$;

-- 6. SECURITY HELPER FUNCTIONS
create or replace function public.auth_clerk_id()
returns text language sql stable as $$
  select nullif(auth.jwt()->>'sub', '');
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where clerk_user_id = public.auth_clerk_id()
    and role in ('admin', 'organizer')
    and membership_status in ('active', 'alumni')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where clerk_user_id = public.auth_clerk_id()
    and role = 'admin'
    and membership_status in ('active', 'alumni')
  );
$$;

create or replace function public.is_active_member()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where clerk_user_id = public.auth_clerk_id()
    and membership_status = 'active'
  );
$$;

-- 7. ENABLE ROW-LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.devstudio_ids enable row level security;
alter table public.memberships enable row level security;

-- 8. RLS POLICIES: PROFILES
-- Any authenticated user can read active profiles (directory view)
create policy "Active profiles visible to authenticated users"
  on public.profiles for select
  using (
    membership_status in ('active', 'alumni')
    or clerk_user_id = public.auth_clerk_id()
    or public.is_staff()
  );

-- Self can update non-privileged profile fields
create policy "Users can update own basic profile"
  on public.profiles for update
  using (clerk_user_id = public.auth_clerk_id())
  with check (
    clerk_user_id = public.auth_clerk_id()
    -- Cannot self-escalate role or membership_status
    and role = (select p.role from public.profiles p where p.clerk_user_id = public.auth_clerk_id())
    and membership_status = (select p.membership_status from public.profiles p where p.clerk_user_id = public.auth_clerk_id())
  );

-- Dev Director can update any profile (role, status, moderation)
create policy "Dev Director full update on profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Dev Director can delete profile
create policy "Dev Director can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- Webhook / Service Role / Self-insertion upon clerk sign-up
create policy "Users can insert own profile on signup"
  on public.profiles for insert
  with check (
    clerk_user_id = public.auth_clerk_id()
    and role = 'member'
    and membership_status = 'pending'
  );

-- 9. RLS POLICIES: DEVSTUDIO_IDS
create policy "DevStudio IDs visible to authenticated"
  on public.devstudio_ids for select
  using (true);

-- Insert/Update restricted to security definer / admin
create policy "Dev Director can manage devstudio_ids"
  on public.devstudio_ids for all
  using (public.is_admin())
  with check (public.is_admin());

-- 10. RLS POLICIES: MEMBERSHIPS
create policy "Memberships viewable by self or staff"
  on public.memberships for select
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

create policy "Staff can insert membership audit entries"
  on public.memberships for insert
  with check (public.is_staff());

create policy "Dev Director can manage membership entries"
  on public.memberships for all
  using (public.is_admin())
  with check (public.is_admin());
