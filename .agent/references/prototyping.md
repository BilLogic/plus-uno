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
- **Visuals**: High Fidelity. Must look indistinguishable from production.
- **Components**: STRICT use of PLUS Design System components and tokens.
- **Data**: Mock/Hardcoded data is acceptable and encouraged for speed.
- **State**: Happy path only. Complex loading/error states are optional unless being tested.
- **Location**: Must be built in `playground/prototyping/` (never `packages/plus-ds`).

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `.agent/assets/index-manifest.json` and the relevant index file(s).

1. Design tokens (Use Strictly)
- `references/tokens-guide.md`
- `packages/plus-ds/src/tokens/*.scss`

2. Component Library (Use Strictly)
- `packages/plus-ds/src/components/**`
- `packages/plus-ds/src/forms/**`
- `packages/plus-ds/src/specs/**`

3. Prototyping Playground
- `playground/prototyping/README.md`
- `playground/prototyping/[user-name]/**`

## How to Respond in Prototyping Mode

1. **Prioritize Speed & Visuals**
- Use existing PLUS components.
- Copy-paste code from Storybook examples (`*.stories.jsx`).
- Hardcode props/data to get the visual state immediately.

2. **Skip Engineering Rigor (Intentionally)**
- **No Tests**: Do not write unit tests.
- **No Types**: Loose typing is fine (TS not required).
- **No API Integration**: Mock data locally in the component or file.
- **No Accessibility Deep-Dive**: Basic semantic HTML is enough; skip complex ARIA management unless specifically requested.

3. **Isolate the Code**
- Create a new directory in `playground/prototyping/[user-name]/[feature-name]`.
- Do not modify core `packages/plus-ds` files.
- Treat this code as "disposable" — it will be rewritten for production.

## Prototyping Mode Example

**Goal**: Test a new "Quick Add" modal.

**Implementation**:
- Create `playground/prototyping/victor/quick-add/Modal.jsx`.
- Import `Modal`, `Button`, `Input` from `@/components`.
- Hardcode `const user = { name: "Victor" }`.
- hardcode `const onSave = () => alert("Saved!")`.
- **Outcome**: A working, clickable modal in 10 minutes that looks 100% real.
