<!-- Runtime-neutral core — loaded by both faces (SKILL.md in the IDE, bot.md on the Worker).
     WHAT must happen and which gates hold; WHO executes each step lives in the faces. -->

# uno-publish — method

Take finished-enough work out of the designer's workspace and put it in front of people. One upfront decision determines everything downstream — audience, artifacts, rigor, end state.

## The rail decision

Ask once: **publishing for feedback** (share to learn — exits with feedback to act on) or **for handoff** (finalize for development — exits with a dev-ready package)?

- **The rails never re-merge.** Work that got feedback and later needs handoff re-enters here and chooses handoff fresh.
- **Clarify before machinery runs.** "Post this in Slack" is ambiguous: a feedback share-out follows the bundle contract below; a plain message is an ordinary uno-bot conversation and touches none of this.
- **Effort matches intent.** No dev-grade spec for a feedback round; no lightweight preview for a handoff.

## Feedback rail — exit: designer has feedback to act on

### Async — the bundle contract

The unit of async sharing is a complete bundle, never a lone link:

| Piece | Gives reviewers | Required |
|---|---|---|
| Loom walkthrough | behavior + rationale, narrated | always |
| Live preview (Netlify) | hands-on use | always |
| Decision log (Notion Decisions DB) | the whys, so rounds compound | always |
| Figma replica | a surface to mark up | when the artifact is a prototype (interactive or coded); static/low-fi shares may omit |

Before posting, the replica gets a visual diff against the coded prototype — drift there defeats its feedback purpose (rubric dimension: replica-fidelity). **Completeness is loudly audited, not silently waived.** Producing every piece stays the default expectation, and the only always-legitimate omission is the replica on a non-prototype artifact. In the IDE publish flow a partial bundle still never posts; on uno-bot's quick feedback rail (revised 2026-07-16) the post stages immediately and the confirmation card lists every missing piece — an explicit ✅ on that card is informed consent to post partial. The replica is a feedback surface, not a source of truth: the coded prototype stays the real artifact. Don't confuse it with the handoff rail's componentized Figma spec, which *is* contractual.

### Sync — logistics only

A live study (Zoom, recorded and transcribed) composes three skills; this one owns the narrowest slice:

- study guide → `skills/uno-research` (instrument-first: guide exists before any conversation)
- session logistics → **this skill**: scheduling, participants confirmed, recording + transcription wired
- transcript synthesis → `skills/uno-synthesize`

Publish never writes its own study guide and never analyzes the session.

### Share-out

Draft a directed feedback prompt — specific, stage-appropriate questions, never "thoughts?". Post shape, question cap (≤3 plus a NOT-looking-for line), and channel: `docs/conventions/slack.md`. Distribution is uno-bot's job.

### Close the round

Async rounds get synthesis too: consolidate the Slack thread + replica markup into **Decisions DB** rows (Roadmap Card + Evidence) before the round counts as done. Acting on the feedback is not this skill — it re-enters prototyping.

## Handoff rail — exit: dev-ready package

Linear and gated; the order is load-bearing.

1. **Componentize & spec.** Decompose the prototype into components with explicit tokens, states, and behaviors — design-system vocabulary becomes contractual here.
2. **Handoff Spec (Notion).** Instantiate from the team template: Figma shows what it looks like; the spec holds how it behaves and what "done" means. Optional: a longer recorded walkthrough for the dev team (distinct from the feedback rail's short Loom).
3. **Rails propagation.** Update both sources of truth — `uno-storybook` (design system) and `uno-blueprint` (product) — **before** review and publish, so the next project grounds on what this one shipped. Gate rules (§6 Q9, 2026-07-07):
   - The **storybook half** is a direct in-repo write by this skill, pre-authorized only inside an active, designer-confirmed handoff — the rail decision is the authorization.
   - The **blueprint half always routes through `skills/uno-maintain`** (this skill holds no blueprint write access), citing the confirmed handoff as pre-authorization — maintain's handoff-pre-authorized path applies (its method §6). Paired-write rules: `docs/conventions/supabase.md`.
   - Every propagation gets an apply-log row.
   - Rails writes with **no** live handoff are ordinary maintain intakes — full human gate, no pre-authorization.
4. **Review gate — DS / UNO / a11y.** Run through `skills/uno-review`: design-system compliance, harness consistency (the spec agrees with what step 3 just wrote), accessibility. Review diagnoses; fixes go back through prototyping — they don't happen here.
5. **Sign-off — the human gate.** The developer, the PM, and the stakeholder each ✅ in the handoff thread (reviewer-verdict convention: `docs/conventions/slack.md`). **No sign-off, no publish.** Two of three is not enough, and nobody proxies a missing one.
6. **Marketplace entry.** First verify step 3 **landed** — storybook committed, blueprint update applied (or its maintain intake shows applied in the apply log); propagation in flight blocks registration. Then register the finished package in the notion-marketplace DB (live; schema + publish procedure: `skills/uno-publish/references/notion-marketplace-db.md`, conventions: `docs/conventions/notion.md`). The entry is schema-validated before it lands — all required fields present, enums exact-match. Registration runs in-IDE via `writers/notion`; the Worker only searches the catalog.

## Boundaries

- Publish doesn't judge quality — `uno-review` gates before entry (Flow 2 exit) and at step 4.
- Publish doesn't act on collected feedback — that re-enters prototyping.
- Publish doesn't gather or conclude research — guides are `uno-research`, synthesis is `uno-synthesize`.
