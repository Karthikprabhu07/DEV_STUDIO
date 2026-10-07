-- ==============================================================================
-- DEVSTUDIO — MIGRATION: REPLACE CLERK WITH NATIVE SUPABASE AUTH
-- 1. Server-Side Domain Enforcement Trigger on auth.users (BEFORE INSERT)
-- 2. Automated Profile Provisioning Trigger on auth.users (AFTER INSERT)
-- 3. Security Helper Functions rewritten to use auth.uid()
-- 4. Table-by-table RLS policies updated to auth.uid()
-- ==============================================================================

-- 1. SERVER-SIDE DOMAIN ENFORCEMENT TRIGGER (BEFORE INSERT ON auth.users)
-- Rejects any signup whose email does not end with @mite.ac.in (with designated owner exception)
create or replace function public.check_institutional_email()
returns trigger
language plpgsql
security definer
as $$
declare
  clean_email text := lower(trim(new.email));
begin
  -- Platform owner / director exception
  if clean_email = 'devilknight2534@gmail.com' or clean_email = 'director@mite.ac.in' then
    return new;
  end if;

  -- Strictly enforce @mite.ac.in institutional domain
  if clean_email !~* '^[a-z0-9._%+-]+@mite\.ac\.in$' then
    raise exception 'Please use your MITE institutional email ending with @mite.ac.in.';
  end if;

  return new;
end;
$$;

drop trigger if exists tr_check_institutional_email on auth.users;

create trigger tr_check_institutional_email
before insert on auth.users
for each row
execute function public.check_institutional_email();


-- 2. AUTOMATIC PROFILE PROVISIONING TRIGGER (AFTER INSERT ON auth.users)
-- Automatically inserts profiles row with membership_status = 'pending' keyed on auth.users.id
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  clean_email text := lower(trim(new.email));
  is_director boolean := clean_email = 'devilknight2534@gmail.com' or clean_email = 'director@mite.ac.in';
  user_full_name text;
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    case when is_director then 'Platform Director' else split_part(clean_email, '@', 1) end
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
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- 3. PROFILES SCHEMA ADJUSTMENT
-- Ensure profiles table exists and links cleanly to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
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
  updated_at timestamptz not null default now(),
  devstudio_id text
);

-- Make clerk_user_id nullable or drop if existing
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'clerk_user_id') then
    alter table public.profiles alter column clerk_user_id drop not null;
  end if;
end $$;


-- 4. SECURITY HELPER FUNCTIONS (REPLACING clerk_user_id WITH auth.uid())
create or replace function public.is_staff()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'organizer')
    and membership_status in ('active', 'alumni')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
    and membership_status in ('active', 'alumni')
  );
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and membership_status = 'active'
  );
$$;

-- Drop obsolete auth_clerk_id helper if it exists
drop function if exists public.auth_clerk_id();


-- 5. TABLE-BY-TABLE RLS POLICIES OVERHAUL

-- PROFILES
alter table public.profiles enable row level security;
drop policy if exists "Active profiles visible to authenticated users" on public.profiles;
drop policy if exists "Users can update own basic profile" on public.profiles;
drop policy if exists "Dev Director full update on profiles" on public.profiles;
drop policy if exists "Dev Director can delete profiles" on public.profiles;
drop policy if exists "Users can insert own profile on signup" on public.profiles;

create policy "Active profiles visible to authenticated users"
  on public.profiles for select
  using (
    membership_status in ('active', 'alumni')
    or id = auth.uid()
    or public.is_staff()
  );

create policy "Users can update own basic profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and membership_status = (select p.membership_status from public.profiles p where p.id = auth.uid())
  );

create policy "Dev Director full update on profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Dev Director can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

create policy "Users can insert own profile on signup"
  on public.profiles for insert
  with check (
    id = auth.uid()
    and role = 'member'
    and membership_status = 'pending'
  );


-- MEMBERSHIPS
alter table public.memberships enable row level security;
drop policy if exists "Memberships viewable by self or staff" on public.memberships;
drop policy if exists "Staff can insert membership audit entries" on public.memberships;
drop policy if exists "Dev Director can manage membership entries" on public.memberships;

create policy "Memberships viewable by self or staff"
  on public.memberships for select
  using (
    user_id = auth.uid()
    or public.is_staff()
  );

create policy "Staff can insert membership audit entries"
  on public.memberships for insert
  with check (public.is_staff());

create policy "Dev Director can manage membership entries"
  on public.memberships for all
  using (public.is_admin())
  with check (public.is_admin());


