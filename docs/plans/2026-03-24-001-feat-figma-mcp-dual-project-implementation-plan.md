---
title: "feat: Figma MCP dual-project implementation — Session Controls + Design System Audit"
type: feat
status: superseded-by-split
superseded_by:
  - 2026-03-25-001-feat-session-controls-consolidation-plan.md
  - 2026-03-25-002-feat-ds-spec-figma-audit-plan.md
date: 2026-03-24
scope: comprehensive
---

# Figma MCP Dual-Project Implementation Plan

Two parallel projects testing Figma MCP capabilities from opposite directions: Project 1 tests Figma-to-code (design implementation), Project 2 tests code-to-Figma (design system audit and cleanup).

## Context

### Why These Two Projects Together

These projects form a complete round-trip test of the Figma MCP toolchain:
- **Project 1** (Session Controls): Can the agent read a Figma design and produce production React code?
- **Project 2** (DS Spec Cleanup): Can the agent read Figma structure, compare it against code, and suggest/write improvements?

Findings from each project directly inform the other. If `get_design_context` returns poor data for Project 1, that signals Project 2's audit scope must account for Figma file quality. If Project 2 finds major drift between Figma specs and code, Project 1's implementation may need manual correction.

### Stack and Constraints

- React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10
- PLUS design system: 46 components, 61 forms, 10 structural specs, 9 token categories
- Figma MCP tools available: `get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`, `get_code_connect_map`, `get_code_connect_suggestions`, `search_design_system`, `create_design_system_rules`, `create_new_file`, `add_code_connect_map`, `generate_diagram`
- Forbidden: hardcoded colors/spacing/typography, non-Bootstrap UI frameworks, deep imports, FA Pro icons
- Mandatory: PLUS_CHEAT_SHEET.md before any UI code, PLUS_LAYOUT_CHEAT_SHEET.md before page layouts

### Existing Code Baseline

Session controls already exist at:
- `design-system/src/specs/Toolkit/in-session/elements/SessionControls.stories.jsx` — current implementation with `copy assignments`, `manage session`, `view session info` buttons
- `design-system/src/components/Button/` — PLUS Button component (filled, outline, tonal variants)
- `design-system/src/components/Dropdown/` — PLUS Dropdown component
- `design-system/src/components/Modal/` — PLUS Modal component
- `design-system/src/specs/Admin/Session Admin/` — Session admin pages, modals, sections

---

## PROJECT 1: Session Controls Consolidation (Card #2357)

### Goal

Test the full 7-step Figma MCP implement-design workflow by building consolidated session controls from Figma design `V82FbevYtOTP7Cy1d0Dooa` node `2867-883`.

### Phase 1.1: Design Extraction (Estimated: 30 min)

**Objective**: Fetch all design data from Figma and document what the MCP returns.

**Steps**:

1. **Extract node IDs from Figma URL**
   - fileKey: `V82FbevYtOTP7Cy1d0Dooa`
   - nodeId: `2867-883`
   - Check if the node contains child frames that need separate extraction

2. **Fetch design context**
   - Tool: `get_design_context(fileKey="V82FbevYtOTP7Cy1d0Dooa", nodeId="2867-883")`
   - Document: component hierarchy, spacing values, colors, typography, states
   - Record: what data comes back vs what's missing (this is a capability test)

3. **Capture screenshot**
   - Tool: `get_screenshot(fileKey="V82FbevYtOTP7Cy1d0Dooa", nodeId="2867-883")`
   - Save as reference for visual parity validation
   - Note: may need multiple screenshots if the design has multiple states (lead tutor view, non-lead tutor view)

4. **Fetch variable definitions**
   - Tool: `get_variable_defs(fileKey="V82FbevYtOTP7Cy1d0Dooa")`
   - Map Figma variables to PLUS design tokens
   - Document any variables that don't have PLUS token equivalents

5. **Check Code Connect mappings**
   - Tool: `get_code_connect_map(fileKey="V82FbevYtOTP7Cy1d0Dooa")`
   - Tool: `get_code_connect_suggestions(fileKey="V82FbevYtOTP7Cy1d0Dooa", nodeId="2867-883")`
   - See if Figma already has code-connect links to PLUS components

**What we're testing**: Quality and completeness of `get_design_context` output. Does it return enough detail (spacing, colors, typography, states) to implement without guessing? How does it handle role-based variants in a single frame?

