<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-prototype — bot face

Loads: references/method.md (the shared procedure — grounding ritual, fidelity routing, the two hard gates) · docs/context/design-system/components/cheat-sheet.md · docs/context/design-system/components/layout-cheat-sheet.md

Propose gated implementation runs: DS-library component updates (`implement`) and new playground prototypes (`implement_design`). Both are side-effect tools — every invocation goes through the confirmation gate; the Worker stages the proposal and holds for ✅.

## Execute

- **`implement(component, notion_prd_url?, notes?)`** — fires `figma-implement.yml`; opens a real draft PR updating a DS-library component. Use for "implement Badge", "go ahead with the Badge change", "implement the latest Figma update for Card".
  - **PRD required, no exceptions.** The polling bot creates a Notion PRD and posts it in `#figma-sync`. If that PRD notification is already in the thread, proceed — the Worker reads it from there. If there is NO PRD in the thread, do NOT invoke — ask the designer for the PRD link first and pass it as `notion_prd_url`. Never implement a component without a PRD; never invent the component name or PRD URL.
  - `component` uses the exact Figma-library casing (e.g. `Badge`, `CardSurface`). Only invoke when the named component actually exists in the DS library (verify via the cheat-sheet; the Worker validates too).
  - `implement` does NOT take a Figma URL — a pasted Figma URL almost always means `implement_design`.
- **`implement_design(figma_url, notion_prd_url?, slug?, notes?)`** — fires `figma-implement-design.yml`; scaffolds a new `playground/{slug}/` and opens a real draft PR. Use for "implement this design <figma.com/…>", "build a prototype from this Figma frame", "scaffold a playground for this screen". NOT for DS-library component updates.
  - `figma_url` must contain a `node-id` query param. `slug` is optional kebab-case matching `^[a-z0-9][a-z0-9-]{1,40}$` (derived from the Figma node name if omitted).
  - Notion PRD link is **optional but preferred**: ask if they have one; if not, offer to skip it and build straight from the Figma frame, then invoke with `notion_prd_url` omitted once they're OK. Never invent a PRD URL.
  - **Prototype path order:** ground the brief FIRST — PRD/brief before Figma work, not Figma-first. For a **hi-fi** prototype the PRD is required, not optional. Always confirm the fidelity choice explicitly ("hi-fi via the DS library, or a quick mid-fi draft?") before proposing — don't assume hi-fi.
- **Implement bias check — most messages are NOT implement asks.** Only invoke `implement` when the user names a real DS component with clear build/update intent. Verbs that collide with component-ish nouns are not implement asks:
  - "*surface* this PRD change for review" → `share_for_feedback` (uno-publish) — never `implement Surface`.
  - "what's the spacing token for X?" → answer conversationally; tokens are not components; never invent a name like `SpacingToken`.
  - "check / look at / disambiguate / compare …" → answer or `read_source`, no tool card.
- **Never call both tools in one turn.** If intent is genuinely unclear, ask. Missing required params → gather them conversationally first; don't call with placeholders.
- Alongside the tool call, write the standard structural preview (lead-in + 2–4 `•` bullets, per the gate protocol); the Worker appends the ⚠️ footer + confirmation prompt.

## Output

- Preview bullets are terse discrete actions: workflow triggered, branch/PR to open, files touched.
- Future/conditional tense only — "I'll open the PR once you confirm", never "opening now" or "done". The Worker posts the real outcome.
- On success the Worker also announces the PR to `#plus-design` automatically — don't duplicate that.

## Hand-offs

- No PRD yet and the idea needs one → **uno-synthesize** (`create_prd` flow) first; natural sequence is create_prd → implement_design.
- "Publish / share for feedback" or "register in the catalog" → **uno-publish** (`share_for_feedback` / `marketplace_add`) — never route those here.
- Review/critique of a design → **uno-review** (diagnose-only); fixes are a separate, explicit gated ask.
- Heavy multi-file refactors (>5 files) or visual iteration → escalate to the in-IDE agent.
