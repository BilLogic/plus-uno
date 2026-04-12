<!-- Tier: 2 -->
# Tech Stack

## Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.1 | UI framework |
| React-Bootstrap | 2.10.10 | Component library base |
| Bootstrap | 5.3.3 | CSS framework |
| Vite | ^8.0.1 | Build tool + dev server (Rolldown-powered) |
| SASS | 1.77.8 | CSS preprocessing |

## Documentation & Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| Storybook | 10.2.7 | Component docs + visual testing |
| Vitest | 4.0.15 | Unit testing |
| Playwright | 1.58.2 | Browser testing |

## Data Visualization

| Technology | Version | Purpose |
|-----------|---------|---------|
| Highcharts | 12.5.0 | Charts and graphs |
| highcharts-react-official | 3.2.3 | React bindings |

## UI Enhancement

| Technology | Version | Purpose |
|-----------|---------|---------|
| Framer Motion | 12.33.0 | Animations |
| React Router DOM | 7.13.0 | Client-side routing |
| @assistant-ui/react | 0.12.3 | AI chat interface |

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run storybook` | Storybook (port 6006) |
| `npm run build` | Vite production build |
| `npm run build-storybook` | Storybook static site build |
| `npm run build:all` | Build app + Storybook |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS from token source |
| `npm run dev:home-redesign` | Home redesign prototype server |
| `npm run dev:monthly-report` | Monthly report prototype server |

## Path Aliases

| Alias | Resolves To |
|-------|-------------|
| `@` | `design-system/src` |
| `@plus-ds` | `design-system/src` |
| `~` | `node_modules` |
