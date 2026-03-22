<!-- ~140 tokens | Load for: component selection and discovery workflow -->

# Components Guide

## When to Load
- Load this when you need component-selection workflow guidance.
- For exhaustive paths/globs/entrypoints, load `.agent/assets/components-index.json`.

## Discovery Workflow
1. Read component docs first:
- `docs/design-system/components.md`
- `docs/design-system/reference/component-index.md`
2. Inspect implementation triplet for candidate component:
- `{Component}.jsx`, `{Component}.scss`, `{Component}.stories.jsx`
3. Confirm composition fit in `design-system/src/specs/**`.
4. Prefer existing export entrypoints over deep imports.

## Guardrails
- Prefer PLUS components/forms/specs before generic framework primitives.
- **CRITICAL ANTI-HALLUCINATION RULE:** Never guess or assume component props (e.g., `primaryAction` vs `primaryButton`). You MUST strictly check the target component's `.jsx` file or its `.stories.jsx` file to verify the exact prop names before implementing it.
- Verify props/states in stories before implementing.
- If two families are plausible, ask for clarification instead of guessing.
# Component Overview

This package provides 6 pilot components for Figma Make.

## Available Components

### Accordion
Collapsible content panels for organizing information.

```jsx
import { Accordion } from '@tutors.plus/design-system';

<Accordion defaultActiveKey="0">
  <Accordion.Item eventKey="0">
    <Accordion.Header>Section 1</Accordion.Header>
    <Accordion.Body>Content for section 1</Accordion.Body>
  </Accordion.Item>
</Accordion>
```

### Alert
Status messages for user feedback. Use `style` prop for color theme.

```jsx
import { Alert } from '@tutors.plus/design-system';

<Alert style="success">Operation completed successfully!</Alert>
<Alert style="warning">Please review before continuing.</Alert>
<Alert style="danger">An error occurred.</Alert>
<Alert style="info">Here's some helpful information.</Alert>
```

### Badge
Status indicators and labels. Use `style` prop for color, `text` prop for label.

```jsx
import { Badge } from '@tutors.plus/design-system';

<Badge text="New" style="primary" />
<Badge text="Active" style="success" />
<Badge text="Pending" style="warning" />
```

### Breadcrumb
Navigation path indicators.

```jsx
import { Breadcrumb } from '@tutors.plus/design-system';

<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
  <Breadcrumb.Item active>Current Page</Breadcrumb.Item>
</Breadcrumb>
```

### Button
Action triggers. Use `style` for color theme and `fill` for visual weight.

```jsx
import { Button } from '@tutors.plus/design-system';

<Button text="Primary Action" style="primary" fill="filled" />
<Button text="Secondary" style="secondary" fill="tonal" />
<Button text="Outline" style="primary" fill="outline" />
<Button text="Text Button" style="tertiary" fill="ghost" />
```

### ButtonGroup
Grouped button layouts. Set `style` and `fill` on the group to cascade to children.

```jsx
import { ButtonGroup, Button } from '@tutors.plus/design-system';

<ButtonGroup style="primary" fill="tonal">
  <Button text="Option 1" />
  <Button text="Option 2" />
  <Button text="Option 3" />
</ButtonGroup>
```

---

## When to Use Each Component

| Use Case | Component | Props |
|----------|-----------|-------|
| Main page actions | `Button` | `style="primary" fill="filled"` |
| Secondary actions | `Button` | `style="secondary" fill="tonal"` |
| Status indicators | `Badge` | `style="success"` or `style="warning"` |
| User feedback | `Alert` | `style="success"` or `style="danger"` |
| Navigation breadcrumbs | `Breadcrumb` | — |
| Collapsible sections | `Accordion` | — |
| Related action groups | `ButtonGroup` | `style="primary" fill="outline"` |
# Master Component Index

**Context**: The complete list of all available components and specifications.
**Source of Truth**: `design-system/src/components/` and `design-system/src/specs/`.

## 1. Components

