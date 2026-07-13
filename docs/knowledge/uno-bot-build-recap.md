# uno-bot — Build Recap: The Critical Pieces

> The recap and tutorial: source material for the public article (Bill + Bryan) and the
> knowledge base behind the `team-bot-setup` skill. This doc explains what we built, the
> options at each decision, and why we chose what we chose. How to facilitate someone else's
> build lives separately in `docs/plans/2026-07-11-001-slack-bot-setup-skill-plan.md`.
> Style follows `docs/conventions/article-writing-style.md`. Pricing and API facts are
> dated; every table links its live docs page — re-check those, not this file.
> Evidence base: the [Coordination Request Corpus](https://app.notion.com/p/4f78adae66b34d73b1faf8ba9a2d94a8)
> (170 real requests across eight semesters, 2024–2026, with chart views for the article's
> figures). Full chronology lives in git and `docs/knowledge/decisions.md`.
> Section arc — the teammate lifecycle: job opening → evidence → job description → contract
> → workplace → brain → soul → hands → performance review → what we'd tell you. (Evidence
> comes before the job description on purpose: grouping the real requests is where the
> proactive/reactive split came from.)

---

## 0. The job opening: coordination was eating the team

Our design team runs on Slack. About ten new student designers join every quarter, projects
are interconnected but individually owned, and the same questions kept landing on one person
— the design lead (Bill, one of the authors). We built a bot that answers them instead.

The problem has five parts, and none of them is exotic:

**The team refreshes constantly.** Part-time student designers, roughly ten onboarding every
quarter. Projects run in silos even when they shouldn't, because each one has a single owner.

**Context moves under people's feet.** Tutoring-program logistics, the research plan, the
product vision — all evolving. What was true at onboarding is stale a month later.

**The standard fixes failed.** We tried Slack announcements and weekly coordination time.
The 1:1 questions kept coming. It's worth being blunt about why: people are too bored to
read announcements. They've already spent the day reading AI conversation output, and in a
world of exploding information, reading is getting harder — not easier. A part-timer with a
full plate can't tell which lengthy announcement deserves their attention, and their
assignment will have changed by next week anyway.

**Continuity breaks in both directions.** Interns come back from a week of classes and ask
the lead to remind them where their own work left off. One intern put it exactly: *"I
remember you mentioning I should copy and paste the components... can you remind me again
where I should copy paste those components?"* The reverse is just as real — the lead needs a
recap of where someone's work stands without scheduling a meeting to get it. Patience runs
out by the sixth time you provide the same information, sometimes to the same person.

**A sync burden grew in parallel.** We were building our design system and vibe-coding
environment at the same time. Every week produced cross-surface drift: a Figma component
gets fine-tuned and published, so the codebase must catch up; someone vibe-codes a change
and commits it, so the Figma documentation must now match. Every sync was a human
remembering to do it.

So: what if the team had an always-on teammate — accurate, active at any hour, endlessly
patient with the sixth repeat of a question, living in Slack where the coordination already
happens? That's uno-bot's founding job description.

### The tailwind: everyone is hiring this teammate

