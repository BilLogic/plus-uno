---
embodiment: ide
summary: Static hi-fi mockup on the design system — Figma MCP with DS components and tokens, no coded build
---

<!-- ~350 tokens | Load when: the confirmed deliverable is a static hi-fi mockup (high Visual, none–low Interaction, mid–high Data/Content) -->

# Deliverable — static hi-fi mockup

High Visual with none–low Interaction routes here, rather than to a coded build
in `prototypes/`. The goal is to evaluate visual direction, hierarchy, or
realistic content on the design system without building working state.

**Execution mode: MCP-direct on the design system.** UNO composes static frames
in Figma using bound DS components and variables via **writers/figma**
(`docs/connectors/figma/overview.md` — file placement, page sections,
annotations).

## 1. Load the Figma registries first

Follow `design-system/guidelines/figma/registry-load-gate.md`:

- Load `design-system/figma/component-registry.json` and
  `design-system/figma/token-registry.json` before touching Figma.
- Follow `design-system/guidelines/figma/component-alignment.md` so every
  component instance and variable binding matches `uno-storybook`.

## 2. Plan against the brief card (Step 3)

Open the plan by restating the confirmed brief card (goal & audience ·
designer's words · the five fidelity dials · deliverable · won't include). Name:

- The screens in scope (matching the **Breadth** and **Depth** dials).
- The template and pattern structure (`design-system/guidelines/overview.md`).
- The DS components from `component-registry.json` and token roles from
  `token-registry.json`.
- Realistic copy and production-shaped sample data (matching the **Data/Content**
  dial — real labels and representative rows, zero placeholder lorem).
- The explicit exclusions from the brief card.

Confirm the plan with the designer before writing to Figma.

## 3. Produce on the Figma canvas (Step 4)

Summon **writers/figma** to assemble the static screens from DS component
instances and bound variables. Keep interactions static — no prototype noodles,
no coded scaffold in `prototypes/`. If Figma MCP is unavailable in the current
session, halt and ask for the target file or hand off a static screen spec
rather than escalating to a coded build.

## Exit

Method §5: DS-lens pass at visual/token/component rigor · one-line artifact
manifest (fidelity dials · tools · PRD link) · hand to `skills/uno-review`.
