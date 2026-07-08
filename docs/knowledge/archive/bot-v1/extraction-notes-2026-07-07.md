# Extraction notes — bot-skills/ → capability bot faces

## (a) Content deliberately dropped, and why

- **v1/v2 architecture narration** (frontmatter `trigger_types`, `status`, `covers`, `notes`, "renamed from uno-assist", "absorbs uno-prd", Pipedream references, "router step" language). Historical scaffolding, not behavioral rules; the new IA supersedes it.
- **Cost Profiles and TODO-Before-Production sections** (uno-qa, uno-marketplace, uno-critique). Ops/planning notes, not runtime instructions. The open engineering items worth keeping (ID auto-increment race under concurrent adds, enum validation location, ✅-reaction UX across clients) belong in an engineering backlog, not a system prompt.
- **uno-marketplace GitHub Action mechanics** (branch naming `bot/marketplace-add-{id}-{date}`, `repository_dispatch` event types, Action step lists). Worker/Action internals the model doesn't act on; kept only the behavior-visible parts (draft PR opens, link posts back, Worker auto-assigns id/localPath/lastUpdated).
- **uno-marketplace sample invocations and the long conversational-flow transcript**. The rules they illustrate (ask-for-missing-fields, proposed-entry preview, no-op detection) are preserved as rules.
- **uno-marketplace SKILL.md's own query-key syntax** (`pillar:`, `stage:`, `limit` param, AND semantics). It contradicts tool-definitions.json, which defines `marketplace_search` as a single free-form `query` matched case-insensitively across fields and no `limit`. The JSON is the live contract; I kept the JSON shape. (Same for `localPath` — SKILL.md says designer-suppliable, JSON says Worker-auto-assigned; JSON wins.)
- **uno-marketplace's hand-drawn confirmation-gate message formats** ("React with ✅ to open the PR…"). AGENTS.md rule 3 supersedes them: the agent writes only the structural preview; the Worker appends the ⚠️ footer + confirmation prompt. Kept the preview discipline, dropped the stale templates.
- **uno-critique v1 fetch table** (Figma MCP `get_design_context`, Playwright, `gh pr diff`, desktop-app-open requirement, marketplace-ID screenshot flow). v1 IDE-era tooling; the Worker's fetch path is `read_source(url)` per AGENTS.md rule 2.7. Salvaged instead: rubric categories, P0/P1/P2 thresholds, evidence-per-finding, confidence floor, mandatory "What's working", edge-case behaviors, output shape.
- **uno-qa's Step-1 classification table and knowledge map**. The doc-routing map is L1-context material that the Worker build loads differently (and the map's paths would drift); kept the behavioral residue — cite paths, 1–3 doc fetches, hand off to in-IDE beyond that, staleness honesty.
- **"How this voice will evolve" / emoji-palette iteration notes / "What This System Prompt Is Not"** (AGENTS.md). Meta-commentary about future governance, not behavior. The reaction palette itself is kept (condensed) in AGENT-uno-bot.md.
- **`docs/plans/` naming details, tone.md TODO** — repo-navigation trivia not tied to any bot action.

## (b) What REGRESSION.md is and where it should live

