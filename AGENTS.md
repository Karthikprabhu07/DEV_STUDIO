# AGENTS.md — DEVSTUDIO Standing Rules

Read this in full, and read /docs/PRODUCT_SPEC.md in full, before planning or writing
any code for any task in this workspace. If a request conflicts with these rules,
follow these rules and flag the conflict instead of silently overriding them.

## Product identity
- Product name: DEVSTUDIO. Tagline: "BUILD. SHIP. LEARN."
- The only user-facing role names are: Dev Director, Dev Captain, Dev Mate.
- Never use "Admin", "Organizer", or "Team Lead" in UI copy, routes, component
  names, or user-facing enum labels.

## Stack (do not substitute)
- Frontend: React + TypeScript + Vite + Tailwind CSS, built on the existing Stitch
  design system/exported components. Preserve Stitch typography, spacing, colors,
  and layout — never replace it with generic unstyled Tailwind defaults.
- Auth: Supabase Auth only (native supabase.auth). Clerk has been completely removed.
- Database/storage: Supabase PostgreSQL + Supabase Storage.
- Hosting target: Vercel.

## Non-negotiable data rule
- Never insert seed data, demo users, fake names, fake @mite.ac.in emails, fake
  DevStudio IDs, fake attendance, fake events, fake projects, fake certificates,
  fake notifications, fake badges, or fake statistics — not in migrations, not in
  fixtures, not in components "for preview purposes."
- The database starts empty. Every list/dashboard screen must render the designed
  empty state whenever a query returns zero rows.
- To test a flow, create the record through the real app (real sign-up, real event
  creation) in a scratch environment — never via a seed script that invents identities.

## Auth rules
- Only @mite.ac.in emails may create an account. Enforce this strictly server-side
  via a Postgres BEFORE INSERT trigger on auth.users (raising exception: "Please use your MITE institutional email ending with @mite.ac.in."),
  never only in the frontend form.
- New sign-ups start as membership status PENDING. Nothing auto-promotes a user
  to an active Dev Mate.

## Authorization rules
- Roles are exactly: DEV_DIRECTOR, DEV_CAPTAIN, DEV_MATE.
- Enforce authorization in the database/backend (RLS + server-side checks), never
  by hiding UI elements alone. Every privileged mutation re-checks role and
  membership status server-side even if the frontend already gated it.

## DevStudio ID rules
- Format DSYY-NNNN, generated via a Postgres sequence or other atomic mechanism.
  Never use SELECT MAX(id)+1 or any pattern that can race under concurrent creation.
- The visible DevStudio ID is never the public lookup key. QR codes and public
  verification use a separate cryptographically random opaque token. The public
  verification endpoint is rate-limited and returns only intentionally public fields.

## ID card and wallet pass generation
- Generate/cache the card asset in Supabase Storage rather than rendering it from
  scratch on every view. Regenerate only when photo/avatar/name/role/ID/template/
  token actually changes.
- Apple Wallet and Google Wallet passes are a required deliverable, not optional —
  implement issuance and push auto-update in Phase 5, driven from the same
  identity data as the rendered card.

## Security checkpoint (hard stop)
- Before changing the database schema, RLS policies, or any authorization logic,
  stop and post a short written explanation of the proposed change and confirm it
  doesn't weaken authorization. Wait for explicit approval before applying it —
  this applies even in an otherwise autonomous run.
- Never place Clerk secret keys, the Supabase service role key, or any private
  credential in frontend code, client bundles, or committed files.

## Attendance rules
- Attendance is manual only, taken by a Dev Captain. No QR scanning, camera/face
  recognition, self check-in, or attendance codes.
- Every member defaults to PRESENT when attendance opens; the Captain flips
  absentees to ABSENT. A DB constraint prevents duplicate attendance rows per
  member/event.

## Badges
- Badges are a required feature, not optional polish — implement real awarding
  logic tied to genuine application events, kept visually professional (never
  gamified or cartoonish).

## Verification expectation
- After implementing a feature, use the browser to actually exercise it (sign up
  with a non-@mite.ac.in email and confirm server-side rejection, open attendance
  and confirm PRESENT defaults, hit the QR verification URL, confirm a wallet pass
  updates after a role change, etc.) before marking a task done, and describe what
  you tested in the Walkthrough.

## Working rhythm
- Work one phase at a time, per the phase plan given in the prompt. Do not build
  ahead into a later phase's tables or screens even if convenient — flag it and ask.
- Do not treat any feature in the product spec as optional or deferrable. If
  something genuinely can't be built this phase, stop and ask rather than dropping it.
