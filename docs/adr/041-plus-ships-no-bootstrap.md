---
embodiment: ide
summary: PLUS ships no Bootstrap — the bootstrap and react-bootstrap packages, the Bootstrap CSS layer, the generated Bootstrap color bridge and their checks are gone; a small element baseline in main.scss keeps what components relied on; completes ADR-037 and retires ADR-009 (2026-11-11)
status: active
verified: 2026-11-11
---

# ADR-041: PLUS ships no Bootstrap (2026-11-11)

**Decision.** PLUS uses no Bootstrap. `bootstrap` and `react-bootstrap` leave
`package.json` and the design system's peer ranges; the Bootstrap CSS layer
(`bootstrap-layer.css`), the generated `_bootstrap-bridge.scss` that pointed
Bootstrap's `--bs-*` variables at the `--ds-*` roles, its Storybook bridge
story, the `data-bs-theme` attribute, and the `check:react-bootstrap-imports`
ratchet are removed. Non-interactive markup is PLUS components and `--ds-*`
tokens; interactive behavior stays on Base UI (ADR-037). Bill ruled "remove
Bootstrap entirely" for the component gap work. — Bill, Nov 2026

**What replaces it.** Bootstrap's CSS did two jobs nobody had named. Its reboot
set the element defaults components were drawn against, and its
`.visually-hidden` helper hid the screen-reader text of `VisuallyHidden`,
`Spinner`, `PatternSection` and a dozen other components. Both now live in the
repo: `design-system/src/styles/_base.scss` holds the element baseline
(border-box sizing, form controls that inherit their font, block elements with
no top margin, collapsed tables, `[hidden]`), loaded in the lowest cascade layer,
`base`, where Bootstrap's layer sat; `main.scss` defines `.visually-hidden`.
Stories that leaned on Bootstrap utilities (`m-0`, `mb-3`, `p-3`, `table`,
`sticky-top`) read spacing and layer tokens instead.

**Why.** The last importer of `react-bootstrap` was the tutor-revamp prototype,
deleted in #2166, and no Bootstrap utility class was left in components. What
remained was Bootstrap's full stylesheet loaded under every page, and a
generated bridge and its tests that existed only to keep that stylesheet in
step with the color modes. Keeping it meant every component was styled against two systems at once.

**Relationship to earlier ADRs.** [ADR-037](037-base-ui-is-the-behavior-layer-for-every-component.md)
replaced React-Bootstrap as the source of behavior and kept Bootstrap as the
framework for non-interactive UI; this ADR removes that remaining half.
[ADR-009](009-bootstrap-first-no-alternative-ui-frameworks.md) is now retired
in full; its ban on other UI frameworks (no Material UI, no Ant Design, no
Tailwind) is carried by `AGENTS.md` hard rule 5.

**What would reopen it.** Adopting any external CSS framework is a new decision,
not a rollback: it needs its own ADR and the same cascade-layer and token
treatment the bridge once gave Bootstrap.
