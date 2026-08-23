---
status: approved
date: 2026-08-23
summary: Rebuild the harness IA — three content classes, one home each; delete the dead pipelines; make every roster glob- or frontmatter-derived.
---

# Agent harness IA rebuild — plus-uno

Full audit, findings and rationale: the harness-audit artifact (2026-08-23).
Decided in a `grill-with-docs` session; this file is the executable half.

## The model

| Class | Authored by | Home | Human path |
|---|---|---|---|
| Facts | nobody (generated) | `index.md` / `*.index.json`, beside their source | Storybook autodocs |
| Protocol | agent-first | `docs/` · `skills/` · `agents/` · `design-system/guidelines/` | Storybook renders the file raw |
| Narrative | human-first | `*.mdx` beside the component | Storybook |

Laws: `overview.md` authored / `index.md` generated · `embodiment: all|ide|worker` frontmatter decides bundling · five root files (README · SETUP · CONTEXT · INDEX · AGENTS) · a connector gets a doc when an agent can act on it, a folder when it needs a second topic.

## Stages (each green before the next)

1. **Drift** — n/a here; see the uno-blueprint plan.
2. **Delete dead** — 56 `agent-views` stubs + their generator path · `marketplace-add.yml`, `marketplace-edit.yml` + the bot's dispatch · stale `uno-bot-flowcharts` · `tech-stack.md` version table · AGENTS.md commands table. Gate: `check:docs`.
3. **Facts + naming** — generated artifacts into the folder they describe; `component-registry.json` → `components.index.json`, `token-registry.json` → `tokens.index.json`, `component-figma-links.md` → `connectors/figma/links.index.md`, `knowledge-audit.md` → `guidelines/coverage.index.md`. Gate: every `check:*` passes.
4. **guidelines/** — collapse `design-system/docs/` + `docs/context/design-system/` + `design-system/figma/*.md` into `design-system/guidelines/`; foundations scaffolded to Atlassian's 14 (gaps: motion, illustrations, logos, border, radius) with `content/` per Atlassian; `composition/` = layout · hierarchy · surfaces · forms. Gate: no topic authored twice.
5. **docs/** — `connectors/` (notion, figma, slack, supabase, github as folders; cloudflare, netlify, storybook-mcp flat) · `engineering/` (codebase-guide, coding, testing, operations) · `product-and-service/` · `adr/`. Dissolve `docs/context/`, `integrations.md`, `automations.md`, `writing-style.md`. Root `CONTEXT.md` (was `terminology.md`), root `INDEX.md` generated with summaries + role reading paths, root `SETUP.md`. Gate: INDEX lists every doc.
6. **AGENTS.md** — fold `loading-order.md` in; grid + Storybook-IA contracts out to `guidelines/`; prohibitions gain positive twins, no-ops deleted; bundler reads frontmatter instead of `SKILL_PATHS`/`NOT_BUNDLED`. Gate: eval suites on the PR, rewrite isolated in its own commit.
7. **knowledge → decisions** — all 49 files promoted to a rule, converted to an ADR, or deleted; ADRs verified against code, not ported. Gate: `docs/knowledge/` gone.

## Open, deliberately

- Rule ratification: every AGENTS.md rule with no ADR and no sign-off, listed for one review pass. The two-vocabularies law is the known case.
- Skills + uno-bot sweep: two faces per skill, ADR-011's 80-line bar (violated 4/6), routing-table dedup, persona extraction from `slack.md`. Own phase, own eval run.
- MDX narrative audit: 387 files unchecked for duplication against `guidelines/`.
- Marketplace: repo data file vs Notion DB when they disagree — GitHub issue, not decided here.
- `todos/` → GitHub Issues; open plans → issues, finished ones stay as history.
