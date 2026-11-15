# Queue triage repair

Repair and extend the supplied prototype. Keep its work in this folder and wire the finished view through `App`. The starting code is intentionally old; bring every file you edit into the current design system rather than preserving its visual shortcuts. Use the repo's installed components and dependencies. Do not install anything or modify the design system.

> **PRD.** A supervisor triages three seeded session records (*Mara* / *Awaiting review*, *Jules* / *Needs follow-up*, and *Eden* / *Complete*) from a single queue view.
>
> - **Queue list.** The screen sits inside the workspace's standard application navigation and page layout. The supervisor can search records by name and filter by status; search and status combine, and clearing either restores the matching records. When no records match, the list shows a no-matches state with a *Clear filters* action.
> - **Record details.** Selecting a record opens its details beside or over the queue while keeping the queue usable. The details show the record's current state, a notes field, and a *Resolve* action.
> - **Confirming resolution.** Choosing *Resolve* asks the supervisor to confirm before committing, blocking other interaction until *Cancel* or *Confirm* is chosen. *Cancel* leaves the record unchanged and keeps the details open; *Confirm* marks the record *Complete*, closes the confirmation, and updates the list without losing the active search or filter.
> - **Notices.** Surface two notices: a passing note that the supervisor can dismiss, and a warning with a *Review* action that resolves it. Match each notice's own dismissal or action behavior rather than giving both the same close control.
> - **Completed records.** For a record already marked *Complete*, the *Resolve* action is unavailable and explains why in a way both keyboard and touch users can reach.

Keep all new and inherited styling on the current token and radius roles. If anything moves, use the event's registered motion and reduced-motion behavior. Use licensed icons. Use small local state and static records; no network or backend. `NOTES.md` should briefly identify the inherited debt repaired and any part you could not implement. A heading, static screenshot, or collection of disconnected examples is not a completed queue.
