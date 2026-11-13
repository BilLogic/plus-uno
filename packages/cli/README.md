# @plus-uno/cli

The PLUS design system from a shell, over a snapshot baked into the package.

```sh
npx @plus-uno/cli find Button
npx @plus-uno/cli get Button --section props
npx @plus-uno/cli tokens pad
npx @plus-uno/cli guide
npx @plus-uno/cli add Button
npx @plus-uno/cli check src
```

## Add

`add <item…>` copies registry items into your project, with the items they depend on and their npm dependencies, no shadcn needed. `find` names the item to add (`Add to a project: ds add Button`); `foundation` is the tokens, global styles and shared helpers every component needs, and a component brings it. Files land under `src/plus-ds/` (`plus-ds/` when the project has no `src`; `--dir <folder>` chooses the parent), keeping the design system's own folder shape, so every import between them is relative and no alias is needed. New npm dependencies, including `sass`, are added to `package.json` and installed with the project's package manager (`--no-install` skips the install). A file you have edited is a conflict: it is left alone and the exit is `1`, until `--overwrite` replaces it. Then load `plus-ds/styles/main.scss` once at your entry and paste `plus-ds/head.html` (fonts, Font Awesome Free) into your HTML head. `check` skips the copied `plus-ds/` folder: it is the design system's source, not your code.

## Check

`check [paths…]` holds your project's files to the design system: a raw color, a Font Awesome Pro icon, an unknown prop or token. The rules come from the baked snapshot; the files come from the working directory (`.` when no path is given, `node_modules`, `dist`, `build` and dot folders skipped), so it runs in your own CI. Exit `0` when no file has a fail-level escape, `1` when one does, `2` when there is nothing to check (a missing path, or no files under the directory); warnings print and never fail. `--json` prints the findings as data, and `--code '<jsx>' [--path f.jsx]` checks a snippet.

## MCP server

`mcp` serves the same lookup as the five `ds_*` tools over stdio, from the same snapshot. An MCP config reads:

```json
{ "mcpServers": { "plus-ds": { "command": "npx", "args": ["-y", "@plus-uno/cli", "mcp"] } } }
```

`ds_check` checks code you pass it; it does not read files from disk.

The package name lives in `src/constants.mjs`. `dist/` is built by `prepack` (`scripts/build-cli-package.mjs`) and holds the lookup source plus the facts the hosted `/mcp/ds` serves; `snapshot-budget.json` caps its size.
