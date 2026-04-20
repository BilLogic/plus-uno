<!-- Load for: component selection, props API reference, usage examples, form components, data viz -->

# PLUS Design System Component Guidelines

## Guidelines Structure
This document provides comprehensive guidelines for all PLUS Design System components.
For each component: purpose, when to use, props API, and usage examples.

---

## Components

### Accordion
**Purpose**: Organize content into collapsible sections to reduce visual clutter.
**When to Use**: FAQs, Settings panels, Grouped information that doesn't need to be visible simultaneously.
**Props**:
- `defaultActiveKey`: Default expanded section
- `flush`: Remove borders for edge-to-edge layout
- `alwaysOpen`: Allow multiple sections open simultaneously

```jsx
<Accordion defaultActiveKey="0">
  <Accordion.Item eventKey="0">
    <Accordion.Header>Section 1</Accordion.Header>
    <Accordion.Body>Content for section 1</Accordion.Body>
  </Accordion.Item>
</Accordion>
```

---

### Alert
**Purpose**: Display contextual feedback messages for user actions.
**When to Use**: Form validation, System notifications, Success/error states.
**Styles**: primary, secondary, success, danger, warning, info
**Props**:
- `style`: Color variant
- `dismissible`: Show close button
- `onClose`: Callback when dismissed
- `icon`: Optional leading icon

```jsx
<Alert style="success" dismissible>
  <Alert.Icon><i className="fas fa-check" /></Alert.Icon>
  <Alert.Title>Success!</Alert.Title>
  <Alert.Content>Your changes have been saved.</Alert.Content>
</Alert>
```

---

### Badge
**Purpose**: Display status, counts, or labels.
**When to Use**: Notification counts, Status indicators, Category labels.
**Types**: Text badge, Counter badge, Dismissible badge
**Props**:
- `text`: Label text
- `counter`: Numeric value
- `style`: Color variant (primary, secondary, success, danger, warning, info)
- `size`: Typography size (b1, b2, b3)
- `dismissible`: Show remove button

```jsx
<Badge text="New" style="primary" size="b2" />
<Badge counter="5" style="danger" />
```

---

### Breadcrumb
**Purpose**: Show navigation hierarchy and current page location.
**When to Use**: Multi-level navigation, Deep page structures.
**Props**:
- `items`: Array of {text, href, active}
- `delimiter`: Custom separator character

```jsx
<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
  <Breadcrumb.Item active>Details</Breadcrumb.Item>
</Breadcrumb>
```

---

### Button
**Purpose**: Trigger actions and submit forms.
**Styles**: primary, secondary, tertiary, ghost, danger
**Sizes**: small, medium, large
**Props**:
- `text`: Button label
- `style`: Visual variant
- `size`: Button size
- `leadingVisual`: Icon before text
- `trailingVisual`: Icon after text
- `disabled`: Disable interaction
- `loading`: Show loading spinner

```jsx
<Button text="Submit" style="primary" size="medium" />
<Button text="Cancel" style="ghost" />
```

---

### ButtonGroup
**Purpose**: Group related buttons together.
**When to Use**: Action toolbars, Toggle options, Related actions.
**Props**:
- `size`: Apply size to all children
- `vertical`: Stack buttons vertically

```jsx
<ButtonGroup>
  <Button text="Left" />
  <Button text="Middle" />
  <Button text="Right" />
</ButtonGroup>
```

---

### Card
**Purpose**: Container for related content and actions.
**When to Use**: Product listings, Content previews, Dashboard widgets.
**Props**:
- `elevation`: Shadow level
- `interactive`: Add hover effects

---

### Carousel
**Purpose**: Display rotating content slides.
**When to Use**: Image galleries, Feature highlights, Testimonials.
**Props**:
- `slides`: Array of slide content
- `controls`: Show prev/next arrows
- `indicators`: Show dot indicators
- `interval`: Auto-advance timing

---

### Collapse
**Purpose**: Toggle visibility of content sections.
**When to Use**: Show/hide details, Expandable sections.
**Props**:
- `in`: Control visibility
- `onEnter`, `onExited`: Animation callbacks

---

### Divider
**Purpose**: Visual separator between content sections.
**Props**:
- `orientation`: horizontal or vertical
- `thickness`: Line weight

---

