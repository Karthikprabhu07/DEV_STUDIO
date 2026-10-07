# DEVSTUDIO — MOBILE OPTIMIZATION BRIEF

**Why this isn't an afterthought here specifically:** per the product spec, attendance is taken live, standing up, in a room, on a phone — it's explicitly the highest-frequency screen in the whole app. A student club platform also just gets browsed on phones by default. So "optimize for phone" isn't a responsive-pass checkbox at the end — it changes real structural decisions (nav pattern, table treatment, modal behavior) that the desktop-first brief didn't fully spec. This document is that missing layer. It sits on top of `devstudio-ui-ux-prompt.md` and `devstudio-color-system.md` — same tokens, same voice, mobile-specific structure.

---

## 1. Breakpoints

| Name | Width | Primary use |
|---|---|---|
| `mobile` | 360–430px | Phones — the primary target of this doc |
| `tablet` | 768–1023px | iPads, small laptops in split-view |
| `desktop` | 1024–1439px | Standard laptop |
| `wide` | 1440px+ | External monitors |

Design mobile as its own layout, not a squeezed desktop. The left nav rail, multi-column stat grid, and side-by-side "Upcoming Events / Announcements" panels from the desktop dashboard do not survive a 390px viewport as-is — they need the restructuring below, not just smaller versions of themselves.

---

## 2. Navigation: rail → bottom tab bar + sheet

The persistent left rail becomes a fixed bottom tab bar on mobile. Cap it at **five items** — more than that and it stops being scannable at a glance, which defeats the point of a bottom bar.

```
┌─────────────────────────────┐
│                               │
│         (content)             │
│                               │
├─────────────────────────────┤
│  🏠      ✓       📅      📁    ⋯  │
│ Home  Attend  Events  Projects More │
└─────────────────────────────┘
```

- **Attendance gets a permanent tab**, not a buried menu item — it's the screen people need one thumb-tap away while mid-meeting.
- **"More"** opens a full-height sheet (slides up from the bottom, not a dropdown) containing: Challenges, Resources, Digital ID, Members (role-gated), Profile, Sign out.
- Active tab uses `amber` (icon + label), matching the rail's active state on desktop — same token, different position, so the system stays coherent across breakpoints.
- Tab bar respects the safe-area inset on iOS (no controls sitting under the home indicator).
- Same five tabs across all three roles — what changes is what's inside "More" and what shows inside Attendance/Events for that role, not the tab structure itself. This keeps the "role-aware, not role-duplicated" principle intact at this breakpoint too.

---

## 3. Attendance — the screen this whole document exists for

- **Sticky header:** event name + the three live counters (Total/Present/Absent) pinned at the top, visible while the list scrolls beneath it. Never let the counters scroll away — that's the number a Captain glances at mid-call.
- **Full-width tap rows**, minimum 56px tall (taller than the 44px general minimum — this is the single most-tapped control in the product, give it room). Tapping anywhere on the row toggles state, not just a small pill on the right edge.
- **Sticky bottom save bar**, thumb-reachable, sitting just above the tab bar — not competing with it for the same screen real estate.
- **Search bar pinned under the header**, filters instantly, large enough to tap accurately with one hand while possibly holding a clipboard or phone case in the other.
- No horizontal scrolling, ever, on this screen. If a name is long, it wraps or truncates — it never pushes the row wider than the viewport.

---

## 4. Tables and data lists → stacked rows, not the card-kit default

Member lists, attendance history, and GitHub stats are genuinely tabular data. Stack each row's columns into a compact vertical block, still using dividers and Plex Mono for the technical values:

```
Desktop:  Name        DevStudio ID   Attendance %   Status
          Priya R.    DS26-0031      92%            Active

Mobile:   Priya R.                              [Active]
          DS26-0031 · 92% attendance
          ───────────────────────────────
```

- Divider between rows (`slate-700`/`slate-800`), not a shadow-and-radius card per row.
- Status still uses the Section 4 color mapping from the color system, shown as a small text/icon pill, not a colored card background.
- Tap the row to expand or navigate — same interaction the desktop row's click already does.

---

## 5. Forms and modals → full-screen sheets

The membership application modal (and any similar form) becomes a full-screen sheet on mobile rather than a centered floating box with a backdrop.

- Slides up from the bottom, covers the full viewport, has its own header with a close (×) and the form title.
- **Every input's font-size is at least 16px.** Below that, iOS Safari auto-zooms on focus.
- When the keyboard opens, the field being edited scrolls into view above the keyboard automatically.
- Primary submit button stays reachable at the bottom without needing to scroll back up.

---

## 6. Digital ID and verification page

- The card fits within viewport width with margin, not edge-to-edge.
- QR code stays large enough to scan at arm's length even at mobile card width.
- "Download ID (PNG)" triggers the native share sheet on mobile where available (`navigator.share`), or downloads the real card image.
- The public verification page (`/verify/<token>`) works with zero prior context, no app chrome, and is legible one-handed on the first paint.

---

## 7. Touch targets and typography, sitewide

- Minimum touch target: 44×44px, everywhere — nav tabs, form controls, close buttons, table row actions. Attendance rows: 56px+.
- Body text minimum 16px on mobile.
- Spacing between adjacent tappable elements: at least 8px.

---

## 8. Performance

- Virtualize any list that can exceed ~30 rows on mobile data.
- Lazy-load avatars/photos below the fold.
