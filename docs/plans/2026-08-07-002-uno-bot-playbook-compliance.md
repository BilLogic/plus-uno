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
| **Message shortcuts** | **Take** | ✅ five, r64 |
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
| `setSuggestedPrompts` | **Take, dynamic** | ✅ varies with the requester's search capability (r53) |
| `app_context_changed` | Take, read passively | ⚠️ handled as a standalone event and stored; the playbook reads it off the incoming message instead |

## Streaming

| Feature | Verdict | Status |
|---|---|---|
| `startStream` / `append` / `stop` | Take | ✅ r42, opened at delivery |
| `task_display_mode: "plan"` | Take | ✅ built, flagged off (`SLACK_STREAM_PLAN`) |
| Blocks only in `stopStream` | Constraint | ✅ observed |
| `chat.update` | Skip | ✅ not used |

## Trust and feedback

| Feature | Verdict | Status |
|---|---|---|
| `feedback_buttons` in `context_actions` | Take | ✅ built, flagged off (`SLACK_NATIVE_FEEDBACK`) |
| `icon_button` delete | Take | ✅ built, same flag |
| `reaction_added` feedback | Take | ⚠️ consumed for the ✅ gate, not as feedback signal |
| LLM disclaimer | **Take, conditional** | ✅ conditional, three variants (full / draft / none) |
| Citations | Take | ✅ strong |
| State supported media, fail gracefully | Take | ⚠️ omissions counted, limits not stated in the prompt |

## Error handling

| Feature | Verdict | Status |
|---|---|---|
| Save progress, name the blocker, offer options | Take | ✅ per-stage: progress + blocker + next step |
| Never leave a thread thinking | Take | ✅ |
| Intervention controls (pause/stop/retry) | Take | ✅ `/stop` + Home-tab button, both resolved per person |

## Context management

| Feature | Verdict | Status |
|---|---|---|
| `conversations.replies` | Take | ✅ (see trap note below) |
| `conversations.history`, narrow | Take, narrow | ✅ 12 messages, one page, only on a dangling pronoun |
| Structured state between turns | Take | ✅ built, flagged off (`CONTEXT_STATE`) |
| Progressive summarisation | Take | ✅ built, same flag |
| Token budgets | Defer | ✅ correctly deferred |
| Drift detection | Take | ✅ built, same flag |
| **Don't store Slack data** | **Take** | ⚠️ **deliberately not followed** — retention approved for this project (user, 2026-08-07) |
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

## Status, 2026-08-07 (r65)

Every ❌ in the tables above is now built. Three ship behind flags —
`SLACK_NATIVE_FEEDBACK`, `SLACK_STREAM_PLAN`, `CONTEXT_STATE` — for reasons
recorded in the roadmap (`2026-08-07-004`); "built and off" is not the same as
compliant, and the tables say which is which.

Two entries are deliberately NOT complied with, which is different from
outstanding:

- **Don't store Slack data.** Overruled with a recorded rationale: transcript
  retention in the Durable Object is what makes multi-turn work, and the user
  approved it for this project. The playbook's concern stands; the trade was
  made knowingly.
- **Global shortcuts / unfurls.** The playbook says skip, and we skip.

The priority list below is kept as written, unticked, because it is the
*reasoning* about order — not a checklist. The schedule lives in the roadmap.

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
