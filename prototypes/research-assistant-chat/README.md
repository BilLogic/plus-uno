# Research Assistant Chat – Prototype

Hard-coded prototype of an AI research assistant chat for video demo. No backend; all interactions are scripted.

## Phase 1 (current)

- **Tutor Admin (Tutors tab)** view with minimal replica: tabs, Performance Overview, Performance Details table.
- **Floating chat bubble** above the bottom: suggested prompts + input + send. User types or selects a prompt and submits to “enter” the chat.
- **Research Chat** view: full chat UI (700×800) with “Research Assistant” header, two scripted exchanges (engagement chart, strategy heatmap + quotes), disabled input, and “Back to Tutors”.

## Phase 2 (done)

- **Timeline**: Auto-plays on Research Chat mount; Exchange 1 (0–4s), Exchange 2 (4–8s).
- **Typing**: User messages reveal character-by-character with blinking cursor.
- **Thinking**: Three dots with Framer Motion bounce and stagger.
- **Chart**: Highcharts line series animation (1.5s) when chart block appears.
- **Heatmap**: Cell stagger reveal + quote boxes fade/slide in.

## Run

From this directory:

```bash
npm install
npm run dev
```

Open http://localhost:3010/

## Stack

- React 19 + TypeScript
- Vite 6
- Highcharts (line chart, heatmap data)
- PLUS design tokens (colors, fonts, spacing) via `src/styles/plus-tokens.scss`
