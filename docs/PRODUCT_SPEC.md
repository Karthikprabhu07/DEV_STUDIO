# DEVSTUDIO — MASTER BUILD PROMPT (Strict, Full-Scope Edition)

## 1. What you're building

**DevStudio** — a student technology club platform for Mangalore Institute of Technology & Engineering (MITE), built around full-stack development and AI-assisted/vibe-coding workflows.

Tagline: **Build. Ship. Learn.**
Core philosophy: **Human creativity + AI assistance + engineering judgment** — never present AI-assisted development as blindly generating code.

The platform combines: a public marketing site, a member portal, a club management system, a lightweight developer-community/project hub, and a digital identity system (including wallet passes — see Section 6). It must feel like a real developer-focused SaaS product — not a college club portal. Avoid generic gradients, glassmorphism, cartoonish UI, or template-default styling.

---

## 2. Tech stack — fixed, do not substitute

- **Design:** Google Stitch (React/Tailwind export)
- **Development:** Google Antigravity
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui + Lucide icons
- **Data layer:** TanStack Query + React Hook Form + Zod
- **Auth:** Clerk (NOT Supabase Auth — see Section 5)
- **Database:** Supabase (PostgreSQL, Storage, Row Level Security)
- **Deployment:** Vercel

---

## 3. Roles

Three roles only. Backend/database values stay lowercase technical names; UI-facing labels are different:

| Backend value | UI label | Summary |
|---|---|---|
| `admin` | **Dev Director** | Full platform control |
| `organizer` | **Dev Captain** | Runs events, attendance, projects, content |
| `member` | **Dev Mate** | Participates, builds, learns |

**Do not** create a "Team Lead" role. **Do not** display `admin`/`organizer`/`member` anywhere in user-facing UI — only the Dev Director/Captain/Mate labels.

---

## 4. Authentication

- Only `*@mite.ac.in` email addresses may create accounts. Reject all others with: *"Please use your MITE institutional email ending with @mite.ac.in."*
- Enforce this **server-side**, not just in the UI. Clerk's built-in Allowlist restriction is a paid-plan feature in production — instead, validate the domain inside the Clerk `user.created` webhook handler (Section 5) and reject/deactivate any account that slips through.
- Having a valid MITE email does **not** auto-activate DevStudio membership. Flow:

```
MITE Email → Registration → Email Verification → Membership Request
→ Dev Director/Captain Review → Approved → Account Activated
```

- Membership statuses (single canonical enum, used everywhere — including the approval UI in Phase 2): `pending`, `active`, `alumni`, `suspended`, `inactive`, `rejected`, `revoked`. Admin can approve, reject, suspend, reactivate, deactivate, revoke, and promote Dev Mate → Dev Captain.
- Never trust client-side role checks. A Dev Mate must be structurally unable to modify attendance, certificates, announcements, other members' data, roles, or membership status via direct API calls — enforce entirely through Supabase RLS (Section 5), not app logic.

---

## 5. Database & security architecture

Supabase Postgres, accessed through **Clerk as a Supabase third-party auth provider** — not Supabase's own Auth.

```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  async accessToken() {
    return (await auth()).getToken()
  },
})
```

RLS policies check the Clerk user ID via `auth.jwt()->>'sub'`, compared against a `clerk_user_id` column — never `auth.uid()`.

**Sync Clerk users into Supabase via webhook:** on `user.created`, verify the MITE domain, insert into `profiles`, assign a DevStudio ID (Section 6), set `membership_status = 'pending'`. On `user.updated`, sync changed fields.

**Reusable RLS helper** — write once, reference everywhere role-gating is needed:

```sql
create or replace function is_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where clerk_user_id = auth.jwt()->>'sub'
    and role in ('admin','organizer')
  );
$$;
```

**Rule: every new table gets its RLS policies written in the same step it's created, not bolted on afterward.** A table with no INSERT/UPDATE policy for members is a hard deny by default — use that instead of writing explicit block-rules.

**Required tables (all phases — nothing here is deferred):** `profiles`, `devstudio_ids`, `memberships`, `id_cards`, `events`, `event_registrations`, `attendance_sessions`, `attendance_records`, `announcements`, `projects`, `project_members`, `project_tasks`, `challenges`, `challenge_submissions`, `certificates`, `resources`, `notifications`, `audit_logs`, `github_accounts`, `github_stats`, `badges`, `member_badges`, `wallet_passes`.

All tables: UUID primary keys, `created_at`/`updated_at` timestamps, appropriate foreign keys and indexes.

