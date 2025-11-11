# Universal Components

## Overview
Universal components are available across all product pillars and can be used in any part of the application.

## Component Types

### Elements
Fundamental building blocks used throughout the application.

**Components:**
- `button.js` - Button component with various styles and fills
- `checkbox.js` - Checkbox component with single and group options
- `alert.js` - Alert component for displaying messages
- `status-icon.js` - Status icon component for SMART framework
- `content-status-tag.js` - Content status tag with icon and text
- `super-comp-pill.js` - Competency area pill component
- `status-indicator.js` - Status indicator component

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

// Create a checkbox
const checkbox = createCheckbox({
    label: "Option",
    name: "option",
    value: "value",
    id: "option-id"
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

