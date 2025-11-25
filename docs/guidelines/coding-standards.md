# PLUS Design System - Coding Standards

## Overview
This document outlines the coding standards, project rules, and best practices for the PLUS design system. Always reference this document when generating code for PLUS components and interfaces.

## Code Style

### JavaScript
- Always use functional code patterns
- Always include JSDoc comments for all functions and classes
- Use ES6+ features (modules, classes, arrow functions, destructuring)
- Use meaningful variable and function names
- Follow camelCase for variables and functions
- Follow PascalCase for classes
- Use const/let, never var
- Use static methods for component creation functions
- **Reference production repository**: When creating new components, check the cloned production repository at `{cloned-repo-path}/java/docroot/javascript/pl2/plus_components/` for existing functionality/styling patterns
- Match production code patterns for component structure, functionality, and behavior

### CSS/SCSS
- Always use CSS custom properties (variables) for design tokens
- Never hardcode color values, spacing, or typography
- Use utility classes for common patterns
- Follow kebab-case for class names
- Use SCSS partials for modularity
- **Reference production repository**: When creating new component styles, check the cloned production repository at `{cloned-repo-path}/java/sass/` for existing styling patterns
- Study production SCSS patterns for class naming, structure, and token usage
- Match production styling patterns exactly (class prefixes, organization, patterns)

### HTML
- Use semantic HTML elements
- Include proper ARIA attributes for accessibility
- Use Bootstrap 4 classes for layout
- Use PLUS utility classes for styling
- Maintain consistent structure

### Bootstrap Integration
- **ALWAYS override Bootstrap default spacing/padding with design tokens**
- Bootstrap components (form-check, custom-control, dropdown, etc.) have default spacing that must be overridden
- When using Bootstrap classes, explicitly set spacing to use PLUS design tokens:
  - Override `padding-left`, `padding-right`, `margin-left`, `margin-right` with design tokens
  - Use `padding-left: 0` or `padding-left: var(--size-element-gap-sm)` instead of Bootstrap defaults
  - Example: `.form-check` has default `padding-left: 1.25rem` - override with `padding-left: 0` and use `gap: var(--size-element-gap-sm)` instead
- Check Bootstrap's default styles and explicitly override them with PLUS tokens
- Never rely on Bootstrap's default spacing - always use design tokens from Figma

## Design System Usage

### Design Tokens
- **ALWAYS** use CSS variables for design tokens (colors, spacing, typography)
- **NEVER** hardcode values - always use semantic tokens
- Reference `guidelines/token-reference.md` for all available tokens
- Follow Material Design 3 (M3) naming conventions and color roles

### Component Creation
- Always use existing PLUS components when possible
- Import components: `import { PlusInterface, PlusSmartComponents } from "../design-system/components/local/index.js"`
- Use component creation methods: `PlusInterface.createButton()`, `PlusSmartComponents.createStatusIcon()`, etc.
- Follow component API patterns from `docs/COMPONENTS.md`

### UI Component Types
When designing a specific type of UI, reference the appropriate guideline:
- **Elements**: See `guidelines/terminology.md` - Elements section
- **Cards**: See `guidelines/terminology.md` - Cards section
- **Sections**: See `guidelines/terminology.md` - Sections section
- **Modals**: See `guidelines/terminology.md` - Modals section
- **Surfaces**: See `guidelines/terminology.md` - Surfaces section
- **Surface Containers**: See `guidelines/terminology.md` - Surface Containers section

## File Structure

### Organization
- Components: `design-system/components/local/`
- Utilities: `src/js/utils/`
- Styles: `src/css/`
- Tokens: `design-system/tokens/`
- Component styles: `design-system/components/` (organized by component in `molecules/` and `atoms/` folders)
- Examples: `examples/`

### Naming Conventions
- Files: kebab-case (e.g., `button.js`, `index.js`)
- Classes: PascalCase (e.g., `PlusInterface`)
- Functions: camelCase (e.g., `createButton`)
- Constants: UPPER_SNAKE_CASE (e.g., `BUTTON_FILL`)
- CSS classes: kebab-case (e.g., `plus-text-field`)

## Best Practices

### Code Quality
1. Always include JSDoc comments
2. Use design tokens (never hardcode values)
3. Follow component patterns
4. Maintain accessibility (ARIA attributes, keyboard navigation)
5. Ensure responsive design (use Bootstrap 4 grid and PLUS utilities)
6. Handle errors gracefully
7. Use functional code patterns

