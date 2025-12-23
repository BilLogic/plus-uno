# Alert Component

## Purpose
Display status messages and feedback to users.

## Import
```jsx
import { Alert } from '@tutors.plus/design-system';
```

## Variants

| Variant | Use Case |
|---------|----------|
| `success` | Successful operations, confirmations |
| `warning` | Warnings, cautions |
| `danger` | Errors, failures |
| `info` | Informational messages |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'info'` | Visual style |
| `dismissible` | boolean | `false` | Show close button |
| `onClose` | function | - | Dismiss handler |

## Examples

```jsx
// Success message
<Alert variant="success">
  Your changes have been saved successfully.
</Alert>

// Error message
<Alert variant="danger">
  An error occurred. Please try again.
</Alert>

// Warning
<Alert variant="warning">
  Your session will expire in 5 minutes.
</Alert>

// Dismissible
<Alert variant="info" dismissible onClose={() => {}}>
  New features are available!
</Alert>
```

## Usage Rules

✅ **DO**:
- Use `success` for completed actions
- Use `danger` for actual errors
- Keep messages concise and actionable

❌ **DON'T**:
- Use `danger` for warnings (use `warning` instead)
- Show multiple alerts for the same event
- Use alerts for non-important information
