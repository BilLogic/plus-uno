# Accordion Component

## Purpose
Collapsible content panels for organizing information into expandable sections.

## Import
```jsx
import { Accordion } from '@tutors.plus/design-system';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultActiveKey` | string | - | Initially expanded panel |
| `alwaysOpen` | boolean | `false` | Allow multiple open panels |

## Examples

```jsx
// Basic accordion
<Accordion defaultActiveKey="0">
  <Accordion.Item eventKey="0">
    <Accordion.Header>Section 1</Accordion.Header>
    <Accordion.Body>Content for section 1</Accordion.Body>
  </Accordion.Item>
  <Accordion.Item eventKey="1">
    <Accordion.Header>Section 2</Accordion.Header>
    <Accordion.Body>Content for section 2</Accordion.Body>
  </Accordion.Item>
</Accordion>

// Allow multiple open
<Accordion alwaysOpen defaultActiveKey={['0', '1']}>
  ...
</Accordion>
```

## Usage Rules

✅ **DO**:
- Use for content that can be logically grouped
- Keep header text short and descriptive
- Set a sensible defaultActiveKey

❌ **DON'T**:
- Use for navigation (use tabs instead)
- Nest accordions deeply
- Put critical information in collapsed sections