`bot-skills/REGRESSION.md` is a **12-row eval / regression checklist** (R1–R12) of locked-in behaviors from eval rounds 1–2: each row = seed Slack prompt + binary expected outcome (confidence ritual, publish routing, no false action claims, cancel stickiness, blueprint grounding, blind-PR gate, etc.), plus a maintenance rule ("new win → new row; failing row = release blocker"). It is **not** prompt material and must not be concatenated into the system prompt. It is Evaluation-layer (L4) content: it should live with the Worker's test assets — e.g. `agents/uno-bot/REGRESSION.md` (next to AGENT.md, since it tests the assembled prompt) or the repo's eval/rubrics area (`docs/rubrics/` equivalent in this repo's IA). Wherever it lands, the eval runner — not SKILL_PATHS — is its consumer.

## (c) Rules duplicated across sources (now stated once)

| Rule | Appeared in | Now lives in |
|---|---|---|
| Slack mrkdwn table (single-asterisk bold, `<url|label>`, no headings) | AGENTS.md + restated in uno-qa, uno-marketplace, uno-critique, uno-synthesize, uno-maintain | AGENT-uno-bot.md (once) |
| Confidence line ritual | AGENTS.md voice §4 + uno-qa Output Format | AGENT-uno-bot.md |
| Blueprint-first grounding + cite rows + honesty on empty | AGENTS.md (cross-cutting + `blueprint_search` tool rule) + uno-qa + uno-synthesize | AGENT-uno-bot.md |
| `read_source` every linked URL / never answer from priors | AGENTS.md (cross-cutting + tool rule) + uno-qa + rule 2.7 | AGENT-uno-bot.md (review-specific "inspect first" kept in bot-review.md) |
| PRD draft-first → `create_prd` only on approval | AGENTS.md tool list + rule 2.2 + uno-synthesize + uno-maintain + create_prd JSON description | bot-synthesize.md (canonical); bot-maintain.md references the same shape |
| PRD structure (Title…Open Questions) | rule 2.2 + uno-synthesize + uno-maintain | bot-synthesize.md + bot-maintain.md (needed in both faces since they load independently) |
| Confirmation gate non-negotiable / "friction is the feature" | AGENTS.md rules 3, 7 + uno-marketplace discipline | AGENT-uno-bot.md |
| Ask-for-missing-fields, never placeholders | AGENTS.md rule 9 + uno-marketplace + marketplace_add JSON | AGENT-uno-bot.md (generic) + bot-publish.md (marketplace required-field list) |
| share_for_feedback ≠ marketplace_add | AGENTS.md rules 2.1 + 2.6 + share_for_feedback JSON | bot-publish.md |
| implement requires PRD | AGENTS.md rules 2.1 (twice: tool list + 2.1) + implement JSON | bot-prototype.md |
| Never invent PRD URL / component name | AGENTS.md 2.1 + implement/implement_design JSON | bot-prototype.md |
| One gated tool per message | AGENTS.md rule 6 + uno-maintain | AGENT-uno-bot.md |
| Requester-only confirm + 15-min expiry | AGENTS.md rule 4 + safety contract + resolve_pending_proposal JSON | AGENT-uno-bot.md |
| No invented people; LinkedIn-not-@mention | AGENTS.md 2.3 + uno-research SKILL.md + find_experts JSON | bot-research.md |
| Heavy multi-file (>5) / visual work → in-IDE agent | AGENTS.md Identity + Scope + uno-maintain ×2 | AGENT hand-offs per face (kept per-face; it's each capability's scope cap) |
| Escalate product/strategy to Bill | AGENTS.md Scope + uno-qa + uno-critique | bot-review.md + AGENT-uno-bot.md decline rules |
| No walls of text / summary+Gist over threshold | AGENTS.md Slack Behaviors + uno-qa (1000) + uno-critique (1500) + several "Forbidden" lists | AGENT-uno-bot.md (3000 general) + per-face thresholds where the source gave one |

Known conflict preserved as-is: uno-research SKILL.md says "no @-mentions ever (no contact data)" while AGENTS.md 2.3 (newer) says tag `<@slackUserId>` when the field exists. bot-research.md keeps the 2.3 version with the historical caveat.

## (d) tool-definitions.json tools per capability

13 tools total in `bot-skills/tool-definitions.json`. Primary owner per capability (read-only tools marked ~):

- **uno-research**: `find_experts`~
- **uno-synthesize**: `create_prd`, `delete_prd`, `blueprint_search`~ (summaries/update-summaries use no tool)
- **uno-prototype**: `implement`, `implement_design`
- **uno-publish**: `share_for_feedback`, `marketplace_search`~, `marketplace_add`, `marketplace_edit`, `send_email`
- **uno-review**: `read_source`~ (diagnose-only; no side-effect tools)
- **uno-maintain**: no tools of its own — orchestrates `create_prd` (synthesize), `implement` / `marketplace_add` / `marketplace_edit` (prototype/publish), `find_experts`~ (research)
- **Persona-level (AGENT-uno-bot.md)**: `resolve_pending_proposal`, plus `blueprint_search`~ and `read_source`~ as cross-cutting grounding tools usable from any capability

## Other judgment calls

- **bot-prototype.md** has no source SKILL.md (uno-implement/uno-implement-design dirs were not read per task scope); it is derived entirely from AGENTS.md rules 2.1 + 1.x tool list + the `implement`/`implement_design` JSON descriptions. Both `implement` and `implement_design` live there since 2.1 treats them as one routing decision.
- **`send_email` (rule 2.5)** was homed in **uno-publish** (outward communication) — it fit no capability cleanly; flag if it should be persona-level instead.
- **uno-qa was dissolved into the persona** (per task spec): its Q&A discipline, edge-case scripts, and length norms are the "default conversational mode" section of AGENT-uno-bot.md; nothing of it became a bot-*.md.
- "Loads:" lines name conventions files by source filename (terminology.md, cheat-sheet.md, principles.md, accessibility.md, content-voice.md, layout-cheat-sheet.md) under the new `docs/conventions/` root — verify these are the final paths when the IA lands.
