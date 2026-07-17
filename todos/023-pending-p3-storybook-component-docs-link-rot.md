---
status: pending
priority: p3
issue_id: 023
tags: [code-review, doc-rot, uno-review]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (surfaced by scripts/validate-doc-links.sh during verification)
---

# Fix 12 dead MDX links in uno-review's storybook-component-docs reference

## Problem
`scripts/validate-doc-links.sh` fails on `main` with 12 `[missing]` hits, all in `skills/uno-review/references/storybook-component-docs.md` — links to `design-system/src/**/*.mdx` files (Checkbox, Alert, Button, NavPills, Accordion, Modal, button-segmented-demos.jsx) that no longer exist at those paths. Pre-existing rot, not introduced by the loop-engineering change set — but it keeps the link validator permanently red, which trains everyone to ignore it (2026-07-10 lesson), and the new monthly integrity sweep will file it as an intake on its first run anyway.

## Proposed solution
Reconcile each link against the current `design-system/src/` layout (files likely moved in the 2026-07 IA reorganization — check `storybook.taxonomy.json` groups); update or drop dead examples. Tier 1 if purely link fixes; Tier 2 if the examples need rewriting.

## Acceptance
- [ ] `bash scripts/validate-doc-links.sh` exits 0
