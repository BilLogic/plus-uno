---
embodiment: ide
summary: The escape rules `check:ds-usage` holds consumer code to — one section per rule ID, each saying what fails and what to write instead.
---

# Design-system usage rules

An **escape** is one place where code in `prototypes/` or `src/` leaves the design system. `npm run check:ds-usage` finds them from the generated manifests (`design-system/agent-views/components.json`, `tokens.json`), so a rule here is only as current as `npm run generate:agent` left those files.

The motion rule also checks component and template styles under `design-system/src/`. Positive MDX code blocks and stories tagged `reference-screen` use the same checker.

Each finding reads `file:line:col  rule-id  message`, then `->` with what to write instead, then a link to its section below. Fix the escape the line names; the suggestion is the nearest real name in the manifest, and where it lists several tokens that hold the same value, pick the one named for the role.

How it runs:

- `npm run check:ds-usage`: files changed against main, each held to zero.
- `npm run check:ds-usage -- <paths…>`: those files or directories, each held to zero.
- `npm run check:ds-usage -- --all`: everything, against `scripts/baselines/ds-usage.json`. A `<rule> <path>` count may only fall; `-- --update` records a fall.
- `--json` prints the same findings as data.

Rules at level **fail** block; rules at level **warn** print and let the run pass.

## ds/no-unknown-component

**fail.** A name imported from a public barrel (`@/components` or `@/templates`) that the barrel does not export, or `<DS.Name>` through a namespace import of one. A real component or template imported from the wrong barrel fails too, and its fix is the import line it belongs on.

Write a component listed in `design-system/agent-views/components/index.md`. When none fits, propose a new component instead of naming one.

## ds/no-deep-import

**fail.** An import that reaches past a barrel: `@/components/<group>/<Name>`, `@/templates/…`, `@/dataviz/…`, or any path into `design-system/src/components` or `design-system/src/`.

Import from the barrel: `import { Button } from '@/components';`. Stylesheets (`@/styles/…`) are their own entry point.

## ds/no-unknown-prop

**fail.** On a design-system component or template (`Card`, `Frame` and the rest), a prop its manifest record does not list, or a literal value for an enum prop outside its list.

Use a prop from the record in `components.json` (or the component's generated doc, or the template's Storybook page). Every component also takes `key`, `ref`, `children`, `className`, `style`, `id`, `role`, `title`, `tabIndex`, `aria-*` and `data-*`. A value written as an expression (`appearance={tone}`) is not judged, and neither is a component whose record has `props: null`.

## ds/no-raw-literal

**fail.** A raw color (hex, `rgb()`, `hsl()`, `oklch()`…), a non-zero `px`/`rem`/`em` size, or a font family or weight, written as a value: in a JSX `style={{…}}` object (a bare number counts where React adds `px`), or in a SCSS or CSS declaration.

Read a token: `var(--ds-text)`, `var(--stack-md)`, a typography token. `0`, unitless numbers (`line-height`, `z-index`, `opacity`), percentages, and anything inside `var(…)`, including a fallback, are fine. At-rule preludes such as `@media (max-width: 768px)` are not declarations.

## ds/no-raw-motion

**fail.** In component and template CSS/SCSS under `design-system/src/`, a `transition` or `animation` shorthand, duration or timing function with literal times, `ease*` or `cubic-bezier()` fails. Separate stagger delays retain their documented cadence. This rule checks DS implementation styles; the other usage rules check consumer code.

Read the matching `--ds-motion-*` semantic and its `-duration`. Loops use `--ds-motion-loop`; time-following progress uses `--ds-motion-linear`. Under reduced motion the token layer maps every spatial semantic to the appearance fast fade, so a state change fades in its final place and size instead of traveling or cutting; a transform that would still travel opts out with `no-travel` from `styles/_reduced-motion.scss`, and each loop stops in its own reduced-motion block. For React transitions and choreography, import the motion helpers and spring table from `@/templates` (`AreaStage`, `DrillStack`, `useDrillStack`, `SlideViews`, `StepStage`, `scrollToSpot`, `callAttention`, `SwapInPlace`, `LoadThenReveal`, `LoadRevealSlot`, `PresenceSlot`, `useMotionReduced`, `SPRINGS`).

