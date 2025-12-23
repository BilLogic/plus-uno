# Button

**Purpose**: Universal interactive element for actions, navigation, and form submissions.

**Structure**: Import `Button` from the package. Use props `text` (or `children`), `style`, `fill`, and optional `leadingVisual`/`trailingVisual`.

---

## Setup
```javascript
import { Button } from '@tutors.plus/design-system';
```

---

## API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | — | Button label text. |
| `style` | string | `'primary'` | Color theme: `primary`, `secondary`, `tertiary`, `success`, `warning`, `danger`, `info`. |
| `fill` | string | `'filled'` | Visual weight: `filled`, `tonal`, `outline`, `ghost`. |
| `size` | string | `'medium'` | Size: `small`, `medium`, `large`. |
| `leadingVisual` | string/node | — | Icon name (string) or React node before text. |
| `trailingVisual` | string/node | — | Icon name (string) or React node after text. |
| `onClick` | func | — | Click handler. |
| `disabled` | bool | `false` | Disables interaction. |
| `loading` | bool | `false` | Shows loading spinner, disables click. |
| `block` | bool | `false` | Full-width button. |
| `as` | elementType | — | Polymorphic prop (e.g., render as `<a>` or Router Link). |

---

## Usage Notes

- **Always** set both `style` and `fill` for explicit styling.
- **Use `text` prop** instead of children for the label (children works but `text` is preferred).
- **Icon strings** like `leadingVisual="plus"` render FontAwesome icons automatically.
- **Loading state** disables the button and shows a spinner—no need to also set `disabled`.
- **Block buttons** expand to fill their container width.

---

## Usage Examples

### Primary Action
```jsx
<Button text="Save Changes" style="primary" fill="filled" onClick={handleSave} />
```

### Secondary Action
```jsx
<Button text="Cancel" style="secondary" fill="ghost" onClick={handleCancel} />
```

### With Icons
```jsx
<Button text="Add Item" style="success" fill="tonal" leadingVisual="plus" />
<Button text="Next" style="primary" fill="filled" trailingVisual="arrow-right" />
```

---

## Common Mistakes (AI Agents)

- **❌ WRONG**: `<Button variant="outline-primary" />` — prop does not exist
- **✅ CORRECT**: `<Button style="primary" fill="outline" />`
- **❌ WRONG**: `<Button icon="plus" />`
- **✅ CORRECT**: `<Button leadingVisual="plus" />`
- **❌ WRONG**: `<Button isLoading={...} />` — use `loading` prop (though `isLoading` is supported as an alias, `loading` is preferred)


---

## Icon Shorthand

Pass a string to `leadingVisual` or `trailingVisual` for automatic FontAwesome rendering:
- `"arrow-right"` → `<i className="fa-solid fa-arrow-right"></i>`
- Pass a React node for custom icons.
