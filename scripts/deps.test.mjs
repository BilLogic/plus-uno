/**
 * The two halves of #266 that a version bumper cannot see.
 *
 * Dependabot answers "is anything out of date?". It cannot answer "is anything
 * here dead?", and it cannot see a library that was never declared at all —
 * which is how this repo ended up loading FontAwesome from two different CDNs,
 * at two different MAJOR versions, in the same codebase:
 *
 *   cdnjs      font-awesome@6.4.0                 6 prototype files
 *   jsdelivr   @fortawesome/fontawesome-free@7.2.0  11 files incl. index.html
 *
 * Neither name is in package.json, so no dependency tool has ever looked at
 * them. Bootstrap has the same shape: pinned at 5.3.3 in 13 prototype files
 * while the app builds against the 5.3.8 in package.json.
 *
 * The alias table is the part that makes that first one detectable at all —
 * without it the two spellings look like two unrelated libraries agreeing with
 * themselves.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { cdnPins, pinConflicts, unusedDeclared } from "./deps.mjs";

/* ------------------------------------------------------- declared but dead */

const decl = (...names) => names;

test("a dependency nothing imports is reported", () => {
  const unused = unusedDeclared({
    declared: decl("lucide-react", "react"),
    sources: [{ path: "src/a.jsx", text: 'import React from "react";' }],
  });
  assert.deepEqual(unused, ["lucide-react"]);
});

test("a subpath import counts as using the package", () => {
  // `react-dom/client` is the only way react-dom is ever imported here.
  const unused = unusedDeclared({
    declared: decl("react-dom"),
    sources: [{ path: "src/a.jsx", text: 'import { createRoot } from "react-dom/client";' }],
  });
  assert.deepEqual(unused, []);
});

test("a scoped package is matched whole, not by its scope", () => {
  const unused = unusedDeclared({
    declared: decl("@storybook/addon-a11y", "@storybook/addon-docs"),
    sources: [{ path: ".storybook/main.js", text: 'addons: ["@storybook/addon-a11y"]' }],
  });
  assert.deepEqual(unused, ["@storybook/addon-docs"]);
});

test("a name quoted in a config array counts — Storybook addons are strings", () => {
  // The reason this is not an import scan: `.storybook/main.js` lists addons as
  // plain strings, and treating those as unused would delete a working addon.
  const unused = unusedDeclared({
    declared: decl("@storybook/addon-mcp"),
    sources: [{ path: ".storybook/main.js", text: "  addons: [\n    '@storybook/addon-mcp',\n  ]," }],
  });
  assert.deepEqual(unused, []);
});

test("a bare command word in an npm script counts", () => {
  // `concurrently` is never imported; it is the `dev` script's command.
  const unused = unusedDeclared({
    declared: decl("concurrently"),
    sources: [],
    scripts: { dev: 'concurrently --names app,sb "vite" "npm run storybook"' },
  });
  assert.deepEqual(unused, []);
});

test("a script that merely contains the name as a substring does NOT count", () => {
  // `vite` must not be kept alive by `@vitejs/plugin-react` or `vitest`.
  const unused = unusedDeclared({
    declared: decl("vite"),
    sources: [],
    scripts: { test: "vitest run", build: "npm run vitest-thing" },
  });
  assert.deepEqual(unused, ["vite"]);
});

test("the allowlist exempts, and every entry must carry a reason", () => {
  const unused = unusedDeclared({
    declared: decl("typescript", "lucide-react"),
    sources: [],
    allowed: new Map([["typescript", "the compiler; invoked as tsc, never imported"]]),
  });
  assert.deepEqual(unused, ["lucide-react"]);
});

test("an allowlist entry for a package that IS used is reported as stale", () => {
  // Otherwise the list only ever grows, and an exemption outlives its reason.
  const { stale } = unusedDeclared({
    declared: decl("react"),
    sources: [{ path: "src/a.jsx", text: 'import "react";' }],
    allowed: new Map([["react", "not actually needed"]]),
    detailed: true,
  });
  assert.deepEqual(stale, ["react"]);
});

test("a quoted name that is NOT an import does not count as usage", () => {
  // Measured, and the reason this is not a plain string search: "typescript"
  // and "sass" appear as CODE FENCE LANGUAGE NAMES in a Notion block mapper and
  // in scripts/doc-identifiers.mjs, and "playwright" appears in a workflow YAML.
  // Counting those kept three dependencies alive that nothing imports — a guard
  // reporting "all clean" because it matched the wrong thing.
  const unused = unusedDeclared({
    declared: decl("typescript", "sass"),
    sources: [
      { path: "src/notion-blocks.ts", text: 'const LANGS = ["typescript", "sass", "json"];' },
      { path: ".github/workflows/gate.yml", text: '        run: npx playwright install' },
    ],
  });
  assert.deepEqual(unused.sort(), ["sass", "typescript"]);
});

