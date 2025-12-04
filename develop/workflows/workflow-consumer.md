# WORKFLOW: CONSUMER (BUILDER)

**ROLE**: Builder / Prototyper
**GOAL**: Generate production-ready code matching Design System standards.

## ALGORITHM: BUILD_FEATURE

### STEP 1: INPUT_ANALYSIS
**INPUT**: User Request
**PROCESS**:
1.  **CHECK**: Is the request ambiguous? (e.g., "Make a dashboard")
    *   **IF YES**: -> **STOP**. **ASK** clarifying questions.
    *   **IF NO**: -> Continue.
2.  **CHECK**: Is there a Figma link?
    *   **IF YES**: -> **EXECUTE** `mcp_Figma_Desktop_get_design_context`.
    *   **IF NO**: -> **PROPOSE** text-based plan.

### STEP 2: DESIGN_PROPOSAL (PATTERN)
**PROCESS**:
1.  **IDENTIFY Pattern**: Define the high-level design intent (e.g., "I need a *Card Layout* for the user profile").
2.  **SELECT Components**: Map patterns to specific components (e.g., "I will use `createCard`, `createAvatar`, and `createButton`").
3.  **OUTPUT**: Propose this plan to the User. **WAIT** for approval.

### STEP 2.5: LOAD_CONTEXT (REQUIRED)
**PROCESS**:
1.  **READ** `develop/foundations/colors.md` (for color tokens).
2.  **READ** `develop/foundations/typography.md` (for font tokens).
3.  **READ** `develop/foundations/layout.md` (for spacing/radius).
**CRITICAL**: Do not proceed until you have loaded these tokens into context.

### STEP 3: IMPLEMENTATION (COMPONENT)
**CONSTRAINT**: **NEVER** create custom CSS/HTML. **ALWAYS** use `PlusInterface`.
**PROCESS**:
1.  **IMPORT** components from `design-system/components/index.js`.
2.  **ASSEMBLE** using `PlusInterface.create{Component}` (as defined in Pattern Packs).
3.  **STYLE** using Semantic Tokens (`var(--color-*)`, `var(--size-*)`).

## CHEATSHEET: PATTERN_ROUTING

| UI Element | Pattern Pack |
| :--- | :--- |
| **Inputs, Buttons** | `patterns/elements.md` |
| **Cards, Tiles** | `patterns/cards.md` |
| **Sections, Lists** | `patterns/sections.md` |
| **Modals, Alerts** | `patterns/modals.md` |
| **Navbars, Layouts** | `patterns/surfaces.md` |
| **Tables** | `patterns/tables.md` |

## REFERENCE: ASSETS
*   **Images**: Use `https://placehold.co/600x400` or `assets/images/`.
*   **Icons**: Use Font Awesome + Tokens (`var(--font-size-fa-*)`).
