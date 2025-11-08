# PLUS Design Tokens

This document contains all design tokens used in the PLUS design system. These tokens should be used consistently across all prototypes and components.

## Colors

### Accent Colors

#### Primary
- **Variable:** `--color-accent-primary`
- **Value:** `#00658e`
- **On Primary:** `--color-accent-on-primary: #ffffff`
- **Primary Container:** `--color-accent-primary-container: #c7e7ff`
- **On Primary Container:** `--color-accent-on-primary-container: #001e2e`

#### Secondary
- **Variable:** `--color-accent-secondary`
- **Value:** `#006972`
- **On Secondary:** `--color-accent-on-secondary: #ffffff`
- **Secondary Container:** `--color-accent-secondary-container: #8bf2ff`
- **On Secondary Container:** `--color-accent-on-secondary-container: #001f23`

#### Tertiary
- **Variable:** `--color-accent-tertiary`
- **Value:** `#0052dd`
- **On Tertiary:** `--color-accent-on-tertiary: #ffffff`
- **Tertiary Container:** `--color-accent-tertiary-container: #dbe1ff`
- **On Tertiary Container:** `--color-accent-on-tertiary-container: #00174c`

#### Danger
- **Variable:** `--color-accent-danger`
- **Value:** `#be0c16`
- **On Danger:** `--color-accent-on-danger: #ffffff`
- **Danger Container:** `--color-accent-danger-container: #ffdad6`
- **On Danger Container:** `--color-accent-on-danger-container: #410002`

#### Success
- **Variable:** `--color-accent-success`
- **Value:** `#3e691a`
- **On Success:** `--color-accent-on-success: #ffffff`
- **Success Container:** `--color-accent-success-container: #bdf292`
- **On Success Container:** `--color-accent-on-success-container: #0c2000`

#### Warning
- **Variable:** `--color-accent-warning`
- **Value:** `#715c00`
- **On Warning:** `--color-accent-on-warning: #ffffff`
- **Warning Container:** `--color-accent-warning-container: #ffe17a`
- **On Warning Container:** `--color-accent-on-warning-container: #231b00`

#### Info
- **Variable:** `--color-accent-info`
- **Value:** Same as tertiary (`--color-accent-tertiary`)
- **On Info:** Same as tertiary
- **Info Container:** Same as tertiary container
- **On Info Container:** Same as tertiary container

### Neutral Colors

#### Background
- **Background:** `--color-neutral-background: #fcfcff`
- **On Background:** `--color-neutral-on-background: #191c1e`

#### Surface
- **Surface:** `--color-neutral-surface: #f9f9fc`
- **On Surface:** `--color-neutral-on-surface: #191c1e`
- **Surface Bright:** `--color-neutral-surface-bright: #f9f9fc`
- **Surface Dim:** `--color-neutral-surface-dim: #d9dadd`
- **Surface Variant:** `--color-neutral-surface-variant: #dde3ea`
- **On Surface Variant:** `--color-neutral-on-surface-variant: #3f484a`

#### Surface Containers
- **Container Lowest:** `--color-neutral-surface-container-lowest: #ffffff`
- **Container Low:** `--color-neutral-surface-container-low: #f3f3f6`
- **Container:** `--color-neutral-surface-container: #edeef0`
- **Container High:** `--color-neutral-surface-container-high: #e7e8eb`
- **Container Highest:** `--color-neutral-surface-container-highest: #e2e2e5`

#### Outline
- **Outline:** `--color-neutral-outline: #6f797a`
- **Outline Variant:** `--color-neutral-outline-variant: #bec8ca`

#### Inverse
- **Inverse Primary:** `--color-neutral-inverse-primary: #84cfff`
- **Inverse Surface:** `--color-neutral-inverse-surface: #2e3133`
- **Inverse On Surface:** `--color-neutral-inverse-on-surface: #f0f1f3`

#### Scrim
- **Scrim:** `--color-neutral-scrim: rgba(0,0,0,0.32)`

### Extended Colors (SMART Competency Areas)

