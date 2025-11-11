# PLUS Component Library

This document describes the PLUS component library and how to use components in prototypes.

## Component Architecture

### Structure
- Components are ES6 classes exported as modules
- Components use static methods for creation
- Components generate DOM elements (HTML strings or DOM nodes)
- Components use CSS classes for styling (utility classes + component-specific classes)
- jQuery is used for DOM manipulation in production

### Import Pattern
```javascript
import { PlusInterface } from "./components/general_interface.js";
import { PlusSmartComponents } from "./components/plus_smart_components.js";
```

## Core Components

### PlusInterface

Base interface elements used across the application.

#### createButton(options)
Creates a button element styled according to PLUS design system.

**Options:**
- `tagType` (string, optional): HTML tag type, defaults to "button" or "a" if `btnLink` provided
- `btnId` (string, optional): Button ID
- `btnText` (string): Button text
- `btnStyle` (string): Button style - "primary", "secondary", "tertiary", "success", "info", "warning", "error", "default"
- `btnFill` (string): Button fill - "filled", "outline", "tonal", "text"
- `btnSize` (string, optional): Button size - "small", "default", "large"
- `buttonOnClick` (function, optional): Click handler
- `icon` (string, optional): Font Awesome icon name (without "fa-" prefix)
- `iconPosition` (string, optional): "left" or "right", default "left"
- `iconStyle` (string, optional): "solid" or "regular", default "solid"
- `btnLink` (string|object, optional): If provided, creates anchor tag instead of button
- `classes` (array, optional): Additional CSS classes
- `styles` (object, optional): Additional inline styles
- `enabled` (boolean, optional): Whether button is enabled, default true
- `tooltip` (string, optional): Tooltip text
- `tooltipOptions` (object, optional): Tooltip options
- `verticalLayout` (boolean, optional): Vertical button layout
- `imageUrl` (string, optional): Image URL for image button

**Example:**
```javascript
const button = PlusInterface.createButton({
    btnText: "Submit",
    btnStyle: "primary",
    btnFill: "filled",
    btnSize: "default",
    icon: "check",
    buttonOnClick: () => console.log("Clicked")
});
```

#### createCheckbox(options)
Creates a checkbox with label.

**Options:**
- `label` (string): Label text
- `name` (string): Input name attribute
- `value` (string): Input value attribute
- `id` (string): Input ID
- `classes` (array, optional): Additional CSS classes
- `checked` (boolean, optional): Whether checkbox is checked

**Example:**
```javascript
const checkbox = PlusInterface.createCheckbox({
    label: "I agree",
    name: "agreement",
    value: "yes",
    id: "agree-checkbox",
    checked: false
});
```

#### createTabPanel(tabObjects, tabType)
Creates a tab panel with tabs and associated panes.

**Parameters:**
- `tabObjects` (array): Array of tab objects with properties:
  - `id` (string): Tab/pane ID
  - `displayText` (string): Tab label
  - `associatedCount` (string|number, optional): Count badge on tab
  - `content` (DOM node): Tab content
  - `active` (boolean, optional): Whether tab is active
  - `icon` (string, optional): Font Awesome icon name
  - `size` (string, optional): Tab size
- `tabType` (boolean, optional): true for tabs, false for pills, default true

**Example:**
```javascript
const tabPanel = PlusInterface.createTabPanel([
    {
        id: "tab1",
        displayText: "Tab 1",
        content: document.createElement("div"),
        active: true
    },
    {
        id: "tab2",
        displayText: "Tab 2",
        content: document.createElement("div")
    }
], true);
```

### PlusSmartComponents

Components related to the SMART competency framework.

#### Constants
- `CA_SE`: "Social-Emotional"
- `CA_MC`: "Mastering Content"
- `CA_ADV`: "Advocacy"
- `CA_RELN`: "Relationships"
- `CA_TT`: "Technology Tools"

#### createStatusIcon(statusStr)
Creates a status icon element.

**Parameters:**
- `statusStr` (string): Status - "assigned", "started", "not started", "complete"

**Example:**
```javascript
const icon = PlusSmartComponents.createStatusIcon("complete");
```

