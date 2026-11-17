---
embodiment: ide
summary: PageHeader renders its title as the page's single h1 at Heading large (24/28) by default, following the ambient heading level unless overridden with titleAs.
status: active
verified: 2026-11-17
---

# ADR-051: A PageHeader title is the page's h1 (2026-11-17)

**Decision.** `PageHeader` renders its title as a `Heading` at size `large` (`24/28`) and resolves its HTML tag from the ambient heading level via `useHeadingLevel`, defaulting to `h1` at page root (`design-system/src/components/layout-and-structure/PageHeader/PageHeader.jsx`). A `PageHeader` placed below another page title, inside a dialog body below the dialog's `h1`, or in a nested demo passes `titleAs="h2"` (named after `Heading`'s `as` prop) so each page keeps a single `h1`.

**Why.** The Page template documentation (`design-system/src/patterns/Page/Page.mdx`) already defined the page's single `h1` at `Heading` `large` (`24/28`), and `PageHeader` is the `header` slot of `Page`. Previously `PageHeader` hardcoded `<Heading size="xlarge" as="h2">`, forcing template and reference-screen stories to bypass it with `disableTitleStyles` and an explicit `<Heading as="h1" size="large">` wrapper just to follow the Page template rule.

**Consequences.** Callers passing plain text to `PageHeader` receive the Page template's `h1` at `large` (`24/28`) with no override; `design-system/src/patterns/Page/ReferenceScreens.stories.jsx` drops its `disableTitleStyles` workarounds. Callers that genuinely compose a custom title block (`DemoPageHeader` in `design-system/src/patterns/Page/pageDemo.jsx` for `StatusTag` + description, and the miniature preview card in `design-system/src/storybook-docs/motion-library-subjects.jsx`) keep `disableTitleStyles`. Any secondary `PageHeader` below another page heading or dialog `h1` passes `titleAs="h2"` (or inherits a nested `HeadingContextProvider`).

**What would reopen it.** If a future `PageHeader` variant introduces multiple size tiers (for example, a marketing hero header at `xlarge`), that tier would be an explicit opt-in prop rather than changing the default `PageHeader` scale away from `Heading` `large` (`24/28`).

— Bill, Nov 2026, deciding option "a" in grill round 2 (Q2, #2683), matching `design-system/src/patterns/Page/Page.mdx`; recorded by Gemini 4 Hydrogen.
