# Universal Components

## Overview
Universal components are available across all product pillars and can be used in any part of the application.

## Component Types

### Elements
Fundamental building blocks used throughout the application.

**Components:**
- `button.js` - Button component with various styles and fills
- `checkbox.js` - Checkbox component with single and group options (use for multiple selections)
- `radio.js` - Radio button component with single and group options (use for single selection from mutually exclusive options)
- `switch.js` - Switch (toggle) component for binary on/off states (use for immediate actions)
- `date-picker.js` - Date picker component with calendar popup (use for date selection)
- `form.js` - Form components: textarea, select, range input, multi-select
- `dropdown.js` - Dropdown component for selecting options
- `alert.js` - Alert component for displaying messages
- `status-icon.js` - Status icon component for SMART framework
- `content-status-tag.js` - Content status tag with icon and text
- `super-comp-pill.js` - Competency area pill component
- `status-indicator.js` - Status indicator component
- `divider.js` - Divider component for visual separation
- `badge.js` - Badge and chip components
- `breadcrumb.js` - Breadcrumb navigation component
- `card.js` - Card component for content containers
- `modal.js` - Modal dialog component
- `navigation.js` - Navigation component

**Usage:**
```javascript
import { createButton, createCheckbox, createAlert } from './universal/elements/index.js';

// Create a button
const button = createButton({
    btnText: "Click me",
    btnStyle: "primary",
    btnFill: "filled",
    btnSize: "default"
});

// Create a checkbox (use for multiple selections)
const checkbox = createCheckbox({
    label: "I agree",
    name: "agreement",
    value: "yes",
    id: "agree-checkbox",
    checked: false
});

// Create a radio button (use for single selection from mutually exclusive options)
const radio = createRadio({
    label: "Option 1",
    name: "choice",
    value: "option1",
    id: "radio-option1",
    checked: false
});

// Create a switch (use for binary on/off states that take effect immediately)
const switchEl = createSwitch({
    label: "Enable notifications",
    name: "notifications",
    id: "switch-notifications",
    checked: true
});

// Create a date picker
const datePicker = createDatePicker({
    id: "date-input",
    name: "appointment-date",
    placeholder: "Select a date",
    minDate: new Date()
});

// Create an alert
const alert = createAlert({
    style: "info",
    title: "Heads Up!",
    text: "This is an informational alert.",
    dismissable: true
});
```

### Cards
(Placeholder for future card components)

### Modals
(Placeholder for future modal components)

### Sections
(Placeholder for future section components)

### Tables
(Placeholder for future table components)

### Pages
(Placeholder for future page components)

## Constants

### Button Constants
- `BUTTON_CONSTANTS.FILL` - Button fill options (filled, outline, tonal, text)
- `BUTTON_CONSTANTS.STYLES` - Button style options (primary, secondary, etc.)
- `BUTTON_CONSTANTS.FONT_SIZES` - Button font size options
- `BUTTON_CONSTANTS.ICON_STYLES` - Icon style options (solid, regular)

### SMART Constants
- `SMART_CONSTANTS.CA_*` - Competency area constants
- `SMART_CONSTANTS.STATUS_*` - Status constants
- `SMART_CONSTANTS.STATUS_ICONS` - Status icon mappings
- `SMART_CONSTANTS.STATUS_COLORS` - Status color mappings
- `SMART_CONSTANTS.STATUS_TEXT` - Status text mappings

## Design Tokens

Universal components use the following design tokens:
- **Colors**: Material Design 3 color tokens (`--color-primary`, `--color-on-primary`, etc.)
- **Spacing**: Element spacing tokens (`--size-element-pad-*`, `--size-element-gap-*`)
- **Typography**: Typography tokens (`.body1-txt`, `.body2-txt`, etc.)
- **Border Radius**: Element radius tokens (`--size-element-radius-*`)
- **Border/Stroke**: Element stroke tokens (`--size-element-stroke-*`)

## See Also

- **Component Documentation**: `../../components/docs/COMPONENTS.md`
- **Token Reference**: `../../guidelines/token-reference.md`
- **Terminology**: `../../guidelines/terminology.md`
- **Coding Standards**: `../../guidelines/coding-standards.md`

