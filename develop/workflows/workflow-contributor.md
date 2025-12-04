# WORKFLOW: CONTRIBUTOR (MAINTAINER)

**ROLE**: Maintainer / System Engineer
**GOAL**: Update, Refactor, or Fix the Design System.

## PROTOCOL: SYSTEM_UPDATE

### STEP 1: SCOPE_IDENTIFICATION
**INPUT**: User Request
**PROCESS**: Identify the Target Scope.

| Target | Path | Action |
| :--- | :--- | :--- |
| **Component** | `design-system/components/{Name}/` | Update Logic/UI |
| **Spec** | `design-system/specs/{Pillar}/` | Update Template |
| **Token** | `design-system/styles/` | Update Foundation |
| **Asset** | `design-system/assets/` | Update Resource |

### STEP 2: BRANCHING_STRATEGY
**COMMAND**: `git checkout -b {type}/{name}`
*   `feat/`: New component or feature.
*   `fix/`: Bug fix.
*   `refactor/`: Code cleanup.

### STEP 3: IMPLEMENTATION_RULES
**CONSTRAINT**: **STRICT ADHERENCE** to Standards.
1.  **DESIGN**: **MUST** check [Figma Handoff Guide](../guides/figma-workflow.md).
2.  **TOKENS**: **MUST** use Semantic Tokens. No hardcoded values.
3.  **REUSE**: **MUST** extend existing components. No duplication.
4.  **DOCS**: **MUST** update `develop/patterns/*.md` if API changes.

### STEP 4: VERIFICATION
**PROCESS**:
1.  **STORYBOOK**: Verify changes in isolation.
2.  **TEST**: Run automated tests `npm test`.
3.  **BROWSER**: Manual check via `npm run serve`.

## CHEATSHEET: FILE_STRUCTURE

*   **Components**: `design-system/components/` (Flat Structure)
*   **Specs**: `design-system/specs/` (Page Templates)
*   **Styles**: `design-system/styles/` (Tokens)
