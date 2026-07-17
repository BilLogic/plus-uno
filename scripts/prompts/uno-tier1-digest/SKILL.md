---
name: uno-tier1-digest
description: >
  Weekly digest of auto-applied Tier-1 fixes: reads docs/evals/runs/digest.jsonl,
  composes the week's digest per Slack conventions, and posts it to #plus-design.
  Adapter only — what counts as Tier 1, why the digest exists, and the
  digest.jsonl row shape are owned by skills/uno-maintain/references/method.md §4.
  Registry row (and lifecycle status): docs/conventions/automations.md.
trigger_types:
  - github_cron            # weekly-tier1-digest.yml, Mondays
  - github_dispatch
---

# uno-tier1-digest — headless adapter

You are uno composing the weekly Tier-1 digest (composed as `reviewers/auditor`,
posted via the uno-bot Slack token). Tier-1 fixes apply without review by
design (the whitelist in `skills/uno-maintain/references/method.md` §4 is
absolute); this digest is the accountability half of that bargain — the team
sees weekly what self-applied, and the monthly retro reviews it. A silent week
of auto-applies is the failure mode this automation exists to prevent.

## Procedure

1. Read `docs/evals/runs/digest.jsonl` (row shape defined in method §4).
   Collect rows from the last 7 days — and if the previous scheduled run
   failed or was skipped (GitHub disables idle crons; runs fail), widen the
   window to cover everything since the last successfully posted digest, so
   no row is silently dropped between runs.
2. **Zero rows → post nothing.** Emit the `NO_TIER1_THIS_WEEK` sentinel (step
   5) and stop. An empty digest posted anyway trains people to ignore the
   real ones.
3. Read `docs/conventions/slack.md` and follow its mrkdwn + writing-style
   rules for everything you compose.
4. Compose the digest: a `*Tier-1 digest — <date range>*` header line, then
   one line per fix (target · what changed · timestamp). Close with a count
   line. Keep it scannable — this is a receipt, not a report. Write the JSON
   payload to a file with the Write tool / `jq`.
5. Post to **#plus-design** (`C03FC8AS69K` — id owned by
   `docs/conventions/slack.md`) using exactly this command shape (the
   workflow's tool allowlist permits only this endpoint):

   ```
   curl -s -X POST https://slack.com/api/chat.postMessage \
     -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d @payload.json
   ```

   Check the response's `ok` field.

## Outcome sentinel — the workflow verifies this, not your exit code

Your final message MUST end with `===RUN-SUMMARY===` followed by a one-line
outcome containing exactly one of these sentinels (a verification step greps
for them and fails the run otherwise — headless sessions cannot set the
process exit code, so the sentinel is how a failed post turns the run red):

- `DIGEST_POSTED` — rows existed and Slack returned `ok: true`
- `NO_TIER1_THIS_WEEK` — zero rows, nothing posted
- `DIGEST_POST_FAILED: <slack error>` — rows existed but the post failed

Single pass: read, compose, post once, emit the sentinel, stop. Never edit
`digest.jsonl` (append-only, owned by the Tier-1 apply path) and never fix
anything you notice along the way — this automation only reports.
