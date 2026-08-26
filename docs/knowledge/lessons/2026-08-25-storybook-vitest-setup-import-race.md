<!-- Tier: 2 -->
---
domain: integration
type: lesson
confidence: medium
created: 2026-08-25
tags: [storybook, vitest, vite, browser-mode, flake, optimizeDeps, ci]
---

## [2026-08-25] The Storybook suite's setup-file import failure is a dependency-discovery reload

Written while fixing #157, the blocking prerequisite for turning the Storybook
suite into a PR gate (#169).

---

### The symptom

Roughly one run in three, on a cold dependency cache, 7 of 382 story files aborted
before running a single test:

```
Failed to import test file .storybook/vitest.setup.ts
Caused by: SyntaxError: Unexpected token ']'
```

The same setup file imported fine for the other 375 files in that run, and for all
382 in the runs either side. There is no syntax error in the file. When it fires it
also masks real results — the run it was measured in read 225 failures where the
true number was 235.

### What actually happens

Vitest browser mode serves every module through a Vite dev server. That server
pre-bundles the dependencies its pre-run scan can reach **statically**, and
discovers the rest at runtime. A dependency discovered mid-run forces a
re-optimisation, and Vite reloads the page so the new bundle takes effect.

Vitest knows this is dangerous and says so in `@vitest/browser` itself:

> Vite unexpectedly reloaded a test. This may cause tests to fail, lead to flaky
> behaviour or duplicated test runs. For a stable experience, please add mentioned
> dependencies to your config's `optimizeDeps.include` field manually.

Every test file imports the setup file first. A file whose setup import is in
flight when the reload lands gets a truncated or superseded module body, and the
parser reports whatever token it choked on. `]` is not a clue about the file — it
is a clue about *where the bytes stopped*.

That accounts for every property of the flake: transient, small in scale, cold-cache
only, and always naming the one module that every file loads.

### Why the static scan missed things

Two dependencies were resolving at runtime rather than in the first optimise pass.
The load-bearing one is `axe-core`: `@storybook/addon-a11y` reaches it through a
dynamic `import("axe-core")`, which no static crawl can see. It only appears once
a story actually runs an accessibility check — i.e. mid-run, by construction.

### The fix

In `vite.config.js`, on the `storybook` test project:

- `optimizeDeps.include` pins the setup graph, `axe-core` and `storybook/test`
  included, so the first optimise pass is the only one.
- `setupFiles` names `@storybook/addon-vitest/internal/setup-file` alongside our
  own. Vitest replaces config arrays rather than merging them, so listing only our
  file silently deleted the ones the addon injects from its `config()` hook; the
  addon then re-added a browser setup file later from `configureVitest`, against a
  different config object, leaving the project's setup graph assembled across two
  phases.

`design-system/tests/storybook-vitest-project.test.js` holds both as assertions.

### Two traps found on the way

**Do not accept Storybook's offer to delete the setup file.** It prints an info box
saying that since 10.3 the addon applies preview annotations automatically and the
file can go. Take it and every story file fails: without a local
`setProjectAnnotations`, the addon loads `setup-file-with-project-annotations.js`
instead, whose graph does not import under Vite 8 —
`aria-query does not provide an export named 'elementRoles'`. Measured, not assumed.

**`test.deps.optimizer.web` is not the lever in browser mode.** It resolves the
optimiser config for the Node-side server only. The browser server builds its own,
from the Vite config's `optimizeDeps`. `optimizeDeps.entries` on the project is
likewise overridden by the browser plugin; `optimizeDeps.include` is the one field
that reaches it.

### How to recognise a recurrence

1. Any `Failed to import test file` naming a setup file, with a `SyntaxError` cause
   that does not correspond to a real syntax error.
2. `Vite unexpectedly reloaded a test` anywhere in the run output.
3. A dependency present in the run but absent from `optimized` in
   `node_modules/.cache/storybook/*/sb-vitest/deps/_metadata.json` after a
   cold-cache run. That file is the list of what got pre-bundled; anything the
   suite uses that is missing from it arrived at runtime.

The fix for a new one is the same: add the dependency to `optimizeDeps.include`.

### What is not settled

The flake did not reproduce locally. A clean checkout ran the full suite four times
— two of them cold-cache — with zero import aborts and zero reload warnings, while
reproducing the documented result exactly (235 failed / 881 passed / 1116 tests
across 382 files, ~210s). So the mechanism above is established by the stack's own
behaviour and by finding two dependencies that were genuinely resolving at runtime,
not by watching the failure happen and then watching it stop. If #169's gate flakes
the same way, start at the `_metadata.json` check above rather than assuming this
lesson closed it.
