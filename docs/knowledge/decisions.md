<!-- Tier: 2 -->
---
domain: decisions
type: adr
confidence: high
created: 2026-04-11
tags: [architecture, conventions]
---

## ADR-001: AGENTS.md as single cross-agent entry point
- **Date**: 2026-03-21
- **Status**: Superseded by ADR-013 (2026-07-07)
- **Context**: Platform files (CLAUDE.md, .windsurfrules, cursorrules.md) each contained their own instructions, creating inconsistency. Non-DS tasks had no agent guidance at all.
- **Decision**: Create AGENTS.md at repo root as THE single entry point. All platform files point to it. Contains voice, forbidden patterns, skills table, progressive loading, commands.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md

## ADR-002: Vite over Next.js for prototype workspace
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Considered migrating to Next.js for auth, API routes, SSR. plus-uno does not need any of these -- it is a prototype builder, not the production platform.
- **Decision**: Stay on Vite. Upgrade to Vite 8 (Rolldown). If a production PLUS platform is built, it becomes a separate Next.js app consuming the shared design system.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/vite-8-upgrade-and-framework-decision.md

## ADR-003: Iframe embedding over proxy for Storybook
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Storybook's assets load at root paths (`/sb-manager/`, `/sb-addons/`) which bypass subpath proxy rewrites. Direct port links lose navigation context.
- **Decision**: Embed Storybook via full-screen iframe at `/storybook` route. Use `concurrently` to run both Vite (port 4100) and Storybook (port 4200) in parallel.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## ADR-004: 4-digit numeric IDs over slugs for prototype listings
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: String slugs caused naming collisions and awkward URL paths. Creator-based directory grouping did not scale.
- **Decision**: Use 4-digit numeric IDs (1001+) for all prototype listings. Flat project-oriented prototypes structure with creator info as metadata.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## ADR-005: All docs consolidated under docs/
- **Date**: 2026-03-21
- **Status**: Active for the docs/ consolidation; the `.agent/` half is obsolete — that directory no longer exists (skills live in `skills/`, agents in `agents/`, per ADR-013)
- **Context**: DS docs were split across three locations: `.agent/references/` (16 files), `packages/plus-ds/guidelines/` (16 files), and `docs/`. Confusion about where things live.
- **Decision**: Single `docs/` tree for all documentation. `.agent/` is only for skills and assets. No separate `guidelines/`, `references/`, or scattered doc directories.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md

## ADR-006: Strip npm publishing from design system package
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: `packages/plus-ds/` was configured as a publishable npm package but will never be published. Publishing config (`files`, `exports`, `prepublishOnly`) was misleading.
- **Decision**: Set `private: true`, strip all publishing fields. Keep the package where it is to avoid breaking relative path aliases in prototypes. Later flattened to `design-system/`.
- **Source**: docs/plans/2026-03-21-006-refactor-strip-npm-publishing-simplify-package-plan.md

## ADR-007: Agent-agnostic skills under .agent/skills/
- **Date**: 2026-03-21
- **Status**: Superseded by ADR-013 (2026-07-07); amended 2026-04-11 before that
- **Context**: Skills in `.claude/commands/` only work in Claude Code. Cursor and Windsurf agents cannot invoke them. Platform-specific frontmatter limits portability.
- **Decision**: All skills under `.agent/skills/` with platform-agnostic SKILL.md files. Each skill has SKILL.md + references/ + examples/ + scripts/.
- **Amendment (2026-04-11)**: Skill frontmatter MAY include `allowed-tools`, `context`, `agent`, and `disable-model-invocation` fields. These are treated as hints — Claude Code enforces them natively; other platforms ignore unknown frontmatter gracefully. This is preferred over maintaining separate platform-specific wrappers.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md

## ADR-008: Compound loop for cross-session learning
- **Date**: 2026-03-21
- **Status**: Superseded by ADR-013 (2026-07-07)
- **Context**: Learnings from bugs and gotchas were lost between sessions. Same mistakes repeated.
- **Decision**: After significant work, document in `docs/knowledge/lessons/` with YAML frontmatter. Periodically extract patterns into AGENTS.md forbidden patterns and conventions.md. The uno-compound skill codifies this.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md

