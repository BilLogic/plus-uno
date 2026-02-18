<!-- ~750 tokens | Load for: modifying DS source, tokens, components, or docs -->

# Maintaining Mode Reference

## Contents
- When to Use This Mode
- User Persona
- Resources to Reference
- How to Respond in Maintaining Mode
- Confirmation Template (Before Editing)
- Detailed Workflows

## When to Use This Mode
- Adding or updating design-system components in `packages/plus-ds/src`.
- Updating component APIs, stories, styles, or exports.
- Syncing design tokens from Figma and regenerating token SCSS.
- Updating DS documentation and integration workflows.

### Decision Tree
- If task changes DS source/docs/scripts: use Maintaining Mode.
- If task is only feature implementation in app/playground: use Finalization or Iteration mode.
- If user only wants explanation: use Learning Mode.

## User Persona
- Design system maintainers and contributors
- People with write access to DS package and token pipeline
- Not product developers building isolated feature screens

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `.agent/assets/index-manifest.json` and the relevant index file(s).

1. Token sync and generation
- `scripts/sync-figma-tokens.js`
- `scripts/generate-all-tokens.js`
- `package.json` scripts `sync:tokens`, `generate:tokens`
- `.github/workflows/sync-figma-tokens.yml`

2. Component creation/update patterns
- `packages/plus-ds/src/components/*`
- `packages/plus-ds/src/forms/*`
- `packages/plus-ds/src/specs/*`
- Existing `*.stories.jsx` colocation patterns

3. Documentation patterns
- `packages/plus-ds/guidelines/*`
- `packages/plus-ds/guidelines/guides/Storybook.md`
- `packages/plus-ds/guidelines/guides/figma-workflow.md`

4. Integration setup
- Storybook configuration: `.storybook/main.js`, `.storybook/preview.jsx`
- Package exports: `packages/plus-ds/src/index.js`, `packages/plus-ds/package.json`

## How to Respond in Maintaining Mode

1. Syncing Design Tokens
- Confirm env vars (`FIGMA_FILE_KEY`, `FIGMA_ACCESS_TOKEN`).
- Run token sync, then generation.
- Review generated files under `packages/plus-ds/src/tokens/`.
- Validate token naming and semantic mapping; avoid introducing hardcoded fallback drift.

2. Adding New Components
- Identify nearest component pattern in `packages/plus-ds/src/components` or `forms`.
- Create component, SCSS, story, and export updates.
- Follow existing prop naming conventions (`style`, `fill`, size props, etc.).
- Verify via Storybook.

3. Updating Documentation
- Update guideline files near impacted domain.
- Keep examples aligned with actual exports and props.
- Remove stale references to moved paths.

4. Managing Integrations
- For design links, follow Figma workflow and mappings first.
- If mapping metadata exists, use it before manual translation.
- Keep script docs aligned with actual commands and file outputs.

## Confirmation Template (Before Editing)

Before editing code, summarize impact explicitly:

```text
I will update [component/file] with:

Current state:
- ...

Proposed changes:
- ...
- ...

Files to modify:
- path/to/file-a
- path/to/file-b
```

Use this confirmation step for API changes, token changes, spec-level updates, and cross-file refactors.

## Detailed Workflows

### Workflow A: Token Sync and Regeneration
1. Confirm `.env` values for Figma API.
2. Run `npm run sync:tokens`.
3. Run `npm run generate:tokens`.
4. Inspect `packages/plus-ds/src/tokens/*.scss` changes.
5. Run Storybook and inspect token-dependent stories.
6. Update docs if naming/values changed.

### Workflow B: Component API Update
1. Read component source, story, and SCSS.
2. Update component API and usage.
3. Update co-located stories for controls and examples.
4. Update exports (`components/index.js` or `forms/index.js`) if needed.
5. Validate stories and any affected specs.

### Workflow C: Figma-to-DS Maintenance Sync
1. Fetch design context + screenshot first.
2. Diff against existing implementation.
3. Update tokens/components/specs selectively.
4. Verify states, responsiveness, and documentation.
