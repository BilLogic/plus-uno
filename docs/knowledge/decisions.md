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
- **Status**: Active
- **Context**: Platform files (CLAUDE.md, .windsurfrules, cursorrules.md) each contained their own instructions, creating inconsistency. Non-DS tasks had no agent guidance at all.
- **Decision**: Create AGENTS.md at repo root as THE single entry point. All platform files point to it. Contains voice, forbidden patterns, skills table, progressive loading, commands.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md

## ADR-002: Vite over Next.js for prototype workspace
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Considered migrating to Next.js for auth, API routes, SSR. plus-uno does not need any of these -- it is a prototype builder, not the production platform.
- **Decision**: Stay on Vite. Upgrade to Vite 8 (Rolldown). If a production PLUS platform is built, it becomes a separate Next.js app consuming the shared design system.
- **Source**: _archive/solutions/agent-infrastructure/vite-8-upgrade-and-framework-decision.md

## ADR-003: Iframe embedding over proxy for Storybook
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Storybook's assets load at root paths (`/sb-manager/`, `/sb-addons/`) which bypass subpath proxy rewrites. Direct port links lose navigation context.
- **Decision**: Embed Storybook via full-screen iframe at `/storybook` route. Use `concurrently` to run both Vite (port 4100) and Storybook (port 4200) in parallel.
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## ADR-004: 4-digit numeric IDs over slugs for prototype listings
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: String slugs caused naming collisions and awkward URL paths. Creator-based directory grouping did not scale.
- **Decision**: Use 4-digit numeric IDs (1001+) for all prototype listings. Flat project-oriented prototypes structure with creator info as metadata.
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## ADR-005: All docs consolidated under docs/
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: DS docs were split across three locations: `.agent/references/` (16 files), `packages/plus-ds/guidelines/` (16 files), and `docs/`. Confusion about where things live.
- **Decision**: Single `docs/` tree for all documentation. `.agent/` is only for skills and assets. No separate `guidelines/`, `references/`, or scattered doc directories.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md

## ADR-006: Strip npm publishing from design system package
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: `packages/plus-ds/` was configured as a publishable npm package but will never be published. Publishing config (`files`, `exports`, `prepublishOnly`) was misleading.
- **Decision**: Set `private: true`, strip all publishing fields. Keep the package where it is to avoid breaking relative path aliases in prototypes prototypes. Later flattened to `design-system/`.
- **Source**: docs/plans/2026-03-21-006-refactor-strip-npm-publishing-simplify-package-plan.md

## ADR-007: Agent-agnostic skills under .agent/skills/
- **Date**: 2026-03-21
- **Status**: Amended (2026-04-11)
- **Context**: Skills in `.claude/commands/` only work in Claude Code. Cursor and Windsurf agents cannot invoke them. Platform-specific frontmatter limits portability.
- **Decision**: All skills under `.agent/skills/` with platform-agnostic SKILL.md files. Each skill has SKILL.md + references/ + examples/ + scripts/.
- **Amendment (2026-04-11)**: Skill frontmatter MAY include `allowed-tools`, `context`, `agent`, and `disable-model-invocation` fields. These are treated as hints — Claude Code enforces them natively; other platforms ignore unknown frontmatter gracefully. This is preferred over maintaining separate platform-specific wrappers.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md

## ADR-008: Compound loop for cross-session learning
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: Learnings from bugs and gotchas were lost between sessions. Same mistakes repeated.
- **Decision**: After significant work, document in `docs/knowledge/lessons/` with YAML frontmatter. Periodically extract patterns into AGENTS.md forbidden patterns and conventions.md. The uno-compound skill codifies this.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md

## ADR-009: Bootstrap-first, no alternative UI frameworks
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: The PLUS design system is built on React-Bootstrap / Bootstrap 5.3. Introducing Material UI, Ant Design, or Tailwind would fragment the component library and token system.
- **Decision**: Use PLUS DS components first, fall back to React-Bootstrap when no PLUS equivalent exists. Never introduce non-Bootstrap UI frameworks. FA Free only (no Pro icons).
- **Source**: _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md

