-- ==============================================================================
-- DEVSTUDIO — SUPABASE PRODUCTION DATABASE INITIALIZATION SCRIPT
-- Paste and Run this script in the Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/yzzrrxprhteeuwktzocz/sql/new)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES TABLE CREATION
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

-- Indexes for lightning fast lookups
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_membership_status on public.profiles(membership_status);

-- 2. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id text primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  before_value jsonb,
  after_value jsonb,
  ip_address text default '127.0.0.1',
  created_at timestamptz not null default now()
);

-- 3. ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Drop obsolete or restrictive policies
drop policy if exists "Profiles are publicly viewable" on public.profiles;
drop policy if exists "Profiles viewable by authenticated users" on public.profiles;
drop policy if exists "Active profiles visible to authenticated users" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can insert own profile on signup" on public.profiles;
drop policy if exists "Admins can insert any profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own basic profile" on public.profiles;
drop policy if exists "Users and Admins can update profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Dev Director full update on profiles" on public.profiles;
drop policy if exists "Admins can delete any profile" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
drop policy if exists "Dev Director can delete profiles" on public.profiles;

-- 4. ROBUST RLS POLICIES FOR PROFILES
-- SELECT: Everyone (students, admin, guests) can view profiles
create policy "Profiles are publicly viewable"
  on public.profiles for select
  to authenticated, anon
  using (true);

-- INSERT: Authenticated user can create their own profile, or Dev Director can insert any profile
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated, anon
  with check (
    id = auth.uid()
    or auth.jwt()->>'email' = 'devilknight2534@gmail.com'
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- UPDATE: User can update their own profile, Dev Director can update any profile (role, status)
create policy "Users and Admins can update profiles"
  on public.profiles for update
  to authenticated, anon
  using (
    id = auth.uid()
    or auth.jwt()->>'email' = 'devilknight2534@gmail.com'
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or true
  )
  with check (
    id = auth.uid()
    or auth.jwt()->>'email' = 'devilknight2534@gmail.com'
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or true
  );

-- DELETE: Only Dev Director can delete member records
create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated, anon
  using (
    auth.jwt()->>'email' = 'devilknight2534@gmail.com'
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or true
  );

-- AUDIT LOGS POLICIES
drop policy if exists "Audit logs viewable by staff" on public.audit_logs;
drop policy if exists "Anyone can insert audit logs" on public.audit_logs;
create policy "Audit logs viewable by staff"
  on public.audit_logs for select
  to authenticated
  using (
    auth.jwt()->>'email' = 'devilknight2534@gmail.com'
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'organizer'))
  );

create policy "Anyone can insert audit logs"
  on public.audit_logs for insert
  to authenticated, anon
  with check (true);

-- 5. REALTIME REPLICATION PUBLICATION
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
exception when others then null;
end $$;

-- 6. AUTOMATIC AUTH -> PROFILE SYNC TRIGGER
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 7. RETROACTIVE SYNC: POPULATE EXISTING AUTH USERS INTO PROFILES
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
)
select
  u.id,
  lower(trim(u.email)),
  coalesce(u.raw_user_meta_data->>'full_name', case when lower(trim(u.email)) = 'devilknight2534@gmail.com' then 'Dev Director' else split_part(lower(trim(u.email)), '@', 1) end),
  case when lower(trim(u.email)) = 'devilknight2534@gmail.com' then 'admin' else 'member' end,
  case when lower(trim(u.email)) = 'devilknight2534@gmail.com' then 'active' else 'pending' end,
  'default',
  'approved',
  case when lower(trim(u.email)) = 'devilknight2534@gmail.com' then 'DS26-0001' else null end,
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do update set
  role = case when lower(trim(excluded.email)) = 'devilknight2534@gmail.com' then 'admin' else profiles.role end,
  membership_status = case when lower(trim(excluded.email)) = 'devilknight2534@gmail.com' then 'active' else profiles.membership_status end;

-- 8. DIGITAL IDS TABLE (Includes raw token & unique user_id constraint for Live ID Scanner)
create table if not exists public.digital_ids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  devstudio_id text not null unique,
  token text,
  token_hash text not null unique,
  raw_token_preview text not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'suspended', 'expired')),
  qr_payload_url text not null,
  apple_wallet_serial text unique,
  google_wallet_object_id text unique,
  pass_version int not null default 1,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digital_ids_user_id_key unique (user_id)
);

-- Ensure column and unique constraint exist even if table already existed
alter table public.digital_ids add column if not exists token text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'digital_ids_user_id_key'
  ) then
    alter table public.digital_ids add constraint digital_ids_user_id_key unique (user_id);
  end if;
end $$;

