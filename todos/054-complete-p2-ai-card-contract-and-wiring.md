---
status: completed
priority: p2
issue_id: "054"
tags: [notion, figma-annotation, post-session, ai]
dependencies: ["050", "052", "046"]
---

# AI card contract: fire rules, Empty, privacy warning, Student wiring

## Problem Statement

Notion AI Spec + Form Design define when cards fire, Loading/Empty copy, privacy danger line, and that answers are optional. Prototype AI is rating-only on Session, idle-gated stubs on Student, missing Empty usage in flow, missing privacy warning. Figma Default annotation still says “hide on failure”; Notion (newer hub changelog) says Empty for failure/timeout/`question: null` — **prefer Notion Empty**.

## Findings

- Fire: Student when 3 chip questions complete; Session when rating + gated selection complete; Self same. Escalation never in input.
- Loading: skeleton + “Preparing your question…” (implemented in component).
- Empty copy implemented in component but rarely shown in flow.
- Privacy: “Please do not include students' names in your response.” as danger warning under answer — missing on AI box.
- Session AI currently fires on rating alone (before gated chips).
- Student form shows AI on prop only; no auto-fire from chip completion.
- Related: todo 046 persist AI answers.

## Proposed Solutions

### Option 1: Align fire/empty/privacy in forms; mock LLM returns null for Empty demo (recommended)

**Effort:** Medium
**Risk:** Low (prototype)

## Acceptance Criteria

- [x] Fire conditions match AI Spec per section
- [x] Empty shown for timeout/null/failure (not hide, not error toast)
- [x] Danger privacy line under answer field
- [x] Placeholder “Type your answer here…”; E.g. helper from model
- [x] Student AI after chips, before escalation
- [x] AI never blocks Next/Submit

## Resources

- Notion AI Spec; Form Design “AI cards — the shared contract”
- Figma Dynamic AI box `10779:8455` (prefer Empty over hide)