### Component Creation
1. **Reference production repository first**: Check `{cloned-repo-path}/java/docroot/javascript/pl2/plus_components/` and `{cloned-repo-path}/java/sass/` for existing implementations
2. Use static methods for component creation
3. Return DOM elements (not HTML strings where possible)
4. Accept configuration objects as parameters
5. Provide sensible defaults
6. Document all parameters with JSDoc
7. Handle edge cases
8. Match production implementation patterns exactly

### Accessibility
- Include proper ARIA attributes
- Ensure keyboard navigation works
- Use semantic HTML elements
- Provide alt text for images
- Ensure color contrast meets WCAG standards

### Responsive Design
- Use Bootstrap 4 grid system
- Use PLUS responsive utilities
- Test across breakpoints: md (768px), lg (992px), xl (1200px), xxl (1400px)
- Use responsive spacing utilities

## Dependencies

### Required
- Bootstrap 4 (CSS and JS)
- jQuery
- Font Awesome (for icons)
- SASS (for CSS preprocessing)

### Optional
- DataTables (for tables)
- Highcharts (for data visualization)

## Documentation References

- **Token Reference**: `guidelines/token-reference.md` - Complete token reference
- **Terminology**: `guidelines/terminology.md` - UI component types and terminology
- **Components**: `docs/COMPONENTS.md` - Component library documentation
- **Development Standards**: `docs/DEV_STANDARDS.md` - Detailed development guidelines
- **Design Patterns**: `docs/DESIGN_PATTERNS.md` - Design patterns and examples

## Common Patterns

### Creating a Button
```javascript
/**
 * Creates a primary filled button
 * @returns {HTMLElement} Button element
 */
import { PlusInterface } from "../design-system/components/local/index.js";

const button = PlusInterface.createButton({
    btnText: "Click me",
    btnStyle: "primary",
    btnFill: "filled",
    btnSize: "default",
    buttonOnClick: () => console.log("Clicked")
});
```

### Creating a Form Input
```html
<input type="text" class="plus-text-field body2-txt" placeholder="Enter text">
```

## Anti-Patterns to Avoid

1. **Never hardcode colors**: ❌ `color: #00658e` ✅ `color: var(--color-primary)`
2. **Never hardcode spacing or use primitives**: ❌ `padding: 16px` ❌ `padding: var(--size-space-300)` ✅ `padding: var(--size-card-pad-x-md)`
3. **Never mix primitives with semantics**: Always use semantic tokens
4. **Never use wrong semantic layer**: Match token to component context
5. **Never use element-gap-xs for anything except label-input spacing**
6. **Never skip JSDoc**: Always document functions and classes
7. **Never ignore accessibility**: Always include ARIA attributes
8. **Never skip responsive design**: Always consider different screen sizes
9. **Never create components from scratch**: Use existing PLUS components when possible
10. **Never use inline styles for design tokens**: Use CSS variables and utility classes
11. **Never mix semantic sizes for same token type**: Use consistent sizes
12. **Never rely on Bootstrap default spacing**: ❌ Using Bootstrap's default `form-check` padding ✅ Override with `padding-left: 0` and use `gap: var(--size-element-gap-sm)`
13. **Never assume Bootstrap spacing matches design tokens**: Always explicitly override Bootstrap defaults with PLUS design tokens from Figma

## Output Guidelines

### Code Generation
- Generate clean, readable code
- Include all necessary imports
- Use proper error handling
- Follow the patterns in existing code
- Include JSDoc comments
- Use design tokens consistently
- Ensure code is production-ready

### Code Organization
- Group related code together
- Use meaningful variable names
- Keep functions focused and small
- Use comments to explain complex logic
- Follow the established file structure

## Testing Considerations

When generating code, consider:
- Does it work across different browsers?
- Is it responsive?
- Is it accessible?
- Does it use design tokens correctly?
- Does it follow PLUS patterns?
- Is it production-ready?

## Remember

- Always prioritize using design tokens over hardcoded values
- Always include JSDoc comments
- Always use existing components when possible
- Always consider accessibility and responsiveness
- Always follow PLUS design system patterns
- Always generate production-ready code
- Always reference `guidelines/token-reference.md` for tokens
- Always reference `guidelines/terminology.md` when designing specific UI types

