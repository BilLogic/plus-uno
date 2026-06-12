<!-- Tier: 2 -->
---
domain: integration
type: lesson
confidence: high
created: 2026-04-11
tags: [storybook, netlify, figma, iframe, mdx]
---

## [2026-03-23] Storybook MDX autodocs conflict after branch merge

- **Pattern**: After merging a branch with 47 new MDX files, Storybook build failed with "You created a component docs page for 'Forms/Input', but also tagged the CSF file with 'autodocs'." Input.mdx and Select.mdx also referenced story exports (`Content`, `Styles`, `Sizes`, `InteractionStates`) that did not exist, causing `of={undefined}` runtime errors.
- **Fix**: Changed `tags: ['autodocs']` to `tags: ['!dev']` in Input.stories.jsx and Select.stories.jsx. Replaced broken `<Canvas of={...}>` blocks in MDX with inline `DocsDemoBlock` components. Rule: when merging branches that add MDX docs, always check for `autodocs` tags in corresponding stories files. Always use `DocsCanvasShell` + `<Canvas of={...}>` pattern, never render components inline in MDX.
- **Source**: _archive/solutions/integration-issues/2026-03-23-storybook-mdx-autodocs-conflict-and-netlify-spa-static-coexistence.md

## [2026-03-23] Netlify SPA catch-all redirect blocks Storybook static files

- **Pattern**: Deployed Storybook at `/storybook/` returned the React SPA's `index.html` instead of Storybook's own files. Netlify processes redirects in order, and the `/* -> /index.html` catch-all matched `/storybook/*` first.
- **Fix**: Added a passthrough redirect BEFORE the SPA catch-all: `from = "/storybook/*"` to `"/storybook/:splat"` with `status = 200`. Also set `VITE_STORYBOOK_URL` in `[build.environment]` so FAB nav and StorybookEmbed components link to the correct URL in production. Rule: Netlify redirect ordering matters -- specific paths must come before catch-alls.
- **Source**: _archive/solutions/integration-issues/2026-03-23-storybook-mdx-autodocs-conflict-and-netlify-spa-static-coexistence.md

## [2026-03-22] Iframe embedding over proxy for Storybook integration

- **Pattern**: Tried three approaches to integrate Storybook under the main Vite app: (1) Vite proxy `/storybook/*` to localhost:6006 -- failed because Storybook assets load at root paths (`/sb-manager/`, `/sb-addons/`) bypassing the prefix proxy. (2) Direct port links -- different origins lose navigation context. (3) Shell backgrounding with `&` -- macOS sandbox breaks it with `getcwd: cannot access parent directories`.
- **Fix**: Used iframe embedding: full-screen `<iframe src="http://localhost:4200">` at the `/storybook` route, with `concurrently` running both Vite (4100) and Storybook (4200). URL bar shows unified `localhost:4100/storybook`. Use uncommon ports (4100+) to avoid conflicts with common dev servers.
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## [2026-03-25] Figma MCP requires desktop app with node selected for key operations

- **Pattern**: `get_design_context` and `get_variable_defs` require the Figma desktop app to be open with the target node selected. `get_screenshot` works from the cloud API alone. This was discovered during the Session Controls implementation plan and directly affects the Figma-to-code workflow.
- **Fix**: Documented as a known limitation in the Figma MCP guide. When planning Figma MCP workflows, always account for the desktop app requirement. Use `get_screenshot` for initial reconnaissance (works without desktop), then switch to desktop-dependent tools for detailed extraction.
- **Source**: docs/plans/2026-03-25-001-feat-session-controls-consolidation-plan.md
