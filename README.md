# PLUS Vibe Coding Starting Kit

## 🚨 FOR AI AGENTS (READ FIRST) 🚨

AI Agents must IMMEDIATELY load and follow the instructions in:
**`.agent/SKILL.md`**

Refer to **`.agent/AGENT.md`** for identity, skills, and grounding rules as needed.
Go there now. Do not guess implementation.

Starter workspace for PLUS design-system prototyping and implementation.

## What This Repo Contains

- Design system package source: `design-system/`
- Storybook configuration and stories: `.storybook/`, `design-system/src/**/*.stories.jsx`
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

See `design-system/guidelines/overview-components.md` for component details and `develop/PROJECT_STRUCTURE.md` for complete project organization.

## Documentation

### Essential Guidelines (Always Reference)
- **[Coding Standards](develop/standards.md)** - Project rules, coding standards, setup guides, best practices
- **[Token Reference](design-system/guidelines/design-tokens/)** - Complete token reference
- **[Component Terminology](design-system/guidelines/overview-components.md)** - UI component types and terminology
- **[Import Paths](develop/imports.md)** - Component import path reference (see `design-system`)
 
 ### Additional Documentation
- **[Components](design-system/guidelines/overview-components.md)** - Component library documentation
- **[Styles Overview](design-system/guidelines/design-tokens/)** - Design token system overview
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

Platform-specific pointer files route each agent into `.agent/SKILL.md`:

| Platform | File |
|----------|------|
| Cursor | `.cursor/rules/plus-agent.mdc` (always-apply rule) |
| Cursor (legacy) | `cursorrules.md` |
| Claude Code | `CLAUDE.md` |
| Windsurf | `.windsurfrules` |

For other tools, paste the relevant SKILL.md content into your prompt. See `.agent/references/platform-integration.md` for details.

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

### Agent Integration
- Platform pointer files: `.cursor/rules/plus-agent.mdc`, `CLAUDE.md`, `.windsurfrules`, `cursorrules.md`
- Centralized agent system in `.agent/` with skills, references, and assets
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

1. Read `.agent/SKILL.md` (mode routing and guardrails)
2. Refer to `.agent/AGENT.md` as needed (identity, skills, grounding rules)
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

- `design-system/guidelines/overview-components.md`
- `design-system/guidelines/design-tokens/`
- `design-system/guidelines/guides/figma-workflow.md`
- `design-system/guidelines/guides/Storybook.md`

## Prototyping

- Use `playground/templates/` for reusable starts.
- Use `playground/prototyping/` for designer/feature experiments.
- Keep implementation tokenized and aligned with DS component usage.

## Notes

- This repo uses Vite + Storybook; outdated CSS-watch/server workflows are removed.
- Keep instruction docs centralized in `.agent/`.
