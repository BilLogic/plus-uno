# Component Organization Guide

## Overview
Components are organized by product pillar and component type following atomic design principles.

## Structure

```
src/js/components/
├── universal/              # Universal components (used across all pillars)
│   ├── elements/          # Element components
│   │   ├── button.js
│   │   ├── checkbox.js
│   │   ├── alert.js
│   │   ├── status-icon.js
│   │   ├── content-status-tag.js
│   │   ├── super-comp-pill.js
│   │   ├── status-indicator.js
│   │   └── index.js
│   ├── cards/             # Card components (placeholder)
│   ├── modals/            # Modal components (placeholder)
│   ├── sections/          # Section components (placeholder)
│   ├── tables/            # Table components (placeholder)
│   ├── pages/             # Page components (placeholder)
│   ├── constants.js       # Shared constants
│   └── index.js           # Universal components index
│
├── login/                 # Login components (placeholder)
│   ├── elements/
│   ├── cards/
│   ├── modals/
│   ├── sections/
│   ├── tables/
│   └── pages/
│
├── profile/               # Profile components (placeholder)
├── home/                  # Home components (placeholder)
├── training/              # Training components (placeholder)
├── toolkit/               # Toolkit components (placeholder)
├── admin/                 # Admin components (placeholder)
│
└── index.js               # Main components index
```

## Product Pillars

### Universal
Components available across all product areas.
- **Location**: `src/js/components/universal/`
- **Usage**: Import from `./components/index.js` as `Universal`
- **Components**: Buttons, checkboxes, alerts, status icons, etc.

### Login
Components specific to login and authentication.
- **Location**: `src/js/components/login/`
- **Status**: Placeholder for future components

### Profile
Components specific to user profiles.
- **Location**: `src/js/components/profile/`
- **Status**: Placeholder for future components

### Home
Components specific to home/dashboard.
- **Location**: `src/js/components/home/`
- **Status**: Placeholder for future components

### Training
Components specific to training and learning.
- **Location**: `src/js/components/training/`
- **Status**: Placeholder for future components

### Toolkit
Components specific to the toolkit.
- **Location**: `src/js/components/toolkit/`
- **Status**: Placeholder for future components

### Admin
Components specific to admin panel.
- **Location**: `src/js/components/admin/`
- **Status**: Placeholder for future components

## Component Types

### Elements
Fundamental building blocks (buttons, inputs, badges, etc.)
- **Tokens**: Use `element-*` tokens
- **Location**: `[pillar]/elements/`
- **Examples**: Button, Checkbox, Alert, StatusIcon

### Cards
Self-contained containers (product cards, info cards, etc.)
- **Tokens**: Use `card-*` tokens
- **Location**: `[pillar]/cards/`
- **Examples**: (placeholder)

### Modals
Pop-up windows (dialogs, alerts, confirmations, etc.)
- **Tokens**: Use `modal-*` tokens
- **Location**: `[pillar]/modals/`
- **Examples**: (placeholder)

### Sections
Containers for cards or forms (dashboard sections, form sections, etc.)
- **Tokens**: Use `section-*` tokens
- **Location**: `[pillar]/sections/`
- **Examples**: (placeholder)

### Tables
Table components (data tables, comparison tables, etc.)
- **Tokens**: Use `table-*` tokens
- **Location**: `[pillar]/tables/`
- **Examples**: (placeholder)

### Pages
Full page layouts (dashboard pages, form pages, etc.)
- **Tokens**: Use `surface-*` and `surface-container-*` tokens
- **Location**: `[pillar]/pages/`
- **Examples**: (placeholder)

## Import Patterns

### New Modular Import (Preferred)
```javascript
import { Universal } from "./components/index.js";

// Use components
const button = Universal.createButton({...});
const checkbox = Universal.createCheckbox({...});
```

