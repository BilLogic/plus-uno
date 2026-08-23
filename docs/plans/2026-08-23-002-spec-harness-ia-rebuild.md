## Problem Statement

The harness is ambitious and mostly well-built. What fails is enforcement, not design — and it fails the same way every time: a mechanism ships, its content or its guard does not, and nothing turns red.

The evidence, verified against the working tree:

- **A pipeline with no content.** All 56 per-component agent-view docs are placeholders reading "TODO: add `agent.whenToUse`" and "see the source". The generator waits on frontmatter present in **0 of 387** MDX files. Agents load 2,296 lines that tell them to go read the JSX — which a forbidden rule already told them to do.
- **One roster, three statements, all different.** The convention roster is written out in `AGENTS.md`, in `loading-order.md`, and in the bundler. Counts read "7 of 11", "8 of 12", and reality — with one 39k-char convention in no roster at all. Prior todos patched the numbers and left the structure that guarantees a recurrence.
- **Rules enforced as law that nobody ratified.** The two-vocabularies rule is cited as law in the constitution and shapes every reply; the owner did not recognise it. An agent wrote it. There are likely more.
- **Design-system knowledge in four homes.** 626 lines of hand-written foundations restate eight topics already published as MDX, with no generator connecting them. Layout appears twice, tokens twice, component inventory twice — and the constitution routes component questions to the hand-written inventory while a forbidden rule makes the generated one the existence law.
- **Dead workflows contradicting a live decision.** Two dispatch workflows still implement the retired JS-marketplace path; the decision that superseded them is explicit, and the v2 flowchart doc still diagrams the dead path as current.
- **A constitution doing five jobs.** Identity and routing share always-loaded space with a grid contract, a documentation-IA contract, a Storybook MCP guide, and a commands table that restates `package.json`.
- **Sediment.** 49 knowledge files where a lesson should have become a rule or been deleted, and an ADR log crammed into one file that breaks its own rules — an 80-line skill bar violated four times, a 150-line split rule broken by two files including itself.

Several open `harness-intake` issues in this repo are symptoms of the same root cause: docs routing agents to things that no longer exist.

## Solution

One question now governs every file, and the folder path answers it: **is this a fact, a protocol, or a narrative?**

- **Facts** — what exists, what it is named, what it is typed. Generated from source, never authored, living beside the source they describe.
- **Protocol** — rules, procedures, correct/incorrect examples. Authored agent-first, in `docs/`, `skills/`, `agents/`, `design-system/guidelines/`.
- **Narrative** — orientation, why, visual demos. Authored human-first as MDX beside the component, never read by an agent.

Storybook becomes a **window** onto the protocol, never a source: harness pages import the file raw at build time, so auditing what the agent knows means opening Storybook and reading exactly what the agent reads.

Rosters stop being written by hand. Bundle membership comes from frontmatter that travels with the content; the doc index is generated from the same frontmatter; every generated artifact is named `index.md` so editability is answerable from the filename.

## User Stories

1. As an agent building UI, I want the component list to be generated from source, so that "not listed means it does not exist" is true rather than aspirational.
2. As an agent, I want no placeholder documentation in my context, so that every line I load tells me something.
3. As a maintainer, I want the 56 stubs and their generator path deleted, so that nobody tries to fill them again.
4. As the Worker bundler, I want each doc to declare its embodiment in frontmatter, so that membership cannot silently disagree with a hand-maintained list.
5. As a maintainer, I want the convention roster stated exactly once, so that counts cannot drift apart across three files.
6. As Bill, I want every constitution rule with no ADR and no sign-off listed in one pass, so that I can keep, edit, or kill each one deliberately.
7. As an agent, I want the two-vocabularies rule to be either ratified or removed, so that I am not enforcing an unreviewed rule on every reply.
8. As a designer, I want design-system protocol in one place under `design-system/guidelines/`, so that I never wonder which of four folders to edit.
9. As an agent, I want foundations split per topic following the Atlassian set, so that a new foundation doc has exactly one correct slot.
10. As an agent writing UI copy, I want content rules (voice and tone, inclusive language, grammar, date and time, message design) as a design-system foundation, so that product copy rules sit with the system they apply to.
11. As a human auditing the harness, I want Storybook to render the actual harness files verbatim, so that I can see what the agent was given rather than a paraphrase.
12. As a human onboarding, I want narrative pages that link into the harness rather than restate it, so that there is no second copy to drift.
13. As an agent, I want correct/incorrect code examples in protocol docs, so that a rule comes with the thing that actually changes my behaviour.
14. As an agent, I want tool operation documented per connector — access, navigation, formatting, write gate — so that Slack markdown, Notion blocks, and Figma navigation each have one home.
15. As an agent, I want the same filenames inside every connector folder, so that reading one connector teaches me the shape of all of them.
16. As a developer, I want `docs/engineering/` to answer where things live, what earns a test, and how to deploy, so that I stop reconstructing it from workflows and READMEs.
17. As a developer, I want anything surprising or hard to reverse recorded as an ADR, so that a future reader learns why instead of inferring it.
18. As a maintainer, I want each existing ADR verified against the code rather than ported, so that the log stops asserting things that are no longer true.
19. As any agent, I want `CONTEXT.md` at the root defining the estate's vocabulary, so that terminology has the canonical filename every tool expects.
20. As a newcomer, I want a root `SETUP.md`, so that I can orient and get running without reading the constitution.
21. As anyone, I want a root `INDEX.md` routing by task with role reading paths, so that humans and agents consult one map.
22. As an agent, I want the constitution to carry identity, routing, and hard rules only, so that always-loaded context is not spent on contracts that fire on narrow branches.
23. As an agent, I want prohibitions paired with positive targets, so that a rule tells me what to do rather than only what to avoid.
24. As a maintainer, I want model-default prohibitions deleted, so that the constitution spends context only on rules that change behaviour.
25. As a maintainer, I want the marketplace workflows and the bot's dispatch path removed, so that no code path contradicts a decision already made.
26. As a maintainer, I want the stale v2 flowcharts audited rather than patched, so that one corrected diagram does not imply the rest are current.
27. As a maintainer, I want the commands table and the tech-stack version table deleted, so that `package.json` is the only place a version is stated.
28. As a maintainer, I want every knowledge file promoted to a rule, converted to an ADR, or deleted, so that the folder stops accumulating notes nobody acts on.
29. As a maintainer, I want the queue in GitHub Issues, so that open work is assignable and closable rather than a filename prefix.
30. As a maintainer, I want a single composite check in CI that fails on drift, broken links, stale generated files, and unclassified docs, so that the harness enforces itself.

