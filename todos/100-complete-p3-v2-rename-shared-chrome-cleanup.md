---
status: complete
priority: p3
issue_id: "100"
tags: [code-review, post-session, architecture, quality]
dependencies: ["088"]
---

# V2 rename, shared Flow/pageShell chrome, dead AI flags

## Problem Statement

Nice-to-have cleanup still open after 088 marked complete: `*FormV2` names with no V1 left; Flow duplicates pageShell PageLayout + exit modals; `forceAiFail` unused; dirty baselines include AI fields so timers dirty Cancel; SideNav vestigial `state` prop; prototype invalid `reflectionId` falls back to first row.

## Findings

- [code-simplicity-reviewer](05ac69ea-eaeb-4d88-abe7-2bcc5f572639) + [architecture-strategist](4039a425-7c4f-49eb-84a7-7067759d688b) + [security-sentinel](609d51af-378e-4d15-a82e-ce0a467ec9dc) (prototype fallback P2 demoted here with cleanup)
- Todo 088 claimed V2 rename / shared shell done — reopen as this P3

## Proposed Solutions

### Option 1: Batched cleanup (recommended)

**Approach:** Rename V2 forms; extract `ReflectionChrome` + exit modals; drop `forceAiFail` / unused seeds; narrow dirty baseline; drop SideNav `state`; prototype 404 unknown reflectionId.

**Effort:** Medium–Large

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] No `V2` in form filenames/exports (or temporary re-export aliases only)
- [ ] Flow and pageShell share layout chrome
- [ ] Unknown prototype reflection routes do not silently load first record
- [ ] AI timer alone does not mark Cancel dirty

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88; supersedes incomplete 088 ACs

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
- Known patterns: STRUCTURE.md, todos/088
