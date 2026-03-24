# Login Template Structure

## Overview
This template contains complete page implementations for authentication and login flows. These templates are based on the Login specs documentation and serve as complete, functional page implementations.

## Reference Documentation

For detailed component breakdowns and specifications, see:
- **Specs Documentation**: `../../../design-system/src/specs/Login/STRUCTURE.md`
- **Specs Overview**: `../../../design-system/src/specs/Login/Login.stories.js`
- **Component Library**: `../../../design-system/src/components/`

## Template Structure

```
playground/templates/login/
├── STRUCTURE.md (this file)
├── [template-files].html
├── [template-files].js
└── README.md (if needed)
```

## Component Breakdown from Specs

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

## Implementation Guidelines

1. **Reference Specs First**: Always check `../../../design-system/src/specs/Login/STRUCTURE.md` for detailed component breakdowns
2. **Use Design Tokens**: Always use semantic design tokens from `../../../design-system/src/styles/`
3. **Bootstrap Foundation**: Use Bootstrap 4.6.2 as functional foundation, then customize all styling to match Figma exactly
4. **Figma Accuracy**: All components must match Figma designs pixel-perfectly
5. **Complete Pages**: Templates should represent complete, functional page implementations

## Template Files

Current template files in this directory:
- `login.html` - Login page implementation
- `login.js` - Login JavaScript
- `sign-in-portal.html` - Sign-in portal page
- `sign-in-portal.js` - Sign-in portal JavaScript

## Best Practices

- Start from the specs documentation to understand component structure
- Implement complete pages, not just individual components
- Use existing PLUS components when possible
- Follow coding standards from `../../../.agent/SKILL.md`
- Include proper accessibility attributes
- Ensure responsive design
- Reference: `../../../design-system/src/specs/Login/STRUCTURE.md` for complete component breakdown

