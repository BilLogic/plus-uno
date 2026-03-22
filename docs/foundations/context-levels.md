# Context Levels

The PLUS design system uses a 4-level atomic hierarchy for building page compositions. Every UI piece fits into exactly one level.

## Hierarchy

```
Element → Card / Table → Section / Modal → Page
```

| Level | What It Is | Examples | Location |
|-------|-----------|----------|----------|
| **Element** | Smallest reusable unit | Button, Badge, Icon, Avatar, Tag | `design-system/src/components/` |
| **Card / Table** | Composed elements with data | StatCard, StudentCard, TutorRow, DataTable | `design-system/src/specs/*/Cards/`, `*/Tables/` |
| **Section / Modal** | Groups of cards/tables forming a page region | FilterSection, AttendanceModal, ReflectionPanel | `design-system/src/specs/*/Sections/`, `*/Modals/` |
| **Page** | Full page composition combining sections | HomePage, TutorPerformancePage, SessionsPage | `design-system/src/specs/*/Pages/` |

## Spec Directory Structure

Each product area follows this hierarchy:

```
design-system/src/specs/
├── Home/
│   ├── Elements/
│   ├── Cards/
│   ├── Sections/
│   ├── Modals/
│   ├── Tables/
│   ├── Pages/
│   └── STRUCTURE.md
├── Admin/
│   ├── Tutor Admin/
│   ├── Student Admin/
│   ├── Session Admin/
│   └── Group Admin/
├── Toolkit/
│   ├── In-Session/
│   ├── Pre-Session/
│   └── Post-Session/
├── Training/
├── Profile/
├── Login/
└── Universal/
    ├── Sidebar
    ├── TopBar
    ├── Footer
    └── PageLayout
```

## Storybook Alignment

Story `title` fields mirror this hierarchy:
```
Specs/Home/Cards/StatCard
Specs/Admin/Tutor Admin/Pages/TutorPerformancePage
Specs/Toolkit/Pre-Session/Tables/FillInTable
Specs/Universal/Pages/PageLayout
```

## Rules

1. **Always start from the top** — check if a Page spec exists before building from scratch.
2. **Compose upward** — build Elements first, then Cards, then Sections, then Pages.
3. **Never skip levels** — a Page should not directly contain Elements; use Cards/Sections as intermediaries.
4. **STRUCTURE.md** — each spec area should have a STRUCTURE.md mapping the hierarchy and listing which components exist at each level.
