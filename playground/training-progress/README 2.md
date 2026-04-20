# Training Progress Prototype

Replicates the **Tutor Admin — Training Progress** page from Figma ([node 367-146235](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=367-146235)) and adds a row-click modal with lesson details.

## What’s in this prototype

- **Layout**: Top bar (breadcrumb “Home / Tutor Admin”, user with counter), sidebar, main content.
- **Tabs**: Tutor Performance, Status And Warnings, Tool Usage, **Training Progress** (active).
- **Actions**: Email Tutors, Export Reflection Data.
- **Training Progress Overview**: Toggle “By Tutor” / “By Lesson”, four cards:
  - **Tutor Need** — Advocacy / SMART bar chart.
  - **Avg Completion Rate** — 20% of total lessons completed (circular progress).
  - **Tutor Badge Completions** — 20% of eligible tutors (circular progress).
  - **Onboarding Completion** — 20% of tutors finished (circular progress).
- **Training Progress Details**: Export CSV, Search, filters (All Lessons, All Start Date, Name), table with columns:
  - Tutor Name (with icon, name, email)
  - Completion (e.g. 8/18 with progress ring)
  - Accuracy (e.g. 30% with progress ring)
  - Badge Claimed (✓ Yes / ! No / X N/A)
  - Time Spent (mins)
  - Action (View Progress)
- **Pagination**: “Showing 1 to 20 of 36 entries” with icon pagination.
- **Lesson details modal**: **Click any tutor row** to open a modal with that tutor’s lesson details (lessons learned, completed, accuracy per lesson, time spent).

## How to run

From the **project root** (so design system paths resolve):

1. Install dependencies (once):

   ```bash
   cd playground/training-progress
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the URL shown (e.g. `http://localhost:3009`). Click any **tutor row** in the Training Progress Details table to open the lesson-details modal.

## Components used

- **Spec page**: `TutorTrainingProgressPage` from `@/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage` (same as the real page).
- **Spec table**: `TutorsTrainingProgressTable` with `onRowClick` (row click opens modal).
- **Modal**: Custom `TutorLessonDetailsModal` (PLUS Modal + Badge) showing per-lesson completion, accuracy, and time spent.
