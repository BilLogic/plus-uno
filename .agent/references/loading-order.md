<!-- Load for: understanding which files to load when, progressive loading strategy, context budget -->

# Reference Loading Order

Load files in this order, stopping as soon as you have enough context.

| Layer | File(s) | ~Tokens | When to load |
|-------|---------|---------|--------------|
| Mode logic | `docs/design-system/modes/{selected-mode}.md` | 500-900 | Always — first thing after routing |
| Cheat Sheet | `.agent/assets/PLUS_CHEAT_SHEET.md` | 500 | MANDATORY when writing UI code, using components, or applying tokens. |
| Layout Cheat Sheet | `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` | 300 | MANDATORY when building new pages, dashboards, or modals. |
| Foundations | `../docs/design-system/overview.md` | 150 | Before implementation work |
| Tokens | `../docs/design-system/tokens.md` | 350 | For advanced token architecture (use Cheat Sheet for daily use) |
| Figma MCP | `references/figma-mcp-guide.md` | 400 | When Figma link provided or implement-design workflow |
| Integrations | `../docs/design-system/integrations.md` | 120 | When deciding which MCP/integration path to use |
| Components | `../docs/design-system/components.md` | 140 | When selecting DS components |
| Implementation | `../docs/design-system/guides/implementation.md` | 200 | When choosing implementation approach or example |
| JSON indexes | `assets/*.json` | 150-500 each | Only for exhaustive path/glob lookup |
| Runbooks | `../docs/design-system/guides/local-preview.md` | 180 | When building or previewing |
| Maintenance | `../docs/design-system/maintenance/runbook.md`, `../docs/design-system/maintenance/scripts.md`, `../docs/design-system/maintenance/sync-checklist.md` | 300-350 each | When maintaining agent docs |

**Typical task budget:** ~2,000-2,500 tokens (mode + 2-3 guides).
**Worst-case full load:** ~5,500 tokens (all files). Avoid this.

# Loading Triggers

Load additional references reactively based on what comes up in conversation:

| Trigger | Load |
|---------|------|
| User asks to build UI, or mentions tokens, colors, spacing, components, or UI | `.agent/assets/PLUS_CHEAT_SHEET.md` |
| User asks to build a new page, screen, dashboard, or layout | `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` |
| User provides a Figma link or mentions MCP tools | `references/figma-mcp-guide.md` (PRIMARY), then `../docs/design-system/integrations.md` if routing needed |
| User explicitly asks for component architecture rules | `../docs/design-system/components.md` |
| User asks about build, preview, or deployment | `../docs/design-system/guides/local-preview.md` |
| Agent needs exact file paths, globs, or env vars | Relevant `assets/*-index.json` |
| User asks about repo scripts or token sync | `../docs/design-system/maintenance/scripts.md` |
| Agent is checking for stale docs or maintaining `.agent/` | `../docs/design-system/maintenance/sync-checklist.md` |

# Progressive Loading Rule

- Keep context lean: load the selected mode file first, then only the specific reference files needed for that task.
- Do not bulk-load all files in `references/` unless explicitly requested.
- Load `assets/*.json` only when you need exhaustive lookup data (paths, globs, commands, env vars).
- Once a reference is loaded in the current session, do not re-read it. Treat it as active context for the remainder of the task.
- After mode selection, references from other modes are irrelevant — do not retain or load them.
