# PLUS Design Patterns

This document describes common design patterns and best practices for creating prototypes with the PLUS design system.

## Layout Patterns

### Container Patterns
```html
<div class="container-fluid padding-4">
    <!-- Content -->
</div>
```

### Grid Layout
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

### PLUS Grid 5
```html
<div class="plus-grid-5 gap-between-components-2">
    <!-- 5-column responsive grid -->
</div>
```

## Component Patterns

### Button Groups
```html
<div class="d-flex gap-between-components-2">
    <button class="pbtn pbtn-filled pbtn-primary">Primary</button>
    <button class="pbtn pbtn-outline pbtn-primary">Secondary</button>
</div>
```

### Form Patterns
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

### Card Patterns
```html
<div class="plus-card padding-4">
    <h4 class="h4 component-margin-btm-2">Card Title</h4>
    <p class="body1-txt">Card content</p>
</div>
```

### SMART Card Patterns
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

## Typography Patterns

### Heading Patterns
```html
<h1 class="h1 component-margin-btm-2">Main Heading</h1>
<h2 class="h2 component-margin-btm-2">Section Heading</h2>
<h3 class="h3 component-margin-btm-2">Subsection Heading</h3>
```

### Body Text Patterns
```html
<p class="body1-txt">Main body text</p>
<p class="body2-txt">Secondary body text</p>
<p class="body3-txt">Tertiary body text</p>
```

### Text with Icons
```html
<div class="d-flex align-items-center gap-between-components-2">
    <i class="fas fa-icon color-primary"></i>
    <span class="body1-txt">Text with icon</span>
</div>
```

## Color Patterns

### Background Colors
```html
<div class="bg-color-primary color-white padding-3">
    Primary background
</div>
```

### Text Colors
```html
<p class="color-primary">Primary text</p>
<p class="color-success">Success text</p>
<p class="color-error">Error text</p>
```

### SMART Colors
```html
<div class="bg-color-smartClrSe-alt color-smartClrSe padding-3">
    Social-Emotional content
</div>
```

## Spacing Patterns

### Component Spacing
```html
<div class="component-margin-top-3 component-margin-btm-3">
    <!-- Spaced component -->
</div>
```

### Section Spacing
```html
<section class="section-margin-top-4 section-margin-btm-4">
    <!-- Spaced section -->
</section>
```

### Internal Spacing
```html
<div class="padding-4">
    <!-- Padded content -->
</div>
```

## Interactive Patterns

### Button States
```html
<!-- Default -->
<button class="pbtn pbtn-filled pbtn-primary">Default</button>

<!-- Hover (automatic via CSS) -->
<!-- Active (automatic via CSS) -->
<!-- Disabled -->
<button class="pbtn pbtn-filled pbtn-primary" disabled>Disabled</button>
```

### Form Validation
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

## Responsive Patterns

### Breakpoint Usage
```html
<div class="col-12 col-md-6 col-lg-4">
    <!-- Responsive column -->
</div>
```

### Responsive Spacing
```css
@media (min-width: 992px) {
    .my-element {
        padding: var(--size-spacing-between-components-4);
    }
}
```

## Accessibility Patterns

### ARIA Labels
```html
<button class="pbtn pbtn-filled pbtn-primary" aria-label="Submit form">
    Submit
</button>
```

### Semantic HTML
```html
<nav role="navigation" aria-label="Main navigation">
    <!-- Navigation content -->
</nav>
```

### Keyboard Navigation
```html
<button class="pbtn pbtn-filled pbtn-primary" tabindex="0">
    Keyboard accessible button
</button>
```

## Common Combinations

### Header with Action
```html
<div class="d-flex justify-content-between align-items-center component-margin-btm-3">
    <h2 class="h2 m-0">Section Title</h2>
    <button class="pbtn pbtn-filled pbtn-primary">Action</button>
</div>
```

### Card with Footer
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

### Status Display
```html
<div class="d-flex align-items-center gap-between-components-2">
    <i class="fas fa-check-circle color-success"></i>
    <span class="body1-txt">Status: Complete</span>
</div>
```

## Best Practices

1. **Consistent Spacing**: Use design tokens for all spacing
2. **Color Usage**: Use semantic color classes and variables
3. **Typography**: Use typography utility classes consistently
4. **Component Reuse**: Use existing components when possible
5. **Accessibility**: Always include ARIA attributes and semantic HTML
6. **Responsive**: Design for all screen sizes
7. **Performance**: Keep components lightweight and efficient
8. **Documentation**: Document complex patterns and components