#### createContentStatusTag(status)
Creates a content status tag with icon and text.

**Parameters:**
- `status` (string): Status - "assigned", "started", "not started", "complete"

**Example:**
```javascript
const statusTag = PlusSmartComponents.createContentStatusTag("started");
```

#### createSuperCompPillDiv(competencyArea, abbreviate)
Creates a competency area pill element.

**Parameters:**
- `competencyArea` (string): Competency area name
- `abbreviate` (boolean, optional): Whether to abbreviate, default false

**Example:**
```javascript
const pill = PlusSmartComponents.createSuperCompPillDiv("Social-Emotional", false);
```

#### getColorClassForCompetencyArea(ca)
Gets the color class for a competency area.

**Parameters:**
- `ca` (string): Competency area name

**Returns:** CSS class name string

**Example:**
```javascript
const colorClass = PlusSmartComponents.getColorClassForCompetencyArea("Social-Emotional");
// Returns: "color-smartClrSe"
```

### PlusModal

Modal dialog components.

#### createModal(options)
Creates a modal dialog.

**Options:**
- `id` (string, optional): Modal ID
- `header` (string|DOM node, optional): Modal header content
- `body` (string|DOM node, optional): Modal body content
- `footer` (string|DOM node, optional): Modal footer content
- `size` (string, optional): Modal size - "sm", "lg", default standard
- `backdrop` (boolean, optional): Show backdrop, default true
- `keyboard` (boolean, optional): Close on escape, default true

**Example:**
```javascript
const modal = PlusModal.createModal({
    id: "my-modal",
    header: "<h4>Modal Title</h4>",
    body: "<p>Modal content</p>",
    footer: "<button>Close</button>"
});
```

#### showModal(modalDiv, backdrop, keyboard, replaceActive)
Shows a modal.

**Parameters:**
- `modalDiv` (DOM element): Modal element
- `backdrop` (boolean, optional): Show backdrop, default true
- `keyboard` (boolean, optional): Close on escape, default true
- `replaceActive` (boolean, optional): Replace active modal, default true

#### hideModal(modalDiv)
Hides a modal.

**Parameters:**
- `modalDiv` (DOM element): Modal element

### PlusSmartCard

SMART card components for data visualization.

#### createDataCard(cardObj, empty)
Creates a data card with gauge or value display.

**Parameters:**
- `cardObj` (object): Card configuration
  - `id` (string, optional): Card ID
  - `title` (string): Card title
  - `value` (number, optional): Value to display
  - `label` (string, optional): Value label
  - `gaugeOptions` (object, optional): Gauge chart options
- `empty` (boolean, optional): Whether card is empty state

**Example:**
```javascript
const card = PlusSmartCard.createDataCard({
    id: "completion-card",
    title: "Completion Rate",
    value: 75,
    label: "%"
});
```

#### createBadgeCard(cardData)
Creates a badge card.

**Parameters:**
- `cardData` (object): Badge card data
  - `id` (string, optional): Card ID
  - `badgeImageUrl` (string): Badge image URL
  - `badgeTitle` (string): Badge title
  - `badgeDescription` (string, optional): Badge description
  - `claimable` (boolean, optional): Whether badge is claimable
  - `claimed` (boolean, optional): Whether badge is claimed

### PlusResources

Resource-related components.

#### createResourceProgressCard(resourceDto)
Creates a resource progress card.

**Parameters:**
- `resourceDto` (object): Resource data object
  - `id` (string): Resource ID
  - `title` (string): Resource title
  - `description` (string, optional): Resource description
  - `resourceType` (string): Resource type
  - `completionStatus` (string): Completion status

## Component Patterns

### Button Variants

#### Filled Button
```javascript
PlusInterface.createButton({
    btnText: "Primary Action",
    btnStyle: "primary",
    btnFill: "filled"
});
```

#### Outline Button
```javascript
PlusInterface.createButton({
    btnText: "Secondary Action",
    btnStyle: "primary",
    btnFill: "outline"
});
```

#### Tonal Button
```javascript
PlusInterface.createButton({
    btnText: "Tertiary Action",
    btnStyle: "primary",
    btnFill: "tonal"
});
```

