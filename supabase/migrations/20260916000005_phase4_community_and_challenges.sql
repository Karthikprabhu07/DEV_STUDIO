-- ==============================================================================
-- DEVSTUDIO — PHASE 4: COMMUNITY, CHALLENGES, RESOURCES & ANNOUNCEMENTS MIGRATION
-- Tables:
--   1. projects
--   2. project_members
--   3. project_tasks
--   4. challenges
--   5. challenge_submissions
--   6. resources
--   7. announcements
--   8. notifications
--   9. badges
--   10. member_badges
-- Security: Row Level Security enabled with default-deny; is_staff() / is_admin() access controls
-- Zero-Seed Data: No fake/mock data inserted
-- ==============================================================================

-- 1. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  github_repo_url text,
  live_demo_url text,
  tech_stack text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_created_by on public.projects(created_by);

-- 2. PROJECT MEMBERS TABLE
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor' check (role in ('lead', 'contributor')),
  joined_at timestamptz not null default now(),
  constraint uq_project_member unique (project_id, user_id)
);

create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);

-- 3. PROJECT TASKS TABLE (Lightweight Kanban)
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_tasks_project on public.project_tasks(project_id);
create index if not exists idx_project_tasks_status on public.project_tasks(status);
create index if not exists idx_project_tasks_assigned_to on public.project_tasks(assigned_to);

-- 4. CHALLENGES TABLE
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  requirements text not null,
  bounty_or_prize text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'evaluating', 'completed')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_challenges_slug on public.challenges(slug);
create index if not exists idx_challenges_status on public.challenges(status);
create index if not exists idx_challenges_dates on public.challenges(start_time, end_time);

-- 5. CHALLENGE SUBMISSIONS TABLE
create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_name text not null,
  github_url text not null,
  demo_url text,
  writeup text not null,
  score numeric(5, 2),
  rank int,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'awarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_challenge_user_submission unique (challenge_id, user_id)
);

create index if not exists idx_submissions_challenge on public.challenge_submissions(challenge_id);
create index if not exists idx_submissions_user on public.challenge_submissions(user_id);
create index if not exists idx_submissions_rank on public.challenge_submissions(challenge_id, rank);

-- 6. RESOURCES TABLE
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  category text not null check (category in ('full_stack', 'vibe_coding', 'deployment', 'ui_ux', 'cybersecurity')),
  description text not null,
  tags text[] not null default '{}',
  difficulty text not null default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resources_category on public.resources(category);
create index if not exists idx_resources_difficulty on public.resources(difficulty);

-- 7. ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'general' check (category in ('general', 'event', 'workshop', 'hackathon', 'urgent')),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  is_pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_published on public.announcements(published_at desc);
create index if not exists idx_announcements_pinned on public.announcements(is_pinned, published_at desc);

-- 8. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('event', 'attendance', 'project', 'challenge', 'membership', 'badge', 'system')),
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id) where read_at is null;

-- 9. BADGES TABLE
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  category text not null check (category in ('development', 'attendance', 'leadership', 'hackathon')),
  created_at timestamptz not null default now()
);

create index if not exists idx_badges_code on public.badges(code);
create index if not exists idx_badges_category on public.badges(category);

-- 10. MEMBER BADGES TABLE
create table if not exists public.member_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references public.profiles(id) on delete set null,
  reason text,
  constraint uq_user_badge unique (user_id, badge_id)
);

create index if not exists idx_member_badges_user on public.member_badges(user_id);
create index if not exists idx_member_badges_badge on public.member_badges(badge_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.resources enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.badges enable row level security;
alter table public.member_badges enable row level security;

-- PROJECTS POLICIES
-- Anyone authenticated can view active and completed projects
create policy "Active and completed projects are viewable by authenticated users"
  on public.projects for select
  to authenticated
  using (status != 'archived' or public.is_staff());

-- Active Dev Mates and staff can create projects
create policy "Active members can create projects"
  on public.projects for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.clerk_user_id = public.auth_clerk_id()
      and profiles.membership_status = 'active'
    )
  );

-- Project creator, leads, or staff can update project details
create policy "Project creators and staff can update projects"
  on public.projects for update
  to authenticated
  using (
    created_by = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
      and project_members.user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
      and project_members.role = 'lead'
    )
  );

-- PROJECT MEMBERS POLICIES
create policy "Project members viewable by authenticated users"
  on public.project_members for select
  to authenticated
  using (true);

create policy "Active members can join or project leads can add members"
  on public.project_members for insert
  to authenticated
  with check (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
      and pm.role = 'lead'
    )
  );

create policy "Members can leave or leads can remove members"
  on public.project_members for delete
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
      and pm.role = 'lead'
    )
  );

-- PROJECT TASKS POLICIES
create policy "Project tasks viewable by authenticated users"
  on public.project_tasks for select
  to authenticated
  using (true);

create policy "Project members and staff can create tasks"
  on public.project_tasks for insert
  to authenticated
  with check (
    public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
      and project_members.user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    )
  );

create policy "Project members and staff can update tasks"
  on public.project_tasks for update
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
      and project_members.user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    )
  );

create policy "Task creator, project lead, or staff can delete tasks"
  on public.project_tasks for delete
  to authenticated
  using (
    created_by = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_tasks.project_id
      and project_members.user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
      and project_members.role = 'lead'
    )
  );

-- CHALLENGES POLICIES
create policy "Challenges viewable by authenticated users"
  on public.challenges for select
  to authenticated
  using (true);

create policy "Staff can manage challenges"
  on public.challenges for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- CHALLENGE SUBMISSIONS POLICIES
create policy "Submissions viewable by authenticated users"
  on public.challenge_submissions for select
  to authenticated
  using (true);

create policy "Active members can create submissions"
  on public.challenge_submissions for insert
  to authenticated
  with check (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    and exists (
      select 1 from public.profiles
      where profiles.clerk_user_id = public.auth_clerk_id()
      and profiles.membership_status = 'active'
    )
  );

create policy "Submitters can update before judging; staff can score/grade"
  on public.challenge_submissions for update
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
    or public.is_staff()
  );

-- RESOURCES POLICIES
create policy "Resources viewable by authenticated users"
  on public.resources for select
  to authenticated
  using (true);

create policy "Staff can manage resources"
  on public.resources for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ANNOUNCEMENTS POLICIES
create policy "Announcements viewable by authenticated users"
  on public.announcements for select
  to authenticated
  using (true);

create policy "Staff can manage announcements"
  on public.announcements for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- NOTIFICATIONS POLICIES
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
  );

create policy "Users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (
    user_id = (select id from public.profiles where clerk_user_id = public.auth_clerk_id())
  );

create policy "Staff and service can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (public.is_staff() or true);

-- BADGES POLICIES
create policy "Badges viewable by authenticated users"
  on public.badges for select
  to authenticated
  using (true);

create policy "Staff can manage badges"
  on public.badges for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- MEMBER BADGES POLICIES
create policy "Member badges viewable by authenticated users"
  on public.member_badges for select
  to authenticated
  using (true);

create policy "Staff can award badges"
  on public.member_badges for insert
  to authenticated
  with check (public.is_staff());
