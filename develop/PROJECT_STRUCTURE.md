# PLUS Design System - Project Structure

## Overview
This document describes the organized project structure optimized for both human and AI navigation.

## Directory Structure

```
plus-vibe-coding-starting-kit/
├── design-system/              # Design system source files
│   ├── styles/                # Token documentation (markdown)
│   │   ├── overview.md        # Styles overview
│   │   ├── colors.md          # Color tokens documentation
│   │   ├── layout.md         # Spacing tokens documentation
│   │   ├── typography.md      # Typography tokens documentation
│   │   ├── icons.md           # Icon tokens documentation
│   │   └── elevation.md       # Elevation tokens documentation
│   ├── assets/                 # Asset components (logos, images, etc.)
│   │   ├── components/         # Asset component implementations
│   │   │   └── Logo/          # Logo component
│   │   ├── images/            # Static image assets
│   │   └── index.js           # Asset exports
│   ├── components/              # Reusable UI components
│   │   ├── overview.md       # Components overview + terminology
│   │   ├── (all component folders) # All reusable components
│   │   └── index.js           # Component exports
│   ├── specs/                  # Complex components (specs)
│   │   ├── README.md         # Specs overview
│   │   ├── Universal/        # Universal specs (formerly Shared)
│   │   ├── Admin/            # Admin specs
│   │   ├── Home/             # Home specs
│   │   ├── Login/            # Login specs
│   │   ├── Profile/          # Profile specs
│   │   ├── Training/         # Training specs
│   │   └── Toolkit/          # Toolkit specs
│
├── develop/                    # Technical documentation + token SCSS
│   ├── overview.md            # Development docs overview
│   ├── standards.md           # Coding standards, setup guides, best practices
│   ├── imports.md             # Component import path reference
│   └── tokens/                # Token SCSS source files
│       ├── _colors.scss       # Material Design 3 colors
│       ├── _primitives.scss   # Primitive size tokens
│       ├── _spacing_semantics.scss # Semantic spacing tokens
│       ├── _layout.scss       # Layout and breakpoint tokens
│       ├── _fonts.scss        # Typography tokens
│       ├── _elevation.scss    # Elevation tokens
│       ├── _plus_spacing.scss # PLUS-specific spacing
│       └── _mixins.scss       # SCSS mixins
│
├── src/                       # Application source code
│   ├── css/
│   │   └── main.scss          # Main stylesheet (references design-system)
│   └── js/
│       ├── main.js            # Main JavaScript entry point
│       └── utils/              # Utility functions
│           └── plus_util.js
│
├── .storybook/                # Storybook configuration
│   ├── main.js               # Storybook config files
│   ├── preview.js
│   └── preview-head.html
│
├── playground/               # Prototyping workspace
│   ├── README.md            # Playground documentation
│   ├── templates/           # Curated templates organized by product pillar
│   │   ├── README.md        # Templates documentation
│   │   ├── admin/           # Admin-related templates
│   │   ├── toolkit/         # Toolkit templates
│   │   ├── login/           # Login/auth templates
│   │   ├── profile/         # Profile templates
│   │   ├── home/            # Home/dashboard templates
│   │   ├── training/        # Training templates
│   │   └── universal/       # Universal/shared templates
│   └── {designer-name}/     # Individual designer directories
│       └── {prototype-name}/ # Individual prototypes
│
├── scripts/                   # Token generation scripts
│   ├── generate-all-tokens.js
│   ├── regenerate-colors.js
│   └── fix-colors.js
│
├── dist/                      # Compiled output
│   └── css/
│       └── main.css
│
├── .cursorrules               # Cursor AI agent configuration
├── package.json               # Project configuration
└── index.html                 # Main HTML file
```

## Design System Structure

The `design-system/` folder contains all design system source files:

### Styles (`design-system/styles/`)
- Token documentation (markdown files)
- Colors, spacing, typography, icons, elevation documentation
- Matches Storybook Foundations structure

### Assets (`design-system/assets/`)
- **`components/`**: Asset component implementations (e.g., Logo)
- **`images/`**: Static image assets (auth providers, logos, etc.)
- **`index.js`**: Asset exports
- Top-level design system area for brand assets and static images

### Components (`design-system/components/`)
- **All reusable UI components**: All components (formerly atoms and molecules) are in the `components/` directory
- **`overview.md`**: Components overview and terminology
- **`index.js`**: Component exports
- Component-based structure: each component has its own folder with both `.stories.js` and `.scss` files