**Success criteria**:
- [ ] Design context returns parseable component hierarchy
- [ ] Screenshot captures both role variants (lead tutor / non-lead tutor)
- [ ] Variable defs can be mapped to at least 80% of PLUS tokens used
- [ ] Any gaps in MCP data are documented with fallback approach

**Risks**:
- `get_design_context` may not return enough detail for complex interactive states
- Node ID may point to a frame containing multiple sub-components that need individual extraction
- Fallback: manually inspect Figma via browser and document specs by hand

### Phase 1.2: Component Mapping (Estimated: 45 min)

**Objective**: Map every element from the Figma design to existing PLUS components or identify gaps.

**Steps**:

1. **Read PLUS_CHEAT_SHEET.md** (mandatory before any UI code)
   - File: `.agent/assets/PLUS_CHEAT_SHEET.md`

2. **Read PLUS_LAYOUT_CHEAT_SHEET.md** (mandatory for layout decisions)
   - File: `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md`

3. **Map design nodes to PLUS components**

   Expected mapping based on PRD:

   | Design Element | PLUS Component | Notes |
   |---|---|---|
   | "Manage session" button | `Button` (filled, primary, small, leadingVisual="gear") | Lead tutor only |
   | "..." overflow menu | `Dropdown` with custom trigger | Lead tutor only |
   | Overflow menu items | `Dropdown.Item` | Request Tutors, Copy assignments, View session info |
   | "Tutor tools" dropdown | `Dropdown` (standard trigger) | Non-lead tutor only |
   | Dropdown items | `Dropdown.Item` | Request lead tutor, Copy assignments, View session info |
   | Modal (attendance/roster/assignments) | `Modal` | Triggered by "Manage session" |

4. **Verify component APIs**
   - Read `Button/Button.jsx` for exact props (text, style, fill, size, leadingVisual, onClick)
   - Read `Dropdown/Dropdown.jsx` for exact props and composition pattern
   - Read `Modal/Modal.jsx` for exact props and slot pattern
   - Read existing `SessionControls.stories.jsx` to understand current implementation

5. **Identify gaps**
   - Does the design require any component that doesn't exist in PLUS?
   - Does the overflow "..." trigger exist as a Button variant?
   - Does the modal content (attendance, roster, assignments tabs) map to existing specs?

**What we're testing**: How accurately the agent can translate Figma design context into a PLUS component mapping without hallucinating props or components.

**Success criteria**:
- [ ] Every visual element maps to an existing PLUS component or a documented gap
- [ ] All component props verified against source code (no hallucinated props)
- [ ] Role-based rendering logic documented (lead tutor vs non-lead tutor)

### Phase 1.3: Implementation (Estimated: 2-3 hours)

**Objective**: Build the consolidated session controls as production-ready React components.

**Steps**:

1. **Create new component structure**

   ```
   design-system/src/specs/Toolkit/in-session/elements/
   ├── SessionControlsConsolidated/
   │   ├── SessionControlsConsolidated.jsx
   │   ├── SessionControlsConsolidated.scss
   │   ├── SessionControlsConsolidated.stories.jsx
   │   └── index.js
   ```

   Rationale: New component alongside existing `SessionControls.stories.jsx` to allow A/B comparison. The old file stays until migration is confirmed.

2. **Implement lead tutor variant**
   - "Manage session" button (Button, filled, primary)
   - "..." overflow dropdown (Dropdown with icon-only trigger)
   - Overflow items: Request Tutors, Copy assignments, View session info
   - Button click opens modal with attendance/roster/assignments content

3. **Implement non-lead tutor variant**
   - "Tutor tools" dropdown (Dropdown, standard text trigger)
   - Items: Request lead tutor, Copy assignments, View session info

4. **Implement manage session modal**
   - Modal with tabs or sections for attendance, roster, assignments
   - Match Figma layout using PLUS Modal + internal layout tokens

5. **Apply tokens**
   - All spacing from PLUS spacing tokens
   - All colors from PLUS color tokens
   - All typography from PLUS typography tokens/classes
   - No hardcoded values

6. **Implement all states**
   - Default, hover, focus, active, disabled
   - Dropdown open/closed
   - Modal open/closed
   - Copy assignments success feedback (existing pattern from current SessionControls)

7. **Storybook stories**
   - `LeadTutorDefault` — default state for lead tutor
   - `LeadTutorOverflowOpen` — overflow dropdown expanded
   - `LeadTutorModalOpen` — manage session modal visible
   - `NonLeadTutorDefault` — default state for non-lead tutor
   - `NonLeadTutorDropdownOpen` — tutor tools dropdown expanded
   - `AllVariations` — all states side by side
   - `Interactive` — fully wired up with state management

