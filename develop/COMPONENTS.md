# Master Component Reference (Technical)

> **Target Audience**: Developers & Cursor AI
> **Purpose**: Single source of truth for component APIs, implementation details, and technical patterns.
> **For Design Concepts**: See [design-system/components/overview.md](../design-system/components/overview.md)

## 1. Master Component Index
All components available in `design-system/components/index.js`.

| Component Category | Export Name | Description |
| :--- | :--- | :--- |
| **Actions** | `createButton` | Standard button with variants |
| | `createButtonGroup` | Group of buttons |
| | `createDropdown` | Dropdown menu |
| **Feedback** | `createAlert` | Contextual feedback messages |
| | `createToast`, `showToast` | Temporary notifications |
| | `createSpinner`, `createLoadingGif` | Loading indicators |
| | `createProgress`, `updateProgress` | Progress bars |
| | `createTooltip` | Hover information |
| | `createPopover` | Click-triggered information |
| **Forms** | `createCheckbox`, `createCheckboxGroup` | Selection controls |
| | `createRadio`, `createRadioGroup` | Single selection controls |
| | `createSwitch` | Toggle switch |
| | `createSelect`, `createSelectMultiple` | Dropdown selection |
| | `createTextarea` | Multi-line input |
| | `createInputGroup` | Input with addons |
| | `createDatePicker` | Date selection |
| | `createRangeInput` | Slider input |
| | `createRichTextEditor` | WYSIWYG editor |
| **Navigation** | `createNavigation` | Main navigation |
| | `createNavbar` | Top navigation bar |
| | `createBreadcrumb` | Path navigation |
| | `createPagination` | Page navigation |
| | `createSidebarTab` | Sidebar navigation item |
| | `createScrollspy` | Scroll-based navigation |
| **Structure** | `createCard` | Content container |
| | `createModal` | Dialog overlay |
| | `createSection` | Page section container |
| | `createTable` | Data table |
| | `createJumbotron` | Hero content area |
| | `createCollapse` | Collapsible content |
| | `createCarousel` | Image/content slider |
| | `createListGroup` | List of items |
| | `createMediaObject` | Image + text object |
| | `createDivider` | Visual separator |
| **Data Display** | `createBadge` | Status/count indicator |
| | `createChip` | Compact element |
| | `createUserAvatar` | User profile image |
| | `createStaticBadgeSmart` | SMART framework badge |
| | `createCompetencyBadge` | Competency indicator |
| | `createSuperCompPillDiv` | SMART competency pill |

## 2. Standard Imports
**Always** import components from the main index to ensure proper dependency loading.

```javascript
import { PlusInterface, PlusSmartComponents } from "../design-system/components/index.js";
// OR for specific components
import { createButton, createCard } from "../design-system/components/index.js";
```

> **Note**: Adjust relative path based on file location (see [imports.md](imports.md)).

## 3. Core Component APIs

### Button (`createButton`)
```javascript
PlusInterface.createButton({
    btnText: "Submit",
    btnStyle: "primary", // primary, secondary, tertiary, success, info, warning, error
    btnFill: "filled",   // filled, outline, tonal, text
    btnSize: "default",  // small, default, large
    icon: "check",       // FontAwesome icon name (no 'fa-')
    buttonOnClick: () => console.log("Clicked")
});
```

### Checkbox (`createCheckbox`)
```javascript
PlusInterface.createCheckbox({
    label: "I agree",
    name: "agreement",
    id: "agree-check",
    checked: false,
    onChange: (e) => console.log(e.target.checked)
});
```

### Radio Group (`createRadioGroup`)
```javascript
PlusInterface.createRadioGroup([
    { label: "Option A", value: "a", id: "opt-a" },
    { label: "Option B", value: "b", id: "opt-b" }
], "group-name");
```

### Select (`createSelect`)
```javascript
PlusInterface.createSelect({
    id: "my-select",
    options: [
        { value: "1", text: "Option 1" },
        { value: "2", text: "Option 2", selected: true }
    ],
    placeholder: "Choose an option"
});
```

### Card (`createCard`)
```javascript
// Returns a DOM element structure
const card = PlusInterface.createCard({
    // ... options (refer to source code for full list)
});
// Typically used by constructing HTML structure with classes:
// <div class="plus-card">...</div>
```

## 4. Technical Implementation Patterns

### Component Creation
1.  **Factory Pattern**: All components use static factory methods (`create*`).
2.  **Options Object**: Pass configuration via a single object parameter.
3.  **DOM Return**: Methods return DOM nodes (or HTML strings in legacy cases), not React/Vue components.

### Bootstrap Integration
- **Override Default Spacing**: Bootstrap classes (`.form-group`, `.card`) have default margins. **Always** override with PLUS tokens.
- **Example**:
  ```css
  .form-group {
      margin-bottom: var(--size-component-margin-btm-3); /* Override Bootstrap's 1rem */
  }
  ```

### Anti-Patterns (Technical)
1.  ❌ `document.createElement('button')` → ✅ `PlusInterface.createButton()`
2.  ❌ `<input type="checkbox">` → ✅ `PlusInterface.createCheckbox()`
3.  ❌ Hardcoded HEX codes → ✅ `var(--color-primary)`
4.  ❌ Hardcoded pixels (`20px`) → ✅ `var(--size-card-pad-md)`

## 5. Token Usage Quick Reference

| Context | Token Prefix | Example |
| :--- | :--- | :--- |
| **Elements** | `element-` | `var(--size-element-gap-sm)` |
| **Cards** | `card-` | `var(--size-card-pad-md)` |
| **Sections** | `section-` | `var(--size-section-pad-lg)` |
| **Modals** | `modal-` | `var(--size-modal-pad-md)` |
| **Tables** | `table-` | `var(--size-table-cell-x)` |

## 6. SMART Framework Constants
Use `PlusSmartComponents` for SMART-specific logic.

- **Competency Areas**: `CA_SE` (Social-Emotional), `CA_MC` (Mastering Content), etc.
- **Colors**: `getColorClassForCompetencyArea("Social-Emotional")` -> `color-smartClrSe`
