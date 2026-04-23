---
name: uno-plan
description: >
  This is a planning skill used before implementation. It scopes features,
  plans implementations, and creates structured briefs that bridge product
  ideas to prototype execution. Use when the user asks "How should we build...",
  "Plan this...", "Scope this...", or needs a structured implementation plan
  before prototyping.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Write
---

# Plan & Scope

Create structured implementation plans that bridge research findings to prototype execution.

## When to Use

- The user asks "How should we build...", "Plan this...", "Scope this..."
- Feature planning or implementation strategy is needed
- Translating a product idea into concrete file paths, components, and tokens
- Preparing a brief for `/uno:prototype` execution

## Auto-Suggest

Proactively suggest this skill when:
- `/uno:research` completed and follow-up building is needed
- The user describes a feature but jumps straight to code without a plan
- The scope is unclear: multiple components, pages, or token choices involved
- Before `/uno:prototype` when the feature touches more than one component

Do not suggest if the user has a simple, single-component task with obvious implementation.

## Tier 2 Context (~4K tokens budget)

Load on-demand based on the planning scope:

| Trigger | Load |
|---------|------|
| Any plan | `docs/context/conventions/tech-stack.md` |
| Layout/page planning | `docs/context/design-system/foundations/*` |
| Component selection | `docs/context/design-system/components/inventory.md` |
| Token selection | `docs/context/design-system/foundations/tokens.md` → `styles/` |
| Research handoff exists | `.agent/handoffs/briefs/{relevant-brief}.md` |
| Layout / IA unclear | `references/consulting.md` |

Stay within ~4K tokens of Tier 2 context. Load foundations first, then specifics.

## Workflow

### Step 1: Ingest Research (if available)

Check `.agent/handoffs/briefs/` for a research brief related to this feature. If one exists, read it to inherit findings, gaps, and recommendations. If none exists, proceed with what the user provides.

### Step 2: Load Design System Constraints

Read the design system foundations to understand structural boundaries:
- Layout patterns and grid system
- Spacing hierarchy and section rhythm
- Typography scale and hierarchy rules

These constrain what is possible — the plan must work within them.

### Step 3: Load Tech Stack Boundaries

Read `docs/context/conventions/tech-stack.md` to confirm:
- Allowed libraries and frameworks
- Import conventions and alias usage
- File naming and directory structure patterns

### Step 4: Identify Components Needed

Check `docs/context/design-system/components/inventory.md` to determine:
- Which existing components cover the feature's needs
- Which components need composition (combining existing ones)
- Whether any new components would be required (flag for discussion)

For each component identified, note:
- Component name and import path
- Relevant props (verify against source later in prototype phase)
- Composition pattern if combining multiple components

### Step 5: Identify Tokens Needed

Check `docs/context/design-system/foundations/tokens.md` and related style files to determine:
- Color tokens for the feature context (surface, on-surface, accent)
- Spacing tokens at the correct hierarchy level (element, card, section, page)
- Typography tokens for headings, body, labels
- Any elevation or radius tokens needed

### Step 6: Create Implementation Plan

Assemble findings into a structured plan with:
- File paths to create or modify
- Component usage with composition patterns
- Token references for all visual values
- Implementation steps in execution order
- Open questions or decisions that need user input

## Output Format

Present the plan as a structured brief:

```
## Implementation Plan: {feature name}

### Scope
- {1-2 sentence summary of what will be built}
- Fidelity: {low / mid / high}
- Product pillar: {admin / home / toolkit / training / profile / login / universal}

### Assumptions (Optional)
- {assumption 1}
- {assumption 2}
- {assumption 3}

### Components
| Component | Source | Usage |
|-----------|--------|-------|
| {name} | `{import path}` | {how it's used in this feature} |

### Tokens
| Category | Token | Usage |
|----------|-------|-------|
| Color | `{token name}` | {what it colors} |
| Spacing | `{token name}` | {what it spaces} |
| Typography | `{token name}` | {what text it styles} |

### File Plan
- `{path/to/file.jsx}` — {what this file does}
- `{path/to/file.scss}` — {what styles it contains}

### Steps
1. {first implementation step}
2. {second implementation step}
3. ...

### Open Questions
- {decision that needs user input before building}
```

## Handoff

After the plan is confirmed by the user:
1. Write the plan to `.agent/handoffs/plans/{feature-slug}.md`
2. Suggest `/uno:prototype` to begin execution

If the user wants to iterate on the plan, revise in place before writing the handoff.

## Constraints

- **No code generation**: This skill produces plans, not implementations. It does not write JSX, SCSS, or any runtime code.
- **No file creation** (except handoff plans): Do not create components, pages, or config files.
- **No assumptions about props**: Note which components are needed but defer prop verification to the prototype phase.
- **Respect inventory**: If a needed component does not exist in the inventory, flag it as a gap — do not plan to create it without discussion.
- **Concrete paths**: Every file reference in the plan must be a real path or a clearly marked new-file proposal.

## Not for Use

- Do NOT use for:
  - Small UI tweaks or single-component changes
  - Direct implementation or coding requests
  - Debugging or fixing issues

## Failure Handling

- If research context is missing → proceed with user input but clearly note assumptions.
- If component inventory is insufficient → flag as a gap and ask for discussion.
- If token selection is unclear → propose best-fit options and confirm with the user.

## Next Step

After completing the plan:
- If the user approves → Suggest `/uno:prototype` to scaffold and build.
- If gaps were found → Suggest `/uno:research` for deeper investigation.
- If the plan reveals DS gaps → Note them for future `/uno:compound` documentation.

These are suggestions — the user may choose to skip steps.
