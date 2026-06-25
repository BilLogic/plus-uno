---
name: uno-synthesize
description: >
  Distill gathered context — a Slack thread, meeting notes, research, pasted
  discussion — into structured findings, user flows, a screen list, and a PRD.
  The bot's #uno-synthesize capability: summarize on request, and on approval
  draft + file the PRD via the create_prd tool. Absorbs the former uno-prd skill
  (one skill, not two). Shared concept with the in-IDE
  .agent/skills/uno-synthesize/SKILL.md.
trigger_types:
  - agentic_default        # summarizing is conversational (no tool)
  - agentic_tool           # filing the PRD uses the create_prd tool
model_default: claude-sonnet-4-6
status: new
covers: >
  The "#uno-synthesize" phase of the "Starting from Nothing" flow — turn context
  into findings → user flows → screen list → PRD. Also the Design Ops "Component
  Update Request" flow — generate the PRD once the context is complete, and produce
  the update summary uno-bot posts to Slack. (Future: write the full result to
  "uno-blueprint" once that destination exists; for now the PRD files to the
  Roadmap board via create_prd.)
---

# uno-synthesize (bot)

Turn raw context into a clear, structured synthesis the team can act on — and,
when it's worth pursuing, into a filed PRD. This is the bridge from "we gathered
stuff" to "here's the requirement."

> **Shared concept.** The in-IDE `.agent/skills/uno-synthesize/SKILL.md` (Plus
> UNO) has the same goal and writes a fuller blueprint doc; this bot version
> works from the Slack thread and files the PRD via `create_prd`. Keep the output
> structure in sync — same findings → flows → screens → PRD, the same PRD
> structure, and the same **update-summary** shape.
>
> **Absorbs `uno-prd`.** PRD drafting + filing is part of this skill now — there
> is no separate uno-prd skill. The `create_prd` / `delete_prd` *tools* remain
> the filing mechanism.

## The goal

Distill the gathered context into, in order of depth:
1. **Findings** — what was learned / decided / asked.
2. **User flows** — the key flows the work implies.
3. **Screen list** — the screens a design would need.
4. **PRD** — the requirement, drafted and (on approval) filed via `create_prd`.

Not every request needs all four. Match the depth to what the designer asked
(see below). *(Future: the full result will be written to "uno-blueprint" — that
destination isn't built yet, so for now summarize in Slack and file the PRD via
create_prd.)*

## When to Use / depth

- **"summarize this thread" / "tl;dr" / "what did we decide / catch me up"** →
  just the summary (findings). Conversational, no tool. Tight recap.
- **"synthesize this" / "what are the takeaways and what would we build"** →
  findings + user flows + screen list (conversational, structured).
- **"draft a PRD from this" / "turn this into a PRD/spec" / "file it"** → produce
  the synthesis, then draft the PRD and, on approval, call `create_prd`.
- **"summarize what changed" / "write the update summary" / "post the component
  update"** → produce a tight **update summary** (template below) for the finished
  DS component update — the `#figma-sync` notification shape, not a PRD.

**Enough context first.** Before synthesizing, check there's enough to work with
(the flow's "enough context?" / "is the context complete?" gate). If the thread is
too thin, say what's missing and offer to pull it in — don't synthesize prematurely.

**Not for:**
- Plus-fact / project-status questions → `uno-qa`.
- Deep multi-file codebase research → in-IDE `/uno:research`.

## Output — summary / synthesis (Slack mrkdwn, tight)

Only what's grounded in the context. Use `*bold*` labels + `•` bullets. Drop any
section with nothing real in it.

```
*Summary — {1-line gist}*

*Key findings*
• {what was learned / decided / asked}

*User flows*  (include when asked to synthesize, not just recap)
• {flow: trigger → steps → outcome}

*Screens*  (the screens this would need)
• {screen} — {its job}

*Open questions*
• {unresolved}

*People mentioned*
• {who's involved / who to follow up with}
```

After a synthesis, **offer the PRD**: *"Want me to turn this into a PRD?"*

## PRD drafting & filing (the create_prd flow — absorbed from uno-prd)

When the designer wants a PRD ("draft a PRD", "make a PRD", "file it"):

1. **Draft it conversationally first** (as text) and let them refine — do NOT
   call `create_prd` yet. Reuse the synthesis: findings → Summary / Problem /
   Goals, user flows + screens → Requirements, action items → Acceptance
   Criteria, open questions carry over.
2. PRD structure: **Title · Summary · Problem/Context · Goals & Non-goals ·
   Users & Scenarios (flows) · Requirements/Scope (screens) · Acceptance
   Criteria · Open Questions.**
3. **On approval** ("looks good, create it", "add it to the board") → call
   `create_prd` with the structured content. It files a card on the
   **Design HQ → Product** board in "Need PRD / Under Playground". The Worker
   gates it (✅) and posts the Notion link.
4. To undo, use `delete_prd(notion_url)` with the link the bot posted.

The full arc: **distill → findings/flows/screens → (worth pursuing?) → draft &
file the PRD via create_prd → then `implement_design` to build a prototype.**

## Update summary (Design Ops — the component-update notification)

When a DS component update lands and the designer wants it announced, synthesize a
tight **update summary** — a retrospective of what shipped (not a forward-looking
PRD). This is the message the bot posts to `#figma-sync`. Slack mrkdwn, drop empty
lines:

```
*Component update — {component}*
*What changed* • {variants / states / tokens / props touched}
*Why* • {the PRD/Figma reason}  <{link}|PRD>
*Impact* • {visual/behavioral; migration note, or "drop-in"}
*See it* • <{storybook}|Storybook> · <{pr}|PR>
```

Only changes the PRD / PR / Figma actually show — never invent change items. No new
tool: this posts as a normal threaded reply (the same shape the polling bot uses).

## Grounding Rules

- **Faithful to the context.** Synthesize what's actually there — never invent
  findings, flows, screens, decisions, owners, or requirements.
- **Park gaps in Open Questions**; don't guess (especially success metrics).
- **Attribute** decisions/actions to who said them when the thread makes it clear.
- **Tight by default** — a synthesis, not a transcript. Drop empty sections.
- If the context is too thin, say so and ask what's needed.

## Forbidden in This Skill

- No invented content (in the summary, the flows/screens, or the PRD).
- The summary/synthesis is a plain Slack reply — no writes. Filing a PRD is a
  separate, **gated** step via `create_prd`, only on the designer's approval.
- Never auto-create a PRD — always offer, draft, then file on approval.
- No walls of text — keep it scannable.

<!-- ==== Sections below are metadata for human readers — stripped by the skill-loader ==== -->

## Related Skills / Tools

- **`.agent/skills/uno-synthesize`** — the in-IDE counterpart (writes the fuller
  blueprint doc + the "Update Summary" section; same goal, kept in sync).
- **Update summary** — feeds the `#figma-sync` Slack notification at the end of the
  Design Ops component-update flow. No dedicated tool; posts as a normal reply.
- **`create_prd` / `delete_prd` (tools)** — file / archive the PRD on the
  Roadmap board. Governed by this skill now (uno-prd was merged in).
- **`uno-research` / `find_experts`** — earlier in the flow: find people to
  source context from.
- **`implement_design`** — after the PRD, scaffold a prototype from a Figma frame.
- **`uno-qa`** — Plus-fact / status questions (vs. synthesizing a thread).
