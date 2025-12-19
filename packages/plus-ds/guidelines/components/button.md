# Button Component

## Import
```jsx
import { Button } from '@tutors.plus/design-system';
```

## Props

| Prop | Type | Values | Default |
|------|------|--------|---------|
| `style` | string | `primary`, `secondary`, `tertiary`, `success`, `warning`, `danger`, `info` | `primary` |
| `fill` | string | `filled`, `tonal`, `outline`, `ghost` | `filled` |
| `size` | string | `small`, `medium`, `large` | `medium` |
| `leadingVisual` | string | Font Awesome icon name (e.g., `plus`, `trash`) | - |
| `trailingVisual` | string | Font Awesome icon name | - |
| `disabled` | boolean | `true`, `false` | `false` |
| `block` | boolean | `true`, `false` | `false` |
| `children` | node | Button text/content | - |

## Examples

```jsx
// Basic styles
<Button style="primary">Primary</Button>
<Button style="secondary">Secondary</Button>
<Button style="danger">Delete</Button>

// Fill variants
<Button style="primary" fill="filled">Filled</Button>
<Button style="primary" fill="outline">Outline</Button>
<Button style="primary" fill="ghost">Ghost</Button>

// Sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// With icons (Font Awesome names only)
<Button leadingVisual="plus">Add Item</Button>
<Button trailingVisual="arrow-right">Next</Button>

// States
<Button disabled>Disabled</Button>
<Button block>Full Width</Button>
```

## Common Mistakes

```jsx
// ❌ WRONG - Don't use "variant"
<Button variant="primary">Click</Button>

// ✅ CORRECT - Use "style"
<Button style="primary">Click</Button>

// ❌ WRONG - Don't use Lucide icons
import { Plus } from "lucide-react";
<Button><Plus /></Button>

// ✅ CORRECT - Use Font Awesome via leadingVisual
<Button leadingVisual="plus">Add</Button>
```