### Specs (`design-system/specs/`)
- **Complex components**: Specs (formerly organisms) are complex components composed of multiple components
  - **`Universal/`**: Universal specs (formerly Shared) - commonly used across pillars
  - **`Admin/`**: Admin-specific specs
  - **`Home/`**, **`Login/`**, **`Profile/`**, **`Training/`**, **`Toolkit/`**: Pillar-specific specs
- **`README.md`**: Specs overview
- Each spec folder contains subcategories: Elements, Cards, Tables, Modals, Sections, Pages

### Token SCSS (`develop/tokens/`)
- All design token SCSS source files
- Material Design 3 color system
- Semantic spacing tokens
- Typography tokens
- Layout tokens
- Elevation tokens

## Documentation Structure

Documentation is organized in a progressive disclosure fashion:

### Design System Documentation (`design-system/`)
- **`styles/`**: Token documentation (colors.md, layout.md, typography.md, icons.md, elevation.md)
- **`components/overview.md`**: Component terminology, types, and API documentation

### Technical Documentation (`develop/`)
- **`standards.md`**: Coding standards, setup guides, best practices, prototyping checklist, Highcharts setup, Storybook organization
- **`imports.md`**: Component import path reference
- **`FIGMA_DESIGN_SYSTEM.md`**: Figma integration guide
- **`FIGMA_TOKEN_MAPPING.md`**: Figma to PLUS token mapping reference
- **`tokens/`**: Token SCSS source files

## Application Source (`src/`)

The `src/` folder contains application code that references the design system:

- `src/css/main.scss` - Imports tokens from `develop/tokens/` and styles from `design-system/components/`
- `src/js/main.js` - Imports components from `design-system/components/index.js`

## Prototyping Workspace

### Templates (`playground/templates/`)

Curated templates organized by product pillar matching the Figma design system sidebar. Each template folder contains `STRUCTURE.md` documentation that replicates the page documentation from `design-system/specs/{pillar}/STRUCTURE.md`.

- **`admin/`** - Admin-related templates (Tutors, Sessions, Students, Groups)
- **`toolkit/`** - Toolkit templates (Sessions, Slack)
- **`login/`** - Authentication and login templates
- **`profile/`** - User profile templates
- **`home/`** - Home/dashboard templates
- **`training/`** - Training templates (Lessons, Onboarding)
- **`universal/`** - Universal/shared component templates

Each template directory should include:
- `STRUCTURE.md` - Complete page documentation based on specs
- `index.html` - Main HTML file implementing documented pages
- Template files - HTML/JS files for specific page implementations
- `README.md` - Template-specific documentation (if needed)

**Usage**: Copy templates to `playground/{designer-name}/` for customization, or use directly as starting points.

### Playground (`playground/{designer-name}/`)

Designer-specific prototyping area for experimentation:

- Each designer creates their own directory: `playground/{designer-name}/`
- Designer name can be auto-generated from git user.name or provided by designer
- Create subdirectories for different prototypes
- By default, playground directories are ignored by git (opt-in to commit)

**Structure**:
```
playground/
├── README.md
├── templates/
│   └── {pillar}/
│       ├── STRUCTURE.md
│       └── [template-files]
└── {designer-name}/
    └── {prototype-name}/
        ├── index.html
        ├── styles.css (if needed)
        ├── script.js (if needed)
        └── README.md
```

**When to use**:
- **Templates**: For reusable, curated templates that demonstrate complete page implementations based on specs documentation
- **Playground**: For experimentation, one-off prototypes, and personal exploration

See `playground/templates/README.md` and `playground/README.md` for detailed guidelines.

## Navigation Guide

### For Designers
1. Start with `design-system/styles/overview.md` for token overview
2. Reference `design-system/components/overview.md` to identify component type
3. Reference `design-system/styles/` (colors.md, layout.md, typography.md, icons.md, elevation.md) to select tokens
4. Reference `develop/standards.md` for code patterns

### For Developers
1. Review `develop/standards.md` for project rules and coding standards
2. Reference `design-system/components/overview.md` for component APIs
3. Check `design-system/styles/` for token documentation
4. Review `develop/standards.md` for design patterns

### For AI Agents (Cursor)
1. Reference `.cursorrules` for core rules
2. Always consult `develop/standards.md` and `design-system/` files when generating code
3. Use `design-system/components/overview.md` when designing specific UI types
4. Use `design-system/styles/` when selecting tokens
5. Follow `develop/standards.md` for code style

## File Organization Principles