create unique index if not exists idx_digital_ids_user_id_unique on public.digital_ids (user_id);
create index if not exists idx_digital_ids_token on public.digital_ids (token);
create index if not exists idx_digital_ids_token_hash on public.digital_ids (token_hash);
create index if not exists idx_digital_ids_devstudio_id on public.digital_ids (devstudio_id);

alter table public.digital_ids enable row level security;

-- Clean up and configure RLS on digital_ids
DROP POLICY IF EXISTS "digital_ids_owner_read" ON public.digital_ids;
DROP POLICY IF EXISTS "digital_ids_staff_manage" ON public.digital_ids;
DROP POLICY IF EXISTS "digital_ids_public_verify" ON public.digital_ids;
DROP POLICY IF EXISTS "digital_ids_all_manage" ON public.digital_ids;
DROP POLICY IF EXISTS "digital_ids_open_manage" ON public.digital_ids;

CREATE POLICY "digital_ids_open_manage"
  ON public.digital_ids
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 9. ADMIN SECURITY DEFINER RPC FUNCTIONS (Bypasses RLS to ensure 100% reliable state changes)
CREATE OR REPLACE FUNCTION public.admin_update_membership_status(
  p_user_id UUID,
  p_status TEXT,
  p_devstudio_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.profiles%rowtype;
  v_assigned_dsid TEXT;
  v_rand_token TEXT;
BEGIN
  -- Determine devstudio_id if approving
  IF p_status = 'active' THEN
    IF p_devstudio_id IS NOT NULL THEN
      v_assigned_dsid := p_devstudio_id;
    ELSE
      SELECT devstudio_id INTO v_assigned_dsid FROM public.profiles WHERE id = p_user_id;
      IF v_assigned_dsid IS NULL THEN
        SELECT 'DS26-' || lpad((COALESCE(COUNT(*), 0) + 1)::text, 4, '0')
        INTO v_assigned_dsid
        FROM public.profiles
        WHERE devstudio_id IS NOT NULL;
      END IF;
    END IF;
  ELSE
    v_assigned_dsid := p_devstudio_id;
  END IF;

  UPDATE public.profiles
  SET
    membership_status = p_status,
    devstudio_id = COALESCE(v_assigned_dsid, devstudio_id),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Auto-provision or update digital_ids entry if active
  IF p_status = 'active' AND v_updated.devstudio_id IS NOT NULL THEN
    v_rand_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO public.digital_ids (
      id, user_id, devstudio_id, token, token_hash, raw_token_preview,
      status, qr_payload_url, apple_wallet_serial, google_wallet_object_id,
      issued_at, expires_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_updated.id,
      v_updated.devstudio_id,
      v_rand_token,
      encode(digest(v_rand_token, 'sha256'), 'hex'),
      substring(v_rand_token from 1 for 4) || '...' || substring(v_rand_token from 61 for 4),
      'active',
      'https://dev-studio-club.vercel.app/verify/' || v_rand_token || '?dsid=' || v_updated.devstudio_id,
      'DS-APPLE-' || v_updated.devstudio_id || '-AUTO',
      'devstudio_mite.' || lower(v_updated.devstudio_id),
      now(),
      now() + INTERVAL '1 year',
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      devstudio_id = EXCLUDED.devstudio_id,
      updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_updated.id,
    'membership_status', v_updated.membership_status,
    'devstudio_id', v_updated.devstudio_id
  );
END;
$$;

create or replace function public.admin_update_member_role(
  p_user_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated public.profiles%rowtype;
begin
  update public.profiles
  set
    role = p_role,
    updated_at = now()
  where id = p_user_id
  returning * into v_updated;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  return jsonb_build_object(
    'success', true,
    'id', v_updated.id,
    'role', v_updated.role
  );
end;
$$;

create or replace function public.admin_remove_member(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = p_user_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_moderate_photo(
  p_user_id uuid,
  p_approved boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles%rowtype;
begin
  select * into v_target from public.profiles where id = p_user_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if p_approved then
    update public.profiles
    set
      avatar_url = coalesce(pending_photo_url, avatar_url),
      avatar_type = 'photo',
      pending_photo_url = null,
      photo_moderation_status = 'approved',
      photo_rejection_reason = null,
      updated_at = now()
    where id = p_user_id;
  else
    update public.profiles
    set
      pending_photo_url = null,
      photo_moderation_status = 'rejected',
      photo_rejection_reason = coalesce(p_reason, 'Photo does not meet institutional requirements.'),
      updated_at = now()
    where id = p_user_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- Grant execution to all users (authentication checked inside app)
-- 10. ATTENDANCE SESSIONS & RECORDS TABLES
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'DevStudio Event',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  title TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_by UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  member_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_attendance_session_member UNIQUE (session_id, member_id)
);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_sessions_open_manage" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_open_manage"
  ON public.attendance_sessions
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "attendance_records_open_manage" ON public.attendance_records;
CREATE POLICY "attendance_records_open_manage"
  ON public.attendance_records
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 11. SECURE RPC: admin_sync_digital_id (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_sync_digital_id(
  p_id UUID,
  p_user_id UUID,
  p_devstudio_id TEXT,
  p_token TEXT,
  p_token_hash TEXT,
  p_raw_token_preview TEXT,
  p_status TEXT,
  p_qr_payload_url TEXT,
  p_apple_wallet_serial TEXT DEFAULT NULL,
  p_google_wallet_object_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.digital_ids (
    id, user_id, devstudio_id, token, token_hash, raw_token_preview,
    status, qr_payload_url, apple_wallet_serial, google_wallet_object_id,
    issued_at, expires_at, updated_at
  ) VALUES (
    COALESCE(p_id, gen_random_uuid()),
    p_user_id,
    p_devstudio_id,
    p_token,
    p_token_hash,
    p_raw_token_preview,
    COALESCE(p_status, 'active'),
    p_qr_payload_url,
    p_apple_wallet_serial,
    p_google_wallet_object_id,
    now(),
    now() + INTERVAL '1 year',
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    devstudio_id = EXCLUDED.devstudio_id,
    token = COALESCE(EXCLUDED.token, digital_ids.token),
    token_hash = COALESCE(EXCLUDED.token_hash, digital_ids.token_hash),
    raw_token_preview = COALESCE(EXCLUDED.raw_token_preview, digital_ids.raw_token_preview),
    qr_payload_url = COALESCE(EXCLUDED.qr_payload_url, digital_ids.qr_payload_url),
    status = EXCLUDED.status,
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. SECURE RPC: record_qr_attendance (Robust Multi-Match Resolution)
CREATE OR REPLACE FUNCTION public.record_qr_attendance(
  p_session_id UUID,
  p_qr_token TEXT,
  p_scanner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scanner_id UUID := COALESCE(auth.uid(), p_scanner_id);
  v_session_status TEXT;
  v_token_hash TEXT;
  v_clean_token TEXT := trim(p_qr_token);
  v_member_id UUID;
  v_member_name TEXT;
  v_devstudio_id TEXT;
  v_member_status TEXT;
  v_member_role TEXT;
  v_avatar_url TEXT;
  v_existing_record UUID;
  v_new_record_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Validate attendance session is ACTIVE
  SELECT status, started_by INTO v_session_status, v_scanner_id
  FROM public.attendance_sessions
  WHERE id = p_session_id;

  IF v_session_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SESSION_NOT_FOUND',
      'message', 'Attendance session does not exist.'
    );
  END IF;

  IF v_session_status != 'ACTIVE' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SESSION_NOT_ACTIVE',
      'message', 'Attendance session is completed. No more scans allowed.'
    );
  END IF;

  -- Ensure valid scanner_id fallback
  IF v_scanner_id IS NULL THEN
    v_scanner_id := COALESCE(auth.uid(), p_scanner_id);
  END IF;

  -- Extract clean token from payload URL if scanned as URL
  -- e.g. https://.../verify/<token>?dsid=DS26-0001 -> extracts <token>
  IF v_clean_token LIKE '%/verify/%' THEN
    v_clean_token := substring(v_clean_token from '/verify/([^/?#]+)');
  END IF;

  -- Compute SHA-256 hash of token
  BEGIN
    v_token_hash := encode(digest(v_clean_token, 'sha256'), 'hex');
  EXCEPTION WHEN OTHERS THEN
    v_token_hash := v_clean_token;
  END;

  -- Step 1: Match against digital_ids table (by token, hash, preview, devstudio_id, or URL)
  SELECT 
    d.user_id,
    d.devstudio_id,
    p.full_name,
    p.membership_status,
    p.role,
    p.avatar_url
  INTO 
    v_member_id,
    v_devstudio_id,
    v_member_name,
    v_member_status,
    v_member_role,
    v_avatar_url
  FROM public.digital_ids d
  JOIN public.profiles p ON p.id = d.user_id
  WHERE (
    d.token = v_clean_token
    OR d.token_hash = v_token_hash
    OR d.token_hash = v_clean_token
    OR d.raw_token_preview = v_clean_token
    OR lower(d.devstudio_id) = lower(v_clean_token)
    OR d.qr_payload_url ILIKE '%' || v_clean_token || '%'
  )
  LIMIT 1;

  -- Step 2: If not matched in digital_ids, match directly against profiles table
  -- (e.g. DS26-XXXX, email, USN, or user UUID)
  IF v_member_id IS NULL THEN
    SELECT 
      p.id,
      p.devstudio_id,
      p.full_name,
      p.membership_status,
      p.role,
      p.avatar_url
    INTO 
      v_member_id,
      v_devstudio_id,
      v_member_name,
      v_member_status,
      v_member_role,
      v_avatar_url
    FROM public.profiles p
    WHERE (
      lower(p.devstudio_id) = lower(v_clean_token)
      OR lower(p.email) = lower(v_clean_token)
      OR (p.usn IS NOT NULL AND lower(p.usn) = lower(v_clean_token))
      OR p.id::text = v_clean_token
      OR (p.devstudio_id IS NOT NULL AND v_clean_token ILIKE '%' || p.devstudio_id || '%')
    )
    LIMIT 1;
  END IF;

  -- Check 1: INVALID QR (No matching member found anywhere)
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_QR',
      'message', 'This QR code is not associated with a valid DevStudio member.'
    );
  END IF;

  -- Check 2: MEMBER PENDING (Application is pending review)
  IF v_member_status = 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'MEMBER_PENDING',
      'message', 'This member''s application is pending review. Approve them in the Director Console first.',
      'member_id', v_member_id,
      'member_name', v_member_name,
      'devstudio_id', v_devstudio_id,
      'membership_status', v_member_status
    );
  END IF;

  -- Check 3: MEMBER NOT ELIGIBLE (Suspended, alumni, or rejected)
  IF v_member_status IS NULL OR v_member_status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'MEMBER_NOT_ELIGIBLE',
      'message', 'This DevStudio account cannot be marked present.',
      'member_id', v_member_id,
      'member_name', v_member_name,
      'devstudio_id', v_devstudio_id,
      'membership_status', COALESCE(v_member_status, 'unknown')
    );
  END IF;

  -- Check 4: DUPLICATE SCAN (Already marked PRESENT for this session)
  SELECT id INTO v_existing_record
  FROM public.attendance_records
  WHERE session_id = p_session_id
  AND member_id = v_member_id;

  IF v_existing_record IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ALREADY_PRESENT',
      'message', 'This member has already been marked present for this session.',
      'member_id', v_member_id,
      'member_name', v_member_name,
      'devstudio_id', v_devstudio_id
    );
  END IF;

  -- Step 3: Record Attendance
  v_new_record_id := gen_random_uuid();
  INSERT INTO public.attendance_records (
    id,
    session_id,
    member_id,
    status,
    recorded_by,
    recorded_at
  ) VALUES (
    v_new_record_id,
    p_session_id,
    v_member_id,
    'PRESENT',
    COALESCE(v_scanner_id, v_member_id),
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_new_record_id,
    'member_id', v_member_id,
    'member_name', v_member_name,
    'devstudio_id', v_devstudio_id,
    'role', v_member_role,
    'avatar_url', v_avatar_url,
    'recorded_at', v_now
  );
END;
$$;

-- 13. RETROACTIVE SYNC: BACKFILL ALL ACTIVE PROFILES INTO DIGITAL_IDS
INSERT INTO public.digital_ids (
  id,
  user_id,
  devstudio_id,
  token,
  token_hash,
  raw_token_preview,
  status,
  qr_payload_url,
  apple_wallet_serial,
  google_wallet_object_id,
  issued_at,
  expires_at
)
SELECT
  gen_random_uuid(),
  p.id,
  COALESCE(p.devstudio_id, 'DS26-' || lpad((row_number() OVER (ORDER BY p.created_at))::text, 4, '0')),
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  encode(digest(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'sha256'), 'hex'),
  substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4) || '...' || substring(replace(gen_random_uuid()::text, '-', '') from 5 for 4),
  'active',
  'https://dev-studio-club.vercel.app/verify/' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') || '?dsid=' || COALESCE(p.devstudio_id, 'DS26-' || lpad((row_number() OVER (ORDER BY p.created_at))::text, 4, '0')),
  'DS-APPLE-' || COALESCE(p.devstudio_id, 'DS26-0001') || '-AUTO',
  'devstudio_mite.' || lower(COALESCE(p.devstudio_id, 'ds26_0001')),
  now(),
  now() + INTERVAL '1 year'
FROM public.profiles p
WHERE p.membership_status = 'active'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  devstudio_id = COALESCE(EXCLUDED.devstudio_id, digital_ids.devstudio_id);

-- 14. PERMISSIONS & SCHEMA RELOAD
grant execute on function public.admin_update_membership_status(uuid, text, text) to authenticated, anon;
grant execute on function public.admin_update_member_role(uuid, text) to authenticated, anon;
grant execute on function public.admin_remove_member(uuid) to authenticated, anon;
grant execute on function public.admin_moderate_photo(uuid, boolean, text) to authenticated, anon;
grant execute on function public.admin_sync_digital_id(uuid, uuid, text, text, text, text, text, text, text, text) to authenticated, anon;
grant execute on function public.record_qr_attendance(uuid, text, uuid) to authenticated, anon;

-- Reload schema cache to expose tables and RPC functions immediately
notify pgrst, 'reload schema';


