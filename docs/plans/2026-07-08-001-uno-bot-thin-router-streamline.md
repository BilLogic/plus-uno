# uno-bot Streamlining — the thin-router pass

- **Status:** proposed (awaiting Bill's scope decision on Tranche B)
- **Date:** 2026-07-08
- **Source:** three parallel audits — outer automation (Actions/scripts), inner Worker (`src/` fat/thin), Slack-formatting research
- **Owner:** Bill

## 0. The corrected thesis

The Worker should be **thin on writes, deliberately fat on reads** — not thin everywhere. It is already ~80% thin (~2,050 LOC irreducible core + ~800 LOC read-grounding that must stay). The genuine, foldable fat is narrow: three inline **write** tools and the ~490 LOC behind them, plus ~400 lines of duplicated **codegen prompt** in the outer repo. The bot's core value is answering grounded questions live (`blueprint_search`, `read_source`, `find_experts`) — delegating those would turn a conversation into a pull request.

**Verb discipline:** most of this is *fold* (source from the skill that now owns it) and *fix* (a live correctness bug), not *cut*. Executors stay; their duplicated prompts/authoring fold.

## 1. What's irreducible (do NOT touch)

- **Thin-router core (~2,050 LOC):** Slack verify · event parse/engagement gating · the agentic loop · Durable-Object thread state · the proposal gate · model tiering. All lean. (`events.ts` at 589 LOC is accreted gate-correctness defense, each block traceable to a named regression — leave it; at most split the proposal-formatting tail into `proposals.ts` for readability.)
- **Read-grounding (~800 LOC):** `blueprint.ts` (188), the read half of `notion.ts` (~215: `findTeamMembers` + `readNotionPage`), `figma.ts` (read + proposal-preview), `read_source`, `marketplace_search`. These power live answers and the gate's preview thumbnail. **Defend.**
- **Three headless Actions:** `figma-library-poll.yml` (15-min cron — nothing else schedules it) + `figma-implement.yml` + `figma-implement-design.yml` (`repository_dispatch` fires only on the default branch; they do git-branch + multi-file-write + PR). The Worker *proposes*; the Action *executes*. Executors stay.

## 2. Tranche A — fold + fix (low risk, high value; mostly outer repo)

Safe because it changes *what an Action's prompt sources* and *fixes a lie*, not the Worker's runtime behavior. One live-run equivalence check per implement flow.

| # | Change | Why | Risk |
|---|---|---|---|
| A1 | **Repoint `scripts/lib/skill-loader.js` from `scripts/prompts/` → `skills/uno-prototype/`.** Slim the two `scripts/prompts/uno-implement*/SKILL.md` to just the Action-only `---FILE:---` output contract + `model_default`; source all DS conventions/token rules/forbidden patterns from `uno-prototype/references/method.md` + the cheat-sheets. | ~400 LOC of codegen prompt currently *restates* uno-prototype. The seam already exists; the prompts already half-reference the skill's references. | Medium — needs one live implement + one implement_design run to confirm equivalent output (the prompt's own "Migration TODO" prescribes exactly this test). |
| A2 | **Fix the marketplace lie.** `marketplace-add.yml` / `marketplace-edit.yml` are v2.x **stubs** (log + "🚧 stub" post, no PR), yet `tool-definitions.json` tells the model they "open a draft PR" and `automations.md` marks them "✅ live." Either (a) build the thin file-editor (append to `prototypes-data.js`, schema from `uno-publish/references/marketplace-schema.md`) **or** (b) cut the two `marketplace_*` write tools + stub workflows and mark the registry "planned." | The bot currently promises a capability that silently no-ops. Whichever way — stop shipping the false claim. | Low (needs your **build-vs-cut** call). |
| A3 | **Delete dead code:** `buildIssueBody` + the `.figma-sync-context/issue-body.md` write in `poll-figma-library.js` — output no step consumes (v1 GitHub-issue path, since replaced by Notion-PRD + Slack). | Zero consumer. Free cleanup. | Zero. |

## 3. Tranche B — the write-delegation fold (architectural; needs your decision + the redeploy)

Convert the three inline **write** tools to the propose→dispatch pattern `implement` already uses. Sheds ~490–570 LOC (~14%) from the Worker.

| Tool | Today (inline/fat) | Target | Fold cost |
|---|---|---|---|
| `create_prd` | `create-prd.ts` 82 + `notion.ts` PRD builder ~140 | new `create-prd.yml` Action owns the Notion write; tool body → `repositoryDispatch` | one-turn thread-memory softening¹ |
| `delete_prd` | `delete-prd.ts` 39 + `archiveRoadmapCard` ~53 | same Action; **the Roadmap-only safety guard moves with it** | safety locus relocates² |
| `send_email` | `send-email.ts` 61 + all of `gmail.ts` 115 | new `send-email.yml`; OAuth secrets move to the runner | address validation relocates² |

**Why the gate is safe under this:** the read-only/side-effect split is entirely tool-body-agnostic — `executeTool` doesn't care whether a tool acts inline or fires an Action, and four tools (`implement`, `implement_design`, `marketplace_*`) already delegate through the gate unchanged. So this is a tool-body change only; requester-auth + idempotency guards are untouched.

¹ An Action returns `{dispatched}` with no synchronous URL, so the confirm-time history note loses the artifact link — but `buildThreadHistory` rebuilds memory from the live Slack thread, and the Action posts the link there, so it reappears next turn. One-turn, not permanent. Note it in the tool's `outcomeNote`.
² The post-confirm guards (delete = Roadmap-only; email = address validation) move into the Action runner, which must re-validate the dispatched payload rather than trust it.

**Interaction with the Netlify question:** every write delegated makes the Worker thinner and the eventual platform-move cheaper (a thin proposer ports trivially; a fat inline client doesn't). Tranche B is the same work that de-risks that decision.

## 4. Sequencing

1. **Now (this branch):** conventions + voice spec (done — slack.md § formatting/style, AGENT.md § Voice & tone). Tranche A3 (dead code) can ride along — zero risk.
2. **After your build-vs-cut call on A2** and a green light on A1: fold the codegen prompts + fix marketplace, with the live equivalence runs. **Requires the Worker redeploy first** (A1 changes what the Actions feed Claude, but the *bot* still needs the pending `wrangler deploy` to be on current guidance before we trust end-to-end runs).
3. **Tranche B** is a deliberate architectural commitment — do it as its own PR with an ADR, after A lands and the bot is confirmed healthy on the new build. Not under time pressure.

## 5. Open decisions for Bill

- **A2: build the marketplace file-editor, or cut the `marketplace_*` write tools?** (Search stays either way.)
- **Tranche B: commit to write-delegation now, later, or not?** It's the "true thin router" move and de-risks Netlify — but it's real work for a bot that already functions. Recommendation: yes, but *after* Tranche A + a healthy redeploy, as its own ADR'd change.
- Everything here assumes the pending **`wrangler deploy`** happens first — end-to-end verification of any fold is meaningless against a stale live build.