test("a config file's bare string DOES count — that is where addons live", () => {
  // The narrow exception. `.storybook/main.js` and *.config.* name packages as
  // plain strings; ordinary source does not.
  const unused = unusedDeclared({
    declared: decl("@storybook/addon-mcp"),
    sources: [{ path: ".storybook/main.js", text: "addons: ['@storybook/addon-mcp']" }],
  });
  assert.deepEqual(unused, []);
});

test("every import spelling is recognised", () => {
  for (const text of [
    'import x from "pkg";',
    "import 'pkg';",
    'const x = require("pkg");',
    'await import("pkg");',
    '@import "pkg/styles.css";',
    'export { x } from "pkg";',
  ]) {
    assert.deepEqual(unusedDeclared({ declared: decl("pkg"), sources: [{ path: "a.js", text }] }), [], text);
  }
});

/* ------------------------------------------------- undeclared, on a CDN */

test("a jsdelivr npm pin is read, scope and all", () => {
  const pins = cdnPins([
    { path: "index.html", text: 'href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css"' },
  ]);
  assert.deepEqual(pins, [
    { path: "index.html", lib: "fontawesome", spelling: "@fortawesome/fontawesome-free", version: "7.2.0" },
  ]);
});

test("a cdnjs pin is read too — a different host and a different name shape", () => {
  const pins = cdnPins([
    { path: "old.html", text: 'href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"' },
  ]);
  assert.deepEqual(pins, [
    { path: "old.html", lib: "fontawesome", spelling: "font-awesome", version: "6.4.0" },
  ]);
});

test("the SAME library under two spellings collides — the real #266 finding", () => {
  // Without the alias table these look like two libraries, each self-consistent,
  // and the whole drift is invisible. This is the assertion that earns the table.
  const conflicts = pinConflicts(
    cdnPins([
      { path: "index.html", text: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css" },
      { path: "old.html", text: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" },
    ]),
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].lib, "fontawesome");
  assert.deepEqual(conflicts[0].versions.sort(), ["6.4.0", "7.2.0"]);
});

test("one library pinned at one version across many files is not a conflict", () => {
  // The check has to be able to pass. Thirteen files agreeing is the good case.
  const files = Array.from({ length: 13 }, (_, i) => ({
    path: `p${i}.html`,
    text: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  }));
  assert.deepEqual(pinConflicts(cdnPins(files)), []);
});

test("several pins in one file are all read", () => {
  const pins = cdnPins([
    {
      path: "one.html",
      text: [
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
      ].join("\n"),
    },
  ]);
  assert.equal(pins.length, 2);
  assert.equal(pinConflicts(pins).length, 0);
});

test("a URL with no version is ignored rather than read as a pin", () => {
  // `.../npm/bootstrap/dist/...` floats on latest. That is a different problem,
  // and calling it version "dist" would be a fabricated finding.
  assert.deepEqual(cdnPins([{ path: "a.html", text: "https://cdn.jsdelivr.net/npm/bootstrap/dist/x.css" }]), []);
});

test("a pinned library that package.json also declares is surfaced with both", () => {
  // The Bootstrap case: 5.3.3 on the CDN in the prototypes, 5.3.8 installed for
  // the app. Two Bootstraps in one repo, and nothing said so.
  const conflicts = pinConflicts(
    cdnPins([{ path: "p.html", text: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/x.css" }]),
    { declaredVersions: { bootstrap: "5.3.8" } },
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].lib, "bootstrap");
  assert.ok(conflicts[0].declared === "5.3.8");
});

test("markdown counts — a README is where a setup snippet gets copied from", () => {
  // design-system/README.md pinned font-awesome 6.5.1: a THIRD version, in the
  // file people copy the <link> out of, while the check reported "0 new"
  // because it only scanned .html and .mdx.
  const pins = cdnPins([
    { path: "design-system/README.md", text: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" },
    { path: "index.html", text: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css" },
  ]);
  const conflicts = pinConflicts(pins);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].versions.sort(), ["6.5.1", "7.2.0"]);
});

test("a baselined library with a NEW version is still a finding", () => {
  // The ratchet's rule: the recorded set may only shrink. A baseline entry for
  // "fontawesome" must not become a blank cheque for every future fontawesome.
  const recorded = ["6.4.0", "7.2.0"];
  const live = pinConflicts(
    cdnPins([
      { path: "a.html", text: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/x.css" },
      { path: "b.html", text: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/x.css" },
      { path: "c.md", text: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/x.css" },
    ]),
  )[0];
  const extra = live.versions.filter((v) => !recorded.includes(v));
  assert.deepEqual(extra, ["6.5.1"]);
});