**What we're testing**: Can the agent produce pixel-accurate, token-compliant, accessible React code from Figma MCP data? Where does it fall short?

**Success criteria**:
- [ ] Both role variants render correctly
- [ ] All interactive states work (dropdown open/close, modal open/close, copy feedback)
- [ ] Zero hardcoded visual values — all from DS tokens
- [ ] PLUS components used (Button, Dropdown, Modal) — no custom primitives
- [ ] Storybook stories render without errors
- [ ] Accessible: ARIA labels, keyboard navigation, focus management

**Risks**:
- Modal content (attendance/roster/assignments) may not be fully specified in the Figma node — may need additional node extraction
- Overflow "..." pattern may not have a direct PLUS Button variant — may need icon-only button pattern
- Fallback: Use React-Bootstrap Dropdown with PLUS token styling if PLUS Dropdown lacks needed features

### Phase 1.4: Visual Validation (Estimated: 30 min)

**Objective**: Compare implementation against the Figma screenshot.

**Steps**:

1. **Run Storybook** (`npm run storybook`)
2. **Capture implementation screenshots** via browser or Playwright MCP
3. **Compare side-by-side** against Figma screenshot from Phase 1.1
4. **Document discrepancies** — categorize as:
   - Token mapping errors (wrong color/spacing/typography)
   - Layout errors (wrong flex direction, alignment, gap)
   - Missing states or interactions
   - Intentional deviations (where PLUS DS conventions override Figma)
5. **Fix critical discrepancies** and re-validate

**What we're testing**: Visual parity achievable through the MCP workflow. Is the agent's output "close enough" or does it require significant manual correction?

**Success criteria**:
- [ ] No token mapping errors
- [ ] Layout matches Figma within reasonable tolerance (2-4px)
- [ ] All states present and visually correct
- [ ] Discrepancies documented with root cause (MCP data gap vs agent error vs DS constraint)

### Phase 1.5: Retrospective (Estimated: 30 min)

**Objective**: Document capabilities and limitations discovered.

**Steps**:

1. **Score each MCP tool** on usefulness (1-5):
   - `get_design_context`: Did it provide enough detail?
   - `get_screenshot`: Was it usable for validation?
   - `get_variable_defs`: Did variables map to tokens?
   - `get_code_connect_suggestions`: Were suggestions accurate?

2. **Document the workflow** — what worked, what didn't, what needed manual intervention

3. **Write findings to `docs/solutions/figma-mcp/`** via `/uno:compound`

4. **Create actionable recommendations** for improving the Figma-to-code pipeline

---

## PROJECT 2: Design System Spec File Cleanup

### Goal

Test the agent's ability to audit, analyze, and improve the PLUS design system's Figma spec file (`W0qzhXWxFsMwSJzkdV2yal` node `1-175`) by comparing it against the code implementation.

### Phase 2.1: Figma Structure Audit (Estimated: 1 hour)

**Objective**: Understand the current structure and organization of the Figma spec file.

**Steps**:

1. **Fetch file metadata**
   - Tool: `get_metadata(fileKey="W0qzhXWxFsMwSJzkdV2yal")`
   - Document: page structure, top-level frames, naming conventions
   - Record: total number of pages, frames, components

2. **Fetch design context for root node**
   - Tool: `get_design_context(fileKey="W0qzhXWxFsMwSJzkdV2yal", nodeId="1-175")`
   - Map the component tree structure

3. **Capture screenshot of spec overview**
   - Tool: `get_screenshot(fileKey="W0qzhXWxFsMwSJzkdV2yal", nodeId="1-175")`
   - Visual reference for current organization

4. **Search design system for PLUS rules**
   - Tool: `search_design_system(fileKey="W0qzhXWxFsMwSJzkdV2yal", query="PLUS")`
   - Check if any design system rules already exist
   - Tool: `search_design_system(fileKey="W0qzhXWxFsMwSJzkdV2yal", query="Button")`
   - Spot-check a few known components

5. **Document Figma file inventory**
   - List all top-level sections/pages
   - Count components per section
   - Note naming conventions used in Figma vs code

**What we're testing**: How much structural information `get_metadata` and `get_design_context` can extract from a spec file. Can the agent build a complete inventory from MCP data alone?

