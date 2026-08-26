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
├─ references/method.md   the procedure — one copy, loaded into both prompts
├─ SKILL.md               the IDE delta
├─ bot.md                 the Worker delta
├─ references/*.md        loaded on demand, by name, from a face or the method
├─ examples/              filled-in artifacts a face points at
└─ scripts/               executable helpers a face invokes
```

## Where content goes

**A procedure step lives in `references/method.md`.** WHAT must happen, in what
order, which gates hold, what each exit looks like — stated once, in
runtime-neutral words. Runtime-neutral is the test that keeps it honest: no IDE
tool names, no Slack mechanics, no sub-agent dispatch. Where the method names a
role (`writers/notion`, `reviewers/auditor`), it names *that a writer executes
the step*; how that writer is summoned is a face's business.

**A face carries only its delta** — what is true of that runtime and untrue of
the other:

| Face | Its delta |
|---|---|
| `SKILL.md` | which agents to summon and when · which `references/*.md` to load at which moment · tool scopes · the frontmatter that publishes the skill to the IDE surfaces |
| `bot.md` | the tool names the Worker actually has · routing from an utterance to one of them · confirmation-gate behaviour · the fidelity wall (what Slack declines and hands to the IDE) · Slack output shape |

**A line of the method appears in exactly one file — the method.** A face that
depends on a method rule *cites* it and moves on: uno-publish's bot face opens
"the rails + gates are `references/method.md`, already in this prompt," and then
says only what Slack adds. The citation costs a clause; the copy costs a
divergence.

The same holds between the two faces. A rule true in both runtimes is, by
definition, not a delta — it is method, and it belongs one directory down. When
two faces reach for the same sentence, that sentence is telling you where it
lives.

## The three questions a new line answers

1. Would this still be true if the skill ran in a runtime that does not exist
   yet? → `references/method.md`.
2. Does it name a tool, a surface, or a dispatch that only one runtime has? →
   that runtime's face.
3. Is it already stated somewhere the reader is holding? → cite it. Both faces
   already have the whole method in context, and `bot.md` is on a 7,000-char
   budget the bundler asserts — restatement is the first thing that blows it.

## What the guard measures

`npm run check:skill-overlap` compares all three pairings per skill — method
against each face, and the two faces against each other — and fails on a
substantive line living in two of them. Structure is discounted first:
headings, `---`, code fences, table rules, and lines under five words, which is
every line the six skills coincide on today. What survives that filter is prose
somebody wrote twice, and the ceiling on it is zero. The measurement, the
threshold and the reasoning behind both are in
`scripts/check-skill-overlap.mjs`.

## Discovery surfaces are generated

`skills/<name>/SKILL.md` frontmatter is canonical; `npm run
generate:skill-surfaces` publishes the Claude Code / Cursor stubs and the Slack
slash commands from it, and `npm run check:skill-surfaces` fails on drift.
Details: `docs/engineering/setup.md` § Generated skill surfaces.