## ds/no-unknown-token

**fail.** A `var(--name)` that no token, and no file under `design-system/src`, `prototypes` or `src`, declares; or a retired token name nothing declares any more.

Use the suggested token. A prototype may declare its own custom property (`--my-gap: var(--stack-md);`) and read it.

## ds/no-primitive-read

**fail.** Consumer code reading a primitive-tier token (`--palette-*`, `--space-<n>`, `--radius-<n>`, `--size-<n>`, `--stroke-<n>` and the other primitives in `tokens.json`).

Read the semantic, template or component token that holds the value; the fix lists the ones that resolve to that primitive. `--radius-full` is a semantic step that keeps the primitive's name, so it reads as semantic.

## ds/fa-free-only

**fail.** A Font Awesome Pro family (`fa-light`, `fa-thin`, `fa-sharp`, `fa-duotone`, `fa-sharp-duotone`), or `fa-regular fa-<name>` for an icon Free draws only solid.

Use `fa-solid`, `fa-regular` or `fa-brands` with an icon Free ships. The Free names are the committed lists `design-system/src/lib/icon-regular.generated.js` and `icon-free.generated.js` (solid and brands), so every run checks all three families, the hosted `ds_check` included.

## ds/no-retired-name

**warn.** A prop the manifest marks deprecated, or a retired token name that is still declared somewhere.

Use the replacement the fix names.

## ds/page-starts-from-pattern

**fail.** A page-level module whose outer element is a hand-styled container: a `<div>`, `<main>` or `<section>` carrying a `className`, or a `style` with layout in it (display, grid, flex, gap, padding, margin, a width or a height), where a template belongs.

A module is page-level by its path, and nothing else is checked:

- an app entry, `src/App.jsx` or `src/App.tsx`;
- a module directly in a `pages/` folder, or a page folder's own module (`pages/Home/Home.jsx`);
- a module named for a page (`SessionsPage.jsx`);
- the local module an app entry renders as its root (`<Reviews />` from `./Reviews`), one hop.

The outer element is what the default-exported component returns last at its shallowest indent; a reference-screen story checks each inline `render`. A fragment and a `*Provider` are stepped through to the child written directly inside; a child behind a condition (`{open && <Fab />}`) is not outermost, and neither is a router or any other component. A bare `<div>` with no class or style carries no layout of its own and passes.

Start the page from a template (`Frame` with the PLUS `Sidebar`; `import { Frame } from '@/templates';`, or `Page`, `Card` and the rest from `@/templates`), and put the hand-made layout inside it if any is still needed.

## ds/placement

**fail.** A component placed inside a slot or container where a template specifies a different control. Rows derive from slot acceptance metadata (`design-system/agent-views/_slots.json`): a row names the components a slot rejects and the ones it takes instead. No template registers such a row today, so `_slots.json` is empty and the only rows are the hand-kept ones below.

Hand-kept rows with `before` (`_placements.json`) check direct JSX siblings: a `Banner` before a `PageHeader` belongs in Page's `banner` slot, below its `header` (Notifications). This row remains **warn**.

Use the component the template names and read the guide the fix points to.

## ds/no-raw-control

**fail.** A raw `<button>`, `<input>`, `<select>` or `<textarea>`, or a click handler (`onClick`) on a raw `<div>`, outside a Base UI part (`@base-ui/react` or a `render` prop).

Use the PLUS component the fix names (`Button`, `IconButton`, `CloseButton`, `TextField`, `SearchField`, `Checkbox`, `Radio`, `Toggle`, `Range`, `Select`, `PopupSelect`, `FilterButton`, `FilterMenu`, `TextArea`, `Card`), or build new interactive behavior on `@base-ui/react`.

