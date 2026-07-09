<!-- ~100 tokens | Index only — load figma-mcp-guide.md for the full implement-design workflow -->

# Figma Workflow — Index

Do not duplicate content here. Route to the canonical doc for each need:

| Need | Load |
|------|------|
| Implement from a Figma link (7 steps, MCP tools) | `figma-mcp-guide.md` |
| Registry load gate (before JSX/SCSS) | `figma-registry-mandatory-load.md` |
| Figma ↔ CSS token tables (authoritative) | `design-system/docs/foundations/token-mapping.md` |
| Token name lists | `design-system/agent-views/foundations/tokens.md` |
| Component ↔ Figma registry | `design-system/figma/component-registry.json` |
| Implement + write-back rules | `design-system/figma/component-alignment.md` |

## Token sync (repo maintenance)

```bash
npm run sync:tokens && npm run generate:tokens
```

Requires Figma API credentials — see `docs/setup-guide.md`.

## Human team pipeline

Slack notifications, Notion PRD, draft PR workflow: `docs/figma-sync-workflow.md`
