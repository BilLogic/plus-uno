# uno-bot — Build Recap: The Critical Pieces

> The recap/tutorial: educational source material for the article (Bill + Bryan) and the
> knowledge base behind the `team-bot-setup` skill. **This doc explains what we built, the
> options at each decision, and why we chose what we chose.** How to *facilitate someone
> else's build* lives separately in `docs/plans/2026-07-11-001-slack-bot-setup-skill-plan.md`
> — the two are deliberately not mixed.
> Synthesized 2026-07-11, revised 2026-07-12. Ordered by dependency: problem → teammate →
> evidence → capability & trust → home → brain → soul → hands → proof → lessons. Pricing and
> API facts are dated; every table links its live docs/billing pages — re-check those, not
> this file. (Full chronology lives in git and `docs/knowledge/decisions.md`.)

---

## 0. Why build this: the coordination problem

The starting point isn't technology — it's what running a student design team at startup
pace actually feels like:

- **The team refreshes constantly.** Part-time student designers, roughly **ten new designers
  onboarding every quarter**. Projects are interconnected but individually owned — so they
  run in silos even when they shouldn't.
- **Context is heavy and moves under people's feet.** Tutoring-program logistics, the
  research plan, the product vision — all evolving. What was true at onboarding is stale a
  month later.
- **The standard fixes failed, and it's worth being blunt about why.** Slack announcements
  and weekly coordination time were tried; the 1:1 questions kept coming. People are, frankly,
  **too bored to read announcements**. In a world of exploding information — where they've
  already spent the day reading AI conversation output — **reading is getting harder, not
  easier**. A part-timer with a full plate can't tell which lengthy announcement is relevant
  or how much attention it deserves, and their assignments will have changed by next week
  anyway.
- **The continuity problem cuts both ways.** Interns come back from a week of classes and ask
  the lead to **remind them where their own work left off** — genuinely frustrating on the
  sixth repeat. And the reverse is just as real: the lead needs a recap of where someone's
  work stands without scheduling a meeting to ask.
- **The lead is the bottleneck — and human.** Keeping everyone on the same page doesn't scale
  when your own task list is full. Students work late at night; the lead works workdays — so
  answers wait overnight and work stalls. Patience runs out by the **sixth time you provide
  the same information, sometimes to the same person**.
- **A sync burden was growing in parallel.** The team was building its design system and
  vibe-coding environment at the same time, so every week produced cross-surface drift: a
  Figma component gets fine-tuned and published → the codebase must catch up; someone
  vibe-codes a change, gets it reviewed and committed → the Figma documentation must now
  match. Every sync was a human remembering to do it.

**So: what if the team had an always-on teammate — accurate, active at any hour, endlessly
patient with the sixth repeat of a question, living in Slack where the coordination already
happens?** That's uno-bot's founding job description.

> **Takeaway:** the pitch isn't "AI bot." It's a named organizational pain — onboarding
> churn, silo drift, announcement blindness, continuity amnesia, founder bottleneck, timezone
> mismatch, repeat-question fatigue. If your team doesn't recognize itself in that list, you
> may not need a bot.

---

## 1. What the teammate is: proactive + reactive, one bot

uno-bot is **one teammate operating in two modes** — and the distinction is who initiates:

- **Proactive mode (automations).** The bot surfaces information *before anyone asks* and
  draws attention to what needs it — scheduled or event-triggered routines that run the same
  steps every time and report into Slack, consolidating updates in the one place coordination
  already happens:
  - *Figma → code:* a poll detects published component changes → auto-creates a Notion PRD
    (screenshots, change summary, acceptance criteria) → notifies #figma-sync → a designer
    adds intent notes → `implement <Component>` in Slack produces a draft PR with per-phase
    status in-thread; the PRD auto-flips to "In Review" when the PR opens.
  - *Code → Figma:* component snapshots/registries kept generated and synced, so committed
    code changes surface back toward the Figma documentation instead of silently drifting.
  - *Prototype scaffolding:* a gated bot tool turns a Figma frame into a scaffolded
    prototype branch via a repository-dispatch runner.
  - *Ops:* a 15-minute health watchdog cron probes the bot's own integrations and posts a
    throttled alert when one degrades.
  - *Honest dropped attempt:* Figma **token/variable sync** — removed because Figma's
    Variables API is Enterprise-plan-gated. Know your plan tiers before promising a sync.
