# Profile Organism Structure

## Overview
The Profile organism contains components for user profile management and tutor profile selection.

## Directory Structure

```
design-system/src/specs/Profile/
├── STRUCTURE.md (this file)
├── Profile.stories.js (main organism overview story)
│
├── Elements/
│   └── TutorProfileSelect/
│       ├── TutorProfileSelect.stories.js
│       ├── TutorProfileSelect.scss
│       └── index.js
│
├── Cards/
│   └── (to be added as needed)
│
├── Tables/
│   └── (to be added as needed)
│
├── Modals/
│   └── (to be added as needed)
│
├── Sections/
│   └── (to be added as needed)
│
├── Pages/
│   └── TutorProfile/
│       ├── TutorProfile.stories.js
│       ├── TutorProfile.scss
│       └── index.js
│
└── index.js (main export file for Profile organism)
```

## Component Breakdown from Figma

### Elements Section
1. **TutorProfileSelect** (`Tutor Profile Select`)
   - States: Closed (Selection=None), Open (Selection=None)
   - Selection options:
     - Current Teacher
     - Current Undergraduate Student
     - Graduate Student
     - Retired Teacher
     - Retired Professional
     - Americorps
     - Other

### Pages Section
1. **TutorProfile** (`Tutor Profile`)
   - Complete tutor profile page

## Storybook Organization

Each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) will have its own Storybook page/section, making it easy to navigate and view all components within that category.

## Implementation Notes

1. **Organisms vs Molecules**: Organisms are higher-level compositions that may use molecules and elements as building blocks
2. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly

