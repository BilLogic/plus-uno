# Group Performance v2 - Prototype

High-fidelity prototype for Group Performance page in Group Admin section.

## Overview

Full page layout matching wireframe specifications with:
- **Sidebar**: Standard PLUS supervisor sidebar with Groups active
- **Tab Navigation**: Group Info / Training Progress / Performance / Reports
- **Action Buttons**: Email Groups, Export Data
- **Charts Section**: Two side-by-side cards
  - Group Attendance (Pie/Donut chart)
  - Session Distribution (Stacked Bar chart)
- **Details Section**: Header with "All Groups" Dropdown button filter
- **Table**: 20 rows with TutorsPerformanceTable pattern
- **Pagination**: Showing entries count and page navigation

## Based On

| Reference | Purpose |
|-----------|---------|
| Wireframe | Layout structure and spacing |
| TutorPerformancePage | Page layout pattern |
| TutorsPerformanceTable | Table styling with badges |
| PLUS Design System | All components and tokens |

## Files

| File | Description |
|------|-------------|
| `GroupPerformanceV2Page.jsx` | Main React component |
| `GroupPerformanceV2Page.scss` | Styles with PLUS tokens |
| `GroupPerformanceV2Page.stories.jsx` | Storybook stories |
| `README.md` | This file |

## Table Columns

| Column | Content | Styling |
|--------|---------|---------|
| Group Name | Name + optional Lead badge | Text with info badge |
| Signed-Up | Yes/No | Info/Secondary badge |
| % Attendance | Percentage | Color-coded badge (green ≥80%, yellow 50-79%, red <50%) |
| Sessions | Count | Secondary badge |
| Students | Count | Secondary badge |

## Usage

View in Storybook under: `Playground/Ashley/Group Performance v2`

```bash
npm run storybook
```

## Stories Available

- **Default**: Full page with 20 rows at XL breakpoint
- **Loading**: Charts in loading state
- **WithFilter**: Morning Cohorts filter selected
- **GroupInfoTab**: Different tab active
- **TabletView**: 1024px breakpoint
- **MobileView**: 768px breakpoint
- **HighAttendance**: 95% attendance
- **LowAttendance**: 45% attendance
- **Page2**: Second page of pagination

## Spacing Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--size-section-pad-y-lg` | 24px | Page vertical padding |
| `--size-section-pad-x-lg` | 24px | Page horizontal padding |
| `--size-section-gap-lg` | 24px | Section gaps |
| `--size-element-gap-md` | 16px | Element gaps |
| `--table-cell-y` | 8px | Table cell vertical padding |
| `--table-cell-x` | 10px | Table cell horizontal padding |
| `--space-300` | 16px | Chart card gap |

## Components Used

- `PageLayout` - Universal page wrapper with sidebar
- `NavTabs` - Tab navigation
- `Button` - Action buttons
- `TutorDataCard` - Chart card containers
- `TutorChartsElement` - Pie and Bar charts
- `Badge` - Status indicators
- `Dropdown` - All Groups filter button
- `Table` - React-Bootstrap table
- `Pagination` - Page navigation
