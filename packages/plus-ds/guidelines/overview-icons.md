# Icon Usage

This design system uses **FontAwesome Free** icons via the string shorthand.

## How to Use Icons

### String Shorthand (Recommended)
Pass the icon name as a string to `leadingVisual` or `trailingVisual`:

```jsx
<Button text="Add Item" leadingVisual="plus" />
<Button text="Next" trailingVisual="arrow-right" />
```

This automatically renders: `<i className="fa-solid fa-{icon-name}"></i>`

### Node Prop (Advanced)
For custom icons or non-FA icons, pass a React node:

```jsx
<Button text="Custom" leadingVisual={<MyCustomIcon />} />
```

---

## Common Icons

| Name | Renders | Use For |
|------|---------|---------|
| `plus` | ➕ | Add actions |
| `minus` | ➖ | Remove actions |
| `check` | ✓ | Confirm, success |
| `xmark` | ✕ | Close, cancel, dismiss |
| `arrow-right` | → | Next, forward navigation |
| `arrow-left` | ← | Back, previous navigation |
| `chevron-down` | ▼ | Dropdown, expand |
| `chevron-up` | ▲ | Collapse |
| `star` | ★ | Favorites, ratings |
| `trash` | 🗑️ | Delete actions |
| `pen` | ✏️ | Edit actions |
| `magnifying-glass` | 🔍 | Search |
| `user` | 👤 | User/profile |
| `bell` | 🔔 | Notifications |
| `gear` | ⚙️ | Settings |

---

## Icon Verification

Before using an icon, verify it exists in FontAwesome Free:
1. Check the list above for common icons.
2. For other icons, reference [FontAwesome Free Icons](https://fontawesome.com/search?o=r&m=free&s=solid).

**If the icon doesn't exist in FA Free, choose a different icon.**
