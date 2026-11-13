---
embodiment: ide
summary: Component docs pages gain a 4th tab, Agent view, that shows the component's generated file byte for byte through one raw glob in the tabs module; amends ADR-025, whose tabs were a human affordance only (2026-11-08)
status: active
verified: 2026-11-08
---

# ADR-040: Agent view is the fourth component tab (2026-11-08)

**Renamed 2026-11-13: the tab is now labeled Harness; the decision below stands.**

**Decision.** A component docs page shows four tabs: **Examples · Code · Usage ·
Agent view**. Agent view shows the component's generated file — the text
`npm run generate:component-docs` writes and `ds_get` returns — exactly: rendered
as markdown to read, with a raw-text view and a Copy button for the bytes
themselves, and a "Report a problem" link that opens a new GitHub issue naming
the component and the file. This amends ADR-025, which placed the tabs inside the
page and called them a human affordance that changes nothing for an agent.
Agent view is still for humans; what it shows is the agent's text. — Bill, Nov 2026

**How it resolves.** `design-system/src/storybook-docs/docs-tabs.jsx` holds one
lazy `import.meta.glob(…, { query: '?raw' })` over every generated file: nested
components' `index.md`, flat components' `<Name>.md` (group indexes excluded),
and `index.md` beside each pattern, the Logo and PageLayout. The page is matched
to its file through its Storybook meta — the stories file Storybook records as
the meta's `parameters.fileName` — by `generatedDocPathFor` and `agentViewEntry`
in `lib/component-tabs-contract.js`. A page with no generated file has no Agent
view tab, the same rule ADR-025 set for every tab.

**Why.** Designers could not see what agents are told, so a wrong sentence in
the generated file was found only when an agent acted on it. Showing the file
inside the page it is generated from puts the reviewer and the source on one
screen, and the report link turns a spotted error into an issue in one click.

**Considered and rejected.**

- *Agent text inside each MDX page.* Two copies of one meaning: the page would
  carry text the generator also writes, and they would drift. The glob keeps the
  generated file the only source; `check:docs-tabs` fails an authored
  `<DocsTab tab="agent">`.
- *An eager glob.* It would put every generated file into the docs bundle to show
  one. Lazy loading fetches the file when its tab opens.
- *A new markdown package.* Storybook's own `Markdown` docs block is already in
  the bundle and renders tables, lists and code.

**Consequences.**

The rendered view is a reading aid, so its typography is the docs page's, not
the agent's; the raw view and Copy are the bytes. A rule heading's `{#rule-id}`,
which the renderer has no syntax for, is drawn as a quiet id label under the
heading and used as its anchor, so a link to a rule id lands on the rule; the raw
view keeps the braces.

Pattern pages have the file but no tab strip yet: their MDX does not use
`<DocsTabs>`, so Agent view reaches them when they adopt it.

`design-system/tests/component-tabs-contract.test.js` holds the shape: Agent view
exists, is last, and its content equals the generated file for a nested
component, a flat component and a pattern.
