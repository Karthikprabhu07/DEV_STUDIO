-- ==============================================================================
-- DEVSTUDIO MITE - Phase 8 Database Migration: Official Attendance QR Scanner System
-- Tables: attendance_sessions, attendance_records
-- Security: Strict RLS (DEV_CAPTAIN / DEV_DIRECTOR manage, DEV_MATE read-only own)
-- Constraints: Database-level unique constraint (session_id + member_id)
-- Atomic RPC: record_qr_attendance (validates opaque QR token -> digital ID -> profile)
-- ==============================================================================

-- 1. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_by UUID NOT NULL REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON public.attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_event ON public.attendance_sessions(event_id);

-- 2. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_attendance_session_member UNIQUE (session_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member ON public.attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES: ATTENDANCE SESSIONS
DROP POLICY IF EXISTS "Staff manage attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Members view attendance sessions" ON public.attendance_sessions;

-- Dev Captains and Dev Directors have full management access
CREATE POLICY "Staff manage attendance sessions"
  ON public.attendance_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
      AND profiles.membership_status IN ('active', 'alumni')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
      AND profiles.membership_status IN ('active', 'alumni')
    )
  );

-- Dev Mates can view session info to understand their own attendance context
CREATE POLICY "Members view attendance sessions"
  ON public.attendance_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. RLS POLICIES: ATTENDANCE RECORDS
DROP POLICY IF EXISTS "Staff manage attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Members view only own attendance record" ON public.attendance_records;

-- Dev Captains and Dev Directors can insert, update, and read all records
CREATE POLICY "Staff manage attendance records"
  ON public.attendance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
      AND profiles.membership_status IN ('active', 'alumni')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
      AND profiles.membership_status IN ('active', 'alumni')
    )
  );

-- Dev Mates can ONLY view their own records
CREATE POLICY "Members view only own attendance record"
  ON public.attendance_records
  FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- 6. SECURE SERVER-SIDE RPC: record_qr_attendance
-- Atomically validates the scanned QR token, verifies member eligibility, checks for duplicates,
-- and records PRESENT status.
CREATE OR REPLACE FUNCTION public.record_qr_attendance(
  p_session_id UUID,
  p_qr_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scanner_id UUID := auth.uid();
  v_is_staff BOOLEAN;
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
  -- Check scanner permission (Dev Captain or Dev Director only)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_scanner_id
    AND role IN ('admin', 'organizer')
    AND membership_status IN ('active', 'alumni')
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'FORBIDDEN',
      'message', 'Permission denied: Only Dev Captains and Dev Directors can record attendance.'
    );
  END IF;

  -- Validate attendance session is ACTIVE
  SELECT status INTO v_session_status
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

  -- Extract clean token from payload URL if scanned as URL (e.g. https://.../verify/<token>)
  IF v_clean_token LIKE '%/verify/%' THEN
    v_clean_token := substring(v_clean_token from '/verify/([^/?#]+)');
  END IF;

  -- Compute SHA-256 hash of token
  v_token_hash := encode(digest(v_clean_token, 'sha256'), 'hex');

  -- Resolve QR token -> Digital ID -> Profile
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
  WHERE (d.token_hash = v_token_hash OR d.raw_token_preview = v_clean_token OR d.devstudio_id = v_clean_token);

  -- If not found by digital_ids, attempt direct resolution by profiles devstudio_id
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
    WHERE p.devstudio_id = v_clean_token;
  END IF;

  -- 1. INVALID QR CHECK
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_QR',
      'message', 'This QR code is not associated with a valid DevStudio member.'
    );
  END IF;

  -- 2. INELIGIBLE MEMBER CHECK (Must be active DevStudio member)
  IF v_member_status IS NULL OR v_member_status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'MEMBER_NOT_ELIGIBLE',
      'message', 'This DevStudio account cannot be marked present.',
      'member_name', v_member_name,
      'devstudio_id', v_devstudio_id,
      'membership_status', coalesce(v_member_status, 'unknown')
    );
  END IF;

  -- 3. DUPLICATE SCAN CHECK (session_id + member_id)
  SELECT id INTO v_existing_record
  FROM public.attendance_records
  WHERE session_id = p_session_id
  AND member_id = v_member_id;

  IF v_existing_record IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ALREADY_PRESENT',
      'message', 'This member has already been marked present for this session.',
      'member_name', v_member_name,
      'devstudio_id', v_devstudio_id,
      'member_id', v_member_id,
      'avatar_url', v_avatar_url
    );
  END IF;

  -- 4. INSERT ATTENDANCE RECORD (PRESENT)
  INSERT INTO public.attendance_records (
    session_id,
    member_id,
    status,
    recorded_by,
    recorded_at,
    created_at,
    updated_at
  ) VALUES (
    p_session_id,
    v_member_id,
    'PRESENT',
    v_scanner_id,
    v_now,
    v_now,
    v_now
  )
  RETURNING id INTO v_new_record_id;

  -- Return SUCCESS payload with member details
  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_new_record_id,
    'status', 'PRESENT',
    'member_id', v_member_id,
    'member_name', v_member_name,
    'devstudio_id', v_devstudio_id,
    'role', v_member_role,
    'avatar_url', v_avatar_url,
    'recorded_at', v_now
  );
END;
$$;
