---
embodiment: ide
summary: The eleven principles of long-form writing, with a before/after for each.
---

# Writing — principles

<!-- canonical per ADR-017 (docs/adr/) · distilled 2026-07 from Anthropic's public writing, split into this folder 2026-08-24 (#163). -->

> **Deliberate length exception: this file is ~198 lines, over ADR-011's 150-line
> split rule, and stays that way.** The eleven principles are one enumerated list.
> Splitting it means loading principles 1–6 without knowing what 7–11 say, which
> is strictly worse than one file over the cap — the cap exists to stop an agent
> loading irrelevant context, and here every item is relevant to the same task.
> ADR-011's own 2026-07-30 amendment retired the sibling `SKILL.md` cap on the
> same reasoning. Do not 'fix' this by splitting it.

## The 11 principles

Each principle: a verbatim Anthropic quote (under 15 words, linked), then a before/after
rewrite using our own `uno-bot` material. The "before" examples were drawn from a
build-recap draft that is no longer in the repo; they are kept because the rewrite
is the teaching, not the source.

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
