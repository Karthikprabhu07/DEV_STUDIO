-- ==============================================================================
-- DEVSTUDIO — PHASE 2 MIGRATION
-- Tables: audit_logs
-- Schema Updates: photo moderation triggers and helper functions
-- ==============================================================================

-- 1. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  before_value jsonb,
  after_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_target on public.audit_logs(target_type, target_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- 2. ENABLE RLS
alter table public.audit_logs enable row level security;

-- 3. RLS POLICIES FOR AUDIT_LOGS
-- Dev Director can read all audit logs. Dev Mates have zero read permissions.
create policy "Dev Directors can read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

-- Insert allowed via service role or staff actions
create policy "Staff can insert audit logs"
  on public.audit_logs for insert
  with check (public.is_staff() or public.auth_clerk_id() is not null);

-- Hard deny on updates and deletes (audit logs are immutable)
-- No UPDATE or DELETE policy defined = hard deny by default in Postgres RLS
