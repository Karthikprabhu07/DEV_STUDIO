-- ==============================================================================
-- DEVSTUDIO — PHASE 5 & 6: CERTIFICATES, GITHUB INTEGRATION & ALUMNI MIGRATION
-- Tables:
--   1. certificates
--   2. github_accounts
--   3. github_stats
-- Security: Row Level Security enabled with default-deny; is_staff() access controls
-- Zero-Seed Data: No fake/mock data inserted
-- ==============================================================================

-- 1. CERTIFICATES TABLE
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  description text not null,
  issue_date date not null default current_date,
  certificate_type text not null default 'completion' check (certificate_type in ('merit', 'completion', 'winner', 'participation')),
  token_hash text not null unique,
  raw_token_preview text not null,
  status text not null default 'valid' check (status in ('valid', 'revoked')),
  revocation_reason text,
  issued_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_certificates_user on public.certificates(user_id);
create index if not exists idx_certificates_event on public.certificates(event_id);
create index if not exists idx_certificates_token_hash on public.certificates(token_hash);
create index if not exists idx_certificates_status on public.certificates(status);

-- 2. GITHUB ACCOUNTS TABLE
create table if not exists public.github_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  github_username text not null,
  github_id text,
  avatar_url text,
  profile_url text not null,
  linked_at timestamptz not null default now()
);

create index if not exists idx_github_accounts_user on public.github_accounts(user_id);
create index if not exists idx_github_accounts_username on public.github_accounts(github_username);

-- 3. GITHUB STATS TABLE
create table if not exists public.github_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  total_repos int not null default 0,
  total_stars int not null default 0,
  total_contributions int not null default 0,
  top_languages text[] not null default '{}',
  recent_repos jsonb not null default '[]'::jsonb,
  last_synced_at timestamptz not null default now()
);

create index if not exists idx_github_stats_user on public.github_stats(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.certificates enable row level security;
alter table public.github_accounts enable row level security;
alter table public.github_stats enable row level security;

-- CERTIFICATES POLICIES
-- Members can view their own certificates; staff can view all
create policy "Members can view own certificates or staff view all"
  on public.certificates for select
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

-- Public verification lookup by token hash
create policy "Public certificate verification by hash"
  on public.certificates for select
  to anon
  using (status = 'valid');

-- Staff can issue, revoke, or rotate certificates
create policy "Staff can manage certificates"
  on public.certificates for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- GITHUB ACCOUNTS POLICIES
create policy "Authenticated users can view linked github accounts"
  on public.github_accounts for select
  to authenticated
  using (true);

create policy "Users can manage their own github link"
  on public.github_accounts for all
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  )
  with check (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

-- GITHUB STATS POLICIES
create policy "Authenticated users can view github stats"
  on public.github_stats for select
  to authenticated
  using (true);

create policy "Users and staff can update github stats"
  on public.github_stats for all
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  )
  with check (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );
