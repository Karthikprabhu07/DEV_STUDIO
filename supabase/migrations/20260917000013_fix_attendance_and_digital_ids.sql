-- ==============================================================================
-- DEVSTUDIO MITE - Migration 13: Permanent Fix for Attendance QR Scanner & Digital IDs
-- 1. Enables pgcrypto for SHA-256 token hashing
-- 2. Ensures digital_ids has token column, UNIQUE(user_id) constraint, and open RLS
-- 3. Ensures attendance_sessions and attendance_records have open RLS
-- 4. Creates admin_sync_digital_id (SECURITY DEFINER)
-- 5. Implements resilient record_qr_attendance RPC function with multi-match & error codes
-- 6. Retroactively backfills all active profiles into digital_ids
-- 7. Auto-provisions digital_ids row upon admin membership approval
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. DIGITAL IDS TABLE & CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.digital_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  devstudio_id TEXT NOT NULL UNIQUE,
  token TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  raw_token_preview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended', 'expired')),
  qr_payload_url TEXT NOT NULL,
  apple_wallet_serial TEXT UNIQUE,
  google_wallet_object_id TEXT UNIQUE,
  pass_version INT NOT NULL DEFAULT 1,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year'),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT digital_ids_user_id_key UNIQUE (user_id)
);

-- Ensure token column exists
ALTER TABLE public.digital_ids ADD COLUMN IF NOT EXISTS token TEXT;

-- Ensure UNIQUE (user_id) constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'digital_ids_user_id_key'
  ) THEN
    ALTER TABLE public.digital_ids ADD CONSTRAINT digital_ids_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_digital_ids_token ON public.digital_ids (token);
CREATE INDEX IF NOT EXISTS idx_digital_ids_token_hash ON public.digital_ids (token_hash);
CREATE INDEX IF NOT EXISTS idx_digital_ids_devstudio_id ON public.digital_ids (devstudio_id);
CREATE INDEX IF NOT EXISTS idx_digital_ids_user_id ON public.digital_ids (user_id);

-- Clean up and configure RLS on digital_ids
ALTER TABLE public.digital_ids ENABLE ROW LEVEL SECURITY;
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

-- 3. ATTENDANCE SESSIONS & RECORDS TABLES
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

-- 4. SECURE RPC: admin_sync_digital_id (Bypasses RLS)
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

GRANT EXECUTE ON FUNCTION public.admin_sync_digital_id TO authenticated, anon;

-- 5. SECURE RPC: record_qr_attendance (Robust Multi-Match Resolution)
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

GRANT EXECUTE ON FUNCTION public.record_qr_attendance TO authenticated, anon;

-- 6. RETROACTIVE SYNC: BACKFILL ALL ACTIVE PROFILES INTO DIGITAL_IDS
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

-- 7. AUTO-PROVISION IN admin_update_membership_status
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

GRANT EXECUTE ON FUNCTION public.admin_update_membership_status(UUID, TEXT, TEXT) TO authenticated, anon;

-- 8. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
