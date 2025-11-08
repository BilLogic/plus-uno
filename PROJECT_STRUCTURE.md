# PLUS Design System - Project Structure

## Overview
This document describes the organized project structure optimized for both human and AI navigation.

## Directory Structure

```
plus-vibe-coding-starting-kit/
├── guidelines/                    # Core guidelines and reference documents
│   ├── README.md                 # Guidelines overview and usage
│   ├── coding-standards.md       # Project rules and coding standards
│   ├── token-reference.md        # Complete token reference (colors, spacing, etc.)
│   └── terminology.md            # UI component types and terminology
│
├── components/                    # Component documentation
│   ├── README.md                 # Components overview
│   └── docs/
│       └── COMPONENTS.md         # Component library documentation
│
├── tokens/                        # Token system documentation
│   └── docs/
│       └── README.md             # Token system documentation
│
├── src/                          # Source code
│   ├── css/
│   │   ├── main.scss            # Main stylesheet
│   │   ├── tokens/              # Token SCSS files
│   │   │   ├── _colors.scss     # Material Design 3 colors
│   │   │   ├── _primitives.scss # Primitive size tokens
│   │   │   ├── _spacing_semantics.scss # Semantic spacing tokens
│   │   │   ├── _layout.scss     # Layout and breakpoint tokens
│   │   │   ├── _fonts.scss      # Typography tokens
│   │   │   └── ...
│   │   └── components/          # Component styles
│   │       ├── _plus_buttons.scss
│   │       └── _inputs.scss
│   └── js/
│       ├── main.js              # Main JavaScript entry point
│       ├── components/          # Component implementations
│       │   ├── general_interface.js
│       │   └── plus_smart_components.js
│       └── utils/               # Utility functions
│           └── plus_util.js
│
├── docs/                         # Additional documentation
│   ├── DESIGN_PATTERNS.md       # Design patterns and examples
│   ├── DEV_STANDARDS.md         # Development standards
│   ├── FIGMA_DESIGN_SYSTEM.md   # Figma integration
│   └── DESIGN_TOKENS.md         # Legacy design tokens doc
│
├── examples/                     # Reference prototypes
│   └── README.md
│
├── scripts/                      # Token generation scripts
│   ├── generate-all-tokens.js
│   ├── regenerate-colors.js
│   └── fix-colors.js
│
├── dist/                         # Compiled output
│   └── css/
│       └── main.css
│
├── .cursorrules                  # Cursor AI agent configuration
├── package.json                  # Project configuration
└── index.html                    # Main HTML file
```

## Guidelines Folder

The `guidelines/` folder contains the core reference documents that should be consulted when generating code:

### `coding-standards.md`
- Project rules and coding standards
- Code style guidelines (JavaScript, CSS/SCSS, HTML)
- Best practices and anti-patterns
- File structure and naming conventions

### `token-reference.md`
- Complete token reference
- All available color tokens (Material Design 3)
- All spacing tokens (semantic system)
- Typography tokens
- Layout tokens
- Usage guidelines and examples

### `terminology.md`
- UI component type definitions
- Elements, Cards, Sections, Modals, Surfaces, Surface Containers
- Characteristics and examples
- Token usage for each component type
- Decision tree for determining component type

## Components Folder

The `components/` folder contains component documentation:
- `docs/COMPONENTS.md` - Complete component library documentation
- Component code is located in `src/js/components/` and `src/css/components/`

## Tokens Folder

The `tokens/` folder contains token system documentation:
- `docs/README.md` - Token system architecture and documentation
- Token SCSS files are located in `src/css/tokens/`

## Navigation Guide

### For Designers
1. Start with `guidelines/README.md` for overview
2. Reference `guidelines/terminology.md` to identify component type
3. Reference `guidelines/token-reference.md` to select tokens
4. Reference `guidelines/coding-standards.md` for code patterns

### For Developers
1. Review `guidelines/coding-standards.md` for project rules
2. Reference `components/docs/COMPONENTS.md` for component APIs
3. Check `tokens/docs/README.md` for token system details
4. Review `docs/DESIGN_PATTERNS.md` for design patterns

### For AI Agents (Cursor)
1. Reference `.cursorrules` for core rules
2. Always consult `guidelines/` files when generating code
3. Use `guidelines/terminology.md` when designing specific UI types
4. Use `guidelines/token-reference.md` when selecting tokens
5. Follow `guidelines/coding-standards.md` for code style

## File Organization Principles

1. **Guidelines**: Core reference documents in `guidelines/`
2. **Components**: Component documentation in `components/docs/`
3. **Tokens**: Token documentation in `tokens/docs/`
4. **Source Code**: Implementation code in `src/`
5. **Additional Docs**: Extended documentation in `docs/`

## Key Files

### Essential for Code Generation
- `.cursorrules` - Cursor AI agent configuration
- `guidelines/coding-standards.md` - Project rules
- `guidelines/token-reference.md` - Token reference
- `guidelines/terminology.md` - Component types

### Reference Documentation
- `components/docs/COMPONENTS.md` - Component library
- `tokens/docs/README.md` - Token system
- `docs/DESIGN_PATTERNS.md` - Design patterns

### Source Files
- `src/css/main.scss` - Main stylesheet
- `src/css/tokens/*.scss` - Token files
- `src/js/components/*.js` - Component implementations

## Workflow

### Designing a UI Component

1. **Identify Component Type**
   - Open `guidelines/terminology.md`
   - Determine if it's an Element, Card, Section, Modal, Surface, or Surface Container

2. **Select Tokens**
   - Open `guidelines/token-reference.md`
   - Find tokens that match the component type
   - Select appropriate sizes (sm/md/lg)

3. **Follow Coding Standards**
   - Open `guidelines/coding-standards.md`
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
4. Verify SCSS compilation
5. Update `guidelines/token-reference.md` if needed

### Adding Components
1. Create component in `src/js/components/`
2. Create styles in `src/css/components/`
3. Update `components/docs/COMPONENTS.md`
4. Add examples to `examples/`

### Updating Guidelines
1. Update appropriate guideline file
2. Ensure examples are current
3. Verify references are correct
4. Update `.cursorrules` if needed