**Success criteria**:
- [ ] Complete page/section inventory of the Figma spec file
- [ ] Component count from Figma documented
- [ ] Naming convention patterns identified
- [ ] Any structural issues (empty frames, orphaned components) flagged

**Risks**:
- `get_metadata` may return very large payloads for complex files — may need to paginate or target specific pages
- Node `1-175` may be a single page, not the full file — may need to discover other pages
- Fallback: Use `get_screenshot` on individual pages to visually inventory

### Phase 2.2: Code-to-Figma Drift Analysis (Estimated: 2 hours)

**Objective**: Compare the 46 components, 61 forms, and 9 token categories in code against what's documented in Figma.

**Steps**:

1. **Build code component inventory** from the repo

   Components (from `design-system/src/components/`):
   ```
   Accordion, Alert, Badge, Breadcrumb, Button, ButtonGroup, Card,
   Carousel, Collapse, CompetencyBadge, Divider, Dropdown, Footer,
   Jumbotron, ListGroup, LoadingGif, Logo, MediaObject, Modal,
   NavPills, NavTabs, Navbar, PageLayout, Pagination, Popover,
   Progress, RichTextEditor, Scrollspy, Section,
   SessionAvailabilitySnackbar, SessionManagementSnackbar, Sidebar,
   SidebarTab, Spinner, StaticBadgeSmart, SuperCompPill, Table,
   Toast, Tooltip, UserAvatar
   ```

   Forms (from `design-system/src/forms/`):
   ```
   Cascader, Checkbox, ChoiceGrid, DateAndTimePicker, DatePicker,
   FileUpload, Input, InputGroup, MultipleChoice, NumberInput,
   OptionList, Radio, RadioButtonGroup, Range, Rating, Select,
   SelectMultiple, Switch, TagInput, Textarea, TextareaVer2
   ```

2. **For each component, search Figma spec file**
   - Tool: `search_design_system(fileKey="W0qzhXWxFsMwSJzkdV2yal", query="{component_name}")`
   - Record: found/not found, naming match, variant coverage

3. **Categorize drift**

   | Category | Definition |
   |---|---|
   | Missing in Figma | Component exists in code but not in spec file |
   | Missing in Code | Component exists in Figma but not implemented |
   | Name Mismatch | Same component, different name between code and Figma |
   | Variant Drift | Component exists in both, but variants don't match |
   | Token Drift | Figma uses values that don't match code token values |
   | Stale | Figma component is outdated (old variants, deprecated states) |

4. **Spot-check token values**
   - Tool: `get_variable_defs(fileKey="W0qzhXWxFsMwSJzkdV2yal")`
   - Compare Figma variable values against `design-system/src/tokens/*.scss`
   - Focus on the 9 token categories: colors, spacing, typography, elevation, radius, opacity, breakpoints, z-index, transitions

5. **Produce drift report**
   - Table format: Component | Code Status | Figma Status | Drift Type | Severity | Notes
   - Prioritize by severity (blocking > significant > minor > cosmetic)

**What we're testing**: Can the agent systematically compare two sources of truth (code repo vs Figma file) using MCP tools? How many `search_design_system` calls are needed? What's the accuracy?

**Success criteria**:
- [ ] Every code component checked against Figma (46 components + 21 form types)
- [ ] Drift categorized for each component
- [ ] At least 3 token categories spot-checked for value drift
- [ ] Drift report produced with severity ratings

**Risks**:
- `search_design_system` may not find components that use different naming in Figma
- Rate limiting on MCP calls — 67+ searches may hit limits
- Fallback: Batch searches (e.g., search broad categories), use `get_metadata` to get all component names at once, then cross-reference

### Phase 2.3: Figma Write Capabilities Test (Estimated: 1 hour)

**Objective**: Test the agent's ability to write to Figma via MCP tools.

**Steps**:

1. **Test `create_design_system_rules`**
   - Tool: `create_design_system_rules(fileKey="W0qzhXWxFsMwSJzkdV2yal", rules=[...])`
   - Encode PLUS conventions as Figma design system rules:
     - Color token naming convention
     - Spacing scale
     - Typography scale
     - Component naming pattern (PascalCase)
     - State naming pattern (default, hover, focus, active, disabled)
   - Verify rules appear in Figma

2. **Test `create_new_file`**
   - Tool: `create_new_file(name="PLUS DS Audit Report", ...)`
   - Create a new Figma file with a summary of the drift analysis
   - Test what content types can be written (text, frames, annotations)

