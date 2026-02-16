# Admin Template Structure

## Overview
This template contains complete page implementations for admin-related interfaces, including Tutors, Sessions, Students, and Groups functionality. These templates are based on the Admin specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Documentation**: `../../../design-system/specs/Admin/STRUCTURE.md` (if available)
- **Specs Overview**: `../../../design-system/specs/Admin/Admin.stories.js`
- **Component Library**: `../../../design-system/components/`

## Template Structure

```
playground/templates/admin/
├── STRUCTURE.md (this file)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Categories

Based on the Admin specs, templates should implement components from these categories:

### Elements
- Individual form elements and UI components specific to admin interfaces
- Reference: `../../../design-system/specs/Admin/Elements/`

### Cards
- Card components for admin interfaces
- Reference: `../../../design-system/specs/Admin/Cards/`

### Tables
- Table components for admin data display
- Reference: `../../../design-system/specs/Admin/Tables/`

### Modals
- Modal dialogs for admin workflows
- Reference: `../../../design-system/specs/Admin/Modals/`

### Sections
- Section-level components for admin pages
- Reference: `../../../design-system/specs/Admin/Sections/`

### Pages
- Complete page-level implementations
- Reference: `../../../design-system/specs/Admin/Pages/`

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../design-system/specs/Admin/` for component specifications
2. **Use Design Tokens**: Always use semantic design tokens from `../../../design-system/styles/`
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
5. **Complete Pages**: Templates should represent complete, functional page implementations

## Template Files

Current template files in this directory:
- `tutor-admin.html` - Tutor admin interface
- `tutor-admin.js` - Tutor admin JavaScript
- `supervisor-session-prototype.html` - Supervisor session prototype

## Best Practices

- Start from the specs documentation to understand component structure
- Implement complete pages, not just individual components
- Use existing PLUS components when possible
- Follow coding standards from `../../../develop/standards.md`
- Include proper accessibility attributes
- Ensure responsive design