#### Text Button
```javascript
PlusInterface.createButton({
    btnText: "Text Action",
    btnStyle: "primary",
    btnFill: "text"
});
```

### Button Sizes

- Small: `btnSize: "small"`
- Default: `btnSize: "default"` or omit
- Large: `btnSize: "large"`

### Button Styles

- Primary: `btnStyle: "primary"`
- Secondary: `btnStyle: "secondary"`
- Tertiary: `btnStyle: "tertiary"`
- Success: `btnStyle: "success"`
- Info: `btnStyle: "info"`
- Warning: `btnStyle: "warning"`
- Error: `btnStyle: "error"`
- Default: `btnStyle: "default"`

### SMART Competency Areas

The SMART framework includes 5 competency areas:
1. **Social-Emotional Learning** (SE)
2. **Mastering Content** (MC)
3. **Advocacy** (ADV)
4. **Relationships** (RELN)
5. **Technology Tools** (TT)

Each has associated colors, containers, and utility classes.

### Status System

Content status values:
- `"assigned"` - Content is assigned
- `"started"` - Content has been started
- `"not started"` - Content has not been started
- `"complete"` - Content is complete

Each status has:
- Associated icon (Font Awesome)
- Color mapping
- Text label

## HTML Structure Patterns

### Button Structure
```html
<button class="pbtn pbtn-filled pbtn-primary">
    <div class="pbtn-state-screen pbtn-filled">
        <div class="pbtn-content body2-txt">
            <span><i class="fas fa-check"></i></span>
            <span>Button Text</span>
        </div>
    </div>
</button>
```

### Card Structure
```html
<div class="plus-card">
    <div class="card-header">
        <h4>Card Title</h4>
    </div>
    <div class="card-body">
        Card content
    </div>
</div>
```

### SMART Card Structure
```html
<div class="bg-smart-card d-flex flex-column">
    <div class="h6 smart-card-title-row">Title</div>
    <div class="smart-card-body flex-grow-1">
        <div class="col">
            <div class="text-content">
                <div class="body2-txt font-weight-bold">Heading</div>
                <div class="body3-txt">Caption</div>
            </div>
        </div>
        <div class="col-auto text-center">
            Content
        </div>
    </div>
</div>
```

## Utility Classes

### Spacing
- Padding: `.padding-1`, `.padding-2`, `.padding-x-3`, `.padding-y-4`, etc.
- Margins: `.component-margin-1`, `.section-margin-2`, etc.
- Gap: `.gap-between-components-2`, `.gap-between-sections-3`, etc.

### Typography
- Display: `.display1-txt`, `.display2-txt`, `.display3-txt`, `.display4-txt`
- Headlines: `.h1`, `.h2`, `.h3`
- Titles: `.h4`, `.h5`, `.h6`
- Body: `.body1-txt`, `.body2-txt`, `.body3-txt`

### Colors
- Text colors: `.color-primary`, `.color-success`, `.color-error`, etc.
- Background colors: `.bg-color-primary`, `.bg-color-success`, etc.
- SMART colors: `.color-smartClrSe`, `.bg-color-smartClrMc`, etc.

### Layout
- Grid: `.plus-grid-5` (responsive 5-column grid)
- Flex: Bootstrap flex utilities
- Display: Bootstrap display utilities

## Best Practices

1. **Use Design Tokens**: Always use CSS variables for colors, spacing, and typography
2. **Component Composition**: Build complex UIs by composing simple components
3. **Consistent Styling**: Use utility classes and component classes consistently
4. **Accessibility**: Include proper ARIA attributes and keyboard navigation
5. **Responsive Design**: Use responsive utilities and breakpoints
6. **State Management**: Handle component states (hover, active, disabled) properly
7. **Icon Usage**: Use Font Awesome icons consistently
8. **SMART Integration**: Use SMART components for competency-related content

## Dependencies

Components require:
- Bootstrap 4 CSS and JS
- jQuery
- Font Awesome (for icons)
- PLUS design system CSS (tokens and component styles)

Some components also require:
- DataTables (for tables)
- Highcharts (for data visualization)
- Bootstrap Multiselect (for multiselect dropdowns)

