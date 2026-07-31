---
status: complete
priority: p2
issue_id: "084"
tags: [code-review, post-session, figma]
dependencies: []
---

# Align AI privacy placement + SideNav Submit button style

## Problem Statement

1. Figma AI Default master has no privacy line; privacy belongs on Free Response `warning` (Form Feedback Q3). `AiPromptedQuestionBox` defaults `showPrivacyWarning=true`.
2. Figma Side Nav Submit is primary Filled when enabled; code uses `style="default"`.

## Findings

- `AiPromptedQuestionBox.jsx` default privacy on
- `SideNavBar.jsx` Submit ~178–186 `style="default" fill="filled"`
- Figma `20:24229`, `10661:8711`

## Proposed Solutions

### Option 1: Default privacy off on AI; Submit primary when canSubmit (recommended)

**Approach:** `showPrivacyWarning` default false (or omit). Form Feedback FreeResponse keeps warning. SideNav Submit `style="primary"` when enabled.

**Effort:** Small

**Risk:** Low

### Option 2: Keep privacy on AI if Notion mandates

**Approach:** Confirm with Form Design Notion; document override if both surfaces need it.

**Effort:** Small

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] AI Default matches Figma master (no extra danger B3 unless product confirms)
- [ ] Enabled SideNav Submit uses primary filled style
- [ ] Form Feedback privacy warning still present

## Work Log

- 2026-07-31: Flagged in Figma fidelity review
