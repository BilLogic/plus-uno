---
embodiment: ide
summary: Semantic spacing tokens are grouped (namespaced), not flat
status: active
verified: 2026-08-27
---

# ADR-026: Semantic spacing tokens are grouped (namespaced), not flat

- **Date:** 2026-07-01 (experiment run 2026-06-30 – 2026-07-01; recorded as an ADR 2026-08-24)
- **Scope:** design-system spacing/border/radius tokens

## Context

Two structurally identical Figma files were built to compare semantic spacing
token architectures. Same components, same layout, atomic component up to a
composed homepage. The only variable was the local semantic token set.

| | Kit 1 — GROUPED | Kit 2 — FLAT |
| --- | --- | --- |
| Figma file key | `giLI5hxMzffZjzON9RRo7W` | `2oKeXHZNWdpSXDgDe9pfmb` |
| Semantic tokens | 80, namespaced per component type (Element / Card / Modal / Section / Surface / Table) | 24, role × size only |

Both alias the same primitive scale (`Spacing V2/primitives`, `130:259943`).

## Decision

Use the **grouped (namespaced)** architecture.

## Rationale

Both kits reached visual parity and, eventually, 100% localization — the
homepages are near-indistinguishable. The difference is coverage and authoring
experience, not pixels.

**The decisive finding:** the flat set was *structurally incomplete*. A role ×
size ramp covers gaps and padding elegantly but has no border/stroke token
(nothing at 1 / 1.5 / 2 px) and no full/pill radius. A non-trivial slice of the
UI could not be expressed by its own tokens at all.

Closing that gap required adding 5 tokens to Kit 2 (`border-sm/md/lg/xl`,
`radius-full`) — pushing it back toward the richer, categorized shape of the
grouped set. Kit 1 needed 0 new tokens; it arrived complete.

Net trade: grouped = more tokens up front, fewer decisions and fewer gaps later.
Flat = fewer tokens, paid for in per-decision judgment plus eventual growth.

Counterpoint worth remembering: the flat ramp exposed values the grouped set
does not (page gap 32 via `stack-3xl`; mid gaps 12 and 10). Grouped is coarser
at the section tier — `Section/stack` is 8/16/24 with no 12, and `Surface` gap
caps at 24 — so it produces a more quantized page rhythm. That is a real cost of
this decision, accepted in exchange for guardrails.

## Implementation notes that cost time to discover

1. **Bind stroke weight PER-SIDE.** The uniform `strokeWeight` field silently
   no-ops on library-instance sublayers.
2. **`inset-uniform-*` is scoped GAP-only** in the flat set — no
   `CORNER_RADIUS` / `STROKE_FLOAT`. Radius and stroke on those same components
   must come from a `stack-*` / `inline-*` / `inset-x|y-*` token of matching value.
3. **COMPONENT_SET wrapper chrome is deliberately not tokenized** — it never
   renders in instances.
4. **Sub-pixel remote borders (0.6 / 0.8 px) were normalized to the 1 px DS
   border** rather than given bespoke tokens.
5. Un-localizable by design: decorative radar-chart line weights (0.70 / 0.90 px)
   and a 0.6 px textarea hairline — illustration strokes, not DS border tokens.

## Source

Compressed from a 4-file working record (`00-reference.md`, `01-kit1-log.md`,
`02-kit2-log.md`, `03-comparison.md`, ~760 lines) kept in the retired PLUS-UNO
workspace. The per-component binding logs were working notes and were not
carried over; this ADR is the durable result.
