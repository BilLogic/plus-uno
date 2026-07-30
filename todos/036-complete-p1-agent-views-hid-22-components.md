---
status: complete
priority: p1
issue_id: 036
tags: [code-review, design-system, generator, false-absence]
dependencies: []
---

# The generated component index hid 22 real components, and AGENTS.md calls it proof of existence

## Problem Statement

`design-system/agent-views/components/index.md` opens with "**CRITICAL**: Only use components listed here. If it's not listed, it DOES NOT EXIST", and `AGENTS.md` § Forbidden patterns repeats the rule. The generator that writes that file could not see `export * from`, so every component re-exported through a group barrel was missing from it. An agent asked "do we have a DatePicker?" would have answered no. We do.

## Findings

- `scripts/generate-knowledge-components.js` `extractExports()` matched only `export { X as Name }`. `design-system/src/components/index.js:16` is `export * from '@/components/forms-and-inputs'` — invisible to that regex.
- 22 components were missing: DatePicker, InputGroup, Checkbox, Input, Radio, Select, Switch, Textarea, TagInput, TreeSelect, Cascader, ChoiceGrid, DateAndTimePicker, FileUpload, MultipleChoice, NumberInput, OptionList, Range, Rating, Scale, ScrollBar, SelectMultiple.
- `agent-views/forms/index.md` said "Form elements (0)" against `design-system/src/forms/`, a directory the 2026-07 IA reorg deleted — and `design-system/docs/discovery.md:22`, `docs/patterns/forms.md:30` and `:102` route agents straight to it. Zero listed, three doors leading there.
- `npm run generate:agent` had been failing outright since `ab54ee63`: `OptionChip.mdx` wrote `figmaMeta` as a JS object literal (unquoted keys, single quotes) where the registry generator does `JSON.parse`. So nobody could regenerate even if they noticed.
- Knock-on: the "44 components / 20 form components" in README.md and plus-uno.md were closer to the truth than the "35" this review corrected them to two commits ago — that 35 came from the broken index.

## What changed

- `extractExports()` follows `export * from` into sibling barrels, resolving `@/` and relative specifiers, with a cycle guard. It deliberately does NOT follow `export * from '@/dataviz'` — 47 chart wrappers belong to their own section of the IA, not under "UI components".
- An unresolvable `export *` now warns loudly instead of silently under-reporting.
- The forms index emits a redirect to `components/index.md` when `src/forms/` is absent, and says plainly that an absence there means nothing.
- `OptionChip.mdx` figmaMeta converted to strict JSON, unblocking the whole `generate:agent` pipeline.
- Counts corrected to 57 in README.md and plus-uno.md; stale version tables aligned to package.json.

## Acceptance Criteria

- [x] `npm run generate:agent` completes end to end
- [x] Every exported component appears in the index (57)
- [x] Charts stay out of the UI-components section
- [x] The forms index cannot be read as "no form components exist"
- [x] Docs quote the regenerated number

## Work Log

- 2026-07-30: Found by cross-checking the DS counts I had just "corrected" against the directory tree — the disagreement was the generator, not the docs.