## ADR-009: Bootstrap-first, no alternative UI frameworks
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: The PLUS design system is built on React-Bootstrap / Bootstrap 5.3. Introducing Material UI, Ant Design, or Tailwind would fragment the component library and token system.
- **Decision**: Use PLUS DS components first, fall back to React-Bootstrap when no PLUS equivalent exists. Never introduce non-Bootstrap UI frameworks. FA Free only (no Pro icons).
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md

## ADR-010: Three-tier context loading architecture
- **Date**: 2026-04-11
- **Status**: Superseded by `loading-order.md` (the tier contract) — Tier 1 is now exactly AGENTS.md + loading-order.md, docs/context/* is Tier 2, and Tier 3 means "retrieved live, never cached" rather than ephemeral handoffs; `.agent/handoffs/` no longer exists
- **Context**: Agent context windows are finite. The flat docs/ structure mixed always-loaded context with on-demand references. No way to distinguish essential product truth from supplementary guides.
- **Decision**: Implement three tiers: (1) Always-loaded -- identity, conventions, principles, knowledge index via AGENTS.md "See" references to `docs/context/`. (2) On-demand -- skills, detailed context, knowledge entries triggered by skill invocation. (3) Ephemeral -- tool outputs, exploration, handoffs in `.agent/handoffs/` (gitignored).
- **Source**: docs/plans/2026-04-11-001-refactor-three-tier-context-architecture-plan.md

## ADR-011: Doc splitting by task context (Index + Modules pattern)
- **Date**: 2026-03-23
- **Status**: Active
- **Context**: Monolithic docs (400+ lines) wasted 60-70% of context budget per agent interaction. Docs were written for human top-to-bottom reading, not agent load-what-you-need consumption.
- **Decision**: Each monolith becomes a lightweight index file (<20 lines) linking to focused modules. Each module gets a `<!-- Load when: ... -->` header. New docs >150 lines must be split by task context from the start. Skill SKILL.md files stay under 80 lines.
- **Amendment (2026-07-30)**: the 80-line SKILL.md cap is retired — it was a proxy for context cost, and SKILL.md files are IDE-side and never enter the Worker bundle, so their real cost is human attention. The budgets that bind are in `loading-order.md` § Tier 1 and § Runtime notes, stated in characters, because these files have paragraph-length lines. `uno-prototype` (129), `uno-research` (101), `uno-synthesize` (97), and `uno-publish` (90) exceeded the retired cap.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/2026-03-23-doc-splitting-dynamic-context-loading.md

## ADR-012: Declarative route manifest over parallel maps
- **Date**: 2026-03-17
- **Status**: Active
- **Context**: Sidebar navigation required maintaining 3 parallel maps (`pathToTab`, `pathToUserType`, inline `onTabClick` if-chain). Every navigation change required code changes in 3+ locations.
- **Decision**: Single declarative route manifest that drives routing, sidebar state, breadcrumbs, and user type. Dynamic sub-items register/unregister at runtime. Adding a new route requires only a manifest entry.
- **Source**: docs/plans/2026-03-17-001-feat-toolkit-ia-revision-plan.md

## ADR-013: Harness IA — one constitution, dual-face skills, derived agent roster (2026-07-07)

**Decision.** (1) One constitution: root `AGENTS.md` is the only identity/routing doc; `loading-order.md` is tier-1 #2; CLAUDE.md removed (AGENTS.md is read natively). (2) Six dual-face skills at `skills/`: SKILL.md (IDE) + bot.md (Worker) + references/method.md (shared core). (3) `agents/` holds roles derived from a task×skill matrix — researchers/ · reviewers/ · writers/ (the only estate writers) + the uno-bot embodiment (definition + Worker body in one folder). (4) `docs/conventions/` (normative, incl. Notion mirrors with `source:`/`synced:` provenance) split from `docs/context/` (descriptive). (5) Interaction contract: humans speak in skills · skills summon agents · agents obey conventions. (6) Placement rule: content lives with its consumer; cache the foundation, retrieve the rest (uno-blueprint = product truth, uno-storybook = DS truth, Notion = convention truth).

**Why.** The April three-tier harness drifted: the six-skill pivot existed only as prose in bot-skills/AGENTS.md; uno-synthesize was unrouteable; three skill surfaces had three loading semantics; Notion conventions had 13/20 items missing from the repo; the knowledge loop was dead since 2026-04-11. Full evidence: the 2026-07-07 plan §0.

**Supersedes.** ADR-001 (AGENTS.md entry point — strengthened: now the *only* one), ADR-007 (skills agent-agnostic under .agent/ — now top-level skills/ with per-runtime faces), ADR-008 (compound loop via uno-compound — now uno-maintain), the .agent/SKILL.md mode/pipeline router.

**Pending, closed.** The Pipedream→Cloudflare cutover outcome is recorded in ADR-014 (Status CONFIRMED live, 2026-07-08). Skill-body rewrites (plan Phase 1) landed with evals-first scenarios.

## ADR-014: uno-bot v2 — Pipedream → Cloudflare Worker (backfilled 2026-07-07 from git history)

**Original date:** 2026-06-17/18 (`fff9ca43` bot-skills to main "Tier B cutover prep", `b2a7cfee` Worker source to main).

**Decision.** The Slack bot's runtime moved from Pipedream workflows to a Cloudflare Worker (`agents/uno-bot/`, formerly `uno-bot/`): Slack events → Worker → Anthropic API with tool dispatch, thread state, and a proposal gate (side-effect tools stage a confirmation card; only the requester's ✅ executes, via `resolve_pending_proposal`). Skills load by raw-fetching repo files from GitHub at runtime (`SKILLS_BASE_URL`), prompt-cached per isolate — deploys decouple from guidance edits. Model tiering (`pickModel()`: intent → haiku/sonnet/opus, keyword-based) landed 2026-07-01 (`d892346f`, rubric dimension D2).

**Why.** Rationale not recorded in-repo; inferred from the archived Pipedream docs (`docs/knowledge/archive/`) and eval commits: Pipedream limited control over tool orchestration, state, and observability; the Worker gives one TypeScript codebase, telemetry (`c48e1c30` build tags — round-2 evals unknowingly tested a stale deployment), and subrequest-budget control.

**Amendment (2026-07-30).** Three details above are no longer true and were corrected here rather than left to mislead a reader of the log. (1) **Skills no longer raw-fetch at runtime** — the harness is baked into the Worker bundle at build time by `agents/uno-bot/scripts/bundle-harness.mjs` (it cost ~20 subrequests against a 50-cap invocation). The consequence reverses: deploys are now *coupled* to guidance edits, and the deploy workflow is `workflow_dispatch`-only, so a doc edit reaches the bot only when someone deploys. `SKILLS_BASE_URL` is deleted. (2) The gate tool is `proposal_resolve`, not `resolve_pending_proposal`. (3) **Anyone in the thread may confirm**, not only the requester — the lock was removed 2026-07-14 (`src/slack/gate.ts`). Model tiering is `pickModelTier()`.

**Status.** CONFIRMED live (closed 2026-07-08 by evidence): eval rounds 1–3 ran through Slack against the Worker — round 2 diagnosed a stale *Worker* deployment serving Slack traffic and added /health build tags in response (`c48e1c30`), which is only possible with Event Subscriptions already pointed at workers.dev. Follow-up for a Slack-app admin: retire the v1 Pipedream workflow (out of the serving path either way).

## ADR-015: uno-blueprint on Supabase as the product source of truth (backfilled 2026-07-07 from git history)

**Original date:** ≤2026-07-01 (`d892346f` D8 grounding: read-only `blueprint_search` over "the uno-blueprint Supabase"; hardened 2026-07-02 `0864cb54` with a `search_blueprint()` RPC and layer/step/scenario cell attribution).

**Decision.** Product truth (actors, phases, steps, scenarios, requirements) lives in a Supabase-hosted blueprint, queried at task time — never cached into repo docs. All agent answers about product behavior cite blueprint cells; gaps are stated, not filled ("blueprint gap honesty", scenario R11). On any requirement change, PRD and blueprint update **together** — the paired-writes contract now codified in `docs/conventions/supabase.md` and enforced by `agents/writers/blueprint.md`.

**Why.** Rationale not recorded; inferred: Notion docs drifted from reality and are slow to query programmatically; a structured store makes grounding citable (row-level) and machine-checkable, and gives prototypes a dummy-backend candidate.

**Consequences.** The Supabase schema is a hard dependency for uno-synthesize's blueprint write (rubric hard gate "schema-valid" activates when it lands). The Worker's blueprint access is read-only; writes happen in-IDE via writers/blueprint.

## ADR-016: The six-skill pivot (backfilled 2026-07-07)

**Original date:** decided early July 2026; first repo appearance 2026-07-02 (`0864cb54`: publish/share-out routing split), fully structural 2026-07-07 (ADR-013).

**Decision.** The capability set is six stage-scoped skills — research · synthesize · prototype · publish · review · maintain — mapped onto the five flows of the product-development cycle (Notion "PLUS Uno Skills Upgrade" hub, FigJam board as visual source). Replaces the seven-verb set: uno-plan dissolved (PRD/scoping → synthesize; implementation planning → prototype), uno-post → uno-publish (share-out + handoff rails, not just marketplace), uno-compound → uno-maintain (intake + tiers + sweeps + knowledge capture).

**Why.** The old verbs split by artifact, not by stage — plan/post/compound had no clean flow homes, and the bot grew parallel prose rules (bot-skills/AGENTS.md 2.4/2.6/2.7) to compensate. Stage-scoping gives every flow decision node exactly one owning skill.

**Trace.** Decision lived only in Notion + prose rules until 2026-07-07; this backfill closes the gap flagged in plan 2026-07-07-001 §0.2/§5.


## ADR-017: Conventions are canonical in the repo; Notion playbook material obsoleted (2026-07-07)

**Decision.** `docs/conventions/` is the single source of truth for team conventions. The Notion playbooks the files were distilled from (📓 Doc-Management, 🎨 Figma Workspace, the flow-doc convention fragments) are superseded — they get banners pointing at the repo, not maintenance. Headers flip from `source:/synced:` + "prefer Notion on conflict" to `status: canonical` + `distilled:` lineage. On any conflict with a legacy page, the repo wins and uno-maintain files an intake to banner the page (via writers/notion).

**Why.** (Bill, 2026-07-07, resolving plan §6 Q3): the harness lives on GitHub; keeping a second normative copy in Notion recreates the exact mirror-rot this revision was fixing — the sync problem is best solved by not having two sources. Notion remains the estate for *work* (hubs, PRDs, roadmap, templates); it just no longer owns the *rules*.

**Consequences.** The conventions-staleness sweep becomes a conventions-integrity sweep (canonicality headers, agents↔docs cross-references, superseded banners). The same treatment applies to `docs/evals/rubrics/` (distilled from the 📊 Evals page). Supersedes the mirror-provenance model in ADR-013 §(4) and the Phase-2 "middle path" in plan 2026-07-07-001 §3. One-time follow-up: banner the legacy Notion playbook pages.


## ADR-018: Gemini access is Vertex-only in production; AI Studio key is never deployed (2026-07-16)

**Decision.** uno-bot's Gemini lane always authenticates via the Vertex AI service-account pair (`GEMINI_SA_EMAIL` + `GEMINI_SA_PRIVATE_KEY`, project `hcii-plus`, region `global`). The AI Studio `GEMINI_API_KEY` must never be set as a Worker secret — it exists only as a local-dev emergency fallback. Code enforces the precedence (SA wins whenever set, `src/gemini/client.ts`) and warns loudly when it ever resolves to the API-key path.

**Why.** (Bill, 2026-07-16): during the 2026-07-16 outage (Vertex flash-model quota exhaustion, 429 RESOURCE_EXHAUSTED — not a credential problem), a Vertex-vs-AI-Studio key discussion caused config confusion, and the then-current code made it worse: the API key silently took precedence over the SA pair, so which auth/billing/data boundary served traffic depended on which secrets happened to exist. One canonical path makes credential debugging deterministic and keeps usage attributable to the hcii-plus project quota Cindy Tipper administers.

**Consequences.** Precedence flipped SA-first in `geminiConfigured`; rule documented in `wrangler.toml`, `types.ts`, `.dev.vars.example`, `README.md`, `src/gemini/auth.ts`. A 429/RESOURCE_EXHAUSTED from Vertex means project quota — the fix is a quota bump or a temporary model switch (e.g. the 2026-07-16 fallback to `gemini-2.5-pro`), never a credential swap to AI Studio.


## ADR-019: Share-out bundle — stage immediately, flag gaps loudly on the card (2026-07-16)

**Decision.** uno-bot's feedback rail stages a `shareout_post` proposal the moment a summary is in hand — it never interrogates for missing bundle pieces before staging. The confirmation card carries a code-enforced bundle audit (`proposal-render.ts: shareoutBundleNote` — Loom walkthrough / live preview / Decisions DB link for prototype share-outs); ✅ on that card is informed consent to post partial, or the user drops links in-thread and the bot folds them in. The IDE publish flow (`skills/uno-publish`) keeps its hard gate — a partial bundle never posts from there.

**Why.** (Bill, 2026-07-16, "stage, but flag gaps loudly"): the 2026-07-16 evals exposed a three-way spec contradiction — AGENT.md required "bundle complete" before staging, preflight.ts hard-REJECTED partial prototype share-outs, while the eval cases (R3/R6) expected immediate staging from a bare link. The primary model happened to satisfy the evals; the fallback model read the docs literally and asked-then-staged, which surfaced as an approval being stonewalled ("go ahead" had nothing to resolve). A renderer-level audit keeps the disclosure deterministic on any model lane while removing the ask-first round-trip.

**Consequences.** preflight.ts bundle rejection removed (min-substance summary check stays); loud audit added to the proposal card; aligned surfaces: AGENT.md dispatch row, skills/uno-publish/bot.md + SKILL.md + references/method.md, docs/conventions/slack.md, tool-definitions.json (shareout_post description), regenerated harness. Evals R3/R6 unchanged — they now match the contract.


## ADR-020: Requester-scoped Slack visibility — per-user tokens, own DMs readable in own bot DM (2026-07-16)

**Decision.** Each user can connect their own Slack history at `/oauth/slack/start`; tokens are stored per Slack user id (`slack_oauth_token:user:{U…}`, identity taken from `authed_user.id` at consent). When a connected user asks uno-bot something **in their own DM with the bot**, `slack_search` runs on THEIR token and passes through their full personal visibility — their DMs, group DMs, private channels. Outside their bot DM, or for users who haven't connected, the legacy single-token + hard firewall behavior stands unchanged (public + allowlisted private only; DMs always dropped). The legacy workspace slot is bootstrapped by the first-ever consent and never overwritten by later ones.

**Why.** (Bill, 2026-07-16, "full own-visibility"): the bot should be able to reason over conversations the requester participates in. Slack's token model enforces the participation requirement by physics — a user token can only see its owner's conversations — so per-requester tokens are the only mechanism that grants DM access without over-granting. The own-DM surface gate keeps DM-derived content out of shared spaces structurally; AGENT.md adds the matching discretion rule (requester-own results answer that requester in that DM only). Equivalent trust model to the requester pasting their own conversation; team should be told other participants' messages become bot-readable to their counterpart's requests.

**Consequences.** mcp-oauth gains identity-keyed token slots (+ keyed refresh); oauth/slack extracts and shape-validates `authed_user.id`; `getSlackAccessTokenFor(env, userId)` prefers the requester's own token; slack_search takes SlackContext, gates own-visibility on the D-channel surface, reports `visibility` and a consent-link `note`; AGENT.md + tool description updated. Follow-up (todo 019): extend `slack_thread_read` to the requester's token for reading their own DM threads by permalink.


## ADR-021: Two sources, one time axis — blueprint vs Notion authority routed by claim type and card status (2026-07-29)

**Decision.** The uno-blueprint (Supabase) is the source of truth for the **current** service journey; Notion is a mixed estate holding both stale docs and legitimate **future** state. Authority is routed per claim, not per source: how-it-works-today → blueprint; conflicting WIP/under-review card → blueprint answers today + the card is reported as a planned change, with wording calibrated to decision status ("is changing" only when decided, "might change" when exploratory); conflicting **shipped** card → blueprint still wins (the paired write updates it at ship; the shipped doc is presumed the obsolete side) — evidence the blueprint itself is stale becomes a uno-maintain intake, never a silent doc-preference; what's-planned → cards/PRDs primary, blueprint as the today-baseline for the delta; blueprint-silent + current doc (Help Center, shipped PRD) → the doc answers, cited and dated; aspirational-only docs are reported as plans, never current fact; neither source → abstain and name who fills the gap. A conflict is always surfaced, never blended. Canonical table: `docs/conventions/supabase.md` § Two sources, one time axis.

**Why.** (Bill, 2026-07-29, refining the UNO Blueprint Grounding Evaluation's design implications): the eval showed docs-only context made the agent confidently wrong (36% pass vs 100% for guided blueprint arms) and that source-conflict blending was the sharpest failure (the call-off V2 PRD case). Bill's refinement: "blueprint always wins" is wrong on the time axis — WIP cards legitimately outrun the blueprint for upcoming functionality, gated on decision status, while shipped-card docs go obsolete the moment the paired write lands. Same day, a live thread showed the bot substituting semantically-adjacent cards for a named artifact — the eval's "adjacent-but-different" risk in production.

**Consequences.** supabase.md gains the canonical routing table (contract line "Notion never the source" softened); AGENT.md gains the condensed rule + named-artifact no-silent-substitution + answer-set-=-asked-set + once-per-reply confidence cadence (stale "End with the confidence line" removed from skills/uno-review/bot.md — it contradicted the 2026-07-16 conversational ritual and caused doubled trailing clauses in production); blueprint_search/notion_search descriptions + blueprint-search.ts result notes encode conflict-surfacing, multi-layer coverage, and abstain-with-owner; uno-synthesize step 4 queries the blueprint before drafting a PRD; uno-maintain grows a 12th target (Supabase estate: blueprint-stale-vs-reality) and the post-ship check set adds a verify-blueprint intake (the headless watchdog can't read Supabase).

## ADR-022: Enforce the subrequest budget at the boundary; don't estimate it (2026-07-30)

**Decision.** `src/net.ts` owns the single outbound `countedFetch` and a per-invocation subrequest counter in AsyncLocalStorage; Durable Object stub calls (invisible to `fetch`) are charged explicitly; `scripts/check-fetch.mjs` fails the build on a bare `fetch(`, on `globalThis.fetch(`, and on any `.fetch(` outside an allowlist of charged stub calls. Grounding lookups run inside `withSubrequestLimit(LOOKUP_CEILING, …)`, and `countedFetch` **throws `SubrequestBudgetError` on the call that would cross the limit**. So the ceiling is unbreachable regardless of what a tool costs, and there is no per-tool cost table anywhere. Two things make this hold without depending on anyone remembering it. `net.ts` also meters `globalThis.fetch`, so an aliased or dynamically resolved call — the case a regex can't see — is counted and refused exactly like `countedFetch`. And every stop increments a per-invocation trip counter, which the agent loop reads either side of each tool call: a rise stamps `markPartialLookup` on the result no matter what the tool reported. Paging loops still check `subrequestBudgetSpent()` and return what they have with `truncated: true`, and best-effort catch sites still call `rethrowIfBudget(err)` — but those are now optimisations, not the safety. Delivery runs with no limit, against the real 50, protected by `DELIVERY_RESERVE`. The model round-trip stays a pre-check (`outOfIterationBudget`) rather than an enforced call: a budget stop there would mean no reply at all, which is the outcome being avoided.

**Why.** The budget was estimated twice over, and both times the estimate was the thing that could be wrong. First a hand-typed per-tool cost table with nothing comparing it to reality: it drifted — `notion_search` was priced 4 while its `apps` scope really spent 6 (2 directory pages + up to 4 power-user title lookups) — and nothing could detect it, because nothing counted. The failure is asymmetric and severe: an under-estimate lets the gate wave through a call that carries the invocation past Cloudflare's hard cap of 50, and since posting the reply is itself a subrequest, the turn dies with no message at all (👀-then-silence, live 2026-07-10 and 2026-07-13). Measuring fixed the drift but kept a forecast, because a gate that decides *before* a call can't know what the call will cost — which meant a still-hand-maintained table, still necessarily conservative (a tool bounded at 10 was refused with 9 units left even when it would have spent 2), and still coupled by hand to page caps in other modules. Enforcing at the boundary removes the prediction entirely: nothing has to be right about a tool's cost in advance, the ceiling holds anyway, and the partial-read machinery this needs (`truncated`) already existed for the same reason.

**Consequences.** ~35 call sites import `countedFetch`; `src/http.ts` is deleted (it existed only to give the same function a second name). `PRE_GROUNDING_OVERHEAD` and `GROUNDING_BUDGET` are retired in favour of `LOOKUP_CEILING = SUBREQUEST_CAP - DELIVERY_RESERVE` (38) — the same total the old pair added up to, so the gain is accuracy, not headroom: the old split could overshoot 50 whenever real startup exceeded the assumed 10, and this can't. `MAX_SUBREQUESTS_PER_TOOL`, `maxToolSubrequests`, and the spend-vs-bound telemetry are gone with the forecast. `countedFetch`'s `timeoutMs` is optional with NO default — counting is universal, a timeout is per-call-site policy, and a default silently capped the non-streaming model calls at 15s (caught in review before it shipped). `node:async_hooks` is typed by a 5-line ambient declaration rather than `@types/node`, which globally overrode `setTimeout` to return Node's `Timeout` where workerd returns a number. `/debug/eval` returns `subrequests`, a per-host breakdown, and `budget_trips`, so an eval run sees how close a turn came to the cap — and whether any read was cut short — instead of learning by outage. Two adjacent fixes rode along: `findTeamMembers` paginated unbounded (its stop condition counted rows with a Name title, which untitled rows skip), and the cron was the only unmetered entry point though `runFigmaPoll` fans out under the same cap.

**Both original caveats are closed, and how matters.** They were closed by moving each guarantee from a rule someone has to follow to a mechanism that holds without them. The guard couldn't see `const f = fetch; f(url)`, so the *global* is metered — a bypass now has to escape the runtime, not a regex — and the guard, which still runs, gained an alias rule for the one case the patch can't cover (a module-scope alias captured in a file that evaluates before `net.ts`). `rethrowIfBudget` was a convention a future `catch {}` could break silently, so the tool boundary stops relying on it: the trip counter sees a swallowed throw and a clean paging stop alike, and the model is told the read was cut short. Swallowing a stop now costs an unnecessary label instead of a false absence. Both verified in workerd, not assumed — `globalThis.fetch` is writable there, an alias captured after the patch is refused at the ceiling, and a `try { … } catch {}` around a stopped lookup still raises the trip count.

**Residual.** An alias captured at module scope in a file that evaluates before `net.ts` still escapes the meter; that is precisely what the build guard's alias rule exists to catch, so the two cover each other rather than either being airtight alone.
