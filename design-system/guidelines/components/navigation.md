---
summary: Six navigation components sorted by what the user is moving between
---

<!-- Tier: 2 | Load when: choosing a component from the navigation group -->

# Navigation — which component to reach for

Six components: `Breadcrumb`, `NavTabs`, `NavPills`, `SidebarTab`, `Pagination`,
`Scrollspy`. Generated facts are in
`design-system/src/components/navigation/index.md`. Sort them by what the user is
moving between.

## The choice

| Moving between | Reach for |
|---|---|
| views of the same subject | `NavTabs` or `NavPills` |
| sections of one long page | `Scrollspy` |
| pages of one list | `Pagination` |
| destinations in a sidebar | `SidebarTab` |
| levels of a hierarchy, upward | `Breadcrumb` |

**`NavTabs` and `NavPills` behave identically** — both wrap the same underlying
nav with `NavTabs.Item` / `NavPills.Item` children and an optional `.Dropdown`,
both take `defaultActiveKey` or `activeKey` plus `onSelect`. Pick on appearance
and orientation: tabs are underlined and offer `justified` alignment; pills are
filled and offer `direction="vertical"`.

**`Pagination` is fully controlled.** `currentPage` and `totalPages` are
required, and every click calls `preventDefault` before `onPageChange`, so
without a handler it renders a row of links that visibly do nothing. `maxVisible`
(default 5) centres the window and pins the first and last pages with an
ellipsis.

**`Scrollspy` needs a scroll container it can find.** It spies on the element
whose id is `contentId`, reading that element's `scrollTop` — the paired
`ScrollspyContent` export is that container. Without `contentId` the effect
returns immediately and the bar never highlights.

**`SidebarTab` is a presentational tab.** `state` is a prop with five values —
`enabled`, `hover`, `selected`, `disabled`, `focus` — which exists so the Figma
spec states can be rendered side by side. It does not derive `hover` or `focus`
from real interaction.

## The semantics you get, and the ones you do not

**`Breadcrumb` and `Pagination` are the well-formed pair.** Breadcrumb renders
`nav aria-label="breadcrumb"` around an ordered list and puts `aria-current="page"`
on the active crumb; Pagination renders a named `nav` around a list and marks the
current page the same way. One caveat on Breadcrumb: an item is treated as active
when it is last **or** has no `href`, so a middle crumb without an href also gets
`aria-current="page"` — give every non-final crumb a real destination.

**Tabs are not an ARIA tab widget by default.** The underlying nav applies
`role="tablist"`, `role="tab"` and `aria-selected` only inside a tab container,
which neither `NavTabs` nor `NavPills` provides. Standalone they render as a row
of links: operable by Tab and Enter, but with no arrow-key navigation — the
library's key handler returns early when there is no tab context, so setting
`role="tablist"` by hand does not bring the arrows back. Wrap the bar in
react-bootstrap's `Tab.Container` when the widget semantics matter.

**`SidebarTab` is not keyboard operable.** It renders a `div` with
`role="button"` and `tabIndex={0}`, but no key handler — so it can be focused and
cannot be activated with Enter or Space. `state="selected"` also conveys
selection with colour alone, with no `aria-current` or `aria-selected`. Until
that changes, use it where a real link or `Button` sits behind the same action,
or add the handling at the call site.

**Name every navigation landmark.** `Pagination` defaults to
`ariaLabel="Page navigation"` and `Scrollspy` hard-codes "Scrollspy navigation",
so two paginated tables on a page produce two identically named landmarks. Pass
`ariaLabel`. Pagination's numbered links carry no label of their own — they
announce as bare numbers — which is what makes naming the `nav` load-bearing.

## Related

- `design-system/src/components/navigation/index.md` — generated facts and coverage
- `design-system/guidelines/foundations/accessibility.md` — the WCAG bar