-- AUDIT LOGS
alter table public.audit_logs enable row level security;
drop policy if exists "Dev Directors can read audit logs" on public.audit_logs;
drop policy if exists "Staff can insert audit logs" on public.audit_logs;

create policy "Dev Directors can read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "Staff can insert audit logs"
  on public.audit_logs for insert
  with check (public.is_staff() or auth.uid() is not null);


-- EVENT REGISTRATIONS
alter table public.event_registrations enable row level security;
drop policy if exists "Members view own registrations; staff view all" on public.event_registrations;
drop policy if exists "Active members register self" on public.event_registrations;
drop policy if exists "Members cancel own registration" on public.event_registrations;

create policy "Members view own registrations; staff view all"
  on public.event_registrations for select
  using (
    user_id = auth.uid()
    or public.is_staff()
  );

create policy "Active members register self"
  on public.event_registrations for insert
  with check (
    public.is_active_member()
    and user_id = auth.uid()
  );

create policy "Members cancel own registration"
  on public.event_registrations for delete
  using (
    user_id = auth.uid()
    or public.is_staff()
  );


-- ATTENDANCE RECORDS
alter table public.attendance_records enable row level security;
drop policy if exists "Members view only own attendance record" on public.attendance_records;
drop policy if exists "Staff manage attendance records" on public.attendance_records;

create policy "Members view only own attendance record"
  on public.attendance_records for select
  using (
    user_id = auth.uid()
    or public.is_staff()
  );

create policy "Staff manage attendance records"
  on public.attendance_records for all
  using (public.is_staff())
  with check (public.is_staff());


-- PROJECTS
alter table public.projects enable row level security;
drop policy if exists "Active members can create projects" on public.projects;
drop policy if exists "Project creators and staff can update projects" on public.projects;

create policy "Active members can create projects"
  on public.projects for insert
  to authenticated
  with check (public.is_active_member());

create policy "Project creators and staff can update projects"
  on public.projects for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id
      and pm.user_id = auth.uid()
      and pm.role = 'lead'
    )
  );


-- PROJECT MEMBERS
alter table public.project_members enable row level security;
drop policy if exists "Active members can join or project leads can add members" on public.project_members;
drop policy if exists "Members can leave or leads can remove members" on public.project_members;

create policy "Active members can join or project leads can add members"
  on public.project_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role = 'lead'
    )
  );

create policy "Members can leave or leads can remove members"
  on public.project_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role = 'lead'
    )
  );


-- PROJECT TASKS
alter table public.project_tasks enable row level security;
drop policy if exists "Project members and staff can create tasks" on public.project_tasks;
drop policy if exists "Project members and staff can update tasks" on public.project_tasks;
drop policy if exists "Task creator, project lead, or staff can delete tasks" on public.project_tasks;

create policy "Project members and staff can create tasks"
  on public.project_tasks for insert
  to authenticated
  with check (
    public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Project members and staff can update tasks"
  on public.project_tasks for update
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
      and project_members.user_id = auth.uid()
    )
  );

create policy "Task creator, project lead, or staff can delete tasks"
  on public.project_tasks for delete
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
      and project_members.user_id = auth.uid()
      and project_members.role = 'lead'
    )
  );


-- CHALLENGE SUBMISSIONS
alter table public.challenge_submissions enable row level security;
drop policy if exists "Active members can create submissions" on public.challenge_submissions;
drop policy if exists "Submitters can update before judging; staff can score/grade" on public.challenge_submissions;

create policy "Active members can create submissions"
  on public.challenge_submissions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_active_member()
  );

create policy "Submitters can update before judging; staff can score/grade"
  on public.challenge_submissions for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
  );


-- NOTIFICATIONS
alter table public.notifications enable row level security;
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can mark their own notifications read" on public.notifications;

create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid());


-- CERTIFICATES
alter table public.certificates enable row level security;
drop policy if exists "Members can view own certificates or staff view all" on public.certificates;

create policy "Members can view own certificates or staff view all"
  on public.certificates for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
  );


-- GITHUB ACCOUNTS & STATS
alter table public.github_accounts enable row level security;
drop policy if exists "Users can manage their own github link" on public.github_accounts;

create policy "Users can manage their own github link"
  on public.github_accounts for all
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
  )
  with check (
    user_id = auth.uid()
    or public.is_staff()
  );

alter table public.github_stats enable row level security;
drop policy if exists "Users and staff can update github stats" on public.github_stats;

create policy "Users and staff can update github stats"
  on public.github_stats for all
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
  )
  with check (
    user_id = auth.uid()
    or public.is_staff()
  );
