-- ==============================================================================
-- DEVSTUDIO MITE — Fix: Add `token` column and UNIQUE constraint on `user_id`
-- to `digital_ids` table.
--
-- Root cause: `persistToSupabase` in the frontend uses
-- `supabase.from('digital_ids').upsert([...], { onConflict: 'user_id' })`,
-- which requires a UNIQUE constraint on `user_id`. Without it, the upsert
-- silently fails and Digital IDs are never persisted to the database.
-- Additionally, the raw `token` column was missing, so exact-match lookups
-- (used in the attendance QR scanner fallback) could never succeed.
-- ==============================================================================

-- 1. Create table if not yet present (in case migrations 001-004 were not yet run)
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
  pass_version INTEGER NOT NULL DEFAULT 1,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year'),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add the raw cryptographic verification token column if missing.
ALTER TABLE public.digital_ids
  ADD COLUMN IF NOT EXISTS token TEXT;

-- 3. Deduplicate any existing records with the same user_id before adding unique constraint,
-- keeping the most recently updated/created record.
DELETE FROM public.digital_ids
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.digital_ids
  ORDER BY user_id, updated_at DESC, created_at DESC
);

-- 4. Ensure UNIQUE constraint on user_id exists (required for onConflict: 'user_id' upsert).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'digital_ids_user_id_key'
  ) THEN
    ALTER TABLE public.digital_ids ADD CONSTRAINT digital_ids_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 5. Ensure UNIQUE index on user_id exists.
CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_ids_user_id_unique
  ON public.digital_ids (user_id);

-- 6. Index the new token column for fast exact-match lookups.
CREATE INDEX IF NOT EXISTS idx_digital_ids_token
  ON public.digital_ids (token);

-- 7. Ensure RLS is enabled and policies are present.
ALTER TABLE public.digital_ids ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_ids' AND policyname = 'digital_ids_owner_read'
  ) THEN
    CREATE POLICY "digital_ids_owner_read"
      ON public.digital_ids FOR SELECT TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'organizer')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_ids' AND policyname = 'digital_ids_staff_manage'
  ) THEN
    CREATE POLICY "digital_ids_staff_manage"
      ON public.digital_ids FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'organizer')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'digital_ids' AND policyname = 'digital_ids_public_verify'
  ) THEN
    CREATE POLICY "digital_ids_public_verify"
      ON public.digital_ids FOR SELECT TO anon, authenticated
      USING (status = 'active');
  END IF;
END $$;

-- 8. Reload schema cache so PostgREST exposes the new column and constraint immediately.
NOTIFY pgrst, 'reload schema';
