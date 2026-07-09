<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-synthesize — bot face

Loads: `references/method.md` (the shared procedure — scope, findings toll gate, designer gates, PRD, paired write, faithfulness rules) · `docs/conventions/terminology.md`. This file carries only the Worker delta: tool payloads, gates, mrkdwn shapes.

## Execute

- **"summarize this thread" / "tl;dr" / "catch me up"** → conversational, NO tool. Distill the thread already in memory with attributions — scoped summary per method § Scope, no findings ceremony.
- **"synthesize this" / "what would we build"** → findings + user flows + screen list, conversational and structured. Then STOP per method § 3 — offer, never proceed: "Want me to turn this into a PRD?"
- **"draft a PRD" / "turn this into a PRD" / "file it"** → the `notion_create` flow:
  1. Draft as plain text first (structure per method § 4) and let the designer refine — do NOT call `notion_create` yet.
  2. Only on approval ("looks good, create it") → `notion_create(surface, title, summary, sections?, acceptance_criteria?, product_pillar?, source_url?)` — `surface` + `title` + `summary` required; gated (✅); files a card on the Design HQ → Product board in "Need PRD / Under Playground", tagged Design.
  3. `surface` routing: every PRD — product/feature AND DS component alike — goes to `"prd"` (the Roadmap board, the single command board). The old `"ds-component-prd"` surface is retired and the Worker rejects it; a DS-component PRD is just a feature PRD whose subject is a component.
  4. Undo via `notion_archive(notion_url)` — gated; pass the Notion link posted at creation (recoverable from Notion trash).
- **PRD drafting in-thread — iterate freely, then file:** draft → feedback → revise over as many turns as it takes before `notion_create`; fuller PRDs are fine now, and the team prefers a right draft over a fast one. The ceiling that remains: thread drafts are for alignment — the *document of record* lives in Notion, and a very long document still hands off: file the card (`notion_create`, ✅) + a ready-to-paste IDE prompt for `skills/uno-synthesize` to expand it there.
- **Findings-doc wall — the Findings & Takeaways doc is not a bot surface:** it lives in the Research & notes DB, and `notion_create` files prd|intake only. Post the findings inline, then either file an intake pointing at them or hand a ready-to-paste IDE prompt that writes the real doc.
- **Long-thread wall — thread memory is the last ~50 turns; a linked thread reads ~50 messages.** Beyond that: summarize what's visible, SAY where the window starts, and offer the IDE prompt for a full-thread pass.
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

- **The paired write is not a Worker capability** — the bot has no blueprint write tool (`blueprint_search` is read-only). **The handoff is automatic:** whenever a PRD the bot filed is accepted, attach the ready-to-paste IDE prompt for the blueprint write + Ready-for-Design card move (`skills/uno-synthesize`, method § 5) — every time, not only when asked.
- After the PRD is filed → **uno-prototype** (`prototype_scaffold`) to scaffold from a Figma frame; a natural sequence is notion_create → prototype_scaffold.
- People-sourcing earlier in the flow → **uno-research** (`notion_search`, scope: "team"); deep multi-file codebase research → the in-IDE `skills/uno-research`.
- Plus-fact / project-status questions → default conversational mode, not synthesis.
