# uno-publish — eval scenarios

<!-- written 2026-07-07 (evals-first, before the body rewrite); verified against the rewritten bodies by the 2026-07-08 golden runs — see docs/evals/runs/. Rubric: docs/evals/rubrics/uno-publish.md · Decisions DB scenario added 2026-07-13 -->

## S1 — feedback rail: the complete bundle
- **Trigger:** "share the coach-dashboard prototype for feedback"
- **Expected:**
  - Rail decision made once (feedback), never re-merged with handoff
  - Full bundle assembled before posting: Loom + preview link + Decisions DB (project filter / Evidence) + Figma replica (required — the artifact is a prototype; writers/figma builds it)
  - Post per slack conventions: ≤3 feedback questions + a NOT-looking-for line, right channel
- **Fails if:** a partial bundle posts (the gate must refuse) · the replica is skipped "to save time" · the share-out posts with >3 feedback questions or no NOT-looking-for line (post-shape rule, slack.md)

## S2 — handoff rail: sign-off is a wall
- **Trigger:** "this one's approved — hand it off to dev"
- **Expected:**
  - Componentization → Handoff Spec via writers/notion (template-instantiated)
  - Rails propagation inside the designer-confirmed handoff, logged: storybook direct in-repo; blueprint half via uno-maintain's handoff-pre-authorized path (§6 Q9)
  - DS/UNO/a11y review gate, then the human gate: dev + PM + stakeholder ✅ sign-offs — no sign-off, no publish
  - Marketplace entry validates against the marketplace schema (repo catalog interim — the Notion DB isn't stood up; flag the gap)
- **Fails if:** anything publishes without all three sign-offs · rails skipped or not verified landed before marketplace publish · schema-invalid entry lands

## S3 — routing edge: "post this in slack"
- **Trigger:** "can u post this in slack?"
- **Expected:** clarifies intent — feedback share-out (bundle rules apply) vs a plain message (uno-bot conversation, no publish machinery)
- **Fails if:** it fires the share-out machinery for a casual message, or posts a bundle-less share-out

## S4 — sync feedback session: logistics only
- **Trigger:** "set up a live feedback session for this instead"
- **Expected:** publish owns logistics only (scheduling, recording setup); the study guide comes from uno-research, the transcript synthesis from uno-synthesize
- **Fails if:** publish writes its own study guide or analyzes the session itself

## S5 — log a decision to Decisions DB
- **Trigger:** "we decided in this thread to keep the note input small — log that on the note-taking card"
- **Expected:**
  - ✅-gated `notion_create` surface `decision` (or IDE writers/notion create)
  - Row has Name, Status, Roadmap Card = the project, Evidence = Slack permalink when available
  - Body carries Decision + Why; does **not** append to an obsolete Decision Log subpage
- **Fails if:** writes to a Decision Log subpage · omits Roadmap Card · invents a Status option
