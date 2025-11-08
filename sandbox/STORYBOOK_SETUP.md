# Storybook Setup Complete

## Overview
Storybook has been successfully set up in the `sandbox/` directory as a component playground for the PLUS Design System, organized using atomic design principles.

## Installation

Storybook is installed and configured to run from the `sandbox/` directory:
- Configuration: `sandbox/.storybook/`
- Stories: `sandbox/stories/`
- Static files: Served from `dist/` and `sandbox/public/`

## Running Storybook

### Development Mode
```bash
npm run storybook
```
This will start Storybook on http://localhost:6006/

### Build Static Version
```bash
npm run build-storybook
```
This will build a static version in `sandbox/storybook-static/`

## Organization: Atomic Design

### Atoms (Basic Building Blocks)
Located in `sandbox/stories/atoms/`:
- **Typography** - Display text, headlines, titles, body text with color variations
- **Icon** - Font Awesome icons with sizes, styles, and colors
- **Input** - Text fields and textareas with different sizes and states
- **StatusIndicator** - Status icons (icon only, no container)

### Molecules (Component Combinations)
Located in `sandbox/stories/molecules/`:
- **Button** - All button styles, fills, sizes, states, with icons
- **Checkbox** - Single checkboxes and checkbox groups
- **Alert** - All alert styles with titles and dismiss functionality
- **StatusTag** - Status tags with icon and text
- **CompetencyPill** - Competency area pills with full text and abbreviated versions

## Features

### Interactive Controls
Each component story includes interactive controls (argTypes) that allow you to:
- Test different property values
- See all component variations
- Understand component behavior
- View component code examples

### Component States
Stories demonstrate components in different states:
- Default state
- Hover state
- Active/focused state
- Disabled state
- Error states (where applicable)

### Dependencies
Storybook is configured to load:
- Bootstrap 4 CSS and JS (from CDN)
- jQuery (from CDN)
- Font Awesome (from CDN)
- PLUS Design System CSS (from `dist/css/main.css`)

## File Structure

```
sandbox/
├── .storybook/
│   ├── main.js              # Storybook configuration
│   ├── preview.js           # Preview configuration
│   └── preview-head.html    # HTML head with dependencies
├── stories/
│   ├── Introduction.stories.mdx    # Documentation
│   ├── atoms/
│   │   ├── Typography.stories.js
│   │   ├── Icon.stories.js
│   │   ├── Input.stories.js
│   │   └── StatusIndicator.stories.js
│   └── molecules/
│       ├── Button.stories.js
│       ├── Checkbox.stories.js
│       ├── Alert.stories.js
│       ├── StatusTag.stories.js
│       └── CompetencyPill.stories.js
└── public/                  # Static assets
```

## Configuration Details

### Main Configuration (`sandbox/.storybook/main.js`)
- Framework: `@storybook/html-vite`
- Stories pattern: `../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)`
- Static directories: `dist/` and `public/`
- Path aliases: `@` maps to `src/`

### Preview Configuration (`sandbox/.storybook/preview.js`)
- Global decorators for proper HTML structure
- Viewport configurations (mobile, tablet, desktop)
- Background options for different surface colors
- Controls configuration

### Preview Head (`sandbox/.storybook/preview-head.html`)
- Loads Bootstrap 4 CSS
- Loads Font Awesome
- Loads jQuery
- Loads Bootstrap 4 JS
- Loads PLUS Design System CSS

## Usage

1. **Start Storybook**: Run `npm run storybook`
2. **Browse Components**: Use the sidebar to navigate between Atoms and Molecules
3. **Interact with Components**: Use the controls panel to test different properties
4. **View Variations**: Each component has multiple stories showing different variations
5. **View Documentation**: Check the Introduction story for overview and usage

## Notes

- Storybook uses CommonJS format for configuration files (main.js)
- Component imports use relative paths from the stories directory
- CSS is served as a static file from the `dist/` directory
- All external dependencies (Bootstrap, jQuery, Font Awesome) are loaded from CDN

## Troubleshooting

### MDX File Warning
If you see a warning about the MDX file not being indexed, this is expected and doesn't prevent the JavaScript stories from working. The MDX file is for documentation purposes.

### CSS Not Loading
Make sure the CSS is built before running Storybook:
```bash
npm run build:css
```

### Component Imports Not Working
Check that the import paths in story files are correct relative to the `stories/` directory. Paths should be `../../../src/js/components/...`

## Next Steps

- Add more component stories as new components are created
- Add token showcase stories in `stories/tokens/`
- Customize Storybook theme to match PLUS design system
- Add more interactive examples and documentation