#### Social-Emotional Learning
- **Variable:** `--color-extended-social-emotional`
- **Value:** `#8c6600`
- **Text:** `--color-extended-social-emotional-text: #805d00`
- **On Color:** `--color-extended-on-social-emotional: #ffffff`
- **Container:** `--color-extended-social-emotional-container: #ffdeaa`
- **On Container:** `--color-extended-on-social-emotional-container: #271900`
- **8% Opacity (Hex):** `--color-extended-social-emotional-08-hex: #f5f2eb`

#### Mastering Content
- **Variable:** `--color-extended-mastering-content`
- **Value:** `#7f3fb1`
- **Text:** `--color-extended-mastering-content-text: #673a8b`
- **On Color:** `--color-extended-on-mastering-content: #ffffff`
- **Container:** `--color-extended-mastering-content-container: #f2daff`
- **On Container:** `--color-extended-on-mastering-content-container: #2e004e`
- **8% Opacity (Hex):** `--color-extended-mastering-content-08-hex: #f5f0f9`

#### Advocacy
- **Variable:** `--color-extended-advocacy`
- **Value:** `#206c28`
- **Text:** `--color-extended-advocacy-text: #005c2c`
- **On Color:** `--color-extended-on-advocacy: #ffffff`
- **Container:** `--color-extended-advocacy-container: #a6f6a1`
- **On Container:** `--color-extended-on-advocacy-container: #002204`
- **8% Opacity (Hex):** `--color-extended-advocacy-08-hex: #edf3ee`

#### Relationships
- **Variable:** `--color-extended-relationship`
- **Value:** `#c70b77`
- **Text:** `--color-extended-relationship-text: #9c005a`
- **On Color:** `--color-extended-on-relationship: #ffffff`
- **Container:** `--color-extended-relationship-container: #ffd9e1`
- **On Container:** `--color-extended-on-relationship-container: #3f001b`
- **8% Opacity (Hex):** `--color-extended-relationship-08-hex: #f8eef2`

#### Technology Tools
- **Variable:** `--color-extended-technology-tools`
- **Value:** `#005cbd`
- **Text:** `--color-extended-technology-tools-text: #0a469e`
- **On Color:** `--color-extended-on-technology-tools: #ffffff`
- **Container:** `--color-extended-technology-tools-container: #d7e2ff`
- **On Container:** `--color-extended-on-technology-tools-container: #001a40`
- **8% Opacity (Hex):** `--color-extended-technology-tools-08-hex: #ebf2fa`

### State Layers

State layers use opacity percentages for hover, active, and focus states:
- **8%:** `--state-layer-08: 8%`
- **12%:** `--state-layer-12: 12%`
- **16%:** `--state-layer-16: 16%`

### Elevations (Shadows)

- **Light 1:** `--elevation-light-1: 0px 1px 2px 0px rgba(0, 0, 0, 0.30), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)`
- **Light 2:** `--elevation-light-2: 0px 1px 2px 0px rgba(0, 0, 0, 0.30), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)`
- **Light 3:** `--elevation-light-3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)`
- **Light 4:** `--elevation-light-4: 0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30)`
- **Light 5:** `--elevation-light-5: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)`

## Typography

### Font Families

- **Header Font:** `--font-family-header: "Lato"`
- **Body Font:** `--font-family-body: "Merriweather Sans","Open Sans","sans-serif"`

### Font Weights

- **Normal:** `--font-weight-normal: 300`
- **Semibold 1:** `--font-weight-semibold-1: 400`
- **Semibold 2:** `--font-weight-semibold-2: 600`
- **Bold:** `--font-weight-bold: 700`

### Type Scale

#### Display
- **Display 1:**
  - Font Family: Lato
  - Font Size: `--font-size-display1: 5rem`
  - Line Height: `--font-line-height-display1: 140%`
  - Letter Spacing: `--font-letter-spacing-display1: -0.125rem`
  - Class: `.display1-txt`

- **Display 2:**
  - Font Family: Lato
  - Font Size: `--font-size-display2: 4.5rem`
  - Line Height: `--font-line-height-display2: 138.9%`
  - Letter Spacing: `--font-letter-spacing-display2: -0.0625rem`
  - Class: `.display2-txt`

