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

The lookup stays only if the usage eval's `current+lookup` arm cuts input tokens by 20% or turns by 3 at zero escapes, on two models; otherwise both adapters are deleted. Its only package is `@modelcontextprotocol/sdk`, which the harness CI job installs in its own scoped step from the root lock (`scripts/lock-closure.mjs --lock`), so the spawn test in `test:scripts` runs there too.
