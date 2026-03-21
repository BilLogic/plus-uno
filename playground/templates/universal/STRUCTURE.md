# Universal Template Structure

## Overview
This template contains complete page implementations for universal/shared components that are commonly used across multiple product pillars. These templates are based on the Universal specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Overview**: `../../../design-system/specs/Universal/Universal.stories.js`
- **Component Library**: `../../../design-system/components/`

## Template Structure

```
playground/templates/universal/
├── STRUCTURE.md (this file)
├── html-head-template.html (Standardized HTML head template)
├── table-example.html (Table styling example)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Breakdown from Specs

### Elements Section
- **SidebarTab**: Sidebar navigation tab with states
- **UserAvatar**: User avatar with name and notification counter
- **StaticBadgeSmart**: SMART competency area badge

### Sections Section
- **Sidebar**: Navigation sidebar with tutor and supervisor variants
- **TopBar**: Top navigation bar with breadcrumb and user avatar
- **Footer**: Footer component

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../design-system/specs/Universal/` for component specifications
2. **Use Design Tokens**: Always use semantic design tokens from `../../../design-system/styles/`
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
5. **Complete Pages**: Templates should represent complete, functional page implementations

## Template Files

Current template files in this directory:
- `html-head-template.html` - Standardized HTML head template with all required links
- `table-example.html` - Table styling example using design tokens

## Best Practices

- Start from the specs documentation to understand component structure
- Implement complete pages, not just individual components
- Use existing PLUS components when possible
- Follow coding standards from `../../../.agent/SKILL.md`
- Include proper accessibility attributes
- Ensure responsive design
- Universal templates should be reusable across different product pillars

