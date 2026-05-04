<!-- Load when: user wants Figma ↔ Cursor iteration, write-back then re-implement -->

# Figma ↔ Cursor Round-Trip (Optional)

Use this when the user wants to move work between Cursor (code) and Figma: implement here → **optionally** push to Figma for design tweaks → pull changes back into the repo. Under **uno-prototype**, the assistant **first asks at the end of each create/update delivery** (see `SKILL.md` **Closing — Figma write-back**); this doc is loaded **after** the user says yes and **provides a Figma link**.

This complements `figma-mcp-guide.md` (Figma → code). It does **not** replace the 7-step implement-design flow; it adds **optional** write-back and **repeat** import steps.

## Prerequisites

- Figma MCP connected in the client (e.g. Cursor).
- Official **Figma MCP skills** installed with the Figma plugin (see [Figma skills for MCP](https://help.figma.com/hc/en-us/articles/39166810751895-Figma-skills-for-MCP)).
- **Edit access** to the target Figma file for any canvas write.
- User has confirmed **each direction** that touches Figma (see Gates below).

## How This Relates to Official Figma Skills

| Direction | Typical official skill(s) | Repo guide |
|-----------|---------------------------|------------|
| Figma → code (Cursor) | `figma-implement-design` (or follow repo steps with MCP read tools) | `figma-mcp-guide.md` — **implement-design (7 steps)** |
| Code / screen → Figma canvas | **`figma-use`** is required before reliable write-to-canvas; **`figma-generate-design`** for full pages from code + design system | This file + user prompt; follow that skill’s steps |
| New empty file first | `figma-create-new-file` | When the user needs a fresh file before building on canvas |

Always load the **`figma-use`** skill before any MCP action that **writes** to a Figma Design file, per Figma’s documentation.

## When it starts (uno-prototype)

Round-trip is **not** chosen in Phase 1. After **each** prototype **create or update** in Cursor, the assistant asks (closing prompt) whether to write back to Figma and refine there.

- **User says no** — no write-back; stop.
- **User says yes** — they must **paste the Figma file URL** (with `node-id` if targeting a specific frame). Without a link, do not guess the file; ask again until they provide it or decline.

Mid-session, the user can still ask anytime to push to Figma; same link + gate rules apply.

## Gates (Non-Negotiable)

- **Write to Figma**: Only after the user clearly opts in (e.g. “push this screen to Figma”, “sync this frame back”). Confirm **target file** (URL or drafts org if creating a file).
- **Re-import to Cursor**: Treat as a normal design handoff — **new or updated node URL** after their edits; run **implement-design 7 steps** again from `figma-mcp-guide.md`.
- **No silent writes** — same standard as `figma-mcp-guide.md` Canvas Write-Back section.

## Round-Trip Loop (High Level)

1. **Implement in Cursor** — Playground or app code using PLUS DS (cheat sheet, tokens). If the starting point was Figma, use **implement-design (7 steps)** first.
2. **Checkpoint** — User reviews in browser / Storybook; agree on what should appear in Figma (scope: whole page vs. one frame vs. annotation-only).
3. **Write-back (optional)** — User confirms → load **`figma-use`**, then use **`figma-generate-design`** (or the workflow the user’s client exposes for “page to Figma”) so the canvas gets **real** components/variables where possible. Capture the **returned file URL** and **node id(s)** in the thread or a brief handoff note for the next step.
4. **Design tweaks in Figma** — Human edits in Figma (layout, copy, tokens). Publish/save as their workflow requires.
5. **Back to Cursor** — User shares the **updated** Figma link (frame/component). Run **implement-design 7 steps** again; merge into the same `playground/{project}/` paths or follow their branch strategy.
6. **Repeat** 3–5 as needed until the user stops the loop.

## Practical Tips

- After each Figma edit pass, prefer a **stable deep link** to the frame you own, so `nodeId` parsing stays consistent.
- If **desktop-only** MCP tools fail (`get_design_context`), follow fallbacks in `figma-mcp-guide.md` (screenshot + metadata + repo tokens).
- Keep **one source of truth per iteration**: either “Figma wins this round” or “code wins” — avoid blind two-way auto-sync without human review.

## When NOT to Use Round-Trip

- User only needs a disposable playground with no Figma source of truth.
- No Figma edit access or MCP write skills unavailable — state that and stay on **Figma → code** or screenshots only.
