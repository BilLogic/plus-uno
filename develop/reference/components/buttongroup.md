# ButtonGroup

**Purpose**: Groups related buttons together with connected styling.

**Structure**: Import `ButtonGroup` from the package. Either use the `buttons` array prop OR pass `<Button>` components as children. Set `style` and `fill` on the group to cascade to all children.

---

## Setup
```javascript
import { ButtonGroup, Button } from '@tutors.plus/design-system';
```

---

## API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttons` | array | `[]` | Array of button config objects (`{ text, onClick, ... }`). |
| `children` | node | — | Alternative to `buttons`. Pass `<Button>` components. |
| `style` | string | `'primary'` | Color theme. Cascades to all child buttons. |
| `fill` | string | `'tonal'` | Visual weight. Default is `tonal`. Cascades to children. |
| `size` | string | `'medium'` | Size. Cascades to all child buttons. |
| `vertical` | bool | `false` | Stack buttons vertically. |
| `ariaLabel` | string | — | Accessible label for the group. |

---

## Usage Notes

- **Set `style` and `fill` on the group**, not individual buttons, for consistency.
- **`tonal` is the default fill** per the design system spec (not `filled`).
- **Use `buttons` array** for simple cases; use `children` when buttons need individual customization.
- **Vertical stacking** is useful for mobile layouts or narrow sidebars.

---

## Usage Examples

### Using Config Array (Preferred)
```jsx
<ButtonGroup
  style="primary"
  fill="outline"
  buttons={[
    { text: 'Left', onClick: handleLeft },
    { text: 'Middle', onClick: handleMiddle },
    { text: 'Right', onClick: handleRight }
  ]}
/>
```

### Using Children
```jsx
<ButtonGroup style="secondary" fill="tonal">
  <Button text="One" />
  <Button text="Two" />
</ButtonGroup>
```

### Vertical Layout
```jsx
<ButtonGroup vertical style="tertiary" fill="ghost">
  <Button text="Top" />
  <Button text="Bottom" />
</ButtonGroup>
```

---

## Common Mistakes (AI Agents)

- **❌ WRONG**: `<ButtonGroup variant="outline-primary" />`
- **✅ CORRECT**: `<ButtonGroup style="primary" fill="outline" />`
- **❌ WRONG**: Setting different `style` on each child button
- **✅ CORRECT**: Set `style` and `fill` on the parent `<ButtonGroup>` to cascade
