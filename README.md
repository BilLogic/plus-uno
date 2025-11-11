# PLUS Vibe Coding Starting Kit

A curated Cursor agent setup for PLUS design prototyping. This starter kit enables designers to rapidly prototype interactive high-fidelity work using the PLUS design system, generating production-ready code that developers can build from directly.

## Overview

This repository contains:
- **Design System Documentation**: Comprehensive documentation of PLUS design tokens, components, and patterns
- **Starter Template**: Ready-to-use template with base structure and minimal component set
- **Cursor Rules**: Pre-configured rules for Cursor AI to generate PLUS-compliant code
- **Reference Prototypes**: Example prototypes demonstrating design system usage
- **Component Library**: Base components matching PLUS design patterns

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

### Core Guidelines (Always Reference)
```
docs/guidelines/              # Core guidelines and reference documents
├── coding-standards.md      # Project rules and coding standards
├── token-reference.md        # Complete token reference
├── terminology.md            # UI component types and terminology
└── README.md                 # Guidelines overview
```

### Documentation
```
docs/                          # All documentation consolidated
├── guidelines/               # Core guidelines
├── components/               # Component documentation
│   └── COMPONENTS.md        # Component library documentation
├── tokens/                   # Token system documentation
│   └── README.md
├── DESIGN_PATTERNS.md
├── DEV_STANDARDS.md
└── FIGMA_DESIGN_SYSTEM.md
```

### Design System Source
```
design-system/                # Design system source files
├── tokens/                   # Token SCSS files
│   ├── _colors.scss         # Material Design 3 colors
│   ├── _primitives.scss     # Primitive tokens
│   ├── _spacing_semantics.scss # Semantic spacing
│   └── ...
├── components/
│   ├── local/               # Component implementations
│   └── atoms-molecules/     # Storybook stories
└── styles/                  # Component styles
```

### Application Source
```
src/                          # Application source files
├── css/
│   └── main.scss           # Main stylesheet (references design-system)
└── js/
    ├── components/          # (references design-system)
    ├── utils/               # Utility functions
    └── main.js             # Main JavaScript (references design-system)
```

### Configuration
```
.cursorrules                  # Cursor AI configuration
package.json                  # Project configuration
index.html                    # Main HTML file
```

See `PROJECT_STRUCTURE.md` for complete structure documentation.

## Usage

### Using Cursor AI

1. **Open this project in Cursor**
2. **Start a new conversation** with Cursor AI
3. **Ask for prototypes** using PLUS design system
4. **Always reference guideline files** in `docs/guidelines/` folder:
   - `docs/guidelines/coding-standards.md` - Project rules
   - `docs/guidelines/token-reference.md` - Token reference
   - `docs/guidelines/terminology.md` - Component types

### Example Prompts

- "Create a dashboard layout with cards using PLUS design system"
- "Build a form with validation using PLUS components"
- "Create a button group with primary and secondary actions"
- "Design a SMART component showing competency areas"

### Design Tokens

Always use semantic tokens (CSS variables) instead of hardcoded values. Reference `docs/guidelines/token-reference.md` for all available tokens.

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
// New modular import (preferred)
import { Universal } from "./design-system/components/local/index.js";

const button = Universal.createButton({
    btnText: "Click me",
    btnStyle: "primary",
    btnFill: "filled",
    btnSize: "default"
});

// Legacy import (still works for backward compatibility)
import { PlusInterface } from "./design-system/components/local/index.js";

const button = PlusInterface.createButton({
    btnText: "Click me",
    btnStyle: "primary",
    btnFill: "filled",
    btnSize: "default"
});
```

Components are organized by:
- **Product Pillar**: universal, login, profile, home, training, toolkit, admin
- **Component Type**: elements, cards, modals, sections, tables, pages

See `docs/components/COMPONENTS.md` for component details and `PROJECT_STRUCTURE.md` for complete project organization.

## Documentation

### Essential Guidelines (Always Reference)
- **[Coding Standards](docs/guidelines/coding-standards.md)** - Project rules and coding standards
- **[Token Reference](docs/guidelines/token-reference.md)** - Complete token reference (colors, spacing, typography, layout)
- **[Terminology](docs/guidelines/terminology.md)** - UI component types and terminology

### Additional Documentation
- **[Components](docs/components/COMPONENTS.md)** - Component library documentation
- **[Design Patterns](docs/DESIGN_PATTERNS.md)** - Design patterns and examples
- **[Development Standards](docs/DEV_STANDARDS.md)** - Detailed development guidelines
- **[Project Structure](PROJECT_STRUCTURE.md)** - Complete project structure guide

## Design System Principles

1. **CSS Custom Properties**: All design tokens use CSS variables
2. **Utility-First**: Extensive utility classes for spacing, colors, typography
3. **Component-Based**: Reusable JavaScript components with consistent APIs
4. **Responsive**: Breakpoint-based responsive design
5. **Accessibility**: Focus states, ARIA attributes, keyboard navigation
6. **State Layers**: Consistent hover/active/focus states with opacity
7. **SMART System**: Integrated competency area categorization

## Tech Stack

- **Bootstrap 4**: CSS framework
- **Vanilla JavaScript**: ES6 modules
- **SASS/SCSS**: CSS preprocessing
- **jQuery**: DOM manipulation (optional)
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

1. Create component file in `design-system/components/local/`
2. Add component styles in `design-system/styles/`
3. Import in `src/js/main.js`
4. Document in `docs/components/COMPONENTS.md`

### Updating Design Tokens

1. Update token files in `design-system/tokens/`
2. Rebuild CSS: `npm run build:css`
3. Update documentation in `docs/DESIGN_TOKENS.md`

## Reference Prototypes

See [examples/README.md](examples/README.md) for reference prototypes demonstrating:
- Button showcase
- Form elements
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
- [Bootstrap 4 Documentation](https://getbootstrap.com/docs/4.6/)
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
