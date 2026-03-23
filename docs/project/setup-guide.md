# Setup Guide

Getting started with plus-uno for new team members and coding agents.

## Quick Start

```bash
# Clone and install
git clone https://github.com/BilLogic/plus-uno.git
cd plus-vibe-coding-starting-kit
npm install

# Start dev servers
npm run storybook    # Component library on port 6006
npm run dev          # Vite app on port 3000
```

## Recommended Compound Engineering Skills

Install these CE skills for the best workflow. They integrate with the plus-uno agent system:

| Skill | Command | Purpose |
|-------|---------|---------|
| Plan | `/ce:plan` | Create structured implementation plans in `docs/plans/` |
| Work | `/ce:work` | Execute plans with task tracking and quality gates |
| Review | `/ce:review` | Multi-agent code review before shipping |
| Brainstorm | `/ce:brainstorm` | Explore requirements through collaborative dialogue |
| Compound | `/ce:compound` | Document learnings in `docs/solutions/` |
| Ideate | `/ce:ideate` | Generate improvement ideas for the project |

## MCP Server Setup

These MCP servers enhance the agent workflow:

### Figma MCP (Required for design work)
Provides `get_design_context`, `get_screenshot`, `get_variable_defs` for design-to-code workflows.

**Setup**: Add Figma API credentials to `.env`:
```
FIGMA_FILE_KEY=<your-figma-file-key>
FIGMA_ACCESS_TOKEN=<your-figma-access-token>
```

### Stitch MCP (Optional — for wireframe generation)
Used in Consulting and Iteration modes for rapid wireframe generation from briefs.

### Playwright MCP (Optional — for browser testing)
Browser automation for testing prototypes and capturing screenshots.

### Notion MCP (Optional — for product context)
Access Product HQ roadmap, PRDs, and meeting notes directly from the agent.

## Platform Configuration

### Claude Code
`CLAUDE.md` at project root imports `@AGENTS.md`. No additional setup needed — Claude Code auto-loads it.

### Cursor
`.cursor/rules/plus-agent.mdc` (always-apply rule) points to `AGENTS.md`. Committed and shared with team.
Legacy fallback: `cursorrules.md` at root.

### Windsurf
`.windsurfrules` at project root points to `AGENTS.md`.

### Other Agents
Point the agent's instruction file to `AGENTS.md` at the project root. See `docs/design-system/platform-integration.md` for details.

## Project Structure

See `docs/project/plus-uno.md` for the full directory layout and tech stack.

## Key Files for Agents

| File | When to Load |
|------|-------------|
| `AGENTS.md` | Always (auto-loaded) |
| `.agent/SKILL.md` | Design system work (mode routing) |
| `.agent/AGENT.md` | Identity, skills table, grounding rules |
| `.agent/assets/PLUS_CHEAT_SHEET.md` | Before writing any UI code (MANDATORY) |
| `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` | Before building pages (MANDATORY) |
| `docs/project/plus-app.md` | Understanding the PLUS product |
| `docs/project/conventions.md` | File naming, imports, gotchas |