- **Display 3:**
  - Font Family: Lato
  - Font Size: `--font-size-display3: 4rem`
  - Line Height: `--font-line-height-display3: 150%`
  - Class: `.display3-txt`

- **Display 4:**
  - Font Family: Open Sans
  - Font Size: `--font-size-display4: 3.5rem`
  - Line Height: `--font-line-height-display4: 150%`
  - Letter Spacing: `--font-letter-spacing-display4: 0.0625rem`
  - Class: `.display4-txt`

#### Headlines
- **H1:**
  - Font Family: Lato
  - Font Weight: Bold (700)
  - Font Size: `--font-size-h1: 2.5rem`
  - Line Height: `--font-line-height-h1: 160%`
  - Class: `h1, .h1`

- **H2:**
  - Font Family: Lato
  - Font Weight: Bold (700)
  - Font Size: `--font-size-h2: 2rem`
  - Line Height: `--font-line-height-h2: 150%`
  - Class: `h2, .h2`

- **H3:**
  - Font Family: Lato
  - Font Weight: Bold (700)
  - Font Size: `--font-size-h3: 1.75rem`
  - Line Height: `--font-line-height-h3: 142.9%`
  - Class: `h3, .h3`

#### Titles
- **H4:**
  - Font Family: Lato
  - Font Weight: Semibold 2 (600)
  - Font Size: `--font-size-h4: 1.5rem`
  - Line Height: `--font-line-height-h4: 133.3%`
  - Class: `h4, .h4`

- **H5:**
  - Font Family: Lato
  - Font Weight: Semibold 2 (600)
  - Font Size: `--font-size-h5: 1.25rem`
  - Line Height: `--font-line-height-h5: 140%`
  - Class: `h5, .h5`

- **H6:**
  - Font Family: Lato
  - Font Weight: Semibold 2 (600)
  - Font Size: `--font-size-h6: 1rem`
  - Line Height: `--font-line-height-h6: 150%`
  - Class: `h6, .h6`

#### Body
- **Body 1:**
  - Font Family: Merriweather Sans, Open Sans, sans-serif
  - Font Weight: Normal (300)
  - Font Size: `--font-size-body1: 1rem`
  - Line Height: `--font-line-height-body1: 150%`
  - Class: `.body1-txt`

- **Body 2:**
  - Font Family: Merriweather Sans, Open Sans, sans-serif
  - Font Weight: Normal (300)
  - Font Size: `--font-size-body2: 0.875rem`
  - Line Height: `--font-line-height-body2: 157.1%`
  - Class: `.body2-txt`

- **Body 3:**
  - Font Family: Merriweather Sans, Open Sans, sans-serif
  - Font Weight: Normal (300)
  - Font Size: `--font-size-body3: 0.75rem`
  - Line Height: `--font-line-height-body3: 166.7%`
  - Class: `.body3-txt`

- **Lead:**
  - Font Family: Merriweather Sans, Open Sans, sans-serif
  - Font Weight: Normal (300)
  - Font Size: `--font-size-lead: 1.25rem`
  - Line Height: `--font-line-height-lead: 160%`
  - Class: `.body-lead-txt`

- **Blockquote:**
  - Font Family: Merriweather Sans, Open Sans, sans-serif
  - Font Weight: Semibold 1 (400)
  - Font Size: `--font-size-blockquote: 1.25rem`
  - Line Height: `--font-line-height-blockquote: 160%`
  - Class: `.body-blockquote-txt`

## Spacing

### Within Component Spacing
- **1:** `--size-spacing-within-component-1: 2px`
- **2:** `--size-spacing-within-component-2: 4px`
- **2.5:** `--size-spacing-within-component-2-5: 6px`
- **3:** `--size-spacing-within-component-3: 8px`
- **3.5:** `--size-spacing-within-component-3-5: 10px`
- **4:** `--size-spacing-within-component-4: 12px`
- **4.5:** `--size-spacing-within-component-4-5: 16px`
- **5:** `--size-spacing-within-component-5: 20px`

### Between Components Spacing
- **1:** `--size-spacing-between-components-1: 4px`
- **2:** `--size-spacing-between-components-2: 8px`
- **3:** `--size-spacing-between-components-3: 16px`
- **4:** `--size-spacing-between-components-4: 24px`
- **5:** `--size-spacing-between-components-5: 32px`

