---
name: uno-synthesize
description: >
  Distill gathered context — research notes, Slack threads, meeting notes, docs —
  into a structured blueprint: findings, user flows, a screen list, and a PRD.
  Use when the user says "synthesize this", "summarize the findings", "what are
  the takeaways and what would we build", or has collected raw context and needs
  it distilled into a buildable requirement.
allowed-tools: Read, Grep, Glob, Write, mcp__notion-plus__*
---

# Synthesize & Distill

Distill raw, gathered context into a structured blueprint — **findings, user
flows, a screen list, and a PRD** — the bridge between research/discovery and a
buildable requirement. *(Future: write the full result to "uno-blueprint" once
that destination exists.)*

> **Shared skill.** `uno-synthesize` exists in both skill libraries with the
> **same goal and structure** — findings → user flows → screen list → PRD. This
> in-IDE version (Plus UNO / Claude Code) reads files/Notion and **writes the
> blueprint + PRD as a doc**; the bot version (`bot-skills/uno-synthesize/SKILL.md`)
> works from the Slack thread and **files the PRD via the `create_prd` tool**.
> Keep findings/flows/screens/PRD in sync across both — only the write target differs.

## When to Use

- The user has gathered context (interview notes, a Slack discussion, data
  analysis, existing docs) and needs it distilled before deciding what to build.
- "Synthesize this", "what are the takeaways", "summarize the findings".
- The `#uno-synthesize` phase of the "Starting from Nothing" flow — after
  sourcing context, before "Is the project worth pursuing?" / drafting the PRD.

## Auto-Suggest

Proactively suggest after a research pass (`/uno:research`) or when the user has
pasted a lot of raw context, before `/uno:plan` or PRD drafting.

## Inputs

| Input | Source |
|-------|--------|
| Raw context | Pasted notes, a thread, file paths, Notion pages, research brief |
| Topic/goal (optional) | Narrows what "relevant" means |

## Workflow

1. **Gather** the inputs (read the files / notes / brief provided; pull Notion
   pages via `mcp__notion-plus__*` if referenced).
2. **Extract** signal: what was actually said/found — not what you assume.
3. **Structure** into the sections below.
4. **Document** (in-IDE): write the findings to a doc the user can carry into
   planning (e.g. `.agent/handoffs/briefs/{topic}-findings.md` or a Notion page).
5. **Draft the PRD** (when worth pursuing): produce the PRD from the synthesis —
   see "Drafting the PRD" below; this is a deliverable, not just a suggestion.
   Then hand off to `/uno:plan` or building; flag if the evidence says
   sunset/postpone.

## Output Format (the shared structure)

```
## Findings: {topic}

### Key points
- {the most important things learned}

### Decisions
- {what's been decided, by whom if known}

### Action items
- [ ] {task} — {owner if named}

### User flows
- {flow: trigger → steps → outcome}

### Screen list
- {screen} — {its job}

### Open questions
- {genuine unknowns / what's still missing}

### People / SMEs involved
- {who was referenced or should be consulted}

### Recommendation
- {worth pursuing? next step? or evidence to sunset/postpone}
```

## Drafting the PRD

When the synthesis says the project is worth pursuing, draft the PRD from it —
this is the deliverable, not just a next step. Reuse the synthesis: findings →
Summary / Problem / Goals, user flows + screen list → Requirements, action items
→ Acceptance Criteria, open questions carry over.

PRD structure (**same as the bot's `create_prd`** — keep in sync):
- **Title · Summary · Problem/Context · Goals & Non-goals · Users & Scenarios
  (the flows) · Requirements/Scope (the screens) · Acceptance Criteria ·
  Open Questions.**

Write it to a doc / Notion page (via `Write` or `mcp__notion-plus__*`). The bot
counterpart files this same structure to the Roadmap board via `create_prd`.

## Grounding Rules

- **Faithful to the source.** Synthesize what's actually in the context. Don't
  invent findings, decisions, or owners.
- **Park gaps in Open Questions** instead of guessing.
- **Cite** where each finding came from (file path / Notion page / who said it)
  when documenting.
- **Be honest about the recommendation** — if the evidence is thin or points to
  not pursuing, say so.

## Constraints

- Reads context + writes the synthesis and PRD doc; it does not implement code
  or make the go/no-go product decision — it distills, drafts, and recommends.
- Stay scoped to the gathered context; don't expand into adjacent research
  (that's `/uno:research`).

## Next Step

- Worth pursuing → `/uno:plan` (scope) or draft the PRD.
- Not worth it → document the evidence to sunset/postpone.
- New gotcha/learning surfaced → `/uno:compound` to record it.
