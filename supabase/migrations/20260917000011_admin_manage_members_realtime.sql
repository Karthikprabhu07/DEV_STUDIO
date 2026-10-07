-- Migration: 20260917000011_admin_manage_members_realtime.sql
-- Goal: Allow Admins to insert, update, and delete profiles, and enable real-time replication for profiles.

-- 1. Realtime Publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
exception when others then
  null;
end $$;

-- 2. Allow Admins to insert profiles directly
drop policy if exists "Admins can insert any profile" on public.profiles;
create policy "Admins can insert any profile"
  on public.profiles for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Allow Admins to delete any profile
drop policy if exists "Admins can delete any profile" on public.profiles;
create policy "Admins can delete any profile"
  on public.profiles for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
