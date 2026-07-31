---
status: complete
priority: p1
issue_id: "078"
tags: [code-review, post-session, figma, prototype]
dependencies: []
---

# Hide AI Prompted card on LLM failure/timeout

## Problem Statement

Figma behavior annotation on Dynamic AI Prompted Question Box: target &lt;2s; on failure/timeout **hide the card entirely** (no generic fallback). Forms only model `idle | generating | ready | empty` and always resolve to ready/empty — never unmount on fail.

## Findings

- Figma `10779:8455` / `10661:8711` `data-behavior-annotations`: hide on failure/timeout
- `StudentReflectionFormV2.jsx` / `SessionReflectionFormV2.jsx` / `SelfReflectionForm.jsx`: timer → `ready` or `empty` via `forceAiEmpty`
- MDX docs mention hide-on-failure but forms lack a `failed`/hidden state
- Empty ≠ failure (Empty is intentional “no more questions”)

## Proposed Solutions

### Option 1: Add `failed` → render null (recommended)

**Approach:** Extend AI state with `failed`. Prototype: `forceAiFail` / timeout path after N ms with no payload. When `failed`, render nothing (hide card). Story + ReflectionFlow Controls to demo.

**Effort:** Medium

**Risk:** Low

### Option 2: Treat timeout as empty

**Approach:** Map fail → `empty` message.

**Pros:** Less state

**Cons:** Violates annotation (“no generic fallback” / hide entirely)

**Effort:** Small

**Risk:** High (wrong UX)

## Recommended Action

## Acceptance Criteria

- [ ] Failure/timeout path unmounts AI card (no skeleton, no empty copy)
- [ ] Empty state still available for null-question success
- [ ] Story or Control demonstrates hide-on-fail
- [ ] Docs match Figma annotation

## Work Log

- 2026-07-31: Flagged in `/ce:review` Figma fidelity agent
- 2026-07-31: **Known Pattern** — todo `054-complete-p2-ai-card-contract-and-wiring` shipped Empty for null-question success. Figma still says hide on **failure/timeout** (≠ Empty). Resolve with product before flipping Empty → hide; keep both states distinct.

## Resources

- Figma node `10779:8455`
- Notion AI Reflection Question spec (referenced in annotation)
- Related: `todos/054-complete-p2-ai-card-contract-and-wiring.md`
- `docs/conventions/figma-workspace.md`