1. **Design System**: All design system source in `design-system/` (components, styles documentation)
2. **Technical Documentation**: All technical docs in `develop/` (standards, imports, Figma guides, token SCSS)
3. **Application**: Application code in `src/` (references design-system)
4. **Prototyping**: All prototyping work in `playground/` (templates and designer playgrounds)
5. **Storybook**: Storybook configuration in `.storybook/` at root
6. **Stories**: Storybook stories in `design-system/components/molecules/` and `design-system/components/atoms/`
7. **Never create prototypes in root**: Always use `playground/templates/` or `playground/{your-name}/` directories

## Key Files

### Essential for Code Generation
- `.cursorrules` - Cursor AI agent configuration
- `develop/standards.md` - Project rules, coding standards, setup guides
- `design-system/styles/` - Token reference (colors.md, layout.md, typography.md, icons.md, elevation.md)
- `design-system/components/overview.md` - Component types and terminology

### Reference Documentation
- `design-system/components/overview.md` - Component library
- `develop/standards.md` - Design patterns (integrated)
- `develop/imports.md` - Import path reference
- `develop/FIGMA_DESIGN_SYSTEM.md` - Figma integration guide

### Source Files
- `src/css/main.scss` - Main stylesheet (imports from develop/tokens/)
- `develop/tokens/*.scss` - Token SCSS files
- `design-system/components/molecules/*/index.js` - Component implementations

## Workflow

### Designing a UI Component

1. **Identify Component Type**
   - Open `design-system/components/overview.md`
   - Determine if it's an Element, Card, Section, Modal, Surface, or Surface Container

2. **Select Tokens**
   - Open `design-system/styles/` (colors.md, layout.md, typography.md, icons.md, elevation.md)
   - Find tokens that match the component type
   - Select appropriate sizes (sm/md/lg)

3. **Follow Coding Standards**
   - Open `develop/standards.md`
   - Follow code style guidelines
   - Use existing components when possible

4. **Generate Code**
   - Use semantic tokens
   - Follow Material Design 3 color roles
   - Include accessibility attributes
   - Ensure responsive design

## Maintenance

### Updating Tokens
1. Update Figma design system
2. Export JSON files
3. Run `scripts/generate-all-tokens.js`
4. Update files in `develop/tokens/`
5. Verify SCSS compilation
6. Update `design-system/styles/` documentation if needed (colors.md, layout.md, typography.md, icons.md, elevation.md)

### Adding Components

**Before starting:**
- **Reference production repository**: Check the cloned repository at `{cloned-repo-path}/java/docroot/javascript/pl2/plus_components/` for existing component implementations
- Study production code patterns for functionality, event handling, and DOM structure
- Match production implementation patterns exactly (naming, structure, behavior)
- Reference production SCSS in `{cloned-repo-path}/java/sass/` for styling patterns

**Steps:**
1. **Create JavaScript component file** in `design-system/components/molecules/{ComponentName}/index.js`
   - Reference production repository for existing functionality/styling
   - Match production code patterns for component structure and functionality
   - Use existing components as reference (e.g., `Button/index.js`, `Alert/index.js`, `Dropdown/index.js`)
   - Export named function: `export function create{ComponentName}({options})`
   - Use JSDoc with `@fileoverview` and `@param` documentation
   - Return `HTMLElement` (use `document.createElement()`, not HTML strings)
   - Add to `design-system/components/molecules/index.js` exports

2. **Create SCSS component file** in `design-system/components/{molecules|atoms}/{ComponentName}/{ComponentName}.scss`
   - Reference production repository for existing styling patterns
   - Study production SCSS patterns for class naming, structure, and token usage
   - Match production styling patterns exactly (class prefixes, organization, patterns)
   - Reference production component JavaScript for class names and structure
   - **NEVER hardcode values** - always use semantic tokens
   - Match component type to token prefix (element-*, card-*, section-*, etc.)
   - Use `color-mix(in srgb, ...)` for state layers
   - Use `:not(:disabled):not(.disabled)` pattern for interactive states

3. **Create component folder** in `design-system/components/` (in `molecules/` or `atoms/` subfolder)
   - Add Storybook story (`.stories.js`) in the component folder
   - Follow Storybook organization guidelines from `develop/standards.md` - Storybook Organization section

4. Import styles in `src/css/main.scss`

5. Update `design-system/components/overview.md`

6. Add examples to `prototyping/templates/` when appropriate

### Updating Guidelines
1. Update appropriate file in `develop/` or `design-system/`
2. Ensure examples are current
3. Verify references are correct
4. Update `.cursorrules` if needed
