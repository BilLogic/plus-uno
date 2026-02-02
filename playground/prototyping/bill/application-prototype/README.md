# Application Prototype – Homepage Variant

Builds on the existing homepage design from **Figma APPLICATION-PROTOTYPES**, node **158-21725**.

- **Figma**: [APPLICATION-PROTOTYPES](https://www.figma.com/design/NUcRDZUzUiuVmx1ydNXpl3/APPLICATION-PROTOTYPES?node-id=158-21725)
- **Location**: `playground/prototyping/bill/application-prototype/`

## What’s in this prototype

1. **Shell** – Same as existing homepage: `PageLayout`, TopBar (breadcrumb “Home”, user “Boyuan Guo” / Lead), Sidebar (tutor).
2. **Jumbotron** – Sign-up CTA: “Sign up for your next session, Boyuan!” with “Sign up now” and “View schedule”, plus `BadgeCard` (unclaimed).
3. **Three cards (middle row)**  
   - **Tutoring Performance** – Radar chart (Your performance vs Average tutor performance) via `DataVisualizationSkillsProgress` (Skills Overview tab).  
   - **Weekly Tutoring Load** – Donut (84% scheduled of 20.0 hrs), center “16.8 hrs”, and breakdown list (Direct tutoring, Student support, Prep & planning, Training & reflection).  
   - **Student Momentum** – List of students with horizontal bar (0–10); nav arrows for pagination.
4. **Personalized Trainings** – Horizontal carousel of training cards (`RecommendedLessons`): category badge, duration, title, “Review” button.

## Run locally

From the **project root** (`plus-vibe-coding-starting-kit`):

```bash
npm run dev
# or from this directory:
cd playground/prototyping/bill/application-prototype && npm run dev
```

If the root doesn’t have a `dev` script that runs this app, run Vite from this folder:

```bash
cd playground/prototyping/bill/application-prototype
npx vite
```

Then open **http://localhost:3006** (see `vite.config.js`).

## Tech

- **React** + **Vite**
- Design system: `@/` and `@tutors.plus/design-system` resolve to `packages/plus-ds/src` (see `vite.config.js`).
- Uses PLUS DS: `PageLayout`, `HomepageJumbotron`, `DataVisualizationSkillsProgress`, `BadgeCard`, `RecommendedLessons`, `Card`, `Button`, `DonutChart`.

## Assumptions

- Tutoring Performance reuses `DataVisualizationSkillsProgress` with `defaultActiveTab="skills-overview"`; card title “Tutoring Performance” is added in this prototype.
- Weekly Load and Student Momentum are custom cards in this app (not from DS).
- Personalized Trainings uses `RecommendedLessons` with `badgeType` set to match category (socio-emotional, advocacy, technology-tools).
