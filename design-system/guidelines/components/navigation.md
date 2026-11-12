---
summary: Five navigation components sorted by what the user is moving between
---

<!-- Tier: 2 | Load when: choosing a component from the navigation group -->

# Navigation — which component to reach for

Five components: `Breadcrumb`, `Tabs`, `Sidebar`, `Pagination`, `Link`.
Generated facts are in `design-system/src/components/navigation/index.md`. Sort
them by what the user is moving between.

## The choice

| Moving between | Reach for |
|---|---|
| views of the same subject | `Tabs` |
| pages of one list | `Pagination` |
| destinations in the app | `Sidebar`, inside `Frame` |
| levels of a hierarchy, upward | `Breadcrumb` |
| another page, from inside a sentence | `Link` |

**A page has one tab system.** The underline `Tabs` strip under the page header
switches the page's sections; a `pill` strip inside a card switches that card's
views. Pill views are a fixed set decided at design time, with no add, rename
or reorder. A second-level choice inside a view is a toolbar filter: the
labeled trigger of `PopupSelect` ("Status: Upcoming"), which swaps the content
in place. Rule and examples: the Tabs page's best practices.

**Sidebar icons are outlined.** Every row icon is Font Awesome Free regular in
the one subtle icon color; the selected row is marked by its fill, never a
solid icon. A brand mark (`fa-brands fa-slack`) is the one exception. The
Sidebar pattern's docs hold the row grid.

**`Pagination` is fully controlled.** `currentPage` and `totalPages` are
required, and every click calls `preventDefault` before `onPageChange`, so
without a handler it renders a row of links that visibly do nothing. `maxVisible`
(default 5) centers the window and pins the first and last pages with an
ellipsis.

## The semantics you get, and the ones you do not

**`Breadcrumb` and `Pagination` are the well-formed pair.** Breadcrumb renders
`nav aria-label="breadcrumb"` around an ordered list and puts `aria-current="page"`
on the active crumb; Pagination renders a named `nav` around a list and marks the
current page the same way. One caveat on Breadcrumb: an item is treated as active
when it is last **or** has no `href`, so a middle crumb without an href also gets
`aria-current="page"` — give every non-final crumb a real destination.

**`Tabs` is a real tab widget.** Every strip is `role="tablist"` on Base UI,
with a roving tabindex and arrow keys, and each panel is labelled by its tab.

**Name every navigation landmark.** `Pagination` defaults to
`ariaLabel="Page navigation"`, so two paginated tables on a page produce two
identically named landmarks. Pass `ariaLabel`. Pagination's numbered links
carry no label of their own — they announce as bare numbers — which is what
makes naming the `nav` load-bearing.

## Related

- `design-system/src/components/navigation/index.md` — generated facts and coverage
- `design-system/src/styles/Accessibility.mdx` — the WCAG bar
