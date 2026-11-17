---
embodiment: ide
summary: Empty and no-results tables in PatternTable and DynamicTable replace the whole table (headers, caption, footer and pagination included) with EmptyState, matching the Empty pattern.
status: active
verified: 2026-11-17
---

# ADR-050: An empty table is replaced by its empty state (2026-11-17)

**Decision.** When a table has no rows (`empty` and `no results` states), `PatternTable` and `DynamicTable` replace the whole table with `EmptyState`: no `<table>`, no column headers (`<thead>`), no `<caption>` header row, no footer and no pagination. The `PatternSection` and its view bar or toolbar above the table stay put so the person can change the view, search or reset filters. The empty state keeps the table's accessible name when one was provided, with no table semantics left around it. `DynamicTable`'s `loading`, `refreshing` and `error` states are unchanged (`loading` and `error` keep the head row and swap the body for a message row; `refreshing` keeps the rows under a spinner).

**Why.** `design-system/src/storybook-docs/patterns/Empty/Empty.mdx` ("Replace the whole table with the empty state") already specified that an empty state replaces the whole table rather than sitting under column headers and a footer over nothing. `PatternTable` and `DynamicTable` still kept the header row and swapped only `<tbody>` for a message row, leaving the code and component docs out of sync with the pattern.

**Consequences.** `PatternTable` renders `emptyState` in place of the scroll wrapper, `<table>` and footer whenever `empty && emptyState` is set, preserving any `aria-label` / `aria-labelledby` (or `<caption>` text) on a `region` wrapper. `DynamicTable` routes `empty` and `no results` through `PatternTable`'s `emptyState` (wrapping string or default messages in compact `EmptyState`) while rendering its `loading` and `error` message rows directly in `<tbody>`. The `<PlannedTag />` caveats about tables keeping their header row are retired from `Empty.mdx`, `EmptyState.mdx`, `PatternTable.mdx` and `DynamicTable.mdx`. Text alignment inside `EmptyState` stays Planned.

**What would reopen it.** If a future data-dense workflow requires preserving column context while empty (for example, inline column-level filters inside `<thead>`), that exception would be documented as an opt-in mode rather than the default table empty state.

— Bill, Nov 2026, deciding option "a" in grill round 2 (Q1, #2682); recorded by Gemini 4 Hydrogen.
