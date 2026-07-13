<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-prototype — bot face

Slack delta only. The shared procedure (grounding ritual, fidelity routing, the two hard gates) is `references/method.md`, already in this prompt. DS specifics (agent-views) load in the Actions codegen prompts, not the Worker — the Worker only proposes.

Propose gated implementation runs: DS-library component updates (`component_implement`) and new playground prototypes (`prototype_scaffold`). Both are side-effect tools — every invocation goes through the confirmation gate; the Worker stages the proposal and holds for ✅.

## Execute

- **`component_implement(component, notion_prd_url?, notes?)`** — fires `figma-implement.yml`; opens a real draft PR updating a DS-library component. Use for "implement Badge", "go ahead with the Badge change", "implement the latest Figma update for Card".
  - **PRD required, no exceptions.** The polling bot creates a Notion PRD and posts it in `#uno-bot`. If that PRD notification is already in the thread, proceed — the Worker reads it from there. If there is NO PRD in the thread, do NOT invoke — ask the designer for the PRD link first and pass it as `notion_prd_url`. Never implement a component without a PRD; never invent the component name or PRD URL.
  - `component` uses the exact Figma-library casing (e.g. `Badge`, `CardSurface`). Only invoke when the named component actually exists in the DS library (verify via the GitHub reads on `design-system/src/components`; the Worker validates too).
  - `component_implement` does NOT take a Figma URL — a pasted Figma URL almost always means `prototype_scaffold`.
- **`prototype_scaffold(figma_url, notion_prd_url?, slug?, notes?)`** — fires `figma-implement-design.yml`; scaffolds a new `playground/{slug}/` and opens a real draft PR. Use for "implement this design <figma.com/…>", "build a prototype from this Figma frame", "scaffold a playground for this screen". NOT for DS-library component updates.
  - `figma_url` must contain a `node-id` query param. `slug` is optional kebab-case matching `^[a-z0-9][a-z0-9-]{1,40}$` (derived from the Figma node name if omitted).
  - **PRD requirement splits by fidelity — confirm fidelity FIRST** ("hi-fi via the DS library, or a quick mid-fi draft?" — never assume hi-fi): **hi-fi → PRD required** (none exists → route to uno-synthesize's PRD flow first); **mid-fi draft → PRD optional** (offer to skip it and build straight from the frame; invoke with `notion_prd_url` omitted once they're OK). Ground the brief before Figma work either way. Never invent a PRD URL.
- **Implement bias check — most messages are NOT implement asks.** Only invoke `component_implement` when the user names a real DS component with clear build/update intent; "check / look at / disambiguate / compare …" → answer or `source_read`, no tool card. The collision traps in `agents/uno-bot/AGENT.md § Tool routing` apply in full ("surface this PRD" → `shareout_post`; tokens aren't components — never invent a name like `SpacingToken`).
  - **Figma frames — the capability boundary lives in `AGENT.md § My lane` (qualitative mine, spec IDE-only); this is the routing delta.** Asked *about* a frame ("what's in this frame?") → answer from the screenshot + text layers; quantitative/spec claims are off-limits, say so plainly. Asked to *build* from a frame → `prototype_scaffold` (hands the URL to a GitHub Action) if it's a genuine scaffold ask, else the wall-ritual. Screenshot didn't attach ("[figma screenshot unavailable]") → text-layer honesty only; never claim to have seen what didn't render.
- **Never call both tools in one turn.** If intent is genuinely unclear, ask. Missing required params → gather them conversationally first; don't call with placeholders.
- Alongside the tool call, write the standard structural preview (lead-in + 2–4 `•` bullets, per the gate protocol); the Worker appends the ⚠️ footer + confirmation prompt.

## Output

- Preview bullets are terse discrete actions: workflow triggered, branch/PR to open, files touched.
- Future/conditional tense only — "I'll open the PR once you confirm", never "opening now" or "done". The Worker posts the real outcome.
- On success the Worker also announces the PR to `#plus-design` automatically — don't duplicate that.

## Hand-offs

- **Prompt-spec wall — low/mid prompt-spec *authoring* is IDE work.** A usable spec (real copy, sample data, states) outgrows a Slack reply, and that's intentional. Capture the trigger → steps → outcome skeleton in-thread, then hand off a ready-to-paste IDE prompt; the gated tools stay `component_implement`/`prototype_scaffold` only.
- **Ground as thoroughly as the proposal needs — accuracy is the law.** Take the lookups an ACCURATE proposal requires; a slower, right proposal beats a fast half-grounded one. If grounding still leaves a gap, name it and ask for the missing input — never propose on guesses.
- No PRD yet and the idea needs one → **uno-synthesize** (`notion_create` flow) first; natural sequence is notion_create → prototype_scaffold.
- "Publish / share for feedback" → **uno-publish** (`shareout_post`); "register in the catalog" → **uno-publish** (marketplace publishing runs in-IDE via `writers/notion`, not a bot tool) — never route those here.
- Review/critique of a design → **uno-review** (diagnose-only); fixes are a separate, explicit gated ask.
- Heavy multi-file refactors (>5 files) or visual iteration → escalate to the in-IDE agent.