**Backend function split:**
- **Vercel API routes** — anything needing live Clerk auth: webhook handler, ID card generation trigger, photo moderation actions, wallet pass issuance/update triggers.
- **Supabase Edge Functions** — service-role/scheduled work not tied to a live user session: the daily GitHub stats sync, the public `/verify/<token>` endpoint (intentionally anonymous/unauthenticated — see Section 6), and scheduled wallet pass push updates. Rate-limit the public verification endpoint.

---

## 6. Digital ID system (production-grade security model) — including wallet passes

Every activated user (all three roles) automatically gets a permanent, unique **DevStudio ID**, a digital ID card, **and** an Apple Wallet / Google Wallet pass. None of this is manual or deferred.

**Two separate identifiers — never conflate them:**
- **Human-readable ID** (`DS26-0042`) — permanent, sequential, safe to display publicly. Format: `DS` + 2-digit year + zero-padded sequence number.
- **Opaque verification token** — cryptographically random (UUID v4 or 32-byte random), independently generated per card, never derived from the DevStudio ID, user ID, email, name, or role. This is what the QR code encodes — never the human-readable ID.

**Atomic, concurrency-safe ID generation** using a per-year Postgres sequence (auto-created if it doesn't exist), never `SELECT MAX(number) + 1`:

```sql
create or replace function assign_devstudio_id(p_user_id uuid)
returns text language plpgsql security definer as $$
declare
  yr text := to_char(now(), 'YY');
  seq_name text := 'devstudio_seq_' || yr;
  next_num int;
  new_id text;
begin
  if not exists (select 1 from pg_sequences where sequencename = seq_name) then
    execute format('create sequence %I start 1', seq_name);
  end if;
  execute format('select nextval(%L)', seq_name) into next_num;
  new_id := 'DS' || yr || '-' || lpad(next_num::text, 4, '0');
  insert into devstudio_ids (user_id, devstudio_id, sequence_year, sequence_number)
  values (p_user_id, new_id, yr::int, next_num);
  return new_id;
end;
$$;
```

**Token storage:** store a SHA-256 hash of the token, never the raw value. Use SHA-256 specifically (not bcrypt/argon2) — the token is already high-entropy, so a slow password-style hash only adds latency without adding security, and you need the hash indexed for fast lookup on every verification scan.

**Public verification page** (`/verify/<token>`): looks up by hashing the incoming token and comparing. Shows only: name, DevStudio ID, role, status (Active/Alumni/Suspended/Revoked with appropriate icon), member-since year. Never exposes email, phone, address, attendance, or internal notes. Generic "invalid" response for bad tokens — never hint whether a token is "close" to valid. Rate-limit this endpoint.

**Card asset storage:** private Supabase Storage bucket, served only via short-lived signed URLs — never a public bucket with a predictable path.

**Card caching:** render once (server-side, e.g. via a Vercel API route using an HTML/SVG template → PNG/PDF), store in Storage, serve the cached asset. Regenerate only on: approved photo/avatar change, role change, card template version change, or token rotation. Never regenerate on every profile view.

**Photo/avatar system:**
- A real photo is never mandatory for the member — members choose Photo, generated Avatar, or Default Avatar. (This is the one place "optional" correctly describes user choice, not build scope — the feature itself, including all three options, is required.)
- New uploads go `pending` → staff review → `approved`/`rejected` before ever appearing on the official card. The existing approved image stays live until a replacement is approved.

**Lifecycle statuses:** `active`, `alumni`, `suspended`, `inactive`, `revoked`. Graduation is a distinct state from disciplinary suspension — verification page shows "🎓 DevStudio Alumni," not generic "Inactive." Auto-flag accounts past expected graduation year (from `academic_year`) into an admin review queue via a scheduled job.

**Role changes never change the DevStudio ID** — only the displayed role, triggering a card regeneration.

**Token rotation:** if a token is compromised, admin can rotate it — this invalidates the QR on any previously downloaded card image, so rotation must also trigger card regeneration and a member notification to redownload.

**Audit logging:** every card status change (revoke/reactivate), token rotation, and manual regeneration writes to `audit_logs`, same as attendance edits and role promotions.

**Wallet passes — REQUIRED, not deferred.** Implement Apple Wallet (PassKit) and Google Wallet pass issuance for every activated member's digital ID card:
- Pass fields mirror the card: name, photo/avatar, DevStudio ID, role, status, QR (opaque token).
- Passes auto-update via push (Apple PassKit web service / Google Wallet API) whenever role, status, photo, or token changes — the member should never need to redownload a pass to see current data (token rotation is the one case that also requires a redownload notification, per above).
- Build the data model so a single source of truth (the `id_cards`/`wallet_passes` tables) drives the rendered card, the Apple pass, and the Google pass — no divergent copies of identity data across the three.
- This ships in Phase 5, alongside the rest of the digital ID system — it is not "later" or "if time permits."

---

## 7. Attendance system — exact required interaction

- Manually taken by Dev Captain/Dev Director during physical meetings. **No QR scanning. No self-marking. No automated check-in of any kind.**
- Every member starts as **Present** when a session opens. The organizer only needs to tap the people who are absent.
- Toggle: `Present → Absent`, tap again `Absent → Present`. This is the primary interaction and must require minimal taps.
- Screen shows: event name/date/time, three live counters (Total/Present/Absent), a search box, the member list with toggle pills, and a Save button with a confirmation step before final save. Support editing after save, and an attendance history view.
- Members can only view their own attendance — never anyone else's, and never edit any attendance record.
- Attendance % = Sessions Present / Total Sessions × 100, computed automatically.
- A database constraint prevents duplicate attendance rows per member/event.

---

## 8. Core features — all required, all in scope

- **Events:** draft → published → registration open/closed → completed → archived lifecycle, with registration, capacity, team size, and an organizer-side registration dashboard with export.
- **Announcements:** categories, priority levels, pin/schedule, read-tracking. Draft/publish/schedule/archive states — unpublished content is never visible to a Dev Mate.
- **Project hub:** lightweight workspace (overview/tasks/members/resources/activity), simple To Do/In Progress/Review/Completed task states — do not over-engineer into a full PM tool.
- **Build Challenges:** creation, requirements, timeline, participants, team submission (GitHub link, live demo, screenshots), and a leaderboard.
- **Certificates:** unique verification IDs and a public verification page (same enumeration-safety principle as Section 6).
- **Resource hub:** organized by category (Full Stack, Vibe Coding, Deployment, UI/UX, Cybersecurity), management-created, member-browsable/searchable.
- **In-app notifications:** unread count, generated only from real application events — never fabricated.
- **Badges:** REQUIRED feature — professional style, never gamified/cartoonish. Awarded on real achievement events (not seeded, not manually faked for demo purposes).
- **Global search:** respects per-role visibility.
- **Audit log:** records actor/action/target/before-value/after-value/timestamp for all administrative actions, including card/token/wallet-pass changes.
- **GitHub integration:** members link their GitHub account via OAuth (`read:user`, `public_repo` scopes only — never write access). Sync contribution/repo stats on a daily schedule (not live per-view) via Edge Function, using GitHub's GraphQL API for contribution data. Surface on profiles (contribution graph, top languages, repo/star counts) and cross-reference into linked Projects (auto-pull commit activity instead of manual tech-stack entry).
- **Wallet passes:** see Section 6 — required, shipped in Phase 5.

---

## 9. Non-negotiable constraints

- No "Team Lead" role, anywhere.
- No QR/scanning/self-service attendance — manual only, as specified in Section 7.
- The visible DevStudio ID is never used as a security credential; the QR verification token is always separate and opaque (Section 6).
- No client-side-only authorization — every protected action enforced via Supabase RLS.
- No public storage buckets for card/photo assets — signed URLs only.
- No slow password-style hashing for the verification token — SHA-256 indexed lookup.
- Real photos are never mandatory for a member to choose — avatar/default options always available.
- Card/photo changes always go through moderation before going live on the official ID.
- Wallet passes ship as a real, working feature in Phase 5 — not stubbed, not left as "future work."
- Badges ship as a real, working feature — not stubbed, not left as "future work."
- No seed data, demo users, fake names, fake emails, fake IDs, fake attendance, fake events, fake projects, fake certificates, fake notifications, or fake statistics anywhere — the database starts empty and every list/dashboard renders its designed empty state on zero rows.

---

## 10. Build order

- **Phase 1 — Foundation:** Clerk auth + MITE domain enforcement via webhook, membership approval flow, `profiles`/`devstudio_ids`/`memberships` schema with RLS, the `is_staff()` helper.
- **Phase 2 — Core club management:** dashboard, announcements, events, event registration, membership approval UI (pending/active/rejected/etc.).
- **Phase 3 — Attendance:** Get the interaction (Section 7) right before moving on — this is the highest-frequency screen in the app.
- **Phase 4 — Developer community:** projects, project workspace, resources, challenges, GitHub integration.
- **Phase 5 — Digital ID system, full scope:** Section 6 in its entirety — sequence-based ID assignment, opaque token + hashed storage, card rendering/caching, photo/avatar moderation, alumni lifecycle, public verification page with rate limiting, certificates with public verification, **and Apple/Google wallet pass issuance and auto-update.**
- **Phase 6 — Notifications, badges, audit log, polish, security review:** notifications, **badges (full implementation, not a stub)**, audit log UI, performance/accessibility/responsive passes, final security review against Section 9.
