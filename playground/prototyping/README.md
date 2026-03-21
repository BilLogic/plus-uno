# Prototyping

This directory is for designer-specific prototyping and experimentation. Each designer can create their own directory to work on prototypes without affecting the main codebase.

## Standard: React/Vite

**All new prototypes are React/Vite apps.** This matches the rest of the repo (PLUS components are React) and lets you import and use PLUS components directly instead of copying markup. Run a prototype with `npm install` then `npm run dev` from the prototype folder. See an existing prototype (e.g. `victor/tutor-performance/`) for `package.json` and `vite.config.js` that resolve the workspace design system.

## Prototyping modes

This section explains how to generate prototypes with the PLUS design system and Cursor. Use it to pick the right **mode** and know what to say so the AI builds what you want.

### Shared bar (every prototype)

No matter which mode you use, every prototype will:

- **Use design tokens** — No hardcoded colors, spacing, or fonts. The AI uses PLUS token variables (e.g. `var(--color-*)`, `var(--size-*)`).
- **Be high-fidelity** — Prototypes look polished and use real PLUS components and styling. "Exploratory" or "first pass" does not mean rough or low-fi.
- **Use PLUS components** — When the repo has a PLUS component (e.g. Modal, Button, Alert), the AI uses that one—not the default React or Bootstrap version.
- **When replicating a page: match how the real page does it** — If the prototype is replicating an existing page (from Figma or a spec), the AI must check how that page implements each part (filters, table, top bar, forms, etc.) and use the **same components from the repo**. The AI must not substitute native form elements (`<select>`, `<input>`) or raw Bootstrap classes as a shortcut—grab the actual components/specs the real page uses (e.g. filters → the spec's filter component, not a plain dropdown).

### Modes

Pick the mode that matches what you have and what you want.

| Mode | When to use | What to say or provide | Where the prototype will live |
|------|-------------|------------------------|------------------------------|
| **0→hi-fi** | You want **one hi-fi screen**. Input can be a sketch, wireframe, or screenshot (and optional words), or words only. Single view, no navigation or flow. When you use words only, the AI may ask follow-up questions to pin down components and layout. | Paste an image and/or say "I have a sketch of [thing]…", or say "Imagine we had…" / "What if we…" and describe the screen. | `playground/prototyping/{your-name}/{project-name}/` |
| **Flow/journey** | You want to **click through multiple screens** (e.g. login → dashboard → settings). Input can be words only, or you can give a Figma link (lo-fi or hi-fi) as a starting point. | Say: "I want to click through [screen A] → [screen B] → [screen C]" and any details; optionally add a Figma link to start from. | Same |
| **Remix** | You have an existing prototype or Figma and want to change something. | Say: "Take [this prototype/Figma] and change [X] to [Y]." | Same folder or a new one |

### How the agent can help (per mode)

The agent may ask clarifying questions so the prototype matches what you want. You can also volunteer these details up front.

**0→hi-fi**

- **Which PLUS context does this screen belong to?** (e.g. Admin dashboard, Login, Profile) — so the agent picks the right specs/templates and components.
- **Is this matching an existing page or spec?** — If yes, the agent will reuse the same components as the real page (filters, table, top bar), not generic elements.
- **Do you have a Figma link or screenshot?** — Even rough reference reduces guesswork and keeps tokens/layout aligned.
- **Words-only:** What’s the primary action? What content blocks (table + filters, cards grid, form)? Any specific PLUS components (Modal, Alert, DateRangeFilter)?
- Before building, the agent can confirm: design tokens only, PLUS components from the repo, and output path `playground/prototyping/{name}/{project}/`.

**Flow/journey**

- **What’s the exact sequence?** (e.g. Login → Dashboard → Settings) — so no step is missing or wrong.
- **Should navigation be real (routing) or placeholder (e.g. buttons that just switch view)?** — sets expectations and implementation.
- **Do you have a Figma link for the flow (even lo-fi)?** — gives structure and content per screen.
- **Same user state across screens (e.g. “logged in”) or should we simulate state changes?** — affects whether the agent adds simple state or routing.
- The agent can list the screens it will implement and confirm order, and remind that each screen still follows the shared bar (tokens, hi-fi, PLUS components, same components as real page when replicating).

**Remix**

- **Point to the prototype folder or Figma** — so the agent knows exactly what to remix (path or link).
- **What exactly should change?** (e.g. copy, layout, component, token) — one clear sentence avoids scope creep.
- **Same folder or a new one?** (e.g. `project-v2`) — avoids overwriting when you want to compare.
- Before changing, the agent can restate: “I’ll take [X] and change [Y] to [Z]. Output in [folder]. Correct?” After the change, it can note what was remixed so you can verify.

### Quick reference: "If you want X, say Y"

- **"I have a sketch"** or **"Imagine we had a dashboard that…"** → 0→hi-fi. One screen from an image and/or words, or words only (AI may ask follow-ups to narrow components/layout).
- **"I want to click through login, then dashboard, then settings"** → Flow/journey. List the screens (and optionally a Figma link to start from).
- **"Take this prototype and change the button to…"** → Remix. Point to the prototype and describe the change.

### Where output lives

All prototypes (0→hi-fi, flow/journey, remix) live under:

`playground/prototyping/{your-name}/{project-name}/`  
Example: `playground/prototyping/jordan/login-flow/`

### How to use (in Cursor)

Describe what you want **in Cursor chat** using the modes above. For example: "I want to create a prototype. 0→hi-fi — I have a sketch of a login form with…" or "Imagine we had a dashboard that shows…" (0→hi-fi) or "I want to click through login, then dashboard, then settings" (flow/journey). You can also start your message with **Prototyping mode: 0-to-hifi** (or **flow-journey**, **remix**) so the AI uses that mode's rules. The AI will follow the baseline (tokens, hi-fi, PLUS components) and put output in the right place.

---

## Creating Your Prototype

1. Create a directory with your name (e.g. `playground/prototyping/bill/` or `playground/prototyping/victor/`)
2. Create a subdirectory for your prototype (e.g. `playground/prototyping/victor/my-feature/`)
3. Create a **React/Vite app** in that folder: `package.json`, `vite.config.js` (with alias to workspace `design-system` and SCSS load paths), `index.html`, `src/main.jsx` (or `index.jsx`), and your app component(s). Copy from an existing prototype (e.g. `victor/tutor-performance/`) if needed.
4. Add a `README.md` in your prototype directory to document your work
5. Run `npm install` then `npm run dev` from the prototype folder to start

## Local Development Server

**Prototypes are React/Vite apps.** Run the dev server from **inside the prototype folder**:

```bash
cd playground/prototyping/{your-name}/{prototype-name}/
npm install
npm run dev
```

Vite will start a local server (e.g. http://localhost:3008) and open the app. Use the prototype’s `vite.config.js` to resolve the workspace design system (`@` or similar alias to `design-system/src`).

## Structure

```
playground/
├── templates/                   # Curated templates organized by product pillar
│   ├── admin/
│   ├── home/
│   ├── login/
│   ├── profile/
│   ├── toolkit/
│   ├── training/
│   └── universal/
└── prototyping/                 # Designer-specific prototyping area
    ├── README.md                # This file: modes, "what to say" for Cursor, server, structure
    └── {your-name}/             # Your prototyping directory
        └── {prototype-name}/    # React/Vite app (see e.g. victor/tutor-performance/)
            ├── package.json
            ├── vite.config.js   # Resolve workspace plus-ds, SCSS load paths
            ├── index.html
            ├── index.jsx (or src/main.jsx)
            ├── [App components].jsx
            └── README.md
```

**Home Redesign** (Figma APPLICATION-PROTOTYPES node 158-21725) is grouped under:
`playground/prototyping/bill/home-redesign/` — see that folder’s README for Figma MCP usage, tokens, and DataViz.

## Best Practices

1. **Organize by feature**: Create subdirectories for different prototypes
2. **Document your work**: Include README.md files explaining your prototypes
3. **Use templates**: Start from templates in `../templates/` when appropriate
4. **Follow design system**:
   - **Styles**: `design-system/guidelines/design-tokens/`
   - **Components**: `design-system/guidelines/overview-components.md`
5. **Keep it clean**: Remove experimental code that didn't work out

## When to Use Prototyping vs Templates

- **Prototyping**: Use for experimentation, one-off prototypes, and personal exploration
- **Templates**: Use for reusable, curated templates that demonstrate complete page implementations based on specs documentation

## Moving to Templates

If your prototype becomes a useful template for others:

1. Clean up the code
2. Add comprehensive documentation
3. Move it to `../templates/{product-pillar}/`
4. Update the templates README

## Import paths (React/Vite)

In a prototype, use the alias from `vite.config.js` (e.g. `@` → `design-system/src`) to import PLUS components and styles:

```javascript
import { Button, Modal } from '@/components/index.js';
import '@/styles/main.scss';
```

See `victor/tutor-performance/vite.config.js` for the resolver and SCSS load paths.

## Git Integration

By default, prototyping directories are ignored by git (see `.gitignore`). If you want to commit your prototyping work:

1. Remove the ignore pattern for your specific directory, OR
2. Use `git add -f playground/prototyping/{your-name}/` to force add

## See Also

- **Agent router**: `.agent/SKILL.md` — Mode-based protocol for implementation (learning/maintaining/consulting/iteration/finalization)
- **Templates**: `../templates/` — Curated templates based on specs documentation
- **Design System**: `../../design-system/` — Component library and tokens
- **Agent references**: `../../.agent/references/` — Canonical workflow and foundation docs
- **Token Reference**: `../../design-system/guidelines/design-tokens/` — Colors, typography, layout
