---
status: pending
priority: p3
issue_id: 013
tags: [code-review, security]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Verify figma-implement.yml consumes client_payload via env:, not inline run:

## Problem
Model-supplied component/notes flow unsanitized into repository_dispatch client_payload (tools/implement.ts:39-50). If the workflow interpolates ${{ github.event.client_payload.notes }} inside a shell run: step, that's CI command injection with repo write access. Workflow YAML lives in .github/workflows/ — verify the sink.

## Proposed solution
Worker side: constrain component to the known DS set (preflight already fetches it) and length-cap notes. Workflow side: pass payload fields only through env: bindings, quoted.

## Acceptance
- [ ] Both workflows confirmed env:-only for client_payload; Worker-side caps in place.
