-- ==============================================================================
-- DEVSTUDIO MITE - Phase 4 Database Migration: Digital IDs & Mobile Wallet Passes
-- ==============================================================================

-- 1. Digital IDs table
CREATE TABLE IF NOT EXISTS public.digital_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  devstudio_id TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  raw_token_preview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended', 'expired')),
  qr_payload_url TEXT NOT NULL,
  apple_wallet_serial TEXT UNIQUE,
  google_wallet_object_id TEXT UNIQUE,
  pass_version INTEGER NOT NULL DEFAULT 1,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year'),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_digital_ids_user_id ON public.digital_ids(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_ids_token_hash ON public.digital_ids(token_hash);
CREATE INDEX IF NOT EXISTS idx_digital_ids_devstudio_id ON public.digital_ids(devstudio_id);
CREATE INDEX IF NOT EXISTS idx_digital_ids_status ON public.digital_ids(status);

-- 2. Digital ID verification audit log table (tracks public QR scans)
CREATE TABLE IF NOT EXISTS public.id_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_id UUID NOT NULL REFERENCES public.digital_ids(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  verified_result TEXT NOT NULL CHECK (verified_result IN ('verified', 'revoked', 'expired', 'invalid')),
  scanner_user_agent TEXT,
  scanner_ip_anonymized TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_id_verification_logs_digital_id ON public.id_verification_logs(digital_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.digital_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verification_logs ENABLE ROW LEVEL SECURITY;

-- Digital IDs: Members can read their own ID card
CREATE POLICY "digital_ids_owner_read"
  ON public.digital_ids
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- Digital IDs: Staff can issue/modify
CREATE POLICY "digital_ids_staff_manage"
  ON public.digital_ids
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- Public verification lookup policy (read-only by token hash)
CREATE POLICY "digital_ids_public_verify"
  ON public.digital_ids
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Verification logs insertable anonymously upon QR scan
CREATE POLICY "verification_logs_anon_insert"
  ON public.id_verification_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
