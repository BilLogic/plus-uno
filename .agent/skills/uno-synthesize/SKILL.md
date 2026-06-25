---
name: uno-synthesize
description: >
  Distill gathered context — research notes, Slack threads, meeting notes, docs —
  into a structured blueprint: findings, user flows, a screen list, and a PRD —
  or, for a finished component update, a distilled update summary.
  Use when the user says "synthesize this", "summarize the findings", "what are
  the takeaways and what would we build", "write the update summary", or has
  collected raw context and needs it distilled into a buildable requirement.
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
- The `#uno-synthesize` step of the **Design Ops "Component Update Request"** flow —
  generate the PRD once the context is complete, and after the component update
  lands, write the **update summary** that uno-bot posts to Slack.

## Starting Points

Two entry contexts feed this skill — the workflow below serves both:

1. **Starting from Nothing** — no defined requirement yet. Source/feed context →
   document findings → *"enough context?"* → *"worth pursuing?"* → draft the PRD.
2. **Starting from a Component Update Request** (Design Ops) — an approved request
   exists. *"Is the context complete?"* → generate the PRD → (component is updated)
   → write the **update summary** (see below) for uno-bot to post.

## Auto-Suggest

Proactively suggest after a research pass (`/uno:research`) or when the user has
pasted a lot of raw context, before `/uno:plan` or PRD drafting.

## Inputs — the source map

Context arrives from many places, "via copy-paste or MCP." Be honest about which
path each source actually has — only **Notion** and **Figma** have MCP in this repo;
everything else comes in as pasted text or an exported file/query result.

| Source | How it comes in | Typical content |
|--------|-----------------|-----------------|
| Notion pages | MCP (`mcp__notion-plus__*`) or paste | notes, goals, prior PRDs |
| Figma frames | Figma MCP or paste/link | designs, constraints |
| Slack / Zoom / Gmail | paste / export (no MCP here) | discussion, decisions, meeting notes |
| Box / Clarity / Metabase | paste / exported file or query result | docs, recordings, data analysis |
| Local files / research brief | `Read` / `Grep` / `Glob` | code, specs, prior findings |
| Topic/goal (optional) | inline | narrows what "relevant" means |

Across every source, the content worth extracting is: **notes, goals, constraints,
designs, and timeline.** If a source has no MCP path, say so and work from what the
user pastes/exports — don't claim a connection that isn't there.

## Workflow

1. **Gather** the inputs (read the files / notes / brief provided; pull Notion
   pages via `mcp__notion-plus__*` if referenced).
2. **Extract** signal: what was actually said/found — not what you assume.
3. **Structure** into the sections below.
4. **Document** (in-IDE): write the findings to a doc the user can carry into
   planning (e.g. `.agent/handoffs/briefs/{topic}-findings.md` or a Notion page).
5. **Assess sufficiency** — is there enough context to decide? *(The flowchart's
   "Do we have enough context?" / "Is the context complete?" gate.)* If the
   evidence is thin, **name exactly what's missing** and loop back: pull in more
   sources (the map above), or hand to `/uno:research` / find the right people.
   Don't force a conclusion on thin evidence.
6. **Recommend & branch** — run the "Worth pursuing?" gate below. When it says
   go, **draft the PRD** from the synthesis (see "Drafting the PRD" — a deliverable,
   not just a suggestion), then hand off to `/uno:plan` or building.

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

## Worth Pursuing? — the decision gate

Once context is sufficient, the synthesis drives a three-way branch (the flowchart's
"Is the project worth pursuing?" node). Pick the outcome the evidence supports —
don't default to "yes":

- **Yes** → draft the PRD (see below). This is the deliverable.
- **No** → write the **evidence to sunset/postpone** as the deliverable — the
  findings and the reasoning, not a silent stop. A documented "don't build this
  yet, here's why" is a real outcome.
- **Not sure** → loop back to **Assess sufficiency** and gather more — name what
  would settle it. An explicit path, not a dead end.

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

## Update Summary (Design Ops flow)

The Design Ops "Component Update Request" flow ends differently: once a DS component
update lands and satisfies the need, synthesize an **update summary** — a
*retrospective* of what shipped, distinct from the *forward-looking* PRD. Same
"distill faithfully" job, different shape.

```
## Update Summary: {component}

### What changed
- {variants / states / tokens / props touched}

### Why
- {the reason — link the PRD / Figma frame that drove it}

### Visual & behavioral impact
- {what designers/devs will see differently}

### Migration / usage notes
- {anything consumers must change; "none" if drop-in}

### Where to see it
- {Storybook story} · {PR}
```

Write it to Notion (or a doc via `Write`). **uno-bot posts the Slack notification**
from this summary — that post is uno-bot's job (tagged `uno-bot` + `notion` in the
flow), not a tool call this skill makes. Stay grounded: only changes the PRD / PR /
Figma actually show — don't invent change items.

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
- Not sure → loop back to gather more context (the sufficiency step).
- Component update landed → write the **update summary** for uno-bot to post.
- New gotcha/learning surfaced → `/uno:compound` to record it.
