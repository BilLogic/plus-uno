# Styles Overview

The PLUS Design System styles provide the foundational design tokens and visual language for all components and interfaces.

## Quick Navigation

- [Colors](colors.md) - Color tokens (accent, neutral, state layers, table color states)
- [Typography](typography.md) - Font families, weights, sizes, line heights
- [Layout](layout.md) - Semantic spacing tokens (elements, cards, sections, modals, surfaces, containers, tables)
- [Icons](icons.md) - Font Awesome icon sizing tokens
- [Elevation](elevation.md) - Box shadow tokens for elevation system

## Design Token System

The PLUS design system uses a comprehensive token system organized into:

1. **Colors** - Material Design 3 color roles, state layers, and SMART framework colors
2. **Typography** - Display, headline, title, and body text styles with utility classes
3. **Spacing** - Semantic spacing tokens organized by component hierarchy
4. **Icons** - Font Awesome icon sizing that matches typography levels
5. **Elevation** - Box shadow values for creating depth and hierarchy

## Token Source Files

All token SCSS files are located in: `develop/tokens/`

- `_colors.scss` - Color tokens
- `_fonts.scss` - Typography tokens
- `_spacing_semantics.scss` - Semantic spacing tokens
- `_primitives.scss` - Primitive spacing values (infrastructure only)
- `_elevation.scss` - Elevation tokens
- `_layout.scss` - Layout and breakpoint tokens
- `_tokens.scss` - Main token index file

## Usage Principles

1. **Always use design tokens** - Never hardcode values
2. **Use semantic tokens** - Match token prefix to component context
3. **Respect hierarchy** - Use appropriate token sizes for component layers
4. **Follow Material Design 3** - Colors follow M3 roles and guidance

## See Also

- [Components Overview](../components/overview.md) - Component terminology and types
- [Development Standards](../../develop/standards.md) - Coding standards and technical details