### Legacy Import (Backward Compatible)
```javascript
import { PlusInterface, PlusSmartComponents } from "./components/index.js";

// Use components (still works)
const button = PlusInterface.createButton({...});
const statusIcon = PlusSmartComponents.createStatusIcon("complete");
```

### Direct Import
```javascript
import { createButton } from "./components/universal/elements/button.js";
import { createCheckbox } from "./components/universal/elements/checkbox.js";

// Use components directly
const button = createButton({...});
const checkbox = createCheckbox({...});
```

## Adding New Components

### 1. Create Component File
Create component file in appropriate location:
```
src/js/components/[pillar]/[type]/[component-name].js
```

### 2. Export from Index
Add export to type index file:
```javascript
// src/js/components/[pillar]/[type]/index.js
export { createComponentName } from './component-name.js';
```

### 3. Update Pillar Index
Add export to pillar index file:
```javascript
// src/js/components/[pillar]/index.js
export * from './[type]/index.js';
```

### 4. Create Documentation
Create documentation in:
```
sandbox/docs/[pillar]/[type]/[component-name].md
```

### 5. Create Example
Create example in:
```
sandbox/examples/[pillar]/[type]/[component-name].html
```

## Component Naming

### Files
- Use kebab-case: `button.js`, `status-icon.js`, `super-comp-pill.js`
- Be descriptive: `content-status-tag.js` not `tag.js`

### Functions
- Use camelCase: `createButton`, `createStatusIcon`
- Prefix with `create` for component creators
- Be descriptive: `createContentStatusTag` not `createTag`

### Constants
- Use UPPER_SNAKE_CASE: `BUTTON_CONSTANTS`, `SMART_CONSTANTS`
- Group related constants: `BUTTON_CONSTANTS.FILL`, `BUTTON_CONSTANTS.STYLES`

## Design Tokens

### Element Components
Use `element-*` tokens:
- Padding: `--size-element-pad-x-*`, `--size-element-pad-y-*`
- Gap: `--size-element-gap-*`
- Radius: `--size-element-radius-*`
- Border: `--size-element-stroke-*`, `--size-element-border`

### Card Components
Use `card-*` tokens:
- Padding: `--size-card-pad-x-*`, `--size-card-pad-y-*`
- Gap: `--size-card-gap-*`
- Radius: `--size-card-radius-*`
- Border: `--size-card-border-*`

### Modal Components
Use `modal-*` tokens:
- Padding: `--size-modal-pad-x-*`, `--size-modal-pad-y-*`
- Gap: `--size-modal-gap-*`
- Radius: `--size-modal-radius-*`
- Border: `--size-modal-border-*`

### Section Components
Use `section-*` tokens:
- Padding: `--size-section-pad-x-*`, `--size-section-pad-y-*`
- Gap: `--size-section-gap-*`
- Radius: `--size-section-radius-*`
- Border: `--size-section-border`

### Table Components
Use `table-*` tokens:
- Cell padding: `--size-table-cell-x`, `--size-table-cell-y`
- Gap: `--size-table-cell-gap`
- Radius: `--size-table-radius-*`

### Page Components
Use `surface-*` and `surface-container-*` tokens:
- Padding: `--size-surface-pad-*`, `--size-surface-container-pad-*`
- Gap: `--size-surface-gap-*`, `--size-surface-container-gap-*`
- Radius: `--size-surface-radius`

## Sandbox Integration

### Examples
Component examples are organized in:
```
sandbox/examples/[pillar]/[type]/[component-name].html
```

### Documentation
Component documentation is organized in:
```
sandbox/docs/[pillar]/[type]/[component-name].md
```

### Token Highlighting
Each example should highlight:
- Used tokens
- Token values
- Token categories
- Token relationships

## See Also

- **Component Documentation**: `components/docs/COMPONENTS.md`
- **Token Reference**: `guidelines/token-reference.md`
- **Terminology**: `guidelines/terminology.md`
- **Coding Standards**: `guidelines/coding-standards.md`
- **Sandbox**: `sandbox/README.md`

