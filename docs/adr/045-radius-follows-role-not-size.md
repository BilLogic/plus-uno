---
embodiment: ide
summary: Radius tokens follow a corner’s role and nesting; controls follow their height, and templates own a radius token.
status: active
verified: 2026-11-13
---

# ADR-045: Radius follows role, not size (Radius 2.0) (2026-11-13)

**Decision.** Radius follows role and nesting rather than a universal small/medium/large prop. Each template owns a token. Controls use the Radius / Control group; buttons use the field radius minus their slot inset. The ordered rules and current values live in `design-system/src/styles/Radius.mdx`.

**Why.** Per-component size names assigned different meanings to the same corner and made nested corners disagree. Role tokens keep a template consistent while control and nested-radius rules account for the places a single template radius cannot fit. This trades a universal size mapping for explicit roles.

**Evidence.** The merged [Radius 2.0 migration](https://github.com/BilLogic/plus-uno/pull/2312) replaces element and per-size radius names. `scripts/lib/tokens/plan.mjs` owns the ladder; `scripts/radius-tokens.test.mjs` guards the names, values, nesting and retired-token removal. Later template values are reflected in Radius.mdx; the migration's parity values are historical.

**Relationship to ADR-038.** Corrects its radius vocabulary; the repo-owned plan and generation direction remain unchanged.

**What would reopen it.** A corner that none of the ordered role rules covers needs a design ruling before adding a token.

— Codex, Nov 2026, recording the merged decisions cited above under the approved harness round.
