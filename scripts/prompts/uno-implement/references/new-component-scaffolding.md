# New Component Scaffolding Rules

> Auto-loaded by the skill-loader when `isNewComponent` is true. Augments `uno-implement/SKILL.md` with rules for creating a brand-new component from scratch (no existing source files).

You are creating a **new** PLUS design system component from scratch — there's no existing source for this component. The orchestration script provides you with the reference Badge component (in `design-system/src/components/Badge/`) as a canonical pattern. Follow Badge's structure exactly.

## Files to Create

Create all four files in `design-system/src/components/ComponentName/`:

1. **`ComponentName.jsx`** — the React component
   - Use React-Bootstrap as base where appropriate (e.g., `import RBBadge from 'react-bootstrap/Badge'` and wrap)
   - Export as default AND named export
   - Use `PropTypes` for prop validation
   - Apply the `plus-{component-name-kebab}` class prefix to the root element
2. **`ComponentName.scss`** — the styles
   - Use only design tokens (per the Token Mapping Rules in SKILL.md — never hardcode)
   - BEM-like naming: `.plus-{name}`, `.plus-{name}-element`, `.plus-{name}--modifier`
   - Use `@use "sass:map"` if you need SCSS mixins for theme variants
3. **`ComponentName.stories.jsx`** — Storybook stories
   - `title: "Components/ComponentName"` (MANDATORY — places the story in the Components section of the sidebar)
   - Include all Figma variants as stories with proper `argTypes` and `controls`
   - Categorize `argTypes` using `table: { category: 'Design' | 'Content' | 'Behavior' | 'Development' }` per `skills/uno-review/references/storybook.md`
4. **`index.js`** — barrel re-export
   - Re-export the component as default AND named export so consumers can use either `import Badge from '@/components/Badge'` or `import { Badge } from '@/components/Badge'`

## Conventions Specific to New Components

- **Match the reference Badge structure exactly** for the boilerplate parts (imports, exports, basic class structure). Customize the component's actual behavior to match the Figma design.
- **Class names use lowercase + kebab-case** in the `plus-` prefix (e.g., `plus-status-indicator`, not `plus-StatusIndicator`).
- **Stories should include**:
  - A default `Default` story showing the most common usage
  - One story per Figma variant (e.g., `Primary`, `Secondary`, `Disabled`, etc.)
  - A `Playground` story with all controls exposed for interactive exploration
- **No deep imports from other components.** Use `@/components/{X}` barrel imports if you need to compose other DS components.
- **No new package dependencies.** If you think you need one, flag it in the response with a comment block; do NOT add it.

## What the Reference Badge Provides

The orchestration script (`scripts/implement-figma-changes.js`, `getReferenceComponent()` at line 148) reads these files from `design-system/src/components/Badge/` and includes them in your user message:

- `Badge.jsx` — shows React-Bootstrap composition, export pattern, prop spreading
- `Badge.scss` — shows token usage, BEM naming, theme variant mixins
- `Badge.stories.jsx` — shows the `title: "Components/..."` convention, argTypes categorization, variant stories
- `index.js` — shows the dual default/named export pattern

Study them. Match the structure. Don't reinvent.

## Output Format

Same as `uno-implement/SKILL.md`:

```
---FILE: ComponentName.jsx---
(complete file contents)
---END FILE---

---FILE: ComponentName.scss---
(complete file contents)
---END FILE---

---FILE: ComponentName.stories.jsx---
(complete file contents)
---END FILE---

---FILE: index.js---
(complete file contents)
---END FILE---
```

The orchestration creates the `design-system/src/components/ComponentName/` directory (using a PascalCase name like `DismissibleBadges` derived from "Dismissible Badges") and writes each block.

## What NOT to Do

- Don't create stories for variants the `.jsx` doesn't actually support
- Don't reference tokens that aren't in the provided token files (the script provides `_colors.scss`, `_spacing_semantics.scss`, `_primitives.scss`, `_elevation.scss`, `_fonts.scss`)
- Don't introduce a new file type that isn't in Badge's pattern (no `.mdx` unless Badge has one; no `.test.jsx` — testing is separate)
- Don't write incomplete files. The parser writes blocks verbatim to disk; partial files break the build.
