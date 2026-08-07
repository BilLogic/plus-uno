---
title: "uno-bot roadmap: what we are building, what we are not"
type: feat
status: active
date: 2026-08-07
supersedes: 2026-08-06-001, 2026-08-07-001, 2026-08-07-002 (kept for their reasoning; this is the schedule)
---

# uno-bot roadmap

Three plans and an audit had accumulated with no single answer to "what are we
actually doing". This is that answer. Baseline: **r52-2026-08-07**, judged evals
**19/19**.

The other docs keep their value as *reasoning*; this one is the *schedule*.

## Decisions

### In scope

| # | Item | Why now |
|---|---|---|
| 1 | **Message shortcuts** (one, then more) | Slash commands work in neither threads nor the agent container (playbook 4.2), so **every thread is unreachable except by @-mention**. Biggest functional hole. |
| 2 | **Conditional disclaimer** | Firing on acknowledgements trains people to ignore it (4.5). Cheap. |
| 3 | **Dynamic suggested prompts** | Search capability varies per person; a fixed set offers what the bot cannot do for that user (4.4). The playbook calls this correctness, not personalisation. |
| 4 | **Thread tail, not head** | Long threads keep the OLDEST 50 replies. The parent survives, recency dies — worst on the threads where summarising matters most. |
| 5 | **Error handling with options** | "I hit an internal error" is a dead end. Progress + blocker + next step. |
| 6 | **`conversations.history` window** | A root @-mention has no antecedent for "this". Narrow per playbook 3.3: event's channel only, before the anchor, ~12, **no pagination**. |
| 7 | **Native feedback elements** | `context_actions` + `feedback_buttons` and `icon_button` delete, replacing hand-rolled buttons. |
| 8 | **`task_display_mode: "plan"`** | Streaming already ships; this renders steps as a checklist instead of interim prose. |
| 9 | **Bot display name propagation** | `le goat` is in app settings and never reached the bot user. One reinstall. |
| 10 | **Blueprint deep links** | Verify the param scheme, then link answers into the app. `include` already shipped (r51). |

### Out of scope, deliberately

| Item | Why not |
|---|---|
| **Global shortcuts** | Playbook: skip. A modal is a worse place to type than the composer already open. |
| **Unfurls (`link_shared`)** | Playbook: usually skip. Wrong cost shape for an agent. |
| **`chat.update` progress** | Superseded by streaming. |
| **Per-request token ceilings** | Playbook: defer. Do not guess a ceiling. |
| **Intervention controls (pause/stop/retry)** | Wants a session id before the prompt is built — an extra round trip on a path with 3 seconds to ack. Revisit only with structured state (Phase 2 below). |
| **Porting `sb:*` skills as slash commands** | Decided against: the IDE plugin authors, the app draws and writes, uno-bot reads. A `/uno-slice` that can neither save nor draw is a demo. |
| **Hybrid-search RPC** | Not ours to build — schema-owner work, proposed to the blueprint repo (`2026-08-07-003`). |
| **Storing less Slack data** | Not a task; a decision. See below. |

### The decision that is not ours to schedule

The playbook says **don't store Slack data** — metadata yes, content fetched
live. uno-bot persists thread transcripts in the Durable Object, which is what
makes multi-turn work and what the structured-state plan builds on.

Complying means rebuilding history from `conversations.replies` every turn: more
subrequests against a 50 cap, and it pulls directly against Phase 2's goal of
spending fewer tokens. **These two cannot both be maximised.** Needs an explicit
retention judgement with a recorded rationale before either is built.

## Phases

Each phase ends with judged evals. Deterministic checks are not sufficient —
they reported 19/19 on 2026-08-06 while two BLOCKER cases were live, one of them
a surface-gate leak.

### Phase 1 — Correctness cluster (items 2, 3, 4)

Small, independent, each fixes something currently wrong. No new surfaces.

- Disclaimer conditional on the answer being substantive (reuse the judge's
  `MIN_DRAFT_CHARS` shape rather than inventing a second threshold).
- Prompts vary by whether the requester has a stored `own` token.
- `thread-transcript.ts`: keep parent + most recent N−1.

**Verify:** judged evals 19/19; a long thread's summary references its last
message; a fresh user's prompt set differs from a connected user's.

### Phase 2 — Message shortcuts (item 1)

The one that needs new capability, so it goes second, alone.

`interactive.ts` handles `block_actions` only and the Worker has never called
`views.open`. Two new things, plus a hard rule: **200 within 3000ms**, then a
modal, then the agent on the existing DO path. An `await` in the wrong place
here recreates the 👀-then-silence failure this codebase already fights.

Start with **"Ask uno about this"** end to end. `File as intake` and
`Capture as lesson` follow only once one works.

**Verify:** right-click a message → modal within 3s → answer lands in a titled
thread; a slow agent turn never blocks the ack.

### Phase 3 — Surface polish (items 5, 6, 7, 8)

- Error path: name what was reached, what blocked, what to try.
- Narrow channel-history window, framed in the prompt as *what came before* —
  a pronoun resolver, not a subject.
- Native `context_actions` / `icon_button`.
- `task_display_mode: "plan"`.

**Verify:** judged evals; a forced failure produces options rather than a dead
end; a root @-mention resolves "this" correctly.

### Phase 4 — Ops (items 9, 10)

Reinstall for the display name; verify blueprint deep-link params against the
deployed app, then link answers. Both cheap, neither blocking.

### Phase 5 — Context management (separate track, gated)

Structured state → progressive summarisation → drift detection. Highest blast
radius in the backlog: it changes what the model sees on *every* turn, and the
failure mode is subtly worse answers.

Per phase: baseline judged evals, flag off by default, enable in one DM, then
**compare case by case** — a stable 19/19 total can hide one case breaking as
another recovers, which is exactly what r48 did.

Do not start until Phases 1–3 are merged and green.

## Constraints that apply throughout

- **50 subrequests per invocation.** A blueprint fallback search can spend 5;
  the channel-history read adds one; each `include` adds one.
- **Tool-payload instructions are not additive.** Adding a directive can
  displace an existing one, and it surfaces as an *unrelated* eval case
  failing (S1 fixed, S3 broke, same run).
- **Durable Objects pin their script version** until evicted. A "still broken"
  reading right after a deploy is probably stale code — let the DO idle or probe
  from a Worker route.
- **The manifest API is dead for this app** (PKCE). The web editor works; a
  paste replaces rather than merges.

## Acceptance

- [ ] Phase 1 merged, judged evals 19/19
- [ ] Phase 2: one shortcut working end to end within the 3s ack
- [ ] Phase 3 merged, judged evals 19/19
- [ ] Phase 4: bot renders as `le goat`; blueprint answers carry app links
- [ ] Retention decision recorded before Phase 5 begins
- [ ] Phase 5 gated per-phase with case-by-case eval comparison

## Sources

- Playbook: `/Users/billguo/Desktop/Parsnip Design System/docs/slack-ai-agent-playbook.md`
- Compliance audit: `docs/plans/2026-08-07-002-uno-bot-playbook-compliance.md`
- Blueprint approach: `docs/plans/2026-08-06-001-feat-blueprint-skills-in-slack-plan.md`
- Hybrid-search proposal: `docs/plans/2026-08-07-003-blueprint-search-rpc-proposal.md`
- Slack lessons: `docs/knowledge/lessons/2026-08-06-slack-app-token-and-cli-setup.md`
