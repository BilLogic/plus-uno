# PLUS Design System

This directory contains the PLUS design system source files organized by type.

## Structure

```
design-system/
├── tokens/                    # Design token SCSS files
│   ├── _colors.scss          # Material Design 3 colors
│   ├── _primitives.scss      # Primitive size tokens
│   ├── _spacing_semantics.scss # Semantic spacing tokens
│   ├── _layout.scss          # Layout and breakpoint tokens
│   ├── _fonts.scss           # Typography tokens
│   ├── _plus_spacing.scss    # PLUS-specific spacing
│   └── _mixins.scss          # SCSS mixins
│
├── components/
│   ├── atoms-molecules/      # Storybook stories for design system components
│   │   ├── atoms/           # Atom-level component stories
│   │   └── molecules/       # Molecule-level component stories
│   └── local/               # Local component implementations
│       ├── universal/       # Universal components (used across all products)
│       ├── login/           # Login-specific components
│       ├── profile/         # Profile-specific components
│       ├── home/            # Home/dashboard components
│       ├── training/        # Training components
│       ├── toolkit/         # Toolkit components
│       └── admin/           # Admin components
│
└── styles/                  # Component style SCSS files
    ├── _plus_buttons.scss
    ├── _inputs.scss
    ├── _alerts.scss
    ├── _breadcrumb.scss
    ├── _badges.scss
    ├── _dividers.scss
    └── _button-groups.scss
```

## Usage

### In Application Code

Import components from the design system:

```javascript
import { Universal } from "../design-system/components/local/index.js";
```

Import styles in SCSS:

```scss
@use "../design-system/tokens/colors" as *;
@use "../design-system/styles/plus_buttons" as *;
```

### Storybook

Storybook stories are located in `components/atoms-molecules/` and can be viewed by running:

```bash
npm run storybook
```

## Documentation

- **Guidelines**: See `docs/guidelines/` for coding standards, token reference, and terminology
- **Components**: See `docs/components/` for component API documentation
- **Tokens**: See `docs/tokens/` for token system documentation
