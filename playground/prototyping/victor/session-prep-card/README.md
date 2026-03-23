# Session Prep Card Prototype

A single screen tutors see **before** a session: last session summary, student’s current goal, 2–3 quick prompts, and a **Start session** CTA.

## What’s in this prototype

- **Layout**: Full app shell (PageLayout with TopBar + Sidebar) and one content card.
- **Prep card**:
  - **Title**: “Before your session”
  - **Subtitle**: Student name + session time (e.g. “Jordan · Today, 3:00 PM”).
  - **Last session**: Short summary of the previous session.
  - **Current goal**: Goal text + “Active” badge.
  - **Quick prompts**: Bullet list of 2–3 prompts (e.g. “Revisit today’s goal”, “Check in on strategy”).
  - **Footer**: “Start session” primary button (alert on click for now).

All data is mocked in `SessionPrepCardPage.jsx`.

## How to run

From the **project root** (so design system paths resolve):

1. Install dependencies (once):

   ```bash
   cd playground/prototyping/victor/session-prep-card
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the URL shown (e.g. `http://localhost:3010`). Click **Start session** to trigger the placeholder action.

## Components used

- **PageLayout** from `@/specs/Universal/Pages/PageLayout/PageLayout`.
- **Card**, **Badge** from `@/components`.
- Spacing/typography: semantic tokens from the PLUS cheat sheet (`--size-section-gap-md`, `--size-element-gap-*`, `body1-txt`, `body2-txt`).
