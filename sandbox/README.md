# Storybook Component Playground

## Overview

The `sandbox/` directory contains Storybook configuration and stories for the PLUS Design System component library.

## Running Storybook

### Development Mode
```bash
npm run storybook
```
This starts Storybook on http://localhost:6006/

### Build Static Version
```bash
npm run build-storybook
```
This builds a static version in `sandbox/storybook-static/`

## Structure

```
sandbox/
├── .storybook/              # Storybook configuration
│   ├── main.js             # Main config file
│   ├── preview.js          # Preview configuration
│   └── preview-head.html    # HTML head configuration
└── storybook-static/        # Built static version (generated)
```

## Stories Location

Stories are located in `design-system/components/molecules/` and `design-system/components/atoms/`:
- `atoms/` - Atom-level component stories (Icon, Input, StatusIndicator, Typography)
- `molecules/` - Molecule-level component stories (Alert, Badge, Breadcrumb, Button, etc.)

## Purpose

Storybook serves as:
- Component documentation and showcase
- Interactive component playground
- Design system reference
- Component testing environment

## See Also

- **Component Documentation**: `docs/components/COMPONENTS.md`
- **Design Tokens**: `docs/guidelines/token-reference.md`
- **Coding Standards**: `docs/guidelines/coding-standards.md`