- **Reactive mode (conversation).** The bot responds to people's requests and commands:
  @-mention it with anything — roadmap lookups from vague descriptions, design-system
  questions, service-blueprint walkthroughs, "where did we discuss X," continuity recaps,
  screenshot critique. An agent loop interprets the request and picks tools per turn.
  Anything with side effects stops at a **✅ confirmation gate**: the bot stages a proposal
  card, and only the original requester's ✅ (or "go ahead") executes it.

Both modes live in **one Cloudflare Worker** (§4), share one harness and one set of safety
rails, and hand heavy execution to GitHub Actions runners — the bot proposes and gates;
runners do the work.

> **Takeaway:** proactive vs reactive is **not an either/or** — most teams need a mix.
> Design the proactive automations as bot *capabilities* whose output lands in Slack under
> the bot's identity, so the team experiences one coherent teammate, not a bot plus a pile
> of disconnected scripts.

---

## 2. Scoping: evidence before architecture

**The framework** (one chain, even though it lived across three artifacts):

> Ground on real requests → **interpret** where in the team's workflow each request arose →
> connect stages into flow maps and identify the key usage moments → **sort** each usage:
> proactive automation (routine, parameterizable) vs reactive conversation (varied, needs
> interpretation) vs stays human (taste, strategy) → set capabilities and limits
> **intentionally** (§3), driven by productivity intent, architectural feasibility, and
> free-vs-paid cost.

**The evidence sources — three, deliberately triangulated:**
1. **Slack mining**: real requests people already sent (channels + 1:1s, redacted to roles).
2. **Meeting transcripts**: Zoom AI already summarizes every meeting — those recaps capture
   the questions and action items people raise out loud, which Slack mining misses.
3. **The lead's accumulated intuition** from years of answering the questions personally —
   used to sanity-check the ranking, not replace the data.

**What we did:** collected **~55 real requests** across Slack (#plus-design, team channels,
1:1s) and Zoom AI meeting recaps, redacted to roles, tagged each with how it was handled and
which capability should own it. Measured theme ranking:
1. **spec/PRD disambiguation** (~16) — and half the newer entries came from *developers*
   (tooltip copy, status-value semantics, thresholds, empty states), not designers,
2. **continuity recaps** (12) — "remind me where my work left off," decision recall
   ("which breakpoint did we delete?"), assignment recall, and the lead needing the reverse
   ("where does X's work stand?"),
3. design-system source-of-truth Q&A (~10),
4. resource/link wayfinding (~8),
5. design review & handoff QA (~7),
6. bot meta-work (~5), tooling/team-ops onboarding (2).

**Two findings that only showed up at ~55 entries** (invisible at 25):
- **Continuity-recap was the hidden #2 — and it's a DM phenomenon** (11 of its 12 entries
  came from 1:1s). Channel-only mining structurally misses the exact request types that make
  the lead a single point of failure; ~3/4 of all new entries came from DMs.
- **The decision log is the missing source of truth.** The shared root cause behind
  continuity and many spec questions: decisions live in meeting memory and DM threads, not
  in any retrievable artifact. Meeting-AI recaps make it worse in a telling way — Zoom AI
  writes "next steps" bullets for every meeting (~100 recaps in three months) and they sit
  **unread in an inbox**. Capturing decisions where people ask about them is itself a bot
  capability.

