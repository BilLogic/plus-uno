---
date: 2026-03-17
topic: toolkit-ia-revision
focus: Break up Sessions page into multiple sidebar tabs with nested sub-items
---

# Ideation: Toolkit Information Architecture Revision

## Codebase Context

- **Stack**: React 19, React Router DOM 7, React Bootstrap 5.3, Vite, SASS, TypeScript
- **Design system**: `/design-system/` with MD3 color tokens, Lato/Merriweather Sans typography, semantic spacing
- **Current sidebar (tutor)**: Home > Training (Lessons, Onboarding) > Toolkit (Sessions, Reviews)
- **Sessions page**: Monolithic "Your Students" table with status badges, attendance/engagement dropdowns, "See Details" modal, FAB with reflection bar
- **Architecture**: ShellLayout/ShellContext drives breadcrumbs + active tab; pathToTab/onTabClick maps are manual wiring; sidebar is hardcoded categories array
- **Toolkit specs**: Already organized into `pre-session/`, `in-session/`, `post-session/` directories
- **Available DS components**: Accordion, NavTabs, NavPills, Sidebar, SidebarTab, PageLayout, TopBar

## Consolidated Direction (User + AI)

### Final IA Structure

```
Toolkit
├── Sessions          ← main list of all sessions
│   ├── Oct 15 3PM    ← spawned sub-tab (dismissible, auto-clears on browser session end)
│   └── Oct 16 1PM    ← another open session
├── Students          ← main roster across all sessions
│   └── Kiera M.      ← spawned student detail (dismissible)
└── Reflections       ← reflection history/archive
    └── Oct 15 Refl.  ← specific reflection (dismissible)
```

### Key Decisions

1. **Sub-tabs auto-clear** when browser session ends; do not persist
2. **No cross-linking** between categories — opening a student from within a session sub-tab is not supported; if edge cases arise, provide an explicit redirect indicator
3. **Max depth = 2** — category > specific item only; for inner-page nesting, use breadcrumbs
4. **Real URLs** — sub-tabs get real routes (e.g., `/sessions/:id`, `/students/:id`, `/reflections/:id`)
5. **Overflow handling** — when too many sub-tabs are open, show a `...` overflow indicator that on-click displays the full tab list

### Complementary Ideas (from ideation)

- **Docked Student Panel** — within a session sub-tab, student details render as a docked side panel, not a blocking modal
- **Embedded Reflection with Auto-Draft** — session sub-tab transitions in-place to reflection when session ends; auto-populates from attendance/engagement data
- **Declarative Route Manifest** — single source of truth for route → sidebar → breadcrumb mapping (replaces 3 parallel maps)
- **Multi-Tier Reflection** — inline micro-notes during session, guided chat for deep reflection, archive for history

## Ranked Ideas

### 1. Sidebar Tree Navigation with Dynamic Sub-Items
**Description:** Restructure the Toolkit sidebar section into three accordion-style categories (Sessions, Students, Reflections) that support spawning dismissible sub-items when a tutor opens a specific session, student, or reflection. Sub-items are session-scoped (auto-clear on browser close), get real URLs, and cap at 2 levels of depth.
**Rationale:** Follows PRD direction while solving the "temporary tabs" problem elegantly via familiar file-tree/IDE pattern. Keeps navigation in one place (sidebar), communicates hierarchy naturally.
**Downsides:** Requires extending the Sidebar component to support dynamic children. Overflow handling needed for many open items.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored

### 2. Docked Student Context Panel (Replace Modal)
**Description:** Convert StudentInsightsModal from full-screen overlay to a dockable side panel that coexists with the student table within a session sub-tab.
**Rationale:** Directly addresses PRD user story about referencing student data without losing context.
**Downsides:** Reduces table width when open.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 3. Embedded Reflection Flow with Auto-Draft
**Description:** When session ends, session sub-tab transitions in-place to reflection; forms auto-populated from captured session data.
**Rationale:** Eliminates context-switch dropout risk. Reuses existing SideNavBar reflection pattern.
**Downsides:** Blurs session/reflection boundary. Requires session-end trigger.
**Confidence:** 75%
**Complexity:** Medium-High
**Status:** Unexplored

### 4. Declarative Route Manifest
**Description:** Replace pathToTab, pathToUserType, sidebarConfig.onTabClick with single manifest. Dynamic sub-items register/unregister at runtime.
**Rationale:** Highest-leverage infrastructure change; makes all future IA changes trivial.
**Downsides:** No direct user-facing impact. Cross-cutting refactor.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 5. Multi-Tier Reflection System
**Description:** Three tiers: inline micro-notes per student row, guided ReflectionAssistantChat, searchable reflection archive under Reflections tab.
**Rationale:** Matches different time pressures tutors face. Micro-notes feed into guided reflection.
**Downsides:** Largest scope. Requires persistence layer for micro-notes.
**Confidence:** 70%
**Complexity:** High
**Status:** Unexplored

### 6. Master-Detail Layout for Session List
**Description:** Session list + detail as a split-pane within the Sessions main tab, before a session is "opened" as a sub-tab.
**Rationale:** Lets tutors preview sessions without committing to opening a full sub-tab.
**Downsides:** Space constraints on smaller screens.
**Confidence:** 70%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | In-page NavPills instead of sidebar tabs | User explicitly prefers sidebar-level visibility for Students/Reflections |
| 2 | Phase-aware sidebar morphing by time | Over-engineered; requires backend scheduling integration |
| 3 | Persistent session dock (chat-app style) | New UI paradigm not in DS; high burden |
| 4 | Context-carrying breadcrumbs as primary nav | Too hidden for primary navigation |
| 5 | Student-centric IA (students as primary object) | Contradicts PRD's sessions-first directive |
| 6 | Unified activity feed/timeline | Loses focused student/reflection work capability |
| 7 | Auto-capture attendance from signals | Backend integration out of frontend scope |
| 8 | Offcanvas drawer for session detail | Weaker version of master-detail |
| 9 | Kill sidebar during active sessions | Not standalone; companion idea only |
| 10 | Spec-to-route codegen | Tooling-level, separate initiative |
| 11 | ShellContext decomposition | Good engineering but not IA-relevant |
| 12 | Supervisor shadow/overlay view | Out of scope for tutor-facing IA |
| 13 | Parallel reflection threads | Edge case complexity for uncertain frequency |

## Session Log
- 2026-03-17: Initial ideation — 48 candidates generated across 6 frames, deduplicated to 25, 6 survived. User provided clear direction: 3 sidebar tabs (Sessions, Students, Reflections) with dynamic nested sub-items. Consolidated into final direction.
