# Tutor revamp

The tutor app rebuilt from the approved vision boards: the shell, a shared kit
and the ten screens, on the PLUS design system.

- **Location:** `prototypes/tutor-revamp/`
- **Deploy Preview:** `/prototypes/tutor-revamp/`
- **Dev:** `npm run dev:tutor-revamp` (port 3031)
- **Build:** `npm run build:tutor-revamp` → `dist/prototypes/tutor-revamp/`

Add `?mode=dark` or `?mode=light` to the URL to pin a color mode; without it
the app follows the OS.

## Layout

| Path | Holds |
|---|---|
| `src/shell/` | `AppShell`: `Frame`, `Topbar` and `PatternSidebar` with the open-tabs store |
| `src/kit/` | Parts the design system does not have yet, each with a story |
| `src/data/mock.js` | The one mock-data module every screen reads |
| `src/pages/` | One file per screen; unbuilt screens render `Placeholder` |

Kit and page stories show in Storybook under **Prototypes/Tutor revamp**.