### Between Sections Spacing
- **1:** `--size-spacing-between-sections-1: 8px`
- **2:** `--size-spacing-between-sections-2: 16px`
- **3:** `--size-spacing-between-sections-3: 24px`
- **4:** `--size-spacing-between-sections-4: 36px`
- **5:** `--size-spacing-between-sections-5: 48px`

### Utility Classes

#### Padding
- `.padding-1`, `.padding-2`, `.padding-3`, `.padding-4`, `.padding-5`
- `.padding-x-1`, `.padding-x-2`, etc. (horizontal)
- `.padding-y-1`, `.padding-y-2`, etc. (vertical)
- `.padding-top-1`, `.padding-top-2`, etc.
- `.padding-btm-1`, `.padding-btm-2`, etc.
- `.padding-left-1`, `.padding-left-2`, etc.
- `.padding-right-1`, `.padding-right-2`, etc.

#### Component Margins
- `.component-margin-1`, `.component-margin-2`, etc.
- `.component-margin-top-1`, `.component-margin-top-2`, etc.
- `.component-margin-btm-1`, `.component-margin-btm-2`, etc.
- `.component-margin-x-1`, `.component-margin-x-2`, etc.
- `.component-margin-y-1`, `.component-margin-y-2`, etc.

#### Section Margins
- `.section-margin-1`, `.section-margin-2`, etc.
- `.section-margin-top-1`, `.section-margin-top-2`, etc.
- `.section-margin-btm-1`, `.section-margin-btm-2`, etc.

#### Gap
- `.gap-between-components-1`, `.gap-between-components-2`, etc.
- `.gap-between-sections-1`, `.gap-between-sections-2`, etc.
- `.row-gap-between-components-1`, `.row-gap-between-components-2`, etc.
- `.column-gap-between-components-1`, `.column-gap-between-components-2`, etc.

## Sizes

### Base Sizes
Available in px, em, and rem units (4px to 128px in 4px increments):
- `--size-base-4-px: 4px` through `--size-base-128-px: 128px`
- Corresponding `-em` and `-rem` variants

### Breakpoints
- **Medium (md):** `--size-breakpoint-min-width-md: 768px`
- **Large (lg):** `--size-breakpoint-min-width-lg: 992px`
- **Extra Large (xl):** `--size-breakpoint-min-width-xl: 1200px`
- **Extra Extra Large (xxl):** `--size-breakpoint-min-width-xxl: 1400px`

### Border Radius
- **0:** `--size-border-radius-0: 1px`
- **1:** `--size-border-radius-1: 2px`
- **2:** `--size-border-radius-2: 4px`
- **3:** `--size-border-radius-3: 6px`
- **3.5:** `--size-border-radius-3-5: 8px`
- **4:** `--size-border-radius-4: 12px`
- **4.5:** `--size-border-radius-4-5: 16px`
- **5:** `--size-border-radius-5: 96px` (pill shape)

### Border Width
- **0:** `--size-border-width-0: 0px`
- **1:** `--size-border-width-1: 1px`
- **2:** `--size-border-width-2: 2px`
- **3:** `--size-border-width-3: 3px`
- **4:** `--size-border-width-4: 4px`

## Usage Guidelines

### CSS Variables
All design tokens are available as CSS custom properties and should be used via `var()` function:
```css
.my-element {
    color: var(--color-accent-primary);
    padding: var(--size-spacing-within-component-4);
    border-radius: var(--size-border-radius-2);
}
```

### Utility Classes
Use utility classes for common patterns:
```html
<button class="pbtn pbtn-filled pbtn-primary padding-3">
    Click me
</button>
```

### Responsive Design
Use breakpoint-specific tokens and utilities:
```css
@media (min-width: 992px) {
    .my-element {
        padding: var(--size-spacing-between-components-4);
    }
}
```

### State Layers
Use state layers for interactive states:
```css
.button:hover {
    background-color: color-mix(in srgb, var(--color-accent-primary) var(--state-layer-08), transparent);
}
```

