# PLUS Design System - Project Structure

## Overview
This document describes the organized project structure optimized for both human and AI navigation.

## Directory Structure

```
plus-vibe-coding-starting-kit/
├── design-system/              # Design system source files
│   ├── tokens/                # Design token SCSS files
│   │   ├── _colors.scss       # Material Design 3 colors
│   │   ├── _primitives.scss   # Primitive size tokens
│   │   ├── _spacing_semantics.scss # Semantic spacing tokens
│   │   ├── _layout.scss       # Layout and breakpoint tokens
│   │   ├── _fonts.scss        # Typography tokens
│   │   ├── _plus_spacing.scss # PLUS-specific spacing
│   │   └── _mixins.scss       # SCSS mixins
│   ├── components/
│   │   ├── molecules/         # Molecule components
│   │   ├── atoms/            # Atom components
│   │   └── local/             # Component implementations
│   │       ├── universal/     # Universal components
│   │       ├── login/         # Login-specific components
│   │       ├── profile/       # Profile-specific components
│   │       ├── home/          # Home/dashboard components
│   │       ├── training/      # Training components
│   │       ├── toolkit/       # Toolkit components
│   │       └── admin/          # Admin components
│   └── styles/                # Component style SCSS files
│       ├── _plus_buttons.scss
│       ├── _inputs.scss
│       ├── _alerts.scss
│       ├── _breadcrumb.scss
│       ├── _badges.scss
│       ├── _dividers.scss
│       └── _button-groups.scss
│
├── docs/                      # All documentation (consolidated)
│   ├── guidelines/            # Core guidelines and reference documents
│   │   ├── README.md          # Guidelines overview
│   │   ├── coding-standards.md # Project rules and coding standards
│   │   ├── token-reference.md # Complete token reference
│   │   └── terminology.md     # UI component types and terminology
│   ├── components/           # Component documentation
│   │   ├── README.md          # Components overview
│   │   └── COMPONENTS.md      # Component library documentation
│   ├── tokens/                # Token system documentation
│   │   └── README.md          # Token system documentation
│   ├── DESIGN_PATTERNS.md    # Design patterns and examples
│   ├── DEV_STANDARDS.md       # Development standards
│   ├── DESIGN_TOKENS.md      # Legacy design tokens doc
│   └── FIGMA_DESIGN_SYSTEM.md # Figma integration
│
├── src/                       # Application source code
│   ├── css/
│   │   └── main.scss          # Main stylesheet (references design-system)
│   └── js/
│       ├── main.js            # Main JavaScript entry point
│       └── utils/              # Utility functions
│           └── plus_util.js
│
├── sandbox/                   # Storybook configuration
│   └── .storybook/            # Storybook config files
│
├── examples/                  # Reference prototypes
│   └── README.md
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

### Tokens (`design-system/tokens/`)
- All design token SCSS files
- Material Design 3 color system
- Semantic spacing tokens
- Typography tokens
- Layout tokens

### Components (`design-system/components/`)
- **`local/`**: Component implementations organized by product area
- **`molecules/`**: Molecule-level components with Storybook stories and styles
- **`atoms/`**: Atom-level components with Storybook stories and styles
- Component-based structure: each component has its own folder with both `.stories.js` and `.scss` files
- Styles for buttons, inputs, alerts, badges, etc. are co-located with their Storybook stories

## Documentation Structure

All documentation is consolidated in `docs/`:

### Guidelines (`docs/guidelines/`)
- Core reference documents for code generation
- Coding standards, token reference, terminology

### Components (`docs/components/`)
- Component API documentation
- Usage examples and patterns

### Tokens (`docs/tokens/`)
- Token system architecture
- Token usage guidelines

## Application Source (`src/`)

The `src/` folder contains application code that references the design system:

- `src/css/main.scss` - Imports tokens and styles from `design-system/`
- `src/js/main.js` - Imports components from `design-system/components/local/`

## Navigation Guide

### For Designers
1. Start with `docs/guidelines/README.md` for overview
2. Reference `docs/guidelines/terminology.md` to identify component type
3. Reference `docs/guidelines/token-reference.md` to select tokens
4. Reference `docs/guidelines/coding-standards.md` for code patterns

### For Developers
1. Review `docs/guidelines/coding-standards.md` for project rules
2. Reference `docs/components/COMPONENTS.md` for component APIs
3. Check `docs/tokens/README.md` for token system details
4. Review `docs/DESIGN_PATTERNS.md` for design patterns

### For AI Agents (Cursor)
1. Reference `.cursorrules` for core rules
2. Always consult `docs/guidelines/` files when generating code
3. Use `docs/guidelines/terminology.md` when designing specific UI types
4. Use `docs/guidelines/token-reference.md` when selecting tokens
5. Follow `docs/guidelines/coding-standards.md` for code style

## File Organization Principles

1. **Design System**: All design system source in `design-system/`
2. **Documentation**: All documentation consolidated in `docs/`
3. **Application**: Application code in `src/` (references design-system)
4. **Stories**: Storybook stories in `design-system/components/molecules/` and `design-system/components/atoms/`

## Key Files

### Essential for Code Generation
- `.cursorrules` - Cursor AI agent configuration
- `docs/guidelines/coding-standards.md` - Project rules
- `docs/guidelines/token-reference.md` - Token reference
- `docs/guidelines/terminology.md` - Component types

### Reference Documentation
- `docs/components/COMPONENTS.md` - Component library
- `docs/tokens/README.md` - Token system
- `docs/DESIGN_PATTERNS.md` - Design patterns

### Source Files
- `src/css/main.scss` - Main stylesheet (imports from design-system)
- `design-system/tokens/*.scss` - Token files
- `design-system/components/local/*.js` - Component implementations

## Workflow

### Designing a UI Component

1. **Identify Component Type**
   - Open `docs/guidelines/terminology.md`
   - Determine if it's an Element, Card, Section, Modal, Surface, or Surface Container

2. **Select Tokens**
   - Open `docs/guidelines/token-reference.md`
   - Find tokens that match the component type
   - Select appropriate sizes (sm/md/lg)

3. **Follow Coding Standards**
   - Open `docs/guidelines/coding-standards.md`
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
4. Update files in `design-system/tokens/`
5. Verify SCSS compilation
6. Update `docs/guidelines/token-reference.md` if needed

### Adding Components
1. Create component in `design-system/components/local/`
2. Create component folder in `design-system/components/` (in `molecules/` or `atoms/` subfolder)
3. Add component styles (`.scss`) and Storybook story (`.stories.js`) in the component folder
4. Import styles in `src/css/main.scss`
5. Update `docs/components/COMPONENTS.md`
6. Add examples to `examples/`

### Updating Guidelines
1. Update appropriate file in `docs/guidelines/`
2. Ensure examples are current
3. Verify references are correct
4. Update `.cursorrules` if needed
