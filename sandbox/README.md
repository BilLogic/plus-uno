# PLUS Design System - Component Sandbox

## Overview
The sandbox is a documentation and example system for displaying component variations and highlighting the design tokens used in each component.

## Structure

```
sandbox/
├── examples/              # Component examples and variations
│   └── universal/        # Universal component examples
│       ├── elements/     # Element component examples
│       ├── cards/        # Card component examples
│       ├── modals/       # Modal component examples
│       ├── sections/     # Section component examples
│       ├── tables/       # Table component examples
│       └── pages/        # Page component examples
├── docs/                  # Component documentation
│   └── universal/        # Universal component docs
│       ├── elements/     # Element component docs
│       ├── cards/        # Card component docs
│       ├── modals/       # Modal component docs
│       ├── sections/     # Section component docs
│       ├── tables/       # Table component docs
│       └── pages/        # Page component docs
└── index.html            # Sandbox main page (to be created)
```

## Purpose

### Component Examples
- Display all variations of each component
- Show component in different states (default, hover, active, disabled)
- Demonstrate different sizes, styles, and configurations
- Provide interactive examples

### Token Highlighting
- Show which design tokens are used in each component
- Display token values and usage
- Link to token reference documentation
- Show token relationships (primitives → semantics)

### Documentation
- Component API documentation
- Usage examples
- Best practices
- Accessibility guidelines
- Design guidelines

## Component Organization

Components are organized by:
1. **Product Pillar**: universal, login, profile, home, training, toolkit, admin
2. **Component Type**: elements, cards, modals, sections, tables, pages

### Product Pillars
- **universal**: Components used across all product areas
- **login**: Login and authentication components
- **profile**: User profile components
- **home**: Home/dashboard components
- **training**: Training and learning components
- **toolkit**: Toolkit-specific components
- **admin**: Admin panel components

### Component Types
- **elements**: Fundamental building blocks (buttons, inputs, badges, etc.)
- **cards**: Self-contained containers (product cards, info cards, etc.)
- **modals**: Pop-up windows (dialogs, alerts, confirmations, etc.)
- **sections**: Containers for cards or forms (dashboard sections, form sections, etc.)
- **tables**: Table components (data tables, comparison tables, etc.)
- **pages**: Full page layouts (dashboard pages, form pages, etc.)

## Usage

### Viewing Components
1. Open `sandbox/index.html` in browser
2. Navigate to product pillar (e.g., universal)
3. Select component type (e.g., elements)
4. View component variations and documentation

### Adding Components
1. Create component file in `src/js/components/[pillar]/[type]/[component].js`
2. Create example file in `sandbox/examples/[pillar]/[type]/[component].html`
3. Create documentation in `sandbox/docs/[pillar]/[type]/[component].md`
4. Update sandbox index to include new component

## Token Display

Each component example should display:
- **Used Tokens**: List of all tokens used in the component
- **Token Values**: Current values of tokens
- **Token Categories**: Colors, spacing, typography, layout
- **Token Links**: Links to token reference documentation

## Examples Structure

Each component example should include:
- **Basic Example**: Default state and configuration
- **Variations**: Different styles, sizes, configurations
- **States**: Hover, active, disabled, focus states
- **Code Example**: HTML/JavaScript code for the component
- **Token Usage**: Highlighted tokens used in the component

## Documentation Structure

Each component documentation should include:
- **Overview**: Component description and purpose
- **API**: Component function signature and parameters
- **Examples**: Usage examples with code
- **Tokens**: Design tokens used in the component
- **Accessibility**: Accessibility considerations
- **Best Practices**: Recommended usage patterns
- **Related Components**: Links to related components

## Integration

The sandbox integrates with:
- **Component Library**: `src/js/components/`
- **Token System**: `src/css/tokens/`
- **Guidelines**: `guidelines/`
- **Documentation**: `components/docs/`

## Future Enhancements

- Interactive component builder
- Token value editor (for testing)
- Component comparison tool
- Accessibility checker
- Code generator
- Export functionality

---

**Status**: Structure created, implementation in progress
**Last Updated**: November 2024

