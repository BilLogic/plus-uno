---
embodiment: ide
summary: Base UI (@base-ui/react, pinned per ADR-036) is the headless behavior layer for every interactive PLUS component, not just AI surfaces; supersedes ADR-009, widens ADR-036 (2026-11-03)
status: active
verified: 2026-11-03
---

# ADR-037: Base UI is the behavior layer for every component (2026-11-03)

**Decision.** Every interactive PLUS component — buttons, fields, dialogs, menus, tooltips, anything with open/closed state, focus management, or keyboard interaction — takes its behavior from `@base-ui/react`, pinned to the version ADR-036 names. PLUS styles it with SCSS on `--ds-*` tokens, targeting its `data-*` state attributes and the named state tokens, the same pattern ADR-036 set for AI components. PLUS components first, then Base UI for the behavior underneath; React-Bootstrap is no longer the fallback for an interactive component's behavior. Bootstrap markup stays available for non-interactive layout where no Base UI part applies.

**Why.** ADR-036 scoped Base UI to AI surfaces because that was the component family in flight. The same case holds for every interactive component: one accessibility implementation to trust instead of React-Bootstrap's, a headless layer that keeps the look entirely in PLUS tokens, and one behavior library across the whole design system instead of two.

**Relationship to ADR-009.** [ADR-009](009-bootstrap-first-no-alternative-ui-frameworks.md) (Bootstrap first, no alternative UI frameworks) is superseded by this decision: Bootstrap no longer stands as the fallback source of interactive behavior. It continues to describe what it already did — no Material UI, no Ant Design, FA Free only — those parts stand.

**Relationship to ADR-036.** [ADR-036](036-base-ui-for-ai-components.md) (Base UI for AI components) is widened, not replaced: its reasoning and version pin carry over to every interactive component, not only AI surfaces.

**What would reopen it.** Base UI dropping a part an existing component relies on, or a breaking major that costs more to follow than to replace; a component needing patches to Base UI's behavior (the sign the wrapper is the wrong shape); or a migration cost that outweighs the one-library benefit for components that are stable and rarely touched.

## Amendment (2026-11-05): field-anchored listboxes keep their own keyboard

Select, Cascader, TreeSelect and the Calendar keep a hand-written keyboard handler. Each is a documented exception, not a drift.

- **Cascader and TreeSelect.** Base UI ships no tree and no multi-column listbox. Its `menu` submenus and a combobox per column would each drop the single focus-in-the-field model and the shared `Listbox` row anatomy, and would need patching, which is the reopen signal above. Each keeps its own handler (`handleTriggerKeyDown` plus `handleMenuKeyDown` / `handleTreeKeyDown`), held by a `keyboard` block in `Cascader.test.jsx` and `TreeSelect.test.jsx`: open, walk, expand and collapse, commit, Escape returning focus.
- **Select.** The keyboard lives in the internal `Listbox` it shares with TagInput, which adds windowed rows with `aria-setsize`, a Create row, a Select all header, paged `loadOptions` and `commitOnClose` staging. Base UI Combobox expresses none of those, so a move is a rewrite of the shared `Listbox` and both consumers, not a swap inside Select. That is its own ticket; until it lands Select keeps `Listbox`'s handler, guarded by `MenuKeyboardNavigation.stories.jsx` and `SelectCommit.stories.jsx`.
- **Calendar.** The date grid keeps hand-written keys (`_internal/Calendar.jsx`): Left and Right by a day, Up and Down by a week, Home and End to the week's ends, Page Up and Page Down by a month (Shift for a year), on a roving tab stop in a `grid` of `gridcell`s. Base UI has no public two-dimensional grid; its composite roving-focus part is internal-only, so using it would mean importing private paths. Held by the `Calendar keyboard` and `Calendar roles` tests in `Calendar.test.jsx` and the `ArrowKeys` story.

New field-anchored popups still start on Base UI; this amendment covers these four only.

## Amendment (2026-11-20): four more exceptions

Bill approved these from the design system audit. Each is a documented exception, not a drift.

- **TreeTable.** Base UI ships no tree, so the row keyboard (`onKeyDown` in `TreeTable.jsx`: arrows to walk, expand and collapse) stays hand-written, the same ground as TreeSelect above. Held by `TreeTable.test.jsx`.
- **TagInput's keyboard.** It runs on the shared `Listbox`, so it is the same case as Select above and moves with that rewrite, not before.
- **Panel resize handle.** Base UI has no splitter, so the `separator` on the Panel's Page-facing edge keeps its own pointer and key handling. Held by the Panel stories.
- **Flag's hover and focus pause.** Base UI exposes no public hover or focus part, only Toast's own pause, and adopting Toast would replace Flag's queue, stack, motion and countdown bar rather than sit under them. Bill kept the four handlers on 2026-11-21. Held by the Flag stories.

Moved to Base UI by the same ruling: AiSources now sits on Collapsible.

## Amendment (2026-11-21): PopupSelect, InlineEdit and Carousel

Bill approved reading these three from the design system audit on 2026-11-20. None has a Base UI part to move to, so each is a documented exception, not a drift.

- **PopupSelect.** Its trigger, open and closed state, outside press and focus return already run on Base UI Popover, through Popup. What stays hand-written is the list: it is the shared `Listbox`, the one Select draws, with the same rows, keys and messages. A Base UI Combobox under PopupSelect alone would fork that list from Select's, so its keyboard (arrows, Enter, Escape, typing to filter) is the Select case above and moves with that rewrite, not before. Held by the `Keyboard` and `Searchable` stories.
- **InlineEdit.** Base UI has no inline-edit part. Its Field and Input describe a control, not the swap from read view to edit view, Enter or leaving to confirm, Escape to cancel and focus back on the read view; and the edit view is the caller's own control, so there is nothing for a Base UI part to sit under. `handleKeyDown`, `handleBlur` and `keepFocus` in `InlineEdit.jsx` stay. Held by the `InlineEdit keyboard` block in `InlineEdit.test.jsx`.
- **Carousel.** Base UI has no carousel, swipe or timer part. The arrow keys on the region, the swipe on the stage, the press on a neighbor and the autoplay clock with its holds (hover, keyboard focus, out of view, hidden tab) stay hand-written in `Carousel.jsx`. Its controls are IconButton and ProgressIndicator; the play button swaps its name between Pause and Play rather than reporting a pressed state, so it is a plain button and not a Base UI Toggle. Held by the `ArrowKeysMove`, `SwipeMoves`, `InactiveSlidesHidden` (the press on a neighbor), `HoverHolds` and `PauseStopsProgress` stories.

— Claude (agent), Nov 2026, on Bill's approval to make Base UI the default behavior layer
