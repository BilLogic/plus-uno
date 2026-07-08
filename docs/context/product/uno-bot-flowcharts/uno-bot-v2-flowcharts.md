# UNO Bot v2 — Flowcharts

> Week 1 deliverable per `~/.claude/plans/piped-riding-melody.md`. One diagram per primary use case, plus an overview architecture diagram. Format: Mermaid (renders natively in GitHub, GitLab, Notion, etc.). Audience: Bryan + Bill, also a starting point for the Week 3 article.
>
> Author: Bryan • Date: 2026-05-20

## Overview architecture

The system around the v2 bot. Shows where the bot sits relative to GitHub Actions, Slack, Notion, Figma, and Anthropic. Updated to reflect the **Cloudflare Workers + Durable Objects** recommendation from the platform research doc; if Bill picks differently in Friday's decision, the "Cloudflare Workers (UNO Bot)" box gets swapped.

```mermaid
flowchart TB
  subgraph external["External services"]
    Figma[Figma]
    Slack[Slack workspace]
    Notion[Notion - DS PRDs DB]
  end

  subgraph platform["Cloudflare Workers - UNO Bot"]
    Worker["/slack/events Worker<br/>(receives Slack events,<br/>orchestrates the agent)"]
    DO[("Durable Object<br/>per-thread conversation state")]
  end

  subgraph anthropic["Anthropic"]
    Claude["Claude Sonnet 4.6<br/>via Agent SDK<br/>(tool-use loop)"]
  end

  subgraph github["GitHub - plus-uno repo"]
    PollAction["figma-library-poll.yml<br/>(cron, every 15 min)"]
    ImplAction["figma-implement.yml"]
    MarketplaceAction["marketplace-add.yml<br/>marketplace-edit.yml<br/>(NEW in v2)"]
    Skills["skills/*/bot.md + method.md<br/>(fetched via GitHub Raw)"]
  end

  Figma -->|"polled every 15 min"| PollAction
  PollAction -->|"creates PRD"| Notion
  PollAction -->|"posts notification"| Slack
  Slack -->|"message + reaction events"| Worker
  Worker <-->|"load + persist<br/>conversation"| DO
  Worker -->|"messages + tool defs"| Claude
  Claude -.->|"tool_use blocks"| Worker
  Worker -->|"repository_dispatch"| ImplAction
  Worker -->|"repository_dispatch"| MarketplaceAction
  Worker -->|"fetches at runtime"| Skills
  Worker -->|"chat.postMessage<br/>reactions.add"| Slack
  ImplAction -->|"posts PR link"| Slack
  MarketplaceAction -->|"posts PR link"| Slack
```

