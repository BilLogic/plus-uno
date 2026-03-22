# Home Redesign Prototype

Homepage redesign based on **Figma APPLICATION-PROTOTYPES**, node **158-21725**. All prototype files for this design live under this folder.

- **Figma**: [APPLICATION-PROTOTYPES](https://www.figma.com/design/NUcRDZUzUiuVmx1ydNXpl3/APPLICATION-PROTOTYPES?node-id=158-21725)
- **Location**: `playground/prototyping/bill/home-redesign/`

## Using Figma MCP

Use Figma MCP to keep the prototype aligned with the design:

1. **get_design_context** – `fileKey: NUcRDZUzUiuVmx1ydNXpl3`, `nodeId: 158:21725` (use `158:21725`). Returns code and **asset download URLs** for images (e.g. Personalized Training card illustrations). Use these URLs or export assets and reference them in `PERSONALIZED_TRAININGS[].image`.
2. **get_screenshot** – Same `fileKey` and `nodeId` to capture a reference screenshot of the frame for layout and copy.
3. **get_metadata** – Same file/node to see child node IDs if you need to target sub-sections (e.g. Weekly Tutoring Load, Student Momentum, training cards).

## Token usage

Styling uses **PLUS design tokens** from `design-system/src/styles`:

- **Colors**: `--color-primary`, `--color-surface-container-low`, `--color-on-surface`, `--color-outline-variant`, `--color-social-emotional`, `--color-mastering-content`, `--color-advocacy`, `--color-relationship`, etc.
- **Typography**: `--font-family-header`, `--font-family-body`, `--font-size-title-m4`, `--font-size-body2`, `--font-line-height-title`.
- **Spacing/layout**: `--size-section-gap-lg`, `--size-section-pad-y-lg`, `--size-surface-radius`, `--size-element-gap-*`.

See `design-system/guidelines/design-tokens/` for the full token set.

## Data visualization framework

This prototype uses the **PLUS DataViz** framework from `design-system/src/DataViz`:

- **Tutoring Performance** – `DataVisualizationSkillsProgress` (radar: Your vs Average) from Home specs.
- **Weekly Tutoring Load** – `DonutChart` (PartToWhole) with 5 segments; breakdown list with colored progress bars matching segment colors.
- **Student Momentum** – `BarChart` (Comparison) per student: 4×2 grid, 8 students, each with a mini column chart (7 data points, scale 0–10).

## Sections

1. **Shell** – PageLayout, TopBar (Home, Boyuan Guo / Lead), Sidebar (tutor).
2. **Jumbotron** – Sign-up CTA + BadgeCard.
3. **Three cards** – Tutoring Performance (radar), Weekly Tutoring Load (16.8 hrs + 84% donut + colored breakdown bars), Student Momentum (4×2 grid, BarChart per student).
4. **Personalized Trainings** – Carousel of `RecommendedLessons` cards (368px width to match reference). Illustrations are in `public/assets/`: `giving-effective-praise.png`, `reacting-to-errors.png`, `prompting-students-to-explain.png`, `supporting-growth-mindset.png` (copied from `Downloads/Illustrations`). To refresh: copy new PNGs into `public/assets/` with the same names, or update `PERSONALIZED_TRAININGS[].image` in `App.jsx`.

## Run locally

**From the project root** (so `node_modules` and the design system resolve correctly):

```bash
cd plus-vibe-coding-starting-kit   # project root
npm run dev:home-redesign
```

Then open **http://localhost:3007/** in your browser.

If you run from the `home-redesign` folder instead, use `npx vite` there; the config uses `root: __dirname` so it also works when started via `npm run dev:home-redesign` from root.

## Files

- `index.html` – Entry HTML
- `vite.config.js` – Vite config, aliases to `design-system/src`
- `src/main.jsx` – React mount
- `src/App.jsx` – Main app and section components
- `src/App.css` – Layout and section styles (uses design tokens)
- `src/index.css` – Base styles
- `README.md` – This file
