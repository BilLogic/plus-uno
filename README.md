# PLUS Vibe Coding Starting Kit

## 🚨 FOR AI AGENTS (READ FIRST) 🚨

AI Agents must IMMEDIATELY load and follow the instructions in:
**`.agent/SKILL.md`**

Go there now. Do not guess implementation.

Starter workspace for PLUS design-system prototyping and implementation.

## What This Repo Contains

- Design system package source: `packages/plus-ds/`
- Storybook configuration and stories: `.storybook/`, `packages/plus-ds/src/**/*.stories.jsx`
- Agent instruction system: `.agent/`
- Prototyping workspace: `playground/`

## Quick Start

```bash
npm install
npm run dev
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

## Agent Skills

This repo includes agent skills that any AI coding assistant can follow. Read `.agent/AGENT.md` for full context, or reference individual skills directly:

| Skill | File | Purpose |
|-------|------|---------|
| Learn PLUS | `.agent/skills/learn-plus/SKILL.md` | Answers questions about the design system |
| Design Consulting | `.agent/skills/design-consulting/SKILL.md` | Brainstorming and planning before coding |
| Building | `.agent/skills/building/SKILL.md` | Creates prototypes and components from designs or sketches |
| Maintaining | `.agent/skills/maintaining/SKILL.md` | Updates, fixes, and syncs existing code with Figma |
| Submit to Market | `.agent/skills/submit-to-market/SKILL.md` | Guides submission of a prototype to the Prototype Market (`/market`) |

To use with **Claude Code**, point it to `.agent/AGENT.md` or the specific skill file. For **Cursor**, skills are auto-discovered. For other tools, paste the relevant SKILL.md content into your prompt.

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
npm run storybook
npm run build
npm run build-storybook
npm run preview:react
npm run sync:tokens
npm run generate:tokens
```

## Agent Workflow

For AI coding agents:

1. Read `.agent/AGENT.md`
2. Route through `.agent/SKILL.md`
3. Select one mode:
   - `learning`
   - `maintaining`
   - `consulting`
   - `iteration`
   - `finalization`

Core references:

- `.agent/references/index.md`
- `.agent/references/tokens-guide.md`
- `.agent/references/components-guide.md`
- `.agent/references/patterns-guide.md`

### For Designers: When to Start a New Chat

To prevent the AI agent from getting confused or forgetting its instructions (token bloat), start a **new chat window** in these scenarios:

1. **Major Phase Shifts:** When moving from messy exploration (consulting/iteration) to strict execution (finalization).
2. **Context Window Degradation:** If the agent starts hallucinating component names or ignoring rules like the PLUS Cheat Sheet.
3. **Task Switching:** When you finish one feature/bug and move to an entirely unrelated one.
4. **Codebase State Desync:** If you manually refactor a lot of code yourself, or the agent gets stuck in a "death loop" trying to fix the same bug repeatedly.

## Design System Guidance

Primary DS documentation is under:

- `packages/plus-ds/guidelines/overview-components.md`
- `packages/plus-ds/guidelines/design-tokens/`
- `packages/plus-ds/guidelines/guides/figma-workflow.md`
- `packages/plus-ds/guidelines/guides/Storybook.md`

## Prototyping

- Use `playground/templates/` for reusable starts.
- Use `playground/prototyping/` for designer/feature experiments.
- Keep implementation tokenized and aligned with DS component usage.

## Notes

- This repo uses Vite + Storybook; outdated CSS-watch/server workflows are removed.
- Keep instruction docs centralized in `.agent/`.
