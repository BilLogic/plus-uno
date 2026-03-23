# @tutors.plus/design-system

PLUS Design System package for Figma Make and React applications.

## Installation

```bash
npm install @tutors.plus/design-system react-bootstrap
```

## Setup (CDN Resources)

Add these to your `index.html` `<head>`:

```html
<!-- Fonts via Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather+Sans:wght@300;400;700&family=Open+Sans:wght@400;600&family=Source+Code+Pro:wght@300&display=swap" rel="stylesheet">

<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Font Awesome Icons -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
```

## Usage

```jsx
import '@tutors.plus/design-system/styles';
import { Button, Alert, Badge, Accordion, Breadcrumb } from '@tutors.plus/design-system';

function App() {
  return (
    <div style={{ padding: 'var(--size-section-pad-x-lg)' }}>
      <Button style="primary">Click me</Button>
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
