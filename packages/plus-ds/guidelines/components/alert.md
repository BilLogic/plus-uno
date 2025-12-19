# Alert Component

## Import
```jsx
import { Alert } from '@tutors.plus/design-system';
```

## Props

| Prop | Type | Values | Default |
|------|------|--------|---------|
| `style` | string | `primary`, `secondary`, `success`, `warning`, `danger`, `info` | `primary` |
| `title` | string | Alert heading | - |
| `dismissable` | boolean | `true`, `false` | `true` |
| `onDismiss` | function | Callback when dismissed | - |
| `children` | node | **Required** - Alert content | - |

## Examples

```jsx
// Basic usage - content goes in children
<Alert style="info">This is an info message.</Alert>

// With title
<Alert style="success" title="Success">
  Your changes have been saved.
</Alert>

// All styles
<Alert style="primary">Primary alert</Alert>
<Alert style="warning">Warning alert</Alert>
<Alert style="danger">Error alert</Alert>

// Non-dismissable
<Alert style="info" dismissable={false}>
  This cannot be dismissed.
</Alert>

// With dismiss callback
<Alert style="success" onDismiss={() => console.log('dismissed')}>
  Click X to dismiss.
</Alert>
```

## Common Mistakes

```jsx
// ❌ WRONG - Don't use "variant"
<Alert variant="info">Message</Alert>

// ✅ CORRECT - Use "style"
<Alert style="info">Message</Alert>

// ❌ WRONG - Don't use external icons
import { Info } from "lucide-react";
<Alert><Info /> Message</Alert>

// ✅ CORRECT - Just use children for content
<Alert style="info">Message</Alert>
```
