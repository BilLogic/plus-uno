# Icons (Font Awesome CDN)

## Icon System

This design system uses **Font Awesome Free (Solid)** via CDN.

**DO NOT use**: Lucide, Heroicons, Material Icons, or npm packages.

## Required CDN Link (Add to HTML head)

```html
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
```

## Usage with Button Component

```jsx
// Use icon name only (without 'fa-' prefix)
<Button leadingVisual="plus">Add Item</Button>
<Button leadingVisual="trash">Delete</Button>
<Button trailingVisual="arrow-right">Next</Button>
```

## Standalone Icons

```jsx
<i className="fa-solid fa-check" aria-hidden="true" />
<i className="fa-solid fa-xmark" aria-hidden="true" />
<i className="fa-solid fa-plus" aria-hidden="true" />
```

## Common Icon Names

| Purpose | Icon Name | Class |
|---------|-----------|-------|
| Add | `plus` | `fa-solid fa-plus` |
| Delete | `trash` | `fa-solid fa-trash` |
| Close | `xmark` | `fa-solid fa-xmark` |
| Check | `check` | `fa-solid fa-check` |
| Settings | `gear` | `fa-solid fa-gear` |
| Search | `magnifying-glass` | `fa-solid fa-magnifying-glass` |
| Home | `house` | `fa-solid fa-house` |
| User | `user` | `fa-solid fa-user` |
| Arrow Right | `arrow-right` | `fa-solid fa-arrow-right` |
| Arrow Left | `arrow-left` | `fa-solid fa-arrow-left` |

## Common Mistakes

```jsx
// ❌ WRONG - Don't import Lucide icons
import { Plus, Trash2, Settings } from "lucide-react";
<Button><Plus /></Button>

// ❌ WRONG - Don't use npm package imports
import '@fortawesome/fontawesome-free/css/all.min.css';

// ✅ CORRECT - Use CDN in HTML head + leadingVisual prop
<Button leadingVisual="plus">Add</Button>

// ✅ CORRECT - Or use className for standalone
<i className="fa-solid fa-plus" />
```
