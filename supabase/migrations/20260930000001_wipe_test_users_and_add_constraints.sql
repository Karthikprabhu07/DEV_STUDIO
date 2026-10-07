-- ==============================================================================
-- DEVSTUDIO — WIPE TEST USERS & ENFORCE UNIQUE CONSTRAINTS
-- WARNING: This script deletes all test users and data except the admin.
-- ==============================================================================

BEGIN;

-- 1. Wipe all test users from auth.users 
-- (This cascades to profiles, attendance, etc. because of foreign key rules)
DELETE FROM auth.users 
WHERE lower(email) != 'devilknight2534@gmail.com';

-- 2. Add UNIQUE constraint on lowercased email in profiles
-- (Supabase default unique is case-sensitive, this prevents exact duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));

-- 3. Write-once ID rule for devstudio_id on the profiles table
-- Prevents anyone from modifying a DevStudio ID once it is assigned.
CREATE OR REPLACE FUNCTION public.prevent_devstudio_id_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.devstudio_id IS NOT NULL AND NEW.devstudio_id IS NOT NULL AND OLD.devstudio_id IS DISTINCT FROM NEW.devstudio_id THEN
    RAISE EXCEPTION 'DevStudio ID cannot be changed once assigned.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_devstudio_id_update ON public.profiles;
CREATE TRIGGER tr_prevent_devstudio_id_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_devstudio_id_update();

COMMIT;
