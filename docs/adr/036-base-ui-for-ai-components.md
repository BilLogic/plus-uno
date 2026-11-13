---
embodiment: ide
summary: PLUS AI components use Base UI (@base-ui/react, pinned) as their headless behavior layer, styled with SCSS on --ds-* tokens; Assistant UI is gone, later widened by ADR-037 and corrected by ADR-042 to remove Bootstrap (2026-11-03)
status: active-with-correction
verified: 2026-11-13
---

# ADR-036: Base UI for AI components (2026-11-03)

> **Correction (2026-11-13).** [ADR-042](042-plus-ships-no-bootstrap.md) removes Bootstrap from all product UI; the Bootstrap fallback below is historical. Base UI remains the behavior layer under ADR-037.

**Decision.** Components for AI surfaces (chat, streaming messages, tool and result cards, composers) take their behavior from `@base-ui/react`, pinned to exactly `1.7.0`, the version uno-blueprint pins. Base UI is headless: PLUS styles it with SCSS on `--ds-*` tokens, targeting its `data-*` state attributes and the named state tokens. Each AI component wraps Base UI parts; Base UI's behavior is never patched in place. Assistant UI (`@assistant-ui/react`) and Radix do not appear in AI code, and the one Assistant UI importer, the Research Assistant demo, now keeps its thread in plain React state. Every other product surface is unchanged and stays on PLUS components, then React-Bootstrap.

**Why.** uno-blueprint already uses Base UI alone, through vendored shadcn base-nova primitives (its ADR 0014, vendored primitives stay pristine). Using the same library means an AI component designed in one repo reads the same in the other, with one set of accessibility behaviors to trust. Assistant UI brought a runtime, a store and its own message model for a single scripted demo; plain state does the same job with less to learn, and a headless layer keeps the look entirely in our tokens.

**What is not copied from uno-blueprint.** The shadcn component copies and Tailwind. plus-uno takes the headless library and writes the styling itself.

**Relationship to ADR-009.** [ADR-009](009-bootstrap-first-no-alternative-ui-frameworks.md) (Bootstrap first, no alternative UI frameworks) is already marked contradicted. This ADR does not revive or repeal it: it adds one scoped exception, the AI components, and leaves Bootstrap as the framework for the rest of product UI.

**Widened by ADR-037.** [ADR-037](037-base-ui-is-the-behavior-layer-for-every-component.md) extends this decision from AI components to every interactive PLUS component, carrying over the same version pin and styling pattern. This ADR's own reasoning and signature stand as the record of the first, scoped decision.

**What would reopen it.** Base UI dropping a part the AI components rely on, or a breaking major that costs more to follow than to replace; AI components needing patches to Base UI's behavior (the sign the wrapper is the wrong shape); or the AI surface being folded into a framework that brings its own primitives.

— Claude (agent), Nov 2026, on Bill's approval to install `@base-ui/react@1.7.0` and remove `@assistant-ui/react`
