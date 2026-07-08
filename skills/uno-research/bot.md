<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-research — bot face

Loads: references/method.md (the shared procedure) · docs/conventions/terminology.md

Find collaborators / subject-matter experts so a designer can source context *from people*.
Triggers: "who should I talk to about X", "find me SMEs/collaborators for X", "who knows about {topic}", "who's working on {feature}".

## Execute

- Call `find_experts(topic)` — READ-ONLY, no confirmation gate, safe to call freely. Returns the team roster from the Notion Team Member Database: `{ name, group, role, bio, affiliation, linkedin, website }`.
- Match the topic against each person's `role` + `bio` — the bios say what people actually work on (e.g. "AI Student Insights", "0-1 AI tools"). Match on evidence, not assumption.
- Present the best **2–4 fits**, strongest first: name · role · one-line reason drawn from their bio · LinkedIn link.
- **@-mention rule:** if a returned person has a `slackUserId`, tag them as `<@slackUserId>`; if they don't (the DB historically has no Slack handles or emails), name them and share their LinkedIn — never invent a handle, never DM anyone you can't resolve.
- **Only real people from the returned roster.** Never invent a name, role, or expertise. If no one clearly matches, say so and suggest the closest group (e.g. "no one's bio mentions X; the Product Designers are your best bet — here are a couple").

## Output

Slack mrkdwn, tight — 2–4 suggestions, scannable, no walls of text:

```
For *{topic}*, talk to:
• *{Name}* — {role}. {one-line why, from their bio}. <{linkedin}|LinkedIn>
• *{Name}* — {role}. {one-line why}. <{linkedin}|LinkedIn>

Want me to summarize what you learn after you chat? (I can synthesize the thread.)
```

Include the one-line reason so the designer sees *why* each person was suggested.

## Hand-offs

- After the designer talks to people → offer **uno-synthesize** (summarize the thread / findings, then optionally a PRD).
- Codebase / asset / prior-art discovery → the in-IDE `/uno:research` skill, not this capability.
- Plus-fact or project-status questions → default conversational mode (blueprint-first Q&A), not `find_experts`.
- If a Slack-handle/email column is ever added to the Team Member DB, intro-posting becomes a gated tool — until then, suggest + LinkedIn only.
