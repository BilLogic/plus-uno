# Components Overview (Pilot v0.1.0)

## Available Components

The pilot release includes **6 components**:

| Component | Purpose |
|-----------|---------|
| `Accordion` | Collapsible content panels |
| `Alert` | Status messages and notifications |
| `Badge` | Status indicators and labels |
| `Breadcrumb` | Navigation path indicators |
| `Button` | Action triggers |
| `ButtonGroup` | Grouped buttons |

## Import All

```jsx
import { 
  Accordion, 
  Alert, 
  Badge, 
  Breadcrumb, 
  Button, 
  ButtonGroup 
} from '@tutors.plus/design-system';
```

## Key API Differences

This design system differs from other libraries:

| This Library | Other Libraries |
|--------------|-----------------|
| `style="primary"` | `variant="primary"` |
| `size="small/medium/large"` | `size="sm/md/lg"` |
| Font Awesome icons | Lucide, Heroicons, etc. |
| `Breadcrumb.Item` children | `items={[...]}` array |

## Style Values

All components use the `style` prop with these values:

- `primary` - Main actions (blue)
- `secondary` - Secondary actions (gray-blue)
- `tertiary` - Accent (teal)
- `success` - Positive states (green)
- `warning` - Caution states (yellow)
- `danger` - Error/destructive (red)
- `info` - Informational (teal)

## Quick Examples

```jsx
<Button style="primary">Save</Button>
<Alert style="warning">Warning message</Alert>
<Badge style="success">Active</Badge>

<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item active>Current</Breadcrumb.Item>
</Breadcrumb>
```
