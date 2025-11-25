# PLUS Development Standards

This document outlines development standards, code style, and production-readiness requirements for PLUS code generation.

## Code Style

### JavaScript

#### General Rules
- Use ES6+ features (modules, classes, arrow functions, destructuring)
- Use functional code patterns where possible
- Always use JSDoc comments for functions and classes
- Use meaningful variable and function names
- Follow camelCase for variables and functions
- Follow PascalCase for classes
- Use const/let, avoid var

#### Module Pattern
```javascript
/**
 * Description of the module
 * @fileoverview Brief overview of the module's purpose
 */

import { Dependency } from "./dependency.js";

/**
 * Description of the class
 */
export class MyClass {
    /**
     * Description of the method
     * @param {Object} options - Options object
     * @param {string} options.property - Description of property
     * @returns {HTMLElement} Description of return value
     */
    static myMethod(options) {
        // Implementation
    }
}
```

#### Function Documentation
```javascript
/**
 * Brief description of the function
 * @param {string} param1 - Description of param1
 * @param {Object} param2 - Description of param2
 * @param {string} param2.property - Description of property
 * @param {Function} callback - Callback function
 * @returns {HTMLElement} Description of return value
 */
function myFunction(param1, param2, callback) {
    // Implementation
}
```

### CSS/SCSS

#### General Rules
- Use CSS custom properties (variables) for all design tokens
- Use utility classes for common patterns
- Follow BEM-like naming for component-specific classes
- Use kebab-case for class names
- Organize styles by component or feature
- Use SCSS partials for modularity

#### CSS Variable Usage
```css
.my-component {
    color: var(--color-accent-primary);
    padding: var(--size-spacing-within-component-4);
    border-radius: var(--size-border-radius-2);
}
```

#### Utility Classes
```html
<div class="padding-3 component-margin-top-2 body1-txt color-primary">
    Content
</div>
```

### HTML

#### General Rules
- Use semantic HTML elements
- Include proper ARIA attributes for accessibility
- Use Bootstrap 4 classes for layout
- Use PLUS utility classes for styling
- Maintain consistent structure

#### Bootstrap Integration
- **ALWAYS override Bootstrap default spacing/padding with design tokens**
- Bootstrap components (form-check, custom-control, dropdown, etc.) have default spacing that must be overridden
- When using Bootstrap classes, explicitly set spacing to use PLUS design tokens:
  - Override `padding-left`, `padding-right`, `margin-left`, `margin-right` with design tokens
  - Use `padding-left: 0` or `padding-left: var(--size-element-gap-sm)` instead of Bootstrap defaults
  - Example: `.form-check` has default `padding-left: 1.25rem` - override with `padding-left: 0` and use `gap: var(--size-element-gap-sm)` instead
- Check Bootstrap's default styles and explicitly override them with PLUS tokens
- Never rely on Bootstrap's default spacing - always use design tokens from Figma

#### Structure
```html
<div class="container">
    <div class="row">
        <div class="col-md-6">
            <h2 class="h2">Title</h2>
            <p class="body1-txt">Content</p>
        </div>
    </div>
</div>
```

## Naming Conventions

### Files
- JavaScript: `component_name.js` (kebab-case)
- CSS/SCSS: `_component_name.scss` (kebab-case, leading underscore for partials)
- HTML: `page_name.html` (kebab-case)

### Classes
- CSS classes: `component-name` (kebab-case)
- JavaScript classes: `ComponentName` (PascalCase)
- Functions: `functionName` (camelCase)
- Constants: `CONSTANT_NAME` (UPPER_SNAKE_CASE)

### Variables
- Variables: `variableName` (camelCase)
- CSS variables: `--variable-name` (kebab-case with double dash)

## Folder Structure

```
project/
├── css/
│   ├── _colors.scss
│   ├── _fonts.scss
│   ├── _spacing.scss
│   └── main.scss
├── js/
│   └── utils/
│       └── plus_util.js
├── design-system/
│   └── components/
│       └── local/
│           └── index.js
├── index.html
└── package.json
```

## Component Patterns

### Component Creation
- Use static methods for component creation
- Return DOM elements (not HTML strings where possible)
- Accept configuration objects as parameters
- Provide sensible defaults
- Document all parameters with JSDoc

