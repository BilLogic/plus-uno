---
embodiment: ide
summary: Skill anatomy — what goes in an uno skill's method and its SKILL.md, what goes in a bot skill, and the guards that hold each
---

# skills/ — WHAT humans invoke

There are two kinds of skill, one per runtime. An **uno skill** (here, under
`skills/`) is an IDE workflow. A **bot skill** (under `agents/uno-bot/skills/`)
is what uno-bot does in Slack, named for the action. Who invokes which is
settled in `AGENTS.md` § Skills. This file settles the next question, the one a
new skill actually has to answer: **which content goes in which file.**

## Uno skills — two files

```
skills/<name>/
├─ references/method.md   the procedure — one copy, loaded by SKILL.md on invocation
├─ SKILL.md               a delta over the method: agents, references, tool scopes, frontmatter
├─ references/*.md        loaded on demand, by name, from SKILL.md or the method
├─ examples/              filled-in artifacts SKILL.md points at
└─ scripts/               executable helpers SKILL.md invokes
```

**A procedure step lives in `references/method.md`.** WHAT must happen, in what
order, which gates hold, what each exit looks like — stated once, in
runtime-neutral words. Runtime-neutral is the test that keeps it honest: no IDE
tool names, no Slack mechanics, no sub-agent dispatch. Where the method names a
role (`writers/notion`, `reviewers/auditor`), it names *that a writer executes
the step*; how that writer is summoned is `SKILL.md`'s business.

**`SKILL.md` carries what the IDE adds:** which agents to summon and when ·
which `references/*.md` to load at which moment · tool scopes · the frontmatter
that publishes the skill to the IDE surfaces.

**A line of the method appears in exactly one file — the method.** `SKILL.md`
always has the method in context, so it cites a section (`method §4`) and moves
on. The citation costs a clause; the copy costs a divergence.

The two questions a new line answers:

1. Would this still be true if the skill ran in a runtime that does not exist
   yet? → `references/method.md`.
2. Does it name a tool, an agent or a dispatch only the IDE has? → `SKILL.md`.

## Bot skills — one file

```
agents/uno-bot/skills/<name>/SKILL.md
```

A bot skill is named for what the bot does (`draft-a-prd`, `file-a-ticket`) and
is complete on its own: the Worker cannot read an uno skill. Its frontmatter
declares `embodiment: uno-bot` and `disclosure: reference`, so the bundler ships
its `description` as an always-loaded pointer line and serves its body through
`read_reference` under the folder's name. The seven authoring rules:

1. **The description leads with trigger words** — the asks that should fire it,
   one per branch — then says when to read it. One line.
2. **One `## Exit` section** whose items each open with an exit: **answer** (the
   reply is the deliverable), **file** (a ✅ card writes or sends), or **hand
   off** (a ready-to-paste IDE prompt naming the uno skill, or the lead for a
   call only they make).
3. **Tools named exactly**, in backticks, as `agents/uno-bot/tool-definitions.json`
   names them.
4. **Cite a tool's rules; never restate them.** A tool's description is the one
   home of its rules, gate included.
5. **Positive phrasing:** state the target behavior.
6. **No budget numbers;** the bundler holds the body to `BUDGETS.botSkill` and
   the check holds the description to `BUDGETS.botSkillDescription`.
7. **Steps end on a completion criterion**, and the body stays short enough that
   every step is read.

Shapes a bot skill hands the model carry no emoji and no scripted tone; the
voice is the persona's (`agents/uno-bot/tests/voice-skills.test.ts`).

## What the guards measure

`npm run check:bot-skills` holds rules 1–3 for every bot skill the bundler
names, and fails on any live file that still names the retired per-skill Slack
docs.

`npm run check:skill-overlap` fails on a substantive line living in two files,
in two scopes. **Within an uno skill** it compares the method with `SKILL.md`.
**Across the Worker's corpus** it compares every doc the Worker reads against
every other: the constitution, the persona, the connector docs, and everything
behind `read_reference`, the bot skills among them. Membership comes from the
bundler itself, so a stale bundle stops the check rather than being measured
around. A rule stated in two of those is paid for twice and drifts in two
places; keep it in the doc that owns it and cite it from the other.

Structure is discounted first: headings, `---`, code fences, table rules, HTML
comments, and lines under five words. What survives is prose somebody wrote
twice, and the ceiling on it is zero. Citing another doc is not writing it
twice — a pointer shares no line with the rule it points at. The measurement,
the threshold and the reasoning behind both are in
`scripts/check-skill-overlap.mjs`.

## Discovery surfaces are generated

`skills/<name>/SKILL.md` frontmatter is canonical; `npm run
generate:skill-surfaces` publishes the Claude Code / Cursor stubs from it, and
`npm run check:skill-surfaces` fails on drift.
Details: `docs/engineering/setup.md` § Generated skill surfaces.