### Dropdown
**Purpose**: Display a menu of actions or options.
**When to Use**: Action menus, Selection options.
**Props**:
- `items`: Menu items array
- `trigger`: Trigger element type

---

### ListGroup
**Purpose**: Display lists of related content items.
**Subcomponents**: ListGroup.Item, ListGroup.Option, ListGroup.OptionList
**Props**:
- `flush`: Remove borders
- `horizontal`: Horizontal layout

```jsx
<ListGroup>
  <ListGroup.Item>Item 1</ListGroup.Item>
  <ListGroup.Item active>Active Item</ListGroup.Item>
</ListGroup>
```

---

### Modal
**Purpose**: Display content in a focused overlay.
**When to Use**: Confirmations, Forms, Important information.
**Props**:
- `show`: Visibility state
- `onHide`: Close callback
- `size`: sm, lg, xl
- `centered`: Vertically center

---

### NavPills
**Purpose**: Navigation with pill-style buttons.
**When to Use**: Tab navigation, Section switching.
**Usage Notes**: Active pill shows primary background color.
**Props**:
- `activeKey`: Current active pill
- `onSelect`: Selection callback

```jsx
<NavPills activeKey="home" onSelect={(k) => setKey(k)}>
  <NavPills.Item eventKey="home">Home</NavPills.Item>
  <NavPills.Item eventKey="profile">Profile</NavPills.Item>
</NavPills>
```

---

### NavTabs
**Purpose**: Navigation with underline-style tabs.
**Usage Notes**: Active tab shows primary color underline indicator.
**Props**:
- `activeKey`: Current active tab
- `onSelect`: Selection callback

---

### Pagination
**Purpose**: Navigate through pages of content.
**Props**:
- `currentPage`: Active page
- `totalPages`: Total page count
- `onPageChange`: Page change callback

---

### Popover
**Purpose**: Display contextual information in a floating container.
**Structure**: Dark header + light body.
**Props**:
- `title`: Header text
- `content`: Body content
- `placement`: Position (top, bottom, left, right)

---

### Progress
**Purpose**: Display progress toward completion.
**Props**:
- `now`: Current value (0-100)
- `label`: Show percentage text
- `variant`: Color variant

---

### Spinner
**Purpose**: Loading indicator for async operations.
**Variants**: border, grow, growing, rotating, stacking
**Props**:
- `variant`: Animation type
- `color`: Color theme
- `size`: sm or default

---

### Table
**Purpose**: Display tabular data.
**Props**:
- `striped`: Alternating row colors
- `bordered`: Add borders
- `hover`: Row hover effects

---

### Toast
**Purpose**: Brief, auto-dismissing notifications.
**When to Use**: Success confirmations, Background updates.
**Props**:
- `show`: Visibility
- `onClose`: Dismiss callback
- `delay`: Auto-hide delay
- `autohide`: Enable auto-dismiss

---

### Tooltip
**Purpose**: Display brief hint text on hover.
**Props**:
- `text`: Tooltip content
- `placement`: Position relative to trigger

---

## Form Components

### Checkbox
Purpose: Boolean selection. Use for multiple independent options.

### Radio
Purpose: Single selection from a group. Use when only one option is valid.

### Input
Purpose: Single-line text entry. Supports validation states.

### Textarea
Purpose: Multi-line text entry.

### Select
Purpose: Dropdown selection. Supports single and multi-select modes.
Props: `mode`, `options`, `searchable`, `creatable`, `lineWrap`, `truncate`

### Switch
Purpose: Toggle between two states (on/off).

### Range
Purpose: Select a value within a range using a slider.

### Rating
Purpose: Select a rating value using stars.

### DatePicker
Purpose: Select a date or date range from a calendar.

### TimePicker
Purpose: Select a time value.

---

## Data Visualization Components

All charts use the PLUS chart theme with design system colors.

### BarChart
Purpose: Compare values across categories.

### LineChart
Purpose: Show trends over time.

### AreaChart
Purpose: Show volume/magnitude over time.

### DonutChart
Purpose: Show parts of a whole.

### ScatterChart
Purpose: Show correlation between two variables.

### ComboChart
Purpose: Combine bar and line visualizations.

### StackedBarChart
Purpose: Compare parts of a whole across categories.

### SmartBarChart
Purpose: Bar chart with SMART framework color coding.
