---
embodiment: ide
summary: uno-bot's instructions are its own bot skills, kept with the Worker and named for what the bot does, each ending in answer, file or hand off; the six uno skills become IDE-only, and the bot never builds code or draws in Figma (2026-10-14)
status: active
verified: 2026-10-14 (#1204)
---

# ADR-033: Bot skills live with the Worker (2026-10-14)

**Decision.** uno-bot's skills are its own. Seven **bot skills** live under `agents/uno-bot/skills/<name>/SKILL.md`, named for what the bot does: `find-the-right-person`, `relay-a-message`, `draft-a-prd`, `critique-a-design`, `share-out`, `file-a-ticket` and `prepare-the-call`. Each one's description ships in the prompt as its pointer line, and its body is read by name through `read_reference`. Each ends in one of three **exits**: **answer** (the reply is the deliverable), **file** (a ✅ card writes or sends), or **hand off** (a ready-to-paste IDE prompt naming the uno skill, or the lead for a call only they make). The six **uno skills** under `skills/` are IDE workflows: their per-skill Slack files are deleted, their methods declare `embodiment: ide`, and the bundler no longer scans `skills/`. The bot never builds code and never draws in Figma; a build ask is a ticket and an IDE prompt, with a PRD first.

**Why.** The Slack files rendered IDE methods as Slack steps, so they told the bot to do what it cannot (open a PR, post a review to #plus-design, tally ✅ reactions from a tool that returns none) and contradicted the persona. Real traffic is asks, not skill invocations: of 95 real turns from 2026-09-29, `read_reference` ran in 5 and the `/uno-*` Slack commands in none. Naming a skill for the ask it answers puts the trigger words where the model reads them, and the three exits bound what a skill may promise to what the bot's tools do (#1196; Bill, 2026-10-14).

**Consequences.** `check:bot-skills` holds every bot skill to real tool names, one Exit section in the three verbs and a one-line description, and fails any live file that still names the retired Slack files. `check:skill-overlap` compares an uno skill's method with its `SKILL.md` alone; its Worker scope now holds the bot skills. The prompt shrank from about 151k chars to about 117k. The uno skills' IDE-side docs left the bundler's section roots, so `check:negation`'s IDE scope no longer measures them, and the bundler's every-doc-declares-an-embodiment rule no longer reaches `skills/`. Supersedes ADR-013's dual-face decision (its point 2). Rollback: revert the change and redeploy; the bundle regenerates from the files. — uno (agent), Oct 2026, applying #1204
