# PLUS Design System Guidelines (Pilot v0.1.0)

> **PILOT VERSION**: This is a limited pilot release with 6 components. More components coming in future versions.

## CRITICAL: Import Order

You MUST include fonts and CSS in this exact order:

```html
<!-- In your HTML head or index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather+Sans:wght@300;400;700&family=Open+Sans:wght@400;600&family=Source+Code+Pro:wght@300&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
```

```jsx
// In your React code
import '@tutors.plus/design-system/styles';
import { Button, Alert, Badge, Breadcrumb, Accordion, ButtonGroup } from '@tutors.plus/design-system';
```

**WARNING**: If you skip the CSS imports, components will appear unstyled.

---

## Available Components (Pilot)

Only these 6 components are available in the pilot:

| Component | Import |
|-----------|--------|
| `Accordion` | `import { Accordion } from '@tutors.plus/design-system'` |
| `Alert` | `import { Alert } from '@tutors.plus/design-system'` |
| `Badge` | `import { Badge } from '@tutors.plus/design-system'` |
| `Breadcrumb` | `import { Breadcrumb } from '@tutors.plus/design-system'` |
| `Button` | `import { Button } from '@tutors.plus/design-system'` |
| `ButtonGroup` | `import { ButtonGroup } from '@tutors.plus/design-system'` |

---

## IMPORTANT: Prop Names

**Use `style` NOT `variant`** for color themes:

```jsx
// ✅ CORRECT
<Button style="primary">Click</Button>
<Alert style="warning">Warning</Alert>
<Badge style="success">Active</Badge>

// ❌ WRONG - "variant" does NOT work
<Button variant="primary">Click</Button>
```

---

## Icons: Font Awesome Only

**Use Font Awesome solid icons**, NOT Lucide or other icon libraries:

```jsx
// ✅ CORRECT - Font Awesome
<Button leadingVisual="plus">Add</Button>
<i className="fa-solid fa-check" />

// ❌ WRONG - Lucide icons don't work
import { Plus } from "lucide-react";
<Button><Plus /></Button>
```

---

## Component Quick Reference

### Button
```jsx
<Button style="primary">Primary Action</Button>
<Button style="secondary" fill="outline">Cancel</Button>
<Button style="danger">Delete</Button>
<Button size="small">Small</Button>
<Button size="large">Large</Button>
<Button leadingVisual="plus">Add Item</Button>
<Button disabled>Disabled</Button>
```

**Props**: `style` (primary/secondary/danger/success/warning/info), `fill` (filled/outline/ghost), `size` (small/medium/large), `leadingVisual`, `disabled`

### Alert
```jsx
<Alert style="info">Info message</Alert>
<Alert style="success" title="Success">Saved successfully.</Alert>
<Alert style="warning">Warning message</Alert>
<Alert style="danger">Error message</Alert>
```

**Props**: `style` (primary/success/warning/danger/info), `title`, `dismissable`, `onDismiss`

### Badge
```jsx
<Badge style="primary">New</Badge>
<Badge style="success" size="b2">Active</Badge>
<Badge style="danger" size="h4">Failed</Badge>
```

**Props**: `style` (primary/secondary/success/warning/danger), `size` (h1-h6 for headers, b1-b3 for body)

### Breadcrumb
```jsx
<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/courses">Courses</Breadcrumb.Item>
  <Breadcrumb.Item active>Current Page</Breadcrumb.Item>
</Breadcrumb>
```

**Note**: Use `Breadcrumb.Item` children, NOT an `items` array prop.

### ButtonGroup
```jsx
<ButtonGroup>
  <Button style="secondary">Left</Button>
  <Button style="secondary">Middle</Button>
  <Button style="secondary">Right</Button>
</ButtonGroup>
```

### Accordion
```jsx
<Accordion defaultActiveKey="0">
  <Accordion.Item eventKey="0">
    <Accordion.Header>Section One</Accordion.Header>
    <Accordion.Body>Content here</Accordion.Body>
  </Accordion.Item>
</Accordion>
```

---

## Full Example

```jsx
import React from 'react';
import '@tutors.plus/design-system/styles';
import { Button, Alert, Badge, Breadcrumb, ButtonGroup } from '@tutors.plus/design-system';

// Note: Fonts and Bootstrap CSS should be loaded via CDN in index.html

function App() {
  return (
    <div>
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
      </Breadcrumb>

      <Alert style="info" title="Welcome">
        This is a PLUS Design System application.
      </Alert>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button style="primary">Save</Button>
        <Button style="secondary" fill="outline">Cancel</Button>
      </div>

      <Badge style="success" size="b2">Active</Badge>
    </div>
  );
}
```