Key signal: *"nearly every real request starts from a Notion or Figma URL — the #1 job is
source-of-truth lookup."*
→ Notion: [Real-usage corpus](https://app.notion.com/p/390b7cca498281bb899ae865a2ffa460) ·
repo: `docs/knowledge/research/2026-07-12-request-corpus-expansion.md` (the expansion)

**Two more scoping moves that mattered:**
- **Traced the existing workflow's friction.** A 17-step audit of the designer's real path
  (Figma publish → PR merged), each step timed, six friction points ranked by leverage. It
  also ruled what NOT to automate: the Notion PRD hop stayed manual on purpose — "a feature,
  not a bug" — because human intent-capture is the point.
  → `docs/knowledge/research/2026-05-20-user-flow-friction-audit.md`
- **Mapped flows before writing code.** The FigJam workflow board became five LLM-readable
  flows (research→PRD, PRD→prototype, publish, maintenance intake, maintenance review) plus
  flowcharts per use case — including the confirmation gate designed as an explicit state
  machine before it was code.
  → Notion: [Skills Upgrade hub](https://app.notion.com/p/PLUS-Uno-Skills-Upgrade-35db7cca498280378b4cf2d5960dcc62) ·
  `docs/context/product/uno-bot-flowcharts/uno-bot-v2-flowcharts.md`

> **Takeaway:** don't scope a bot from imagination. Collect ~50 real requests across your
> chat tool *and* your meeting summaries, interpret each back to the workflow stage that
> produced it, sort into automate / converse / stays-human, and only then decide
> capabilities. The corpus doubles as your first eval set (§8).

---

## 3. The capability contract — and the trust design that enforces it

The published table that tells your team what the bot fully does, partially does, and refuses
— so its limits are *chosen and written down*, not discovered by users through failures. The
problem it solved: the bot had "grown capability-by-capability across sessions" and was
*simultaneously over-challenged and under-used*.

**The three-lane matrix**, shipped verbatim as the designer-facing usage contract:
- ✅ **DOES fully** — the Slack-native sweet spot: grounded Q&A, gated Notion writes, gated
  build triggers, thread tl;dr, qualitative visual review, plus the proactive automations (§1).
- 🟡 **PARTIAL** — good-enough deliverable + a *named threshold* + relay ("drafts the PRD,
  a human finishes it"; bounded synthesis; qualitative-not-quantitative design review).
- 🔴 **REJECTS + routes** — blueprint writes, Figma generation, repo edits, scheduled
  follow-ups.

**The redirect design is the critical piece.** A bot that says "I can't do that" and stops
leaves people stuck and quietly kills adoption. Every 🔴 and every 🟡 threshold runs the same
**wall ritual**: name what and why in one line, then hand a concrete next step — file a
✅-gated intake ticket, or a *ready-to-paste prompt for the full-powered IDE agent with the
links pre-filled*. Nobody who hits a wall leaves empty-handed; the "no" still moves their
work forward. (Architecturally: the bot is a deliberate, enforced **subset of the IDE
agent** — differences are intrinsic, headless vs interactive, not provisional.)

**The matrix format is a customizable template, by design.** The three lanes, the wall
ritual, and a "what would move this to ✅" column are the durable format; every row is the
org's own usage moments and judgment calls. Three declared inputs per lane call:
productivity intent (does automating this help, or does the friction serve a purpose?),
feasibility (what the runtime can genuinely ground), and cost tier (free vs paid).

**The trust machinery that makes the contract real** — every promise above is enforced, not
asserted, in three layers (harness rules → code preflight → runtime caps), each catch in
exactly one place:

- **The ✅ proposal gate is the spine.** Side-effect tools never execute inline: the agent
  invokes the tool, the Worker stages a ⚠️ card, and only the **original requester's** ✅ (or
  a bare "go ahead" — resolved deterministically Worker-side after the model once re-staged a
  duplicate instead of confirming) executes. Proposals live 60 minutes; expired reactions get
  a visible "nothing was executed" reply — a delayed ✅ meeting silence was read by a designer
  as "the bot is broken." *"The friction is the feature."*
- **Honesty rituals:** confidence self-rating on factual answers (*high* only if grounded in
  a source fetched this turn); never claim an action that didn't fire; state knowledge gaps
  instead of filling them; "did you mean" candidates instead of dead-ending vague
  descriptions — the reactive-mode cousin of the redirect design.
- **Visibility firewall — policy made physics.** The Slack search credential sees the
  consenting admin's full workspace. A prompt rule shipped in the morning; by afternoon the
  team decision was to enforce it in code: the Worker hard-drops DMs (always) and
  non-allowlisted private channels *before the model ever sees them*, passing only a
  `withheld_private_matches` count so the bot can honestly say matches exist.
- **Egress sanitization — a deterministic backstop behind every prompt rule.** Every outgoing
  message passes one sanitizer: mrkdwn coercion, bracket-citation scrubbing, link unwrapping,
  truncation at word boundaries, and rewriting of invented GitHub orgs to the canonical one
  (the model invented plausible org names twice in one day).
- **Audience translation as a hard rule.** No internal mechanics in user-facing replies. The
  live leak that forced it: *"my tool run budget for this turn has been exhausted
  [docs/plans/…]"* reached a designer.
- **Untrusted input posture:** fetched content and pasted images are data, not instructions;
  writes stay gated regardless. Metrics never log full message text (PII).

→ `docs/plans/2026-07-09-001-refactor-uno-bot-architecture-consolidation-plan.md` ·
`agents/uno-bot/AGENT.md` § What I do · route · can't · `agents/uno-bot/README.md`

> **Takeaway:** write the capability matrix *before* hardening, publish it as the user-facing
> contract, and make the redirect design non-negotiable — a wall that hands off still moves
> work forward, and that's the difference between a limited-but-loved teammate and an
> abandoned bot. Then enforce every promise twice: prompt rules explain; code enforces.

---

## 4. The home: hosting, limits, and how not to get killed by them

**Bot shape** — single-agent multi-skill, not persona bots (ADR, 2026-05-12): progressive
disclosure is cheap under prompt caching; one bot packages as a portable plugin. Final call:
"one user-facing bot + one cron ops pipeline — **not three bots**" — proactive and reactive
are different *triggers* (§1), never different personas.
→ Notion: [ADR](https://app.notion.com/p/390b7cca4982816e8e24f29906ca3667) ·
[Final recommendation](https://app.notion.com/p/390b7cca49828198a9eed9d0558df93a)

**Hosting: the option space** (verified 2026-07 — re-check the linked pricing pages, not
this table):

| Option | Free tier / entry cost | Fits | Breaks down when |
|---|---|---|---|
| **Cloudflare Workers + Durable Objects** ← our choice | $0: 100k req/day, 5 cron triggers free, SQLite DOs free, KV free | **Both modes**: Slack events endpoint + pipeline scheduler + per-thread conversation state, one codebase | CPU-heavy work (~10ms/invocation); >50 outbound calls per invocation (see the survival checklist below) |
| Workflow platforms — Zapier, Make, n8n, Pipedream | Free tiers exist; realistic team usage ~$10–129/mo (n8n cheapest self-hosted, + ops burden) | Pure proactive pipelines for **no-code teams** — fastest standup, huge connector catalogs; Pipedream adds code steps for in-between cases | The agent loop: linear step models don't fit multi-tool conversational turns; per-task price creep; migrating off is a replatform |
| Vercel / other edge functions | Comparable free tiers | Simple event endpoints | No per-thread state primitive for conversations |
| AWS Lambda + DynamoDB | Generous free tier, more assembly | Teams already deep in AWS | Overkill + cold starts at this scale |
| **GitHub Actions** (as *runner*, not host) | Free minutes at team scale | **Heavy execution behind any host**: codegen, builds, long jobs | Not a web endpoint — can't receive Slack events itself |

Live references: [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) ·
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/) ·
[cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) ·
[Zapier pricing](https://zapier.com/pricing) · [Make pricing](https://www.make.com/en/pricing) ·
[n8n pricing](https://n8n.io/pricing) · [Pipedream pricing](https://pipedream.com/pricing)

**How to choose:** conversational or mixed → Cloudflare. Pure proactive pipeline with anyone
technical involved → still Cloudflare: same $0, and **reversible** — proactive and reactive
are the same Worker with different handlers, so changing the mix later is more code, not a
replatform. Pure pipeline on a truly no-code team → a workflow platform is legitimate; know
the ceiling you'll hit if conversation comes later. Heavy execution → a GitHub Actions
runner under any host, via `repository_dispatch`. Cost reality at 5–10 designers: **$0
infra**; real spend is the LLM API (~$15–50/mo).

**The briefing-packet model** — the Worker code is only the *body*; the brain is ~20 markdown
files fetched from GitHub Raw at runtime and prompt-cached. **Merging a doc PR reprograms the
bot in ~5 minutes, no redeploy.** Resilience: KV last-known-good snapshot + degradation
alerts. Bonus proven later: a vendor-neutral markdown harness made the provider swap an
afternoon (§5).

**Living within the platform's limits — the survival checklist.** Free-tier limits are
design inputs, not obstacles: we documented them in `wrangler.toml` and let them shape the
architecture. Each item below was discovered by a live incident; together they're the
pre-launch checklist for any serverless agent loop:

1. **Know your background-task cutoff.** Cloudflare's `waitUntil` hard-kills at ~30s with no
   exception — 👀 then silence. Fix: run agent turns in a **Durable Object alarm** (one per
   thread); the HTTP handler only acks/dedups/enqueues. Keep the executor a *separate* DO
   class from state (a DO fetching itself deadlocks).
2. **Know your edge idle timeout.** LLM API edges kill idle HTTP around ~100s. Fix: always
   **stream** long model calls — flowing bytes keep the connection alive.
3. **Know your outbound-call budget.** 50 subrequests/invocation on the free tier. Fixes: one
   job per alarm firing (fresh budget), harness from **one KV read** instead of 20+ raw
   fetches, direct-query tools instead of search chains, and a dedup TTL longer than your
   longest run (an 11-minute run outlived its own 10-minute dedup record and re-ran itself).
4. **Deploys restart your executors mid-run** — and one-shot dedup makes the kill permanent
   (every retry sees the marker and skips: permanent silence). Fix: dedup records are
   **leases** — claim marks "running," completion marks "done," a stale lease is reclaimed
   and re-run.
5. **One dead external dependency shouldn't kill the request.** A single unreachable MCP
   server 400s the whole model call → catch, drop the attachment, fall back, report.

Recurring principle: **never silent.** Every failure path posts something visible to the user
(⚠️ + error text, "nothing was executed", ⏳ progress) and to ops (throttled alerts, one
telemetry line per request, a `/health` build tag — added after an eval round unknowingly
tested a stale deploy).

> **Takeaway:** pick the platform whose *primitives map to your jobs* (event endpoint /
> scheduler / per-thread state / runner), prefer the one that keeps your mix decision
> reversible — then enumerate its kill timers before shipping. Ack-then-process needs a
> durable executor; at-least-once delivery needs a lease, not a flag; every death must leave
> a visible corpse.

---

## 5. The brain: models & routing — the option space (and what we chose)

The model choice comes **before** tool connections (§7) because it gates them: server-side
MCP exists on some providers and not others.

**Option table 1 — which provider** (pricing July 2026; re-check the linked pages):

| Option | Pros | Cons | Our experience |
|---|---|---|---|
| **Anthropic (Claude Sonnet/Opus)** | Server-side MCP; adaptive thinking + effort dials; strongest agentic reliability in our testing | Highest per-token cost; budget exhaustion is a real operational risk | Ran it for the whole hardening era; excellent; budget forced a switch |
| **Google (Gemini 3.5-flash, $1.50/$9 per M)** | Cheapest capable tier; `googleSearch` + `urlContext` built-ins give free web grounding; implicit caching | **No server-side MCP** → you write a client-side tool loop + local tool equivalents; schema-subset quirks; thought-signature bookkeeping | Current default; **beat our prior Claude rounds** on card/status workflows in live grading |
| **OpenAI (GPT-5.4-class, ~$2.50/$15 per M)** | **Server-side remote MCP in the Responses API** (no surcharge beyond tokens); hosted web search / file search / code interpreter; reasoning preserved across tool calls | We haven't evaluated it; nano tier ($0.20/$1.25) carries the lite-tier caution below | The provider seam (below) makes such an A/B cheap for any builder |
| **Lite/budget tiers as default** | Cheapest of all | **Veto lesson:** ours fabricated grounding — invented org names in links, claimed verification it never did | Reverted in 15 min: "a grounding-first bot can't ship hallucinated links to save ~$0.05/turn" |

Live references: [Anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) ·
[Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) ·
[OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

**Option table 2 — routing (how requests find the right model/effort):**

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **No router: one good model + adaptive thinking** | Least code; one always-warm prompt cache; the model self-regulates effort; native escalation (an `advisor` tool to consult a bigger model mid-turn; `delegate` for parallel cheap lookups) | Flagship price on trivial turns (mitigated by caching + adaptive thinking) | **Our choice** — after building and deleting both options below |
| Keyword → tier table | Trivial to build | Wrong often (critiques landed on the cheap tier) | Built, deleted |
| LLM micro-classifier pre-call | Smarter than keywords | Extra latency + cost + one more thing to tune; hidden killer: **tier-hopping pays a cold ~90k-token prompt-cache read per switch** | Built, deleted |
| Framework routers (LangGraph-class) | Batteries included | Lock-in; wrong size for an edge Worker | Never adopted |

**The load-bearing design choice — the provider seam:** an `AgentInput/AgentResult` contract
at the agent-turn level keeps events, the ✅ gate, delivery, and history **provider-blind**.
That's why a budget crisis became an afternoon's provider swap instead of a rewrite. The
vendor-neutral markdown harness (§4) is the other half of this portability.

> **Takeaway:** don't build a routing layer — one good model with adaptive thinking beats
> keyword tables and classifier pre-calls, and a warm cache beats "smart" tier-hopping. Put
> the provider seam at the agent-turn contract. A/B cheaper models against your *grounding*
> evals and let hallucination, not latency, be the veto.

---

## 6. The soul: persona molding

The brain decides what the bot can do; the persona decides whether anyone *wants* to talk to
it. A bot the team likes gets used; a beige one gets ignored. Persona was designed as
deliberately as the tools — and it's the most creative, most customizable layer of the build
(worked live with the team, 2026-07-12):

- **A one-line identity worth writing carefully.** Ours: *"the 🐐 teammate — the one everybody
  loves working with and secretly wants to become. Sharp, warm, zero ego. Competent first,
  funny second, never precious."* Self-aware about being a bot, comfortable there — with a
  budget: one self-aware aside per conversation, max ("the Roadmap board is basically my
  hometown").
- **Calibrated energy, not vibes.** Default energy sits a deliberate notch above neutral:
  openers carry a pulse ("Found it —", "Good news:", "Okay, this one's fun:") instead of flat
  topic sentences. Emoji are seasoning in replies where the moment earns them (🎉 on a ship),
  never decoration on every bullet, and **never in error/blocker/performance moments**.
- **Reactions are the personality channel.** Replies are word-budgeted; reactions aren't.
  Match the emoji to the *content*, not just sentiment — the "it actually read the message"
  signal IS the joke. Check the workspace's custom emoji before settling for stock; join a
  pile-on once, never twice.
- **Protocol signals stay separate from personality:** 👀 seen → 🛠 working → ✅ done, ❌ +
  error text on failure — one per transition, never instead of a reply.
- **Voice has hard rails**: audience translation (no internal machinery names — "would a
  designer who has never seen the codebase understand every single word?"), no scaffolding
  filler ("Here is the breakdown"), summary-first on long answers, hyperlink every resource
  named.

The persona lives in the harness as one versioned markdown file — another org's bot can be a
deadpan librarian, a hype-person, or a gruff senior engineer by editing it. Go as creative as
your team's culture allows; the rails keep it professional when things break.

→ `agents/uno-bot/AGENT.md` § Identity & voice, § Reactions

> **Takeaway:** design the persona as deliberately as the tools — one-line identity, energy
> calibration, a personality channel (reactions) separate from protocol signals, and hard
> rails that hold in failure moments. It's one markdown file; it's also why people talk to
> the bot at all.

---

## 7. The hands: connecting your tools — API vs MCP, a decision guide

Two options per source, how to choose, where each breaks. Our experience is the evidence
rows, not the narrative.

**The decision tree, per source of truth:**
1. **Does the bot need this source at all** — or can it relay to a tool that already has it?
2. **Read or write?** Writes go through your own confirmation-gated tools (§3's ✅ gate),
   *never* MCP — MCP tools execute server-side mid-turn, so the gate cannot intercept them.
3. **Bounded corpus the bot must answer authoritatively about** (your roadmap board, your
   component inventory)? → build a **direct-query tool** on the plain REST API. Search
   endpoints are not databases — ours repeatedly missed a card by its literal title until
   replaced with a direct DB query (complete result sets, fuzzy "did you mean" ranking).
4. **Otherwise weigh MCP vs plain API:**

| | Hosted MCP | Plain REST API |
|---|---|---|
| **Pros** | Zero tool-maintenance (the vendor maintains the surface); with a provider that runs MCP **server-side** (Anthropic, OpenAI Responses API — §5), tool rounds cost no subrequests and no client loop code | Deterministic and precise; gate-compatible; portable across model providers; no auth surprises (your existing key usually works) |
| **Cons** | Each service is its own **auth research project** (verdicts below); allowlist typos fail *silently* (bot answers from priors — a confidence regression, not a crash); tool lists bloat every call; writes bypass gates; on providers without server-side MCP (Gemini) you're writing the client loop yourself anyway | You write and maintain the tool code; each call counts against the 50-subrequest budget |

**Our per-service verdicts (2026-07 — probe live before trusting; auth models churn):**

| Service | Verdict | One-line reality |
|---|---|---|
| **GitHub** | MCP easy | Static PAT as Bearer; pin read-only *in the URL path* (connector accepts no custom headers). |
| **Notion** | MCP solvable / API also fine | mcp.notion.com is its own OAuth 2.1 server (PKCE + dynamic client registration — template code exists). We run **both**: MCP for broad reads, REST key for the direct-query tool. |
| **Slack** | MCP reads-only | Needs a separate *user*-token OAuth app; caveat found live: MCP writes post **as the consenting human**, so writes use the bot's own token via API. |
| **Supabase** | API for data, MCP for schema | Read-only MCP without `execute_sql` **cannot query rows** — bespoke RPCs with domain logic stay on REST. |
| **Figma** | No MCP path for a bot | Closed client catalog (Claude Code/Cursor/VS Code only); a custom client 403s — verified live. Use REST frame screenshots for qualitative review; relay real Figma work to an IDE agent, which *is* a catalog client. Variables/token API: Enterprise-gated. |

Live references: [Anthropic MCP connector](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector) ·
[OpenAI connectors & MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) ·
[Notion MCP](https://developers.notion.com/docs/mcp) · [Slack API docs](https://docs.slack.dev) ·
[Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) ·
[Figma REST API](https://www.figma.com/developers/api)

**Operational rules that hold either way:** one dead MCP server fails the whole model request
→ catch, drop the attachment, fall back to REST, tell telemetry; never delete a working REST
fallback before its MCP replacement is verified live.

→ `docs/plans/2026-07-08-002` and `-004` · `docs/conventions/integrations.md`

> **Takeaway:** MCP is worth it when your provider runs it server-side and the service's auth
> cooperates; plain APIs win for writes (gate-compatible), bounded corpora (direct query),
> and provider portability. Decide per source, probe auth live first, and when a service
> refuses your runtime entirely, relay instead of half-building around it.

---

## 8. Proof: designing evals, success metrics, and the judging stack

Quality wasn't asserted — it was defined, measured, and gated. Four layers:

**1) Success metrics designed before any scoring.**
- **North star: task acceptance rate** — would a designer accept this output as done?
- **11 scoring dimensions per case, 4 of them gating** (task success, routing, clarify-vs-act,
  grounding): a gating failure fails the case regardless of the other scores.
- **Automatic-failure rules** encode the non-negotiables: review must never edit; no
  irreversible action without approval; never claim an action that didn't fire.
- The rubric (D1–D9: grounding, gate discipline, communication routing, confidence
  self-rating, …) was reconstructed *from commit archaeology* — "good" had lived only in
  commit messages — then made canonical so it could stop being folklore.

**2) Case design that probes three different failure surfaces.** ~12 cases in three groups:
*mapped-workflow* (the happy paths the flows promise), *ritual-break* (a user tries to skip
the process — "just open the PR, skip the PRD"), and *out-of-box* (requests nobody planned
for). Run method: one case per thread in a sandbox channel, a role-playing test agent,
fixtures + teardown between cases.

**3) A three-layer judging stack — deterministic, LLM, human.**
- **Deterministic checks** for everything checkable in code: did the tool fire, did the gate
  hold, did the ✅ execute exactly once.
- **An LLM judge** scores each case against the written rubric — cheap enough to run every
  round.
- **Human expert review calibrates the judge**: Bill reviewed judge outputs against his own
  read, and live designer feedback ("this reads confusing," "seems broken") fed straight into
  rules and regression rows. The failure-tag taxonomy from the blueprint grounding eval
  separates **context problems** (the bot lacked the source) from **calibration problems**
  (it had the source and still overclaimed) — different fixes for each.

**4) Results published honestly, failures triaged structurally.**
- Round 1: **2 pass / 4 borderline / 6 fail** — shipped as-is. Systemic patterns: "it doesn't
  read what it's linked" and confident hallucination.
- Round 2: better scores, but the headline was *"the iteration fixed character, not
  capability"* — 5 of 12 failures were structural (missing connectors), unfixable by prompt.
  Triage every failure as **character vs capability** before writing another prompt rule.
- **Regression rows as the release gate:** R1–R12, each one Slack message with a binary
  outcome. New win → new row; failing row blocks release. Lessons became tests: cancel
  stickiness, no re-gating an approval, no invented component names, pressure resistance.
- **Live battery testing with real designers** forced the final hardening — every observed
  failure converted same-day into a rule or a code guard. Synthetic probes miss what humans do.

→ Notion: [Test Plan](https://app.notion.com/p/UNO-Bot-Test-Plan-390b7cca498281ad9b6ffab0b705b611) ·
[Round 1 results](https://app.notion.com/p/390b7cca498281d8bb3fcc0e195961c5) ·
[Round 2 + comparison](https://app.notion.com/p/392b7cca498281318dcbd0a501e51731) ·
[Blueprint grounding eval](https://app.notion.com/p/UNO-Blueprint-Grounding-Evaluation-390b7cca498281f99d31d728a5588ec5) ·
repo: `docs/evals/scenarios/uno-bot.md` + `docs/evals/rubrics/bot-answer.md`

> **Takeaway:** define the acceptance metric and the gating dimensions before testing; probe
> three surfaces (happy path, ritual-break, out-of-box); judge with all three layers —
> deterministic checks, an LLM judge, and human calibration; and keep a binary regression
> battery as the release gate.

---

## 9. Cross-cutting lessons (the article's backbone)

1. **Two-layer defense, everywhere.** Harness rule + deterministic code backstop — repeated
   six times across the build (capability walls, visibility firewall, citations, org links,
   confirm/cancel, share-out gates).
2. **The ✅ gate is the spine;** everything else protects or extends it.
3. **Docs are the executable brain** — so doc drift is a *production bug class*. Four named
   shapes (switches documented as states; changed constants surviving in old doc surfaces;
   renames finished in the index but not the leaves; counts rotting fastest). Countermeasures:
   consistency sweeps, a link validator, BUILD tags. Corollary: "a failing guard is worse
   than no guard" — a validator that's red on noise trains people to ignore it.
4. **Incident-driven hardening, one live failure per fix** — nearly every hardening commit
   names its probe thread. This is also what makes the story tellable.
5. **Free tier as a design input**, not an obstacle.
6. **Vocabulary is harness content.** The bot kept conflating the service-blueprint estate
   with the Roadmap estate because "the harness taught routing but never the vocabularies
   themselves." Fix: a two-vocabularies table with each estate's terms *and NOT-words*.
   Domain language is config, not prompt garnish.
7. **Generalization was planned from day one** — org-specific content in dedicated files, IDs
   in env not source, `<!-- Plus-specific -->` markers — so extraction into a template is
   content-extraction, not a refactor.
8. **Make big decisions reversible and they stop being scary:** the hosting choice (mix
   change = more code, same Worker), the provider seam (budget crisis = an afternoon), the
   briefing-packet harness (behavior change = a doc PR).

---

## 10. Open items

- ~~Corpus backfill to ~50~~ **Done (2026-07-12):** ~55 entries across Slack + Zoom recaps —
  see `docs/knowledge/research/2026-07-12-request-corpus-expansion.md`; §2 updated with the
  measured ranking. Optional: merge the expansion into the canonical Notion corpus page.
- ~~Skills-landscape benchmark~~ **Done (2026-07-12):** ~10 comparables analyzed; no existing
  resource covers the pre-code or post-deploy journey. Positioning + adopt-list live in the
  skill plan (§7 there).
- **Real cost numbers** — pulling per-turn/per-month figures from Workers telemetry to
  replace the anecdotal estimates before publishing (in progress).
- The article was already a **planned v2 deliverable in Notion** (Medium/Substack) — this
  recap supersedes its outline.

## 11. Source index

- **Repo:** `docs/plans/2026-07-08-00{1..4}`, `2026-07-09-001` (the consolidation ADR — the
  single best document), `docs/knowledge/decisions.md` (ADR-013–017), `docs/knowledge/
  lessons/2026-07-10-harness-consistency-sweep.md`, `docs/conventions/terminology.md`,
  `agents/uno-bot/AGENT.md` + `README.md`, `docs/evals/scenarios/uno-bot.md` +
  `docs/evals/rubrics/bot-answer.md`, `.github/workflows/` (the proactive automations).
- **Notion:** UNO Bot v1 card (#2372) · UNO Bot v2 card (#2427) · Architecture ADR · Final
  Architecture Recommendation · Generalization & Plugin Packaging · Real-usage corpus ·
  Skills Upgrade hub (5 flows) · Test Plan + Round 1/Round 2 results · Blueprint Grounding
  Evaluation. (URLs inline above.)
- **Git:** full chronology in PRs #27–#60 if the article ever wants dates.
