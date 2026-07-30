# Loading Order — the tier contract

<!-- Tier: 1 — doc #2 of exactly two always-loaded files. -->

Two files load always; everything else loads on demand or is retrieved live. Budgets are targets, not suggestions — a tier that bloats defeats the tier.

## Tier 1 — always loaded (~19.5k chars total)

| File | Role | Budget |
|---|---|---|
| `AGENTS.md` | constitution: identity · roster · routing · forbidden patterns | ≤18k chars |
| `loading-order.md` | this contract | ≤4k chars |

## Tier 2 — loaded on demand (the estate-and-convention rows live ONLY here; DS agent-view triggers live in AGENTS.md § Progressive loading; a skill table carries only its own references)

| Consumer | Loads | When |
|---|---|---|
| any skill, on invocation | its `skills/<name>/SKILL.md` (IDE) or `bot.md` (Worker) + `references/method.md` | always for that skill |
| skill references | `skills/<name>/references/*.md` — one level deep, linked from SKILL.md | as linked |
| any agent, on summon | its `agents/<kind>/<name>.md` + the conventions it names | always for that agent |
| any estate write | the matching `docs/conventions/{notion,figma-workspace,slack,supabase}.md` | before writing |
| any blueprint read | `docs/conventions/blueprint-navigation.md` | before querying — un-guided reads fail on navigation and layer attribution |
| any human-facing text | `docs/conventions/writing-style.md` | before writing |
| UI building | DS agent-views per AGENTS.md § Progressive loading | mandatory triggers |
| orientation / product framing | `docs/context/*` | as needed |

## Tier 3 — retrieved live, never cached

| Truth | Source | Access |
|---|---|---|
| product (features, requirements, screens) | `uno-blueprint` (Supabase) | `writers/blueprint` / `blueprint_search` |
| design system (components, styles, docs) | `uno-storybook` (stories + MDX in `design-system/`) | read source + stories directly |
| — | team conventions are NOT Tier 3: `docs/conventions/` is canonical in-repo (ADR-017) | loaded at Tier 2 |

## Runtime notes

- **Worker (uno-bot):** no on-demand loading. `agents/uno-bot/scripts/bundle-harness.mjs` `SKILL_PATHS` concatenates AGENTS.md, then AGENT.md, then per skill its `references/method.md` followed by its `bot.md`, then the conventions it lists into `src/generated/harness.ts` at build time; `src/agent/skills.ts` serves that constant as one prompt-cached block. Everything in the bundle is always in context — the bot never "loads on demand", so Tier 2 is an IDE concept only. It carries 8 of the 12 conventions; `coding.md`, `tech-stack.md`, `integrations.md`, and `article-writing-style.md` are IDE-side (listed as `NOT_BUNDLED` in the bundler, which fails the build on any convention that is neither bundled nor excluded). Budgets for the bundled files, in chars because these are paragraph-length lines: `AGENT.md` ≤28k, each `bot.md` ≤6k.
- **GitHub Actions:** `scripts/lib/skill-loader.js` loads `scripts/prompts/*` with meta-stripping; offline — fine, because conventions are repo-canonical (ADR-017) and load as plain files.
