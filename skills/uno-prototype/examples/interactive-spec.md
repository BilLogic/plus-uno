---
embodiment: ide
---

<!-- GOLDEN EXAMPLE — interactive/functional prompt-spec, demonstrating the
     shape references/deliverables/interactive.md demands. The source PRD is
     hypothetical and inlined below (no external fixture). Note how two
     ambiguities (typeahead timing, filter combining) were resolved WITH the
     designer during intake and are stated as decisions here — while the gaps
     the PRD leaves open are surfaced as questions, and the zero-results state
     is specified, not left for the tool to invent. -->

# Prompt-spec — Resource library search · interactive draft (v0)

**Source PRD (inline, hypothetical):**

- Tutors can search a shared library of teaching resources by keyword.
- Results can be narrowed by subject.
- Each resource shows a title, subject, grade band, and type (worksheet,
  slides, or activity).
- Tutors open a resource from the results list.

**Confirmed brief:** Goal = validate the search interaction · Artifact =
interactive prototype · Fidelity = Visual mid (clean, not polished),
Interaction high (search must actually work), Scope one search view,
Complexity real data shapes incl. zero-results · Won't include = adding or
uploading resources, favorites, pagination beyond one page.

## What to build

A tutor-facing resource-library search over the sample data below. **Behavior
under test: search feels immediate and the subject filter stays legible next
to the query.**

- **Keyword search** — input with typeahead; *decision from intake:*
  suggestions appear after 2 typed characters, drawn from resource titles in
  the sample data.
- **Filter by subject** — single-select chips: Math, Reading, Science.
- **Combining** — *decision from intake:* keyword AND subject.
- Results list updates live on every keystroke and filter change; each row
  shows title, subject, grade band, and type.
- Opening a resource is a stub — a row click highlights it, nothing more
  (see open question 1).

## Sample data (use this, not lorem)

10 rows: `{ title, subject, gradeBand, type }` — e.g. "Fraction Strips
Warm-up · Math · 3–5 · worksheet", "Phonics Blends Bingo · Reading · K–2 ·
activity", "Photosynthesis Diagram Lab · Science · 6–8 · slides", "Long
Division Step Cards · Math · 4–6 · worksheet"; spread subjects and types so
every chip changes the result set.

## Screen states

- **Default:** search empty, all 10 resources listed, no chip active.
- **Typing:** typeahead panel open under the input with matching titles.
- **Filtered:** active chip highlighted, result count line ("4 of 10
  resources").
- **Zero results:** message "No resources match — try a different keyword or
  subject", plus a one-tap "Clear search".

## Open questions — answer before higher fidelity (do NOT invent)

1. **Opening a resource:** preview in place, download, or external link? The
   PRD says only "open" — the row click stays a stub until ruled.
2. **Search scope:** does the keyword match titles only, or also type and
   grade band? v0 matches titles only and flags this as unruled.
3. **Ordering:** how are results ranked — relevance, recency, alphabetical?
   v0 keeps sample-data order.
4. **Contribution:** who adds resources to the library? No flow exists — out
   of scope here and unspecified in the PRD.

## Out of scope — do not add

Add/upload flows · favorites · ratings · pagination · any nav beyond this
view.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] Typeahead and subject chips work and combine with AND semantics
- [ ] Zero-results state reachable and shows the clear action
- [ ] Real titles/subjects/grade bands from the sample data — no lorem
- [ ] Nothing from the out-of-scope list crept in
- [ ] Nothing in the build states a fact the PRD does not (e.g. what opening
      a resource does) — an invented requirement is a defect, not a helpful
      default
