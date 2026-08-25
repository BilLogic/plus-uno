---
embodiment: ide
summary: The Storybook MCP endpoint — the primary interface to the design system while Storybook runs, plus the story-authoring conventions that keep it useful.
---

# Storybook MCP

<!-- Tier: 2 (on demand) · load before authoring stories or verifying component API. -->

`@storybook/addon-mcp` serves an MCP endpoint at **http://localhost:4200/mcp**
while `npm run storybook` runs, registered in `.mcp.json` as `storybook`. Use it
as the primary interface to the design system — it answers from the built story
index, so it is both faster and more accurate than grepping stories.

| Tool | Use it for |
|---|---|
| `list-all-documentation` | inventory of docs pages |
| `get-documentation` / `get-documentation-for-story` | component API + usage — verify props here rather than inferring them |
| `get-storybook-story-instructions` | call before authoring any new story, and follow it over generic CSF habits |
| `run-story-tests` | run the vitest browser tests for stories you touched (addon-vitest is wired; a11y checks via addon-a11y) |

## Story-authoring conventions

Written for agent-readability, per storybook.js.org/docs/ai/best-practices:

- One concept per story, each with a "why" description.
- JSDoc on component exports and per-prop descriptions — react-docgen extracts them into the generated docs.
- Explicit MDX content; manifest generation is static, so external imports produce empty docs.
- Tag anti-pattern and deprecated stories `!manifest` to keep them out of agent context.

## Related

- `overview.md` — the connector index
- `design-system/guidelines/documentation-ia.md` — the docs tree the endpoint serves
