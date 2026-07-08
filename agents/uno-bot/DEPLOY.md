# uno-bot — Deploy & `implement_design` launch runbook

The uno-bot v2 Worker is already deployed (Cloudflare → Workers & Pages → `uno-bot`,
active deployment serving 100% traffic). This doc covers redeploying the Worker and
launching the **`implement_design`** feature, whose two halves have different gating.

## What `implement_design` does

A designer pastes a Figma frame URL **and** a Notion PRD link in Slack; the bot
proposes building a prototype, shows a Figma screenshot preview, and on confirm
scaffolds a new `playground/{slug}/` prototype (React + Vite + PLUS DS) and opens a
draft PR. Distinct from `implement`, which updates an existing DS-library component.

## Two halves (different gating — read this first)

1. **Worker half** — propose + Figma screenshot preview + fire `repository_dispatch`.
   Lives in `uno-bot/src`, shipped via `wrangler deploy`. Independent of any git branch.
2. **Action half** — codegen → draft PR. `.github/workflows/figma-implement-design.yml`
   runs `scripts/implement-design-from-figma.js`.
   **`repository_dispatch` only triggers workflows that exist on the repo's DEFAULT
   branch (`main`).** So the Action half needs its files on `main`.

Until BOTH halves are live, confirming an `implement_design` proposal dead-ends:
the proposal posts and the screenshot shows, but no PR ever opens.

## Prerequisites (already true today)

- Worker deployed & serving Slack (Slack event URL already wired).
- Worker secrets set and persisting across redeploys: `SLACK_SIGNING_SECRET`,
  `SLACK_BOT_TOKEN`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`.
- Action repo secrets (from the DS-component flow): `ANTHROPIC_API_KEY`,
  `FIGMA_ACCESS_TOKEN`, `NOTION_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_WEBHOOK_URL`.
  → Verify `FIGMA_ACCESS_TOKEN`'s account can read the design files designers paste
  (e.g. `Design System – Web App Specs`, key `W0qzhXWxFsMwSJzkdV2yal`).

## Worker half — deploy

```bash
cd uno-bot
npx wrangler login                          # if not already authenticated
npx wrangler secret put FIGMA_ACCESS_TOKEN  # NEW secret — paste a Figma token with
                                            # read access to the design files; enables
                                            # the Slack proposal screenshot preview
npx wrangler deploy
# verify: curl https://<worker-url>/health  -> "ok"
```

Notes:
- Only `FIGMA_ACCESS_TOKEN` is new; the other secrets already exist on the live Worker.
- `wrangler deploy` ships ALL of `uno-bot/src` on the current branch, not just
  `implement_design`. Confirm the branch's Worker code is production-ready first.
- The Worker fetches skills from `SKILLS_BASE_URL` (raw `feat/uno-bot-v2-sandbox/bot-skills`)
  per isolate; a fresh deploy picks up the latest pushed skills.

## Action half — get the workflow onto `main`

The codegen Action needs exactly **4 files** on `main`. Everything else it reads is
already on `main` (`scripts/create-notion-prd.js`, `docs/.../inventory.md`,
`docs/.../layout-cheat-sheet.md`, `design-system/src/tokens/*`, `playground/home-redesign/*`).

Bring these 4 over:
- `.github/workflows/figma-implement-design.yml`
- `scripts/implement-design-from-figma.js`
- `bot-skills/lib/skill-loader.js`
- `bot-skills/uno-implement-design/SKILL.md`

Two strategies:
- **Full v2 merge** — merge `feat/uno-bot-v2-sandbox` → `main` (brings all of v2). The
  4 files ride along. Use when launching the whole v2 at once.
- **Targeted PR (decoupled)** — a small PR bringing just those 4 files to `main`.
  Unblocks `implement_design` without the grand v2 merge. Additive and safe: the
  existing `implement` flow uses inline prompts and is untouched; `bot-skills/` simply
  begins to exist on `main` (only `lib/` + `uno-implement-design/`).

## Smoke test before trusting it

- **Manual (no Slack):** GitHub Actions → "Implement Design (Prototype)" → Run workflow
  (from `main` once the files are there) → `figma_url` = a single **screen frame**
  (renders < 8000px so the screenshot survives), `slug` = `test-prototype`. Expect a
  draft PR with `playground/test-prototype/` + a root `dev:test-prototype` script;
  then `npm install && npm run dev:test-prototype` boots it.
- **Full Slack:** paste a Figma **screen-frame** URL + a Notion PRD link, e.g.
  "implement this design as 'checkout-flow'". Proposal shows the screenshot → confirm
  → draft PR opens → link posts back to the thread with a ✅.

## Gotchas

- **repository_dispatch + default branch:** the workflow MUST be on `main`, or confirms
  silently no-op. (`workflow_dispatch` also requires it on `main` to even be listed.)
- **Oversized frames:** whole-board nodes blow past Figma's render limit and Anthropic's
  8000px image cap; the script falls back (smaller scale, then design-properties only).
  For visual parity, point at a single screen frame, not a whole page/board.
- **Notion PRD access:** the PRD page must be shared with the Notion integration;
  otherwise the script proceeds without PRD context (graceful, lower fidelity).
- **Cost:** each run is one large multimodal Claude call (~$0.30–0.80).
- **Slug collisions:** the script refuses to overwrite an existing `playground/{slug}/`
  (the Action fails and Slack gets ❌). Pick a fresh slug.
```
