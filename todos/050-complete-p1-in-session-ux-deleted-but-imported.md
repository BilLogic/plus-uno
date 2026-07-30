---
status: complete
priority: p1
issue_id: 050
tags: [code-review, build, netlify]
dependencies: []
---

# PR #86 deleted a module the production build imports

`prototypes/in-session-ux/` carried a uno-prototype manifest so #86 swept it — but `home-redesign/src/App.jsx:10,12,19` and `App.demo.jsx:10,12,14` import it, and `prototypes/README.md:10` documents it as a still-used demo content module. `build:all` (the Netlify production command) failed from #86's merge until the fix; the site stayed up only because Netlify serves the last successful deploy.

**Fixed** `f39ad7a4`: restored verbatim from 190920c9; `build:demo` exits 0. Found by ce:review SEV-1, verified by running the build.

**Residual for triage:** if in-session-ux should not carry a manifest (to avoid the next manifest-keyed sweep), remove `in-session-ux-manifest.json` — or teach future sweeps to check importers first.
