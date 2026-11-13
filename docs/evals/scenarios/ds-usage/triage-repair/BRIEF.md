# Queue triage repair

Repair and extend the supplied prototype. Keep its work in this folder and wire the finished view through App. The starting code is intentionally old; bring every file you edit into the current design system rather than preserving its visual shortcuts. Use the repo's installed components and dependencies. Do not install anything or modify the design system.

Build a supervisor's queue with three seeded records: Mara / Awaiting review, Jules / Needs follow-up, and Eden / Complete.

- Use the full-page frame and page structure. Show the queue as a table, with a compact search field and status filter. Search and status combine, and clearing either restores the right rows. A no-matches state offers Clear filters.
- Selecting a record opens its details beside or over the queue. The queue remains usable. The details contain the record's state, a notes field and Resolve.
- Resolve opens a confirmation that blocks interaction until Cancel or Confirm. Cancel keeps the record unchanged and the details open. Confirm marks that record Complete, closes the confirmation and refreshes the table without discarding the search or filter.
- Provide two notifications: a normal passing note that a person can dismiss, and a warning with a Review action that resolves it. Match each kind's own close/action behavior instead of giving both the same close control.
- Show the unavailable Resolve action for an already-complete record with an explanation a keyboard or touch user can reach.
- Keep all new and inherited styling on the current token and radius roles. If anything moves, use the component event's registered motion and reduced-motion behavior. Use licensed icons.

Use small local state and static records; no network or backend. NOTES.md should briefly identify the inherited debt repaired and any part you could not implement. A heading, static screenshot or collection of disconnected examples is not a completed queue.