## ADR-010: Three-tier context loading architecture
- **Date**: 2026-04-11
- **Status**: Active
- **Context**: Agent context windows are finite. The flat docs/ structure mixed always-loaded context with on-demand references. No way to distinguish essential product truth from supplementary guides.
- **Decision**: Implement three tiers: (1) Always-loaded -- identity, conventions, principles, knowledge index via AGENTS.md "See" references to `docs/context/`. (2) On-demand -- skills, detailed context, knowledge entries triggered by skill invocation. (3) Ephemeral -- tool outputs, exploration, handoffs in `.agent/handoffs/` (gitignored).
- **Source**: docs/plans/2026-04-11-001-refactor-three-tier-context-architecture-plan.md

## ADR-011: Doc splitting by task context (Index + Modules pattern)
- **Date**: 2026-03-23
- **Status**: Active
- **Context**: Monolithic docs (400+ lines) wasted 60-70% of context budget per agent interaction. Docs were written for human top-to-bottom reading, not agent load-what-you-need consumption.
- **Decision**: Each monolith becomes a lightweight index file (<20 lines) linking to focused modules. Each module gets a `<!-- Load when: ... -->` header. New docs >150 lines must be split by task context from the start. Skill SKILL.md files stay under 80 lines.
- **Source**: _archive/solutions/agent-infrastructure/2026-03-23-doc-splitting-dynamic-context-loading.md

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

**Pending.** ADR for the Pipedream→Cloudflare cutover outcome (Bill to confirm the Slack app's Event Subscriptions URL); skill-body rewrites (plan Phase 1) land separately with evals-first scenarios.

## ADR-014: uno-bot v2 — Pipedream → Cloudflare Worker (backfilled 2026-07-07 from git history)

**Original date:** 2026-06-17/18 (`fff9ca43` bot-skills to main "Tier B cutover prep", `b2a7cfee` Worker source to main).

**Decision.** The Slack bot's runtime moved from Pipedream workflows to a Cloudflare Worker (`agents/uno-bot/`, formerly `uno-bot/`): Slack events → Worker → Anthropic API with tool dispatch, thread state, and a proposal gate (side-effect tools stage a confirmation card; only the requester's ✅ executes, via `resolve_pending_proposal`). Skills load by raw-fetching repo files from GitHub at runtime (`SKILLS_BASE_URL`), prompt-cached per isolate — deploys decouple from guidance edits. Model tiering (`pickModel()`: intent → haiku/sonnet/opus, keyword-based) landed 2026-07-01 (`d892346f`, rubric dimension D2).

**Why.** Rationale not recorded in-repo; inferred from the archived Pipedream docs (`docs/knowledge/archive/`) and eval commits: Pipedream limited control over tool orchestration, state, and observability; the Worker gives one TypeScript codebase, telemetry (`c48e1c30` build tags — round-2 evals unknowingly tested a stale deployment), and subrequest-budget control.

**Status.** CONFIRMED live (closed 2026-07-08 by evidence): eval rounds 1–3 ran through Slack against the Worker — round 2 diagnosed a stale *Worker* deployment serving Slack traffic and added /health build tags in response (`c48e1c30`), which is only possible with Event Subscriptions already pointed at workers.dev. Follow-up for a Slack-app admin: retire the v1 Pipedream workflow (out of the serving path either way).

## ADR-015: uno-blueprint on Supabase as the product source of truth (backfilled 2026-07-07 from git history)

**Original date:** ≤2026-07-01 (`d892346f` D8 grounding: read-only `blueprint_search` over "the uno-blueprint Supabase"; hardened 2026-07-02 `0864cb54` with a `search_blueprint()` RPC and layer/step/scenario cell attribution).

**Decision.** Product truth (actors, stages, steps, scenarios, requirements) lives in a Supabase-hosted blueprint, queried at task time — never cached into repo docs. All agent answers about product behavior cite blueprint cells; gaps are stated, not filled ("blueprint gap honesty", scenario R11). On any requirement change, PRD and blueprint update **together** — the paired-writes contract now codified in `docs/conventions/supabase.md` and enforced by `agents/writers/blueprint.md`.

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
