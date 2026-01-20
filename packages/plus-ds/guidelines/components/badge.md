# Badge Component

## Import
```jsx
import { Badge } from '@tutors.plus/design-system';
```

## Props

| Prop | Type | Values | Default |
|------|------|--------|---------|
| `children` | node | Badge content | - |
| `text` | string | Alternative to children | - |
| `style` | string | `primary`, `secondary`, `tertiary`, `success`, `warning`, `danger`, `info` | `primary` |
| `size` | string | `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `b1`, `b2`, `b3` | `b2` |
| `dismissible` | boolean | `true`, `false` | `false` |
| `onDismiss` | function | Callback when dismissed | - |

> **Note**: Use either `children` or `text` prop for badge content. Both patterns work:

## Size Reference

| Size | Typography | Use Case |
|------|------------|----------|
| `h1`-`h6` | Header sizes (bold) | Large/prominent badges |
| `b1`-`b3` | Body sizes (semibold) | Inline/standard badges |

## Examples

```jsx
// Basic usage
<Badge style="primary">New</Badge>
<Badge style="success">Active</Badge>
<Badge style="danger">Failed</Badge>

// Different sizes
<Badge size="h4" style="primary">Large Badge</Badge>
<Badge size="b2" style="success">Default Size</Badge>
<Badge size="b3" style="info">Small Badge</Badge>

// Dismissible
<Badge style="secondary" dismissible onDismiss={() => {}}>
  Filter
</Badge>
```

## Common Mistakes

```jsx
// ❌ WRONG - Don't use "variant"
<Badge variant="success">Active</Badge>

// ✅ CORRECT - Use "style"
<Badge style="success">Active</Badge>

// ❌ WRONG - Don't use "default" as a style
<Badge variant="default">Tag</Badge>

// ✅ CORRECT - Use "primary" or "secondary"
<Badge style="primary">Tag</Badge>
```
