-- Allow admin to delete announcements and notifications

-- Drop the old policy that allowed staff to do everything
drop policy if exists "Staff can manage announcements" on public.announcements;

-- Re-add Staff policy for insert, update, select
create policy "Staff can insert announcements"
  on public.announcements for insert
  to authenticated
  with check (public.is_staff());

create policy "Staff can update announcements"
  on public.announcements for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "Staff can view announcements"
  on public.announcements for select
  to authenticated
  using (public.is_staff());

-- Note: "Announcements viewable by authenticated users" already handles public select
-- so the above 'select' is just to be comprehensive for staff.

-- Admin only for delete
create policy "Admin can delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.is_admin());

-- Allow Admin to delete notifications
create policy "Admin can delete notifications"
  on public.notifications for delete
  to authenticated
  using (public.is_admin());
