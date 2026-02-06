# Component Overview

This package provides 6 pilot components for Figma Make.

## Available Components

### Accordion
Collapsible content panels for organizing information.

```jsx
import { Accordion } from '@tutors.plus/design-system';

<Accordion defaultActiveKey="0">
  <Accordion.Item eventKey="0">
    <Accordion.Header>Section 1</Accordion.Header>
    <Accordion.Body>Content for section 1</Accordion.Body>
  </Accordion.Item>
</Accordion>
```

### Alert
Status messages for user feedback. Use `style` prop for color theme.

```jsx
import { Alert } from '@tutors.plus/design-system';

<Alert style="success">Operation completed successfully!</Alert>
<Alert style="warning">Please review before continuing.</Alert>
<Alert style="danger">An error occurred.</Alert>
<Alert style="info">Here's some helpful information.</Alert>
```

### Badge
Status indicators and labels. Use `style` prop for color, `text` prop for label.

```jsx
import { Badge } from '@tutors.plus/design-system';

<Badge text="New" style="primary" />
<Badge text="Active" style="success" />
<Badge text="Pending" style="warning" />
```

### Breadcrumb
Navigation path indicators.

```jsx
import { Breadcrumb } from '@tutors.plus/design-system';

<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
  <Breadcrumb.Item active>Current Page</Breadcrumb.Item>
</Breadcrumb>
```

### Button
Action triggers. Use `style` for color theme and `fill` for visual weight.

```jsx
import { Button } from '@tutors.plus/design-system';

<Button text="Primary Action" style="primary" fill="filled" />
<Button text="Secondary" style="secondary" fill="tonal" />
<Button text="Outline" style="primary" fill="outline" />
<Button text="Text Button" style="tertiary" fill="ghost" />
```

### ButtonGroup
Grouped button layouts. Set `style` and `fill` on the group to cascade to children.

```jsx
import { ButtonGroup, Button } from '@tutors.plus/design-system';

<ButtonGroup style="primary" fill="tonal">
  <Button text="Option 1" />
  <Button text="Option 2" />
  <Button text="Option 3" />
</ButtonGroup>
```

---

## When to Use Each Component

| Use Case | Component | Props |
|----------|-----------|-------|
| Main page actions | `Button` | `style="primary" fill="filled"` |
| Secondary actions | `Button` | `style="secondary" fill="tonal"` |
| Status indicators | `Badge` | `style="success"` or `style="warning"` |
| User feedback | `Alert` | `style="success"` or `style="danger"` |
| Navigation breadcrumbs | `Breadcrumb` | — |
| Collapsible sections | `Accordion` | — |
| Related action groups | `ButtonGroup` | `style="primary" fill="outline"` |
