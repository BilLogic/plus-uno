# PLUS Design System

This directory contains the PLUS design system source files organized by type.

## Structure

See **[`../develop/PROJECT_STRUCTURE.md`](../develop/PROJECT_STRUCTURE.md)** for complete project structure documentation.

**Design System Overview:**
- **`styles/`** - Token documentation (colors.md, layout.md, typography.md, icons.md, elevation.md)
- **`assets/`** - Asset components (Logo) and static images
- **`components/`** - Component implementations (atoms, molecules, organisms)

## Usage

### In Application Code

Import components from the design system:

```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/index.js";
```

Import styles in SCSS:

```scss
@use "../../develop/tokens/colors" as *;
@use "../design-system/components/molecules/Button/Button" as *;
```

### Storybook

Storybook stories are located in `components/molecules/` and `components/atoms/` and can be viewed by running:

```bash
npm run storybook
```

## Documentation

- **Token Documentation**: See `styles/` for complete token reference (colors.md, layout.md, typography.md, icons.md, elevation.md)
- **Component Documentation**: See `components/overview.md` for component API documentation and terminology
- **Design Patterns**: See `develop/standards.md` for design patterns and examples (integrated into standards)
- **Technical Documentation**: See `../develop/` for coding standards, import paths, and Figma integration guides
- **Token SCSS Files**: All token SCSS source files are in `../develop/tokens/`
