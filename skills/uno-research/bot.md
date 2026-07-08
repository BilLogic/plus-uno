---
name: uno-research
description: >
  Find collaborators / subject-matter experts for a research topic and suggest
  who the designer should talk to. The bot's "find people" capability — calls
  the read-only find_experts tool (Notion Team Member Database) and presents the
  best matches with role + bio + LinkedIn. Distinct from the in-IDE uno-research
  skill (which audits the codebase/Notion); this one is about people.
trigger_types:
  - agentic_tool           # calls find_experts (read-only, no gate)
model_default: claude-sonnet-4-6
status: new
covers: >
  The "#uno-research" phase of the "Starting from Nothing" flow, bot side —
  "Talk to collaborators & SMEs (uno-bot finds & intros them)." Given the Team
  Member DB has no Slack handles, "intro" = suggest who to reach out to + share
  their LinkedIn (not @-mention).
---

# uno-research (bot) — find collaborators & SMEs

When a designer needs to talk to people to source context, find the right
collaborators / subject-matter experts and suggest who to reach out to.

## When to Use

- "who should I talk to about X", "find me SMEs/collaborators for X",
  "who knows about {topic}", "who's working on {feature}".
- Part of the `#uno-research` phase — sourcing context *from people*.

**Not for:**
- Codebase/asset/prior-art discovery → that's the in-IDE `/uno:research`.
- Plus-fact / project-status questions → `uno-qa`.

## Workflow

1. **Call `find_experts(topic)`** (read-only — no confirmation gate). It returns
   the team roster: `{ name, group, role, bio, affiliation, linkedin, website }`.
2. **Match** the topic against each person's `role` + `bio` (the bios say what
   people actually work on — e.g. "AI Student Insights", "0-1 AI tools").
3. **Present the best 2–4 fits**, each as: name · role · a one-line reason from
   their bio · LinkedIn. Lead with the strongest match.
4. **Suggest reaching out.** The DB has **no Slack handles or emails**, so you
   **cannot @-mention or DM** anyone — name who to contact and share their
   LinkedIn; never tag a Slack user you can't resolve.

## Output (Slack mrkdwn — tight)

```
For *{topic}*, talk to:
• *{Name}* — {role}. {one-line why, from their bio}. <{linkedin}|LinkedIn>
• *{Name}* — {role}. {one-line why}. <{linkedin}|LinkedIn>

Want me to summarize what you learn after you chat? (I can `uno-synthesize` the thread.)
```

## Grounding Rules

- **Only real people from `find_experts`.** Never invent a name, role, or
  expertise. If no one clearly matches the topic, say so and suggest the closest
  group (e.g. "no one's bio mentions X; the Product Designers are your best bet —
  here are a couple").
- **Match on evidence** (the bio/role), not assumption. Give the one-line reason
  so the designer sees *why* you suggested each person.
- **No @-mentions / DMs** — there's no Slack contact data; suggest + share
  LinkedIn only.

## Forbidden in This Skill

- No inventing people or expertise not in the returned roster.
- No @-mentioning or messaging people (no contact data to resolve them).
- No walls of text — 2–4 suggestions, scannable.

<!-- ==== Sections below are metadata for human readers — stripped by the skill-loader ==== -->

## Related Skills

- **`uno-synthesize`** — after the designer talks to people, summarize the thread
  / findings.
- **In-IDE `/uno:research`** — codebase + Notion asset discovery (different job).

## Future

- If a Slack handle/email column is added to the Team Member DB, add a gated
  `intro_experts` tool that posts an @-mention intro in the thread.
