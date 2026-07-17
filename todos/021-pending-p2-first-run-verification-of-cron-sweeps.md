---
status: pending
priority: p2
issue_id: 021
tags: [code-review, automations, ops]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (loop-engineering change set — all reviewers; registry 🟡 rows)
---

# First-run verification of the three cron sweeps (🟡 → ✅)

## Problem
`harness-integrity-sweep.yml`, `weekly-tier1-digest.yml`, and `shipped-watchdog.yml` are built but unverified (registry rows say 🟡). Known first-run risks: (a) the tool **allowlists** are new — a denied-but-needed command shape (e.g. a curl the model phrases differently) stalls the run; (b) Claude-on-Vertex via the CLI needs the Claude models enabled in `hcii-plus` Model Garden + `aiplatform.user` on the SA, and `CLOUD_ML_REGION=global` may 404 for some models (fallback: regional host, per the Worker's rule); (c) crons only fire from `main`, so nothing runs until merged; (d) the watchdog's Notion query needs the Roadmap DB shared with the integration.

## Proposed solution
After merge: `gh workflow run <file>` each workflow once; watch `gh run view` for allowlist denials and Vertex errors; tune allowlist command shapes or region as needed; confirm the digest sentinel step and the label-ensure steps behave; then flip the three registry rows to ✅ live.

## Acceptance
- [ ] Each of the three workflows has one green dispatch run (digest may legitimately end `NO_TIER1_THIS_WEEK`)
- [ ] Integrity sweep filed at least the known finding (storybook-component-docs link rot, todo 023) as a `harness-intake` issue
- [ ] Registry rows flipped 🟡 → ✅ with the verification date
