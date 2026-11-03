---
embodiment: ide
summary: Base UI (@base-ui/react, pinned per ADR-036) is the headless behavior layer for every interactive PLUS component, not just AI surfaces; supersedes ADR-009, widens ADR-036 (2026-11-03)
status: active
verified: 2026-11-03
---

# ADR-037: Base UI is the behavior layer for every component (2026-11-03)

**Decision.** Every interactive PLUS component — buttons, fields, dialogs, menus, tooltips, anything with open/closed state, focus management, or keyboard interaction — takes its behavior from `@base-ui/react`, pinned to the version ADR-036 names. PLUS styles it with SCSS on `--ds-*` tokens, targeting its `data-*` state attributes and the named state tokens, the same pattern ADR-036 set for AI components. PLUS components first, then Base UI for the behavior underneath; React-Bootstrap is no longer the fallback for an interactive component's behavior. Bootstrap markup stays available for non-interactive layout where no Base UI part applies.

**Why.** ADR-036 scoped Base UI to AI surfaces because that was the component family in flight. The same case holds for every interactive component: one accessibility implementation to trust instead of React-Bootstrap's, a headless layer that keeps the look entirely in PLUS tokens, and one behavior library across the whole design system instead of two.

**Relationship to ADR-009.** [ADR-009](009-bootstrap-first-no-alternative-ui-frameworks.md) (Bootstrap first, no alternative UI frameworks) is superseded by this decision: Bootstrap no longer stands as the fallback source of interactive behavior. It continues to describe what it already did — no Material UI, no Ant Design, FA Free only — those parts stand.

**Relationship to ADR-036.** [ADR-036](036-base-ui-for-ai-components.md) (Base UI for AI components) is widened, not replaced: its reasoning and version pin carry over to every interactive component, not only AI surfaces.

**What would reopen it.** Base UI dropping a part an existing component relies on, or a breaking major that costs more to follow than to replace; a component needing patches to Base UI's behavior (the sign the wrapper is the wrong shape); or a migration cost that outweighs the one-library benefit for components that are stable and rarely touched.

— Claude (agent), Nov 2026, on Bill's approval to make Base UI the default behavior layer
