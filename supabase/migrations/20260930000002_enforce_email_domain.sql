-- ==============================================================================
-- DEVSTUDIO — BLOCK NON-INSTITUTIONAL EMAILS 
-- Adds database-level is_email_allowed() function, triggers, and RLS checks.
-- ==============================================================================

-- 1. Single source of truth for allowed emails
CREATE OR REPLACE FUNCTION public.is_email_allowed(email text, email_verified boolean default true)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean_email text;
  at_pos int;
BEGIN
  IF email IS NULL OR email = '' OR email_verified = false THEN
    RETURN false;
  END IF;

  clean_email := lower(trim(email));

  IF clean_email = 'devilknight2534@gmail.com' THEN
    RETURN true;
  END IF;

  at_pos := position('@' in clean_email);
  IF at_pos > 1 AND right(clean_email, 11) = '@mite.ac.in' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 2. Block signup at the auth layer
CREATE OR REPLACE FUNCTION public.check_institutional_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_verified boolean := coalesce((NEW.raw_user_meta_data->>'email_verified')::boolean, coalesce((NEW.raw_user_meta_data->>'email_verified')::boolean, true));
BEGIN
  IF NOT public.is_email_allowed(NEW.email, is_verified) THEN
    RAISE EXCEPTION 'email_domain_not_allowed';
  END IF;
  RETURN NEW;
END;
$$;

-- Note: tr_check_institutional_email is already BEFORE INSERT on auth.users from previous migration.
-- We ensure the automatic profile provisioning trigger only happens if this passed.
-- (Because BEFORE triggers run before AFTER triggers, this will safely abort before provisioning).

-- 3. Block existing sessions and API access
CREATE OR REPLACE FUNCTION public.is_allowed_session()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_email_allowed(auth.jwt() ->> 'email', true);
$$;

-- Update the existing helper functions to check for allowed session
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND public.is_allowed_session()
    AND role IN ('admin', 'organizer')
    AND membership_status IN ('active', 'alumni')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND public.is_allowed_session()
    AND role = 'admin'
    AND membership_status IN ('active', 'alumni')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND public.is_allowed_session()
    AND membership_status = 'active'
  );
$$;

-- Force the profile select policy to check allowed session so dead accounts can't read profiles
DROP POLICY IF EXISTS "Active profiles visible to authenticated users" ON public.profiles;
CREATE POLICY "Active profiles visible to authenticated users"
  ON public.profiles FOR SELECT
  USING (
    public.is_allowed_session() AND (
      membership_status IN ('active', 'alumni')
      OR id = auth.uid()
      OR public.is_staff()
    )
  );

-- Remove leftover applications/profiles that somehow bypassed this previously
DELETE FROM auth.users 
WHERE public.is_email_allowed(email, true) = false;
