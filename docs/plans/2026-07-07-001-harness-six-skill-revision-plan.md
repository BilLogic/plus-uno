# Harness Revision Plan — Six-Skill Alignment + Tool Conventions

- **Status:** in progress — tranche 1 (IA restructure) executed 2026-07-07 (`959e9c74`, `7a4ec4c0`, `4b3b3b2c`); tranche 2 (evals-first skill-body rewrites, agent roster files, rubrics + scenarios, ADR backfill) executed later same day. Open: §6 Q7 (cutover check) + D1/D4 rubric definitions; Q3/Q8-split/Q9/Q10 resolved 2026-07-07.
- **Date:** 2026-07-07
- **Source:** five-agent audit (skill best-practices research · .agent/skills audit · bot-estate audit · context/tool-reference audit · knowledge/eval audit), run against `main` @ post-2026-07-07 pull
- **Owner:** Bill

## 0. Diagnosis

The repo is a well-built April harness that June/July reality outgrew. Concretely:

1. **Three skill surfaces, three loading semantics.** `.agent/skills/` (in-IDE, progressive disclosure), `bot-skills/` via `skill-loader.js` (GitHub Actions codegen, strips meta + conditional references), `bot-skills/` via raw fetch (Cloudflare Worker — no stripping, no conditional references). The "stripped by the skill-loader" fence is a lie on the Worker path: meta sections enter the production prompt.
2. **The six-skill pivot (research / synthesize / prototype / publish / review / maintain) landed nowhere structural.** IDE skills still ship the old seven (plan/post/compound); the pivot vocabulary exists only as prose rules 2.4/2.6/2.7 inside `bot-skills/AGENTS.md`. Three of six decided skills have no SKILL.md on either surface.
3. **`uno-synthesize` is unrouteable** — on disk since June, absent from all six routing artifacts (AGENTS.md, .agent/SKILL.md, AGENT.md, loading-order.md, platform-integration.md, README).
4. **Team conventions live in Notion with near-zero repo mirror**: of ~20 Notion-authored convention items (write-surface allowlist, Roadmap DB rules, hub spec, Figma workspace playbook, Slack share-out/verdicts, blueprint contract), 2 covered / 5 partial / 13 missing. `docs/context/conventions/integrations.md` lists 1 of 6 connected tools.
5. **Knowledge loop dead since 2026-04-11; eval program has no repo footprint.** The entire v2-bot era (Pipedream→Cloudflare, Supabase blueprint, cutover, D1–D8 eval passes) produced zero ADRs/lessons; telemetry is one ephemeral `wrangler tail` log line.
6. **Both staleness guards are inert** — `validate-doc-links.sh` no-ops (hard `rg` dependency, not installed) and `sync-checklist.md` is orphaned. This is *how* 1–5 happened silently.
7. **Live config gaps:** `uno-bot/wrangler.toml` has `PLUS_DESIGN_CHANNEL_ID=""` (share-out fan-out silently falls back to origin thread) and `NOTION_DS_COMPONENT_DB_ID=""` (DS-component PRDs mis-file to the Roadmap board).

## 1. Phase 0 — Stop the bleeding (hours, no design decisions)

