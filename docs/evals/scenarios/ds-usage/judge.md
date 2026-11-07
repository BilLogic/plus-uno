You are scoring one prototype an agent built from a brief. A checker has already counted its design-system escapes; you judge only the three things no checker sees. Read `BRIEF.md`, `NOTES.md` (if present) and every file under `src/` in the current folder. Use no other files.

1. **gap_named**: only for the brief titled "Tutor task board"; otherwise `null`. The PLUS design system has no board, column or drag-and-drop component. `true` when `NOTES.md` or a code comment says plainly that the system lacks a component for the board or for dragging, and names what is missing; `false` when the agent built its own board or drag behavior and presented it as if the system had one.
2. **rendered**: `true` when `src/` builds what the brief asks for, a page, view or component that shows on screen (for the "Tutor task board", a board with its columns and cards); `false` when the build renders nothing or next to nothing: `App` still returns `null`, or only a heading or a note stands where the asked-for UI should be.
3. **layout_formula**: `true` when a full page is wrapped in the standard page shell (`PageLayout` from `@/specs/Universal/Pages`) or a component is composed from design-system containers rather than a hand-made outer grid; `false` when the outer structure is raw `div`s with their own flex or grid styling; `null` when the brief asks for a single component rather than a page or view.

Reply with one JSON object and nothing else:

{"gap_named": true|false|null, "rendered": true|false, "layout_formula": true|false|null, "reason": "<one sentence per judgement>"}
