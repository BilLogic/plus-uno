# Typography

The PLUS Design System uses a specific set of fonts to ensure readability and brand consistency.

## Font Families

| Type | Family | Usage |
|------|--------|-------|
| **Sans Serif** | `Lato` | Primary UI text, Body copy |
| **Serif** | `Merriweather Sans` | Headings, Titles |
| **Monospace** | `Source Code Pro` | Code snippets, Technical data |

*Note: `Open Sans` is also available as a fallback.*

## Installation (CDN)

To use these fonts, add the following `<link>` tags to the `<head>` of your HTML entry file (e.g., `index.html`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather+Sans:wght@300;400;700&family=Open+Sans:wght@300;400;700&family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet">
```

## Usage

Use the provided SCSS tokens or mixins to apply typography.

```scss
.my-element {
    font-family: var(--font-family-base); // Lato
}
```
