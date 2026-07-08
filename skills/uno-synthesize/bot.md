<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-synthesize — bot face

Loads: `references/method.md` (the shared procedure — scope, findings toll gate, designer gates, PRD, paired write, faithfulness rules) · `docs/conventions/terminology.md`. This file carries only the Worker delta: tool payloads, gates, mrkdwn shapes.

## Execute

- **"summarize this thread" / "tl;dr" / "catch me up"** → conversational, NO tool. Distill the thread already in memory with attributions — scoped summary per method § Scope, no findings ceremony.
- **"synthesize this" / "what would we build"** → findings + user flows + screen list, conversational and structured. Then STOP per method § 3 — offer, never proceed: "Want me to turn this into a PRD?"
- **"draft a PRD" / "turn this into a PRD" / "file it"** → the `notion_create` flow:
  1. Draft as plain text first (structure per method § 4) and let the designer refine — do NOT call `notion_create` yet.
  2. Only on approval ("looks good, create it") → `notion_create(surface, title, summary, sections?, acceptance_criteria?, product_pillar?, source_url?)` — `surface` + `title` + `summary` required; gated (✅); files a card on the Design HQ → Product board in "Need PRD / Under Playground", tagged Design.
  3. `surface` routing: product/feature PRD → `"prd"` (default, Roadmap board); DS *component* PRD → `"ds-component-prd"` (DS Component PRDs DB). If genuinely unclear, ask.
  4. Undo via `notion_archive(notion_url)` — gated; pass the Notion link posted at creation (recoverable from Notion trash).
- **"summarize what changed" / "write the update summary"** → the component-update notification shape below (method § Variant); no tool, posts as a normal threaded reply.
- Ground product/status facts via `blueprint_search` (read-only, no gate) and cite the rows.

## Output — Slack mrkdwn, tight

`*bold*` labels + `•` bullets. Drop any section with nothing real in it:

```
*Summary — {1-line gist}*
*Key findings* • {learned / decided / asked}
*User flows* • {trigger → steps → outcome}   (when synthesizing, not just recapping)
*Screens* • {screen} — {its job}
*Open questions* • {unresolved}
*People mentioned* • {who's involved / follow up with}
```

Update summary:

```
*Component update — {component}*
*What changed* • {variants / states / tokens / props touched}
*Why* • {the PRD/Figma reason}  <{link}|PRD>
*Impact* • {visual/behavioral; migration note, or "drop-in"}
*See it* • <{storybook}|Storybook> · <{pr}|PR>
```

Never auto-create a PRD — always offer, draft, then file on approval.

## Hand-offs

- **The paired write is not a Worker capability** — the bot has no blueprint write tool (`blueprint_search` is read-only). When a PRD is accepted in-thread, say the blueprint write + Ready-for-Design card move run in-IDE via `skills/uno-synthesize` (method § 5) and point the designer there.
- After the PRD is filed → **uno-prototype** (`prototype_scaffold`) to scaffold from a Figma frame; a natural sequence is notion_create → prototype_scaffold.
- People-sourcing earlier in the flow → **uno-research** (`notion_search`, scope: "team"); deep multi-file codebase research → the in-IDE `skills/uno-research`.
- Plus-fact / project-status questions → default conversational mode, not synthesis.
