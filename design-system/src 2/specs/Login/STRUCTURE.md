# Login Organism Structure

## Overview
The Login organism is a higher-level component that combines multiple molecules, elements, cards, tables, modals, sections, and pages to create a complete login/authentication experience.

## Directory Structure

```
design-system/src/specs/Login/
├── STRUCTURE.md (this file)
├── Login.stories.js (main organism overview story)
│
├── Elements/
│   ├── InstitutionSelection/
│   │   ├── InstitutionSelection.stories.js
│   │   ├── InstitutionSelection.scss
│   │   └── index.js
│   ├── AccessCodeForm/
│   │   ├── AccessCodeForm.stories.js
│   │   ├── AccessCodeForm.scss
│   │   └── index.js
│   ├── LoginButtons/
│   │   ├── LoginButtons.stories.js
│   │   ├── LoginButtons.scss
│   │   └── index.js
│   ├── AuthButtons/
│   │   ├── AuthButtons.stories.js
│   │   ├── AuthButtons.scss
│   │   └── index.js
│   ├── LoginFooter/
│   │   ├── LoginFooter.stories.js
│   │   ├── LoginFooter.scss
│   │   └── index.js
│   └── LoginAlert/
│       ├── LoginAlert.stories.js
│       ├── LoginAlert.scss
│       └── index.js
│
├── Cards/
│   └── LoginPortal/
│       ├── LoginPortal.stories.js
│       ├── LoginPortal.scss
│       ├── LoginPortal.Variants.stories.js (official step 1, demo step 1, official step 2, etc.)
│       └── index.js
│
├── Tables/
│   └── (to be added as needed)
│
├── Modals/
│   └── NotificationsModal/
│       ├── NotificationsModal.stories.js
│       ├── NotificationsModal.scss
│       ├── NotificationsModal.Variants.stories.js (type A, type B)
│       └── index.js
│
├── Sections/
│   └── (to be added as needed)
│
├── Pages/
│   └── SignInPortal/
│       ├── SignInPortal.stories.js
│       ├── SignInPortal.scss
│       └── index.js
│
└── index.js (main export file for Login organism)
```

## Component Breakdown from Figma

### Elements Section
1. **InstitutionSelection** (`dropdown / institution selection`)
   - States: empty, filled, open, typing
   - Form variants: official, independent

2. **AccessCodeForm** (`form / access code`)
   - States: default, invalid

3. **LoginButtons** (`button / misc`)
   - Actions: try a demo, back to log in portal, continue, log in
   - States: enabled, disabled

4. **AuthButtons** (`button / auths`)
   - Providers: google, clever

5. **LoginFooter** (`footer`)
   - Footer component for login pages

6. **LoginAlert** (`alert`)
   - Alert component for login error messages

### Cards Section
1. **LoginPortal** (`login portal`)
   - Variants:
     - type=official, step=1
     - type=demo, step=1
     - type=official, step=2
     - type=official, step=3a
     - type=official, step=3b

### Modals Section
1. **NotificationsModal** (`modal / notifications`)
   - Variants: type A, type B

### Pages Section
1. **SignInPortal** (`Sign-in Portal`)
   - Complete sign-in portal page

## Storybook Organization

Each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) will have its own Storybook page/section, making it easy to navigate and view all components within that category.

### Story Naming Convention
- Main story: `ComponentName.stories.js`
- Variant stories: `ComponentName.Variants.stories.js`, `ComponentName.States.stories.js`, etc.
- Follow the same pattern as molecules

## Implementation Notes

1. **Organisms vs Molecules**: Organisms are higher-level compositions that may use molecules and elements as building blocks
2. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly

