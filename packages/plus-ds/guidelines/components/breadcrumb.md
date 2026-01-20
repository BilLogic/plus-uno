# Breadcrumb Component

## Import
```jsx
import { Breadcrumb } from '@tutors.plus/design-system';
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | array | **Required** - Array of breadcrumb items |
| `separator` | node | Custom separator (default: `/`) |
| `className` | string | Additional CSS classes |

### Item Object Structure

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | **Required** - Item label |
| `href` | string | Link destination (optional for last item) |
| `onClick` | function | Click handler (optional) |

## Basic Usage

```jsx
<Breadcrumb items={[
  { text: "Home", href: "/" },
  { text: "Products", href: "/products" },
  { text: "Current Page" }  // No href = current/active
]} />
```

## Examples

```jsx
// Standard navigation breadcrumb
<Breadcrumb items={[
  { text: "Home", href: "/" },
  { text: "Courses", href: "/courses" },
  { text: "Mathematics" }
]} />

// With custom separator
<Breadcrumb
  separator="›"
  items={[
    { text: "Dashboard", href: "/dashboard" },
    { text: "Settings", href: "/settings" },
    { text: "Profile" }
  ]}
/>

// With click handlers
<Breadcrumb items={[
  { text: "Home", onClick: () => navigate('/') },
  { text: "Products", onClick: () => navigate('/products') },
  { text: "Current Page" }
]} />
```

## Rules

1. **Always use items array** - Pass breadcrumb items as an array prop
2. **Last item should not have href** - Indicates current page
3. **Keep breadcrumbs concise** - Maximum 4-5 levels recommended
