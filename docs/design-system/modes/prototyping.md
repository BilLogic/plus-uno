# Prototyping Mode Reference

## When to Use This Mode
- Validate a specific feature or flow with high-fidelity visuals but low engineering cost.
- Build a "throwaway" proof-of-concept to test an idea before production engineering.
- "Make it work, make it look right, ignore the wiring."

### Decision Tree
- If you need to **ship** to production: use Finalization Mode.
- If you need to **explore** multiple options: use Iteration Mode.
- If you need to **validate** one specific idea with high fidelity: use Prototyping Mode.

## Design Constraints
- **Visuals**: High Fidelity. Must look indistinguishable from production. When a reference (Figma link, screenshot, etc.) is provided, you MUST directly analyze the visual structure, layout, typography, and spacing of that reference and replicate it as exactly as possible using the design tokens. Do not guess or substitute generic layouts. **CRITICAL**: AI agents cannot natively view authenticated Figma URLs. If you are given a Figma link and you cannot access it, you MUST immediately STOP proceeding and tell the designer you cannot access it, asking them to provide a screenshot of the target Figma frame instead.
- **Environment Rigor**: Even isolated prototypes MUST include `bootstrap/dist/css/bootstrap.min.css` in their entry point, load PLUS Google Fonts (Lato, Merriweather Sans, Open Sans) in `index.html`, and apply base token properties (like `var(--font-family-body)`) to the root wrapper. **CRITICAL**: The `bootstrap.min.css` file MUST be imported *before* `@plus-ds/styles/main.scss` in your React entry point (e.g. `index.jsx`). This ensures the CSS cascade correctly allows the Design System rules to trump default Bootstrap rules.
- **MANDATORY INVENTORY CHECK (COMPONENTS & TEMPLATES):** Before writing *any* custom UI code or layout, you MUST explicitly take inventory of what is already provided by the PLUS Design System. 
  1. **Token/Component Cheat Sheet First:** You MUST start by reading `.agent/assets/PLUS_CHEAT_SHEET.md`. This auto-generated file contains the exact names of every valid exported component. If it's not in the cheat sheet, it doesn't exist.
  2. **Layout Cheat Sheet Second:** You MUST read `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md`. This file contains the exact structural React formulas for building Dashboards, Modals, and Cards. You must use these exact formulas instead of writing raw HTML divs.
  3. **Templates/Specs Third:** Always check `design-system/src/specs` for pre-built universal layouts, sections, or macro-components (e.g., `TopBar`, `PageLayout`, `Sidebar`). Do not manually assemble micro-components into a layout if a spec template already exists for it.
  4. **Micro-Components Fourth:** Check `design-system/src/components` and `design-system/src/forms` for individual elements. Do not build from scratch if the design system provides the required piece.
- **Components**: STRICT use of PLUS Design System components when available. NEVER use raw HTML/CSS (like `<div>` grids, custom CSS classes for padding/margins, or `<table>` tags) to bypass the design system. If you are asked to replicate a UI, you MUST assemble existing `@plus-ds` components (e.g., `<TopBar>`, `<Badge>`, `<Card>`). If a highly specific component is genuinely missing, build it using default `react-bootstrap` components as a base. Then, customize the `react-bootstrap` code using PLUS design tokens and adapt it to the PLUS component style. You should look at a few other similar existing PLUS components to get a feel for what they look like and ensure stylistic consistency. NEVER fall back to raw custom HTML/CSS for speed.
- **MANDATORY COMPONENT DOCS REVIEW:** Before implementing ANY component from `@plus-ds`, you MUST read its corresponding `*.stories.jsx` AND its `README.md` file (if one exists in the component folder). 
  - The `*.stories.jsx` file is the absolute source of truth for valid prop combinations, variants, and the intended code recipe. 
  - The `README.md` file contains critical architectural rules (e.g., whether a component manages its own overlay). 
  - Never guess a component's props, styling, or structural behavior based purely on its name.
- **ANTI-HALLUCINATION / MANDATORY TOKEN SEARCH:** Before applying ANY design token (color, spacing, typography) to a prototype or component, you MUST consult the `.agent/assets/PLUS_CHEAT_SHEET.md` file. This is the single source of truth auto-compiled from the SCSS files. It is strictly forbidden to use a token without verifying it first.
- **NO GUESSING ALLOWED:** NEVER guess, assume, or hallucinate token names based on general CSS knowledge (e.g. Bootstrap) or other design systems. If you need a spacing variable, you must find it in the Cheat Sheet. If it is not in the Cheat Sheet, tell the user it does not exist.
- **SOURCE OF TRUTH FOR TOKENS:**
  - **Cheat Sheet (Primary):** `.agent/assets/PLUS_CHEAT_SHEET.md`
  - **Colors (Fallback):** `design-system/src/tokens/_colors.scss`
  - **Spacing (Fallback):** `design-system/src/tokens/_spacing_semantics.scss` and `design-system/src/tokens/_primitives.scss`
  - **Typography (Fallback):** `design-system/src/tokens/_fonts.scss`
