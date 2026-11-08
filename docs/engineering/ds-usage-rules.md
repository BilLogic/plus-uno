---
embodiment: ide
summary: The escape rules `check:ds-usage` holds consumer code to — one section per rule ID, each saying what fails and what to write instead.
---

# Design-system usage rules

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-11-06 · reached from a `check:ds-usage` finding's `see` link; ADR-039 records why one checker owns these. -->

An **escape** is one place where code in `prototypes/` or `src/` leaves the design system. `npm run check:ds-usage` finds them from the generated manifests (`design-system/agent-views/components.json`, `tokens.json`), so a rule here is only as current as `npm run generate:agent` left those files.

Each finding reads `file:line:col  rule-id  message`, then `->` with what to write instead, then a link to its section below. Fix the escape the line names; the suggestion is the nearest real name in the manifest, and where it lists several tokens that hold the same value, pick the one named for the role.

How it runs:

- `npm run check:ds-usage`: files changed against main, each held to zero.
- `npm run check:ds-usage -- <paths…>`: those files or directories, each held to zero.
- `npm run check:ds-usage -- --all`: everything, against `scripts/baselines/ds-usage.json`. A `<rule> <path>` count may only fall; `-- --update` records a fall.
- `--json` prints the same findings as data.

Rules at level **fail** block; rules at level **warn** print and let the run pass.

## ds/no-unknown-component

**fail.** A name imported from `@/components` that the barrel does not export, or `<DS.Name>` through a namespace import of it.

Write a component listed in `design-system/agent-views/components/index.md`. When none fits, propose a new component instead of naming one.

## ds/no-deep-import

**fail.** An import that reaches past a barrel: `@/components/<group>/<Name>`, `@/patterns/…`, `@/dataviz/…`, or any path into `design-system/src/components` or `design-system/src/`.

Import from the barrel: `import { Button } from '@/components';`. Stylesheets (`@/styles/…`) and Specs (`@/specs/…`) are their own entry points.

## ds/no-unknown-prop

**fail.** On a design-system component, a prop its manifest record does not list, or a literal value for an enum prop outside its list.

Use a prop from the component's record in `components.json` (or its generated doc). Every component also takes `key`, `ref`, `children`, `className`, `style`, `id`, `role`, `title`, `tabIndex`, `aria-*` and `data-*`. A value written as an expression (`appearance={tone}`) is not judged, and neither is a component whose record has `props: null`.

## ds/no-raw-literal

**fail.** A raw color (hex, `rgb()`, `hsl()`, `oklch()`…), a non-zero `px`/`rem`/`em` size, or a font family or weight, written as a value: in a JSX `style={{…}}` object (a bare number counts where React adds `px`), or in a SCSS or CSS declaration.

Read a token: `var(--ds-text)`, `var(--stack-md)`, a typography token. `0`, unitless numbers (`line-height`, `z-index`, `opacity`), percentages, and anything inside `var(…)`, including a fallback, are fine. At-rule preludes such as `@media (max-width: 768px)` are not declarations.

## ds/no-unknown-token

**fail.** A `var(--name)` that no token, and no file under `design-system/src`, `prototypes` or `src`, declares; or a retired token name nothing declares any more.

Use the suggested token. A prototype may declare its own custom property (`--my-gap: var(--stack-md);`) and read it.

## ds/no-primitive-read

**fail.** Consumer code reading a primitive-tier token (`--palette-*`, `--space-<n>`, `--radius-<n>`, `--size-<n>`, `--stroke-<n>` and the other primitives in `tokens.json`).

Read the semantic, pattern or component token that holds the value; the fix lists the ones that resolve to that primitive. `--radius-full` is a semantic step that keeps the primitive's name, so it reads as semantic.

## ds/fa-free-only

**fail.** A Font Awesome Pro family (`fa-light`, `fa-thin`, `fa-sharp`, `fa-duotone`, `fa-sharp-duotone`), or `fa-regular fa-<name>` for an icon Free draws only solid.

Use `fa-solid`, `fa-regular` or `fa-brands` with an icon Free ships. The regular list is `design-system/src/lib/icon-regular.generated.js`; solid and brands names are checked when the Font Awesome metadata is installed or named by `FA_ICONS_JSON`.

## ds/prefer-plus-component

**warn.** A `react-bootstrap` import of a component the design system also exports (`Button`, `Modal`…).

Import the PLUS component from `@/components`.

## ds/no-retired-name

**warn.** A prop the manifest marks deprecated, or a retired token name that is still declared somewhere.

Use the replacement the fix names.
