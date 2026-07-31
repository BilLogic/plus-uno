---
status: complete
priority: p2
issue_id: "089"
tags: [code-review, post-session, agent-native, storybook]
dependencies: []
---

# Agent-native seeds for Reflection Flow, AI, Upload, escalate stories

## Problem Statement

User-facing Post-Session actions lack equivalent Controllable/prop seeds. Agents cannot open submitted modal, force AI empty/fail, toggle escalate in Free Response Overview, or drive Upload Files story actions without a full UI walk. Agent-native P1s: Reflection Flow stories have no `args`/`argTypes` (MDX playground lies); orchestrator never forwards `aiState`/`forceAiEmpty`; Free Response Overview escalate Switch is controlled with no handler.

## Findings

- [Agent-native review](71b1d98f-49c8-4c7b-8916-ac0249951047): P1 Controllable Flow + AI seeds + dead escalate; P2 submitted seed / Upload / live-app Default / page Controls
- Component APIs mostly exist — Storybook/CSF + ReflectionFlow prop surface incomplete


## Proposed Solutions

### Option 1: Seed props + CSF Controls (recommended)

**Approach:** Add `showSubmittedOnMount`, `initialCompletedSections`, `forceAiEmpty`/`forceAiFail` story args; wire Free Response escalate Controls; bind Upload story handlers; add formState Controls to Student/Session pages like Self/Form Feedback.

**Effort:** Medium

**Risk:** Low

### Option 2: Document manual walkthrough only

**Approach:** Accept UI-only for prototype demos.

**Effort:** None

**Risk:** High for agent/automation parity

## Recommended Action

## Acceptance Criteria

- [ ] Reflection Flow story can open Save&Exit and Submitted modals via Controls/args
- [ ] AI empty/fail/ready seedable without waiting on chip timer alone
- [ ] Free Response escalate Switch works in Overview
- [ ] Upload Files story actions change visible state

## Work Log

- 2026-07-31: Flagged by agent-native-reviewer

## Resources

- PR #88; `ReflectionFlow.stories.jsx`; `UploadFiles.stories.jsx`; `FreeResponseQuestion.stories.jsx`

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
