# PLUS Vibe Coding Starting Kit

A curated Cursor agent setup for PLUS design prototyping. This starter kit enables designers to rapidly prototype interactive high-fidelity work using the PLUS design system, generating production-ready code that developers can build from directly.

## Overview

This repository contains:
- **Design System Documentation**: Comprehensive documentation of PLUS design tokens, components, and patterns
- **Starter Template**: Ready-to-use template with base structure and minimal component set
- **Cursor Rules**: Pre-configured rules for Cursor AI to generate PLUS-compliant code
- **Reference Prototypes**: Example prototypes demonstrating design system usage
- **Component Library**: Base components from `packages/plus-ds` matching PLUS design patterns

## Quick Start

### Prerequisites

- Node.js and npm (for SASS compilation)
- A code editor with Cursor AI
- Basic knowledge of HTML, CSS, and JavaScript

### Setup

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build CSS**:
   ```bash
   npm run build:css
   ```

4. **Start local server** (optional):
   ```bash
   npm run serve
   ```

5. **Open in browser**: Navigate to `http://localhost:8000`

## Project Structure

See **[`develop/PROJECT_STRUCTURE.md`](develop/PROJECT_STRUCTURE.md)** for complete structure documentation.

**Quick Overview:**
- **`packages/plus-ds/`** - Design system source (components, assets, styles documentation)
- **`develop/`** - Technical documentation and guide index
- **`src/`** - Application source files
- **`playground/`** - Prototyping workspace (templates and designer playgrounds)

## Usage

### Prototyping Workflow

1. **Choose Your Workspace:**
   - **Templates** (`playground/templates/`): Use curated templates organized by product pillar (admin, toolkit, login, profile, home, training, universal)
   - **Playground** (`playground/{your-name}/`): Create designer-specific directories for experimentation

2. **Creating a New Prototype:**
   - For designer-specific work: Create `playground/{your-name}/{prototype-name}/`
   - For reusable templates: Create `playground/templates/{product-pillar}/{template-name}/`
   - **Never create HTML/JS files in root directory** (except `index.html`)

3. **Using Templates:**
   - Browse `playground/templates/` for starting points
   - Copy a template to your playground directory
   - Customize for your specific prototype

See `playground/templates/README.md` and `playground/README.md` for detailed guidelines.

### Using AI Assistants (Cursor, Copilot, etc.)

**First Time Setup:**

1. **Open this project in your AI-enabled editor** (Cursor, VS Code with Copilot, etc.)
2. **Point your AI to the agent configuration:**
   - In your first message, say: "Read `.agent/AGENT.md` to understand the PLUS Design System and your role"
   - This gives the AI context on available skills, coding standards, and design system patterns
3. **Start building:**
   - Ask for prototypes using PLUS design system
   - The AI will use the appropriate skill (building, maintaining, design-consulting)
   - Always create prototypes in `playground/` directory

**Key Reference Files:**
- `.agent/AGENT.md` - Agent configuration and skills (read this first!)
- `develop/foundations/` - Tech stack, terminology, context levels
- `packages/plus-ds/guidelines/design-tokens/` - Token reference (colors, typography, spacing)
- `packages/plus-ds/guidelines/overview-components.md` - Component library overview

### Example Prompts

- "Create a dashboard layout with cards using PLUS design system"
- "Build a form with validation using PLUS components"
- "Create a button group with primary and secondary actions"
- "Design a SMART component showing competency areas"

### Design Tokens

Always use semantic tokens (CSS variables) instead of hardcoded values. Reference `packages/plus-ds/guidelines/design-tokens/` for all available tokens.

```css
/* ✅ Good - Using semantic tokens */
.card {
    padding: var(--size-card-pad-x-md) var(--size-card-pad-y-md);
    gap: var(--size-card-gap-md);
    background-color: var(--color-surface-container);
    color: var(--color-on-surface);
}

/* ❌ Bad - Hardcoded values */
.card {
    padding: 20px 20px;
    gap: 16px;
    background-color: #f5f5f5;
    color: #333;
}
```

### Components

Use existing PLUS components when possible:

```javascript
import { Button } from '@tutors.plus/design-system';
 
 const MyButton = () => (
     <Button
         text="Click me"
         style="primary"
         fill="filled"
         size="default"
     />
 );
```

Components are organized into two main categories:
- **Components**: Reusable UI components (Input, Button, Card, Alert, Form, etc.)
- **Specs**: Complex interface sections composed of multiple components (Login, Home, Profile, Training, Toolkit, Universal, Admin)

See `packages/plus-ds/guidelines/overview-components.md` for component details and `develop/PROJECT_STRUCTURE.md` for complete project organization.

## Documentation

### Essential Guidelines (Always Reference)
- **[Coding Standards](develop/standards.md)** - Project rules, coding standards, setup guides, best practices
- **[Token Reference](packages/plus-ds/guidelines/design-tokens/)** - Complete token reference
- **[Component Terminology](packages/plus-ds/guidelines/overview-components.md)** - UI component types and terminology
- **[Import Paths](develop/imports.md)** - Component import path reference (see `packages/plus-ds`)
 
 ### Additional Documentation