Key points:
- **Polling pipeline is untouched.** `figma-library-poll.yml` runs on its own cron, completely independent of the bot.
- **Skills are fetched at runtime.** The Worker pulls SKILL.md files from GitHub Raw on each invocation (cached by Anthropic's prompt caching after first hit, so this is cheap).
- **All side effects route through GitHub Actions.** The bot never writes to the repo directly — it dispatches to an Action, the Action does the writing. Keeps the bot stateless on the repo side; the GitHub Action's PR is the audit trail.

---

## 1. Implement flow

The most important flow — what designers do most often. A Figma change → bot opens a draft PR.

```mermaid
sequenceDiagram
  autonumber
  actor D as Designer
  participant F as Figma
  participant Cron as figma-library-poll.yml<br/>(15 min cron)
  participant N as Notion (PRD)
  participant S as Slack #uno-bot
  participant Bot as UNO Bot (Cloudflare Worker)
  participant Claude
  participant GH as figma-implement.yml

  D->>F: Publish Badge change
  Note over Cron: Polls every 15 min during work hours
  Cron->>F: Detect changes
  Cron->>N: Create PRD (Draft status)
  Cron->>S: Post notification w/ PRD link<br/>+ buttons: [Implement now] [Defer]

  D->>N: Open PRD, add impl notes
  D->>S: Click "Implement now"<br/>OR type "implement Badge"

  S->>Bot: button click / message event
  Bot->>S: React :hammer_and_wrench: on user's msg
  Bot->>Claude: agentic call (system prompt + tools)
  Claude->>Bot: tool_use: implement(component: "Badge")
  Bot->>S: Post proposal:<br/>"About to implement Badge — react ✅ to confirm"
  Bot->>S: React :warning: on proposal msg
  D->>S: React ✅ on proposal msg

  S->>Bot: reaction_added event
  Bot->>S: React :handshake: on user's confirm
  Bot->>S: Progress: ⚙️ Fetching Figma context...
  Bot->>GH: repository_dispatch (implement-figma-changes)
  GH->>GH: Create branch, fetch Figma, call Claude,<br/>commit files
  Bot->>S: Progress: 🤖 Claude is drafting...
  Bot->>S: Progress: 📝 Opening PR...
  GH->>S: ✅ Draft PR #47 ready
  Bot->>S: React :white_check_mark: on user's original msg

  D->>D: Review PR in GitHub, approve, merge
```

Notes:
- Steps 8-14 are the **confirmation gate** — explicit user ✅ before the GitHub Action fires. Non-negotiable for side-effect-bearing tools.
- Progress messages (steps 17-19) come from the Worker as the GitHub Action runs. The Worker doesn't actually know what stage the Action is in — it emits progress at predictable timing points OR (better) the Action posts back to the Worker via a webhook for true progress.
- The polling-to-Slack chain (steps 1-4) is identical to today; no v2 changes to that subsystem.

---

## 2. Q&A flow

The default conversational mode. Designer asks a question; agent answers directly without invoking a tool.

```mermaid
sequenceDiagram
  autonumber
  actor D as Designer
  participant S as Slack thread
  participant Bot as UNO Bot
  participant DO as Durable Object<br/>(thread state)
  participant Claude
  participant Docs as docs/context,<br/>docs/knowledge

  D->>S: "What's the difference between Card and Surface?"
  S->>Bot: message event
  Bot->>S: React :books: on user's msg
  Bot->>DO: Load thread history
  DO-->>Bot: Last N messages
  Bot->>Claude: agentic call w/ history + tools available
  Note over Claude: Reasons: this is a Q&A, no tool needed
  Claude->>Bot: text response (no tool_use)
  Bot->>Docs: Fetch cheat-sheet.md, color.md<br/>(picked via knowledge map)
  Bot->>Claude: 2nd call w/ docs as additional context
  Claude->>Bot: Final answer w/ source citations
  Bot->>DO: Persist new turn (user msg + bot reply)
  Bot->>S: Threaded reply (Slack mrkdwn)
  Bot->>S: React :white_check_mark: on user's msg
```

Notes:
- Steps 4-5 are the **thread memory** — every Q&A call loads prior turns so "now do the same for Button" works.
- Steps 7-11 are the **two-pass classify-then-fetch pattern** from the AGENT.md conversational default (formerly uno-qa). First call: Claude decides whether tools are needed and which docs to read. Second call: Claude composes the answer with the fetched docs in context.
- No tool call = no confirmation gate. Q&A is the bot's "default" mode.

---

## 3. Marketplace search flow

Read-only marketplace operation. Simplest of the marketplace flows.

```mermaid
sequenceDiagram
  autonumber
  actor D as Designer
  participant S as Slack thread
  participant Bot as UNO Bot
  participant Claude
  participant Cat as prototypes-data.js<br/>(via GitHub Raw)

  D->>S: "show me toolkit prototypes"
  S->>Bot: message event
  Bot->>S: React :shopping_trolley: on user's msg
  Bot->>Claude: agentic call w/ tools available
  Claude->>Bot: tool_use: marketplace_search(query: "pillar:toolkit")
  Bot->>Cat: GET prototypes-data.js
  Cat-->>Bot: Catalog JSON
  Bot->>Bot: Filter by pillar=toolkit
  Bot->>Claude: tool result (matching entries)
  Claude->>Bot: Composed Slack-formatted list
  Bot->>S: Threaded reply with results
  Bot->>S: React :white_check_mark: on user's msg
```

Notes:
- No confirmation gate (read-only).
- The agent invokes `marketplace_search` directly because the message clearly asks for it.
- The bot fetches the live `prototypes-data.js` on each search to ensure fresh data — could be cached for 5 min if hit rate becomes an issue.

---

## 4. Marketplace add flow

Add a new prototype. Requires conversational field collection + confirmation gate before opening the PR.

```mermaid
sequenceDiagram
  autonumber
  actor D as Designer
  participant S as Slack thread
  participant Bot as UNO Bot
  participant Claude
  participant GH as marketplace-add.yml

  D->>S: "add my prototype called Quick Add Modal"
  S->>Bot: message event
  Bot->>S: React :art: on user's msg
  Bot->>Claude: agentic call
  Claude->>Bot: text response (asking for missing fields)
  Bot->>S: Reply: "Got it. Give me: stage, pillar, description, repoPath"
  D->>S: Provides fields (in thread)

  S->>Bot: message event
  Bot->>Claude: agentic call w/ thread history
  Claude->>Bot: tool_use: marketplace_add({metadata})
  Note over Bot: Agent prepares the proposal but pauses before invoking the tool
  Bot->>S: Post proposal:<br/>"🆕 Proposed entry id=1029 ... React ✅"
  Bot->>S: React :warning: on proposal msg

  D->>S: React ✅ on proposal msg
  S->>Bot: reaction_added event
  Bot->>S: React :handshake: on user's confirm
  Bot->>GH: repository_dispatch (marketplace-add)
  GH->>GH: Create branch, edit prototypes-data.js,<br/>open draft PR
  GH->>S: ✅ Added prototype 1029 — PR #48
  Bot->>S: React :white_check_mark: on user's original msg
```

Notes:
- Steps 5-8 are the **conversational field collection**. The agent asks for missing required fields; the user replies in the thread; the agent waits.
- Step 9-10: thread memory carries the previous turns so the agent knows what's been collected.
- Step 12-13: the proposal-and-react pattern is the **confirmation gate**. The tool invocation in step 12 is *deferred* — the agent generates the tool_use block but the Worker holds it pending the ✅. (Implementation detail: the Worker stores the pending tool call in the Durable Object, keyed by the proposal message's ts, and only fires when the reaction event matches.)

---

## 5. Marketplace edit flow

Edit an existing prototype's metadata. Similar to add but the agent first does a `marketplace_search` to confirm the entry exists.

```mermaid
sequenceDiagram
  autonumber
  actor D as Designer
  participant S as Slack thread
  participant Bot as UNO Bot
  participant Claude
  participant Cat as prototypes-data.js
  participant GH as marketplace-edit.yml

  D->>S: "update prototype 1008's deployment URL to https://monthly-report.netlify.app"
  S->>Bot: message event
  Bot->>S: React :art: on user's msg
  Bot->>Claude: agentic call
  Claude->>Bot: tool_use: marketplace_search(query: "id:1008")
  Bot->>Cat: GET prototypes-data.js
  Bot->>Claude: tool result (entry 1008 found)
  Claude->>Bot: tool_use: marketplace_edit(id: "1008", fields: {deploymentUrl: "..."})
  Note over Bot: Pause — confirmation gate
  Bot->>S: Post proposal:<br/>"✏️ Proposed edit to 1008: deploymentUrl ... React ✅"
  Bot->>S: React :warning: on proposal msg

  D->>S: React ✅
  S->>Bot: reaction_added event
  Bot->>S: React :handshake:
  Bot->>GH: repository_dispatch (marketplace-edit)
  GH->>GH: Edit prototypes-data.js, open draft PR
  GH->>S: ✅ Updated prototype 1008 — PR #49
  Bot->>S: React :white_check_mark: on user's msg
```

Notes:
- Step 5-7 show **multi-tool reasoning** in action. The agent first calls a read-only tool (`search`) to confirm the entry exists, then calls the side-effect tool (`edit`). One agentic call, two tool invocations.
- If the agent finds via search that the entry doesn't exist, it would skip the edit and reply with "I don't see prototype 1008 — did you mean X?" — no confirmation gate fires because no destructive tool was invoked.

---

## 6. Confirmation-gate state machine (cross-cutting)

How the **confirmation gate** actually works at the platform level. This isn't a use-case flow — it's the orchestration pattern that all side-effect tools share.

```mermaid
stateDiagram-v2
  [*] --> AgentReasoning: user message arrives
  AgentReasoning --> NoToolNeeded: Q&A path
  AgentReasoning --> ReadOnlyTool: marketplace_search
  AgentReasoning --> SideEffectTool: implement / marketplace_add / marketplace_edit

  NoToolNeeded --> Replied: post answer
  ReadOnlyTool --> Replied: post results

  SideEffectTool --> ProposalPosted: post proposal msg, react warning, store pending call in DO
  ProposalPosted --> WaitingForConfirm: subscribe to reaction_added

  WaitingForConfirm --> Confirmed: user reacts check (matching proposal ts)
  WaitingForConfirm --> Cancelled: user reacts x OR replies w/ correction
  WaitingForConfirm --> TimedOut: 15 min elapsed (DO TTL)

  Confirmed --> ToolFired: fire repository_dispatch, react handshake on user msg
  Cancelled --> Replied: react wave, ack
  TimedOut --> ExpiredNotice: post proposal expired

  ToolFired --> Replied: GitHub Action posts PR link
  Replied --> [*]
  ExpiredNotice --> [*]
```

Key behaviors:
- **State is stored in the Durable Object.** Keyed by the proposal message's `ts` (Slack message timestamp). When a reaction comes in, the Worker queries the DO by `item.ts` to find the matching pending call.
- **TTL of 15 min on pending proposals.** Prevents stale proposals from being fired hours later. Configurable.
- **User can cancel via ❌ or correction.** If they reply with a correction, the agent re-prompts (back to ProposalPosted with updated parameters).

---

## What's NOT diagrammed here

- **Error states.** Each flow has error paths (Claude API fails, GitHub dispatch 404, etc.) — not drawn to keep diagrams readable. The Worker should react `:x:` on user's msg + post error message in thread on any uncaught exception.
- **First-message-in-thread vs follow-up.** The Q&A flow above is a single turn. Multi-turn follow-ups ("now do that for Button") use the same flow with the thread history loaded.
- **Polling failure modes.** If the cron fails (Figma API down, Notion API down), it logs and retries on next cycle. Not bot-facing.

---

## Open questions on these diagrams

1. **Progress messages during implement (flow 1, steps 17-19):** are these worth the implementation complexity? The friction-audit doc proposed them but they require either timed emission from the Worker (best-effort) or a webhook back from the GitHub Action (more reliable, more wiring). Decide in Week 2.
2. **Confirmation TTL (15 min)** — right number? Could be 5 min (tight, forces fast decisions), could be 60 min (loose, but stale-state risk). Let's pick 15 as the default and tune from usage.
3. **Should the `:warning:` reaction on the bot's proposal also work the other way — bot proposes → user reacts `:warning:` to mean "yes do it"?** That's confusing UX. Better: ✅ for confirm, ❌ for cancel, everything else ignored.

End of flowcharts.
