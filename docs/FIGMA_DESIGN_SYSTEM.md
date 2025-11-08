# Figma Design System Integration

This document describes how to extract design tokens and component specifications from Figma design system files.

## Accessing Figma Files

To extract design system information from Figma:

1. **Identify Design System Files**: Locate Figma files containing:
   - Design tokens (colors, spacing, typography)
   - Component specifications
   - Design patterns
   - Style guides

2. **Common Figma File Locations**:
   - PLUS - Universal (Team Universal's design system)
   - PLUS - Toolkit
   - Component library files

## Extraction Process

### Design Tokens

Extract the following from Figma:

1. **Colors**:
   - Primary, secondary, tertiary colors
   - Accent colors (danger, success, warning, info)
   - Neutral colors (background, surface, outline)
   - Extended colors (SMART competency areas)
   - State layer opacities

2. **Typography**:
   - Font families (Lato, Merriweather Sans, Open Sans)
   - Font sizes (Display, Headlines, Titles, Body)
   - Font weights (Normal, Semibold, Bold)
   - Line heights
   - Letter spacing

3. **Spacing**:
   - Within component spacing
   - Between components spacing
   - Between sections spacing
   - Grid system

4. **Sizes**:
   - Border radius values
   - Border widths
   - Breakpoints
   - Base size values

### Component Specifications

Extract component specifications including:

1. **Component Variants**:
   - Button variants (filled, outline, tonal, text)
   - Button sizes (small, default, large)
   - Button styles (primary, secondary, etc.)

2. **Component States**:
   - Default state
   - Hover state
   - Active state
   - Focus state
   - Disabled state

3. **Component Structure**:
   - Layout structure
   - Spacing between elements
   - Typography usage
   - Color usage

## Using Figma MCP

When Figma files are available, use the Figma MCP tools to:

1. **Get Design Context**:
   - Extract component designs
   - Get design specifications
   - Extract design tokens

2. **Get Screenshots**:
   - Capture component examples
   - Document design patterns
   - Create reference images

3. **Get Metadata**:
   - Understand component structure
   - Extract node information
   - Map design to code

## Mapping Figma to Code

### Color Tokens
Map Figma color styles to CSS variables:
- Figma: `Primary/500` → CSS: `--color-accent-primary: #00658e`
- Figma: `Success/500` → CSS: `--color-accent-success: #3e691a`

### Typography Tokens
Map Figma text styles to CSS variables:
- Figma: `Display 1` → CSS: `--font-size-display1: 5rem`
- Figma: `Body 1` → CSS: `--font-size-body1: 1rem`

### Spacing Tokens
Map Figma spacing values to CSS variables:
- Figma: `Spacing/4` → CSS: `--size-spacing-within-component-2: 4px`
- Figma: `Spacing/16` → CSS: `--size-spacing-between-components-3: 16px`

## Next Steps

1. **Identify Figma Files**: Get file keys for design system files
2. **Extract Tokens**: Use Figma MCP or manual extraction
3. **Validate**: Compare Figma tokens with production code tokens
4. **Document**: Create mapping documentation
5. **Sync**: Set up process to keep Figma and code in sync

## Notes

- Design tokens in Figma should match production code tokens
- Component specifications in Figma should match component implementations
- Regular sync between Figma and code is important
- Changes in Figma should be reflected in code and documentation

