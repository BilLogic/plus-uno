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
| **Sketch to hi-fi** | You have a sketch, wireframe, or screenshot and want to see it as a real screen. | Paste the image or say: "I have a sketch of [thing]" and describe it. | `playground/prototyping/{your-name}/{project-name}/` |
| **0–1 from description** | You're imagining a feature from scratch with no visual yet. | Say: "Imagine we had…" or "What if we…" and describe the feature. | Same |
| **Figma to build** | You have a hi-fi Figma design and want it built. | Paste the Figma link and say "Build this" (or "Build this as a prototype in the playground"). | Package/app, or playground if you say "just a prototype" |
| **Flow/journey** | You want to click through a sequence of screens (e.g. login → dashboard → settings) without giving full designs. | Say: "I want to click through [screen A] → [screen B] → [screen C]" and any details. | Same |
| **Remix** | You have an existing prototype or Figma and want to change something. | Say: "Take [this prototype/Figma] and change [X] to [Y]." | Same folder or a new one |

### Quick reference: "If you want X, say Y"

- **"I have a sketch"** → Sketch to hi-fi. Paste the image and/or describe it.
- **"Imagine we had a dashboard that…"** → 0–1 from description. Describe the feature in words.
- **"Build this [Figma link]"** → Figma to build. Add the link and say if you want it in the playground or production-style.
- **"I want to click through login, then dashboard, then settings"** → Flow/journey. List the screens and any key elements.
- **"Take this prototype and change the button to…"** → Remix. Point to the prototype and describe the change.

### Where output lives

- **Exploratory / flow / remix:**  
  `playground/prototyping/{your-name}/{project-name}/`  
  Example: `playground/prototyping/jordan/login-flow/`

- **"Build from Figma" (production-style):**  
  In the package or consumer app. If you say "just a prototype" or "in the playground," it goes under `playground/prototyping/` as above.

### How to use (in Cursor)

Describe what you want **in Cursor chat** using the modes above. For example: "I want to create a prototype. Sketch to hi-fi — I have a sketch of a login form with…" or "Imagine we had a dashboard that shows…". You can also start your message with **Prototyping mode: sketch-to-hifi.** (or another mode id) so the AI uses that mode's rules. The AI will follow the baseline (tokens, hi-fi, PLUS components) and put output in the right place.

---

## Creating Your Prototype

1. Create a directory with your name (e.g. `playground/prototyping/bill/` or `playground/prototyping/victor/`)
2. Create a subdirectory for your prototype (e.g. `playground/prototyping/victor/my-feature/`)
3. Create a **React/Vite app** in that folder: `package.json`, `vite.config.js` (with alias to workspace `packages/plus-ds` and SCSS load paths), `index.html`, `src/main.jsx` (or `index.jsx`), and your app component(s). Copy from an existing prototype (e.g. `victor/tutor-performance/`) if needed.
4. Add a `README.md` in your prototype directory to document your work
5. Run `npm install` then `npm run dev` from the prototype folder to start

## Local Development Server

**Prototypes are React/Vite apps.** Run the dev server from **inside the prototype folder**:

```bash
cd playground/prototyping/{your-name}/{prototype-name}/
npm install
npm run dev
```

Vite will start a local server (e.g. http://localhost:3008) and open the app. Use the prototype’s `vite.config.js` to resolve the workspace design system (`@` or similar alias to `packages/plus-ds/src`).

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

## Best Practices

1. **Organize by feature**: Create subdirectories for different prototypes
2. **Document your work**: Include README.md files explaining your prototypes
3. **Use templates**: Start from templates in `../templates/` when appropriate
4. **Follow design system**: Always use PLUS design tokens and components
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

In a prototype, use the alias from `vite.config.js` (e.g. `@` → `packages/plus-ds/src`) to import PLUS components and styles:

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

- **Prototyping skill**: `.agent/skills/prototyping/SKILL.md` — Agent protocol and baseline
- **Templates**: `../templates/` — Curated templates based on specs documentation
- **Design System**: `../../packages/plus-ds/` — Component library and tokens
- **Documentation**: `../../develop/` — Technical documentation
- **Token Reference**: `../../develop/foundations/` — Colors, typography, layout
