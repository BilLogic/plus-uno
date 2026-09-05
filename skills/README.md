---
embodiment: ide
summary: Skill anatomy — which content belongs in method.md, which in a face, and the guard that holds the split
---

# skills/ — WHAT humans invoke

That a skill is three files, and who loads which, is settled in `AGENTS.md`
§ Skills. This file settles the next question, the one a new skill actually has
to answer: **which content goes in which file.**

The split is not filing. One rule, in two files, is two rules the moment
somebody edits one of them — and the drift is invisible, because each file reads
correctly on its own. `npm run check:skill-overlap` is the guard; the rule it
enforces is below.

## Anatomy

```
skills/<name>/
├─ references/method.md   the procedure — one copy; the IDE loads it on invocation, the Worker
│                         reads it by name (`disclosure: reference` → `read_reference`)
├─ SKILL.md               the IDE face — a delta over the method it always loads
├─ bot.md                 the Worker face — complete on its own, ending in a pointer to the method
├─ references/*.md        loaded on demand, by name, from a face or the method
├─ examples/              filled-in artifacts a face points at
└─ scripts/               executable helpers a face invokes
```

`disclosure: reference` is the frontmatter line that moves a method out of the
Worker's always-loaded prompt into the reference map beside it. Five of the six
carry it today; `uno-prototype`'s method stays loaded, because the always-loaded
core keeps a floor (`agents/uno-bot/scripts/bundle-harness.mjs` § BUDGETS) and
it is the method most skill turns reach. #418's measurement decides whether it
follows the others.

## Where content goes

**A procedure step lives in `references/method.md`.** WHAT must happen, in what
order, which gates hold, what each exit looks like — stated once, in
runtime-neutral words. Runtime-neutral is the test that keeps it honest: no IDE
tool names, no Slack mechanics, no sub-agent dispatch. Where the method names a
role (`writers/notion`, `reviewers/auditor`), it names *that a writer executes
the step*; how that writer is summoned is a face's business.

**A face carries what its runtime adds** — the two faces are shaped differently
because their runtimes hold the method differently:

| Face | What it carries |
|---|---|
| `SKILL.md` | a delta over the method it always loads: which agents to summon and when · which `references/*.md` to load at which moment · tool scopes · the frontmatter that publishes the skill to the IDE surfaces |
| `bot.md` | the Worker's complete turn for that skill, readable with nothing else in hand: the steps it performs in Slack, each with a completion criterion · the tool names it actually has · confirmation-gate behaviour · the fidelity wall (what Slack declines and hands to the IDE) · Slack output shape · hand-offs — ending in a pointer whose leading word is the method's name (`**uno-review/method** — …`) and that says when to `read_reference` it |

**A line of the method appears in exactly one file — the method.** A face that
depends on a method rule *cites* it and moves on: uno-publish's bot face says
"stage `shareout_post` immediately (method: the bundle contract)" and then says
what Slack does, leaving the contract's terms to the method. The citation costs
a clause; the copy costs a divergence. A complete Worker face is still a face: it renders the
method's sections as Slack steps, and the section reference is the citation.

The same holds between the two faces. A rule true in both runtimes is, by
definition, not a delta — it is method, and it belongs one directory down. When
two faces reach for the same sentence, that sentence is telling you where it
lives.

## The three questions a new line answers

1. Would this still be true if the skill ran in a runtime that does not exist
   yet? → `references/method.md`.
2. Does it name a tool, a surface, or a dispatch that only one runtime has? →
   that runtime's face.
3. Is it already stated somewhere the reader can reach? → cite it. The IDE face
   has the whole method in context; the Worker face does not hold it and reads
   it by name through `read_reference` when its pointer fires, so a face cites
   a method section (`method §4`) rather than restating it. `bot.md` is on a
   7,000-char budget the bundler asserts — restatement is the first thing that
   blows it.

## What the guard measures

`npm run check:skill-overlap` measures two scopes and fails on a substantive
line living in two files in either.

**Within a skill** it compares all three pairings — method against each face,
and the two faces against each other.

**Across the Worker's corpus** it compares every doc the Worker reads against
every other: the constitution, the persona, the connector docs, the six faces
and the six methods — sixteen in the prompt and five behind `read_reference`,
twenty-one docs and 210 pairs in all. A rule stated in two of those is paid for
twice: on every turn when both are in the prompt, and again on the turn that
fetches a disclosed one. Membership comes from the bundler itself (the prompt's
markers plus the companion's disclosed table), so a stale bundle stops the check
rather than being measured around, and a method leaving the prompt for the map
stays inside the comparison.

Structure is discounted first: headings, `---`, code fences, table rules, HTML
comments, and lines under five words, which is every line these docs coincide
on today. What survives that filter is prose somebody wrote twice, and the
ceiling on it is zero. Citing another doc is not writing it twice — a pointer
shares no line with the rule it points at. The measurement, the threshold and
the reasoning behind both are in `scripts/check-skill-overlap.mjs`.

## Discovery surfaces are generated

`skills/<name>/SKILL.md` frontmatter is canonical; `npm run
generate:skill-surfaces` publishes the Claude Code / Cursor stubs and the Slack
slash commands from it, and `npm run check:skill-surfaces` fails on drift.
Details: `docs/engineering/setup.md` § Generated skill surfaces.
