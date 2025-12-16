# Components Overview

The PLUS Design System components are organized into two main categories: Components and Specs.

> **For Developers**: Technical API documentation and implementation details are located in [develop/COMPONENTS.md](../../develop/COMPONENTS.md).

## Component Organization

### Components
Reusable UI components that can be used independently or composed together.

**Examples:**
- **Actions**: Buttons, Dropdowns, Links
- **Feedback**: Alerts, Toasts, Spinners
- **Forms**: Checkboxes, Radios, Switches, Inputs
- **Navigation**: Breadcrumbs, Navbars, Pagination
- **Structure**: Cards, Modals, Sections, Tables

### Specs
Complex components composed of multiple components, representing complete interface sections.

**Examples:**
- Universal - commonly used across pillars
- Admin - administrative interfaces
- Home, Login, Profile, Toolkit, Training

## Component Terminology

The PLUS design system organizes UI components into 6 semantic layers, from smallest to largest:

1. **Elements** - Fundamental building blocks (buttons, forms, badges, items)
2. **Cards** - Self-contained containers displaying information
3. **Sections** - Containers for cards or forms, grouping related content
4. **Modals** - Pop-up windows requiring user attention
5. **Surfaces** - Full screen/spec the user sees at one time
6. **Surface Containers** - Top-level frame (sidebar, top bar) - only one per screen

### Visual Hierarchy & Token Usage

#### Elements
- **Usage**: Fundamental interactions.
- **Spacing**: Tightly packed (`element-gap-*`).
- **Radius**: Small, usually 4px (`element-radius-sm/md/lg`). Pill shapes (999px) for badges.

#### Cards
- **Usage**: Grouping information.
- **Spacing**: Moderate internal padding (`card-pad-*`).
- **Radius**: Medium, usually 12px (`card-radius-sm`).

#### Sections
- **Usage**: Grouping cards or large content areas.
- **Spacing**: Generous spacing (`section-pad-*`).
- **Radius**: Larger, usually 8px-16px (`section-radius-*`).

#### Modals
- **Usage**: Critical interruptions or focused tasks.
- **Spacing**: Variable based on content density.
- **Radius**: Typically 6px (`modal-radius-md`).

## SMART Competency Framework

The system includes specialized support for the SMART framework competency areas:

1. **Social-Emotional Learning** (SE) - Gold/Yellow theme
2. **Mastering Content** (MC) - Purple theme
3. **Advocacy** (ADV) - Green theme
4. **Relationships** (RELN) - Pink/Magenta theme
5. **Technology Tools** (TT) - Blue theme

Each area has associated color tokens and visual treatments for badges, cards, and pills.

## Best Practices for Designers

1.  **Consistency**: Use the defined semantic layers (Element inside Card inside Section).
2.  **Hierarchy**: Use spacing and typography to establish clear hierarchy.
3.  **Feedback**: Always account for empty, loading, and error states.
4.  **Accessibility**: Ensure color contrast and clear visual indicators for interactive elements.
