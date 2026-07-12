# Plan: `team-bot-setup` — a generalizable skill for standing up your own design/PM Slack bot

> Status: DRAFT v3 for Bill's review · 2026-07-12
> Companion doc: `docs/knowledge/uno-bot-build-recap.md` (the evidence this plan generalizes)
> v3 changes per Bill's review: pipeline/freeform reframed as a *mix*, not a fork, with
> automations designed as bot capabilities that consolidate updates into Slack; hosting is
> now a needs-based comparison table with Cloudflare as the default recommendation;
> capability matrix explicitly ships as a customizable, scalable template; **persona molding**
> added as a named creative step in Phase 7; OpenAI researched — Responses API has
> server-side MCP + hosted tools, so it's a fair third provider option.
> (v2: Phases 1–4 restructured as evidence → interpretation → sort → contract; corpus target
> raised to 50–100; integrations and models reframed as decision guides.)

## 1. What the skill is

A **guided, phased setup process** — not a code generator you run once. The skill walks a
person (designer/PM working with an AI coding assistant, or a design technologist) through the
journey in the right order, with our mistakes pre-paid. The model does the heavy lifting at
every step; the human makes the judgment calls the skill explicitly reserves for them.

The skill is **educational first**: at each decision point it lays out the option space with
pros/cons (including options we didn't take), states what we chose and why, and lets the user
weigh their own context — rather than replaying our chronology.

Working name: `team-bot-setup`. Ships as a Claude Code skill (SKILL.md + references/ +
templates/) plus a **template Worker repo** the skill forks and customizes.

**The framework the skill encodes** (the through-line of every phase):

> Ground on real requests → interpret where in the team's workflow each request arose →
> connect those into flow maps and identify the key usage moments → sort each usage into
> *automate* vs *freeform conversation* vs *stays human* → set the bot's capabilities and
> limits intentionally, driven by productivity intent, architectural feasibility, and
> free-vs-paid cost → enforce every limit twice (prompt rule + code guard) → test with the
> same evidence you scoped with.

## 2. The Phase-0 question: what *mix* of pipeline and freeform

**Not a fork — a mix.** Pipelines and conversations are different *triggers* on the same
teammate, and most teams end up with both (ours did: a conversational bot + standing
automations that consolidate Figma/code/Notion updates into Slack, where coordination already
happens). The first decision is the expected ratio, which sets what gets built first:

| | **Pipeline bot** | **Freeform bot** |
|---|---|---|
| Trigger | Keyword / slash command / schedule / webhook | @-mention, natural conversation |
| Behavior | Deterministic: same trigger → same steps | Agent loop: model picks tools per turn |
| Great for | Routine, parameterizable work (detect Figma change → file PRD → notify; `implement Badge` → draft PR) | Lookup, Q&A, disambiguation, synthesis — requests too varied to parameterize |
| Cost profile | Near-zero (LLM only inside specific steps) | LLM cost per conversation turn |
| Risk profile | Low (auditable, repeatable) | Needs gates, grounding rules, egress guards |
| Build effort | Days | Weeks (mostly hardening) |

Guidance the skill gives:
- **Don't decide from intuition — the Phase-1 corpus decides the ratio.** Mostly-routine,
  parameterizable requests → pipeline-heavy. Mostly lookup/Q&A/varied → conversation-heavy.
- **Design automations as bot *capabilities*, not side scripts:** their output lands in Slack
  under the bot's identity, so the team experiences one coherent teammate that both answers
  questions and keeps surfaces in sync (design-tool change detected → spec doc auto-created →
  channel notified → one keyword produces a draft PR with in-thread status).
- **The ratio is cheap to revise if you host on Cloudflare** (see §3) — pipeline and freeform
  are the same Worker with different handlers. Start where the corpus points; add the other
  mode later without replatforming.

## 3. Hosting: pick by need — with Cloudflare as the default recommendation

Researched 2026-07 (fresh web pass + 3 months live). The skill ships this comparison table
(also article material) and applies the recommendation logic below — different needs *can*
land on different tools, but one default covers the common case:

| Option | Free tier / entry cost | Fits | Breaks down when |
|---|---|---|---|
| **Cloudflare Workers + Durable Objects** ← default | $0: 100k req/day, 5 cron triggers free, SQLite DOs free, KV free | **Both modes**: Slack events endpoint + pipeline scheduler + per-thread conversation state, one codebase | CPU-heavy work (~10ms/invocation); >50 outbound calls per invocation (a design input the template already respects) |
| Workflow platforms — Zapier, Make, n8n, Pipedream | Free tiers exist; realistic team usage ~$10–129/mo (n8n cheapest self-hosted, + ops burden) | Pure pipelines for **no-code teams** — fastest standup, huge connector catalogs; Pipedream adds code steps for the in-between cases | The agent loop: linear step models don't fit multi-tool conversational turns; per-task price creep; migrating off is a replatform |
| Vercel / other edge functions | Comparable free tiers | Simple event endpoints | No per-thread state primitive for conversations |
| AWS Lambda + DynamoDB | Generous free tier, more assembly | Teams already deep in AWS | Overkill + cold starts at this scale |
| **GitHub Actions** (as *runner*, not host) | Free minutes at team scale | **Heavy execution behind any host**: codegen, builds, long jobs | Not a web endpoint — can't receive Slack events itself |

Recommendation logic the skill applies:
- Conversational or mixed → **Cloudflare, no menu.** Pure pipeline + anyone technical on the
  team → still Cloudflare (same $0, and **reversible**: adding conversation later is more
  code, not a replatform).
- Pure pipeline + truly no-code team → a workflow platform is legitimate; the skill names the
  ceiling they'll hit if conversation comes later. (This skill assumes an AI assistant does
  the setup, which erases most of the no-code advantage.)