- **[Components](packages/plus-ds/guidelines/overview-components.md)** - Component library documentation
- **[Styles Overview](packages/plus-ds/guidelines/design-tokens/)** - Design token system overview
- **[Figma Integration](develop/FIGMA_DESIGN_SYSTEM.md)** - Figma integration guide
- **[Project Structure](develop/PROJECT_STRUCTURE.md)** - Complete project structure guide

## Design System Principles

1. **CSS Custom Properties**: All design tokens use CSS variables
2. **Utility-First**: Extensive utility classes for spacing, colors, typography
3. **Component-Based**: Reusable JavaScript components with consistent APIs
4. **Responsive**: Breakpoint-based responsive design
5. **Accessibility**: Focus states, ARIA attributes, keyboard navigation
6. **State Layers**: Consistent hover/active/focus states with opacity
7. **SMART System**: Integrated competency area categorization

## Tech Stack

- **React 19**: UI framework
- **React-Bootstrap 2.10.10**: Bootstrap components for React
- **Bootstrap 5.3.3**: CSS framework
- **Vite 6**: Build tool and dev server
- **Storybook 10**: Component development and documentation
- **SASS/SCSS**: CSS preprocessing
- **Highcharts 12.4.0**: Charts and data visualization
- **Font Awesome**: Icons

## Key Features

### Design Tokens
- Complete color system (accent, neutral, extended/SMART colors)
- Typography scale (Display, Headlines, Titles, Body)
- Spacing system (within component, between components, between sections)
- Size tokens (border radius, breakpoints, base sizes)

### Components
- Buttons (filled, outline, tonal, text variants)
- Form elements (inputs, checkboxes, textareas)
- SMART components (status indicators, competency pills)
- Cards and layouts
- Alerts and notifications

### Cursor Integration
- Pre-configured `.cursorrules` file
- Design system documentation for AI reference
- Component patterns and examples
- Best practices and anti-patterns

## Development

### Building CSS

```bash
# Build once
npm run build:css

# Watch for changes
npm run watch:css
```

### Adding New Components

1. Create component file in `packages/plus-ds/src/components/{ComponentName}/index.tsx`
2. Create component SCSS file in `packages/plus-ds/src/components/{ComponentName}/{ComponentName}.scss`
3. Create Storybook story file `{ComponentName}.stories.tsx` in the component folder with autodocs enabled
4. Add component export to `packages/plus-ds/src/components/index.ts`

**Tip**: Reference existing components in `packages/plus-ds/src/components/` and their Storybook stories to follow established implementation patterns.

### Updating Design Tokens

1. Update token SCSS files in `packages/plus-ds/src/styles/`
2. Update token documentation in `packages/plus-ds/guidelines/design-tokens/`
3. Rebuild CSS: `npm run build:css`

## Reference Prototypes

See `playground/templates/` for curated templates demonstrating:
- Button variants and usage
- Form elements and validation
- SMART components
- Card layouts
- Dashboard layouts

## Integration with Production

This starter kit is designed to generate code that can be integrated with the production codebase at `https://github.com/CMU-PLUS/web-app.git`.

### Key Locations in Production
- Components: `java/docroot/javascript/pl2/plus_components/*`
- Design Tokens: `java/sass/*`
- Main JS: `java/docroot/javascript/pl2/*`

### Code Handoff Process

1. Generate prototype using Cursor AI
2. Review code for design system compliance
3. Test prototype functionality
4. Share with dev team for integration
5. Gather feedback and iterate

## Best Practices

1. **Always use design tokens** - Never hardcode values
2. **Use existing components** - Don't recreate from scratch
3. **Follow naming conventions** - Consistent naming across codebase
4. **Include JSDoc comments** - Document all functions and classes
5. **Test responsiveness** - Ensure prototypes work on all screen sizes
6. **Maintain accessibility** - Include ARIA attributes and keyboard navigation
7. **Keep code clean** - Follow development standards

## Troubleshooting

### CSS not loading
- Run `npm run build:css` to compile SASS
- Check that `dist/css/main.css` exists
- Verify HTML links to correct CSS path

### Components not working
- Check browser console for errors
- Verify JavaScript modules are loaded
- Ensure jQuery and Bootstrap are included

### Design tokens not applying
- Verify CSS variables are defined
- Check browser developer tools for variable values
- Ensure tokens are imported in `main.scss`

## Contributing

When contributing to this starter kit:

1. Follow development standards
2. Update documentation as needed
3. Test changes across browsers
4. Maintain design system consistency
5. Update examples if adding new patterns

## Resources

- [PLUS Production Repository](https://github.com/CMU-PLUS/web-app.git)
- [React Documentation](https://react.dev/)
- [React-Bootstrap Documentation](https://react-bootstrap.github.io/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Vite Documentation](https://vite.dev/)
- [Storybook Documentation](https://storybook.js.org/)
- [Font Awesome Icons](https://fontawesome.com/icons)
- [SASS Documentation](https://sass-lang.com/documentation)

## Support

For questions or issues:
1. Check documentation in `docs/` folder
2. Review reference prototypes in `examples/`
3. Consult production codebase for patterns
4. Contact design or development team

## License

Internal use only - PLUS Design Team

## Changelog

### Version 1.0.0
- Initial release
- Design token system
- Base component library
- Cursor rules configuration
- Documentation
- Reference prototypes

---

**Happy Prototyping! 🎨**
