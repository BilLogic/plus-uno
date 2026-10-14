---
embodiment: ide
summary: How to run uno-bot's measurement window each week and close it — the five numbers, where each comes from, where it is recorded, and what stays private.
---

# Measurement window

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-10-13 · applied by whoever runs the uno-bot measurement window, weekly and at its close. -->

The measurement window asks one question: does uno-bot take housekeeping off the
lead without anyone losing an answer? It is answered by five numbers, read from
the usage record (D1 `uno-bot-usage`) and from the lead's inbox, and recorded in
Notion each week.

## The window

- **Runs** from 1 September 2026 until about 100 real asks are on the usage record. It has no fixed end date.
- **The usage record begins 2026-09-29.** A query over September reads nothing before that date; say so wherever a September number is cited.
- **The minimums were locked on 2026-10-13.** Report 2026-10-13 onward as its own line beside the whole window, and tick *After lock only* on that row.

## The five numbers

| # | Measure | Baseline | Minimum |
|---|---|---|---|
| 1 | Housekeeping requests reaching the lead per workday, beside asks to uno-bot | about 9 | under 3 |
| 2 | Asks settled without the lead, out of all asked; and correct, of 50 graded | — | at least half; at least 40 of 50 |
| 3 | Share of asks left to the next day, and median wait | 18%, 29 min | under 5%, minutes |
| 4 | Askers, and askers with asks in 3+ window weeks | — | at least 10; half of them |
| 5 | Proposals approved / approved with edits / rejected — cards, upkeep fixes, reminders | — | tracked, not published |

### How number 1 is counted

The baseline of about nine is three parts with one filter. The parts are the lead's DM asks (6.4 per workday) and channel-mention asks (0.8), both from the lead's inbox count, plus meeting asks (3.6), from the corpus. Their sum, 10.8, is multiplied by the non-judgment share, 0.88, which gives 9.5. A workday is Monday to Friday with no holidays removed. The baseline period is Spring 2026, 2026-01-12 to 2026-05-01, which is 80 workdays. The corpus alone gives 6.5 per workday, and the sort's calibration mode reproduces that figure. The derivation is in the header of `agents/uno-bot/measurement/housekeeping-sort/lib.mjs`.

The window's number 1 must be built the same way: the same three parts, with the same non-judgment filter applied to their sum. Report each part beside the total in the Weekly snapshot's Notes, so the comparison with nine is like for like.

## Where it is recorded

All three databases live under the *Measurement window* page in the PLUS Notion
article hub (<https://app.notion.com/p/650c205f416f4c2ea49826b10cf2eeed>). Write
to them through the notion-plus connector, per `docs/connectors/notion.md`.

| Database | Data source | One row per |
|---|---|---|
| [Weekly snapshot](https://app.notion.com/p/1394f5a963d640b6beba9537e5e0077e) | `3a7f940d-3b01-4a2a-ab5d-104e80d1bd66` | week: one number column per measure (`1 · …` to `5 · …`), Thanks reactions, Thanks replies, Shout-outs logged, Query commit, Run on, After lock only, Notes |
| [Graded answers](https://app.notion.com/p/c323214bd760422abb7cbf05a3ec76dc) | `5ec8228b-e301-40d2-ab4d-0e70cfdfe19f` | sampled answer: Turn id, Slack link, Asked at, Surface, Permission, Grade 1 / Grader 1, Grade 2 / Grader 2, Agree, Source of truth, Note, Seed |
| [Appreciation log](https://app.notion.com/p/ccc07bf1457b4e8cabcf837c18677fed) | `cd40de9d-d0d8-4500-b77d-75d0e02fb97a` | shout-out: What it was, Date, From, Where, Kind, To, Period (Before / Window), Permission, Quote, Link, Week |

## Weekly, each Monday for the week just closed

1. **Run the saved queries.** From `agents/uno-bot/`, for each of `load-on-lead`, `self-serve-rate`, `responsiveness`, `adoption`, `proposal-outcomes` and `appreciation-weekly`:

   ```bash
   npm run metric -- adoption --from 2026-10-05 --to 2026-10-12 --out /tmp/adoption.sql
   npx wrangler d1 execute uno-bot-usage --remote --file /tmp/adoption.sql
   ```

   Both steps only read. Run each query twice, once for the week and once for the window to date (from 2026-09-01, and from 2026-10-13 for the after-lock line). Cite every result as `agents/uno-bot/README.md` § Metrics says: query file, commit, window, graded-answers commit, run date.
2. **Sort the lead's inbox.** Export the week's DMs, channel messages and meeting notes to a local JSONL file outside the repo, then run the pinned sort over it: `node agents/uno-bot/measurement/housekeeping-sort/sort.mjs <export.jsonl> --from YYYY-MM-DD --to YYYY-MM-DD` (other flags in the header of `agents/uno-bot/measurement/housekeeping-sort/sort.mjs`). It prints housekeeping requests per workday, the prompt's sha256 and the model id; record all three. The per-row labels stay where the script writes them, outside the repo.
3. **Count the thanks.** The D1 counts come from `appreciation-weekly` (reactions on uno-bot's messages, thanks replies to it). Then search the week's channels and Figma comments for shout-outs that were not addressed to the bot, and add each to the **Appreciation log** with Permission unset and Quote empty.
4. **Fill one Weekly snapshot row**: the five numbers, Thanks reactions, Thanks replies, Shout-outs logged, Query commit (`git rev-parse --short HEAD`), Run on, After lock only, and anything odd in Notes.

The checkpoint for each week is that one row, every column filled and every number traceable to a query file and commit.

## Once, at the close

1. **Draw the answer sample.** From `agents/uno-bot/`, list the eligible answers, then draw from them with a seed:

   ```bash
   npm run metric -- sample-answers --from 2026-09-01 --to <close> --out /tmp/sample-answers.sql
   npx wrangler d1 execute uno-bot-usage --remote --file /tmp/sample-answers.sql --json > /tmp/eligible.json
   node scripts/sample-answers.mjs --rows /tmp/eligible.json --seed <seed> --n 50 --second 10
   ```

   It prints `turn_id,slack_link,surface,needs_permission,second_grade`; the same rows and seed always pick the same turns. Record the seed, and add each turn to **Graded answers** with that Seed.
2. **Ask before grading a private answer.** `needs_permission` is 1 for every answer not provably in a channel: a DM, a group DM, or an unknown surface. Ask the asker first. A refusal or no reply skips the turn; take the next draw from the same seed in its place, and count the skips in the close note.
3. **Grade.** Each answer gets Grade 1 against its Source of truth: `correct`, `partial` or `wrong`. The 10 rows marked `second_grade` get Grade 2 from a second grader, blind to Grade 1; *Agree* reports the agreement on those 10.
4. **Export the grades** to `agents/uno-bot/queries/usage/graded-answers.csv` (`turn_id,grade,grader,note`, Grade 1 only, the note describing the answer in your own words), commit it, and re-run the queries that read it. Cite that commit.
5. **Ask before quoting.** A shout-out's Quote is filled only after its author says yes; until then the log carries the link alone.
6. **Write the close row** in the Weekly snapshot over the whole window, plus the after-lock line, and compare each number to its minimum.

## Privacy

The usage record follows ADR-030 (`docs/adr/030-the-usage-record-lives-in-d1-not-analytics-engine.md`), unchanged by this window: D1 holds counts, flags and ids; message text stays in Slack.

- DM text reaches neither D1 nor the repo. An answer outside a channel is graded only with its asker's permission.
- A quote enters the Appreciation log only once its author grants it.
- Inbox exports and the housekeeping sort's labels stay on the runner's machine, outside the repo.
