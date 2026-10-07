-- ==============================================================================
-- DEVSTUDIO — FIX: LINK AUTH_USER_ID AND UPDATE RLS POLICIES
-- Adds a stable auth_user_id to decoupling from the PK id, linking returning Google users.
-- ==============================================================================

BEGIN;

-- 1. Add auth_user_id to profiles to stably link to auth.users without breaking foreign keys
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

-- Backfill auth_user_id matching on exact email
UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE lower(p.email) = lower(u.email) AND p.auth_user_id IS NULL;

-- 2. Update handle_new_user to link existing profiles by email and correctly populate auth_user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  clean_email text := lower(trim(NEW.email));
  is_director boolean := clean_email = 'devilknight2534@gmail.com' OR clean_email = 'director@mite.ac.in';
  user_full_name text;
BEGIN
  user_full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN is_director THEN 'Dev Director' ELSE split_part(clean_email, '@', 1) END
  );

  -- Try to link to an existing profile by email first
  UPDATE public.profiles
  SET auth_user_id = NEW.id,
      updated_at = now()
  WHERE lower(email) = clean_email;

  -- If no profile exists, create a new one
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id,
      auth_user_id,
      email,
      full_name,
      role,
      membership_status,
      avatar_type,
      photo_moderation_status,
      devstudio_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.id, -- We can use new.id for both id and auth_user_id on fresh inserts
      NEW.id,
      clean_email,
      user_full_name,
      CASE WHEN is_director THEN 'admin' ELSE 'member' END,
      CASE WHEN is_director THEN 'active' ELSE 'pending' END,
      'default',
      'approved',
      CASE WHEN is_director THEN 'DS26-0001' ELSE null END,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Update RLS helper functions to use auth_user_id with email fallback, using fixed search_path
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles
    WHERE (auth_user_id = auth.uid() OR id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
    AND public.is_allowed_session()
    AND role IN ('admin', 'organizer')
    AND membership_status IN ('active', 'alumni')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles
    WHERE (auth_user_id = auth.uid() OR id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
    AND public.is_allowed_session()
    AND role = 'admin'
    AND membership_status IN ('active', 'alumni')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles
    WHERE (auth_user_id = auth.uid() OR id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
    AND public.is_allowed_session()
    AND membership_status = 'active'
  );
$$;

-- 4. Update audit logs policy to allow staff to insert
DROP POLICY IF EXISTS "Staff can insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_staff());

COMMIT;
