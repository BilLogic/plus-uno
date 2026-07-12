# Request Corpus Expansion — Slack + Zoom Mining (2026-07-12)

> Expands the original 25-entry real-usage corpus
> ([Notion](https://app.notion.com/p/390b7cca498281bb899ae865a2ffa460)) to ~55 entries by
> mining Slack (#plus-design, #plus-universal, #plus-goal-setting, #plus-dev, DMs) and
> Gmail's Zoom AI Companion recaps. All people redacted to roles; DM content paraphrased,
> never quoted. Feeds recap §2 and the `team-bot-setup` skill's Phase 1 guidance.

## Themes (combined ≈ 55 entries)

| Rank | Theme | Original 25 | New 30 | Combined |
|---|---|---|---|---|
| 1 | T2 Spec/PRD disambiguation | ~8 | 8 | ~16 |
| 2 | **T6 Continuity-recap (NEW)** | 0 | 12 | 12 |
| 3 | T1 DS source-of-truth | ~7 | 3 | ~10 |
| 4 | T4 Resource wayfinding | ~2 | 6 | ~8 |
| 5 | T3 Review & handoff QA | ~3 | 4 | ~7 |
| 6 | T5 Bot meta / automation | ~4 | 1 | ~5 |
| 7 | **T7 Tooling & team-ops onboarding (NEW)** | 0 | 2 | 2 |

## Headline findings

1. **Continuity-recap is the hidden #2** — 12 of 30 new entries, invisible in the original
   corpus because **11 of 12 came from DMs**; channel-weighted collection structurally missed
   it. Four flavors: decision recall ("which breakpoint did we delete?"), assignment recall
   ("am I documenting the Lessons page?"), project-status recap ("pick up where the summer
   project left off"), and the lead reconstructing an intern's state from memory. It flows
   **both directions** (interns → lead, lead → interns).
2. **Spec/PRD disambiguation stays #1 and widens to developers** — half the new T2 entries
   are dev-facing handoff questions (tooltip copy, status-value semantics, thresholds, empty
   states), not designer questions.
3. **DM ≫ channel:** ~3/4 of new entries came from DMs — exactly the request types that make
   the lead a single point of failure.
4. **The decision log is the missing source of truth.** The largest shared root cause across
   T6 and several T2 entries: decisions live in meeting memory and DM threads, not in any
   retrievable artifact. Candidate bot capability: write decisions to Notion cards the moment
   they're made.
5. **Zoom recaps corroborate and extend** (from the Gmail mining pass): ~100 Zoom AI recaps
   since late April (3–6/week — stand-ups, 1:1s, crits), whose "Next steps" bullets are
   near-perfect ground truth for who-owes-what — **currently sitting unread in an inbox**.
   Recurring meeting-side topics match the Slack ranking: token/spacing rules, doc
   single-source-of-truth, evals methodology taught repeatedly, artifact hunting (a whole
   meeting spent looking for a departed contributor's 2025 files), and the lead acting as
   human message bus. Candidate proactive capability: ingest meeting recaps and post them
   (or chase their action items) in Slack.

## New entries (30, paraphrased, redacted)

| # | Request (paraphrased) | Source | Theme | Bot capability |
|---|---|---|---|---|
| 26 | Design intern picked up a page redesign where a departed intern left off; asks who should review the Figma comments | DM | T6+T3 | lookup (recap + routing rules) |
| 27 | Design intern asks to be pointed at any existing Figma for her card; found nothing, remembers it from the last meeting | DM | T6+T4 | lookup |
| 28 | "Remind me — do we reuse the existing scenario designs for the fill-in booking flow, or revise them?" | DM | T6 | lookup (decision log) |
| 29 | "Remind me what the tutor-student ratio is for sessions?" | DM | T2 | lookup |
| 30 | Design technologist: "remind me which breakpoint we decided to delete?" | DM | T6 | lookup (decision log) |
| 31 | Researcher: "remind me what was missing on the quiz-embed issue?" | DM | T6 | lookup |
| 32 | "Remind me — am I the one documenting the Lessons page?" | DM | T6 | lookup |
| 33 | PM: "remind me what the status is on [project]?" — recurring, seen twice a year apart | DM | T6 | automation (status digest) |
| 34 | Lead → intern: asks for a progress recap on a Notion card, reconstructs "we left off at…" from memory | DM | T6 | automation (auto-recap) |
| 35 | Lead → designer: follow-up on a stalled decision thread ("any update on the missing-data states?") | DM | T6 | automation (open-decision tracker) |
| 36 | PM reboots a dormant project: "pick up where the summer project left off, refresh the design" | DM | T6 | lookup (project history recap) |
| 37 | Intern returns from break asking for feedback "from where we last left off" | DM | T6 | stays-human + lookup (recap) |
| 38 | "Did you post guidance on project selection? I can't find it anywhere" | DM | T6+T4 | lookup (Slack search) |
| 39 | PM: repeated "remind me tomorrow to discuss X" asks (4+ instances) | DM | T5 | automation (agenda capture) |
| 40 | Developer's long spec-question list: required fields, tooltip copy, status values, unsupported fields | DM | T2 | lookup + stays-human |
| 41 | Developer: "questions on the Figma for card [N] — time for a call?" | DM | T3 | stays-human; bot pre-answers from spec |
| 42 | Developer reviewing a peer's work can't find tooltip specs and an icon in Figma | DM | T3+T4 | lookup (spec navigation) |
| 43 | Developer: "is the table you shared the algorithm for setting status?" | DM | T2 | lookup |
| 44 | Developer: do different scenarios need different loading modals; where are the other variants? | Group DM | T2 | lookup |
| 45 | Developer: does the old 300 threshold for ratio→percentage still hold? | Channel | T2 | lookup (decision log) |
| 46 | Developer: tooltip text for card titles? default goal value? pre-goal card state? | Channel | T2 | lookup |
| 47 | Intern asks researcher: how is goal status determined mid-cycle? | Channel | T2 | lookup + stays-human |
| 48 | Intern: certified-tutor badge beside the photo or in the status section? | DM | T1 | stays-human; bot surfaces precedent |
| 49 | Intern: should I update the hand-off page in Figma to match my changes? | DM | T3 | lookup (handoff rule) |
| 50 | Intern flags onboarding-lesson status checkmarks differing only by color | DM | T1 | automation (DS issue intake) |
| 51 | Intern: am I attaching DS components correctly? should altered modals become separate components? | DM | T1 | lookup + review |
| 52 | Designer: do we have data on when tutors started (new vs. returning)? | Channel | T2 | lookup, escalate to dev |
| 53 | Designer: existing illustrations for strategies pages? max competencies per resource? | Channel | T2+T4 | lookup |
| 54 | Intern can't find the meeting link for the design jam | DM | T4 | lookup |
| 55 | Faculty researcher: "years of Figmas shared with me and I can't find stuff" | DM | T4 | lookup |
| 56 | Ops coordinator needs the edit link for a form; not on the shared drive | DM | T4 | lookup |
| 57 | Developer can't find card [N] in Notion on either board | DM | T4 | lookup |
| 58 | New design technologist: how do I use Loom / clone a branch / log hours? | DM | T7 | lookup (tool guides); hours stay human |
| 59 | Designer needs Google-account access for site analytics | Channel | T7 | stays-human; bot routes |

## Zoom-recap-sourced additions (from Gmail mining, same pass)

Corpus-worthy requests extracted from meeting summaries — themes match, plus proactive
candidates: chase action items with deadlines; route "new video/spec posted in
#design-feedback" to the right person before their 1:1 (the lead does this manually today);
post meeting recaps into the relevant Slack channel (they currently sit unread in email).
Notable single item: a **whole meeting spent hunting a departed contributor's 2025 files**
(supervisor annotations, a "total tagged output" file) — institutional-memory failure in its
purest form.

## Coverage notes

- Slack: two candidate hits duplicated existing corpus entries and were excluded.
- Zoom: ~100 AI Companion recaps since late April 2026 (3–6/week); earlier period covered by
  Otter.ai summaries; transcripts behind Zoom links (not mined — recap summaries sufficed).
- The original Notion corpus page remains the canonical v1; this file is the expansion
  record. Consider merging both into the Notion page for one canonical corpus.
