-- ==============================================================================
-- DEVSTUDIO — PHASE 3 MIGRATION
-- Tables: events, event_registrations, attendance_sessions, attendance_records
-- Constraints: uq_attendance_event_user (prevents duplicate attendance rows)
-- Security: RLS scoped strictly so members cannot modify or read other's attendance
-- ==============================================================================

-- 1. EVENTS TABLE
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  cover_image_url text,
  location text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'registration_open', 'registration_closed', 'completed', 'archived')),
  capacity int check (capacity is null or capacity > 0),
  team_size_min int not null default 1 check (team_size_min >= 1),
  team_size_max int not null default 1 check (team_size_max >= team_size_min),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_start_time on public.events(start_time);
create index if not exists idx_events_slug on public.events(slug);

-- 2. EVENT REGISTRATIONS TABLE
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_name text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'waitlisted')),
  registered_at timestamptz not null default now(),
  constraint uq_event_user_reg unique (event_id, user_id)
);

create index if not exists idx_event_reg_event on public.event_registrations(event_id);
create index if not exists idx_event_reg_user on public.event_registrations(user_id);

-- 3. ATTENDANCE SESSIONS TABLE
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  total_eligible int not null default 0,
  total_present int not null default 0,
  total_absent int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attendance_sessions_event on public.attendance_sessions(event_id);

-- 4. ATTENDANCE RECORDS TABLE
-- NON-NEGOTIABLE CONSTRAINT: uq_attendance_event_user prevents duplicate rows per member/event
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present', 'absent')),
  marked_by uuid not null references public.profiles(id),
  marked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_attendance_event_user unique (event_id, user_id)
);

create index if not exists idx_attendance_user on public.attendance_records(user_id);
create index if not exists idx_attendance_event on public.attendance_records(event_id);
create index if not exists idx_attendance_session on public.attendance_records(session_id);

-- 5. ENABLE ROW LEVEL SECURITY
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

-- 6. RLS POLICIES: EVENTS
-- Active members can view published events; staff can view drafts
create policy "Published events viewable by active members"
  on public.events for select
  using (
    status in ('published', 'registration_open', 'registration_closed', 'completed')
    or public.is_staff()
  );

create policy "Staff full access on events"
  on public.events for all
  using (public.is_staff())
  with check (public.is_staff());

-- 7. RLS POLICIES: EVENT_REGISTRATIONS
create policy "Members view own registrations; staff view all"
  on public.event_registrations for select
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

create policy "Active members register self"
  on public.event_registrations for insert
  with check (
    public.is_active_member()
    and user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
  );

create policy "Members cancel own registration"
  on public.event_registrations for delete
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

-- 8. RLS POLICIES: ATTENDANCE_SESSIONS
create policy "Staff full control on attendance sessions"
  on public.attendance_sessions for all
  using (public.is_staff())
  with check (public.is_staff());

-- 9. RLS POLICIES: ATTENDANCE_RECORDS
-- Members can ONLY view their own attendance records
create policy "Members view only own attendance record"
  on public.attendance_records for select
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

-- Hard deny on member mutations: Only staff can take or modify attendance
create policy "Staff manage attendance records"
  on public.attendance_records for all
  using (public.is_staff())
  with check (public.is_staff());
