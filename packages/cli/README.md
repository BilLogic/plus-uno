# @plus-uno/cli

The PLUS design system from a shell, over a snapshot baked into the package.

```sh
npx @plus-uno/cli find Button
npx @plus-uno/cli get Button --section props
npx @plus-uno/cli tokens pad
npx @plus-uno/cli guide
npx @plus-uno/cli check src
```

## Check

`check [paths…]` holds your project's files to the design system: a raw color, a Font Awesome Pro icon, an unknown prop or token. The rules come from the baked snapshot; the files come from the working directory (`.` when no path is given, `node_modules`, `dist`, `build` and dot folders skipped), so it runs in your own CI. Exit `0` when no file has a fail-level escape, `1` when one does or a path does not exist; warnings print and never fail. `--json` prints the findings as data, and `--code '<jsx>' [--path f.jsx]` checks a snippet.

## MCP server

`mcp` serves the same lookup as the five `ds_*` tools over stdio, from the same snapshot. An MCP config reads:

```json
{ "mcpServers": { "plus-ds": { "command": "npx", "args": ["-y", "@plus-uno/cli", "mcp"] } } }
```

`ds_check` checks code you pass it; it does not read files from disk.

The package name lives in `src/constants.mjs`. `dist/` is built by `prepack` (`scripts/build-cli-package.mjs`) and holds the lookup source plus the facts the hosted `/mcp/ds` serves; `snapshot-budget.json` caps its size.
