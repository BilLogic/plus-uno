---
embodiment: all
disclosure: reference
summary: DS precedence check — the weekly comparison of code with the Figma library, a section of #plus-universal's morning message with a card per disagreeing component, gathered into the week's one intake.
description: the weekly DS precedence report — read before answering a reply on one of its #plus-universal cards, or what its Approve, Needs changes or Reject did.
---

# DS precedence check

<!-- canonical per ADR-017 (docs/adr/) · a scheduled action, read through read_reference as `ds-precedence` · moved 2026-10-14 out of docs/connectors/figma/uno-bot-access.md · the code is agents/uno-bot/src/ds-precedence/; its copy follows docs/connectors/slack/shapes.md § Figma messages. -->

Friday's end-of-day `ds-precedence-check` (the run at Saturday 06:00 ET) compares the component index and registry props with the library; DS precedence says the library side takes each fix. Its report goes up as a section of the next weekday morning's sweep message in #plus-universal (`agents/uno-bot/scheduled-actions/sweep/ACTION.md` § One message a place), on the shared decision card: a line saying how many components disagree, then one card per component (Review · Code · Figma). It stays on one message: past ten, the line says how many show, and the rest come back with the next week's check. Approve adds that component to the week's one `harness-intake`: the week's first Approve files it, each later one comments on it, one at a time through ThreadState, which remembers the week's intake (closed or not). Needs changes puts the person's note on that intake as a dispute. Reject leaves the difference as deliberate. A clean week posts nothing. Every one of these messages follows the copy in `docs/connectors/slack/shapes.md` § Figma messages.

Each card is decided in its own Review, with nothing to type: a typed ✅ or ⛔ in the thread of the message carrying it gets the one review-only line and runs nothing. "Written:" names the intake number the Approve's write returned; a card Needs changes noted reads "Noted by" who sent it, a rejected one "Rejected by" who decided, and one whose six days pass undecided "Closed, no decision".
