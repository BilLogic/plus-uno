---
embodiment: ide
summary: A scheduled job with no requester may read with a person's own Slack token only after that person opted in, only after the live token's granted scopes check out, and only to tell that person — in their DM with uno-bot, never anyone else — keeping a permalink, a due time and a state and nothing of the message (2026-09-30)
status: active
verified: 2026-09-30 (#754)
---

# ADR-032: A cron may read with a person's own token only for them (2026-09-30)

**Decision.** A scheduled job may run on a person's own Slack token (ADR-020's per-user slot, `own: true`) with nobody asking at that moment, when all of these hold:

- **They opted in, per purpose.** Each purpose is its own Home-tab switch, off by default (`DM_WATCH_FEATURES` in `agents/uno-bot/src/dm-watch/store.ts`). No switch on means no job and no read. Turning a switch off stops its future jobs and lapses what it was tracking, silently.
- **The token is theirs.** A workspace fallback token never counts. No token of their own: the job is skipped with one log line.
- **The live grant covers the job.** Before reading, the job asks Slack which scopes the token actually holds (`auth.test`, `x-oauth-scopes`), because a manifest records only what was requested (ADR-024). A missing scope skips the job with one log line. The token is only read with: the job's port admits `auth.test`, `users.conversations` and `conversations.history`, and no write.
- **The output goes only to them.** A result lands in the person's DM with uno-bot, posted with the bot token. It never goes to a thread, a proposal card, the detector's few-shot examples or another person's job. The other people in the conversations read are never messaged.
- **Nothing of the message is kept.** A stored row holds the permalink, `due_at`, the state and the counts that schedule it (`dm_commitments`, `0011_dm_watch.sql`). There is no summary and no id of the other person. At delivery the message is read again from the permalink with the same token, and what it says is regenerated then. A message deleted or edited away since lapses silently.
- **One job per person per run, on its own budget.** The end-of-day `dm-promise-read:<user>` and the morning `dm-promise-nudge:<user>` each run on a fresh alarm, under the free plan's subrequest and D1 caps, and a budget stop resumes where it left off.

**Why.** ADR-020 lets a person's token answer that person in their own DM with uno-bot, and its 2026-09-29 amendment let a scheduled run use the token owner's token for output that is the owner's alone. Promise reminders from a person's own DMs are the first job that reads a person's private conversations every evening, with nobody present to ask. The trust model is ADR-020's: the token reads only what its owner can already read, and only the owner hears about it. Opt-in per purpose, the live-scope check and storing no message content keep that model intact without a requester (#742 amendment 2, scenario F2; Bill, 2026-09-29).

**Consequences.** The Home tab is a per-user view: the link prompt until someone connects, then their switches. A later purpose, such as catching decisions in the same DMs, adds a value to `DM_WATCH_FEATURES` and a checkbox, and needs no schema change and no amendment here, as long as it keeps these rules. Reading the DMs costs one `conversations.history` per DM a night, capped at `MAX_DMS_PER_NIGHT`. Only top-level DM messages are read, not replies inside a DM thread. Deploying needs migration `0011_dm_watch.sql` applied to `uno-bot-usage` first. A job whose output would reach anyone but the token's owner is not covered and needs its own ADR. — uno (agent), Sep 2026, applying #754