| Component | Pattern Pack | Source |
| :--- | :--- | :--- |
| **Alert** | [Modals](../patterns/modals.md) | `design-system/src/components/Alert` |
| **Badge** | [Elements](../patterns/elements.md) | `design-system/src/components/Badge` |
| **Breadcrumb** | [Modals](../patterns/modals.md) | `design-system/src/components/Breadcrumb` |
| **Button** | [Elements](../patterns/elements.md) | `design-system/src/components/Button` |
| **ButtonGroup** | [Elements](../patterns/elements.md) | `design-system/src/components/ButtonGroup` |
| **Card** | [Cards](../patterns/cards.md) | `design-system/src/components/Card` |
| **Carousel** | [Sections](../patterns/sections.md) | `design-system/src/components/Carousel` |
| **Checkbox** | [Elements](../patterns/elements.md) | `design-system/src/components/Checkbox` |
| **Chip** | [Elements](../patterns/elements.md) | `design-system/src/components/Chip` |
| **Collapse** | [Sections](../patterns/sections.md) | `design-system/src/components/Collapse` |
| **CompetencyBadge** | [Elements](../patterns/elements.md) | `design-system/src/components/CompetencyBadge` |
| **DatePicker** | [Modals](../patterns/modals.md) | `design-system/src/components/DatePicker` |
| **Divider** | [Elements](../patterns/elements.md) | `design-system/src/components/Divider` |
| **Dropdown** | [Elements](../patterns/elements.md) | `design-system/src/components/Dropdown` |
| **Form** | [Elements](../patterns/elements.md) | `design-system/src/components/Form` |
| **Input** | [Elements](../patterns/elements.md) | `design-system/src/components/Input` |
| **InputGroup** | [Elements](../patterns/elements.md) | `design-system/src/components/InputGroup` |
| **Jumbotron** | [Sections](../patterns/sections.md) | `design-system/src/components/Jumbotron` |
| **ListGroup** | [Sections](../patterns/sections.md) | `design-system/src/components/ListGroup` |
| **LoadingGif** | [Modals](../patterns/modals.md) | `design-system/src/components/LoadingGif` |
| **MediaObject** | [Cards](../patterns/cards.md) | `design-system/src/components/MediaObject` |
| **Modal** | [Modals](../patterns/modals.md) | `design-system/src/components/Modal` |
| **Navbar** | [Surfaces](../patterns/surfaces.md) | `design-system/src/components/Navbar` |
| **Navigation** | [Surfaces](../patterns/surfaces.md) | `design-system/src/components/Navigation` |
| **Pagination** | [Tables](../patterns/tables.md) | `design-system/src/components/Pagination` |
| **Popover** | [Modals](../patterns/modals.md) | `design-system/src/components/Popover` |
| **Progress** | [Elements](../patterns/elements.md) | `design-system/src/components/Progress` |
| **Radio** | [Elements](../patterns/elements.md) | `design-system/src/components/Radio` |
| **RichTextEditor** | [Elements](../patterns/elements.md) | `design-system/src/components/RichTextEditor` |
| **Scrollspy** | [Surfaces](../patterns/surfaces.md) | `design-system/src/components/Scrollspy` |
| **Section** | [Sections](../patterns/sections.md) | `design-system/src/components/Section` |
| **SidebarTab** | [Surfaces](../patterns/surfaces.md) | `design-system/src/components/SidebarTab` |
| **Spinner** | [Modals](../patterns/modals.md) | `design-system/src/components/Spinner` |
| **StaticBadgeSmart** | [Elements](../patterns/elements.md) | `design-system/src/components/StaticBadgeSmart` |
| **SuperCompPill** | [Elements](../patterns/elements.md) | `design-system/src/components/SuperCompPill` |
| **Switch** | [Elements](../patterns/elements.md) | `design-system/src/components/Switch` |
| **Table** | [Tables](../patterns/tables.md) | `design-system/src/components/Table` |
| **Toast** | [Modals](../patterns/modals.md) | `design-system/src/components/Toast` |
| **Tooltip** | [Modals](../patterns/modals.md) | `design-system/src/components/Tooltip` |
| **UserAvatar** | [Elements](../patterns/elements.md) | `design-system/src/components/UserAvatar` |

## 2. Specs (Page Templates)

| Spec | Description | Source |
| :--- | :--- | :--- |
| **Admin** | Admin dashboard layouts and tables. | `design-system/src/specs/Admin` |
| **Home** | Landing page layouts. | `design-system/src/specs/Home` |
| **Login** | Authentication flows. | `design-system/src/specs/Login` |
| **Profile** | User profile settings. | `design-system/src/specs/Profile` |
| **Toolkit** | Tool-specific layouts. | `design-system/src/specs/Toolkit` |
| **Training** | Training module layouts. | `design-system/src/specs/Training` |
| **Universal** | Global shared layouts. | `design-system/src/specs/Universal` |
