---
summary: What each component is for, when to reach for it, and how it composes
---

<!-- Tier: 2 -->

# Components

What each component is for, when to reach for it, and how it composes.

## Start here — the seven group overviews

"Which component do I reach for" is answered per group, not in one list:

- [Actions](actions.md) — `Button`, `ButtonGroup`
- [Forms and inputs](forms-and-inputs.md) — 23 components, sorted by the shape of the answer
- [Layout and structure](layout-and-structure.md) — nine containers
- [Messaging](messaging.md) — `Alert`, `Toast`, `Modal`
- [Navigation](navigation.md) — six, sorted by what the user moves between
- [Overlays](overlays.md) — `Tooltip`, `Popover`
- [Status and loading](status-and-loading.md) — `Badge`, `Progress`, `Spinner`

Facts about a single component — props, variants, defaults, tokens touched,
related components — are generated from source into each component's own
`index.md` beside it, and each group's `index.md` counts how much authored
guidance exists (#165). Read those for facts.

The authored half — when to use, when not, correct/incorrect pairs,
accessibility — lives in the component's Storybook MDX, which is where the
coverage columns detect it.

## How the authored half grows

**The top of the list was measured, not guessed.** Ranking every public
component by the number of files under `design-system/src/specs/` and
`prototypes/` that import it from the design system and render it, the leaders
are: `Button` (139 files), `Badge` (60), `Modal` (29), `Select` (24),
`Dropdown` (17), `ButtonGroup` (17), `Card` (14), `Pagination` (14),
`NavTabs` (11), `Alert` (11), `Input` (10), `Textarea` (9), `Checkbox` (9),
`Tooltip` (8), `Switch` (7). Those fifteen were written first, in #166. Twenty
of the 48 public components are rendered nowhere in either corpus.

**Earned thereafter.** Every other component gets its authored half the first
time an agent gets it wrong — not on a schedule, and not by working down the
ranking. The trigger is a real miss: a hallucinated prop, a component reached
for where another was meant, an accessibility defect that shipped. One miss, one
component, one set of three sections.

The capture path is `uno-maintain`, and the routing is already in its taxonomy:

1. **Intake.** The miss is an *inaccuracy* (the docs say something wrong) or an
   *improvement* (the docs say nothing where they should). Its target is the
   codebase estate's "Storybook inconsistent / bug" row, which fixes
   `design-system/src/**` — the component's MDX. Name the evidence: the session
   or PR where the agent got it wrong.
2. **Draft first.** Write the three sections before anyone judges whether they
   are worth it. That is `uno-maintain`'s standing order, and it is cheap here
   because reading the component source is most of the work either way.
3. **Tier 2.** The Tier-1 whitelist is typos, broken links, stale dates and pure
   formatting, and nothing else — so authored guidance always ships as a PR
   paired with a PRD, through the review gate.

Method: `skills/uno-maintain/references/method.md`. Nothing is ever stubbed: a
component with no authored half simply has none, and its group's coverage column
says so. An empty section under a real heading would count as covered and say
nothing, which is worse than the gap.

## Known stale below this line

The per-component prose in the rest of this file predates the 2026-07
category-folder reorg: its source paths are wrong, and Chip, Form, Navigation,
Section and SuperCompPill are listed here but do not exist in
`design-system/src`. The authority on what exists is the generated
`design-system/agent-views/components/index.md`. It is kept rather than deleted
because for the components with no authored half yet, it is the only prose there
is — and it is superseded, group by group, as those pages get written.

## Guidelines Structure
This document provides comprehensive guidelines for all PLUS Design System components.
For each component: purpose, when to use, props API, and usage examples.

---

## Pattern Pack Categorization

Each component belongs to a Pattern Pack that groups it by interaction role.

| Component | Pattern Pack | Source |
| :--- | :--- | :--- |
| **Alert** | Modals | `design-system/src/components/Alert` |
| **Badge** | Elements | `design-system/src/components/Badge` |
| **Breadcrumb** | Modals | `design-system/src/components/Breadcrumb` |
| **Button** | Elements | `design-system/src/components/Button` |
| **ButtonGroup** | Elements | `design-system/src/components/ButtonGroup` |
| **Card** | Cards | `design-system/src/components/Card` |
| **Carousel** | Sections | `design-system/src/components/Carousel` |
| **Checkbox** | Elements | `design-system/src/components/Checkbox` |
| **Chip** | Elements | `design-system/src/components/Chip` |
| **Collapse** | Sections | `design-system/src/components/Collapse` |
| **CompetencyBadge** | Elements | `design-system/src/components/CompetencyBadge` |
| **DatePicker** | Modals | `design-system/src/components/DatePicker` |
| **Divider** | Elements | `design-system/src/components/Divider` |
| **Dropdown** | Elements | `design-system/src/components/Dropdown` |
| **Form** | Elements | `design-system/src/components/Form` |
| **Input** | Elements | `design-system/src/components/Input` |
| **InputGroup** | Elements | `design-system/src/components/InputGroup` |
| **Jumbotron** | Sections | `design-system/src/components/Jumbotron` |
| **ListGroup** | Sections | `design-system/src/components/ListGroup` |
| **LoadingGif** | Modals | `design-system/src/components/LoadingGif` |
| **MediaObject** | Cards | `design-system/src/components/MediaObject` |
| **Modal** | Modals | `design-system/src/components/Modal` |
| **Navbar** | Surfaces | `design-system/src/components/Navbar` |
| **Navigation** | Surfaces | `design-system/src/components/Navigation` |
| **Pagination** | Tables | `design-system/src/components/Pagination` |
| **Popover** | Modals | `design-system/src/components/Popover` |
| **Progress** | Elements | `design-system/src/components/Progress` |
| **Radio** | Elements | `design-system/src/components/Radio` |
| **RichTextEditor** | Elements | `design-system/src/components/RichTextEditor` |
| **Scrollspy** | Surfaces | `design-system/src/components/Scrollspy` |
| **Section** | Sections | `design-system/src/components/Section` |
| **SidebarTab** | Surfaces | `design-system/src/components/SidebarTab` |
| **Spinner** | Modals | `design-system/src/components/Spinner` |
| **StaticBadgeSmart** | Elements | `design-system/src/components/StaticBadgeSmart` |
| **SuperCompPill** | Elements | `design-system/src/components/SuperCompPill` |
| **Switch** | Elements | `design-system/src/components/Switch` |
| **Table** | Tables | `design-system/src/components/Table` |
| **Toast** | Modals | `design-system/src/components/Toast` |
| **Tooltip** | Modals | `design-system/src/components/Tooltip` |
| **UserAvatar** | Elements | `design-system/src/components/UserAvatar` |

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
