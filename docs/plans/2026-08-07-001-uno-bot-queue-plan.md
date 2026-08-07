---
title: "uno-bot queue: shortcuts, display name, context management"
type: feat
status: draft
date: 2026-08-07
---

# uno-bot queue

Three tracks, ordered by risk. The blueprint work is planned separately in
`2026-08-06-001-feat-blueprint-skills-in-slack-plan.md`.

Everything here is gated on **judged** evals, not deterministic ones. Today's
lesson: deterministic checks reported 19/19 while two BLOCKER cases were live,
including a surface-gate leak. Only the judge caught them.

---

## 1. Shortcuts (right-click message actions) — small, self-contained

Slack has two kinds. Only one is interesting here:

| kind | entry | payload | context |
|---|---|---|---|
| **global** | composer ⚡ button, search | `type: "shortcut"` | none |
| **message** | a message's context menu | `type: "message_action"` | the message + channel |

**Message shortcuts are the fit.** They carry the message, which is exactly what
this bot's work needs: "ask uno about this", "file this as an intake", "capture
this as a lesson". Today those require retyping context the shortcut would hand
over for free.

Requirements, from the docs:
- `commands` scope — **already granted**.
- Declared in app settings → Interactivity & Shortcuts (Name, Short
  Description, Callback ID). Manifest field is `features.shortcuts`.
- **Respond 200 within 3000ms** or the user sees an error.
- *"Your app must follow up with a modal to confirm any action."*

**What this needs that does not exist yet:** `src/slack/interactive.ts` handles
`block_actions` only, and the Worker has never called `views.open`. So a
shortcut is two new capabilities — a payload type and a modal — not a config
change. The 3-second rule is the design constraint: ack immediately, open the
modal, run the agent afterward via the existing DO path. The same
👀-then-silence failure this codebase already fights is one `await` away.

Candidates, smallest first:
1. **"Ask uno about this"** — modal with the message pre-loaded, opens a thread.
2. **"File as intake"** — routes to `uno-maintain` with the message as evidence.
3. **"Capture as lesson"** — same, into `docs/knowledge/`.

Start with one. Ship it end to end before adding the others.

---

## 2. Bot display name — small, unresolved

App settings say `le goat`; the bot user profile still reports
`Real Name: UNO Bot`, display name empty, username `plus_uno_bot`. Messages
render as "UNO Bot".

Renames to `bot_user.display_name` are known to need a reinstall to propagate.
The uninstall/reinstall on 2026-08-06 predated the rename, so it has not had one
since.

Order: reinstall → re-probe the bot profile. If it still reports the old name,
the fallback is a per-message `username` override (`chat:write.customize`, held)
— **tried and reverted once already** because Slack mis-attributes it on the
agent surface, so it is a last resort, not the first move.

---

## 3. Context management — the substantive one

From `https://docs.slack.dev/ai/agent-context-management`: *"prefer small,
relevant context slices over raw conversational exhaust."* uno-bot currently
replays raw turn history every turn — measured today at **51k–373k input tokens
per turn**. That is the exhaust the page names.

**Phase 2 — structured state.** At the end of a turn, one cheap extraction call
writes `{goal, constraints, decisions, artifacts}` into the DO beside history.
Injection becomes *state + last N raw turns* instead of everything. Behind a
flag, default off, so it can be A/B'd against the judge.

**Phase 3 — progressive summarization.** Turns older than N collapse into that
state, preserving decisions and open questions. Only after Phase 2 measures
neutral-or-better.

**Phase 4 — drift detection.** *"Confirm the goal and constraints before taking
significant actions."* Scope it honestly: this is an EXTENSION of the existing
✅ gate with a goal-divergence check, not a new mechanism.

### Why this one is dangerous

It changes what the model sees on every turn. The failure mode is subtly worse
answers — invisible to deterministic checks, and today proved that gap is real.
Worse, tool-payload instructions are **not additive**: the S1 fix displaced the
S3 nudge and surfaced as an unrelated case failing. Changing the whole context
window can displace things nothing is testing for.

Required per phase:
1. Judged evals green before starting (baseline).
2. Flag off by default; enable in one DM first.
3. Judged evals after, compared **case by case** — a stable 19/19 total can hide
   one case breaking while another recovers.
4. Token counts from the `[uno-bot] request done` line before/after; the point
   is fewer tokens at equal quality, and both halves need showing.

---

## Order

Shortcuts (isolated, new surface) → display name (one reinstall) → blueprint
reads (additive, judged) → context management (highest blast radius, last).

Rationale: the first three cannot silently degrade existing answers. The fourth
can.