## Implementation Decisions

**Placement laws.** Authored prose an agent reads lives in `docs/`, `skills/`, `agents/`, or `design-system/guidelines/`. Generated facts live in the folder they describe, named `index.md` (or `*.index.json`). Narrative is `.mdx` beside its component. `overview.md` is authored; `index.md` is generated.

**Constitution.** `loading-order.md` folds in. The grid contract and documentation-IA contract move to `guidelines/`. The commands table is deleted. Prohibitions that guard real incidents keep their ban and gain a positive twin; model-default ones are deleted. The rewrite lands as its own commit so the eval delta is attributable.

**Bundling.** The bundler stops reading a hand-maintained path list and derives membership from each doc's frontmatter (`embodiment: all | ide | worker`). Long-form writing style leaves the bundled set for the skill that drafts long-form.

**Design system.** Four homes collapse into `design-system/guidelines/` with `foundations/` (Atlassian's fourteen categories, including `content/`), `components/`, `composition/` (layout · hierarchy · surfaces · forms), and `figma/`. Foundations with no content today are scaffolded with a one-line overview so gaps are visible in the index rather than invisible. Per-component guidelines are bulk-authored for the most-reached components and earned thereafter — the generated API half comes from source either way.

**Documentation tree.** `docs/context/` dissolves into `docs/product-and-service/` and `guidelines/`. `docs/connectors/` holds one doc per tool an agent can act on, with folders for tools needing a second topic and repeated filenames across them. `docs/engineering/` holds codebase-guide, coding, testing, operations; architecture folds into codebase-guide. `docs/adr/` replaces the single decisions file. `terminology.md` becomes root `CONTEXT.md`.

**Storybook window.** Harness pages are generated stories importing files raw, covering the constitution, docs, skills, agents, guidelines, and the generated indexes. No harness content is authored inside Storybook.

**Sequencing.** Delete dead material first, then facts and naming, then guidelines, then the docs tree, then the constitution, then knowledge. Each stage green before the next.

## Testing Decisions

A good test here asserts what a check script reports, not how it walks a tree — and prose is never asserted on directly.

- **Composite harness check.** One command in CI composing the existing checks. It must fail on: skill-surface drift, a broken doc link, a generated file that no longer matches source, a doc with no frontmatter summary, and a doc whose embodiment is unset. Prior art: the existing `--check` flags and the monthly integrity sweep, which already produce `harness-intake` issues.
- **Bundle membership.** Cover that a doc marked IDE-only is absent from the Worker bundle, that a doc marked `all` is present, and that an unclassified doc fails the build. This replaces the current "listed or excluded" assertion with one that cannot be satisfied by editing a list.
- **Generated indexes.** Regenerating must be a no-op on a clean tree; adding a component must change the component index; adding a doc must change the root index.
- **Behavioural regression.** The existing eval suites run on the constitution-rewrite PR, with that rewrite isolated in its own commit so any delta is attributable.
- **No snapshot tests of doc content.** They fail for the wrong reason and get deleted rather than fixed.

## Out of Scope

- The skills and uno-bot content sweep — two faces per skill, the 80-line bar, routing-table duplication, persona extraction. Its own phase, its own eval run, per repo.
- Auditing the 387 MDX narrative files for duplication against the new guidelines.
- The Storybook published sidebar taxonomy itself; only its contract document moves.
- Marketplace automation — a real product question (repo data file versus Notion database when they disagree) that becomes its own issue.
- `uno-blueprint` and `agentic-service-blueprinting`, tracked in their own repos.

## Further Notes

The through-line worth keeping in view: the harness's failures are all the same failure. A generator waiting on frontmatter nobody wrote. A roster written three times. A rule enforced without review. A check that cannot fail. Every stage of this work either deletes something unenforced or makes an existing guard honest — which is why the composite check matters more than any individual move.

Full audit, findings, and the decided IA for all three repos: the harness-audit artifact dated 2026-08-23, with the executable half in `docs/plans/2026-08-23-001-refactor-agent-harness-ia-plan.md`.
