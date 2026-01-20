# Accordion Component

**Purpose**: Collapsible content panels for organizing information.

## Import

```jsx
import { Accordion } from '@tutors.plus/design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | array | - | **Required** - Array of accordion items |
| `defaultActiveKey` | string | - | Initially expanded item |
| `activeKey` | string | - | Controlled expanded item |
| `alwaysOpen` | boolean | `false` | Allow multiple items open |
| `flush` | boolean | `false` | Remove outer borders |

### Item Object Structure

| Property | Type | Description |
|----------|------|-------------|
| `eventKey` | string | **Required** - Unique identifier |
| `header` | node | **Required** - Header content |
| `body` | node | **Required** - Collapsible content |
| `disabled` | boolean | Disable this item |

## Basic Usage

```jsx
<Accordion
  defaultActiveKey="0"
  items={[
    { eventKey: "0", header: "Section One", body: "Content for section one." },
    { eventKey: "1", header: "Section Two", body: "Content for section two." }
  ]}
/>
```

## Patterns

### Multiple Open
```jsx
<Accordion
  alwaysOpen
  defaultActiveKey={['0', '1']}
  items={[
    { eventKey: "0", header: "First Section", body: "Can stay open." },
    { eventKey: "1", header: "Second Section", body: "Also stays open." }
  ]}
/>
```

### Flush Style
```jsx
<Accordion
  flush
  items={[
    { eventKey: "0", header: "Flush Header", body: "No outer borders." }
  ]}
/>
```

## Rules

1. **Always use items array** - Pass accordion items as an array prop
2. **Provide unique eventKey** - Each item needs a unique eventKey
3. **Use defaultActiveKey for initial state** - Set which panel opens first
4. **Use alwaysOpen for FAQ-style** - When users need multiple sections visible
