# Article Writing Style — how Anthropic writes, applied to us

> Distilled from Anthropic's public writing — see Sources. Originally built from six pieces
> (2024–2025); refreshed July 2026 against Anthropic's most recent public writing (late 2025
> through July 2026) to check whether the voice had shifted. Extended a second time, same month,
> with a **product register** pass (sources 16–23) — the engineering-blog corpus alone reaches
> readers who already think in systems and benchmarks, and the `uno-bot` piece also needs to
> reach a less technical reader. Built for two jobs: (a) the Medium/Substack recap of how this
> design team built `uno-bot`, and (b) tightening `docs/knowledge/uno-bot-build-recap.md`, which
> is dense and hard to skim in its current form. This doc is downstream of `writing-style.md`
> (the canonical voice doc for all agent-produced text) — that doc sets the rules; this one shows
> how a specific, respected public voice applies them at essay length, with before/afters pulled
> from our own recap.

## Sources

**Original corpus (2024–2025):**

1. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — engineering blog
2. [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) — engineering docs (formerly `/engineering/claude-code-best-practices`)
3. [Claude Opus 4.5 announcement](https://www.anthropic.com/news/claude-opus-4-5) — product news
4. [Tracing the thoughts of a large language model](https://www.anthropic.com/research/tracing-thoughts-language-model) — research explainer
5. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — engineering blog
6. [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — product news

**Added in the July 2026 refresh (late 2025 – July 2026):**

7. [Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) — product news (June 2026)
8. [Claude Fable 5 and Claude Mythos 5](https://www.anthropic.com/news/claude-fable-5-mythos-5) — product news (June 2026)
9. [How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude) — engineering blog
10. [Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler) — engineering blog, individually bylined
11. [How we built Claude Code auto mode: a safer way to skip permissions](https://www.anthropic.com/engineering/claude-code-auto-mode) — engineering blog
12. [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — engineering blog (Jan 2026)
13. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) — engineering blog, individually bylined
14. [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents) — engineering blog
15. [An update on recent Claude Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem) — engineering blog, public postmortem

**Product-facing corpus, added for the broader-audience pass (2025–2026):**

16. [Loop engineering: Getting started with loops](https://claude.com/blog/getting-started-with-loops) — product blog (Claude Code, but written for a mixed technical/PM audience — the least "engineering-blog" of the Claude Code pieces)
17. [A global workspace in language models](https://www.anthropic.com/research/global-workspace) — research explainer, written for a general public audience despite the technical subject (interpretability / "J-space")
18. [Claude for Chrome](https://claude.com/claude-for-chrome) — product page
19. [Introducing Claude Tag](https://www.anthropic.com/news/introducing-claude-tag) — product news
20. [Get started with Claude](https://support.claude.com/en/articles/8114491-get-started-with-claude) — Help Center, written for first-time non-technical users
21. [Anthropic Economic Index report: Cadences](https://www.anthropic.com/research/economic-index-june-2026-report) — research report with a general-audience framing layer (June 2026)
22. [Claude Cowork](https://claude.com/product/cowork) — product page
23. [Introducing Claude for Small Business](https://www.anthropic.com/news/claude-for-small-business) — product news, aimed at non-technical small-business owners

Three genres, one voice: plain, evidence-first, unhyped, structured as a narrative rather than
a spec sheet. The differences between genres are in *what* they show (benchmark tables vs.
neuroscience analogies vs. failure anecdotes), not in *how* they write a sentence. The 2026
corpus adds two genres the 2024–2025 set didn't have — the public incident postmortem (source 15)
and the individually bylined engineering deep-dive (sources 10 and 13) — and the differences
those introduce are called out below. Sources 16–23 are a fourth genre: **the product register**,
covered in its own section below — the same 11 principles hold, but the *packaging* around them
changes enough that it needs separate documentation.

---

## What changed recently (late 2025 – July 2026)

The core voice hasn't moved: still plain, evidence-first, structured as narrative, still averse
to hype and exclamation points. What's different in the 2026 corpus is mostly additive —
new structural devices layered on top of the same 11 principles, not a replacement for them.

- **First person singular now appears — but only in bylined deep-dives.** Principle 9 ("no
  'I'") held across all six 2024–2025 sources, all of which read as team-voice. Two 2026
  engineering posts are individually bylined technical deep-dives, and both use "I" freely:
  "Building this compiler has been some of the most fun **I've** had recently, but I did not
  expect this to be anywhere near possible so early in 2026" — [Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler);
  "**my** conviction is that the space of interesting harness combinations doesn't shrink as
  models improve" — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps).
  Product announcements, systems posts, and postmortems still use "we" throughout with zero
  "I." Read this as a genre split, not a rule change: team-voice docs (announcements, recaps,
  postmortems) stay "we"; a single-author technical deep-dive with a named byline can use "I."
  `uno-bot-build-recap.md` and the Medium piece are both team-voice — principle 9 still applies
  to them unchanged.
- **Failure disclosure got its own heading device.** [How we contain Claude](https://www.anthropic.com/engineering/how-we-contain-claude)
  uses repeated headings literally titled "Risk we missed: Everything before the trust dialog"
  and "Risk we missed: The user as an injection vector" — turning principle 5 (show the failure)
  into a structural label a reader can spot while skimming the table of contents, not just a
  paragraph buried in prose.
- **The public postmortem is a new, more compressed skeleton.** [An update on recent Claude
  Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem) drops the
  five-part problem → approach → tradeoffs → failures → close shape entirely. It opens with
  "We traced recent reports of Claude Code quality issues to three separate changes," then
  gives each cause its own heading ("A change to Claude Code's default reasoning effort," "A
  caching optimization that dropped prior reasoning," "A system prompt change to reduce
  verbosity"), and closes with a single "Going forward" section. No victory lap, no hedge — just
  cause, cause, cause, fix. If uno-bot ever needs an incident writeup, this is the shape to copy,
  not the longer narrative skeleton in principle 6.
- **Safety framing got heavier and more itemized.** The Opus 4.5 announcement in the original
  corpus gave safety a paragraph. [Claude Fable 5 and Mythos 5](https://www.anthropic.com/news/claude-fable-5-mythos-5)
  gives it eight subheadings — "Claude Fable 5's new safeguards," "Safety classifiers,"
  "Cybersecurity," "Biology and chemistry," "Distillation," "A new data retention policy" — each
  with a number attached ("safeguards trigger in less than 5% of sessions"). Evidence-over-
  adjectives (principle 3) is unchanged; there's just more surface area being covered with it.
- **New house terms get the same one-time plain-English definition, right on schedule.**
  "Mythos-class model" is defined at first use — "a Mythos-class model that we've made safe for
  general use" — then reused bare for the rest of the piece. Principle 2 holds exactly as
  written; the corpus just has new vocabulary (Mythos-class, trusted access program) to prove
  it with.
- **Numbers stayed precise, and got more willing to hedge the precision.** "Roughly 93%,"
  "~17% of overeager actions," "around 5–6% after 100 adaptive attempts" — the qualifier
  ("roughly," "around," "~") sits directly next to the number rather than replacing it. This is
  principle 3's hedging rule (§"Hedging words, used precisely") applied more often, not a new
  pattern.

---

## The 11 principles

Each principle: a verbatim Anthropic quote (under 15 words, linked), then a before/after
rewrite using our own `uno-bot` material — the "before" is drawn from or modeled on
`docs/knowledge/uno-bot-build-recap.md` as it reads today.

### 1. Open with the claim, not a hook

Anthropic's opening sentence almost always states the actual point. No scene-setting, no
rhetorical question, no "In today's fast-moving world of AI."

> "We've worked with dozens of teams building LLM agents across industries." — [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
> "Our newest model, Claude Opus 4.5, is available today." — [Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5)

**Before** (hook-first, the kind of opener a first article draft reaches for):
> "In today's fast-paced design world, our team set out to build something truly
> game-changing: an AI teammate that would transform how we collaborate forever."

**After:**
> "Our design team runs on Slack. About ten new student designers join it every quarter, and
> the same questions kept landing on one person. We built a bot that lives in Slack and
> answers them instead."

### 2. Define a term before you use it

Technical vocabulary gets one plain-English definition on first use, then the term is reused
without re-explaining. Anthropic never assumes the reader already knows the house term.

> "Workflows are systems where LLMs and tools are orchestrated through predefined code paths" — [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)

**Before** (recap doc, §1 — assumes the reader already knows the shorthand):
> "uno-bot is **one teammate operating in two modes** — and the distinction is who initiates:
> Proactive mode (automations)... Reactive mode (conversation)..."

**After:**
> "uno-bot does two kinds of work. Some of it happens before anyone asks — a scheduled check
> notices a change and posts about it. We call that *proactive*. The rest happens when someone
> @-mentions the bot with a question or a request — we call that *reactive*. Same bot, two
> triggers."

### 3. Evidence over adjectives

Claims are backed by a number, a named example, or "we found" — not by a stronger adjective.
"Best," "critical," and "significant" appear only when a benchmark or measurement sits next to
them.

> "10.6% jump over Sonnet 4.5" — [Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5)
> "Token usage by itself explains 80% of the variance" — [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

**Before:**
> "The visibility firewall is a critical, powerful safeguard that keeps the bot fully secure."

**After** (the real mechanism, from recap §3):
> "The Slack search credential can see the consenting admin's entire workspace, DMs included.
> The Worker drops DMs and non-allowlisted private channels before the model ever sees them —
> it only passes a count of what it withheld."

### 4. One idea per sentence

Anthropic's sentences are dense in *information* but not in *clauses*. Long sentences exist,
but each one tracks a single idea through to its end rather than nesting three parentheticals.

> "You can't hardcode a fixed path for every possible scenario in an open-ended problem." — paraphrased structure, [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

**Before** (recap §3, four ideas in one sentence with two nested parentheticals):
> "Side-effect tools never execute inline: the agent invokes the tool, the Worker stages a
> ⚠️ card, and only the **original requester's** ✅ (or a bare 'go ahead' — resolved
> deterministically Worker-side after the model once re-staged a duplicate instead of
> confirming) executes."

**After** (same facts, one idea per sentence):
> "Side-effect tools never run immediately. The bot stages a proposal card and waits. Only the
> person who made the request can approve it — with a checkmark reaction, or by just saying
> 'go ahead.' Early on, the model sometimes re-staged a duplicate proposal instead of reading
> that as a confirmation; that's now handled deterministically in code, not by the model."

### 5. Show the failure, not just the lesson

Principles land through a concrete incident, not an abstract rule. Anthropic states what broke,
then states what changed because of it.

> "One subagent explored the 2021 automotive chip crisis while 2 others duplicated work" — [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

**Before** (recap §3, principle stated but the incident is buried in a parenthetical):
> "A delayed ✅ meeting silence was read by a designer as 'the bot is broken.'"

**After** (pull the incident forward, let it carry the rule):
> "A designer once approved a proposal and heard nothing back for over an hour — the approval
> had simply expired. She assumed the bot was broken. Now every expired proposal replies with
> 'nothing was executed,' so silence never means failure."

*2026 refinement:* recent pieces go a step further and put the failure in the heading itself,
not just the paragraph under it — see "Risk we missed: The user as an injection vector" in
[How we contain Claude](https://www.anthropic.com/engineering/how-we-contain-claude). Worth
doing the same for the recap's "what broke" section: a heading like "What we missed: silent
expiry" scans better than a generic "Lessons learned."

### 6. Sequence as problem → approach → what we learned

Every engineering piece follows the same skeleton, visible in the headings themselves:
*why this exists* → *how it works* → *how we built/tested it* → *what went wrong and what we'd
tell you*. [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
runs: benefits → architecture → prompting & evals → production reliability → conclusion →
appendix. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
runs: definitions → patterns → when to use each → appendix case studies. Neither piece opens
with the org chart or the tech stack — both open with the problem the reader recognizes.

Applied to the `uno-bot` article, this argues for: **the coordination problem → the teammate we
built → the decisions and tradeoffs (hosting, model, tools) → what broke and what we learned →
what this means if you're building one too.** That's close to the recap's existing order
(§0–§9) — the recap's *sequence* is already sound; its *sentence density* is what needs to
change.

### 7. Tables to compare, prose to narrate

Anthropic reaches for a table exactly once per genre: when comparing discrete options
side-by-side (hosting platforms, model providers, before/after prompt pairs). It never uses a
table to tell a story — narrative stays in prose, options comparison moves to a table.
`code.claude.com/docs/en/best-practices` uses a three-column **Strategy / Before / After**
table for exactly this purpose.

**Before** (recap §5 compresses provider tradeoffs into table cells with embedded incident
narrative — the incident gets lost in a cell):
> "Lite/budget tiers as default | Cheapest of all | Veto lesson: ours fabricated grounding —
> invented org names in links, claimed verification it never did | Reverted in 15 min..."

**After** (keep the comparison in the table; pull the incident into a sentence above or below
it):
> "We tried a cheaper, budget-tier model as the default. It fabricated grounding — inventing
> plausible-sounding GitHub org names and claiming verification it never ran. We reverted
> within fifteen minutes. The table below is every provider we evaluated and why."
> *(table follows, incident-free)*

### 8. Bold marks the scan path, not the emphasis

Bold text in Anthropic's writing is sparse and functional: it marks the 2-5 words a skimmer
needs to catch the section's point, not every important-sounding phrase.
[Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
bolds "Think like your agents" and "Teach the orchestrator" — full imperative phrases that work
as standalone takeaways if you read only the bold text.

**Before** (recap §3 — bold applied so densely it stops signaling anything):
> "**The trust machinery that makes the contract real** — every promise above is **enforced,
> not asserted**, in three layers... The **✅ proposal gate is the spine.**"

**After:**
> "Every promise here is enforced in code, not just written down as a rule. **The confirmation
> gate is the spine** — everything else in this section protects or extends it."

### 9. We build it, you use it — no "I"

First person plural for the team's decisions and findings ("we chose," "we found"); second
person when instructing the reader directly ("you can," "if you're building one"); third person
for the bot/product itself. First-person singular is essentially absent from Anthropic's public
writing, even in pieces with a named author.

> "We share the engineering challenges and the lessons we learned from building this system." — [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

**Before:** "I decided the bot needed a confirmation gate after I saw it almost double-post."

**After:** "We added a confirmation gate after watching the bot almost double-post a message.
If you're building something similar, assume any side-effecting action needs the same kind of
checkpoint."

*2026 refinement:* this is a team-voice rule, not a universal one. Individually bylined
Anthropic deep-dives now use "I" freely — see "What changed recently" above. `uno-bot-build-
recap.md` and the Medium piece are both team-voice (no named single author, describing a team's
decisions), so the no-"I" rule still applies to them in full.

### 10. Cut hype, exclamation points, rhetorical questions

Across all six sources: zero exclamation marks, effectively zero rhetorical questions (one
appears in the research explainer, used once, answered immediately), and hype adjectives
("revolutionary," "game-changing," "groundbreaking") do not appear even in product launch
copy — "breakthrough" appears exactly once, immediately qualified by what it means concretely.

**Before:** "This was a total game-changer for the team — suddenly everyone had an answer,
instantly!"

**After:** "Once the bot shipped, the same question stopped reaching the lead a sixth time.
People got an answer from Slack instead of waiting for a reply."

### 11. End on the next concrete step, not a victory lap

Anthropic's pieces close by pointing somewhere — a system card, a call for collaborators, an
open research question — never by restating how impressive the result was.

> "If you are interested in working with us..." — [Tracing the Thoughts of a Large Language Model](https://www.anthropic.com/research/tracing-thoughts-language-model)
> "developers can now build against a standard protocol" — [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

**Before:** "And that's how we built an amazing AI teammate that changed everything for our
team!"

**After:** "The capability matrix and the confirmation gate are the two pieces we'd tell any
team to build first. Everything else in this recap follows from those two decisions."

---

## Sentence and paragraph mechanics

- **Paragraph length.** 2–6 sentences; most run 3–4. A single-sentence paragraph is a
  deliberate emphasis device, used sparingly (once or twice per piece), not a default rhythm.
- **Sentence length.** Mixed, not uniform. A long, information-carrying sentence (25–40 words)
  is regularly followed by a short one (7–15 words) that lands the point. Avoid a paragraph
  where every sentence is the same length — that's the single most identifiable "AI-generated"
  tell, and the opposite of how these pieces read.
- **Clause discipline.** One idea per sentence. If a sentence needs two parentheticals to hold
  together, it's two sentences.
- **Voice.** Active. "The Worker drops DMs," not "DMs are dropped by the Worker." Passive voice
  appears only when the actor is genuinely unknown or irrelevant.
- **Person.** "We" for the team and its decisions; "you" only when directly instructing the
  reader; "it" for the bot/system/model. No "I" in team-voice pieces like this one — that
  includes the uno-bot recap and the Medium article, both undated/unbylined team output.
  (Consistent with `writing-style.md`'s "named actors" rule. Anthropic's own 2026 individually
  bylined deep-dives do use "I" — see principle 9's 2026 refinement — but that's a different
  genre from what we're writing here.)
- **Headings.** Sentence-case, and they describe the content, not tease it: "Give Claude a way
  to verify its work," not "Verification Matters." A reader should be able to skim headings
  alone and get the argument.

  **2026 heading-style findings (for the recap retitle).** Pulled real headings from three
  recent pieces to check whether this still holds. It does, with two additive patterns layered
  on top:

  - *Still sentence-case, still descriptive over clever, most of the time.* [An update on
    recent Claude Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem):
    "A change to Claude Code's default reasoning effort," "A caching optimization that dropped
    prior reasoning," "A system prompt change to reduce verbosity." These are the most literal
    headings across the entire corpus, old or new — each one is just the cause, stated flatly,
    no wordplay. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps):
    "Why naive implementations fall short," "Frontend design: making subjective quality
    gradable," "Scaling to full-stack coding." Still sentence-case, still says exactly what the
    section covers.
  - *New: short, aphoristic, imperative-mood headings used as a takeaway device* — punchier than
    anything in the 2024–2025 corpus. [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents):
    "Don't adopt a pet," "Many brains, many hands." [Building a C compiler with a team of
    parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler): "Write
    extremely high-quality tests," "Put yourself in Claude's shoes," "Make parallelism easy." A
    reader who reads only these headings gets a list of rules, not a table of contents — this
    is principle 8's "bold marks the scan path" logic applied to headings instead of bold text.
  - *New: a repeated-prefix label used as a structural device.* [How we contain Claude across
    products](https://www.anthropic.com/engineering/how-we-contain-claude) reuses "Pattern 1:
    The ephemeral container (claude.ai code execution)," "Pattern 2: The human-in-the-loop
    sandbox (Claude Code)," and — notably — "Risk we missed: Everything before the trust
    dialog," "Risk we missed: The user as an injection vector." The colon-prefix pattern isn't
    new (Building Effective Agents already did "Workflow: ..." headings), but labeling a
    section "Risk we missed" as the heading itself, rather than burying the miss in prose, is.
  - *Closing sections are named for what's next, never for how it went.* Across the 2026
    corpus: "Going forward" (postmortem), "Looking ahead" (How we contain Claude), "Looking
    forward" (C compiler), "What comes next" (Harness design), "What's next" (Auto mode). Pick
    one of this family for the recap's final section — never "Conclusion" or "Wrapping up."
  - *Applied to the recap retitle:* prefer plain descriptive sentence-case for most sections
    (matches the postmortem/harness-design style), but it's fair game to make the "what broke"
    section headings short and pointed the way Managed Agents and the C-compiler post do —
    e.g., "What we missed: silent expiry" over "Lessons Learned," or an imperative takeaway like
    "Confirm the confirmer" if a section's whole point is a one-line rule.
- **Numbers over vague quantifiers.** "10.6% jump," "90.2%," "~55 real requests" — not
  "significantly better" or "a lot of requests." Our recap already does this well (§2's request
  counts); keep it in the article.
- **Hedging words, used precisely.** "Suggests," "we found," "appears to" — always tied to what
  was actually measured or observed. Never a vague hedge like "basically" or "sort of" used to
  soften an unclear claim. (Same rule as `writing-style.md` §"No filler, no hedging" — hedge
  only where genuine uncertainty exists, and say what's uncertain.)

## Structural pattern: problem → approach → what we learned

The shape that recurs across every engineering piece, and the one to hold the `uno-bot` article
to:

1. **Problem** — the reader-recognizable pain, stated in one paragraph, no bot mentioned yet.
   ("The team refreshes constantly... the standard fixes failed.")
2. **Approach** — what was built and the one or two decisions that mattered most (proactive +
   reactive as one bot; the capability matrix; the confirmation gate).
3. **How it was built** — the real tradeoffs, shown as a comparison (table) or a decision
   (prose), always with the option that was *rejected* and why, not just the one chosen.
4. **What broke, what we learned** — concrete incidents, each with the fix it produced. This is
   the section readers remember; don't compress it into bullet fragments.
5. **What this means for you** — a short, concrete close: what to build first, what to skip,
   where to look next. Not a summary of how well it went.

This maps almost directly onto the recap's existing §0–§9 order — keep that sequence. The
rewrite work is entirely at the sentence level (principles 1–11 above), not a restructuring.

*2026 addition — a second, shorter skeleton for incident writeups specifically:* the postmortem
genre (see "What changed recently" above) skips problem/approach/tradeoffs entirely and opens
straight on cause. Use the five-part shape above for the uno-bot article itself; reach for the
postmortem shape only if writing up a single incident on its own (e.g., a standalone "the day
the confirmation gate almost failed" writeup).

## The product register — writing for the broader audience

Everything above was distilled from Anthropic's *engineering* register — pieces written for
people who already think in systems, tradeoffs, and benchmarks. Sources 16–23 are a different
job: reaching someone who uses Claude (or wants to) but doesn't write code and doesn't want a
benchmark table. The 11 principles above still hold underneath — evidence over adjectives, one
idea per sentence, no hype, no "I" in team-voice pieces — but the *packaging* changes. This
section documents that packaging so the `uno-bot` piece can code-switch: engineering register
for the reader who wants to see the mechanism, product register for the reader who just wants to
know what changed for them.

**Nine named techniques, each with a verbatim example:**

1. **Benefit-first headline, mechanism second.** The headline states what the reader gets, not
   what was built. "A helping hand across all your tabs" — [Claude for Chrome](https://claude.com/claude-for-chrome) —
   only explains *how* (navigate, click, fill forms) in the subhead below it. Compare to the
   engineering register's principle 1 ("open with the claim"): the product-register claim is a
   *benefit* claim, not a *fact* claim.
2. **Second-person agency, not second-person instruction.** Engineering-register "you" tells the
   reader what to do next (principle 9). Product-register "you" tells the reader they're still in
   charge of something Claude is now doing for them. "You're always in control." — [Claude Cowork](https://claude.com/product/cowork) —
   and "You approve the changes instead of doing the sorting yourself." — [Claude for Chrome](https://claude.com/claude-for-chrome).
3. **A named workflow replaces the feature list.** Instead of enumerating capabilities, the copy
   names one concrete task a reader recognizes from their own week. "Attach your campaign
   exports, schedule a weekly task." — [Claude Cowork](https://claude.com/product/cowork) —
   and "Settle your QuickBooks cash position against incoming PayPal settlements." — [Claude for Small Business](https://www.anthropic.com/news/claude-for-small-business).
4. **An everyday sensory moment opens an abstract or technical idea.** Where the engineering
   register opens on the claim (principle 1), the product register — even in a research piece —
   can open on something the reader is doing *right now*. "As you read this sentence, circuits
   in your brain are adjusting your posture." — [A global workspace in language models](https://www.anthropic.com/research/global-workspace).
5. **Jargon gets a one-clause gloss dropped inline, never a defined-term callout box.** This is
   principle 2 applied more casually — the definition rides inside the same sentence as the
   term's first use, with no "Definition:" scaffolding. "Loops as agents repeating cycles of
   work until a stop condition is met." — [Loop engineering](https://claude.com/blog/getting-started-with-loops).
6. **Safety and limitations become direct-address instructions, not itemized subheadings.** The
   2026 engineering register gives safety its own numbered subheadings (see "What changed
   recently" above). The product register instead tells the reader what to personally do or
   avoid: "Always confirm before Claude handles financial, personal, or work-critical tasks." —
   [Claude for Chrome](https://claude.com/claude-for-chrome).
7. **A statistic gets translated into a relatable moment before (or instead of) standing alone.**
   Principle 3's "evidence over adjectives" still applies, but the evidence is handed to the
   reader as something they'd recognize from their own day. "Sleep advice peaks around 5 a.m." —
   [Anthropic Economic Index: Cadences](https://www.anthropic.com/research/economic-index-june-2026-report) —
   rather than a bare percentage.
8. **The register names itself with a relationship, not a spec.** New users are told how to treat
   the product socially, not technically. "Speak to Claude like you would a coworker or friend."
   — [Get started with Claude](https://support.claude.com/en/articles/8114491-get-started-with-claude).
9. **A named objection gets answered by name, not deflected.** Where the engineering register
   shows a failure and the fix (principle 5), the product register surfaces the reader's actual
   hesitation and answers it directly. "Half named data security as their single biggest
   hesitation." ... "We don't train on your data by default." — [Claude for Small Business](https://www.anthropic.com/news/claude-for-small-business).

**Table: which register for which section of our article**

| Signal | Engineering register | Product register | Use in the `uno-bot` piece |
|---|---|---|---|
| Opening | States the claim/fact directly (principle 1) | States the benefit, or opens on a relatable everyday moment | **Product** — the piece opens on the coordination problem a reader recognizes, not a system fact |
| "You" | Instructs the reader what to do next | Reassures the reader they're still in control | **Product** in the intro/story sections; **engineering** in the "what this means for you" close |
| Term definitions | One plain-English clause, then reused bare (principle 2) | Same, but even more casual — no callout box, ever | **Both** — this rule doesn't change between registers |
| Comparing options | A table (principle 7) | Rarely tables — a single named scenario stands in for the comparison | **Engineering** — hosting/model/tool tradeoffs stay in tables |
| Showing a failure | A concrete incident with the fix (principle 5), sometimes its own heading | A named reader objection, answered directly | **Engineering** for "what broke," but consider one product-style objection-and-answer near the close (e.g., "won't this just start posting on its own?") |
| Numbers | Precise, hedged, standalone ("~93%") | Precise, but translated into a moment ("sleep advice peaks at 5 a.m.") | **Engineering** for the request counts and reliability numbers; **product** framing if a number needs to land emotionally, not just factually |
| Safety/limits | Itemized subheadings, numbered | Direct second-person instruction, woven into prose | **Product** — the confirmation-gate explanation should read as reassurance, not a numbered risk list |
| Closing | Next concrete step, no victory lap (principle 11) | Same instinct, phrased as an invitation rather than a roadmap | **Both** — keep principle 11, lean product-register phrasing for the very last line |

The rule of thumb: **product register for the opening and the story sections** (the coordination
problem, the incidents, the close) — this is where a reader who isn't a designer or engineer
needs to stay with us. **Engineering register for the decision points** (hosting, model choice,
tool tradeoffs, the capability matrix) — these are exactly the discrete-option comparisons
principle 7 already reserves for tables, and a reader who's tracking that closely will want the
precision, not a vignette.

## Never do

- Exclamation marks.
- Rhetorical questions used as a structural device (the "But what if I told you..." move).
- Superlatives or hype adjectives without a number or named example next to them —
  "revolutionary," "game-changing," "seamless," "incredible," "cutting-edge."
- Hedge-filler that softens a claim instead of stating what's actually uncertain — "basically,"
  "sort of," "kind of," "in order to." (Already banned in `writing-style.md`.)
- More than one parenthetical aside per sentence.
- Passive voice that hides who did the thing.
- Decorative bold or emoji — reserve both for scan-ability, never for tone.
- A technical or house term used before it's been defined once, in plain English.
- First-person singular ("I") in team-voice docs — use "we."
- A bullet carrying more than one idea. Split it into two bullets or a sentence.
- A table used to narrate a story instead of compare discrete options.
- Ending on self-congratulation instead of a concrete next step.

## Checklist — run every draft against this

1. Does the first sentence state the point, not tease it?
2. Is every house term (proactive/reactive, the confirmation gate, MCP, etc.) defined in plain
   English at first use?
3. Does every strong claim have a number, a named incident, or a "we found" attached to it?
4. Any sentence carrying more than one idea, or more than one parenthetical? Split it.
5. Any bullet doing the work of a paragraph? Split it, or promote it to prose.
6. Any exclamation marks, rhetorical questions, or hype adjectives? Cut them.
7. Would a table read better as a table (option comparison) — or is it currently forcing a
   story into cells?
8. Is bold marking only the 2–5 words a skimmer needs, or has it spread to every important
   phrase?
9. Read the piece aloud — does any paragraph run past six sentences, or does every sentence in
   a paragraph land at the same length?
10. Does the piece end on a concrete next step, not a victory lap?
11. Search for "I " — team-voice docs should have none.
