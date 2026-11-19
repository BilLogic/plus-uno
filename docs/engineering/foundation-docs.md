---
embodiment: ide
summary: Code-side notes behind the Foundations docs pages — the checks, helpers and generated files a designer page does not carry.
---

# Foundations docs: the code half

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · applied by every agent editing a Foundations page or the token plan. -->

The Foundations pages in `design-system/src/styles/*.mdx` are written for designers. What an engineer needs lives here, and each page links to this file instead of carrying it.

## Tokens and the plan

- Spacing, size and radius tokens come from one plan, `scripts/lib/tokens/plan.mjs`. Add a row there, then `npm run generate:design-tokens`; the output in `design-system/src/tokens/ladder/` is generated. Old-to-new names are in `architecture/token-tiers-name-map.md`.
- `npm run check:old-system` holds code outside `specs/` to the names on the ladder. `npm run check:no-primitive-reads` holds components and templates to semantic reads: the count of numbered-primitive reads may only fall.
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

### Token naming

One name holds on both sides (`npm run check:token-naming`, reading `scripts/figma-variables-snapshot.json`). A CSS token is its Figma variable path with camelCase segments converted to kebab-case (`blackAlpha/60` maps to `--palette-black-alpha-60`, `ProgressRing/stroke` to `--progress-ring-stroke`, and a primitive alpha step to its own segment, `red/600a8` to `--palette-red-600-a8`), lowercased with `/` and spaces turned into `-`, plus the collection's code prefix:

- `--palette-` for `color / primitives`;
- `--ds-` for `color / semantics` and `color / opacity`;
- `--type-` for `typography`;
- `--ds-motion-` for `motion`;
- bare `--` (no collection prefix) for spacing, size and `layers`.

A collection prefix already carried by the leading path segment applies once (`typography` `Type size/100` maps to `--type-size-100` and `Type line height/100` to `--type-line-height-100`).

Leading folder drops:

- In `color / semantics`, the leading `color/` or `elevation/` folder drops before `--ds-`.
- In spacing and size collections, the leading `Size/` folder drops (`Size/Control/md` maps to `--control-md`), and a leading `Radius/`, `Size/`, `Space/` or `Stroke/` folder whose name already prefixes the next segment drops so the segment appears once (`Radius/radius-full` maps to `--radius-full`, `Size/size-100` to `--size-100`, `Space/space-100` to `--space-100`, `Stroke/stroke-1` to `--stroke-1`).

Documented exceptions:

- A `color / semantics` leaf `/default` drops in code (`color/background/neutral/default` maps to `--ds-background-neutral`), except `color/background/code/default` (`--ds-background-code-default`) and `color/text/code/default` (`--ds-text-code-default`), where `-default` names the base code role beside `gutter`, `highlight` and syntax roles.
- `color/chart/*` maps to `--chart-*` (for example `--chart-brand`) and `Skeleton/*` / `color/skeleton/*` family rows map to `--skeleton-*` (for example `--skeleton-height` and `--skeleton-subtle`) with no `--ds-` prefix; the global fill `color/skeleton/default` stays `--ds-skeleton`.
- A motion spring's three Figma rows (`damping`, `mass`, `stiffness`) map to the one `--ds-motion-*` spring token code defines (for example `spatial/fast/damping`, `spatial/fast/mass` and `spatial/fast/stiffness` map to `--ds-motion-spatial-fast`); raw `Spring/*` primitives in the same collection map to `--motion-spring-*` (for example `--motion-spring-880`).
- Elevation shadow layer and geometry parts compose `--ds-shadow-*` (for example `--ds-shadow-raised`).
- `Tooltip/radius` maps to the shared `--radius-control-sm`: Tooltip takes the small control radius, not a radius of its own.

Collections prefixed `archived / ` and rows prefixed `Deprecated/` are legacy and excluded from the check.

## Type

- `npm run check:font-size-literals` holds components and templates to text-style tokens.
- `Section` takes its heading level from `@/lib/headingLevel`; Card's title type comes from the one mixin `card-title-type` in `design-system/src/styles/_card-title.scss`.
- A weighted label and a code sample bind their type variables directly in Figma: `design-system/guidelines/figma/token-mapping.md` § Text that carries no style.

## Accessibility checks

- A heading's look comes from its text style, not its tag: `<h2 className="heading-lg">` draws the same at any level. Select a heading by its class, not its tag.
- In the docs, the `.sbdocs hN` rules apply to MDX prose only: each is fenced with `:not(:where(.docs-story *))`, so a story's own headings draw at their real size. A new rule of that kind needs the same fence.
- axe's `heading-order` misses a missing top, and its `page-has-heading-one` rule does not run when scoped to a story. In the default template the page-level Section header's title is the `h1`; in a multi-step task it is the task's name at the top of the Page.
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
