# Development Standards

This document consolidates all technical documentation, coding standards, setup guides, and best practices for the PLUS Design System.

## Table of Contents

1. [Code Style](#code-style)
2. [Design System Usage](#design-system-usage)
3. [Component Creation](#component-creation)
4. [HTML Head Requirements](#html-head-requirements)
5. [Bootstrap Integration](#bootstrap-integration)
6. [Highcharts Setup](#highcharts-setup)
7. [Image Handling](#image-handling)
8. [Prototyping Checklist](#prototyping-checklist)
9. [Storybook Organization](#storybook-organization)
10. [Figma Integration](#figma-integration)
11. [File Structure](#file-structure)
12. [Best Practices](#best-practices)
13. [Anti-Patterns](#anti-patterns)

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
- **Reference production repository**: Check `{cloned-repo-path}/java/docroot/javascript/pl2/plus_components/` for existing patterns
- Match production code patterns for component structure, functionality, and behavior

### CSS/SCSS
- Always use CSS custom properties (variables) for design tokens
- Never hardcode color values, spacing, or typography
- Use utility classes for common patterns
- Follow kebab-case for class names
- Use SCSS partials for modularity
- **Reference production repository**: Check `{cloned-repo-path}/java/sass/` for existing styling patterns
- Match production styling patterns exactly (class prefixes, organization, patterns)

### HTML
- Use semantic HTML elements
- Include proper ARIA attributes for accessibility
- Use Bootstrap 4 classes for layout
- Use PLUS utility classes for styling
- Maintain consistent structure

## Design System Usage

### Design Tokens
- **ALWAYS** use CSS variables for design tokens (colors, spacing, typography, elevation)
- **NEVER** hardcode values - always use semantic tokens
- Reference `design-system/styles/` for token documentation
- Follow Material Design 3 (M3) naming conventions and color roles

### Spacing Token Principles
1. **Always use semantic tokens**: ✅ `card-pad-x-md` ❌ `20px` or `space-400`
2. **Match token to context**: Cards → `card-` tokens, Sections → `section-` tokens
3. **Respect hierarchy**: Use smaller gaps for dense UI, larger gaps for content-rich layouts
4. **Element Typography Hierarchy**: H3→lg, H6→md, B3→sm for element spacing
5. **element-gap-xs reserved**: Only for label-to-input spacing

### Elevation Tokens
- Use elevation tokens (`--elevation-light-1` through `--elevation-light-5`) for box-shadows
- Cards at rest: `--elevation-light-1`
- Cards on hover: `--elevation-light-2`
- Modals: `--elevation-light-3` to `--elevation-light-5`

## Component Creation

### Import Pattern
```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/index.js";
```

### Import Paths
- From `prototyping/templates/{pillar}/`: `"../../design-system/components/index.js"`
- From `prototyping/playground/{name}/`: `"../../design-system/components/index.js"`
- From root `index.html`: `"./design-system/components/index.js"`
- From `src/js/`: `"../design-system/components/index.js"`

**Always verify import paths** - incorrect paths cause component imports to fail.
**Always include `type="module"`** in script tags when using ES6 imports.

See [imports.md](imports.md) for complete import path reference.

## HTML Head Requirements

### Font Loading
**ALWAYS include Google Fonts in the `<head>` section** - Font styles must be loaded before CSS:

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;600;700&family=Merriweather+Sans:wght@300;400;600;700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
```

### Required Dependencies
- **Bootstrap 4.6.2 CSS** (before PLUS CSS)
- **Font Awesome** for icons
- **PLUS Design System CSS** (`dist/css/main.css` or correct relative path)
- **jQuery** (before Bootstrap JS)
- **Bootstrap 4.6.2 JS**

## Bootstrap Integration

- **ALWAYS override Bootstrap default spacing/padding with design tokens**
- Bootstrap components (form-check, custom-control, dropdown, etc.) have default spacing that must be overridden
- Example: `.form-check` has default `padding-left: 1.25rem` - override with `padding-left: 0` and use `gap: var(--size-element-gap-sm)` instead
- Never rely on Bootstrap's default spacing - always use design tokens from Figma

## Highcharts Setup

### Required Setup
**ALWAYS include Highcharts CDN links** in the HTML `<head>` section when creating data visualizations:

```html
<!-- Highcharts -->
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
```

### Script Order
1. jQuery (if using)
2. Bootstrap JS
3. **Highcharts scripts** ← Must be here
4. Your custom JavaScript that creates charts

### Using PLUS Design Tokens
**ALWAYS use PLUS design tokens** for chart styling:
- Colors: `var(--color-primary)`, `var(--color-secondary)`, etc.
- Typography: `var(--font-family-header)`, `var(--font-size-h4)`, etc.
- Background: `transparent` or `var(--color-surface)`

## Image Handling

### Image Location
All images live in `design-system/assets/images/` organized by category:
- `logos/` - Logo assets (SVG preferred)
- `auth-providers/` - Authentication provider images (Clever, Google, etc.)
- `icons/` - Custom icon images (if not using Font Awesome)

### Image Format Guidelines
- **SVG**: Use for logos, icons, and simple graphics (scalable, small file size)
- **PNG**: Use for complex images, photos, or images requiring transparency
- **JPG**: Use for photos without transparency needs

### Standard Placeholder Workflow
When an image is referenced but doesn't exist:

1. **Check** if image exists in `design-system/assets/images/`
2. **If missing**, ask user to upload the image
3. **In first pass**, use filled placeholder div with appropriate dimensions
4. **Replace** placeholder with actual image once provided

### Image Generation/Prototyping Workflow
When user explicitly requests image generation/prototyping:

1. **Check** if similar image exists in `design-system/assets/images/` (reuse if found)
2. **If not found**, generate or fetch image:
   - **Option A**: Fetch placeholder from service (placeholder.com, via.placeholder.com) matching style/size
   - **Option B**: Auto-generate simple image (SVG for graphics, PNG for photos)
3. **ALWAYS save** generated/fetched image to `design-system/assets/images/{category}/` with descriptive name
4. **Use** the saved asset in implementation (never use inline/temporary images)
5. **Document** the image in assets README for future reference

### Placeholder Pattern
Use this standard pattern for image placeholders:

```html
<div class="image-placeholder" 
     style="width: {width}px; height: {height}px;" 
     title="Image placeholder - please provide {image-name}">
</div>
```

CSS for `.image-placeholder`:
```css
.image-placeholder {
    background-color: var(--color-surface-container-low, #f3f3f6);
    border: 1px dashed var(--color-outline-variant, #bec8ca);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-on-surface-variant, #3f484a);
    font-size: var(--font-size-body3, 10px);
}
```

### Special Cases

#### Clever Image
Clever authentication uses PNG file from `design-system/assets/images/auth-providers/clever-image.png`.

### Reference Examples

**Using Clever Image:**
```javascript
// From prototyping/templates/login/
const cleverImagePath = "../../../design-system/assets/images/auth-providers/clever-image.png";
const img = document.createElement('img');
img.src = cleverImagePath;
img.alt = "Clever";
```

**Using Placeholder:**
```javascript
const placeholder = document.createElement('div');
placeholder.className = 'image-placeholder';
placeholder.style.width = '200px';
placeholder.style.height = '44px';
placeholder.title = 'Image placeholder - please provide clever-image.png';
```

## Prototyping Checklist

### HTML Head Section
- [ ] Google Fonts are loaded (all three families: Lato, Merriweather Sans, Open Sans)
- [ ] Font preconnect links are included
- [ ] Bootstrap 4.6.2 CSS is included
- [ ] Font Awesome is included
- [ ] PLUS Design System CSS is included
- [ ] jQuery is included (before Bootstrap JS)
- [ ] Bootstrap 4.6.2 JS is included
- [ ] Highcharts is included (if creating data visualizations)

### Component Imports
- [ ] Import path is correct for prototype location
- [ ] Import statement uses correct syntax
- [ ] Module type is specified: `<script type="module" src="...">`

### Design Tokens
- [ ] No hardcoded values - all spacing, colors, typography use design tokens
- [ ] Semantic tokens are used (not primitives)
- [ ] Token prefix matches component type

### Table Styling
- [ ] Table tokens are used - Never hardcode table cell padding or spacing
- [ ] Cell padding uses `--size-table-cell-x` and `--size-table-cell-y`
- [ ] Cell gap uses `--size-table-cell-gap`
- [ ] Border radius uses `--size-table-radius-sm` or `--size-table-radius-md`

## Storybook Organization

### Standard Structure
```
ComponentName/
├── Overview/
│   ├── AllVariants
│   └── Interactive
├── Visual Style Variants/
│   ├── Primary
│   ├── Secondary
│   └── ...
├── States/
│   ├── Enabled
│   └── Disabled
└── Content Variants/
    └── WithIcons
```

### File Naming
- Main story: `{ComponentName}.stories.js`
- Style variants: `{ComponentName}.StyleVariants.stories.js`
- States: `{ComponentName}.States.stories.js`
- Content variants: `{ComponentName}.ContentVariants.stories.js`

## Figma Integration

### Design Token Extraction
Extract from Figma:
1. **Colors**: Primary, secondary, tertiary, accent colors, neutral colors, state layers
2. **Typography**: Font families, sizes, weights, line heights
3. **Spacing**: Within component, between components, between sections
4. **Sizes**: Border radius, border widths, breakpoints

### Component Specifications
Extract component specifications including:
- Variants and states
- Spacing and sizing
- Color usage
- Typography
- Interactive states

## File Structure

### Organization
- Components: `design-system/components/` (atoms, molecules, organisms)
- Token SCSS: `develop/tokens/`
- Token Docs: `design-system/styles/`
- Component Styles: `design-system/components/{atoms|molecules}/{ComponentName}/`
- Prototyping: `prototyping/templates/` and `prototyping/playground/`

### Naming Conventions
- Files: kebab-case (e.g., `button.js`, `index.js`)
- Classes: PascalCase (e.g., `PlusInterface`)
- Functions: camelCase (e.g., `createButton`)
- CSS classes: kebab-case (e.g., `plus-text-field`)

## Best Practices

### Code Quality
1. Always include JSDoc comments
2. Use design tokens (never hardcode values)
3. Follow component patterns
4. Maintain accessibility (ARIA attributes, keyboard navigation)
5. Ensure responsive design
6. Handle errors gracefully
7. Use functional code patterns

### Component Creation
1. Reference production repository first
2. Use static methods for component creation
3. Return DOM elements (not HTML strings where possible)
4. Accept configuration objects as parameters
5. Provide sensible defaults
6. Document all parameters with JSDoc
7. Match production implementation patterns exactly

### Accessibility
- Include proper ARIA attributes
- Ensure keyboard navigation works
- Use semantic HTML elements
- Provide alt text for images
- Ensure color contrast meets WCAG standards

## Anti-Patterns to Avoid

1. ❌ Hardcoding colors → ✅ Use `var(--color-primary)`
2. ❌ Hardcoding spacing or using primitives → ✅ Use semantic tokens
3. ❌ Wrong semantic layer → ✅ Match token to component context
4. ❌ Using element-gap-xs for non-label-input spacing → ✅ Reserved token only
5. ❌ Skipping JSDoc → ✅ Always document functions
6. ❌ Ignoring accessibility → ✅ Always include ARIA attributes
7. ❌ Skipping responsive design → ✅ Always consider screen sizes
8. ❌ Creating components from scratch → ✅ Use existing PLUS components
9. ❌ Relying on Bootstrap default spacing → ✅ Override with design tokens
10. ❌ Missing font loading → ✅ Always include font links
11. ❌ Missing Highcharts CDN → ✅ Always include when creating charts
12. ❌ Incorrect import paths → ✅ Always verify import path
13. ❌ Hardcoding table styling → ✅ Always use table design tokens
14. ❌ Hardcoding elevation → ✅ Always use elevation tokens

## Design Patterns

This section describes common design patterns and best practices for creating prototypes with the PLUS design system.

### Layout Patterns

#### Container Patterns
```html
<div class="container-fluid padding-4">
    <!-- Content -->
</div>
```

#### Grid Layout
```html
<div class="row gap-between-components-3">
    <div class="col-md-6">
        <!-- Content -->
    </div>
    <div class="col-md-6">
        <!-- Content -->
    </div>
</div>
```

#### PLUS Grid 5
```html
<div class="plus-grid-5 gap-between-components-2">
    <!-- 5-column responsive grid -->
</div>
```

### Component Patterns

#### Button Groups
```html
<div class="d-flex gap-between-components-2">
    <button class="pbtn pbtn-filled pbtn-primary">Primary</button>
    <button class="pbtn pbtn-outline pbtn-primary">Secondary</button>
</div>
```

#### Form Patterns
```html
<form class="padding-4">
    <div class="component-margin-btm-3">
        <label class="body3-txt color-neutral-on-surface-variant component-margin-btm-1">
            Label Text
        </label>
        <input type="text" class="plus-text-field body2-txt w-100" placeholder="Placeholder">
    </div>
</form>
```

#### Card Patterns
```html
<div class="plus-card padding-4">
    <h4 class="h4 component-margin-btm-2">Card Title</h4>
    <p class="body1-txt">Card content</p>
</div>
```

#### SMART Card Patterns
```html
<div class="bg-smart-card d-flex flex-column padding-4">
    <div class="h6 smart-card-title-row component-margin-btm-3">Title</div>
    <div class="smart-card-body flex-grow-1">
        <div class="col">
            <div class="text-content">
                <div class="body2-txt font-weight-bold">Heading</div>
                <div class="body3-txt">Caption</div>
            </div>
        </div>
    </div>
</div>
```

### Typography Patterns

#### Heading Patterns
```html
<h1 class="h1 component-margin-btm-2">Main Heading</h1>
<h2 class="h2 component-margin-btm-2">Section Heading</h2>
<h3 class="h3 component-margin-btm-2">Subsection Heading</h3>
```

#### Body Text Patterns
```html
<p class="body1-txt">Main body text</p>
<p class="body2-txt">Secondary body text</p>
<p class="body3-txt">Tertiary body text</p>
```

#### Text with Icons
```html
<div class="d-flex align-items-center gap-between-components-2">
    <i class="fas fa-icon color-primary"></i>
    <span class="body1-txt">Text with icon</span>
</div>
```

### Color Patterns

#### Background Colors
```html
<div class="bg-color-primary color-white padding-3">
    Primary background
</div>
```

#### Text Colors
```html
<p class="color-primary">Primary text</p>
<p class="color-success">Success text</p>
<p class="color-error">Error text</p>
```

#### SMART Colors
```html
<div class="bg-color-smartClrSe-alt color-smartClrSe padding-3">
    Social-Emotional content
</div>
```

### Spacing Patterns

#### Component Spacing
```html
<div class="component-margin-top-3 component-margin-btm-3">
    <!-- Spaced component -->
</div>
```

#### Section Spacing
```html
<section class="section-margin-top-4 section-margin-btm-4">
    <!-- Spaced section -->
</section>
```

#### Internal Spacing
```html
<div class="padding-4">
    <!-- Padded content -->
</div>
```

### Interactive Patterns

#### Button States
```html
<!-- Default -->
<button class="pbtn pbtn-filled pbtn-primary">Default</button>

<!-- Hover (automatic via CSS) -->
<!-- Active (automatic via CSS) -->
<!-- Disabled -->
<button class="pbtn pbtn-filled pbtn-primary" disabled>Disabled</button>
```

#### Form Validation
```html
<div class="component-margin-btm-3">
    <label class="body3-txt color-neutral-on-surface-variant component-margin-btm-1">
        Email <span class="color-error">*</span>
    </label>
    <input type="email" class="plus-text-field body2-txt w-100" required>
    <div class="body3-txt color-error component-margin-top-1" style="display: none;">
        Please enter a valid email
    </div>
</div>
```

### Responsive Patterns

#### Breakpoint Usage
```html
<div class="col-12 col-md-6 col-lg-4">
    <!-- Responsive column -->
</div>
```

#### Responsive Spacing
```css
@media (min-width: 992px) {
    .my-element {
        padding: var(--size-spacing-between-components-4);
    }
}
```

### Accessibility Patterns

#### ARIA Labels
```html
<button class="pbtn pbtn-filled pbtn-primary" aria-label="Submit form">
    Submit
</button>
```

#### Semantic HTML
```html
<nav role="navigation" aria-label="Main navigation">
    <!-- Navigation content -->
</nav>
```

#### Keyboard Navigation
```html
<button class="pbtn pbtn-filled pbtn-primary" tabindex="0">
    Keyboard accessible button
</button>
```

### Common Combinations

#### Header with Action
```html
<div class="d-flex justify-content-between align-items-center component-margin-btm-3">
    <h2 class="h2 m-0">Section Title</h2>
    <button class="pbtn pbtn-filled pbtn-primary">Action</button>
</div>
```

#### Card with Footer
```html
<div class="plus-card">
    <div class="padding-4">
        <h4 class="h4 component-margin-btm-2">Card Title</h4>
        <p class="body1-txt">Card content</p>
    </div>
    <div class="border-top border-outline-variant padding-4 d-flex justify-content-end gap-between-components-2">
        <button class="pbtn pbtn-text pbtn-default">Cancel</button>
        <button class="pbtn pbtn-filled pbtn-primary">Save</button>
    </div>
</div>
```

#### Status Display
```html
<div class="d-flex align-items-center gap-between-components-2">
    <i class="fas fa-check-circle color-success"></i>
    <span class="body1-txt">Status: Complete</span>
</div>
```

## See Also

- [Styles Overview](../design-system/styles/overview.md) - Design token documentation
- [Components Overview](../design-system/components/overview.md) - Component documentation
- [Import Paths](imports.md) - Component import path reference
- [Token Source Files](tokens/) - Token SCSS files

