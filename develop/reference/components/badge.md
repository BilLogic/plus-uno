# Badge

**Purpose**: Small status descriptors for UI elements. Use for status indicators, labels, counts, or categories.

**Structure**: Import `Badge` from the package. Use `text` prop for label, `style` for color theme, and optional `leadingVisual`, `counter`, or `dismissible`.

---

## Setup
```javascript
import { Badge } from '@tutors.plus/design-system';
```

---

## API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | — | Badge label text. |
| `style` | string | `'primary'` | Color theme: `primary`, `secondary`, `tertiary`, `success`, `warning`, `danger`, `info`, or SMART colors. |
| `size` | string | `'b2'` | Typography scale. Headers: `h1`–`h6`. Body: `b1`–`b3`. |
| `leadingVisual` | node | — | Icon to display before text. |
| `counter` | string/number | — | Displays a count number next to the text. |
| `dismissible` | bool | `false` | Shows a dismiss 'X' button. |
| `onDismiss` | func | — | Callback when dismiss button is clicked. |

---

## Usage Notes

- **Use `text` prop** for the label (children also works but `text` is preferred).
- **Choose `size`** to match surrounding text hierarchy (e.g., `h4` for a header badge, `b2` for body).
- **Dismissible badges** automatically show an X icon—no need to set `trailingVisual`.
- **SMART colors**: For education themes, use `social-emotional`, `mastering-content`, `advocacy`, `relationship`, `technology-tools`.

---

## Usage Examples

### Status Badges
```jsx
<Badge text="Success" style="success" leadingVisual={<i className="fa-solid fa-check" />} />
<Badge text="Pending" style="warning" />
<Badge text="Error" style="danger" />
```

### Dismissible Filter Tags
```jsx
<Badge text="Filter Active" style="primary" dismissible onDismiss={handleDismiss} />
```

### With Counter
```jsx
<Badge text="Inbox" style="info" counter="12" />
```

---

## Common Mistakes (AI Agents)

- **❌ WRONG**: `<Badge variant="warning" />` — use `style` instead
- **✅ CORRECT**: `<Badge style="warning" />`
- **❌ WRONG**: `<Badge color="red" />`
- **✅ CORRECT**: `<Badge style="danger" />`
- **✅ CORRECT**: `<Badge size="b2" />` — use `h1`–`h6` for headers, `b1`–`b3` for body
