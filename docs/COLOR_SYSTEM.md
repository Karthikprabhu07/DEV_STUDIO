# DEVSTUDIO — COLOR SYSTEM SPECIFICATION

**Document Version:** 1.0.0  
**Context:** Visual Identity, Accent Distribution & Semantic State Tokens

---

## 1. Brand Philosophy & Accent Discipline

DEVSTUDIO enforces strict accent discipline across all breakpoints. The visual language is technical, restrained, and purposeful. Generic multi-colored cards, random gradients, and decorative teal/cyan/orange/pink mixes are prohibited.

---

## 2. Core Tokens

| Token Name | Hex Code | Semantic Role |
|---|---|---|
| **Beacon Amber** | `#E8A33D` | Primary brand accent. Reserved for decorative accents, active navigation rail/tab states, hero badges, and primary action buttons (e.g., "Download ID (PNG)"). Max 1 per section. |
| **Line Cyan** | `#4A8FA6` | Technical data, URLs, code identifiers, secondary line accents. Muted slate-cyan, distinct from saturated neon cyan/teal. |
| **Signal Green** | `#3E9A6D` | Real semantic status only: `Present`, `Approved`, `Active`, verified checkmarks. Never used decoratively. |
| **Rust Alert** | `#C1553A` | Real semantic status only: `Absent`, `Rejected`, `Revoked`, critical errors. Never used decoratively. |
| **Slate Dark** | `#07090D` to `#0E1118` | Base background surfaces, card backgrounds, and navigation containers. |
| **Slate Borders**| `#1E293B` to `#334155` | Structural borders and dividers (`slate-800` / `slate-700`). |
| **Text Primary** | `#F8FAFC` (`slate-50`) | Primary body and heading typography. |
| **Text Muted**   | `#94A3B8` (`slate-400`) | Secondary labels, metadata, timestamps. |

---

## 3. Brand Lockup & Logo Mark Exception

The DEVSTUDIO logo mark comprises:
- Container: Ink Slate-900 background (`#0F172A`) with subtle border (`border-slate-800` or `border-[#E8A33D]/40`).
- Glyph: Terminal chevron and cursor in Beacon Amber (`#E8A33D`).
- Tag: "MITE" tag in `bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/30`.

Any previous cyan-to-blue gradient square is deprecated and replaced with the ink/amber token lockup.

---

## 4. Digital ID Card Color Treatment

- **Card Shell:** Deep dark ink canvas (`#0B0D14` with subtle radial lighting).
- **Corner Registration Marks:** Small L-shaped technical drafting marks in `slate-700` (`#334155`).
- **Identifier:** DevStudio ID (`DS26-XXXX`) rendered in **IBM Plex Mono** in **Line Cyan** (`#4A8FA6`).
- **Primary CTA:** "Download ID (PNG)" filled with **Beacon Amber** (`#E8A33D`), text in `slate-950` (`#020617`).
- **Public Verification URL:** Formatted in `text-[#4A8FA6]` in `IBM Plex Mono`.
- **Status Indicators:** `ACTIVE COHORT` in Signal Green (`#3E9A6D`).

---

## 5. Typography

- **Headings & Body:** Outfit / Inter (`font-sans`).
- **Technical Data & IDs:** IBM Plex Mono (`font-mono`, `font-plex`).
  - DevStudio IDs (`DS26-0001`)
  - Verification tokens & SHA-256 hashes
  - Timestamps & session counts
  - USN identifiers