- **Reference Page Templates:** If you are unsure how to assemble a layout after checking `specs/Universal`, look at how other pages have been constructed in `design-system/src/specs/**/pages/` (e.g., `specs/Toolkit/pre-session/pages`). Think of these existing specification pages as reference templates for structuring UI.
- **Strict Semantic Tokens:** When assembling layouts or filling gaps between design system components, you MUST exclusively use verified semantic tokens from the Source of Truth files for spacing, padding, typography, radius, and color (e.g., `var(--size-section-gap-lg)`, `var(--size-element-pad-x-sm)`, `var(--font-size-body2)`). NEVER hardcode arbitrary px values (like `padding: 12px;` or `font-size: 14px;`) unless explicitly requested as a standalone one-off override.
- **Foundation First (Figma / Screenshots):** When provided with a Figma link or a screenshot, you MUST completely build the foundational static layout first. Ensure the structure, spacing, typography, and visual components match the reference perfectly in a static state before attempting to implement complex React state, interactivity, or modals. Do not jump straight into building interactive pieces if the base layout is not complete.
- **Data**: Mock/Hardcoded data is acceptable and encouraged for speed.
- **State**: Happy path only. Complex loading/error states are optional unless being tested.
- **Location**: Must be built in `playground/prototyping/` (never `design-system`).
- **NEVER BUILD CUSTOM REPLICAS OF EXISTING SPEC COMPONENTS:** If a component already exists in `design-system/src/specs/`, you MUST import and use it directly — even in prototyping mode. Do NOT recreate it as a custom file in your prototype. This applies to all spec-level components, including but not limited to:
  - `SideNavBar` (`specs/Toolkit/post-session/sections/SideNavBar/SideNavBar.jsx`)
  - `FormFeedback` (`specs/Toolkit/post-session/sections/FormFeedback/FormFeedback.jsx`)
  - `TopBar`, `Sidebar`, `PageLayout` (`specs/Universal/`)
  - Any other section or page spec under `specs/`

  **Why this matters:** Custom replicas drift from the real component's styling, dimensions, and token usage — producing visual inconsistencies (wrong padding, wrong widths, wrong selected states) that undermine the prototype's value for design review. The whole point of prototyping mode is to look indistinguishable from production, which requires using the production components.

  **If a spec component doesn't perfectly fit your use case** (e.g., hardcoded labels that don't match your form's sections), import it anyway and adapt your prototype's data/flow to work with it. Flag the gap to the design team as a future improvement (e.g., "SideNavBar should accept tabs as props"). Do NOT build a custom clone to work around it.

  **The only acceptable custom components** in a prototype are domain-specific compositions that don't exist anywhere in the DS — for example, a `StudentCard` composed from `Card` + `UserAvatar` is valid because no student card spec exists. But if a spec exists, use it.

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `.agent/assets/index-manifest.json` and the relevant index file(s).

1. Design tokens (Use Strictly)
- `references/tokens-guide.md`
- `design-system/src/tokens/*.scss`

2. Component Library (Use Strictly)
- `design-system/src/components/**`
- `design-system/src/forms/**`
- `design-system/src/specs/**`

3. Prototyping Playground
- `playground/prototyping/README.md`
- `playground/prototyping/[user-name]/**`

## How to Respond in Prototyping Mode

1. Confirm Scope & Approach
- **STOP and ask for approval** before generating code.
- Explicitly list the shortcuts you plan to take (e.g. "I will hardcode user data", "I will skip error states").
- Confirm the target fidelity (High-Fi visual, Low-Fi engineering).

2. Prioritize Speed & Visuals (The Right Way)
- Use existing PLUS components (e.g., `Table`, `Badge`, `Modal`).
- If a component doesn't exist, use default `react-bootstrap` components as a base. Customize it with PLUS design tokens and match the visual style of existing PLUS components by reviewing them for reference.
- **DO NOT** use raw HTML tags or raw CSS grids as a shortcut for speed.
- Copy-paste code from Storybook examples (`*.stories.jsx`).
- Hardcode props/data to get the visual state immediately.

2. **Skip Engineering Rigor (Intentionally)**
- **No Tests**: Do not write unit tests.
- **No Types**: Loose typing is fine (TS not required).
- **No API Integration**: Mock data locally in the component or file.
- **No Accessibility Deep-Dive**: Basic semantic HTML is enough; skip complex ARIA management unless specifically requested.

3. **Isolate the Code**
- Create a new directory in `playground/prototyping/[user-name]/[feature-name]`.
- Do not modify core `design-system` files.
- Treat this code as "disposable" — it will be rewritten for production.

### Follow-up Questions (Context Gathering)
If not specified in the prompt, ask:
- "Do you have a **target visual design** (Figma/screenshot) to replicate?"
- "What is the primary user flow you want to test? (I will mock everything else)."
- "Do you have specific data scenarios to validate? (e.g. empty state vs. full data)"

## Prototyping Mode Example

**Goal**: Test a new "Quick Add" modal.

**Implementation**:
- Create `playground/prototyping/victor/quick-add/Modal.jsx`.
- Import `Modal`, `Button`, `Input` from `@/components`.
- Hardcode `const user = { name: "Victor" }`.
- hardcode `const onSave = () => alert("Saved!")`.
- **Outcome**: A working, clickable modal in 10 minutes that looks 100% real.
