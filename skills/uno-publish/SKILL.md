---
name: uno-publish
description: >
  Puts finished-enough design work in front of people, on one of two rails that
  never re-merge: share for feedback (async bundle — Loom + live preview +
  Decisions DB + Figma replica — or a sync user study) or hand off to
  development (componentize, Handoff Spec, rails propagation, DS/UNO/a11y
  review, dev + PM + stakeholder sign-off, marketplace entry). Use when the
  user says "share this for feedback", "post a share-out", "set up a feedback
  session", "hand this off to dev", "publish", "submit to market", or
  "register this prototype".
argument-hint: "[prototype-or-project]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, mcp__notion-plus__*
embodiment: ide
summary: The method — rails, gates, contracts — is references/method.md
---

# Publish

The method — rails, gates, contracts — is `references/method.md`. **Load it
first**; this file routes. **One decision up front: feedback or handoff?** The
rails never re-merge, and "post this in Slack" gets clarified before any
machinery runs (share-out → bundle rules; plain message → uno-bot conversation,
not this skill). The decision selects ONE rail doc — load it, run it.

## Agents it summons

`writers/figma` (replica frames, spec promotion, handoff canvas annotations) ·
`writers/notion` (Decisions DB, Handoff Spec, marketplace prose) — defined in
`agents/` (see `agents/README.md`); summoned by this skill, never by users. The
review gate is **not** summoned here: hand the package to `skills/uno-review`,
which dispatches its own lenses.

## Auto-suggest, never auto-run

Suggest this skill after `uno-review` passes a prototype. Every outward side
effect — Slack post, Notion write, rails propagation, marketplace entry — needs
the designer's explicit go-ahead first; show what will be written and wait.

## Load table

| Moment | Load |
|---|---|
| always | `references/method.md` |
| rail decision = feedback | `references/rails/feedback.md` |
| rail decision = handoff | `references/rails/handoff.md` |
| registering a prototype (handoff step 6, or standalone "register this prototype") | `references/marketplace.md` |
| helping deploy a preview | `references/deployment-guide.md` |
| building the marketplace entry | `references/notion-marketplace-db.md` (+ `references/marketplace-schema.md` / examples if dual-writing a routing registry) |
| composing the share-out or checking sign-offs | `docs/connectors/slack.md` |

Summoned writers load their own conventions (`notion.md`,
`figma-workspace.md`) — don't restate those here.

## Quality bar

`docs/evals/rubrics/uno-publish.md`, applied by `reviewers/rubric-applier` via
`skills/uno-maintain` audits; golden scenarios:
`docs/evals/scenarios/uno-publish.md`. Headlines: bundle completeness 100% (the
gate held), ≥70% first-pass DS/UNO/a11y, ≤2 dev clarification requests per
handoff, each shipped handoff names a user-behavior hypothesis checked ~30 days
post-ship.

## Constraints

- Rails never re-merge; re-entry means choosing again from the top.
- A partial bundle never posts from this flow (uno-bot's feedback rail
  stages-and-flags instead, 2026-07-16); a schema-invalid entry never lands;
  no sign-off, no publish.
- Rails writes only inside a live, designer-confirmed handoff — otherwise
  `skills/uno-maintain`.
- Publish doesn't judge (that's `uno-review`), doesn't act on feedback
  (re-enters prototyping), doesn't write study guides or synthesize
  transcripts.
- Never auto-deploy; never post, write, or propagate without explicit
  confirmation.

## Next steps

Feedback in hand → `skills/uno-prototype` to iterate. Handoff shipped → Design
QA fires via `skills/uno-review` at Ready-for-QA. Anything non-trivial learned
→ `skills/uno-maintain` knowledge capture.
