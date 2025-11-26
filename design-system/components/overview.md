# Components Overview

The PLUS Design System components are organized into two main categories: Components and Specs.

## Component Organization

### Components
Reusable UI components that can be used independently or composed together.

**Examples:**
- Input - Text fields, textareas with various states and sizes
- StatusIndicator - Status display components
- Button - Text + icon + container + styling with multiple variants
- Checkbox, Radio, Switch - Form input components with labels
- Alert, Toast - Notification components with dismiss functionality
- Badge, Chip, Status Tag - Icon + text combinations
- Card, Modal, Dropdown - Complex interactive components
- Form, DatePicker, InputGroup - Form building components
- Navigation, Breadcrumb, Pagination - Navigation components
- And many more...

### Specs
Complex components composed of multiple components, representing complete interface sections.

**Examples:**
- Universal - commonly used across pillars
- Admin - administrative interfaces
- Home
- Login
- Profile
- Toolkit
- Training

## Component Terminology

The PLUS design system organizes UI components into 6 semantic layers, from smallest to largest:

1. **Elements** - Fundamental building blocks (buttons, forms, badges, items)
2. **Cards** - Self-contained containers displaying information
3. **Sections** - Containers for cards or forms, grouping related content
4. **Modals** - Pop-up windows requiring user attention
5. **Surfaces** - Full screen/spec the user sees at one time
6. **Surface Containers** - Top-level frame (sidebar, top bar) - only one per screen

### Token Usage by Component Type

- **Elements**: Use `element-*` tokens (padding, gap, radius, border)
  - **Radius-Padding Relationship**: Match radius size to padding size tier (sm/md/lg)
  - Use `element-radius-sm/md/lg` (all 4px) with corresponding `element-pad-sm/md/lg`
  - Use `element-radius-pill` (999px) for badges, chips, and toggle switches
- **Cards**: Use `card-*` tokens (padding, gap, radius, border)
  - **Radius-Padding Relationship**: Use `card-radius-sm` (12px) with `card-pad-sm` (16px), `card-radius-md` (16px) with `card-pad-md` (20px) or `card-pad-lg` (24px)
  - Default: Most cards use `card-radius-sm` (12px)
- **Sections**: Use `section-*` tokens (padding, gap, radius, border)
  - **Radius-Padding Relationship**: Use `section-radius-sm/md` (8px) with `section-pad-sm` (16px) or `section-pad-md` (24px), `section-radius-lg` (16px) with `section-pad-lg` (36px)
- **Modals**: Use `modal-*` tokens (padding, gap, radius, border)
  - **Radius-Padding Relationship**: Use `modal-radius-sm` (4px) with `modal-pad-sm` (10px/8px), `modal-radius-md` (6px) with `modal-pad-md` (16px/12px), `modal-radius-lg` (12px) with `modal-pad-lg` (40px/24px)
  - Default: Most modals use `modal-radius-md` (6px)
- **Surfaces**: Use `surface-*` tokens (padding, gap, radius, border)
  - **Radius**: Use `surface-radius` (16px) - single size available, use consistently for all surface-level components
- **Surface Containers**: Use `surface-container-*` tokens (padding, gap, border)
  - **No radius tokens**: Surface containers are the outermost layer (sidebars, top bars) and do not require corner radius - they extend to screen edges

### Element Typography Hierarchy

Element spacing tokens are tied to typographic hierarchy:

- **Headline Text (H3)**: Use `element-gap-lg` and `element-x/y-lg`
- **Title Text (H6)**: Use `element-gap-md` and `element-x/y-md`
- **Body Text (B3)**: Use `element-gap-sm` and `element-x/y-sm`

**Special Token**: `element-gap-xs` is reserved for label-to-input spacing only.

## Component Architecture

### Structure
- Components are ES6 modules exported as functions
- Components use static methods for creation
- Components generate DOM elements (HTML strings or DOM nodes)
- Components use CSS classes for styling (utility classes + component-specific classes)
- jQuery is used for DOM manipulation in production