3. **Test `add_code_connect_map`**
   - Tool: `add_code_connect_map(fileKey="W0qzhXWxFsMwSJzkdV2yal", ...)`
   - Link a few Figma components to their code counterparts
   - Start with well-matched components (Button, Alert, Badge)

4. **Test `generate_diagram`**
   - Tool: `generate_diagram(fileKey="W0qzhXWxFsMwSJzkdV2yal", ...)`
   - Generate a component relationship diagram
   - Test if it can visualize the component hierarchy

5. **Document write capability findings**
   - What can be written: text, frames, annotations, rules, links?
   - What cannot be written: complex layouts, component instances, styles?
   - Quality of output: does it look good in Figma or need manual cleanup?

**What we're testing**: Figma MCP's write capabilities. Can the agent not just read but also improve the Figma file? What are the limits?

**Success criteria**:
- [ ] Design system rules created and visible in Figma
- [ ] At least one new file created with meaningful content
- [ ] At least 3 code-connect mappings established
- [ ] Write capability limitations documented

**Risks**:
- Write tools may require specific Figma permissions not currently configured
- `create_new_file` may create a file in the wrong Figma project/team
- `create_design_system_rules` may overwrite existing rules
- Fallback: Document what the rules/content should be, and apply manually in Figma

### Phase 2.4: Improvement Recommendations (Estimated: 1 hour)

**Objective**: Produce actionable recommendations for improving the Figma spec file.

**Steps**:

1. **Grouping and sectioning improvements**
   - Based on Phase 2.1 audit, recommend restructuring
   - Align Figma page/section structure with code directory structure:
     - `components/` (46 items) -> dedicated page or section
     - `forms/` (21 items) -> dedicated page or section
     - `specs/` (by domain: Admin, Toolkit, Home, Login, etc.) -> separate pages
     - `tokens/` (9 categories) -> reference page

2. **Naming convention alignment**
   - Map all Figma naming inconsistencies found in Phase 2.2
   - Recommend standardized naming pattern matching code

3. **Missing documentation**
   - Components in code without Figma specs
   - States not represented in Figma (loading, error, empty)
   - Responsive variants not documented

4. **Broken instances cleanup**
   - Components that reference deleted or moved masters
   - Outdated variants that no longer exist in code
   - Detached instances that should be re-linked

