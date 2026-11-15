# Session review queue

Build an interactive session review queue in `src/`, using the repo's installed design system, and wire it through `App`. Do not install dependencies or modify the design system.

> **PRD.** A program coordinator reviews flagged tutoring sessions from the past week so quality issues are resolved or escalated within 48 hours.
>
> - **Queue view.** The screen sits inside the workspace's standard application navigation and page header. When any session has been waiting more than 48 hours since it was flagged, a page-level warning notice at the top of the page alerts the coordinator. Above the session list, the coordinator can search by tutor, student, or reason and narrow the list by affiliation (*CMU*, *Pitt*, *Duquesne*) and by status (*Flagged*, *In review*, *Resolved*). Search and filters combine; when no sessions match, the list shows a no-matches state with a *Clear filters* action while keeping the search and filter bar usable.
> - **Seeded sessions.** Include at least 6 sessions across all three affiliations and statuses, with 2 overdue *Flagged* sessions (> 48h since flagged). Each row shows the tutor, student, affiliation, flagged reason, elapsed time, and current status (*Flagged*, *In review*, or *Resolved*).
> - **Reviewing a session.** Selecting a row opens that session's review details beside the list without leaving the page. The details show the session summary, a single-choice review outcome (*Approve session*, *Request follow-up*, *Escalate to lead*), coordinator notes (required when *Request follow-up* or *Escalate to lead* is chosen, validated inline), and *Cancel* and *Save review* actions.
> - **Escalation and undo.** Saving an *Escalate to lead* review asks the coordinator to confirm before committing. Committing updates the session's status to *Resolved*, closes the details, and shows a brief auto-dismissing confirmation notice with an *Undo* action that restores the previous status and notes.
> - **Reopening old sessions.** For a session already *Resolved*, the *Reopen* action is unavailable when the session is older than 7 days, and explains why in a way both keyboard and touch users can reach.

Keep all styling, spacing, radius, and motion on the design system's tokens and registered transitions, including reduced-motion behavior. When you are done, write `NOTES.md` with one paragraph on what you built and any requirement you could not satisfy.
