---
name: uno-publish
description: >
  Puts finished-enough design work in front of people, on one of two rails that
  never re-merge: share for feedback (async bundle — Loom + live preview +
  decision log + Figma replica — or a sync user study) or hand off to
  development (componentize, Handoff Spec, rails propagation, DS/UNO/a11y
  review, dev + PM + stakeholder sign-off, marketplace entry). Use when the
  user says "share this for feedback", "post a share-out", "set up a feedback
  session", "hand this off to dev", "publish", "submit to market", or
  "register this prototype".
user-invocable: true
argument-hint: [prototype-or-project]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, mcp__notion-plus__*
---

# Publish

The method — rails, gates, contracts — is `references/method.md`. **Load it first**; this file adds only IDE execution. One decision up front: publishing for **feedback** or for **handoff**? The rails never re-merge, and "post this in Slack" gets clarified before any machinery runs (share-out → bundle rules; plain message → uno-bot conversation, not this skill).

## Agents it summons

`writers/figma` (replica frames, spec promotion, handoff canvas annotations) · `writers/notion` (Decision Log, Handoff Spec, marketplace prose) — defined in `agents/` (see `agents/README.md`); summoned by this skill, never by users. The review gate is **not** summoned here: hand the package to `skills/uno-review`, which dispatches its own lenses.

## Auto-suggest, never auto-run

Suggest this skill after `uno-review` passes a prototype. Every outward side effect — Slack post, Notion write, rails propagation, marketplace entry — needs the designer's explicit go-ahead first; show what will be written and wait.

## Feedback rail — execution

1. **Assemble the bundle** (method.md § bundle contract):
   - Loom — the designer records; you supply a beat list of what to narrate.
   - Live preview — if none exists, help deploy per `references/deployment-guide.md` (never auto-deploy).
   - Decision log — summon `writers/notion` to create/append the project's Decision Log.
   - Figma replica (prototypes only) — summon `writers/figma` to build `[replica]`-prefixed frames from the coded prototype.
2. **Gate check.** Any required piece missing → produce it before going further. A partial bundle never posts.
3. **Compose the share-out** per `docs/conventions/slack.md`: ≤3 stage-specific feedback questions + a NOT-looking-for line, all bundle links.
4. **Distribute.** Posting and reviewer-tagging is uno-bot's job — hand it the composed post; if the bot is unavailable, give the designer the exact text to paste in the right channel.
5. **Close the round.** Consolidate thread + replica markup into Decision Log entries (via `writers/notion`) before calling the round done. Acting on feedback → back to `skills/uno-prototype`.

**Sync session instead?** Logistics only: schedule, confirm participants, wire recording + transcription. Study guide comes from `skills/uno-research`; transcript synthesis from `skills/uno-synthesize`. Never write the guide or analyze the session yourself.

## Handoff rail — execution

1. **Componentize & spec** — decompose into DS components with explicit tokens, states, behaviors; summon `writers/figma` for spec promotion and Dev-Mode annotations.
2. **Handoff Spec** — summon `writers/notion` to instantiate the team's Handoff Spec template on the project hub (template pointers: `docs/conventions/notion.md`).
3. **Rails propagation** — inside the designer-confirmed handoff only, apply-logged:
   - `uno-storybook`: update stories/MDX in `design-system/` directly (in-repo write; validate in Storybook).
   - `uno-blueprint`: this skill holds no blueprint write access (`docs/conventions/supabase.md`) — route the paired PRD + blueprint update through `skills/uno-maintain`, citing the confirmed handoff as pre-authorization.
4. **Review gate** — hand to `skills/uno-review` for DS / UNO / a11y. Findings route back to prototyping; re-review after fixes.
5. **Human gate** — dev + PM + stakeholder ✅ sign-offs in the handoff thread (uno-bot collects). Verify all three exist before proceeding. **No sign-off, no publish.**
6. **Marketplace entry** — see below.

## Marketplace registration

Today's destination is the repo catalog (`src/pages/PrototypeMarket/prototypes-data.js`); the notion-marketplace DB is the official target once stood up — its schema + publish procedure are specced in `references/notion-marketplace-db.md`. Flag that the DB isn't live yet on every handoff publish rather than inventing a destination; once built, publish dual-writes both surfaces per that spec.

1. Build the entry: field-by-field contract in `references/marketplace-schema.md`, worked entries in `examples/marketplace-entry-example.md`. Auto-fill `id` (next number), `lastUpdated` (today), `upvotes: 0`; ask for the rest. Entry prose (title, description) goes through `writers/notion` voice rules only when it also lands in Notion — repo-catalog prose just follows `docs/conventions/writing-style.md`.
2. **Validate before writing**: required fields present, `stage`/`productPillar` exact enum matches, `repoPath` ends with `/`. A schema-invalid entry never lands.
3. Show the entry + target file, wait for confirmation, append, then verify `/market` renders the card (filters, modal, Loom embed, preview image — `npm run generate:previews` if missing).

## Tier-2 loads

| When | Load |
|---|---|
| always | `references/method.md` |
| helping deploy a preview | `references/deployment-guide.md` |
| building the marketplace entry | `references/marketplace-schema.md` + `examples/marketplace-entry-example.md` (+ `references/notion-marketplace-db.md` once the DB is live) |
| composing the share-out or checking sign-offs | `docs/conventions/slack.md` |
| any human-facing text | `docs/conventions/writing-style.md` |

Summoned writers load their own conventions (`notion.md`, `figma-workspace.md`) — don't restate those here.

## Quality bar

`docs/evals/rubrics/uno-publish.md`, applied by `reviewers/rubric-applier` via `skills/uno-maintain` audits; golden scenarios: `docs/evals/scenarios/uno-publish.md`. Headlines: bundle completeness 100% (the gate held), ≥70% first-pass DS/UNO/a11y, ≤2 dev clarification requests per handoff, each shipped handoff names a user-behavior hypothesis checked ~30 days post-ship.

## Constraints

- Rails never re-merge; re-entry means choosing again from the top.
- A partial bundle never posts; a schema-invalid entry never lands; no sign-off, no publish.
- Rails writes only inside a live, designer-confirmed handoff — otherwise `skills/uno-maintain`.
- Publish doesn't judge (that's `uno-review`), doesn't act on feedback (re-enters prototyping), doesn't write study guides or synthesize transcripts.
- Never auto-deploy; never post, write, or propagate without explicit confirmation.

## Next steps

Feedback in hand → `skills/uno-prototype` to iterate. Handoff shipped → Design QA fires via `skills/uno-review` at Ready-for-QA. Anything non-trivial learned → `skills/uno-maintain` knowledge capture.
