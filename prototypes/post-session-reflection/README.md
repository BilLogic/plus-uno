# Post-session reflection prototype

Clickable hi-fi walkthrough of the updated Toolkit / Post-Session reflection flow.

- **Figma:** [Toolkit / Post-Session](https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=3400-286833)
- **Location:** `prototypes/post-session-reflection/`
- **Port:** 3009
- **Backend:** none — all state is in-memory

## Flow

1. `/` — Reflections list (Start on an incomplete row)
2. `/reflection/:id` — Session Information → Student Reflection → Session Reflection → Self Reflection → Form Feedback → Submit

Includes AI-generating placeholder, option chips, and Save & Exit confirmation.

## Run locally

From the **repo root**:

```bash
npm run dev:post-session-reflection
```

Or:

```bash
npx vite --config prototypes/post-session-reflection/vite.config.js
```

Open **http://localhost:3009/**.

## Storybook

Specs live under **Specs → Toolkit → Post-Session** (Overview, Session Reflection states, Reflection Flow, Option Chip, AI Generating Placeholder, Save And Exit modal).
