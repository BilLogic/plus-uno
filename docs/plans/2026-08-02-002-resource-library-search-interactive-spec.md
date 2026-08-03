# Prompt-spec — Resource library search · interactive draft (v0 / Claude design / Stitch)

Paste into v0, Claude design, Stitch, or Figma Make. Produce a shareable clickable
URL suitable for two tutor sessions this week.

**Source PRD (inline):**

- Problem: tutors can't find teaching resources fast enough.
- Requirements: search a shared library by keyword; narrow by subject; each
  result shows title, subject, and type.
- Intent: something clickable to put in front of stakeholders; not built on
  the PLUS design system yet.

**Confirmed brief**

- **Goal:** align stakeholders · reduce engineering ambiguity
- **Artifact:** interactive / functional prototype (external generator; not a
  PLUS DS coded build)
- **Fidelity:** Visual mid · Interaction high (search box + subject filter,
  results update live) · Scope one search surface · Complexity happy path +
  empty/clear
- **Won't include:** PLUS DS components/tokens · upload/create · auth ·
  resource open beyond row stub · persistence · pagination · filters other than
  subject (type is display-only on each result)

## Grounding snapshot (read 2026-08-02)

**uno-blueprint:** not queried this session — Supabase MCP `needsAuth` in this
environment. Do not invent `phase › scenario › path — layer × step` citations.
Re-ground when MCP is available before raising fidelity.

**Prior art (repo):**

- Golden shape: `skills/uno-prototype/examples/interactive-spec.md` (same
  surface family; this spec trims grade-band from result chrome per PRD).
- No keyword + subject library in `prototypes/` or live-app.
- Adjacent DS only (do **not** implement PLUS components here): Home
  `ResourceCard` / `ResourceType` (media types); Training lessons use **status**
  filters, not subject/keyword.
- Product foundation docs do not define a canonical “teaching resource library”
  enum — sample subjects/types below are placeholder until blueprint or a
  product owner names the real list.

## Flow (trigger → steps → outcome)

| | |
|---|---|
| **Trigger** | Tutor needs a teaching resource from the shared library before or during prep. |
| **Steps** | 1) Open the library search view. 2) Type a keyword — results update live. 3) Optionally tap a subject chip to narrow. 4) Scan rows (title · subject · type). 5) Tap a row → highlight only (open behavior unresolved). |
| **Outcome** | Tutor has located a candidate resource (or sees a clear empty state) without leaving this view. |
| **Actors / systems** | Tutor · shared library (mock client-side data — no backend). |

## What to build

A single tutor-facing **shared resource library** view. **Behavior under test
(engineering contract):** keyword and subject filter combine with **AND**;
results update **live** on every keystroke and chip change; each row shows
exactly **title**, **subject**, and **type**.

- **Keyword search** — single text field labeled “Search resources”. Match is
  **case-insensitive substring on `title` only** (*working rule for this
  prototype — see open question 2*). No typeahead panel unless you later answer
  open question 4; keystroke live-filter is enough.
- **Filter by subject** — single-select chips: **Math**, **Reading**,
  **Science**. Tapping the active chip again clears the subject filter.
  “All subjects” = no chip active.
- **Combining** — keyword AND subject. Changing either control refilters
  immediately (no Submit button).
- **Results** — list updates live; show a count line: “N of 12 resources”.
  Each row: **title**, **subject**, **type** only (no grade band).
- **Row click** — stub: highlight the selected row; do not navigate, preview,
  or download (*open question 1*).
- **Visual** — clean, mid-fidelity, shareable. Do **not** use PLUS design-system
  components, tokens, or Storybook patterns. Generic modern UI is fine.

## Sample data (use this exact set — no lorem)

12 rows: `{ title, subject, type }` with `type` ∈ `worksheet` | `slides` |
`activity`. Spread so every subject chip and every type appears at least twice.

1. Fraction Strips Warm-up · Math · worksheet  
2. Long Division Step Cards · Math · worksheet  
3. Multiplying Fractions Mini-Lesson · Math · slides  
4. Integer Number Line Race · Math · activity  
5. Phonics Blends Bingo · Reading · activity  
6. Main Idea Paragraph Sort · Reading · worksheet  
7. Guided Reading Conference Slips · Reading · worksheet  
8. Fluency Passage Warm-Up Deck · Reading · slides  
9. Photosynthesis Diagram Lab · Science · slides  
10. Lab Safety Station Cards · Science · worksheet  
11. States of Matter Sort · Science · activity  
12. Food Chain Build Slides · Science · slides  

## Screen states

- **Default:** search empty, no subject chip active, all 12 resources listed,
  count “12 of 12 resources”.
- **Keyword only:** query non-empty, no chip — list and count reflect title
  matches only.
- **Subject only:** chip active, search empty — list filtered to that subject.
- **Combined:** query + chip — AND semantics; count updates (e.g. “2 of 12
  resources”).
- **Empty / zero results:** message **“No resources match — try a different
  keyword or subject”** plus a one-tap **“Clear search”** that clears the query
  and the subject chip and restores the default list.

(No separate error/network state — data is local. Do not invent a loading
spinner delay.)

## Open questions — answer before higher fidelity (do NOT invent)

1. **Opening a resource:** preview in place, download, or external link? Row
   click stays a highlight stub until ruled.
2. **Search scope:** titles only (this build), or also type / body text?
3. **Ordering:** relevance, recency, or alphabetical? This build keeps
   sample-data order among matches.
4. **Typeahead:** needed for the tutor sessions, or is live list filter enough?
5. **Canonical subjects/types:** product-owned lists unknown — Math / Reading /
   Science and worksheet / slides / activity are placeholders until blueprint
   or an owner names the real enums.
6. **Contribution:** who adds resources? Out of scope here and unspecified in
   the PRD.

## Out of scope — do not add

PLUS Design System · upload/create flows · auth · favorites · ratings ·
pagination · multi-subject select · type filter control · grade-band chrome ·
nav/chrome beyond this view · backend / persistence · fake latency.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] Serves goals: shareable enough for two tutors this week; keyword AND
      subject behavior is unambiguous for engineering
- [ ] Artifact is an interactive clickable (search + chips + live list) — not a
      static mock and not PLUS DS
- [ ] Fidelity dials honored: Visual mid · Interaction high · one surface ·
      empty/clear present
- [ ] Each result shows title, subject, type only — no invented fields
- [ ] Zero-results state reachable with the clear action
- [ ] Sample titles/subjects/types used — no lorem
- [ ] Nothing from the out-of-scope / won't-include list crept in
- [ ] Nothing in the build states a fact the PRD does not (e.g. what opening a
      resource does) — an invented requirement is a defect, not a helpful default
