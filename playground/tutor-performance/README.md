# Tutor Performance Prototype

Replicates the **Tutor Admin — Tutor Performance** page from Figma (node 481-163968) and adds the Attendance modal feature.

## What’s in this prototype

- **Layout**: Top bar (breadcrumb “Home / Tutor Admin”, user), sidebar, main content.
- **Tabs**: Tutor Performance (active), Status And Warnings, Tool Usage, Training Progress.
- **Actions**: Email Tutors, Export Reflection Data.
- **Performance Overview**: Filters (All Schools, All Tutors, date range), two cards:
  - **Attendance** — donut 95% Attended / 5% Missed. **Click this card** to open the Attendance modal.
  - **Sign-Up Rate** — donut 85% Signed Up / 15% Not Signed Up.
- **Performance Details**: “Add Tutor” button, sortable table (Tutor Name, Signed-Up, % Attendance, Sessions, Students), pagination.
- **Attendance modal** (when you click the Attendance card): List of sessions you’ve been assigned to, each with an “Attended” or “Absent” badge.

## How to run

From the **project root** (so design system paths resolve):

1. Install dependencies (once):

   ```bash
   cd playground/tutor-performance
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the URL shown (e.g. `http://localhost:3008`). Click the **Attendance** card to open the modal.

## Components used

- `PageLayout`, `NavTabs`, `Button`, `Card`, `Table`, `Pagination`, `Badge`, `Modal`
- `DonutChart` from `@/DataViz`
- Custom `AttendanceModal` (PLUS Modal + Badge)
