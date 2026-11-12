# PLUS Design System

The PLUS component library, consumed inside this repository by Storybook and
the prototypes. It is private and unpublished (ADR-006).

## Installation

Run `npm ci` at the repository root. That one install carries everything the
design system and its tests import; `design-system/package.json` holds only its
scripts and peer ranges. Run the suite with `npm run test:design-system`.

## Setup (CDN Resources)

Add these to your `index.html` `<head>`:

```html
<!-- Fonts via Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400..700&family=Noto+Serif:wght@500..600&family=Noto+Sans+Mono:wght@400..500&display=swap" rel="stylesheet">

<!-- Font Awesome Icons -->
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css" rel="stylesheet">
```

## Usage

```jsx
import '@/styles/main.scss';
import { Button, Alert, Badge, Accordion, Breadcrumb } from '@/components';

function App() {
  return (
    <div style={{ padding: 'var(--section-pad-x-spacious)' }}>
      <Button appearance="primary">Click me</Button>
      <Alert style="success" title="Success!">Operation completed.</Alert>
      <Badge style="info">New</Badge>
      
      <Accordion items={[
        { eventKey: "0", header: "Section", body: "Content" }
      ]} />
      
      <Breadcrumb items={[
        { text: "Home", href: "/" },
        { text: "Current Page" }
      ]} />
    </div>
  );
}
```

## Available Components

- **Accordion** - Collapsible content panels (use `items` array)
- **Alert** - Status messages (success, warning, danger, info)
- **Badge** - Status indicators and labels
- **Breadcrumb** - Navigation path (use `items` array)
- **Button** - Action triggers (primary, secondary, success, etc.)
- **ButtonGroup** - Grouped button layouts

## Important Notes

1. **Use `style` prop, not `variant`** for component styling
2. **Accordion and Breadcrumb use `items` array prop** - not subcomponent children
3. **Load CDN resources before design system CSS**

## Guidelines

See the `guidelines/` folder for detailed documentation.
