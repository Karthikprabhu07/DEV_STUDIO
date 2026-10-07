-- ==============================================================================
-- DEVSTUDIO — DEDUPLICATE PROFILES
-- Cleans up any duplicate rows for the admin created before unique constraints
-- ==============================================================================

BEGIN;

-- 1. Deduplicate profiles with the same email, keeping the one that matches an existing auth.users.id
-- If multiple match, keep the most recently updated one.
WITH ranked_profiles AS (
  SELECT id, email, 
         ROW_NUMBER() OVER (
           PARTITION BY lower(email) 
           ORDER BY 
             CASE WHEN EXISTS (SELECT 1 FROM auth.users u WHERE u.id = profiles.id) THEN 0 ELSE 1 END,
             updated_at DESC
         ) as rn
  FROM public.profiles
)
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);

-- 2. Try adding the unique index again (in case it failed previously due to duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));

COMMIT;
