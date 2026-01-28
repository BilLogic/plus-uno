# PLUS Tech Stack

## Core Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI Framework |
| React-Bootstrap | 2.10.10 | Component library |
| Bootstrap | 5.3.3 | CSS framework |
| Vite | 6.4.1 | Build tool |
| Storybook | 10.x | Component documentation |
| Highcharts | 12.4.0 | Data visualization |
| TypeScript | 5.9.3 | Type checking |
| Sass | 1.77.8 | CSS preprocessing |

## Commands

```bash
# Development
npm run storybook     # Component docs at localhost:6006
npm run dev:react     # Dev server at localhost:3000
npm run dev           # CSS watch + Python server at localhost:8000

# Build
npm run build:css     # Compile SCSS to CSS
npm run build:react   # Production build

# Tokens
npm run sync:tokens   # Sync Figma tokens
npm run generate:tokens  # Generate all tokens
```

## Directory Structure

| Path | Purpose |
|------|---------|
| `new-ds/` | Current design system components |
| `new-ds/forms/` | Form components (Input, Select, etc.) |
| `new-ds/styles/` | SCSS styles and tokens |
| `packages/plus-ds/` | NPM package source |
| `playground/prototyping/` | Prototype experiments |
| `.storybook/` | Storybook configuration |