### Bootstrap Integration
- **ALWAYS override Bootstrap default spacing/padding with design tokens**
- When using Bootstrap classes (form-check, custom-control, dropdown, etc.), explicitly override their default spacing
- Use PLUS design tokens from Figma instead of Bootstrap's default values
- Example: `.form-check` has default `padding-left: 1.25rem` - override with `padding-left: 0` and use `gap: var(--size-element-gap-sm)` instead
- Check Bootstrap's default styles and explicitly override them with PLUS tokens
- Never rely on Bootstrap's default spacing - always use design tokens from Figma

### Import Pattern
```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/index.js";
```

## Core Component APIs

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
Creates a checkbox with label. Use checkboxes when users can select multiple options from a set.

**When to Use:**
- Multiple selections from a set
- Form fields requiring yes/no or multiple choice answers
- Filters for multiple criteria
- Settings with multiple features that can be enabled simultaneously
- Agreements (terms of service, privacy policy)
- Lists where users select several items
- Bulk actions for selecting multiple items

**When NOT to Use:**
- Single selection (use radio buttons)
- Binary toggle that takes effect immediately (use switches)
- Many options (>10) - consider multi-select dropdown

**Options:**
- `label` (string): Label text
- `name` (string): Input name attribute
- `value` (string): Input value attribute
- `id` (string): Input ID
- `classes` (array, optional): Additional CSS classes
- `checked` (boolean, optional): Whether checkbox is checked
- `indeterminate` (boolean, optional): Whether checkbox is in indeterminate state (shows dash/minus instead of checkmark, used when some items in a group are selected)
- `disabled` (boolean, optional): Whether checkbox is disabled
- `onChange` (function, optional): Change event handler

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

#### createRadio(options)
Creates a radio button with label. Use radio buttons when users can select only one option from a set of mutually exclusive options.

**When to Use:**
- Single selection from mutually exclusive options
- Form fields requiring single choice answers (e.g., "Select your preferred contact method")
- Settings where only one option applies (e.g., "Choose notification frequency")
- Small option sets (2-5 options) that should all be visible
- Required choices where all options should be visible

**When NOT to Use:**
- Multiple selections (use checkboxes)
- Binary toggle that takes effect immediately (use switches)
- Many options (>5) or limited space (use dropdowns)
- Optional single choice with limited space (consider dropdown)

**Options:**
- `label` (string): Label text
- `name` (string): Input name attribute (required for radio groups)
- `value` (string): Input value attribute
- `id` (string): Input ID
- `classes` (array, optional): Additional CSS classes
- `checked` (boolean, optional): Whether radio is checked
- `disabled` (boolean, optional): Whether radio is disabled
- `onChange` (function, optional): Change event handler

**Example:**
```javascript
const radio = PlusInterface.createRadio({
    label: "Option 1",
    name: "choice",
    value: "option1",
    id: "radio-option1",
    checked: false
});
```

#### createRadioGroup(options, groupName)
Creates a group of related radio buttons.

**Parameters:**
- `options` (array): Array of radio option objects with `label`, `value`, `id`, `checked` (optional)
- `groupName` (string): Common name attribute for all radios in the group

**Example:**
```javascript
const radioGroup = PlusInterface.createRadioGroup([
    { label: "Option 1", value: "opt1", id: "radio-opt1", checked: true },
    { label: "Option 2", value: "opt2", id: "radio-opt2", checked: false },
    { label: "Option 3", value: "opt3", id: "radio-opt3", checked: false }
], "choice-group");
```

#### createSwitch(options)
Creates a switch (toggle) component. Use switches for binary on/off states that take effect immediately.

**When to Use:**
- Binary states (on/off, enabled/disabled, yes/no)
- Settings that take effect immediately (e.g., "Enable notifications", "Dark mode")
- User preference toggles that apply instantly (e.g., "Auto-save", "Email notifications")
- Settings panels with multiple toggles
- Feature flags for enabling/disabling features

**When NOT to Use:**
- Multiple options (use radio buttons)
- Multiple selections (use checkboxes)
- Form submission required (use checkboxes or radio buttons)
- Complex states (use dropdowns)
- Single choice from many (use radio buttons or dropdowns)
- Delayed actions requiring confirmation (consider checkboxes)

