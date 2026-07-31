<!-- GOLDEN EXAMPLE — interactive/functional prompt-spec, authored against
     docs/evals/fixtures/uno-prototype-seeds/seed-2-midfi-ambiguous-filter.md.
     Note how the seed's ambiguities (date semantics, AND/OR combining) were
     resolved WITH the designer during intake and are stated as decisions here —
     while the zero-results state is specified, not left for the tool to invent. -->

# Prompt-spec — Session history filters · interactive draft (v0)

**Confirmed brief:** Goal = validate the filter interaction · Artifact =
interactive prototype · Fidelity = Visual mid (clean, not polished),
Interaction high (filters must actually work), Scope one table view,
Complexity real data shapes incl. zero-results · Won't include = saved
filters, export, pagination beyond one page.

## What to build

A tutor-facing session-history table with three combinable filters. **Behavior
under test: filtering feels immediate and combined filters stay legible.**

- **Filter by subject** — single-select dropdown: Math, Reading, Science.
- **Filter by student** — type-ahead over the student names in the sample data.
- **Filter by date** — *decision from intake:* relative presets (Last 7 days ·
  Last 30 days · This semester), not a free date picker.
- **Combining** — *decision from intake:* AND across filter types.
- Table updates live on every filter change; active filters render as
  dismissible chips above the table.

## Sample data (use this, not lorem)

12 rows: `{ student, subject, date, duration }` — e.g. "Maya R · Math ·
2026-07-28 · 45 min", "Jordan P · Reading · 2026-07-25 · 30 min"; spread dates
across 60 days so every preset changes the result set.

## Screen states

- **Default:** all 12 rows, no filters.
- **Filtered:** chips visible, row count line ("4 of 12 sessions").
- **Zero results:** message "No sessions match — try removing a filter", plus
  a one-tap "Clear all filters".

## Out of scope — do not add

Saved filter sets · CSV export · pagination · sorting changes · any nav beyond
this view.

## Self-check (verify before returning; regenerate once if any fail)

- [ ] All three filters work and combine with AND semantics
- [ ] Zero-results state reachable and shows the clear-all action
- [ ] Real names/subjects/dates from the sample data — no lorem
- [ ] Nothing from the out-of-scope list crept in
