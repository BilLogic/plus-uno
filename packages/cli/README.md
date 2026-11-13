# @plus-uno/cli

The PLUS design system from a shell, over a snapshot baked into the package.

```sh
npx @plus-uno/cli find Button
npx @plus-uno/cli get Button --section props
npx @plus-uno/cli tokens pad
npx @plus-uno/cli guide
```

The package name lives in `src/constants.mjs`. `dist/` is built by `prepack` (`scripts/build-cli-package.mjs`) and holds the lookup source plus the facts the hosted `/mcp/ds` serves; `snapshot-budget.json` caps its size.
