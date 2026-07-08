<!-- Worker face — loaded by uno-bot via SKILL_PATHS. NOT loaded by the IDE agent. -->
# uno-maintain — bot face

Loads: references/method.md (the shared procedure) · docs/conventions/terminology.md

Keep the harness itself current: capture a flagged issue (improvement · inaccuracy · inconsistency · bug) in the agent system, route it, propose a reviewed fix (PR + paired PRD), and run it through `#plus-design` review. Two flows: **intake & proposal** (human-initiated) and **review & approval** (agent-initiated).

## Execute

- **Trigger:** a designer flags that the agent system is wrong — a stale product-context doc, an unhelpful skill, off-role persona, a broken Storybook story/token, a drifted Figma spec, or uno-bot misbehaving — or hands off a shipped change for sign-off.
- **Investigate before punting.** If the flag references a linked Figma frame, doc, or PRD, `read_source` it and inspect the issue yourself. If you truly can't inspect it, record the intake and route to a human — don't hand back DIY instructions as the whole answer.
- **Route the flag to ONE target** (split flags that span targets):

| Signal | Target | Where it lives |
|---|---|---|
| Context misinformation | product context / stories | `docs/context/product/*`, `terminology.md` |
| Skill isn't useful | refine the skill | skills tree (+ bot faces if shared) |
| UNO off-role / personality | tune persona / instructions | persona + AGENTS.md files |
| Storybook inconsistent / bug | design-system | `design-system/src/**` |
| uno-bot misbehaving | fix uno-bot | `uno-bot/**` + bot faces |
| Figma spec / component stale | update Figma | Figma + `design-system/src/**` |

- **Worth incorporating? → PR + paired PRD:**
  1. Draft the PRD as text first (Title · Summary · Problem/Context · Goals & Non-goals · Users & Scenarios · Requirements/Scope · Acceptance Criteria · Open Questions); let them refine. Do NOT call `create_prd` yet.
  2. On approval → `create_prd` (gated; Worker posts the Notion link).
  3. Open the PR via `implement(component, notion_prd_url, …)` for a DS-component fix (needs the PRD link) or `marketplace_add`/`marketplace_edit` for a catalog entry — one gated side-effect tool per message.
  4. Surface: post the review-request to `#plus-design`, suggesting reviewers via `find_experts`. The review-request post itself is a normal threaded reply, no tool.
- **Review response — three-way branch:** **approve** → PR cleared; merging/applying is the in-IDE agent's job (`uno`), not yours — hand off, confirm the harness is current once merged. **request changes** → fold feedback in and re-propose; small edits you can do, heavy ones escalate. **reject** → decline and record why in the thread so it isn't silently re-raised.
- **Gate instruction edits.** Persona / AGENTS.md / bot-face files steer every session — never propose those silently; the in-IDE gate applies.
- Faithful to what's flagged: fix what's actually wrong, cite the file/frame, never invent an inconsistency (or reviewers, or change items) to justify a change. Never auto-file a PRD or auto-open a PR.

## Output

The review-request post to `#plus-design` (Slack mrkdwn, tight — only what the PR / PRD / Figma actually show):

```
*Maintenance — {target}*
*What* • {the change, one line}
*Why* • {the reason}  <{prd}|PRD>
*Change* • <{pr}|PR>
*Reviewers* • {suggested people via find_experts}
```

After posting, the thread waits on the reviewer. Scannable, not a transcript.

## Hand-offs

- Heavy multi-file or visual fixes → escalate to the in-IDE agent (your scope cap); the in-IDE uno-maintain makes the fix in files and merges on approval — same routing table + PRD structure, kept in sync.
- Merging is never yours — **you propose, you don't merge.**
- Ordinary Plus-fact questions → default conversational mode. New prototype builds → **uno-prototype**. Thread summaries → **uno-synthesize** (which also drafts the PRD content when the change came out of a thread).