- Heavy execution (codegen, builds, long jobs) → **GitHub Actions runner under any host**,
  via `repository_dispatch`. The bot proposes and gates; runners do the work.
- Platform limits ship as **design inputs** in the template's `wrangler.toml` (50
  subrequests/invocation, 30s `waitUntil` kill, ~10ms CPU), with the survival fixes (DO alarm
  executor, streaming, lease dedup, KV harness cache) already baked in — the user never
  re-discovers them.

## 4. The guided journey — ten phases (0–9)

Each phase states what the **model does**, what the **human decides**, and the **artifact**
produced. Artifacts accumulate into the bot's harness — by Phase 8 the config *is* the bot.
Ordering follows the dependency chain: evidence → contract → brain & soul (the provider
choice gates integrations) → hands → runtime → content → proof.

### Phase 0 — Fit check + mix hypothesis (15 min)
- Model asks: team size, where truth lives, what people actually ask, appetite for maintenance.
  Presents the pipeline-vs-freeform table (§2) and captures a *mix hypothesis* — the expected
  ratio of automation to conversation (revisited in Phase 3; the two are not exclusive).
- Human decides: is a bot the right move at all (the skill is honest that a wiki page or
  office hour sometimes beats a bot); initial mix hypothesis.
- Artifact: go/no-go note + mix hypothesis + top-3 hoped-for use cases.

### Phase 1 — Evidence: mine real demand (target 50–100 requests)
- Model does: with Slack access (or exports), sweeps recent channels for requests the future
  bot might own; adds meeting/Zoom transcripts where available (the pass we skipped and
  regretted); redacts to roles; targets **50–100 real requests** — enough that theme ranking
  is statistics, not anecdotes (our 25 was a floor, not a target).
- Human decides: redaction rules; where to mine; when the corpus is representative.
- Artifact: `discovery/request-corpus.md`. **Load-bearing three times:** scoping evidence now,
  capability input in Phase 4, eval seed in Phase 9.

### Phase 2 — Interpretation: locate each request in the workflow
- Model does: for each request, infers *where in the team's product/design workflow the
  requester was standing when the need arose* (e.g. "starting from nothing", "has a PRD, needs
  fidelity", "ready to share", "maintaining"). Connects these stages into flow maps (our five
  flows came out of exactly this). Marks the **key usage moments** — the recurring points
  where a bot would intercept real work.
- Human decides: whether the inferred stages match reality; names the team's actual workflow
  stages (this vocabulary feeds Phase 8).
