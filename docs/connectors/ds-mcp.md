---
embodiment: ide
summary: The design-system lookup — the `ds` command and the local `plus-ds` MCP, five tools over the DS facts module, run from the checkout.
---

# Design-system lookup: `ds` and the `plus-ds` MCP

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-11-07 · load to look up a PLUS name, prop, token, guideline or rule without reading files. -->

One lookup with two doors. `npm run ds -- <tool> …` answers in a shell; the `plus-ds` MCP server answers the same five tools over stdio. It is registered in `.mcp.json` beside `storybook`, so Claude Code and Cursor start it on demand from the checkout, and it always matches the branch being edited. Both are thin adapters on `scripts/lib/ds-lookup.mjs`, which reads the DS facts module (`scripts/lib/ds-facts.mjs`); uno-bot reads the same facts baked into its bundle, so Slack and the IDE give one answer.

## The order

Start with `ds_find`, finish with `ds_check`. Each answer ends with the tool to call next, and a miss names the tool to call instead.

| Tool | `ds` subcommand | Returns |
|---|---|---|
| `ds_find(query)` | `find <query…>` | Ranked matches for a task in words, a name or an alias: patterns, components, tokens, Font Awesome Free icons. Figma component names resolve to their code name; a not-here name (`Alert`, `Card`, a Pro icon) arrives with its replacement. |
| `ds_get(names, section?)` | `get <Name…> [--section s]` | Full records: import line and props with values (facts), usage, correct and incorrect examples, accessibility (the component's Storybook page), Figma mapping (`design-system/figma/component-registry.json`). `section` is `props`, `usage`, `examples`, `a11y` or `figma`. A retired name returns its replacement. |
| `ds_tokens(role)` | `tokens <role>` | The steps for a role, each with tier, value and intent. Primitives are left out. |
| `ds_guide(topic?)` | `guide [topic \| rule id]` | A guideline under `design-system/guidelines/`, or a rule's section of `docs/engineering/ds-usage-rules.md`. With no argument, the orientation the server sends at connection. |
| `ds_check(code \| paths)` | `check <paths…>` or `check --code '<jsx>' [--path f.jsx]` | `check:ds-usage`, in-process: each escape with its rule id, line and fix. |

`--json` prints any answer as data. `ds check` exits 1 on a fail-level escape.

## Keeping it

The lookup stays while the usage eval's `lookup` arm leaves fewer fail-level escapes than `current`, or, at zero escapes on both sides, cuts input tokens by 20% or turns by 3; when `node scripts/eval-ds-usage.mjs compare` reads delete on any model, both adapters are deleted (`docs/evals/ds-usage.md` § Does the lookup pay off?). It was kept on 2026-11-07: 0 escapes against 17, at 10% more input. Its only package is `@modelcontextprotocol/sdk`, which the harness CI job installs in its own scoped step from the root lock (`scripts/lock-closure.mjs --lock`), so the spawn test in `test:scripts` runs there too.

## Hosted

For people without the checkout, the same five tools are served over HTTPS by the Netlify function `netlify/functions/ds-mcp`, at `/mcp/ds` on the site (`https://plus-uno.netlify.app/mcp/ds`). It is `scripts/lib/ds-mcp-server.mjs` on the SDK's Streamable HTTP transport, stateless: every request is answered on its own, with no session.

- **It serves the released design system.** The function bundles the facts, guidelines and Storybook pages from the same commit the Storybook of that deploy is built from, and production deploys only on a release, so a client of the production URL sees the released system and a deploy preview serves its own branch.
- **Read-only, behind a shared key.** Send the key as `Authorization: Bearer <key>` or as `x-ds-mcp-key: <key>`. A request without the right key gets 401, and so does every request while the key is not set. The key is the Netlify environment variable `DS_MCP_KEY` (`docs/engineering/setup.md`); ask the design-system owner for it. It is a team key, not a credential for anything else.
- **`ds_check` takes code only.** The hosted server has no files of yours, so `paths` is not offered and a call that passes it is refused with a message saying so. Pass `code` and the `path` it would have (for its language and page rules). To check files, run the local server or `npm run check:ds-usage`.

Add it to an MCP client (Claude Code reads `.mcp.json`; Cursor reads `.cursor/mcp.json`) with the key from an environment variable rather than written into the file:

```json
{
  "mcpServers": {
    "plus-ds-hosted": {
      "type": "http",
      "url": "https://plus-uno.netlify.app/mcp/ds",
      "headers": { "Authorization": "Bearer ${DS_MCP_KEY}" }
    }
  }
}
```

In the checkout, keep using the local `plus-ds`: it matches the branch being edited, and the hosted copy does not.
