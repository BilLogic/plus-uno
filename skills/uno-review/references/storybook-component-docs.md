---
embodiment: ide
summary: How a Storybook docs page is organized across Components, Templates, and Patterns, and what a doc review checks on each
---

# Storybook component docs — what a doc review checks

A review of a Storybook docs page holds it to the page contract in
[`documentation-ia.md`](../../../design-system/guidelines/documentation-ia.md)
and checks component names against the generated index
([`design-system/agent-views/components/index.md`](../../../design-system/agent-views/components/index.md)).
Story and `argTypes` checks live in [`storybook.md`](storybook.md).

## The pages that exist

Sidebar order and grouping are generated from
[`storybook.taxonomy.json`](../../../storybook.taxonomy.json):

- **Components (`Components/<Group>/<Name>`):** the canonical component list per group is [`design-system/agent-views/components/index.md`](../../../design-system/agent-views/components/index.md). A component absent from that index has no page; a review that meets a retired name flags it and cites the replacement in the index's Not-here table.
- **Templates (`Templates/<Name>`):** page, section, card, table, and overlay shells under `design-system/src/templates/` and `design-system/src/storybook-docs/templates/` (agent views in `design-system/agent-views/templates/`).
- **Patterns (`Patterns/<Name>`):** cross-component interaction and layout rules under `design-system/src/storybook-docs/patterns/` (agent views in `design-system/agent-views/patterns/`).
- **Foundations & Tech stack:** foundation pages under `design-system/src/styles/*.mdx` (agent views in `design-system/agent-views/foundations/`) and package pages under `design-system/src/storybook-docs/tech-stack/`.

## Page tabs and what to check

- **Four tabs**, in order: `Examples` · `Code` · `Usage` · `Harness`. `Code` and `Harness` are generated from source and the co-located agent `.md` file (`npm run generate:docs-agent-files`); a hand-written props table or hand-edited agent copy is a finding.
- **Examples:** one `ComponentExample` per appearance, state and size, then the interactive playground. Each example follows the example-fidelity and illustration-kit rules in `documentation-ia.md` § Examples.
- **Usage spine:** Usage, Alternatives, Best practices, Accessibility, Related, then Parts and Content guidelines; `npm run check:ds-writing` holds the shape.
- **Disabled and slot names:** an example's disabled states and slot props follow `design-system/agent-views/patterns/Disabled.md`, `design-system/agent-views/patterns/Forms.md`, and `docs/engineering/coding.md` § Slot names.
- **Names:** every component named on the page exists in `design-system/agent-views/components/index.md`; Alternatives and Related route to live pages.

## References

- [`documentation-ia.md`](../../../design-system/guidelines/documentation-ia.md) — the page contract (`Examples` · `Code` · `Usage` · `Harness`, `Templates` and `Patterns` roots)
- [`design-system/agent-views/components/index.md`](../../../design-system/agent-views/components/index.md) — generated component and template existence index
- [`storybook.taxonomy.json`](../../../storybook.taxonomy.json) — sidebar taxonomy
- [`storybook.md`](storybook.md) — story and `argTypes` review checklist
- [`Button.mdx`](../../../design-system/src/components/forms-and-inputs/Button/Button.mdx) — reference component page
- [`ds-docs-layout.jsx`](../../../design-system/src/storybook-docs/ds-docs-layout.jsx) — docs layout primitives