- Artifact: `discovery/flow-map.md` — stages, flows, and the ranked usage moments.

### Phase 3 — Sort: automate vs freeform vs stays-human
- Model does: proposes a three-way sort of every usage moment: **automate** (routine +
  parameterizable → pipeline trigger, deterministic handling), **freeform** (varied, needs
  interpretation/lookup/synthesis → conversational agent), **stays human** (taste, strategy,
  relationships — the bot's job is at most to *prepare* these, never own them). For the
  automate lane it also sketches each automation *as a bot capability* — trigger, steps, and
  where its updates land in Slack — so syncs (e.g. design-tool publish → spec doc → channel
  notification → keyword-triggered draft PR) read as the same teammate, not side scripts.
  Then compares the result against the Phase-0 mix hypothesis and confirms or revises it.
- Human decides: every borderline call; the confirmed mix.
- Artifact: `discovery/sort.md` — the automate/freeform/human ledger + automation sketches.

### Phase 4 — The capability contract (can / partial / can't)
The published table that tells the team what the bot fully does ✅, partially does 🟡 (with a
*named threshold* — "drafts the PRD, a human finishes it"), and refuses 🔴 (but always hands a
next step — "walls are handoffs, never rejections"). It exists so the bot's limits are chosen
and written down, not discovered by users through failures.
- Model does: drafts the matrix from the Phase-3 sort, weighing the three declared inputs:
  **productivity intent** (does automating this actually help, or does friction serve a
  purpose — our Notion-PRD hop stayed manual on purpose), **feasibility** (what the runtime
  can genuinely ground — a Slack bot can do qualitative review of a screenshot but not
  WCAG-ratio math), and **cost tier** (what fits the free architecture vs what needs paid —
  each 🟡/🔴 lane gets a "what would move this to ✅" note, often "a paid plan" or "an
  integration that doesn't exist yet").
- Human decides: every lane assignment. This is THE judgment step; the skill refuses to
  scaffold code before this table exists (we built capability-by-capability and paid for it).
- **The matrix ships as a customizable template**: the three lanes, the wall ritual, and the
  "what would move this to ✅" column are the durable format; every row is the org's own
  usage moments and judgment calls. Designed so scaling the bot later means *adding rows*,
  not redesigning the contract.
- Artifact: `harness/capability-matrix.md` — later published verbatim as the user-facing contract.

### Phase 5 — The brain & soul: model choice + persona molding
Deliberately **before** integrations: the provider decision gates which integration paths
even exist (server-side MCP or not), and the persona pairs naturally with the brain — you're
deciding who this teammate *is* before wiring up its hands.
- Model does — **model choice**: presents the options tables from `references/
  model-options.md` — providers (Anthropic: server-side MCP + adaptive thinking, priciest;
  Gemini flash: cheapest capable tier + built-in search/URL grounding, client-side tools
  only; OpenAI GPT-5.4-class: server-side MCP via Responses API + hosted tools, mid-priced —
  we haven't run it, the seam makes the A/B cheap) and routing (default: **no router** — one
  good model with adaptive thinking; keyword tiers and LLM classifiers documented as options
  we built and deleted). One hard warning shipped as a rule: don't default to a lite-tier
  model — ours fabricated grounding (invented links) to save ~$0.05/turn.
- Model does — **persona molding** (the creative step, its own guided moment): walks the
  human through giving the bot an identity and soul, using ours as the worked example
  (*"the 🐐 teammate — sharp, warm, zero ego; competent first, funny second, never
  precious"*). The guide covers: a one-line identity worth writing carefully; calibrated
  default energy (openers with a pulse vs flat topic sentences); emoji policy (seasoning
  where earned, never in error/blocker moments); **reactions as the personality channel**
  (replies are word-budgeted, reactions aren't — match emoji to content, prefer the
  workspace's custom set); protocol signals kept separate from personality (👀→🛠→✅, ❌ +
  error text); and the hard rails that hold under pressure (audience translation, no
  scaffolding filler, hyperlink everything). Framing for the user: **go as creative as your
  team's culture allows — deadpan librarian, hype-person, gruff senior engineer — the rails
  keep it professional when things break.**
- Human decides: provider + model (default: cheapest non-lite tier that passes the Phase-9
  grounding evals); the persona (identity line, energy level, emoji policy).
- Artifact: model/provider decision record + `harness/persona.md`.

### Phase 6 — Sources & integrations: a decision guide, not a hookup marathon
For each source of truth the ✅/🟡 lanes require, the skill runs a short decision tree and
shows the option space (full guide in `references/integration-decision-guide.md`), now
informed by the Phase-5 provider choice:

1. **Does the bot need this source at all** — or can it relay to a tool that already has it?
2. **Read or write?** Writes go through your own confirmation-gated tools, *never* MCP —
   MCP tools execute server-side mid-turn, so a gate can't intercept them.
3. **Is this a bounded corpus the bot must answer authoritatively about** (your roadmap board,
   your component inventory)? → build a **direct-query tool** on the plain REST API. Search
   endpoints are not databases; ours repeatedly missed a card by its literal title.
4. **Is MCP worth it here?** Decision table, not dogma:

   | | Hosted MCP | Plain REST API |
   |---|---|---|
   | Pros | Zero tool-maintenance; with a server-side MCP provider (Phase 5), tool rounds cost no subrequests | Deterministic, precise, gate-compatible, portable across model providers |
   | Cons | Each service is its own auth research project; allowlist typos fail *silently*; tool lists bloat every call; writes bypass gates; **only pays off if your Phase-5 provider runs MCP server-side (Anthropic yes, OpenAI Responses API yes, Gemini no)** | You write and maintain the code; counts against the 50-subrequest budget |

   Our dated verdicts (2026-07, with the probe method so users can re-verify): GitHub easy
   (PAT, read-only pinned in the URL) · Notion solvable (OAuth 2.1 + PKCE + dynamic client
   registration, template code included) · Slack workable but writes post as the consenting
   human → reads only · Supabase partial (read-only MCP can't run RPCs) · Figma **closed
   client catalog** — no custom client connects; use REST screenshots + relay to the IDE.
- Human decides: source precedence when they disagree; the private-content allowlist.
- Artifact: `harness/sources.md` + per-source integration strategy.

### Phase 7 — Stand up the runtime (the template repo)
- Model does: forks the template Worker, fills `bot.config.json` (all org-specific IDs in one
  file), walks through Slack app creation (manifest provided), secrets via
  `wrangler secret put` (values never touch the repo), deploys, runs the smoke battery
  (`/health` build tag, event round-trip, gate round-trip, dedup-lease check).
- Human decides: nothing architectural — the survival-arc fixes are baked in, not choices.
- Artifact: a live bot in a sandbox channel answering with provenance.

### Phase 8 — Author the harness content
- Model does: interviews the human to fill the content slots that **cannot be templated**:
  ① the team's **two-vocabularies table** — domain terms *and NOT-words* per estate (our
  single most repeated failure class was vocabulary conflation); ② forbidden patterns;
  ③ the Phase-4 matrix. Assembles AGENT.md from the skeleton + the Phase-5 persona.
- Human decides: all content slots; reviews the assembled system prompt.
- Artifact: the complete `harness/` directory — the bot is now *their* bot. (Doc-drift
  warning label included: these files are production code; changed constants must be grepped
  everywhere.)

### Phase 9 — Safety verification + evals + launch
- Model does — **metrics first**: sets the success metrics before any testing — a north-star
  **task acceptance rate** ("would a user accept this output as done?"), scoring dimensions
  with a **gating subset** (task success, routing, clarify-vs-act, grounding — a gating
  failure fails the case), and automatic-failure rules for the non-negotiables.
- Model does — **safety demonstration**: proves each rail live rather than asserting it
  (confirm as the wrong user → must refuse; expired proposal → visible reply; private-content
  search → withheld + counted; citation-marker → scrubbed).
- Model does — **the three-layer judging stack**: converts corpus items into the scenario
  battery (one message, one binary outcome each; three groups — happy-path, ritual-break,
  out-of-box), then grades with **deterministic checks** (did the tool fire, did the gate
  hold) + an **LLM judge** against the written rubric + **human expert calibration** (the
  user reviews judge outputs; live team feedback feeds new regression rows). Failures triaged
  as **character vs capability** (prompt-fixable vs structurally missing). Drafts the
  soft-launch announcement + the feedback ritual (every weird reply → a new regression row
  or rule).
- Human decides: TTLs, who may confirm, launch timing, which failures block launch (default:
  any gating dimension).
- Artifact: `safety-verification.md` + `evals/scenarios.md` (the living release gate) +
  launch kit + day-2 operations one-pager.

### Phase ∞ — Operate (reference, not a step)
Doc-drift sweep cadence ("your docs are the executable brain — drift is a production bug"),
telemetry reading, adding a tool (thin verb + gate decision + regression row), swapping model
providers (the agent-turn seam), cost tracking.

## 5. What ships in the package

```
team-bot-setup/
├── SKILL.md                     # the nine-phase journey — gates, "model does / human decides"
├── references/
│   ├── shape-guide.md               # the pipeline/freeform mix — §2 expanded, automation-as-capability patterns
│   ├── hosting-options.md           # the §3 comparison table + recommendation logic, dated
│   ├── capability-matrix-guide.md   # lane heuristics, the three inputs, wall-ritual patterns, blank template
│   ├── integration-decision-guide.md# API-vs-MCP decision tree + dated verdicts + probe scripts
│   ├── model-options.md             # provider & routing pros/cons tables + "we chose X because"
│   ├── persona-molding-guide.md     # identity, energy calibration, reaction channel, hard rails + our worked example
│   ├── serverless-survival.md       # the five kill-timers checklist (why the template is shaped this way)
│   ├── safety-rails.md              # gate / firewall / egress patterns + live verification scripts
│   ├── eval-format.md               # scenario + rubric templates, character-vs-capability triage
│   └── operations.md                # drift sweeps, telemetry, provider swap, cost tracking
└── templates/
    ├── worker/                  # generalized uno-bot: config-driven, survival fixes baked in,
    │   │                        #   BOTH shapes (event handlers + cron pipeline slots)
    │   ├── bot.config.json      # every org-specific ID/URL/name in one file
    │   └── slack-manifest.yml   # scopes + events, ready to paste
    └── harness/                 # AGENT.md skeleton with the four human-content slots marked
```

Template extraction from uno-bot: ~1–2 days (the `<!-- Plus-specific -->` markers and
IDs-in-env discipline make it content extraction, not a refactor). Genericize tool names
(`roadmap_query` → `board_query`) and add the pipeline-shape handler slots.

## 6. Design principles for the skill itself

1. **Educational, option-first.** Every decision point shows the option space with pros/cons
   (including paths we didn't take), then "we chose X because Y" — never just "do X."
2. **Phase gates are real.** No runtime scaffolding before the capability matrix exists.
3. **Human-judgment steps are named as such** — the sort (Phase 3), the lane assignments
   (Phase 4), and the four harness slots (Phase 7) are *the* work, not paperwork.
4. **Priors are dated and linked, not eternal** — every verdict/pricing table says "verified
   2026-07," teaches the probe method, and links the vendor's **live docs/billing page**
   (Cloudflare pricing, provider pricing pages, MCP docs) so users re-check the source, not
   our snapshot. MCP auth models and model pricing churn.
5. **Every safety claim demonstrable** — verified by live demonstration, not asserted.
6. **The corpus is load-bearing three times** (scoping → capability input → eval seed).
7. **Honest exits.** Phase 0 can end in "don't build this"; Phase 5 can end in "that source
   is unreachable — here's the relay design instead."

## 7. Open decisions for Bill

1. **Skill name** — `team-bot-setup` vs `design-ops-slack-bot` vs an uno-branded name.
2. **Template hosting** — separate public GitHub template repo (recommended) vs a folder here.
3. **Corpus backfill** — raise our own corpus from 25 to 50–100 before the article, so the
   "50–100" guidance is practiced, not aspirational. (We have Slack access; ~a session of work.)
4. **v1 scope** — all nine phases, or a lean v1 (Phases 1–4 + 6–7 + safety) with 5 and the
   full eval kit as fast-follow references?
5. **Distribution** — public skill repo, plugin marketplace, or article-links-to-template?
