---
summary: This design system uses FontAwesome Free icons via the string shorthand
---

<!-- Tier: 2 -->
# Icon Usage

This design system uses **FontAwesome Free** icons via the string shorthand.

## How to Use Icons

### String Shorthand (Recommended)
Pass the icon name as a string to `iconBefore` or `iconAfter`:

```jsx
<Button appearance="primary" text="Add Item" iconBefore="plus" />
<Button appearance="primary" text="Next" iconAfter="arrow-right" />
```

This renders `<i className="fa-regular fa-{icon-name}"></i>`, or `fa-solid` where Font Awesome Free has no regular weight (`iconClass` in `design-system/src/lib/icon.js` decides).

### Node Prop (Advanced)
For custom icons or non-FA icons, pass a React node:

```jsx
<Button appearance="primary" text="Custom" iconBefore={<MyCustomIcon />} />
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


## Foundation rules

- Icons come in three sizes: 12 (`--icon-sm`: chevrons, validation, compact parts), 16 (`--icon-md`: the default beside text) and 24 (`--icon-lg`). Above 24, use a Tile.
- Font Awesome Free 7.2 only: `fa-solid`, `fa-regular`, `fa-brands`. Pro families render blank. Regular is the default weight; solid only where Free has no regular. Never mix weights in one set.
- An icon's box is its font size (`--fa-width: 1em`, set globally), so the glyph fills the square it is sized to.
- Color an icon with a color token; a status icon takes its hue's icon token.
- Pair an icon with a label where there is room; one glyph for one meaning. Before adding an icon, check that a similar one does not exist, that an existing one cannot serve, that it cannot be confused with another and that a label would not do better.
- Partner and tool logos go in a Tile, never in the Logo set.

