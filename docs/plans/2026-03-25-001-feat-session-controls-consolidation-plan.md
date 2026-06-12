---
title: "feat: Session Controls Consolidation via Figma MCP (Card #2357)"
type: feat
status: active
date: 2026-03-25
scope: focused
figma_file: V82FbevYtOTP7Cy1d0Dooa
figma_node: 2867-883
prd: https://www.notion.so/plus-tutors/PRD-Session-Controls-Consolidation-328b7cca498280c88cdace8b049e3527
---

# Session Controls Consolidation Plan

Test the full 7-step Figma MCP implement-design workflow by building consolidated session controls from Figma design.

## Context

- **PRD**: Session Controls Consolidation (Card #2357)
- **Figma**: `V82FbevYtOTP7Cy1d0Dooa` node `2867:883`
- **Existing code**: `design-system/src/specs/Toolkit/in-session/elements/SessionControls.stories.jsx`
- **Mode**: Finalization

### Stack
React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10

### MCP Limitation Discovered
`get_design_context` and `get_variable_defs` require Figma desktop app with node selected. `get_screenshot` works from cloud API alone. See `.agent/references/figma-mcp-guide.md` Known Limitations section.

---

## Phase 1.1: Design Extraction

**Objective**: Fetch all design data from Figma and document what the MCP returns.

1. Extract node IDs from URL → fileKey: `V82FbevYtOTP7Cy1d0Dooa`, nodeId: `2867:883`
2. `get_design_context` → component hierarchy, spacing, colors, typography, states
3. `get_screenshot` → visual reference for validation
4. `get_variable_defs` → map Figma variables to PLUS tokens
5. `get_code_connect_suggestions` → check existing code-connect links (expect empty — Code Connect not installed)

**Testing**: Quality/completeness of `get_design_context` output. Enough detail to implement without guessing?

**Success criteria**:
- [ ] Design context returns parseable component hierarchy
- [ ] Screenshot captures both role variants (lead tutor / non-lead tutor)
- [ ] Variable defs mapped to PLUS tokens (or fallback documented)
- [ ] MCP data gaps documented

---

## Phase 1.2: Component Mapping

**Objective**: Map every Figma element to existing PLUS components or identify gaps.

**Mandatory reads**: `.agent/assets/PLUS_CHEAT_SHEET.md`, `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md`

Expected mapping (from PRD):

| Design Element | PLUS Component | Notes |
|---|---|---|
| "Manage session" button | `Button` (filled, primary, small, leadingVisual="gear") | Lead tutor only |
| "..." overflow menu | `Dropdown` with custom trigger | Lead tutor only |
| Overflow menu items | `Dropdown.Item` | Request Tutors, Copy assignments, View session info |
| "Tutor tools" dropdown | `Dropdown` (standard trigger) | Non-lead tutor only |
| Dropdown items | `Dropdown.Item` | Request lead tutor, Copy assignments, View session info |
| Modal (attendance/roster/assignments) | `Modal` | Triggered by "Manage session" |

**Verify component APIs**: Read `Button.jsx`, `Dropdown.jsx`, `Modal.jsx`, existing `SessionControls.stories.jsx`

**Success criteria**:
- [ ] Every visual element maps to existing PLUS component or documented gap
- [ ] All props verified against source (no hallucinated props)
- [ ] Role-based logic documented

---

## Phase 1.3: Implementation

**Objective**: Build consolidated session controls as production-ready React.

**File structure**:
```
design-system/src/specs/Toolkit/in-session/elements/
├── SessionControlsConsolidated/
│   ├── SessionControlsConsolidated.jsx
│   ├── SessionControlsConsolidated.scss
│   ├── SessionControlsConsolidated.stories.jsx
│   └── index.js
```

**Steps**:
1. Implement lead tutor variant (Manage session button + overflow dropdown)
2. Implement non-lead tutor variant (Tutor tools dropdown)
3. Implement manage session modal (attendance/roster/assignments)
4. Apply PLUS tokens (zero hardcoded values)
5. Implement all states (default, hover, focus, active, disabled, dropdown open/closed, modal open/closed)
6. Write Storybook stories (LeadTutorDefault, NonLeadTutorDefault, AllVariations, Interactive)

**Success criteria**:
- [ ] Both role variants render correctly
- [ ] All interactive states work
- [ ] Zero hardcoded visual values
- [ ] PLUS components used (Button, Dropdown, Modal)
- [ ] Storybook stories render without errors
- [ ] Accessible: ARIA labels, keyboard nav, focus management

---

## Phase 1.4: Visual Validation

1. Run Storybook
2. Compare implementation screenshots against Figma screenshot from Phase 1.1
3. Document discrepancies (token errors, layout errors, missing states)
4. Fix critical discrepancies and re-validate

---

## Phase 1.5: Retrospective

1. Score each MCP tool on usefulness (1-5)
2. Document workflow: what worked, what needed manual intervention
3. Write findings to `docs/solutions/figma-mcp/` via `/uno:compound`

---

## Files to Create/Modify

| File | Action |
|---|---|
| `specs/Toolkit/in-session/elements/SessionControlsConsolidated/SessionControlsConsolidated.jsx` | Create |
| `specs/Toolkit/in-session/elements/SessionControlsConsolidated/SessionControlsConsolidated.scss` | Create |
| `specs/Toolkit/in-session/elements/SessionControlsConsolidated/SessionControlsConsolidated.stories.jsx` | Create |
| `specs/Toolkit/in-session/elements/SessionControlsConsolidated/index.js` | Create |
| `specs/Toolkit/in-session/elements/index.js` | Modify (add export) |
