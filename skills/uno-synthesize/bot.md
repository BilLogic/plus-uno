<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-synthesize — bot face

Loads: references/method.md (the shared procedure) · docs/conventions/terminology.md

Distill gathered context (Slack thread, meeting notes, pasted discussion) into findings → user flows → screen list → PRD. Match depth to the ask — not every request needs all four.

## Execute

- **"summarize this thread" / "tl;dr" / "what did we decide / catch me up"** → conversational, NO tool. Distill the thread already in memory. Only what's actually in the thread — never invent decisions, owners, or action items.
- **"synthesize this" / "what would we build"** → findings + user flows + screen list, conversational and structured.
- **"draft a PRD" / "turn this into a PRD" / "file it"** → the `create_prd` flow:
  1. **Draft the PRD as plain text first** and let the designer refine — do NOT call `create_prd` yet. Structure: Title · Summary · Problem/Context · Goals & Non-goals · Users & Scenarios (flows) · Requirements/Scope (screens) · Acceptance Criteria · Open Questions.
  2. **Only on approval** ("looks good, create it", "make the PRD", "add it to the board") → invoke `create_prd(title, summary, sections?, acceptance_criteria?, product_pillar?, prd_type?, source_url?)`. `title` + `summary` required. Gated (✅); files a card on the Design HQ → Product board in "Need PRD / Under Playground", tagged Design.
  3. **`prd_type` routing:** product/feature PRD → `"feature"` (default, Roadmap board); DS *component* add/update PRD → `"ds-component"` (DS Component PRDs DB). If genuinely unclear, ask.
  4. Undo via `delete_prd(notion_url)` — gated; pass the Notion link the bot posted at creation (archiving is recoverable from Notion trash).
- **"summarize what changed" / "write the update summary"** → tight update summary (below), the `#figma-sync` notification shape — a retrospective, not a PRD. No tool; posts as a normal threaded reply.
- **Enough context first.** If the thread is too thin, say what's missing and offer to pull it in — don't synthesize prematurely.
- Ground product/status facts in the **uno-blueprint** via `blueprint_search` (read-only, no gate) and cite the rows.

## Output

Slack mrkdwn, tight. `*bold*` labels + `•` bullets. Drop any section with nothing real in it:

```
*Summary — {1-line gist}*
*Key findings* • {learned / decided / asked}
*User flows* • {trigger → steps → outcome}   (when synthesizing, not just recapping)
*Screens* • {screen} — {its job}
*Open questions* • {unresolved}
*People mentioned* • {who's involved / follow up with}
```

After a synthesis, **offer the PRD**: "Want me to turn this into a PRD?" — the synthesize phase culminates in the PRD.

Update summary (only changes the PRD / PR / Figma actually show — never invent change items):

```
*Component update — {component}*
*What changed* • {variants / states / tokens / props touched}
*Why* • {the PRD/Figma reason}  <{link}|PRD>
*Impact* • {visual/behavioral; migration note, or "drop-in"}
*See it* • <{storybook}|Storybook> · <{pr}|PR>
```

Grounding: faithful to the context; park gaps (especially success metrics) in Open Questions, don't guess; attribute decisions to who said them when the thread makes it clear; a synthesis, not a transcript. Never auto-create a PRD — always offer, draft, then file on approval.

## Hand-offs

- After the PRD is filed → **uno-prototype** (`implement_design`) to scaffold a prototype from a Figma frame; a natural sequence is create_prd → implement_design.
- People-sourcing earlier in the flow → **uno-research** (`find_experts`).
- Plus-fact / project-status questions → default conversational mode, not synthesis.
- Deep multi-file codebase research → the in-IDE `/uno:research`.
