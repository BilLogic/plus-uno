# Notion Conventions

<!--
status: canonical — this file IS the convention (ADR-017; the Notion 📓 Doc-Management Playbook is superseded)
distilled: 2026-07-07 from https://app.notion.com/p/396b7cca498281d1b1e7e47072166a4e
rule: on conflict with any legacy Notion playbook page, this file wins — file a uno-maintain intake to banner the page as superseded.
applied by: agents/writers/notion
-->

## Write-surface allowlist

The agent writes ONLY to these named surfaces. Adding a surface is a uno-maintain change to this list, never an inline decision.

| Surface | Who writes | Notes |
|---|---|---|
| Roadmap DB (`2fc01241-1bb5-4770-af51-d5a050bddb75`, data source `7fba5c35-da73-4c40-ac42-1c13db7794de`) | human creates; uno updates status/properties/links | the single task board; design + dev kanbans are views |
| PRD pages | uno drafts; human owns | PRD template, Stage: exploring / converging / committed |
| Research & notes DB | uno writes; human reviews | findings, study guides |
| Decision logs (per project) | uno logs at publish; human appends | thread conclusions land here before threads resolve |
| Spec pages / Handoff Specs | uno drafts from template | "Figma shows what it looks like; this page holds how it behaves and what done means" |
| notion-marketplace DB | uno publishes entries | ⚠️ DB setup pending |
| Eval Runs DB | uno writes at flow exits | ⚠️ DB setup pending — interim: `docs/evals/runs/*.jsonl` |
| DS Component PRDs DB (`342b7cca-4982-80b1-b305-f9e0e581ef48`) | UNO Bot auto-creates | Figma-sync pipeline |

## Roadmap DB rules (every card write)

- `Contributor` — mandatory, never blank. Default: Bill + everyone mentioned in the source context.
- `Product Pillar` — always tag the most relevant existing pillar(s); the pillar maps to a Slack channel (`slack.md`).
- `Feature / Initiative` + `OKR` — link the most relevant **existing** entry. If nothing fits, leave blank + flag in the body.
- **Never create select options, pillars, features, or OKRs.** ⚠️ Notion silently auto-creates select options on any name mismatch — fetch the schema and exact-match option names before every write.
- `Current Team` routes the card to kanbans; PRD accepted → move to `Design Status: Ready for Design`.
- Urgency = existing `Priority: Critical` — no separate lane. Maintenance intake = card on this DB with `Product Pillar: Universal` + `Intake Status` property.

## Project-hub golden sections (in order)

TLDR (2–4 sentences, zero-history reader) → People (@-mentions + role labels + "Start here by role" line) → Now / Next / Blocked (owners, ⛔ blockers) → Latest progress (2–3 dated bullets, rewritten not accumulated) → Key references → Pages (inline subpages: PRD · Decision Log · Handoff Spec from handoff onward · Rollout · Archive) → **Doc Changelog** at the bottom, entries inside a *Show history* toggle. The Doc Changelog records the *document's* maintenance (restructures, pages added/moved/superseded) — never project progress, never formatting polish.

- Status lives in card **properties**, never a body callout. One callout = one alert; transient chatter → comments.
- Don't restate properties in the body unless adding info (role labels). People = @-mentions; only workspace members are mentionable.
- Templates (9) live in Notion 🧩 Templates — reference them, never duplicate their bodies.

## Comments protocol

Suggestions *about* existing content (including the agent's own) go in **comments anchored to the block** — resolvable: accept → apply + resolve; reject → reply why + resolve. The agent sweeps unresolved threads on each flow run touching the page + at the monthly retro. Proposed *content* that must be readable in place = yellow highlight + `⏳ PENDING REVIEW:` text marker (yellow is invisible via API — the marker is the binding signal). **Binding information never lives only in a comment.**

## Enhanced-markdown quirks (API writes)

- Mentions: `<mention-user url="user://<user-id>"/>` — the `id=` attribute silently drops. Verify membership via the users API first.
- Embeds are manual-only via API — write a plain link + 📌 placeholder; a human converts to embed. Always pair any embed with a plain link (embeds are unreadable via API).
- Child-page blocks cannot interleave with text — group inline subpages in one contiguous run (the Pages section).
- Multi-line callout text writes back as stacked one-line fragments — keep callouts atomic.
- Databases for tracked items with a lifecycle; inline simple tables for static reference (fit-to-page-width is a manual toggle).