We weren't inventing the idea — we were riding it. Between June 2025 and June 2026, three
separate vendors shipped the identical interaction: @-mention an agent in Slack, it reads
the thread, works in the background, and returns a pull request or a finished task.
[Cursor's background agents](https://cursor.com/changelog/1-1) (June 2025),
[OpenAI's Codex in Slack](https://openai.com/index/codex-now-generally-available/) (October
2025), and [GitHub Copilot's coding agent](https://github.blog/changelog/2025-10-28-work-with-copilot-coding-agent-in-slack/)
(October 2025) all converged on that shape. Anthropic went further with
[Claude Tag](https://www.anthropic.com/news/introducing-claude-tag) (June 2026) — one Claude
per channel, building context passively and following up on forgotten threads; Anthropic
says 65% of its own product team's code now comes from their internal version. Slack itself
[rebuilt Slackbot as a context-aware agent](https://slack.com/blog/news/slackbot-context-aware-ai-agent-for-work)
(January 2026).

The demand signals reach past the vendors, and past engineering.
[OpenClaw](https://en.wikipedia.org/wiki/OpenClaw), an open-source always-on personal agent
living in WhatsApp/Telegram/Slack, went so viral in early 2026 that it triggered a trademark
fight and its creator was hired by OpenAI — grassroots proof that people want a persistent
teammate in their chat tool, not another dashboard. In the design world specifically,
designers like Tommy Geoco run always-on personal agents wired into their Slack-centric
operations and talk about the pattern publicly — persistent context, specialized agents,
review loops. (Companies like Ramp report large internal adoption of Slack-native agents
too, though mostly for engineering and data work — a design-side account of that story is
worth chasing before citing it; reportedly Geoco has interviewed Ramp folks on this.) The
tailwind was real; what was missing was a version built for a design team's coordination
work. So we built one.

One thing we do that the field mostly doesn't: Claude Tag, Cursor, and Codex auto-execute
and hand you the result to review *after the fact*. uno-bot's confirmation gate is
*pre-execution* — a proposal card, requester-only approval, deterministic confirmation
parsing, non-silent expiry. For a part-time student team touching shared sources of truth,
we think the stricter gate is the right trade. That's our contribution to the pattern, not
an import from it.

> **Takeaway:** the pitch isn't "AI bot." It's a named organizational pain — onboarding
> churn, silo drift, announcement blindness, continuity amnesia, founder bottleneck,
> timezone mismatch, repeat-question fatigue. If your team doesn't recognize itself in that
> list, you may not need a bot.

---

## 1. The evidence: 170 real requests before any architecture

We didn't write the bot's job description from imagination. We wrote it from a corpus of
real requests — and the corpus changed our minds about what mattered.

**The framework, as one chain:** ground on real requests → interpret where in the team's
workflow each request arose → connect stages into flow maps and identify the key usage
moments → sort each usage by who should initiate: things a smart teammate would surface
*before anyone asks*, things it should answer *on request*, and things that stay human →
set capabilities and limits intentionally (§3), driven by productivity intent, feasibility,
and cost.

**The evidence, triangulated from three sources.** First, Slack mining: real requests from
channels and 1:1 DMs, redacted to roles. Second, meeting transcripts: Zoom AI already
summarizes every meeting, and those recaps capture the questions people raise out loud —
which chat mining misses. Third, the lead's accumulated intuition from years of answering
these questions personally, used to sanity-check the ranking rather than replace the data.

**The corpus holds 170 requests across eight semesters, Spring 2024 through Summer 2026** —
each tagged with date, source, requester role, direction, theme, sub-type, verbatim quote
where captured, and whether it was a repeat — all in the
[Coordination Request Corpus](https://app.notion.com/p/4f78adae66b34d73b1faf8ba9a2d94a8),
with chart views (who asks whom; demand by semester, stacked by theme; the repeat-question
receipts) built for the article's figures. The measured theme ranking:

1. **Spec/PRD disambiguation** (~25) — and half the newer entries came from *developers*
   asking about tooltip copy, status-value semantics, and empty states, not from designers.
2. **Continuity recap** (~19) — "remind me where my work left off," decision recall,
   assignment recall, and the lead needing the reverse.
3. **Wayfinding** (~17) — where is the file, the folder, the meeting link, the spec page.
4. **DS source-of-truth** (~15), review & handoff (~8), bot meta/automation (~8), tooling
   onboarding (~5).

Three findings only became visible as the corpus grew:

**Continuity-recap was the hidden second place — and it lives in DMs.** At 25 entries it
didn't exist as a category. At ~55, it was 12 entries, and 11 of the 12 came from 1:1 DMs.
Channel-only mining structurally misses the exact requests that make the lead a single point
of failure.

**The demand shifted measurably across two years.** In 2024, coordination was manual and
ritual-based — a weekly design jam, semester-boundary onboarding rituals, and a lead who
personally narrated decisions into Slack, because there wasn't yet a queryable spec surface
to point at. Through 2025, "I missed the meeting, catch me up" and file-drift questions
grew with the intern cohort's course calendars. By Spring 2026 the demand had tilted
decisively toward wayfinding and repeatable lookups: where do spec pages live, who owns
this pilot, where's the docs folder. As the team and its design system matured, the
*automatable* share of coordination grew — that trend line is the case study's spine. One
problem even has a five-month paper trail: the "no clean way to update a component without
losing links" friction raised in September 2025 was still being manually worked around in
February 2026.

**The decision log is the missing source of truth.** The root cause shared by continuity and
many spec questions: decisions live in meeting memory and DM threads, not in any retrievable
artifact. Zoom AI makes the gap visible — it writes "next steps" bullets for every meeting,
roughly 100 recaps in three months, and they sit unread in an inbox. By Spring 2026 the team
was independently converging on the fix: a developer had started scoping a project to scrape
Slack history for frequently asked questions, and an intern asked the staging bot "what's
the difference between Card and Surface?" three times in one sitting. The demand was already
knocking.

**Two more scoping moves mattered.** A 17-step friction audit traced the designer's real
path from Figma publish to merged PR, timed each step, and ranked six friction points by
leverage — it also ruled what *not* to automate. The Notion PRD hop stayed manual on
purpose, because human intent-capture is the point. And we mapped flows before writing code:
the FigJam workflow board became five machine-readable flows, with the confirmation gate
designed as a state machine before it was code.
→ `docs/knowledge/research/2026-05-20-user-flow-friction-audit.md` ·
[Skills Upgrade hub](https://app.notion.com/p/PLUS-Uno-Skills-Upgrade-35db7cca498280378b4cf2d5960dcc62)

> **Takeaway:** collect ~50+ real requests across your chat tool *and* your meeting
> summaries before deciding anything. Interpret each request back to the workflow stage that
> produced it. Mine DMs, not just channels — that's where the bottleneck hides. The corpus
> then works three times: scoping evidence, capability input, and your first eval set (§8).

---

## 2. The job description: one teammate, proactive and reactive

Grouping the corpus semantically produced the job description. Some requests recur on a
schedule or follow an event — a Figma publish, a merged PR, a weekly deadline — and a smart
teammate would raise those *before anyone asks*. The rest arrive as questions and vary too
much to script. That split became the bot's two modes, and the difference is who initiates.

**We call the selection step capability matchmaking.** Grouping tells you what the team
asks; it doesn't tell you what a bot should own. So each theme was matched against two more
things: what language-model agents are reliably good at — learned from research and from
months of daily building with them — and which of our own sources the answer would stand on:
the design-system blueprint, Notion cards and running notes, meeting-AI recaps, the
codebase. A theme became a capability only when all three lined up. Continuity recaps
matched completely — 35 of 36 are answerable and every source they need is already readable
today. Spec disambiguation matched halfway, so the lookup half became bot work and the
judgment half deliberately stayed human. And some real demand matched nothing yet: decision
tracking has nowhere to stand until the new project-hub template is in routine use, and
team-level memory waits on a shared Design Notes DB. That demand didn't get cut — it got
sequenced into a roadmap behind the dependency each item waits on, or built in parallel
where the dependency is already underway. Matchmaking is also why this write-up can afford
to be candid: not everything mapped cleanly, and the phased releases follow the map.

**Proactive mode: the bot surfaces information before anyone asks.** Scheduled or
event-triggered routines run the same steps every time and report into Slack — consolidating
updates in the one place coordination already happens. Ours:

- *Figma → code.* A poll detects published component changes and auto-creates a Notion PRD
  with screenshots, a change summary, and acceptance criteria. It notifies #figma-sync. A
  designer adds intent notes, types `implement <Component>` in Slack, and gets a draft PR
  with per-phase status in the thread. The PRD flips to "In Review" when the PR opens. The
  dispatch payload carries the full Slack thread transcript (names resolved, capped at 50
  messages), so the runner sees the conversation that led to the trigger, not just the
  trigger line — the bot still never touches the repo; it only briefs the runner better.
- *Code → Figma.* Component snapshots and registries are generated and kept in sync, so
  committed code changes surface back toward the Figma documentation instead of drifting.
- *Prototype scaffolding.* A gated tool turns a Figma frame into a scaffolded prototype
  branch, run by a repository-dispatch runner.
- *Ops.* A 15-minute watchdog cron probes the bot's own integrations and posts a throttled
  alert when one degrades.
- *One honest dropped attempt.* We wanted Figma token/variable sync and removed it — Figma's
  Variables API is gated to the Enterprise plan. Know your plan tiers before promising a sync.

**Reactive mode: the bot responds to requests.** @-mention it with anything — roadmap
lookups from vague descriptions, design-system questions, service-blueprint walkthroughs,
"where did we discuss X," continuity recaps, screenshot critique, access routing ("who owns
X?" — the bot names the admin from the team's service registry and drafts the ask; the
grant itself stays human). An agent loop interprets
the request and picks tools per turn. Anything with side effects stops at a **confirmation
gate**: the bot stages a proposal card, and only the original requester's ✅ (or a plain "go
ahead") executes it. Section 3 covers the gate in detail.

Both modes live in one Cloudflare Worker (§4). They share one harness and one set of safety
rails, and they hand heavy execution to GitHub Actions runners. The bot proposes and gates;
runners do the work.

> **Takeaway:** proactive vs reactive is not an either/or — most teams need a mix, and the
> ratio should come from grouping your evidence, not from intuition. Design the automations
> as bot capabilities whose output lands in Slack under the bot's identity, so the team
> experiences one coherent teammate rather than a bot plus a pile of scripts.

---

## 3. The contract: what it does, half-does, and refuses — enforced in code

The capability contract is a published table that tells your team what the bot fully does,
partially does, and refuses. It exists so the bot's limits are chosen and written down — not
discovered by users through failures. We needed it because the bot had grown
capability-by-capability across sessions and had become simultaneously over-challenged and
under-used.

**Three lanes, shipped verbatim as the team-facing usage contract:**

- ✅ **Does fully** — grounded Q&A, gated Notion writes, gated build triggers, thread
  summaries, qualitative visual review, plus the proactive automations from §2.
- 🟡 **Partial** — a good-enough deliverable plus a named threshold plus a relay. Example:
  "drafts the PRD, a human finishes it."
- 🔴 **Rejects and routes** — blueprint writes, Figma generation, repo edits, scheduled
  follow-ups.

**The redirect design is the critical piece.** A bot that says "I can't do that" and stops
leaves people stuck, and stuck people quietly abandon the bot. So every rejection and every
partial threshold runs the same ritual: name what and why in one line, then hand over a
concrete next step — a gated intake ticket, or a ready-to-paste prompt for the full-powered
IDE agent with the links already filled in. Nobody who hits a wall leaves empty-handed. The
"no" still moves their work forward. Architecturally, the bot is a deliberate, enforced
subset of the IDE agent; the differences are intrinsic to being headless, not provisional.

**One thing the contract never does is move a decision to the bot.** Every lane above
automates coordination — finding, relaying, summarizing, drafting — never judgment. Design
calls, spec calls, and policy calls stay with a person in every row; the 🟡 and 🔴 lanes
exist precisely to route those moments to the right human with the context already
assembled. The net effect runs the other direction: the hours the team used to spend
catching each other up return to the decision-making a bot cannot and should not do. The
loop gets more human, not less.

**The format is a template on purpose.** The three lanes, the redirect ritual, and a "what
would move this to ✅" column are the durable structure. Every row is the org's own usage
moments and judgment calls. Scaling the bot later means adding rows, not redesigning the
contract. Each lane call weighs three declared inputs: productivity intent (does automating
this help, or does the friction serve a purpose?), feasibility (what the runtime can
genuinely ground), and cost tier (what fits free architecture vs what needs paid).

**Every promise above is enforced in code, not just written as a rule.** Three layers, each
catch in exactly one place: harness rules, then code preflight, then runtime caps.

**The confirmation gate is the spine.** Side-effect tools never run immediately. The bot
stages a proposal card and waits. Only the person who made the request can approve it — with
a ✅ reaction, or by just saying "go ahead." Early on, the model sometimes re-staged a
duplicate proposal instead of reading "go ahead" as a confirmation; that's now resolved
deterministically in the Worker, not by the model. Proposals expire after an hour, and
expiry is never silent. A designer once approved a proposal late and heard nothing back —
the proposal had simply expired, and she reasonably concluded the bot was broken. Now every
expired approval gets a visible "nothing was executed" reply. The friction is the feature.

**Honesty is a ritual, not a hope.** Every factual answer carries a confidence self-rating,
and "high" is only allowed when the answer is grounded in a source fetched that turn. The
bot never claims an action it didn't fire. It states knowledge gaps instead of filling them,
and it offers "did you mean" candidates instead of dead-ending a vague description — the
reactive-mode cousin of the redirect design.

**Privacy is enforced twice — once as policy, once as physics.** The Slack search credential
can see the consenting admin's entire workspace, DMs included. A prompt rule ("private
sources stay private") shipped in the morning; by afternoon the team decided to make it
code. The Worker now drops DMs and non-allowlisted private channels before the model ever
sees them, passing only a count of withheld matches so the bot can honestly say more results
exist.

**Every outgoing message passes one sanitizer.** It coerces formatting to Slack's dialect,
scrubs citation markers, unwraps mangled links, truncates at word boundaries, and rewrites
invented GitHub org names to the canonical one — the model invented plausible-sounding orgs
twice in one day. A companion rule bans internal mechanics from user-facing replies. The
leak that forced it: "my tool run budget for this turn has been exhausted [docs/plans/…]"
reached a designer, verbatim.

**Untrusted input stays untrusted.** Fetched content and pasted images are data, not
instructions, and writes stay gated regardless. Telemetry never logs full message text.

→ `docs/plans/2026-07-09-001-refactor-uno-bot-architecture-consolidation-plan.md` ·
`agents/uno-bot/AGENT.md` · `agents/uno-bot/README.md`

> **Takeaway:** write the capability matrix before hardening and publish it as the contract.
> Make the redirect non-negotiable — it's the difference between a limited-but-loved
> teammate and an abandoned bot. Then enforce every promise twice: prompt rules explain,
> code enforces.

---

## 4. The workplace: hosting, limits, and the kill timers

**One bot, not three.** We considered persona bots — a critique bot, an assistant bot, an
ops bot — and rejected the split. The final architecture is one user-facing bot plus one
cron ops pipeline, divided by *trigger* (proactive vs reactive, §1), never by persona.
Progressive disclosure keeps one bot cheap under prompt caching, and one bot packages as a
portable plugin.
→ [ADR](https://app.notion.com/p/390b7cca4982816e8e24f29906ca3667) ·
[Final recommendation](https://app.notion.com/p/390b7cca49828198a9eed9d0558df93a)

**Hosting options** (verified 2026-07; re-check the linked pricing pages, not this table):

| Option | Free tier / entry cost | Fits | Breaks down when |
|---|---|---|---|
| **Cloudflare Workers + Durable Objects** ← our choice | $0: 100k req/day, 5 cron triggers, SQLite DOs, KV | Both modes: Slack events endpoint + scheduler + per-thread state, one codebase | CPU-heavy work (~10ms/invocation); >50 outbound calls per invocation |
| Workflow platforms — Zapier, Make, n8n, Pipedream | Free tiers; realistic team usage ~$10–129/mo | Pure proactive pipelines for no-code teams; Pipedream adds code steps | The agent loop — linear step models don't fit multi-tool turns; per-task price creep; leaving is a replatform |
| Vercel / other edge functions | Comparable free tiers | Simple event endpoints | No per-thread state primitive for conversations |
| AWS Lambda + DynamoDB | Generous free tier, more assembly | Teams already deep in AWS | Overkill and cold starts at this scale |
| **GitHub Actions** (as runner, not host) | Free minutes at team scale | Heavy execution behind any host: codegen, builds, long jobs | Not a web endpoint — can't receive Slack events |

Live references: [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) ·
[limits](https://developers.cloudflare.com/workers/platform/limits/) ·
[cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) ·
[Zapier](https://zapier.com/pricing) · [Make](https://www.make.com/en/pricing) ·
[n8n](https://n8n.io/pricing) · [Pipedream](https://pipedream.com/pricing)

**How to choose.** Conversational or mixed: Cloudflare. Pure proactive pipeline with anyone
technical involved: still Cloudflare — same $0, and the decision stays reversible, because
proactive and reactive are the same Worker with different handlers. Changing the mix later
is more code, not a replatform. A truly no-code team building a pure pipeline can
legitimately pick a workflow platform; they should know the ceiling they'll hit if
conversation comes later. Heavy execution goes to a GitHub Actions runner under any host.

**What it actually costs.** Infra is $0 — our busiest day ever (~100–120 agent turns) sat
two orders of magnitude under the free tier. LLM spend on the current model runs about
$0.01–0.03 per simple lookup and $0.15–0.35 per heavy multi-tool turn, which lands at
**$5–20/month** at this team's scale. The Anthropic-era turns were measured directly from
telemetry: $0.08–0.21 for search-heavy turns, with a confirmed ~67–93k-token cached prompt
prefix. Full math and measured-vs-estimated labels:
`docs/knowledge/research/2026-07-12-uno-bot-cost-analysis.md`.

**The brain is markdown, not code.** The Worker is only the body. The bot's behavior lives
in ~20 markdown files fetched from GitHub at runtime and prompt-cached — merging a doc PR
reprograms the bot within five minutes, no redeploy. A KV last-known-good snapshot plus
degradation alerts keep it resilient when fetches fail. This choice paid an unplanned
dividend later: a vendor-neutral markdown harness is what made the model-provider swap an
afternoon's work (§5).

**The survival checklist.** Free-tier limits are design inputs, not obstacles — we wrote
them into `wrangler.toml` and let them shape the architecture. Each item below was
discovered by a live incident:

1. **Know your background-task cutoff.** Cloudflare kills `waitUntil` work at ~30 seconds
   with no exception thrown. Two requests got a 👀 reaction and then nothing; the logs showed
   death at exactly +30s. Fix: run agent turns in a Durable Object alarm, one per thread,
   with the HTTP handler doing nothing but verify, dedup, and enqueue. Keep the executor a
   separate DO class from the state — a DO that fetches itself deadlocks.
2. **Know your edge idle timeout.** The model API's edge kills idle HTTP around 100 seconds.
   Fix: stream every long model call. Flowing bytes keep the connection alive.
3. **Know your outbound-call budget.** 50 subrequests per invocation on the free tier. An
   11-minute run once succeeded at the model layer and then died on delivery with "Too many
   subrequests." Fixes: one job per alarm firing, the harness served from a single KV read
   instead of 20+ fetches, direct-query tools instead of search chains — and a dedup TTL
   longer than your longest run, because that 11-minute run outlived its own 10-minute dedup
   record and re-ran itself.
4. **Deploys restart your executors mid-run.** With one-shot dedup, the kill becomes
   permanent: every retry sees the marker and skips, and the user gets permanent silence.
   Fix: dedup records are leases. A claim marks "running," completion marks "done," and a
   stale lease gets reclaimed and re-run.
5. **One dead dependency shouldn't kill the request.** A single unreachable MCP server
   failed 100% of requests until we caught that error, dropped the attachment, and fell back
   to REST tools — with telemetry reporting the fallback.

The principle underneath all five: **never silent.** Every failure path posts something
visible to the user and something to ops — a ⚠️ with error text, a "nothing was executed"
reply, a throttled alert, one telemetry line per request, and a build tag on `/health`. That
last one exists because an entire eval round once unknowingly tested a stale deployment.

> **Takeaway:** pick the platform whose primitives map to your jobs — event endpoint,
> scheduler, per-thread state, runner — and prefer the one that keeps your mix decision
> reversible. Then enumerate its kill timers before shipping. Every death must leave a
> visible corpse.

---

## 5. The brain: choosing a model, deleting the routers

The model choice comes before tool connections (§7) because it gates them: some providers
run MCP tool calls server-side, and some don't.

One incident shapes our advice more than any benchmark. We A/B-tested a budget-tier model as
the default — it was six times cheaper. It fabricated grounding: invented plausible-looking
GitHub org names in resource links and claimed verification it never ran. We reverted within
fifteen minutes. A grounding-first bot can't ship hallucinated links to save five cents a
turn. Let hallucination, not latency, be the veto.

**Provider options** (pricing July 2026; re-check the linked pages):

| Option | Pros | Cons | Our experience |
|---|---|---|---|
| **Anthropic (Claude Sonnet/Opus)** | Server-side MCP; adaptive thinking + effort dials; strongest agentic reliability in our testing | Highest per-token cost; budget exhaustion is a real operational risk | Ran the whole hardening era; excellent; budget forced a switch |
| **Google (Gemini 3.5-flash, $1.50/$9 per M)** | Cheapest capable tier; built-in search + URL grounding at no subrequest cost; implicit caching | No server-side MCP — you write the client-side tool loop; schema quirks | Current default; beat our prior Claude rounds on card/status workflows in live grading |
| **OpenAI (GPT-5.4-class, ~$2.50/$15 per M)** | Server-side MCP in the Responses API; hosted web search and code tools; reasoning preserved across tool calls | We haven't evaluated it; its nano tier carries the budget-model caution above | The provider seam makes this A/B cheap for any builder |

Live references: [Anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) ·
[Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) ·
[OpenAI pricing](https://developers.openai.com/api/docs/pricing)

**Routing: we built two routers and deleted both.** Generation one was a keyword-to-tier
table — trivial to build, wrong often; critique requests kept landing on the cheap tier.
Generation two was an LLM micro-classifier that categorized each request before answering —
smarter, but it added latency, cost, and one more thing to tune, and it hid a real expense:
every hop between model tiers paid a cold ~90k-token prompt-cache read. The end state is
generation three: **no router.** One good model with adaptive thinking self-regulates
effort, escalates to a bigger model mid-turn through an advisor tool when it needs to, and
delegates mechanical lookups to cheap parallel subagents. One always-warm cache beat every
"smart" routing scheme we tried. Framework routers (LangGraph-class) never made the list —
lock-in, and the wrong size for an edge Worker.

**The seam that saved us.** Everything provider-specific sits behind one contract at the
agent-turn level: events, the confirmation gate, delivery, and history never know which
model is running. When the Anthropic budget ran out mid-trial, the provider swap shipped the
same afternoon. That seam — plus the markdown harness from §4 — is why "try OpenAI" stays a
cheap experiment instead of a rewrite.

> **Takeaway:** don't build a routing layer. One good model with adaptive thinking beats
> keyword tables and classifier pre-calls, and a warm cache beats tier-hopping. Put the
> provider seam at the agent-turn contract, and A/B cheaper models against your grounding
> evals before trusting them.

---

## 6. The soul: a persona people want to talk to

The brain decides what the bot can do. The persona decides whether anyone wants to talk to
it. A bot the team likes gets used; a beige one gets ignored. We designed the persona as
deliberately as the tools, and it's the most creative, most customizable layer of the build.

**Start with one line worth writing carefully.** Ours: "the 🐐 teammate — the one everybody
loves working with and secretly wants to become. Sharp, warm, zero ego. Competent first,
funny second, never precious." The bot knows it's a bot and is comfortable there, with a
budget: one self-aware aside per conversation, maximum. ("The Roadmap board is basically my
hometown.")

**Calibrate energy; don't leave it to vibes.** Default energy sits one deliberate notch
above neutral. Openers carry a pulse — "Found it —", "Good news:", "Okay, this one's fun:" —
instead of flat topic sentences. Emoji are seasoning where the moment earns them (🎉 on a
ship), never decoration on every bullet, and never in error or blocker moments.

**Reactions are the personality channel.** Replies are word-budgeted; reactions aren't, so
that's where the character lives. Match the emoji to the content, not just the sentiment —
the "it actually read the message" signal is the joke. Check the workspace's custom emoji
before settling for stock. Join a pile-on once; twice is a loop.

**Keep protocol signals separate from personality.** 👀 seen, 🛠 working, ✅ done, ❌ plus
error text on failure — one per transition, never instead of a reply.

**Give the voice hard rails that hold under pressure.** Audience translation: no internal
machinery names, ever — the test is "would a designer who has never seen the codebase
understand every single word?" No scaffolding filler. Summary-first on long answers.
Hyperlink every resource named.

The persona is one versioned markdown file in the harness. Another org's bot can be a
deadpan librarian, a hype-person, or a gruff senior engineer by editing that file. Go as
creative as your team's culture allows — the rails keep it professional when things break.

→ `agents/uno-bot/AGENT.md` § Identity & voice, § Reactions

> **Takeaway:** design the persona like you design the tools — a one-line identity,
> calibrated energy, a personality channel separate from protocol signals, and hard rails
> for failure moments. It's one markdown file, and it's why people talk to the bot at all.

---

## 7. The hands: wiring up tools — API or MCP, per source

For every source of truth the bot needs, you'll choose between the service's plain REST API
and its hosted MCP server. (MCP — the Model Context Protocol — lets a model call a vendor's
tools directly; "server-side MCP" means the model provider executes those calls itself, so
your code never loops.) We connected five services and got five different answers.

**The decision tree, per source:**

1. **Does the bot need this source at all** — or can it relay to a tool that already has it?
2. **Read or write?** Writes go through your own confirmation-gated tools, never MCP. MCP
   tools execute server-side mid-turn, so the gate from §3 cannot intercept them.
3. **Is this a bounded corpus the bot must answer authoritatively about** — your roadmap
   board, your component inventory? Build a direct-query tool on the REST API. Search
   endpoints are not databases: Notion's search kept missing a card by its literal title
   until we replaced the search chain with a direct database query that returns complete
   result sets and ranked "did you mean" candidates.
4. **Otherwise, weigh the tradeoff:**

| | Hosted MCP | Plain REST API |
|---|---|---|
| **Pros** | Vendor maintains the tool surface; with server-side MCP (Anthropic, OpenAI Responses API), tool rounds cost no subrequests and no loop code | Deterministic and precise; gate-compatible; portable across providers; your existing key usually works |
| **Cons** | Every service is its own auth research project; allowlist typos fail silently; tool lists bloat every call; writes bypass gates; without server-side MCP (Gemini) you write the loop anyway | You write and maintain the tool code; each call counts against the 50-subrequest budget |

**Our five verdicts** (2026-07 — probe live before trusting; auth models churn):

| Service | Verdict | Reality |
|---|---|---|
| **GitHub** | MCP, easy | Static token as Bearer; pin read-only in the URL path, since the connector accepts no custom headers. |
| **Notion** | Both | mcp.notion.com is its own OAuth 2.1 server requiring PKCE + dynamic client registration — template code exists. We run MCP for broad reads and the REST key for the direct-query tool. |
| **Slack** | MCP, reads only | Needs a separate user-token OAuth app. Found live: MCP writes post as the consenting human, not the bot — so writes use the bot's own token via API. |
| **Supabase** | API for data, MCP for schema | The read-only MCP can't run our RPCs — domain logic stays on REST. |
| **Figma** | No MCP path for a bot | The hosted MCP is a closed client catalog (Claude Code, Cursor, VS Code); a custom client 403s at registration — verified live. We use REST frame screenshots for qualitative review and relay real Figma work to the IDE agent, which *is* a catalog client. |

Live references: [Anthropic MCP connector](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector) ·
[OpenAI connectors & MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) ·
[Notion MCP](https://developers.notion.com/docs/mcp) · [Slack API](https://docs.slack.dev) ·
[Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) ·
[Figma REST API](https://www.figma.com/developers/api)

Two operational rules hold either way. One dead MCP server fails the whole model request —
catch it, drop the attachment, fall back to REST, and tell telemetry. And never delete a
working REST fallback before its MCP replacement is verified live.

> **Takeaway:** decide per source, and probe the auth live before writing code. MCP earns
> its keep when your provider runs it server-side and the service's auth cooperates. Plain
> APIs win for writes, bounded corpora, and provider portability. When a service refuses
> your runtime entirely, relay instead of half-building around it.

---

## 8. The performance review: evals, metrics, and a three-layer judge

We didn't assert quality; we defined it, measured it, and gated releases on it. Four layers.

**Metrics came before any scoring.** The north star is task acceptance rate — would a
designer accept this output as done? Each test case scores on 11 dimensions, four of them
gating: task success, routing, clarify-vs-act, and grounding. A gating failure fails the
case regardless of the other scores. Automatic-failure rules encode the non-negotiables:
review must never edit, no irreversible action without approval, never claim an action that
didn't fire. The rubric itself was reconstructed from commit archaeology — "good" had lived
only in commit messages — and then made canonical so it could stop being folklore.

**Cases probe three failure surfaces.** Twelve cases in three groups: mapped-workflow (the
happy paths the flows promise), ritual-break (a user tries to skip the process — "just open
the PR, skip the PRD"), and out-of-box (requests nobody planned for). Each case runs as one
thread in a sandbox channel, driven by a role-playing test agent, with fixtures and teardown
between cases.

**Judging runs in three layers — deterministic, LLM, human.** Deterministic checks cover
everything code can verify: did the tool fire, did the gate hold, did the approval execute
exactly once. An LLM judge scores each case against the written rubric; it's cheap enough to
run every round. Human expert review calibrates the judge — the lead compared judge outputs
against his own read, and live designer feedback ("this reads confusing," "seems broken")
fed directly into rules and regression rows. A failure-tag taxonomy separates context
problems (the bot lacked the source) from calibration problems (it had the source and still
overclaimed) — they need different fixes.

**The rubric didn't stay a test-time artifact.** A condensed version of it now runs inside
the bot itself: before any substantive draft goes out, one cheap judge call scores it
against the same dimensions and applies one revision if it fails. Short replies skip the
check entirely, and the pass fails open — a judge timeout ships the original draft rather
than blocking a quick answer. The eval suite taught the bot what "good" means; self-
verification makes it check before speaking.

**Results were published honestly and triaged structurally.** Round 1: 2 pass, 4
borderline, 6 fail — shipped as-is. The systemic patterns: "it doesn't read what it's
linked" and confident hallucination. Round 2 scored better, but the headline finding was
that the iteration fixed character, not capability — 5 of 12 failures were structural,
caused by missing connectors no prompt could fix. That triage question — character or
capability? — is worth asking before writing any new prompt rule. The regression battery
(R1–R12, each one Slack message with a binary outcome) became the release gate: a new win
adds a row, a failing row blocks release. And live battery testing with real designers
forced the final hardening — every observed failure converted same-day into a rule or a code
guard. Synthetic probes miss what humans do.

→ [Test Plan](https://app.notion.com/p/UNO-Bot-Test-Plan-390b7cca498281ad9b6ffab0b705b611) ·
[Round 1](https://app.notion.com/p/390b7cca498281d8bb3fcc0e195961c5) ·
[Round 2](https://app.notion.com/p/392b7cca498281318dcbd0a501e51731) ·
[Blueprint grounding eval](https://app.notion.com/p/UNO-Blueprint-Grounding-Evaluation-390b7cca498281f99d31d728a5588ec5) ·
`docs/evals/scenarios/uno-bot.md` · `docs/evals/rubrics/bot-answer.md`

> **Takeaway:** define the acceptance metric and the gating dimensions before testing. Probe
> three surfaces — happy path, ritual-break, out-of-box. Judge with all three layers, and
> keep a binary regression battery as the release gate. Test live with real users early.

---

## 9. What we'd tell you: eight lessons

1. **Two-layer defense, everywhere.** Every prompt rule gets a deterministic code twin —
   gate, preflight, search filter, egress scrub. The pattern repeats six times across this
   build. Prompt rules explain; code enforces.
2. **The confirmation gate is the spine.** Everything else protects or extends it.
3. **Docs are the executable brain, so doc drift is a production bug.** Four shapes we've
   named: switches documented as states; changed constants surviving in old doc surfaces;
   renames finished in the index but not the leaves; counts rotting fastest. Countermeasures:
   consistency sweeps, a link validator, build tags. Corollary: a failing guard is worse
   than no guard — a validator that's red on noise trains people to ignore it.
4. **One live failure per fix.** Nearly every hardening commit names the probe thread that
   forced it. Incident-driven hardening is also what makes the story tellable.
5. **The free tier is a design input**, not an obstacle.
6. **Vocabulary is harness content.** The bot kept conflating two estates that share topic
   words — the service blueprint and the roadmap — because the harness taught routing but
   never the vocabularies themselves. The fix is a two-vocabularies table with each estate's
   terms *and* its NOT-words. Domain language is config, not prompt garnish.
7. **Generalization was planned from day one.** Org-specific content lives in dedicated
   files, IDs live in env vars, and `<!-- Plus-specific -->` markers tag the rest — so
   extracting a template is content extraction, not a refactor.
8. **Make big decisions reversible and they stop being scary.** The hosting choice (a mix
   change is more code, same Worker), the provider seam (a budget crisis became an
   afternoon), the markdown harness (a behavior change is a doc PR).

---

## 10. Going forward

- ~~Corpus backfill~~ **Done:** ~119 rows across three semesters in the
  [Coordination Request Corpus](https://app.notion.com/p/4f78adae66b34d73b1faf8ba9a2d94a8),
  with verbatim role-attributed quotes and evidence links for the case study.
- ~~Skills-landscape benchmark~~ **Done:** ~10 comparables analyzed; positioning and
  adopt-list live in the skill plan (§7 there).
- ~~Real cost numbers~~ **Done:** `docs/knowledge/research/2026-07-12-uno-bot-cost-analysis.md`.
  One refinement queued: log the cached-token count in telemetry so the next pull is fully
  measured.
- ~~Writing style~~ **Done:** `docs/conventions/article-writing-style.md`; this revision
  applies it.
- Remaining: merge the corpus expansion into the canonical Notion page if desired; build the
  Notion charts/views on the corpus DB; draft the article from this recap.

## 11. Source index

- **Corpus:** [Coordination Request Corpus](https://app.notion.com/p/4f78adae66b34d73b1faf8ba9a2d94a8) ·
  `docs/knowledge/research/2026-07-12-request-corpus-expansion.md` ·
  [original 25-entry corpus](https://app.notion.com/p/390b7cca498281bb899ae865a2ffa460)
- **Repo:** `docs/plans/2026-07-08-00{1..4}`, `2026-07-09-001` (the consolidation ADR — the
  single best document), `docs/knowledge/decisions.md`, `docs/knowledge/lessons/
  2026-07-10-harness-consistency-sweep.md`, `docs/conventions/terminology.md`,
  `agents/uno-bot/AGENT.md` + `README.md`, `docs/evals/`, `.github/workflows/`.
- **Notion:** UNO Bot v1 card (#2372) · v2 card (#2427) · Architecture ADR · Final
  Architecture Recommendation · Generalization & Plugin Packaging · Skills Upgrade hub ·
  Test Plan + Round 1/2 results · Blueprint Grounding Evaluation.
- **Git:** full chronology in PRs #27–#60.
