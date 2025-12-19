# ButtonGroup Component

**Purpose**: Group related buttons together with consistent styling.

## Import

```jsx
import { Button, ButtonGroup } from '@tutors.plus/design-system';
```

## Basic Usage

```jsx
<ButtonGroup>
  <Button style="primary">Left</Button>
  <Button style="primary">Middle</Button>
  <Button style="primary">Right</Button>
</ButtonGroup>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `vertical` | boolean | `false` | Stack buttons vertically |
| `size` | string | - | Apply size to all buttons: `small`, `medium`, `large` |
| `children` | node | - | Button components |

## Patterns

### Horizontal Group
```jsx
<ButtonGroup>
  <Button style="secondary" fill="outline">Previous</Button>
  <Button style="secondary" fill="outline">Current</Button>
  <Button style="secondary" fill="outline">Next</Button>
</ButtonGroup>
```

### Vertical Group
```jsx
<ButtonGroup vertical>
  <Button style="primary">Option 1</Button>
  <Button style="primary">Option 2</Button>
  <Button style="primary">Option 3</Button>
</ButtonGroup>
```

### Mixed Styles
```jsx
<ButtonGroup>
  <Button style="primary">Save</Button>
  <Button style="secondary" fill="outline">Cancel</Button>
</ButtonGroup>
```

### With Icons
```jsx
<ButtonGroup>
  <Button style="secondary" leadingVisual="align-left" fill="outline" />
  <Button style="secondary" leadingVisual="align-center" fill="outline" />
  <Button style="secondary" leadingVisual="align-right" fill="outline" />
</ButtonGroup>
```

## Rules

1. **Group related actions** - Buttons should have logical relationship
2. **Consistent styling** - Use same fill and style for visual cohesion
3. **Limit group size** - Keep groups to 2-5 buttons for usability
4. **Use vertical for long labels** - Switch to vertical when horizontal space is limited