**Options:**
- `label` (string): Label text
- `name` (string): Input name attribute
- `id` (string): Input ID
- `classes` (array, optional): Additional CSS classes
- `checked` (boolean, optional): Whether switch is checked (on)
- `disabled` (boolean, optional): Whether switch is disabled
- `onChange` (function, optional): Change event handler

**Example:**
```javascript
const switchEl = PlusInterface.createSwitch({
    label: "Enable notifications",
    name: "notifications",
    id: "switch-notifications",
    checked: true
});
```

#### createDatePicker(options)
Creates a date picker component with calendar popup. Use for selecting dates in forms.

**When to Use:**
- Selecting a single date
- Date input in forms (birthday, appointment date, deadline)
- Date range selection (with min/max constraints)
- When calendar visualization is helpful

**Options:**
- `id` (string, optional): Input ID
- `name` (string, optional): Input name attribute
- `placeholder` (string, optional): Placeholder text
- `value` (Date|string, optional): Initial date value
- `minDate` (Date|string, optional): Minimum selectable date
- `maxDate` (Date|string, optional): Maximum selectable date
- `size` (string, optional): Size - "small", "medium", "large", default "medium"
- `calendarAlign` (string, optional): Calendar alignment - "left", "center", "right", default "left"
- `disabled` (boolean, optional): Whether date picker is disabled
- `onChange` (function, optional): Change event handler

**Example:**
```javascript
const datePicker = PlusInterface.createDatePicker({
    id: "date-input",
    name: "appointment-date",
    placeholder: "Select a date",
    minDate: new Date(), // Only allow future dates
    calendarAlign: "center"
});
```

#### createTextarea(options)
Creates a textarea element for multi-line text input.

**When to Use:**
- Multi-line text input (comments, descriptions, notes)
- Longer content that doesn't fit on a single line
- Form fields requiring paragraph-length input

**Options:**
- `id` (string, optional): Textarea ID
- `name` (string, optional): Textarea name attribute
- `placeholder` (string, optional): Placeholder text
- `value` (string, optional): Initial value
- `size` (string, optional): Size - "small", "medium", "large", default "medium"
- `readonly` (boolean, optional): Whether textarea is read-only
- `disabled` (boolean, optional): Whether textarea is disabled
- `rows` (number, optional): Number of rows
- `cols` (number, optional): Number of columns
- `onChange` (function, optional): Change event handler

**Example:**
```javascript
const textarea = PlusInterface.createTextarea({
    id: "comments",
    name: "comments",
    placeholder: "Enter your comments...",
    size: "medium",
    rows: 4
});
```

#### createSelect(options)
Creates a select dropdown element for single selection from a list.

**When to Use:**
- Single selection from a list of options
- When space is limited
- Many options (>5) that would clutter the interface as radio buttons
- Optional selections where a dropdown is more appropriate

**Options:**
- `id` (string, optional): Select ID
- `name` (string, optional): Select name attribute
- `size` (string, optional): Size - "small", "medium", "large", default "medium"
- `readonly` (boolean, optional): Whether select is read-only
- `disabled` (boolean, optional): Whether select is disabled
- `options` (array, optional): Array of option objects: `{value: string, text: string, selected: boolean}`
- `placeholder` (string, optional): Placeholder option text
- `onChange` (function, optional): Change event handler

**Example:**
```javascript
const select = PlusInterface.createSelect({
    id: "country",
    name: "country",
    placeholder: "Select a country",
    options: [
        { value: "us", text: "United States", selected: false },
        { value: "ca", text: "Canada", selected: true },
        { value: "uk", text: "United Kingdom", selected: false }
    ]
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

## Component Files

Component implementations are located in:
- `components/` - All reusable UI components
- `specs/` - Complex components composed of multiple components

Each component folder contains:
- Component JavaScript file (`index.js`)
- Component SCSS file (if needed)
- Storybook stories (`.stories.js` files)

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

## See Also

- [Styles Overview](../styles/overview.md) - Design tokens and foundational styles
- [Development Standards](../../develop/standards.md) - Coding standards and technical details
- [Import Paths](../../develop/imports.md) - Component import path reference
