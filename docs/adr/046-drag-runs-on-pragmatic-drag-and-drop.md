---
embodiment: ide
summary: Pragmatic drag and drop owns pointer drag; Base UI supplies the grab handle and Motion supplies spring travel.
status: active
verified: 2026-11-13
---

# ADR-046: Drag runs on Pragmatic drag and drop (2026-11-13)

**Decision.** Pointer drag uses `@atlaskit/pragmatic-drag-and-drop`. It is the drag exception to [ADR-037](037-base-ui-is-the-behavior-layer-for-every-component.md). Base UI still supplies the Button grab handle; the drag example owns keyboard reordering and announcements. Motion supplies spring travel, not drag ownership.

**Why.** Drag needs source, target and monitor coordination beyond the open, focus and keyboard primitives Base UI provides. Keeping one drag engine avoids competing drop models; separating it from spring travel lets carried items retain the motion system's weight rules.

**Evidence.** The approved dependency and implementation landed in the [drag migration](https://github.com/BilLogic/plus-uno/pull/2261). `design-system/src/storybook-docs/illustrations/motion-drag.jsx` imports its element adapter, preview suppression and combine helper. Its order model is `drag-model.js` beside it. A dependency and source scan on 2026-11-13 found no second drag engine: the lockfile contains Pragmatic drag and drop alone, and drag adapter imports occur only in this illustration.

**What would reopen it.** A drag interaction the engine cannot express, or an accessibility requirement the shared keyboard model cannot meet, calls for a new decision before introducing another engine.

— Codex, Nov 2026, recording the merged decisions cited above under the approved harness round.
