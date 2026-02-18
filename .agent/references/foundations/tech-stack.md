# Tech Stack Reference

## Runtime and Tooling

- React `19.2.1`
- React DOM `19.2.1`
- React-Bootstrap `2.10.10`
- Bootstrap `5.3.3`
- Vite `~6.4.1`
- Storybook `10.x`
- Sass `1.77.8`
- Highcharts `12.4.x`
- TypeScript `5.9.x`

## Canonical Commands (From package.json)

```bash
npm run dev              # Vite dev server
npm run storybook        # Storybook at 127.0.0.1:6006
npm run build            # Production app build (Vite)
npm run build-storybook  # Static Storybook build into dist/storybook
npm run build:all        # build + build-storybook
npm run preview:react    # Preview built app
npm run sync:tokens      # Pull token data from Figma API
npm run generate:tokens  # Generate token SCSS files
```

## Key Paths

- Agent system: `.agent/`
- Design system source: `packages/plus-ds/src/`
- Design system docs: `packages/plus-ds/guidelines/`
- Storybook config: `.storybook/`
- Token automation scripts: `scripts/`
- Prototyping workspace: `playground/prototyping/`

## Notes

1. Use `@` alias to `packages/plus-ds/src` where configured.
2. Prefer design-system components over raw framework primitives for DS work.
3. Keep documentation command examples synchronized with `package.json`.
