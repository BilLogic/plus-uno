---
embodiment: ide
summary: The Storybook MCP endpoint, served only while Storybook runs on 4200 — when to start it, its tools, and the story-authoring conventions that keep it useful.
---

# Storybook MCP

<!-- Tier: 2 (on demand) · load before authoring stories or verifying component API. -->

`@storybook/addon-mcp` serves an MCP endpoint at **http://localhost:4200/mcp**,
registered in `.mcp.json` as `storybook`. Storybook itself serves it, so it
answers only while Storybook runs on 4200; otherwise the client reports a
refused connection.

**Look up with `plus-ds`, run Storybook for the rest.** Names, props, tokens,
guidelines and usage checks come from the `plus-ds` MCP (`ds-mcp.md`), which
runs from the checkout with no server. Start Storybook on demand for the tools
only it has (story instructions, story ids, previews, tests): in the desktop
app `preview_start {name: "storybook"}`, in a shell `npm run storybook`, then
reconnect the `storybook` MCP. Stop it when the task is done.
A worktree's Storybook on another port serves the same endpoint at
`http://localhost:<port>/mcp`; a CLI run or a second session calls it there with
JSON-RPC (`tools/list`, `tools/call`). Work that adds or changes stories calls
`get-storybook-story-instructions` before writing and `test-run` before its PR,
on the stories `stories-find-by-component` returns for the files the branch
changed. `stories-changed` only sees edits made while that server runs.

| Tool | Use it for |
|---|---|
| `docs-list` | the ids of every component and docs page |
| `docs-show` / `docs-show-story` | a page's API and usage, or one story's code: verify props here when `plus-ds` leaves a doubt |
| `get-storybook-story-instructions` | call before authoring a story, and follow it over generic CSF habits |
| `stories-find-by-component` | the story ids that render a component file |
| `stories-changed` / `stories-preview` | the stories a change touched, and their preview URLs |
| `test-run` | the vitest browser tests for the stories you touched (a11y through addon-a11y) |

## Story-authoring conventions

Written for agent-readability, per storybook.js.org/docs/ai/best-practices:

- One concept per story, each with a "why" description.
- JSDoc on component exports and per-prop descriptions — react-docgen extracts them into the generated docs.
- Explicit MDX content; manifest generation is static, so external imports produce empty docs.
- A Templates or Patterns docs page carries `tags={['!dev', 'manifest']}`: `docs-show` serves a docs page only with the `manifest` tag, and `npm run generate:docs-agent-files` fails without it. Its generated agent file is `design-system/agent-views/<templates|patterns|foundations>/<Name>.md`. The six Foundations › Expression › Motion pages carry the same tag in their stories file or `<Meta>`, and a component's motion row reaches `docs-show` as the Motion section of its own page.
- Tag anti-pattern and deprecated stories `!manifest` to keep them out of agent context.

## Related

- `overview.md` — the connector index
- `design-system/guidelines/documentation-ia.md` — the docs tree the endpoint serves
