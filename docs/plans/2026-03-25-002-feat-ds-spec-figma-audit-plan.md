---
title: "feat: Design System Spec File Audit via Figma MCP"
type: feat
status: pending
date: 2026-03-25
scope: comprehensive
figma_file: W0qzhXWxFsMwSJzkdV2yal
figma_node: 1-175
depends_on: 2026-03-25-001-feat-session-controls-consolidation-plan
---

# Design System Spec File Audit Plan

Test the agent's ability to audit, analyze, and improve the PLUS design system's Figma spec file by comparing it against the code implementation.

## Context

- **Figma**: `W0qzhXWxFsMwSJzkdV2yal` node `1:175`
- **Scope**: 46 components, 61 forms, 10 structural specs, 9 token categories
- **Depends on**: Session Controls plan findings (MCP capability baseline)

---

## Phase 2.1: Figma Structure Audit

**Mode**: Learning

1. `get_metadata` → page structure, top-level frames, naming conventions
2. `get_design_context` → component tree structure
3. `get_screenshot` → visual reference for current organization
4. `search_design_system` → spot-check known components (Button, Alert, Badge)
5. Document Figma file inventory: sections, component counts, naming conventions

**Success criteria**:
- [ ] Complete page/section inventory
- [ ] Component count documented
- [ ] Naming convention patterns identified
- [ ] Structural issues flagged (empty frames, orphaned components)

---

## Phase 2.2: Code-to-Figma Drift Analysis

**Mode**: Learning

1. Build code component inventory from repo (46 components + 21 form types)
2. For each component, `search_design_system` in Figma
3. Categorize drift: Missing in Figma | Missing in Code | Name Mismatch | Variant Drift | Token Drift | Stale
4. Spot-check token values via `get_variable_defs` against `tokens/*.scss`
5. Produce drift report (table format with severity)

**Rate limiting strategy**: Use `get_metadata` for bulk inventory first, then targeted searches.

**Success criteria**:
- [ ] Every code component checked against Figma
- [ ] Drift categorized per component
- [ ] At least 3 token categories spot-checked
- [ ] Drift report with severity ratings

---

## Phase 2.3: Figma Write Capabilities Test

**Mode**: Maintaining

1. `create_design_system_rules` → encode PLUS token conventions (see `.agent/references/figma-token-mapping.md`)
2. `create_new_file` → create audit report in Figma
3. `add_code_connect_map` → link well-matched components (Button, Alert, Badge) — NOTE: Code Connect not installed, expect limitations
4. Document write capability findings

**Success criteria**:
- [ ] Design system rules created and visible in Figma
- [ ] At least one new file created
- [ ] Write capability limitations documented

---

## Phase 2.4: Improvement Recommendations

1. Grouping/sectioning improvements (align with code directory structure)
2. Naming convention alignment (code ↔ Figma)
3. Missing documentation items (components without specs, missing states)
4. Broken instances cleanup (deleted masters, outdated variants)
5. Write report to `docs/solutions/figma-mcp/`

---

## Phase 2.5: Retrospective

1. Score each MCP tool for audit use (1-5)
2. Document audit workflow and manual intervention needed
3. Write findings via `/uno:compound`