- [ ] Register `uno-synthesize` in all six routing artifacts (exact lines in audit: AGENTS.md:44-51, .agent/SKILL.md:16-40, AGENT.md:8-19, loading-order.md:27-34, platform-integration.md:23, README.md:41-83).
- [ ] Fix `validate-doc-links.sh` — fall back to `grep -r` when `rg` is absent (or add rg to setup); a guard that silently no-ops is worse than none.
- [ ] Fix `disable-model-invocation` inversion: add to `uno-post` (its body says "Never auto-invoke"), remove from `uno-plan`. Add missing `allowed-tools` to prototype/review/post/compound per the router's own contract.
- [ ] Fill `wrangler.toml` secrets: `PLUS_DESIGN_CHANNEL_ID`, `NOTION_DS_COMPONENT_DB_ID` (values from Bill — see §6 Q8).
- [ ] Lint fixes: stray `i ` at `uno-prototype/references/finalization.md:1`; loading-order.md:7 line count; dead pointers `figma-mcp-guide.md:63` (plan-005 → superseded), `figma-sync-workflow.md:118` (`uno-assist` → `uno-qa`).
- [ ] Resolve the 2.5-month-untracked limbo: `docs/rubrics/`, `hd-config.md`, `docs/knowledge/lessons/2026-04-19-harness-audit.md` (see §6 Q4; the audit lesson gets committed regardless — it's accurate history).

## 2. Phase 1 — Six-skill realignment of `.agent/skills/`

Migration map (from audit):

| Current | Action | Notes |
|---|---|---|
| `uno-research` | keep + re-aim | Codebase-first → instrument-first (Slack/analytics/SME studies, study-guide-before-conversation). Keep Explore-fork mechanics. |
| `uno-synthesize` | keep + register | Already written to the target model; the only one. |
| `uno-prototype` | keep + rewrite | Add fidelity routing (low/mid/high/hand-craft); absorb uno-plan's implementation-planning step; relink or prune its 18/18 orphaned references (4 are mode-era ghosts). |
| `uno-post` | **rename `uno-publish`** + expand | Share-out bundle (Loom + preview + Figma replica + decision log — bundle completeness is a hard gate), handoff rail incl. Handoff Spec doc (Notion Templates #9), dev/PM/stakeholder sign-off. Marketplace entry (the current content) is ~25% of the target. |
| `uno-review` | keep + rewrite | Stage lenses DS / UNO / a11y (checklist currently has zero a11y items), Design QA vs Figma spec at Ready-for-QA, Slack gate protocol. Hand its skill-quality audit path to uno-maintain. |
| `uno-plan` | **dissolve** | PRD/scoping → synthesize; component/file/token planning → prototype. (§6 Q1) |
| `uno-compound` | **fold into new `uno-maintain`** | Compound's knowledge capture + its orphaned refs (`maintaining.md`, `runbook.md`, `sync-checklist.md`) are literally the proto-maintain content. Add: intake, Tier 1 auto-apply + weekly digest, Tier 2 PR+PRD+Slack review, cross-estate sync (code/Figma/Notion/blueprint). |

Cross-cutting, per the best-practices research (platform.claude.com best-practices + agentskills.io spec):

- **Single-source the skill roster.** It currently exists in 4+ places and drifted in all. One canonical table (AGENTS.md), everything else points at it or is generated.
- Descriptions: third person, WHAT + WHEN with trigger keywords, ≤1024 chars. Bodies ≤500 lines. References one level deep, linked explicitly from SKILL.md, TOC for files >100 lines. State execution intent ("Run X" vs "See X").
- **Purge the mode-era ghost layer** (6 legacy reference files cross-routing to modes that no longer exist) — archive under `docs/knowledge/` if history matters, else delete.
- Portability: keep spec-standard frontmatter (`name`, `description`, `compatibility`, `metadata`, `allowed-tools`) as the base; treat Claude-Code extensions (`context: fork`, `disable-model-invocation`, …) as deliberate and documented, since bot-skills prove multi-runtime consumption is real here.
- **Evals before docs:** for each rewritten skill, write ≥3 eval scenarios (query + expected behavior) *first*, baseline without the skill, then write the minimal skill that passes (§4 ties in).

### Phase 1b — two tier-1 docs, two folders (revised 2026-07-07, per Bill)

**`.agent/` dissolves entirely.** The reading order for any agent entering the repo becomes exactly two files, then two folders:

1. **`AGENTS.md`** (root) — THE core doc: constitution + roster + routing table. Absorbs `.agent/SKILL.md` (the router table is small once skill descriptions carry their own triggers) and `.agent/AGENT.md` (identity). Three files currently claim to define the agent; one survives. **`CLAUDE.md` is deleted too** — Claude Code reads AGENTS.md natively; re-add the one-line shim only if a teammate's tooling misses it.
2. **`loading-order.md`** — promoted to root as tier-1 #2: the loading contract, with the single Tier-2 table.
3. **`agents/`** (top level) — WHO: embodiments + specialist roles.
4. **`skills/`** (top level) — HOW: the six dual-face capability folders (`.agent/skills/` moves here; `.agent/handoffs/` deleted; `.agent/scripts/validate-doc-links.sh` → `scripts/`).

**`agents/` roster v2 — derived, not invented (revised 2026-07-07 ×2).** Method: walk every skill and every standing automation, list concrete recurring tasks, promote a task to an agent only when it passes the creation rule (≥2 invocation sites, or isolated-context benefit: heavy reads, parallel lenses, headless execution). **13 roles, three plain kinds + the embodiment** — researchers/ + reviewers/ + writers/ — many-to-many with skills. **Built on first invocation, not up front.** Naming: category = kind of work, file = specialty; users never memorize agents (interaction contract below).

| Agent | Concrete task | Invoked by | Automations |
|---|---|---|---|
| `uno-bot/` (embodiment: AGENT.md + tool-definitions.json + Worker src/wrangler — definition and body in one folder; top-level uno-bot/ goes away) | Slack conversations, proposals, tool dispatch | all six via bot.md faces | event-driven |
| `researchers/explorer` | codebase/repo exploration, findings not file dumps | research · prototype (grounding) | — |
| `researchers/source-miner` | Slack-thread + analytics + research-DB sweeps → cited findings | research · maintain (intake evidence) | — |
| `researchers/people-scout` | SME/participant sourcing via Team DB + intro drafts | research · uno-bot `find_experts` | — |
| `reviewers/ds-lens` | DS conformance (tokens, real components, no lookalikes) | review · prototype (validate) | — |
| `reviewers/uno-lens` | product-intent conformance vs PRD + blueprint | review | — |
| `reviewers/a11y-lens` | contrast, focus order, labels, targets | review | — |
| `reviewers/design-qa` | Figma spec vs QA site, H7 checklist, severity verdicts | review | RTT trigger |
| `reviewers/rubric-applier` | apply any named rubric → scored verdict → eval-runs entry | maintain audits · every skill's quality bar | eval logging |
| `writers/notion` | every Notion write — hubs, templates, properties, mentions, PRD + handoff-spec prose — per conventions/notion.md + writing-style.md | synthesize · publish · maintain · uno-bot `create_prd` | comment sweep |
| `writers/figma` | file naming, placement prefixes, replica frames, annotation writing (incl. handoff notes on canvas) | prototype · publish · maintain | hygiene sweep |
| `writers/blueprint` | grounding reads; **paired PRD+blueprint writes, never one alone** | synthesize · maintain · uno-bot `blueprint_search` | — |
| `reviewers/auditor` | run a named registry checklist against an estate → file intakes | maintain · retro | watchdog · staleness sweeps · ⏳/comment escalation |

**Composition rules:** (1) **Writing is not a role** — voice lives once in `conventions/writing-style.md` (mirrors the Notion playbook §4a + ux-writing rubric) and every steward and skill applies it to human-facing text. Grounding: a handoff note is a Figma annotation, a PRD is a Notion doc, a PR description is a repo write — every write happens *in* an estate, so a standalone copywriter would double-dispatch every write. Slack text belongs to uno-bot — the embodiment IS the Slack actor, no Slack steward needed. (2) **The auditor inspects and files; writers fix** — `writers/` are the only agents with write access to external estates. (3) **Every `automations.md` row names its agent** — an automation without an agent is unowned by definition.

**Interaction contract:** humans speak in skills (remember six, or let the agent route) · skills summon agents · agents obey conventions. Agent names are for maintainers and skill authors, never for users — onboarding.md teaches only the six skills.

**Agents ↔ docs non-duplication rule (adopted):** agents *point to* the docs they enforce (rubric, conventions file) and never restate their content; docs may carry a one-line "applied by `agents/<name>`" pointer back. A rule lives exactly once. The uno-maintain staleness sweep checks these cross-references both ways.

**Creation rule:** a new agent needs ≥2 invocation sites or a demonstrated isolated-context benefit — never speculative.

Division of labor: **skills = how · agents = who · methods = the runtime-neutral core · conventions = the rules of the estate.**

## 3. Phase 2 — Tool-convention references (Notion / Figma / Slack / Supabase)

**Architecture: shared Tier-2 convention files, mirrored from Notion with provenance headers.**

Create `docs/context/conventions/`:

- `notion.md` — write-surface **allowlist** (agent writes ONLY to named surfaces), Roadmap DB property rules (Contributor mandatory default Bill; Product Pillar always + pillar→Slack-channel map; link only EXISTING Feature/OKR relations; **exact-match select options** — Notion silently auto-creates on mismatch, a live data-corruption footgun for `create_prd`; Intake Status), project-hub golden sections (TLDR → People @-mentions → Now/Next/Blocked → Latest progress → Key references → Pages → Doc Changelog in toggle), the 9 template pointers, enhanced-markdown quirks (`<mention-user url="user://<id>"/>`; embeds manual-only → link + 📌 placeholder; child-page blocks contiguous; suggestions-about-content → comments which the agent sweeps; proposed content → yellow + `⏳ PENDING REVIEW:`).
- `figma-workspace.md` — canvas/Dev-Mode annotations = agent-readable vs comment pins = human-only; annotation category labels (Interaction/Content/Layout/Token-Style/Behavior/Accessibility); `[wip]/[spec]/[replica]/[archive]` placement prefixes; file naming `<Pillar> · <Project> · RM-<cardID>`; pages 0 Cover / 1 Official / 2 Playground / 3 Archive; **RM-ID as the Figma↔Notion join key** (replaces today's manual thread-pasting).
- `slack.md` — share-out post shape (required bundle, ≤3 feedback questions, NOT-looking-for line); reviewer verdicts ✅ / 🔁 / ❌ (distinct from the bot's proposal-confirmation ✅/❌ — name both so they never conflate again); channels (#plus-design, #figma-sync, pillar→channel map for @here).
- `supabase.md` — uno-blueprint is the product source of truth; **PRD + blueprint update together** on any requirement change; read/write contract per skill (synthesize/maintain write, others read); dummy-backend candidacy.

Each file's frontmatter: `source: <notion-page-url>`, `synced: YYYY-MM-DD`, staleness rule ("if a live Notion read contradicts this file, prefer Notion and file a uno-maintain intake"). Pointer-only fails the offline/CI constraint; mirror-without-provenance is how integrations.md rotted — this is the middle path.

Then:
- [ ] Rewrite `integrations.md` as the routing index over these four + Figma-MCP/Loom/Netlify pointers (kill the dead `sync-figma-tokens.yml` pointer).
- [ ] Update `terminology.md` (add uno, uno-bot, uno-blueprint, uno-storybook, shareout, pillar, replica, Tier 1/2, RM-ID), `agent-persona.md` (six-skill roster; carve blueprint read/write out of "database out of scope"), `product/plus-uno.md` (add uno-bot/ + bot-skills/ to the layout; Actions are live, not "planned"), `tech-stack.md` (Worker, Supabase, Netlify).
- [ ] Skills declare which convention files they load in the Tier-2 table; bot faces reference the same paths (raw-fetch can reach any repo path).

### Phase 2b — docs/ ontology (added 2026-07-07, per Bill)

`docs/` maps cleanly onto the five-layer harness model; everything that doesn't fit rehomes by the placement rule (content lives with its consumer):

**Context and conventions split** (Bill, 2026-07-07): different nature, different cadence, different consumers — `docs/context/` is *descriptive* (WHAT IS: evolves with the product, edited freely) while `docs/conventions/` is *normative* (WHAT MUST BE: change-controlled, mirrored from Notion where applicable, loaded by all three runtimes). `agent-persona.md` folds into AGENTS.md — the constitution includes the persona.

| Path | Layer | Contract |
|---|---|---|
| `docs/context/` | L1 | **Descriptive — WHAT IS**: product/ (**foundation only** — identity, pillars, user archetypes, system shape incl. Worker flowcharts), design-system/ (**same boundary rule vs uno-storybook**: foundation docs — principles, a11y, token philosophy — plus cheat-sheet/components-index/inventory as **generated mirrors** with provenance headers, regenerated by automation like the existing Figma-snapshot job; component + style documentation lives in uno-storybook's 364 stories/MDX beside the code, never hand-duplicated here; content-voice.md merges into conventions/writing-style.md), **onboarding.md** (rewritten from stale setup-guide.md). **Context-vs-blueprint boundary (Bill, 2026-07-07): cache the foundation, retrieve the rest** — live product truth (feature specs, current requirements, screen inventory) is queried from uno-blueprint at task time via writers/blueprint, never cached; any context file restating blueprint content carries a provenance header like the Notion mirrors, or gets deleted. |
| `docs/conventions/` | L1 | **Normative — WHAT MUST BE**: the four tool mirrors (notion, figma-workspace, slack, supabase — provenance headers), terminology.md, coding.md, tech-stack.md, **writing-style.md** (voice, applied by every steward + skill), **automations.md** (each row: trigger · skill · **agent** · implementation · owner). |
| `skills/` (top level) | L2 | Six capability folders: SKILL.md + bot.md + references/ (method.md) + **scripts/ for that skill's own deterministic checks** — single-skill scripts live here, not in /scripts. |
| AGENTS.md routing table + `agents/` | L3 | Orchestration — routing, the 14-role roster (Phase 1b), the Worker (agents/uno-bot/). |
| `docs/evals/` | L4 | **One quality folder** — `rubrics/` (criteria: what "good" means, per artifact type) + `scenarios/<skill>.md` (test cases, ≥3, written before the skill) + `runs/*.jsonl` (results, until the Notion Eval Runs DB). Criteria, tests, results are one loop — no separate docs/rubrics/. |
| `docs/knowledge/` | L5 | Episodic, append-only: lessons, ADRs, changelog, **research/** (the Week-1 platform-decision records move here) and **archive/** (the one clearly-labeled graveyard: pipedream docs, v1 figma-sync-workflow.md, figma/ vendor snapshot). |
| `docs/plans/` | — | Dated working intentions; status hygiene enforced at retro. |
| `/scripts/` | — | **Multi-consumer tooling only**: Actions codegen (prompts/, lib/skill-loader.js, poll + implement scripts) and repo-wide guards (validate-doc-links.sh). Placement by consumer. |

**Single docs tree** (Bill, 2026-07-07): flowcharts (current architecture) → `docs/context/`; uno-bot-v2-cutover.md closes as an outcome ADR + `knowledge/archive/`.

Kills the current grab-bag: five loose files/dirs at docs/ root (setup-guide, figma-sync-workflow, figma/, flowcharts/, research/) all get a home with a contract.

## 4. Phase 3 — bot-skills/ dissolves entirely (revised again 2026-07-07, per Bill)

**Decision: no bot-skills folder at all.** The Worker raw-fetches arbitrary repo paths, so nothing binds it to a dedicated directory. Every part rehomes by *who consumes it*:

| bot-skills/ content | New home | Why |
|---|---|---|
| Six capability bodies (research, synthesize, marketplace→publish, critique→review, maintain/publish/review prose rules 2.4/2.6/2.7) | **`bot.md` inside each `.agent/skills/uno-*/`** | One folder = the whole capability, both runtime faces. Each bot.md is ~30 lines (tool payloads, proposal gate, mrkdwn output) and loads the same `references/method.md` its SKILL.md sibling loads. |
| AGENTS.md persona + Slack etiquette + proposal gate + `uno-qa` (the default conversational mode) | **`agents/uno-bot/AGENT.md`** | One constitution (root AGENTS.md); each embodiment carries only a persona *delta*. The Worker code moves into the same folder (see Phase 1b). |
| `uno-implement/`, `uno-implement-design/`, `lib/skill-loader.js` | **`scripts/prompts/` + `scripts/lib/`** | Their only consumer is the Actions codegen scripts. Bodies slim to adapters over coding.md + the DS cheat-sheet. |
| `tool-definitions.json` | **`agents/uno-bot/`** | Already imported by the Worker's TypeScript, which now lives in the same folder. |
| pipedream docs, v1 setup-guide, parked `uno-critique` | **`docs/knowledge/archive/`** | Historical; salvage critique bits into review's method.md. |

Worker `SKILL_PATHS` becomes: `agents/uno-bot/AGENT.md` + `skills/*/bot.md` + each skill's `references/method.md` + `docs/context/conventions/*.md`. Meta-strip fix still applies. Single docs tree: flowcharts → `docs/context/` (current architecture), the cutover doc closes as an outcome ADR + `knowledge/archive/`.

### Phase 3b — automations become first-class (added 2026-07-07, per Bill)

Automation logic is currently welded into wherever it happened to be built (Figma poll in Actions, gates/fan-out in Worker code, digest/watchdog unbuilt). Two moves:
1. **Registry now:** `docs/context/automations.md` — one row per standing automation (trigger · skill/method it runs · implementation pointer · config · owner): figma-library poll, shipped watchdog, weekly Tier-1 digest, Design QA trigger at RTT, Figma hygiene sweep, conventions staleness sweep. This is the machine-side mirror of the Notion playbook's standing-rituals table; an automation absent from the registry is undocumented by definition.
2. **Migration principle, applied opportunistically:** each automation should *invoke a skill's method*, not embed its own copy of the logic (the figma-poll's PRD creation is synthesize's method; the digest is maintain's; Design QA is review's). Migrate one automation at a time, whenever it's next touched — no big-bang rewrite.

**Why not load SKILL.md directly in the bot:** IDE bodies reference Read/Grep/Task, file paths, and progressive disclosure — meaningless in the Worker, which has no skill discovery (everything concats up front) and answers in mrkdwn under a token cap. The `bot.md` face carries only that delta.

**Placement rule (adopted, applies everywhere): content lives with its consumer; content with many consumers lives in `docs/context/`.** One-to-one → colocate; many-to-many → shared layer.

**Named tradeoff:** `.agent/skills/` folders now carry a non-spec `bot.md` support file. Spec-legal (skills may contain arbitrary support files; unreferenced files never load into the IDE agent), but each bot.md gets a one-line header saying "Worker face — not loaded by the IDE agent" to prevent accidental pickup, and skill edits now touch bot behavior — CODEOWNERS or the review checklist should flag `bot.md` diffs for a bot-side sanity check.
- [ ] Fix loader semantics: give the Worker path the same meta-stripping as skill-loader.js (small shared strip function fetched or ported to TS), or move meta sections out of SKILL.md bodies entirely.
- [ ] Keep `uno-qa`, `uno-implement`, `uno-implement-design`, `uno-marketplace` as bot-verb extras — document them as such in bot-skills/README.
- [ ] Doc rot: mark `docs/figma-sync-workflow.md` superseded (banner → `docs/uno-bot-v2-cutover.md`); archive pipedream-workflow.md / pipedream-snippets.md / v1 setup-guide; fix bot-skills/README roster (missing 3 shipped skills); fix uno-bot/README ("not yet wired" is false); record cutover completion status once confirmed (§6 Q7).
- [ ] Flow 4/5 gap (build later, but plan now): Tier 1/2 intake classification, weekly digest, reviewer-verdict gate with 🔁 handling and routed reviewers — currently zero code; the existing gate.ts is proposal-confirmation only.

## 5. Phase 4 — Knowledge + eval revival

- [ ] **Backfill ADRs** for the undocumented era: Pipedream→Cloudflare Worker; uno-blueprint→Supabase as source of truth; six-skill pivot; bot-skills as second (deliberate) skill tree; model tiering; skills-as-raw-fetch. Without these, ADR-001/-002/-007/-008 read as current and mislead.
- [ ] Plans hygiene: flip the 10 stale `status: active` plans to `completed`/`superseded`; import the out-of-repo v2 plan (`~/.claude/plans/piped-riding-melody.md`) into docs/plans/ so teammates can read the era's biggest decision.
- [ ] **Commit the D1–D8 rubric into the repo** (docs/rubrics/ or docs/context/) — today it exists only in commit-message archaeology; if the external copy is lost, the repo has no record of what "good" means.
- [ ] Eval plumbing: add an eval-run write tool to tool-definitions.json + flow-exit logging (target: Notion Eval Runs DB once created; interim: repo JSONL). Persist Worker telemetry (currently `wrangler tail`-only).
- [ ] Handoffs mechanism: kill or keep (§6 Q5) — today it's zombie infrastructure referenced by three orchestration docs with zero files ever written.
- [ ] Restart the loop through **uno-maintain**: knowledge capture is one of its Tier-1 duties; INDEX.md's "via uno-compound" pointer updates with the rename.

## 6. Decisions (updated 2026-07-07 after Bill's review)

1. ✅ **Dissolve `uno-plan`** — synthesize takes PRD/scoping, prototype takes implementation planning.
2. ✅ **Resolved by the Phase-3 dissolution** (Bill, 2026-07-07): every capability's runtime-neutral core lives at `.agent/skills/uno-<skill>/references/method.md`, loaded by both faces (SKILL.md and bot.md) of the same folder. No parallel copies exist to sync.
3. ✅ **Convention-file sync — dissolved by canonicality flip** (Bill, 2026-07-07): the harness lives on GitHub; `docs/conventions/` is canonical and the Notion playbook material is obsoleted (ADR-017). No sync problem remains — the monthly sweep becomes an *integrity* sweep (canonicality headers, cross-references, superseded banners on legacy pages).
4. ✅ **Rubrics: rebuild from scratch** (don't salvage the broken-linked starters) and wire into uno-review. **Delete `hd-config.md`.** Commit the 2026-04-19 audit lesson (accurate history).
5. ✅ **Delete `.agent/handoffs/`** + its references in the three orchestration docs.
6. ✅ **Eval runs: repo JSONL interim store now**; migrate to the Notion Eval Runs DB when created.
7. ✅ **Cutover confirmed by evidence** (2026-07-08): eval rounds 1–3 (07-01 → 07-07) ran through Slack against the Worker — round 2 specifically diagnosed a stale *Worker* deployment serving Slack traffic (`c48e1c30` added /health build tags for exactly this), impossible unless Event Subscriptions already pointed at workers.dev. Remaining: whoever holds Slack-app admin (not Bill) disables/retires the v1 Pipedream workflow at leisure — it is no longer in the serving path.
8. ✅ **Config values resolved** (Slack + Notion lookups, 2026-07-07):
   - `PLUS_DESIGN_CHANNEL_ID` → `#plus-design` `C03FC8AS69K` (review fan-out). ✅ Split CONFIRMED (Bill, 2026-07-07): review requests/verdicts → #plus-design, share-out bundles → #plus-design-feedback `C074QG2V7DJ` — slack.md stays as written; add a share-out channel var when Flow 3 posting is wired.
   - `NOTION_DS_COMPONENT_DB_ID` → database `342b7cca-4982-80b1-b305-f9e0e581ef48` (data_source `342b7cca-4982-80b9-9cf7-000b8cc726a5` — use whichever the Worker's parent param expects).
   - Pillar→channel map: Universal → `#plus-universal` `C072E8SFLKV` · Admin → `#plus-admin` `C089A3E9CCW` · Toolkit → `#plus-toolkit` `C08925VDFF1` · Training → `#plus-training` `C07L5RZV6DR` · Marketing → `#plus-marketing` `C052BG9NE86`. Tutoring + Help Center pillars: no channel yet (flag at retro).
   - ⚠️ All pillar channels are **private** — uno-bot must be invited to each before posting/@here works.
   - ⚠️ **No `#figma-sync` channel exists** — the Figma-sync channel is actually `#uno-bot` `C0ARJ2A3A69`. Docs referencing #figma-sync need correcting.
9. ✅ **Handoff blueprint-write ownership** (Bill, 2026-07-07): keep the maintain routing — publish hands the blueprint update to uno-maintain as a pre-authorized action inside the designer-confirmed handoff; writers/blueprint stays scoped to synthesize/maintain.
10. ✅ **Apply-log home** (Bill, 2026-07-07): `docs/evals/runs/apply-log.jsonl` interim, migrating with the Eval Runs DB — wired into maintain method §5 + evals README. Still open: bot-answer rubric dimensions **D1/D4 definitions unrecovered** — Bill to fill (docs/evals/rubrics/bot-answer.md).

## 7. Sequencing & effort

Phase 0 is a single sitting. Phases 1–2 are the bulk (est. 2–3 focused sessions; skills rewritten one at a time, eval scenarios first). Phase 3 rides behind 2 (convention files must exist before bot skills point at them). Phase 4 is parallelizable except ADR backfill, which should happen while memory is fresh. Per the live-testing rule: each rewritten skill gets one live run before it's declared done.
