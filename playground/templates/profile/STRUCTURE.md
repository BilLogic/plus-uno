# Profile Template Structure

## Overview
This template contains complete page implementations for user profile management and tutor profile selection. These templates are based on the Profile specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Documentation**: `../../../design-system/specs/Profile/STRUCTURE.md`
- **Specs Overview**: `../../../design-system/specs/Profile/Profile.stories.js`
- **Component Library**: `../../../design-system/components/`

## Template Structure

```
playground/templates/profile/
├── STRUCTURE.md (this file)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Breakdown from Specs

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

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../design-system/specs/Profile/STRUCTURE.md` for detailed component breakdowns
2. **Use Design Tokens**: Always use semantic design tokens from `../../../design-system/styles/`
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
5. **Complete Pages**: Templates should represent complete, functional page implementations

## Best Practices

- Start from the specs documentation to understand component structure
- Implement complete pages, not just individual components
- Use existing PLUS components when possible
- Follow coding standards from `../../../develop/standards.md`
- Include proper accessibility attributes
- Ensure responsive design
- Reference: `../../../design-system/specs/Profile/STRUCTURE.md` for complete component breakdown

