---
embodiment: ide
summary: Review checklist for Storybook stories and argTypes — points to documentation-ia.md and storybook-mcp.md
---

# Storybook Story Review Checklist

See also [`storybook-component-docs.md`](storybook-component-docs.md) for the
MDX page review checklist. Story-authoring rules live in
[`docs/connectors/storybook-mcp.md`](../../../docs/connectors/storybook-mcp.md)
and the tree / page contract in
[`design-system/guidelines/documentation-ia.md`](../../../design-system/guidelines/documentation-ia.md).

## What to check in `*.stories.jsx`

- **Sidebar title & paired MDX:** `title` matches the taxonomy path in `storybook.taxonomy.json` (e.g. `Components/Forms and inputs/Button`, `Templates/Page`) and pairs with the co-located `.mdx` page (`documentation-ia.md`).
- **Prop names & values:** stories use current PLUS props (`appearance`, `spacing`, `isDisabled`, `isLoading`, slot names from `docs/engineering/coding.md` § Slot names) rather than retired React-Bootstrap names.
- **`argTypes` categories:** every exposed control declares `table: { category: 'Design' | 'Content' | 'Behavior' | 'Development' }` (`npm run check:storybook-categories`).
- **Interactive playground curation:** keep controls that visibly change the preview (`appearance`, `spacing`, core content, `isDisabled`, `isLoading`); hide or preset low-level DOM/callback props (`id`, `className`, `ref`, `onClick`, raw data arrays).
- **Agent manifest hygiene:** one `meta` per component; tag anti-pattern or deprecated stories `!manifest` (`docs/connectors/storybook-mcp.md`).
- **Runner-safe imports:** interaction tests in `play` import from `storybook/test` (`docs/engineering/coding.md` § Stories and tests).
