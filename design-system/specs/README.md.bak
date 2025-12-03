# Organisms

## Overview

Organisms are higher-level components than molecules. They combine multiple molecules, elements, cards, tables, modals, sections, and pages to create complete, functional user experiences.

## Structure

Each organism is organized into subcategories that reflect the different types of components it contains:

```
organisms/
└── [OrganismName]/
    ├── STRUCTURE.md (component breakdown documentation)
    ├── [OrganismName].stories.js (main overview story)
    ├── index.js (main export file)
    │
    ├── Elements/ (individual form elements and UI components)
    │   └── [ComponentName]/
    │       ├── [ComponentName].stories.js
    │       ├── [ComponentName].scss
    │       └── index.js
    │
    ├── Cards/ (card components)
    │   └── [ComponentName]/
    │       ├── [ComponentName].stories.js
    │       ├── [ComponentName].scss
    │       └── index.js
    │
    ├── Tables/ (table components)
    │   └── [ComponentName]/
    │       ├── [ComponentName].stories.js
    │       ├── [ComponentName].scss
    │       └── index.js
    │
    ├── Modals/ (modal dialogs)
    │   └── [ComponentName]/
    │       ├── [ComponentName].stories.js
    │       ├── [ComponentName].scss
    │       └── index.js
    │
    ├── Sections/ (section-level components)
    │   └── [ComponentName]/
    │       ├── [ComponentName].stories.js
    │       ├── [ComponentName].scss
    │       └── index.js
    │
    └── Pages/ (complete page-level components)
        └── [ComponentName]/
            ├── [ComponentName].stories.js
            ├── [ComponentName].scss
            └── index.js
```

## Current Organisms

### Universal
Universal organisms (formerly Shared) are commonly used across multiple product pillars.

**Structure:**
- **Elements**: SidebarTab, UserAvatar, StaticBadgeSmart
- **Cards**: (to be added as needed)
- **Tables**: (to be added as needed)
- **Modals**: (to be added as needed)
- **Sections**: Sidebar, TopBar, Footer
- **Pages**: (to be added as needed)

### Admin
Admin organisms are specific to administrative interfaces and functionality.

**Structure:**
- **Elements**: (to be implemented)
- **Cards**: (to be implemented)
- **Tables**: (to be implemented)
- **Modals**: (to be implemented)
- **Sections**: (to be implemented)
- **Pages**: (to be implemented)

### Login
The Login organism contains components for authentication and login flows.

**Structure:**
- **Elements**: Institution selection, access code forms, login buttons, auth provider buttons, footer, alerts
- **Cards**: Login portal cards with various steps and types
- **Tables**: (to be added as needed)
- **Modals**: Notifications modal
- **Sections**: (to be added as needed)
- **Pages**: Sign-in portal page

See `Login/STRUCTURE.md` for detailed component breakdown.

### Profile
The Profile organism contains components for user profile management and tutor profile selection.

**Structure:**
- **Elements**: Tutor profile select dropdown
- **Cards**: (to be added as needed)
- **Tables**: (to be added as needed)
- **Modals**: (to be added as needed)
- **Sections**: (to be added as needed)
- **Pages**: Tutor profile page

See `Profile/STRUCTURE.md` for detailed component breakdown.

### Home
The Home organism contains components for the home page, including dashboard elements, data visualization, resource cards, and user feedback.

**Structure:**
- **Elements**: Resource type icons, product area dropdown, card badges, button container
- **Cards**: Overview cards, resource cards, metrics cards, data visualization, recommended lessons, training progress cards
- **Tables**: (to be added as needed)
- **Modals**: User feedback modal
- **Sections**: Homepage jumbotron, bottom div
- **Pages**: Skills overview page, skills home page

See `Home/STRUCTURE.md` for detailed component breakdown.

### Training
The Training organism contains components for training lessons, ratings, and student management.

**Structure:**
- **Elements**: Ratings, rating single, Likert scale, AI indicator, sort control, training lesson status select, toast/text button
- **Cards**: Lesson cards, supervisor alerts
- **Tables**: Lesson list items
- **Modals**: (to be added as needed)
- **Sections**: Student overview, my students + student overview, welcome row
- **Pages**: Training lesson pages, list view

See `Training/STRUCTURE.md` for detailed component breakdown.

### Toolkit
The Toolkit organism contains components for sessions, sign-ups, call-offs, reflections, and student management.

**Structure:**
- **Elements**: Buttons, dropdowns, ratings, badges, filters, attendance components, form components, cards and items, actions and feedback
- **Cards**: Call-off alerts
- **Tables**: My sessions, call-offs, sign-ups, reflections, schedule rows, student lists
- **Modals**: View tutors, session sign-up, call-off details, session details, fill-in, assignments, welcome banner, calendar
- **Sections**: Side nav bar, forms, overview cards
- **Pages**: Session info, form feedback, steps, call-offs, sign-ups, reflections, my sessions, dashboards

See `Toolkit/STRUCTURE.md` for detailed component breakdown.

## Storybook Organization

Each subcategory (Elements, Cards, Tables, Modals, Sections, Pages) will have its own Storybook page/section, making it easy to navigate and view all components within that category.

## Implementation Guidelines

1. **Organisms vs Molecules**: Organisms are higher-level compositions that may use molecules and elements as building blocks
2. **Token Usage**: Follow the same token reference guidelines, but may use tokens from multiple component types (elements, cards, sections, etc.)
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
5. **Component Organization**: Each component type should be in its appropriate subcategory folder

