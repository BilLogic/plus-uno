---
embodiment: ide
summary: The product register and the case-study register — how the voice shifts by audience.
---

# Writing — registers

<!-- canonical per ADR-017 (docs/adr/) · distilled 2026-07 from Anthropic's public writing, split into this folder 2026-08-24 (#163). -->

One voice, two audiences. The engineering-blog corpus reaches readers who already
think in systems; product and case-study writing does not get that assumption.

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

## The case-study register — findings and research pages

(From Bill's 2026-07-12 review of the corpus-findings page. This register applies to research
findings, data-analysis pages, and case-study material — anywhere a reader should watch
conclusions *emerge* from evidence rather than be handed them.)

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
