# Breadcrumb Component

## Purpose
Navigation path indicators showing the user's current location in a hierarchy.

## Import
```jsx
import { Breadcrumb } from '@tutors.plus/design-system';
```

## Examples

```jsx
// Basic breadcrumb
<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
  <Breadcrumb.Item active>Current Page</Breadcrumb.Item>
</Breadcrumb>
```

## Usage Rules

✅ **DO**:
- Use `active` on the current page item
- Include href for navigable items
- Start with "Home" or root level

❌ **DON'T**:
- Include more than 4-5 levels
- Make the current page clickable
- Use on single-level pages
