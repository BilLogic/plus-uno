# Home Organism Structure

Local organisms for the tutor Home experience. Source of truth:
[Figma · Components (Local organisms)](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=134-175383) (`134:175383`).

## Directory layout

```
design-system/src/specs/Home/
├── Overview.mdx
├── STRUCTURE.md
├── index.js
├── Elements/
│   ├── CardBadges/
│   ├── CertifiedTutorBadge/   # Figma: Badges
│   ├── ButtonContainer/
│   ├── ProductAreaDropdown/
│   └── ResourceType/
├── Cards/
│   ├── DataVisualization/
│   ├── MetricsCard/           # Sessions (p1–3) + Lessons
│   ├── RecommendedLessons/
│   ├── ResourceCard/
│   ├── TrainingProgressCard/  # Figma: Overview Card / Training Progress
│   └── BadgeCard/             # used inside Training Progress compositions
├── Tables/                    # empty in Figma
├── Modals/
│   ├── UserFeedbackModal/     # problem | question | feedback
│   └── UpdateNotification/    # Meet your AI Coach
├── Sections/
│   ├── HomepageJumbotron/     # sign-up | session | reflection
│   └── StudentsOverviewSection/
└── Pages/
    ├── TutorHomePageSkillsOverview/
    ├── TutorHomePageSkillsProgress/
    └── TutorHomePageSkillsOverviewDifferentLayout/
```

## Figma mapping

| Figma | Storybook |
| --- | --- |
| Elements · Resource Type | `Elements/ResourceType` |
| Elements · Product Area Dropdown | `Elements/ProductAreaDropdown` |
| Elements · _Card Badges | `Elements/CardBadges` |
| Elements · Button Container | `Elements/ButtonContainer` |
| Elements · Badges | `Elements/CertifiedTutorBadge` (title: Badges) |
| Cards · Resource Card | `Cards/ResourceCard` |
| Cards · Metrics Card / Sessions | `Cards/MetricsCard` (pages 1–3) |
| Cards · Metrics Card / Lessons | `Cards/MetricsCard` Lessons story |
| Cards · Data Visualization | `Cards/DataVisualization` |
| Cards · Recommended Lessons | `Cards/RecommendedLessons` |
| Cards · Overview Card / Training Progress | `Cards/TrainingProgressCard` |
| Modals · User Feedback Modal | `Modals/UserFeedbackModal` |
| Modals · Update Notification | `Modals/UpdateNotification` |
| Sections · Homepage Jumbotron | `Sections/HomepageJumbotron` |
| Sections · Students Overview (Bottom Section) | `Sections/StudentsOverviewSection` |
| Pages · Skills (Home Page) | `Pages/TutorHomePageSkillsOverview` (+ Progress / Different Layout variants) |

## Removed / archived vs Figma

- `LookForHelpModal`, `ReportProblemModal`, `ShareIdeasModal` — folded into `UserFeedbackModal` types
- `BottomDiv` — duplicate of Students Overview
- `SkillsSection`, `LearningSection` — legacy placeholders not on the Home canvas
