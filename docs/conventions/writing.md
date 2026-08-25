---
embodiment: ide
summary: How agents and humans write long-form prose and findings pages here.
---

# Writing

<!-- canonical per ADR-017 (docs/adr/) · Load when drafting something long — a README, a recap, a findings page. Ordinary replies and commits need nothing from this file. -->

The house voice is not written down, deliberately: the model's default is the
house voice, and a rule that restates a default spends context to say nothing.
What is written down is the part a default does not give you — how a long
argument is built, and how a findings page earns its conclusions.

Two things this file does **not** cover. uno-bot's voice is `agents/uno-bot/AGENT.md`
§ Identity & voice, which is a deliberate persona rather than a default. Product
copy a tutor reads inside the app is
`design-system/guidelines/foundations/content/`.

> **Length exception, deliberate: this file is ~185 lines, over ADR-011's 150-line
> split rule.** The eleven principles are one enumerated list — splitting them means
> loading 1–6 without knowing what 7–11 say, and the cap exists to stop an agent
> loading *irrelevant* context, not relevant context. ADR-011's own 2026-07-30
> amendment retired the sibling `SKILL.md` cap on the same reasoning.

## Long-form principles

Eleven principles, each with the Anthropic sentence it was drawn from. Read them
when the thing you are writing has an argument to carry; skip them for a status
reply.

### 1. Open with the claim, not a hook

Anthropic's opening sentence almost always states the actual point. No scene-setting, no
rhetorical question, no "In today's fast-moving world of AI."

> "We've worked with dozens of teams building LLM agents across industries." — [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
> "Our newest model, Claude Opus 4.5, is available today." — [Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5)

### 2. Define a term before you use it

Technical vocabulary gets one plain-English definition on first use, then the term is reused
without re-explaining. Anthropic never assumes the reader already knows the house term.

> "Workflows are systems where LLMs and tools are orchestrated through predefined code paths" — [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)

### 3. Evidence over adjectives

Claims are backed by a number, a named example, or "we found" — not by a stronger adjective.
"Best," "critical," and "significant" appear only when a benchmark or measurement sits next to
them.

> "10.6% jump over Sonnet 4.5" — [Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5)
> "Token usage by itself explains 80% of the variance" — [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

### 4. One idea per sentence

Anthropic's sentences are dense in *information* but not in *clauses*. Long sentences exist,
but each one tracks a single idea through to its end rather than nesting three parentheticals.

> "You can't hardcode a fixed path for every possible scenario in an open-ended problem." — paraphrased structure, [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

### 5. Show the failure, not just the lesson

Principles land through a concrete incident, not an abstract rule. Anthropic states what broke,
then states what changed because of it.

> "One subagent explored the 2021 automotive chip crisis while 2 others duplicated work" — [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

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

narrative — the incident gets lost in a cell):
> "Lite/budget tiers as default | Cheapest of all | Veto lesson: ours fabricated grounding —
> invented org names in links, claimed verification it never did | Reverted in 15 min..."

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

### 9. We build it, you use it — no "I"

First person plural for the team's decisions and findings ("we chose," "we found"); second
person when instructing the reader directly ("you can," "if you're building one"); third person
for the bot/product itself. First-person singular is essentially absent from Anthropic's public
writing, even in pieces with a named author.

> "We share the engineering challenges and the lessons we learned from building this system." — [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

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

instantly!"

People got an answer from Slack instead of waiting for a reply."

### 11. End on the next concrete step, not a victory lap

Anthropic's pieces close by pointing somewhere — a system card, a call for collaborators, an
open research question — never by restating how impressive the result was.

> "If you are interested in working with us..." — [Tracing the Thoughts of a Large Language Model](https://www.anthropic.com/research/tracing-thoughts-language-model)
> "developers can now build against a standard protocol" — [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

team!"

team to build first. Everything else in this recap follows from those two decisions."

---


## Findings pages

For research findings, data-analysis pages, and case-study material — anywhere a
reader should watch conclusions *emerge* from evidence rather than be handed
them.

The core failure mode: writing that is too compressed and thesis-heavy — every sentence
reporting a finding, interpreting it, and justifying the product at once. That reads as an
internal strategy memo, not a case study.

- **Start with the human problem, not the dataset.** "As the design team grew, more of the
  lead's time went to answering questions that had already been answered somewhere else" —
  then explain how you studied it. Never open with the row count.
- **Let the logic unfold.** Don't front-load a takeaway box that gives away every chart —
  that reduces the evidence to props for a predetermined argument. Arc: framing → method →
  findings in progression → what the findings shaped. Conclusions go at the end.
- **Claims no bigger than the evidence.** "Coordination increasingly depended on the design
  lead," not "the lead became a single point of failure" (implies fragility the data doesn't
  show). "Much of the coordination happened in private," not "invisible."
- **Ordinary language first, model terms second.** Define the classification before leaning
  on it: "We classified a request as bot-addressable when its answer could be retrieved from
  an existing source without making a new design decision." House shorthand (repeat tax,
  full match, continuity asks) needs translation or deletion.
- **Observational, not promotional.** "This suggested the first version should focus on
  questions interns repeatedly directed at the lead" — never "this is exactly what the bot
  exists to absorb." The product direction must read as the *result* of the research.
- **No absolutes.** "Many repeated requests appeared to be retrieval problems rather than new
  decisions" beats "repeats are pure lookup jobs." A repeat can also mean poor docs, changed
  context, or low trust — say what the data shows and what it doesn't prove.
- **Per-section formula:** what we observed → why it matters → how it shaped the design.
