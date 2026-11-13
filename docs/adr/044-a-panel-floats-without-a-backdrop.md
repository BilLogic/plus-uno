---
embodiment: ide
summary: A floating Panel keeps the page usable; Modal owns the Backdrop and modal focus behavior; Drawer is retired.
status: active
verified: 2026-11-13
---

# ADR-044: A Panel floats and never takes a Backdrop; Drawer retires (2026-11-13)

**Decision.** A floating Panel sits over the page without a Backdrop. It does not register as a modal overlay. Drawer and its pattern tokens are retired. A confirmation opened from a Panel uses a Modal, which brings the Backdrop and owns modal focus behavior.

**Why.** A Panel keeps the page available while a record or AI conversation stays open. Treating it as a modal drawer would block that page and duplicate Modal's overlay behavior. The trade-off is deliberate: use a Modal when the task requires a blocking decision.

**Evidence.** The merged [Panel migration](https://github.com/BilLogic/plus-uno/pull/2286) removes PatternDrawer and its overlay registration; the [token cleanup](https://github.com/BilLogic/plus-uno/pull/2291) removes its tokens. `design-system/src/patterns/Backdrop/Backdrop.stories.jsx` holds the Panel-with-confirm example; `design-system/src/lib/overlay.js` owns the single Modal slot.

**What would reopen it.** A blocking side surface with requirements Modal cannot express needs a new design decision before a new overlay type is added.

— Codex, Nov 2026, recording the merged decisions cited above under the approved harness round.
