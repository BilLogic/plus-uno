---
embodiment: ide
summary: Code-side notes behind the Foundations docs pages — the checks, helpers and generated files a designer page does not carry.
---

# Foundations docs: the code half

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · applied by every agent editing a Foundations page or the token plan. -->

The Foundations pages in `design-system/src/styles/*.mdx` are written for designers. What an engineer needs lives here, and each page links to this file instead of carrying it.

## Tokens and the plan

- Spacing, size and radius tokens come from one plan, `scripts/lib/tokens/plan.mjs`. Add a row there, then `npm run generate:design-tokens`; the output in `design-system/src/tokens/ladder/` is generated. Old-to-new names are in `architecture/token-tiers-name-map.md`.
- `npm run check:old-system` holds code outside `specs/` to the names on the ladder. `npm run check:no-primitive-reads` holds components and patterns to semantic reads: the count of numbered-primitive reads may only fall.
- A component that resolves a tier token into its own rules does it through a private custom property, `--_<component>-<role>`, set once on the component root:

```scss
.plus-tag {
  --_tag-pad-x: var(--pad-x-xs);
  padding: 0 var(--_tag-pad-x);
  &--spacious { --_tag-pad-x: var(--pad-x-sm); }
}
```

  The value on the right is always a tier token, chosen by the fallback rule on the Tokens page.
- Per-breakpoint layout values are generated from the plan into `design-system/src/tokens/_frame_layers.scss`. `Modal.scss` works the width formula out continuously, and the frame and layer token test pins it to `--grid-width-column-screen` at 768, 1024 and 1440.
- Icon names are checked against the Free set generated into `design-system/src/lib/icon-free.generated.js` and `icon-regular.generated.js` (`npm run generate:icon-lists`).

## Type

- `npm run check:font-size-literals` holds components and patterns to text-style tokens.
- `PatternSection` takes its heading level from `@/lib/headingLevel`; PatternCard's title type comes from the one mixin `card-title-type` in `design-system/src/styles/_card-title.scss`.
- A weighted label and a code sample bind their type variables directly in Figma: `design-system/guidelines/figma/token-mapping.md` § Text that carries no style.

## Accessibility checks

- A heading's look comes from its text style, not its tag: `<h2 className="heading-large">` draws the same at any level. Select a heading by its class, not its tag.
- In the docs, the `.sbdocs hN` rules apply to MDX prose only: each is fenced with `:not(:where(.docs-story *))`, so a story's own headings draw at their real size. A new rule of that kind needs the same fence.
- axe's `heading-order` misses a missing top, and its `page-has-heading-one` rule does not run when scoped to a story. In the default template the page-level Section header's title is the `h1`; in the focused template it is the task's name in the Frame's header row.
- Charts share `chartTheme`, which turns on the Highcharts accessibility module and sets `landmarkVerbosity: 'disabled'`. A chart that builds its own options carries `accessibility: chartTheme.accessibility`. Leave a chart outside `aria-hidden`: that wrapper hides the keyboard proxies the module creates.
- Run the checks for a set of stories with `npx vitest --project=storybook --run <path>`.

## Chart color

- `design-system/src/dataviz/palette.js` (exported as `chartPalette` from `@/components`) says which token does which job, and the Highcharts theme in `chartTheme.js` applies it: `chartPalette.CATEGORICAL` and `.SMART` for identity, `.sequentialRamp(hue)` for magnitude, `.divergingRamp(low, high)` for polarity, `.STATUS` for state, `.BRAND` for one series. `chartPalette.rampStops` resolves a ramp in the current mode for the heatmap and treemap color axes. The `CHROME` object is the job-to-token mapping for chart chrome.
- `npm run check:color-system` enforces the chart rules: neighbors stay apart (deltaE 15 or more under full color vision, 8 or more under protan and deutan), every chart color keeps 3:1 against each surface (4.5:1 in increased contrast), neighbors in the categorical order differ by at least 0.08 OKLCH lightness with the direction flipping, and a ramp moves away from the surface at every step.
- `design-system/tests/dataviz-tokens.test.js` fails on any color name outside `--ds-*`, and any color literal, under `design-system/src/dataviz/`.

## Docs blocks

- A rule that is not a status is a `Callout` from `foundation-blocks.jsx`; a Banner is for status. A matched pair of examples is `DoDont`. A focus-ring demo is `RingDemo`, and an icon in a demo is `Glyph`, which passes `size` (12, 16 or 24) to Icon.
- A hero's links row takes no label: `DocsLanding` defaults it to "Tokens".
- `design-system/src/storybook-docs/foundation-names.test.js` fails a Foundations page that names a retired Figma collection or group.