### Component Structure
```javascript
/**
 * Component description
 */
export class MyComponent {
    /**
     * Creates a component instance
     * @param {Object} options - Component options
     * @param {string} options.id - Component ID
     * @param {string} options.text - Component text
     * @returns {HTMLElement} Component element
     */
    static create(options) {
        const element = document.createElement("div");
        element.id = options.id;
        element.textContent = options.text;
        element.classList.add("my-component");
        return element;
    }
}
```

## Design System Usage

### Design Tokens
- Always use CSS variables for design tokens
- Never hardcode color values, spacing, or typography
- Use utility classes for common patterns
- Reference design token documentation

### Components
- Use existing PLUS components when possible
- Follow component API patterns
- Maintain consistency with design system
- Use component variants and states correctly

## Dependencies

### Required Libraries
- Bootstrap 4 (CSS and JS)
- jQuery
- Font Awesome (for icons)
- SASS (for CSS preprocessing)

### Optional Libraries
- DataTables (for tables)
- Highcharts (for data visualization)
- Bootstrap Multiselect (for multiselect dropdowns)

## Production-Ready Code

### Requirements
1. **Functionality**: Code works as intended
2. **Accessibility**: Proper ARIA attributes and keyboard navigation
3. **Responsive**: Works across different screen sizes
4. **Performance**: Efficient and optimized
5. **Maintainability**: Well-documented and organized
6. **Consistency**: Follows design system and coding standards
7. **Error Handling**: Proper error handling and validation
8. **Browser Compatibility**: Works in supported browsers

### Code Quality Checklist
- [ ] All functions have JSDoc comments
- [ ] Code follows naming conventions
- [ ] Design tokens are used (no hardcoded values)
- [ ] Components are properly structured
- [ ] Accessibility attributes are included
- [ ] Responsive design is implemented
- [ ] Error handling is in place
- [ ] Code is organized and maintainable

## Best Practices

### JavaScript
1. Use ES6 modules for code organization
2. Use static methods for utility functions
3. Provide default values for optional parameters
4. Use meaningful variable names
5. Document complex logic
6. Handle errors gracefully
7. Use functional patterns where appropriate

### CSS
1. Use CSS variables for all design tokens
2. Use utility classes for common patterns
3. Organize styles by component
4. Use SCSS partials for modularity
5. Follow naming conventions
6. Avoid inline styles (use classes)

### HTML
1. Use semantic HTML elements
2. Include proper ARIA attributes
3. Use Bootstrap 4 for layout
4. Use PLUS utility classes for styling
5. Maintain consistent structure
6. Ensure accessibility

### Components
1. Use existing components when possible
2. Follow component API patterns
3. Maintain consistency with design system
4. Document component usage
5. Provide examples
6. Handle edge cases

## Code Review Guidelines

### What to Check
1. Code follows style guidelines
2. Design tokens are used correctly
3. Components are used appropriately
4. Accessibility is maintained
5. Responsive design is implemented
6. Error handling is in place
7. Code is well-documented
8. Performance is considered

### Common Issues
1. Hardcoded values instead of design tokens
2. Missing JSDoc comments
3. Inconsistent naming
4. Missing accessibility attributes
5. Poor error handling
6. Inefficient code
7. Missing responsive design
8. Poor code organization
9. Using Bootstrap default spacing instead of design tokens
10. Not overriding Bootstrap component defaults with PLUS tokens

## Integration with Production Codebase

### File Locations
- Components: `js/components/`
- Styles: `css/`
- Utilities: `js/utils/`

### Import Patterns
```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/local/index.js";
```

### Style Integration
```scss
@use "colors";
@use "fonts";
@use "spacing";
@use "components";
```

## Testing Considerations

### Manual Testing
- Test across different browsers
- Test responsive design
- Test accessibility
- Test error cases
- Test edge cases

### Code Validation
- Validate HTML
- Validate CSS
- Lint JavaScript
- Check for accessibility issues
- Verify design token usage

## Documentation Requirements

### Code Documentation
- JSDoc comments for all functions
- Inline comments for complex logic
- README for setup and usage
- Component documentation
- Design token documentation

### Usage Examples
- Provide code examples
- Show different variants
- Demonstrate common patterns
- Include edge cases
- Show integration examples

