# PLUS Design System — Documentation

Single home for design-system knowledge (Option A). Agents and designers start here.

## Layout

| Path | Type | Purpose |
|------|------|---------|
| `discovery.md` | Hand-authored | Agent router — load first for DS tasks |
| `guidelines.md` | Hand-authored | Design and implementation philosophy |
| `setup.md` | Hand-authored | Aliases, playground, Vite, imports |
| `patterns/` | Hand-authored | Cross-component composition (layout, forms) |
| `foundations/token-mapping.md` | Hand-authored | Figma ↔ CSS token mapping (SSOT) |
| `knowledge-audit.json` | Hand-authored | Designer verification status |
| `../agent-views/` | **Generated** | Agent component/token views — do not edit by hand |
| `../figma/` | Mixed | Registries (generated) + alignment runbooks |

## Designer workflow (one command)

After editing component MDX (`figmaMeta`, usage frontmatter) or `foundations/token-mapping.md`:

```bash
npm run generate:agent
```

This refreshes `agent-views/`, Figma registries, and `figma/knowledge-audit.md`.

## Agent entry

`design-system/docs/discovery.md`
