# Tutor Risk & Interventions Page

High-fidelity prototype for the "Tutor Risk & Interventions" page under the Tutor Admin section.

## Wireframe Reference

Based on the hand-drawn wireframe with the following structure:

```
┌─────────────────────────────────────────────────────────┐
│  XXXX (Tabs - 4 navigation tabs)                        │
├────────────────────┬────────────────────────────────────┤
│  📊 Stat Card      │  📊 Stat Card                      │
│  (Tutors At Risk)  │  (Active Interventions)            │
├────────────────────┴────────────────────────────────────┤
│  📈 Line Chart          │  📊 Bar Chart                 │
│  Risk & Intervention    │  Interventions by Type        │
│  Trends                 │                               │
├─────────────────────────┴───────────────────────────────┤
│  XXX Title      [Group ▼] [Risk Level ▼] [Date Range ▼] │
├─────────────────────────────────────────────────────────┤
│  Table (20 rows)                                        │
│  ─────────────────────────────────────────────────────  │
│  Name | Group | Risk Level | Score | Type | Date | Status│
│  Row 1                                                  │
│  Row 2                                                  │
│  ...                                                    │
│  Row 20                                                 │
│  ─────────────────────────────────────────────────────  │
│  Showing 1 to 10 of 20 entries        [< 1 2 >]         │
└─────────────────────────────────────────────────────────┘
```

## Features

### Tab Navigation
- Tutor Performance
- Status And Warnings
- **Risk & Interventions** (active)
- Training Progress

### Summary Statistics
- **Tutors At Risk**: Real-time count of tutors flagged as at-risk
- **Active Interventions**: Count of ongoing intervention activities

### Chart Cards
- **Risk & Intervention Trends**: Line chart tracking at-risk tutors and active interventions over time
- **Interventions by Type**: Stacked bar chart showing intervention distribution by risk level

### Filter Controls
Three dropdown filters for data refinement:
- **Group Dropdown**: Filter by school/organization group
- **Risk Level Dropdown**: Filter by High/Medium/Low risk
- **Date Range Dropdown**: Filter by time period

### Data Table (20 rows)
Columns:
- Tutor Name
- Group
- Risk Level (color-coded badge)
- Risk Score (color-coded badge)
- Intervention Type
- Intervention Date
- Status (color-coded badge)

Table features:
- Hover states for clickable rows
- Pagination support
- Responsive overflow handling

## PLUS Design System Patterns Used

### Components
- `PageLayout` - Universal page layout with sidebar and topbar
- `NavTabs` - Tab navigation component
- `TutorChartsElement` - Line and Bar chart variants
- `Dropdown` - Filter dropdown component
- `Badge` - Color-coded status badges
- `Pagination` - Table pagination
- `Table` (React-Bootstrap) - Data table

### Styling Patterns
- **Card Background**: `var(--color-surface-container-lowest, #ffffff)`
- **Card Radius**: `var(--card-radius-sm, 12px)`
- **Card Padding**: `var(--card-pad-y-lg, 24px) var(--card-pad-x-lg, 24px)`
- **Section Gap**: `var(--size-section-gap-lg, 24px)`
- **Table Styling**: Transparent backgrounds, hover states from TutorsPerformanceTable

### Reference Files
- `TutorDataCard.scss` - Card styling pattern
- `TutorsPerformanceTable.scss` - Table styling pattern
- `TutorCompliance2Page` - Overall page layout structure
- `ExportSearchFilterBar` - Filter dropdown pattern

## Storybook Stories

- **Default**: Full page with 20 rows of data
- **HighRiskFocus**: Filtered to high-risk tutors only
- **LincolnElementaryGroup**: Filtered to a specific school group
- **ImprovingScenario**: Positive trend with decreasing risk
- **CriticalSituation**: Concerning trend requiring action
- **CompletedInterventions**: Shows completed interventions
- **TabletView**: Responsive at 768px
- **LaptopView**: Responsive at 1024px
- **Page2**: Pagination demonstration

## View in Storybook

Navigate to: **Playground > Ashley > Tutor Risk & Interventions**

## Files

```
tutor-risk-interventions/
├── TutorRiskInterventionsPage.jsx      # Main React component
├── TutorRiskInterventionsPage.scss     # PLUS-compliant styles
├── TutorRiskInterventionsPage.stories.jsx  # Storybook stories
└── README.md                            # This documentation
```

## Usage

```jsx
import TutorRiskInterventionsPage from './TutorRiskInterventionsPage';

<TutorRiskInterventionsPage
    activeTab="riskInterventions"
    totalAtRisk={12}
    totalInterventions={28}
    selectedGroup="All Groups"
    selectedRiskLevel="All Risk Levels"
    selectedDateRange="Last 30 Days"
    currentPage={1}
    totalPages={2}
    totalEntries={20}
    onRowClick={(tutor) => console.log('Selected:', tutor)}
    onGroupChange={(group) => console.log('Group:', group)}
    onRiskLevelChange={(level) => console.log('Level:', level)}
    onDateRangeChange={(range) => console.log('Range:', range)}
/>
```
