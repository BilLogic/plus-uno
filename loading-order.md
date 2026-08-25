# Loading Order — the tier contract

<!-- Tier: 1 — doc #2 of exactly two always-loaded files. -->

Two files load always; everything else loads on demand or is retrieved live. Budgets are targets, not suggestions — a tier that bloats defeats the tier.

## Tier 1 — always loaded (~21.5k chars total)

| File | Role | Budget |
|---|---|---|
| `AGENTS.md` | constitution: identity · roster · routing · forbidden patterns | ≤18.5k chars |
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
| product (features, requirements, screens) | `uno-blueprint` (Supabase) | `writers/blueprint` / `search_blueprint` |
| design system (components, styles, docs) | `uno-storybook` (stories + MDX in `design-system/`) | read source + stories directly |
| — | team conventions are NOT Tier 3: `docs/conventions/` is canonical in-repo (ADR-017) | loaded at Tier 2 |

## Runtime notes

- **Worker (uno-bot):** no on-demand loading. `agents/uno-bot/scripts/bundle-harness.mjs` assembles the prompt from **frontmatter, not a list**: every doc declares `embodiment: all | ide | uno-bot`, and the bundler globs four sections in order — constitution · persona · skills · conventions — sorting members by path, with a skill's `references/method.md` before its `bot.md` by rule. A doc under a section root with no `embodiment` fails the build. The result is baked into `src/generated/harness.ts`; `src/agent/skills.ts` serves that constant as one prompt-cached block. Everything in the bundle is always in context — the bot never "loads on demand", so Tier 2 is an IDE concept only. It carries 8 of the 11 conventions; `coding.md`, `tech-stack.md` and `integrations.md` declare `embodiment: ide`. Budgets for the bundled files, in chars because these are paragraph-length lines: `AGENT.md` ≤28k, each `bot.md` ≤7k (`uno-prototype/bot.md` currently 6.6k).
- The Worker does not bundle this file — it declares no `embodiment`, and nothing under a bundle section root may do that, so this file lives outside them.
- **GitHub Actions:** `scripts/lib/skill-loader.js` loads `scripts/prompts/*` with meta-stripping; offline — fine, because conventions are repo-canonical (ADR-017) and load as plain files.
