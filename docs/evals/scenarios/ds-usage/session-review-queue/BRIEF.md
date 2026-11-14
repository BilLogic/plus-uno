# Session review queue

Build an interactive session review queue in `src/`, using the repo's installed design system, and wire it through `App`. Do not install dependencies or modify the design system.

A program coordinator reviews flagged tutoring sessions from the past week:

- Use the full-page shell (`Frame`, `Sidebar`, `Page` with `PageHeader`) and `PatternSection` / `PatternTable`. Include a top-level `Banner` when any session is overdue (> 48h since flagged).
- Provide a filter bar above the table with a compact `SearchField`, an affiliation filter (`CMU`, `Pitt`, `Duquesne`), and a status filter (`Flagged`, `In review`, `Resolved`). Filters combine; an `EmptyState` with a *Clear filters* action renders when no rows match.
- Seed at least 6 sessions across all three affiliations and statuses, including 2 overdue `Flagged` sessions. Each row shows tutor, student, affiliation, flagged reason, elapsed time, and a `StatusTag`.
- Selecting a row opens a detail `Panel` beside the table (wired through `Frame`'s panel slot and `usePanelControl`) showing the session summary, a `RadioGroup` for review outcome (*Approve session*, *Request follow-up*, *Escalate to lead*), a required `TextArea` for coordinator notes when *Request follow-up* or *Escalate to lead* is chosen, and *Save review* / *Cancel* actions.
- *Save review* on *Escalate to lead* opens a confirmation `Modal` before committing. Committing updates the row's status to `Resolved`, closes the panel, and surfaces an auto-dismissing `Flag` in a `FlagGroup` with an *Undo* action that restores the previous status and notes.
- For a row already `Resolved`, the *Reopen* action is disabled when the session is older than 7 days, with a keyboard- and touch-reachable explanation.
- Keep all styling on `--ds-*` tokens and semantic spacing/radius roles, and keep panel/row/flag motion on the design system's spring transitions and reduced-motion behavior.

Write `NOTES.md` with one paragraph on what you built and any requirement you could not satisfy.
