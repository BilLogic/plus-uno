---
name: uno-maintain
description: >
  Keep the harness current from Slack — capture a flagged issue (improvement ·
  inaccuracy · inconsistency · bug) in the agent system, route it, and on "worth
  incorporating?" open a PR + pair a PRD and surface it to reviewers; then run
  review/approval by posting to #plus-design and branching on the response. The
  bot's #uno-maintain capability. Shared concept with the in-IDE
  .agent/skills/uno-maintain/SKILL.md.
trigger_types:
  - agentic_default        # triage + the review-request post are conversational
  - agentic_tool           # PR via implement/marketplace, PRD via create_prd
model_default: claude-sonnet-4-6
status: new
covers: >
  The "#uno-maintain" flows. Intake & proposal (human-initiated): capture an issue,
  route it to the right target (product context, a skill, the persona, Storybook,
  uno-bot, or Figma), and on "worth incorporating?" open a PR + pair a PRD via
  create_prd, surfacing it to reviewers. Review & approval (agent-initiated): post
  to #plus-design (summary, PR/PRD links, suggested reviewers), then branch on the
  reviewer response — approve (in-IDE UNO merges) / request changes (revise) /
  reject (decline). Heavy multi-file fixes escalate to the in-IDE agent.
---

# uno-maintain (bot)

Keep the agent system itself current — the skills, the persona, the product-context
docs, the design-system Storybook, the Figma specs, and uno-bot. Capture what a
designer flags (or what you surface), route it, propose a reviewed fix (PR + PRD),
and run it through #plus-design review.

> **Shared concept.** The in-IDE `.agent/skills/uno-maintain/SKILL.md` (Plus UNO)
> has the same flow and **makes the fix** in the files; this bot version works from
> Slack — it triages, files the PRD via `create_prd`, opens the PR via `implement` /
> `marketplace_*`, and posts the review-request. Keep the routing table and PRD
> structure in sync — only the actor and write target differ. Heavy multi-file or
> visual fixes escalate to the in-IDE agent (your scope cap).

## The two flows

1. **Intake & proposal** — a designer flags something wrong in the harness (or you
   surface it) → route → *worth incorporating?* → open a PR + pair a PRD → surface.
2. **Review & approval** — post to `#plus-design` (summary + PR/PRD + reviewers) →
   reviewer responds → approve / request changes / reject.

## When to Use / depth

- **"the {doc/skill/persona/Storybook/bot} is wrong" / "this context is stale" /
  "uno-bot did X wrong"** → triage it: name the target (below), say whether it's
  worth a fix. Conversational, no tool. If it's a heavy fix, say so and escalate to
  the in-IDE agent.
- **"file a PRD for this fix" / "open a PR for it"** → draft the PRD as text, then on
  approval `create_prd`; open the PR with `implement` (DS component) or
  `marketplace_*` — one gated tool call, after they confirm.
- **"post this for review" / "hand this off" / a feature just shipped** → post the
  review-request to `#plus-design` (shape below), suggesting reviewers via
  `find_experts`. No tool — a normal threaded reply.
- **reviewer replied approve / changes / reject** → route the outcome (below).

**Route the issue first.** Match the flag to one target (same table as the in-IDE
`references/triage.md`):

| Signal | Target | Where it lives |
|--------|--------|----------------|
| Context has misinformation | product context / stories | `docs/context/product/*`, `terminology.md` |
| Skill isn't useful | refine the skill | `.agent/skills/*` (+ `bot-skills/*` if shared) |
| UNO off-role / personality | tune persona / instructions | `agent-persona.md`, `AGENTS.md`, `bot-skills/AGENTS.md` |
| Storybook inconsistent / bug | design-system | `design-system/src/**` |
| uno-bot misbehaving | fix uno-bot | `uno-bot/**`, `bot-skills/**` |
| Figma spec / component out of date | update Figma | Figma + `design-system/src/**` |

**Not for:** ordinary Plus-fact questions → `uno-qa`. Building a new prototype →
`implement_design`. Summarizing a thread → `uno-synthesize`.

## Output — the review-request post (Slack mrkdwn, tight)

What you post to `#plus-design`. Single-asterisk bold, `<url|label>` links, `•`
bullets. Only what the PR / PRD / Figma actually show:

```
*Maintenance — {target}*
*What* • {the change, one line}
*Why* • {the reason}  <{prd}|PRD>
*Change* • <{pr}|PR>
*Reviewers* • {suggested people via find_experts}
```

After posting, the thread waits on the reviewer.

## PR + PRD (the propose step)

When the fix is worth incorporating:

1. **Draft the PRD as text first** (Title · Summary · Problem/Context · Goals &
   Non-goals · Users & Scenarios · Requirements/Scope · Acceptance Criteria · Open
   Questions) and let them refine. Do NOT call `create_prd` yet.
2. **On approval** → `create_prd` files it to the Design HQ → Product board; the
   Worker gates it (✅) and posts the Notion link.
3. **Open the PR** with `implement(component, notion_prd_url, …)` for a DS-component
   fix (needs the PRD link) or `marketplace_*` for a marketplace entry. One gated
   side-effect tool per message.
4. **Surface** — post the review-request (above), suggesting reviewers via
   `find_experts`.

## Review response — the three-way branch

| Reviewer says | What happens |
|---------------|--------------|
| **Approve** | The PR is cleared. Merging / applying is **in-IDE UNO's** job (tagged `uno`) — hand it off; you don't merge. Confirm the harness is up to date once merged. |
| **Request changes** | Fold the feedback into the fix and re-propose (loop back). Small edits you can do; heavy ones escalate to the in-IDE agent. |
| **Reject** | Decline. Record why in the thread so it isn't silently re-raised. |

## Grounding Rules

- **Faithful to what's flagged.** Fix what's actually wrong; cite the file/frame.
  Never invent an inconsistency to justify a change.
- **One issue, one route.** If a flag spans targets, split it.
- **Gate instruction edits.** Persona / `AGENTS.md` / `bot-skills/AGENTS.md` steer
  every session — never propose those silently; the in-IDE gate applies.
- **You propose, you don't merge.** Opening a PR is gated; merging is UNO's.

## Forbidden in This Skill

- No invented change items, reasons, or reviewers.
- Never auto-file a PRD or open a PR — always draft/confirm, then the gated tool.
- No walls of text — the review post is scannable, not a transcript.
- Don't take on heavy multi-file or visual fixes — escalate to the in-IDE agent.

<!-- ==== Sections below are metadata for human readers — stripped by the skill-loader ==== -->

## Related Skills / Tools

- **`.agent/skills/uno-maintain`** — the in-IDE counterpart (makes the fix in files,
  merges on approval; same routing + PRD structure, kept in sync).
- **`create_prd` / `delete_prd` (tools)** — file / archive the paired PRD.
- **`implement` / `marketplace_add` / `marketplace_edit` (tools)** — open the PR.
- **`find_experts` (tool)** — suggest reviewers for the review-request post.
- **`uno-synthesize`** — drafts the PRD content when the change came out of a thread.
- **`uno-qa`** — Plus-fact / status questions (vs. maintaining the harness).
