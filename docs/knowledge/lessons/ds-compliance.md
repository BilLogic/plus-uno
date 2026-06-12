<!-- Tier: 2 -->
---
domain: ds-compliance
type: lesson
confidence: high
created: 2026-04-11
tags: [tokens, review, forbidden-patterns, figma, naming]
---

## [2026-03-22] Forbidden patterns enforcement via AGENTS.md

- **Pattern**: Platform-specific agent files (CLAUDE.md, .windsurfrules, cursorrules.md) pointed directly to `.agent/SKILL.md`, which only covered DS routing. Non-DS tasks had zero forbidden-pattern coverage. Agents could hardcode colors, skip cheat-sheet reads, or use FA Pro icons without warning.
- **Fix**: Created AGENTS.md as THE single cross-agent entry point with 15 inline forbidden patterns. All platform files now point to AGENTS.md. Forbidden patterns are enforced regardless of which agent or which task.
- **Source**: _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md

## [2026-03-25] Token drift between Figma and code goes undetected

- **Pattern**: 6 semantic token values in code silently drifted from Figma source of truth. `--size-card-gap-lg` was 32px in code but 20px in Figma -- a 60% gap. CSS custom properties fail silently when undefined, so ghost tokens (old naming convention) produced no errors, just wrong spacing across 7+ files.
- **Fix**: Used Figma MCP `get_variable_defs` to pull authoritative values and built a comparison table. Fixed 6 drift values at the semantic layer. Grepped entire codebase for old naming patterns (`--size-spacing-between-components-*`, `--size-spacing-within-component-*`) and migrated all 11+ references to the current semantic token names.
- **Source**: _archive/solutions/integration-issues/design-system-token-audit-figma-code-drift.md

## [2026-03-25] Token sync workflow requires Figma MCP spot-checks

- **Pattern**: Tokens were manually transcribed from Figma with no automated verification. After Figma variable updates, code was not synced. Storybook docs pages had hardcoded display values that also drifted from actual computed values.
- **Fix**: Established workflow: use `get_variable_defs` MCP during design reviews, maintain a single authoritative token manifest, add token audit to sprint checklist after any Figma variable update. Never hardcode token values in MDX or story files -- build token tables from a shared manifest.
- **Source**: _archive/solutions/integration-issues/design-system-token-audit-figma-code-drift.md

## [2026-03-23] Demo frame dimensions must match shell assumed layout

- **Pattern**: `--demo-frame-width` was set to 1200px but the shell's internal layout assumed 1280px (sidebar 184px + content + padding). The 80px shortfall caused content to overflow the frame's `overflow-x: hidden`, pushing the main content area off-viewport.
- **Fix**: Changed `--demo-frame-width` to 1280px to match the shell. Also fixed PageLayout component: `flex: '1 0 0'` changed to `flex: '1 1 0'` with `minHeight: 0` on both wrapper and main, plus proper overflow constraints (`hidden` on wrapper, `auto` on main).
- **Source**: _archive/solutions/ui-bugs/2026-03-23-demo-frame-css-overflow-shell-layout.md

## [2026-03-22] File naming uses 4-digit numeric IDs, not slugs

- **Pattern**: Marketplace prototype listings initially used string slugs for routing, which caused naming collisions and awkward URL paths. Creator-based directory grouping (`playground/{owner}/{name}/`) also caused collisions (both bill and victor had `sessions/`).
- **Fix**: Adopted 4-digit numeric IDs (1001-1025) for all prototype listings. Clean URLs, no naming collisions. Flattened playground to project-oriented structure (`playground/{name}/`) with creator info as metadata, not directory structure.
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md