5. **Write report to docs/solutions/**

**What we're testing**: Can the agent synthesize audit data into actionable recommendations? Is the analysis quality high enough to act on without manual review?

**Success criteria**:
- [ ] Sectioning recommendations with rationale
- [ ] Naming convention mapping table
- [ ] Prioritized list of missing documentation items
- [ ] Broken instance inventory (if detectable via MCP)

### Phase 2.5: Retrospective (Estimated: 30 min)

**Objective**: Document audit capabilities and limitations discovered.

**Steps**:

1. **Score each MCP tool for audit use** (1-5):
   - `get_metadata`: Coverage of file structure?
   - `search_design_system`: Accuracy for component matching?
   - `get_variable_defs`: Completeness for token comparison?
   - `create_design_system_rules`: Usefulness for encoding conventions?
   - `create_new_file`: Practical for documentation output?
   - `add_code_connect_map`: Reliable for linking code to design?

2. **Document the audit workflow** — steps, time per step, manual intervention needed

3. **Write findings to `docs/solutions/figma-mcp/`** via `/uno:compound`

---

## Dependencies Between Projects

```
Project 1 (Phase 1.1)  ──→  Project 2 (Phase 2.2)
   Design extraction          Informs what "good" Figma data looks like
   quality findings            for audit benchmarking

Project 2 (Phase 2.2)  ──→  Project 1 (Phase 1.3)
   Drift analysis              Reveals if session control components
   of existing specs           have Figma-code mismatches to watch for

Project 1 (Phase 1.5)  ──→  Project 2 (Phase 2.5)
   Implementation retro        Combined retrospective on full
                               MCP capability assessment

Project 2 (Phase 2.3)  ──→  Project 1 (Phase 1.4)
   Write capabilities          If code-connect works, link the
   test results                new session controls to Figma
```

**Recommended execution order**:
1. Project 1, Phase 1.1 (design extraction) — establishes MCP baseline
2. Project 2, Phase 2.1 (structure audit) — tests same tools on different file
3. Project 2, Phase 2.2 (drift analysis) — while P1 findings are fresh
4. Project 1, Phase 1.2 + 1.3 (mapping + implementation) — informed by drift findings
5. Project 2, Phase 2.3 (write capabilities) — independent, can run anytime
6. Project 1, Phase 1.4 (validation) — needs implementation complete
7. Project 2, Phase 2.4 (recommendations) — needs all data
8. Both Phase 1.5 + 2.5 (retrospectives) — final step, combined

---

## Effort Summary

| Phase | Project | Estimated Time | Blocking? |
|---|---|---|---|
| 1.1 Design Extraction | P1 | 30 min | Yes — gates all P1 work |
| 1.2 Component Mapping | P1 | 45 min | Yes — gates implementation |
| 1.3 Implementation | P1 | 2-3 hours | Yes — core deliverable |
| 1.4 Visual Validation | P1 | 30 min | No — can iterate |
| 1.5 Retrospective | P1 | 30 min | No |
| 2.1 Structure Audit | P2 | 1 hour | Yes — gates drift analysis |
| 2.2 Drift Analysis | P2 | 2 hours | Yes — core deliverable |
| 2.3 Write Capabilities | P2 | 1 hour | No — independent test |
| 2.4 Recommendations | P2 | 1 hour | No — synthesis step |
| 2.5 Retrospective | P2 | 30 min | No |
| **Total** | Both | **~9-10 hours** | |

---

## Files That Will Be Created or Modified

### Project 1

| File | Action |
|---|---|
| `design-system/src/specs/Toolkit/in-session/elements/SessionControlsConsolidated/SessionControlsConsolidated.jsx` | Create |
| `design-system/src/specs/Toolkit/in-session/elements/SessionControlsConsolidated/SessionControlsConsolidated.scss` | Create |
| `design-system/src/specs/Toolkit/in-session/elements/SessionControlsConsolidated/SessionControlsConsolidated.stories.jsx` | Create |
| `design-system/src/specs/Toolkit/in-session/elements/SessionControlsConsolidated/index.js` | Create |
| `design-system/src/specs/Toolkit/in-session/elements/index.js` | Modify (add export) |
| `design-system/src/specs/Toolkit/in-session/modals/ManageSessionModal/ManageSessionModal.jsx` | Create (if modal content is in Figma) |
| `design-system/src/specs/Toolkit/in-session/modals/ManageSessionModal/ManageSessionModal.scss` | Create (if modal content is in Figma) |
| `design-system/src/specs/Toolkit/in-session/modals/ManageSessionModal/ManageSessionModal.stories.jsx` | Create (if modal content is in Figma) |

### Project 2

| File | Action |
|---|---|
| `docs/solutions/figma-mcp/figma-mcp-audit-findings.md` | Create |
| `docs/solutions/figma-mcp/figma-mcp-implementation-findings.md` | Create |
| `docs/solutions/figma-mcp/drift-report.md` | Create |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Figma MCP returns insufficient design detail | Medium | High | Fall back to manual Figma inspection; document gaps for MCP feedback |
| Rate limiting on MCP calls during drift analysis (67+ searches) | Medium | Medium | Batch searches; use `get_metadata` for bulk inventory first |
| Write tools require permissions not configured | Medium | Medium | Document intended writes; apply manually in Figma |
| Session controls Figma design has undocumented states | Low | Medium | Extract additional nodes if child frames exist; ask designer |
| Token drift is too extensive to map in time budget | Low | High | Prioritize top 3 token categories (colors, spacing, typography) |
| New component conflicts with existing SessionControls | Low | Low | Use separate directory (SessionControlsConsolidated); coexist |

---

## Execution Notes for `/ce:work`

### Starting Project 1
```
Mode: Finalization
Figma file: V82FbevYtOTP7Cy1d0Dooa, node: 2867-883
Mandatory reads before coding:
  - .agent/assets/PLUS_CHEAT_SHEET.md
  - .agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md
  - design-system/src/components/Button/Button.jsx
  - design-system/src/components/Dropdown/Dropdown.jsx
  - design-system/src/components/Modal/Modal.jsx
  - design-system/src/specs/Toolkit/in-session/elements/SessionControls.stories.jsx
```

### Starting Project 2
```
Mode: Learning (phases 2.1-2.2) then Maintaining (phases 2.3-2.4)
Figma file: W0qzhXWxFsMwSJzkdV2yal, node: 1-175
Mandatory reads before audit:
  - .agent/assets/components-index.json
  - design-system/src/components/ (directory listing)
  - design-system/src/forms/ (directory listing)
  - design-system/src/tokens/ (directory listing)
```
