# Component tabs

Examples · Code · Usage · Changelog, as real Storybook tabs above the canvas
(#168). Humans get Atlassian's four faces over one component; the sidebar keeps
one entry per component, and the agent-facing
`design-system/src/components/<group>/<Name>/index.md` stays one flat file.

| File | What it holds |
|------|---------------|
| `contract.js` | Tab ids, titles and order; the adoption date; where a component's files sit; what a changelog entry has to look like. Pure — no React, no Storybook runtime. |
| `panels.jsx` | The three authored tabs. Each names the file that holds the thing and links it on GitHub. |
| `register.jsx` | `addons.add(..., { type: types.TAB })`, imported for its side effect by `.storybook/manager.js`. |

`design-system/tests/component-tabs-contract.test.js` holds `contract.js` to its
shape. Everything else needs a running Storybook to be wrong.

## How the four tabs are assembled

Three of them are addons. **Examples is Storybook's own canvas tab, renamed** —
`addons.setConfig({ previewTabs })` in `.storybook/manager.js` is the only
supported way to retitle it, and that same object is where the order of all four
is declared. Registering a fourth tab called Examples would have left the canvas
tab sitting beside it.

Two behaviours of Storybook's tab bar shape the panels:

- **The tab list is global.** Storybook filters *tools* by their `match`, never
  tabs — see `Preview.tsx` in `storybook/dist/manager/runtime.js`. Every entry
  in the sidebar gets all four tabs, so each panel answers the
  not-a-component case itself instead of being hidden.
- **The manager cannot read the repo.** It is a browser bundle with no file
  access, so a tab that restated props or guidance would be restating them from
  memory. The panels route to the file that holds the thing. Changelog is the
  exception: entries reach the manager as story parameters, so it renders them.

## The deprecation, and what replaces this

Storybook 10.5 logs `Addon tabs are deprecated and will be removed in Storybook
11` as soon as a second tab is registered. The warning is real, it is left
unsuppressed, and it is the known cost of this mechanism.

The tabs work in 10.x. When the repo moves to Storybook 11, the replacement is
`types.experimental_PAGE` — a registered page with its own route — or folding
the three panels into the docs page as sections. Whichever is chosen, the
contract in `contract.js` survives it: the derivation and the changelog shape do
not depend on how the surface is rendered.

## Changelog entries

The convention lives with the design system, not here:
`design-system/guidelines/components/changelog.md`. In one line — a component
declares `parameters.changelog` in its story meta, entries start on 2026-08-26,
nothing is backfilled, and if entries stop being written the decided next step is
to generate them from git history scoped to the component folder rather than to
add authoring ceremony.

## The upgrade will not be silent

`npm run check:deprecated-apis` (composed into `check:harness`, so it runs on every
PR) fails the moment `package.json`'s `storybook` range can resolve to 11.x — the
major that removes `types.TAB`. It names this file and the ticket carrying the
port, in the PR that widens the range, before anything is installed.

A note in a README is discovered twice: once when someone reads it, and once when
the upgrade breaks. Only the second is loud. This makes the first one loud instead.
