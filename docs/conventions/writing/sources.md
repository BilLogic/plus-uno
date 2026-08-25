---
embodiment: ide
summary: The corpus this style was distilled from, and what changed in the 2026 refresh.
---

# Writing — sources

<!-- canonical per ADR-017 (docs/adr/) · distilled 2026-07 from Anthropic's public writing, split into this folder 2026-08-24 (#163). -->

Provenance, not guidance. Nothing here tells you how to write; it records what
the rules were derived from, so a future reader can check the derivation rather
than trust it. Rarely loaded — reach for it when you want to know *why* a rule
says what it says.

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
  the build recap and the Medium piece are both team-voice — principle 9 still applies
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
