# Loading Order — the tier contract

<!-- Tier: 1 — doc #2 of exactly two always-loaded files. -->

Two files load always; everything else loads on demand or is retrieved live. Budgets are targets, not suggestions — a tier that bloats defeats the tier.

## Tier 1 — always loaded (~210 lines total)

| File | Role | Budget |
|---|---|---|
| `AGENTS.md` | constitution: identity · roster · routing · forbidden patterns | ≤150 lines |
| `loading-order.md` | this contract | ≤60 lines |

## Tier 2 — loaded on demand (the only Tier-2 table; nothing else may duplicate it)

| Consumer | Loads | When |
|---|---|---|
| any skill, on invocation | its `skills/<name>/SKILL.md` (IDE) or `bot.md` (Worker) + `references/method.md` | always for that skill |
| skill references | `skills/<name>/references/*.md` — one level deep, linked from SKILL.md | as linked |
| any agent, on summon | its `agents/<kind>/<name>.md` + the conventions it names | always for that agent |
| any estate write | the matching `docs/conventions/{notion,figma-workspace,slack,supabase}.md` | before writing |
| any human-facing text | `docs/conventions/writing-style.md` | before writing |
| UI building | DS cheat-sheets per AGENTS.md § Progressive loading | mandatory triggers |
| orientation / product framing | `docs/context/*` | as needed |

## Tier 3 — retrieved live, never cached

| Truth | Source | Access |
|---|---|---|
| product (features, requirements, screens) | `uno-blueprint` (Supabase) | `writers/blueprint` / `blueprint_search` |
| design system (components, styles, docs) | `uno-storybook` (stories + MDX in `design-system/`) | read source + stories directly |
| — | team conventions are NOT Tier 3: `docs/conventions/` is canonical in-repo (ADR-017) | loaded at Tier 2 |

## Runtime notes

- **Worker (uno-bot):** no on-demand loading — `agents/uno-bot/src/agent/skills.ts` `SKILL_PATHS` concats AGENTS.md + AGENT.md + all `skills/*/bot.md` + methods + conventions into one prompt-cached block. Keep bot.md files ≤60 lines for this reason.
- **GitHub Actions:** `scripts/lib/skill-loader.js` loads `scripts/prompts/*` with meta-stripping; offline — fine, because conventions are repo-canonical (ADR-017) and load as plain files.
