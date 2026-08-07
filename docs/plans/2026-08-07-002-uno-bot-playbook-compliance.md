---
title: "uno-bot vs the Slack AI agent playbook — compliance audit and gap plan"
type: chore
status: draft
date: 2026-08-07
source: /Users/billguo/Desktop/Parsnip Design System/docs/slack-ai-agent-playbook.md
---

# Playbook compliance

Audited against the playbook's feature-coverage table (§2) and traps (§4).
Verdicts below are the playbook's; **Status** is uno-bot as of `r52-2026-08-07`.

## Entry points

| Feature | Verdict | Status |
|---|---|---|
| `app_mention` | Take | ✅ |
| `message.im` | Take | ✅ |
| Agent container | Take | ⚠️ declared, not visible in-client — unresolved |
| Messages tab | Take | ✅ `app_home_opened` + `tab === "messages"` |
| App Home tab | Take | ✅ |
| Slash commands | Take | ✅ six `/uno-*` |
| **Message shortcuts** | **Take** | ❌ **missing** |
| Global shortcuts | Skip | ✅ correctly absent |
| Unfurls | Usually skip | ✅ correctly absent |

Message shortcuts are the largest single gap: the playbook calls them *"the
only thread-capable surface"*, and §4.2 is why — slash commands do not work in
threads **or the agent container**, so without shortcuts every thread is
unreachable except by @-mention.

## Agent surface mechanics

| Feature | Verdict | Status |
|---|---|---|
| `agent_view` | Take | ✅ migrated, legacy pair deleted |
| `setStatus` | Take | ✅ always, opens the thread |
| `loading_messages` | Take | ✅ r47 |
| Clear status with `""` | Take | ✅ in `finally`, every exit path |
| `setTitle` | Take | ✅ r46, derived from the question |
| `setSuggestedPrompts` | **Take, dynamic** | ⚠️ **static** — see §4.4 |
| `app_context_changed` | Take, read passively | ⚠️ handled as a standalone event and stored; the playbook reads it off the incoming message instead |

## Streaming

| Feature | Verdict | Status |
|---|---|---|
| `startStream` / `append` / `stop` | Take | ✅ r42, opened at delivery |
| `task_display_mode: "plan"` | Take | ❌ **missing** |
| Blocks only in `stopStream` | Constraint | ✅ observed |
| `chat.update` | Skip | ✅ not used |

## Trust and feedback

| Feature | Verdict | Status |
|---|---|---|
| `feedback_buttons` in `context_actions` | Take | ⚠️ plain `actions` buttons, not the native element |
| `icon_button` delete | Take | ❌ missing |
| `reaction_added` feedback | Take | ⚠️ consumed for the ✅ gate, not as feedback signal |
| LLM disclaimer | **Take, conditional** | ⚠️ **unconditional** — see §4.5 |
| Citations | Take | ✅ strong |
| State supported media, fail gracefully | Take | ⚠️ omissions counted, limits not stated in the prompt |

## Error handling

| Feature | Verdict | Status |
|---|---|---|
| Save progress, name the blocker, offer options | Take | ❌ generic "I hit an internal error" |
| Never leave a thread thinking | Take | ✅ |
| Intervention controls (pause/stop/retry) | Take | ❌ missing |

## Context management

| Feature | Verdict | Status |
|---|---|---|
| `conversations.replies` | Take | ✅ (see trap note below) |
| `conversations.history`, narrow | Take, narrow | ❌ not used — a root @-mention has no antecedent for "this" |
| Structured state between turns | Take | ❌ planned (queue plan, Phase 2) |
| Progressive summarisation | Take | ❌ planned (Phase 3) |
| Token budgets | Defer | ✅ correctly deferred |
| Drift detection | Take | ❌ planned (Phase 4) |
| **Don't store Slack data** | **Take** | ❌ **we store transcripts in the DO** |
| Notify outside a thread, then `setTitle` | Take | ❌ the Figma poll posts untitled |

## Traps

- **4.1 `messages[0]` is the parent** — not hit, but the INVERSE is: we keep the
  API's first 50, so the parent survives and the **most recent** replies are
  lost on long threads. The playbook wants parent + most recent N−1. Worse
  where it matters most, same as the trap it warns about.
- **4.2 Slash commands in threads** — respected, but this is exactly why the
  missing shortcuts matter.
- **4.4 Static prompts can lie** — our four are fixed while search capability
  varies per person (own-token OAuth). A prompt can promise what the agent
  cannot do for that user. The playbook calls this a *correctness* fix.
- **4.5 Conditional disclaimer** — ours is on every answer including
  acknowledgements, which trains people to ignore it.
- **4.9 Manifest paste replaces** — learned the hard way, documented.

## Priority

1. **Message shortcuts** — closes an unreachable surface. Biggest gap.
2. **Conditional disclaimer + dynamic prompts** — small, correctness-shaped.
3. **Thread tail over thread head** — a real quality bug on long threads.
4. **Error handling with options** — replaces a dead end with a next step.
5. **`task_display_mode: "plan"`, `context_actions`, `icon_button`** — native
   affordances replacing approximations.
6. **`conversations.history` window** — narrow, per §3.3's rules.
7. **Intervention controls** — needs a session id the relay does not have yet.
8. **Context management Phases 2–4** — already planned, highest blast radius.

## The one to decide, not schedule

**"Don't store Slack data."** uno-bot persists thread transcripts in the
Durable Object, which is what makes multi-turn work today. The playbook says
store metadata and fetch content live. Complying means rebuilding history on
every turn from `conversations.replies` — more subrequests, and it collides
with the structured-state plan that is meant to reduce token spend.

These pull in opposite directions and the resolution is a judgement call about
retention, not an implementation task. Worth an explicit decision with a
recorded rationale before either is built.
