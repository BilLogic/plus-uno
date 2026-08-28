/**
 * The allow-list entry that lets `check:storybook` run in a worktree (#282).
 *
 * The bug: worktrees under `.claude/worktrees/` carry no `node_modules`, so
 * Node resolves upward to the primary checkout — outside the Vite root. Vite
 * refused to serve the addon-vitest setup file (measured: 404 on the
 * browser-mode server), every one of the 388 story files aborted before a test
 * ran, and the a11y ratchet was only ever exercised in CI.
 *
 * Why this is a unit test rather than an end-to-end one: the failure only
 * reproduces in a worktree, and CI runs in a normal checkout where the whole
 * thing passes either way. So the part that can be verified anywhere is the
 * part that was actually wrong twice — which directory gets named.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

import { nodeModulesDirFrom } from "./node-modules-dir.mjs";

const p = (...parts) => parts.join(path.sep);

test("the directory named is the node_modules itself, not the checkout above it", () => {
  const resolve = () => p("", "repo", "node_modules", "@storybook", "addon-vitest", "dist", "setup-file.js");
  assert.equal(nodeModulesDirFrom(resolve), p("", "repo", "node_modules"));
});

test("a worktree resolving upward names the primary checkout — the whole point", () => {
  // What actually happens here: cwd is /repo/.claude/worktrees/wt, and the
  // specifier resolves to /repo/node_modules/... two levels above the Vite root.
  const resolve = () => p("", "repo", "node_modules", "@storybook", "addon-vitest", "dist", "setup-file.js");
  const root = nodeModulesDirFrom(resolve);
  assert.equal(root, p("", "repo", "node_modules"));
  assert.notEqual(root, p("", "repo", ".claude", "worktrees", "wt"));
});

test("a nested install names the OUTER tree, which is what serves the file", () => {
  // Taking the first `node_modules` would name /repo, which does not contain
  // the resolved file — the allow entry would be wrong in the one case where
  // being wrong is invisible until a request 404s.
  const resolve = () => p("", "repo", "node_modules", "a", "node_modules", "b", "index.js");
  assert.equal(nodeModulesDirFrom(resolve), p("", "repo", "node_modules", "a", "node_modules"));
});

test("an unresolvable specifier is null, never a path", () => {
  // The consumer spreads this into `fs.allow`. A bogus entry there would widen
  // the serving allow list to something nobody chose.
  const resolve = () => {
    throw Object.assign(new Error("Cannot find module"), { code: "MODULE_NOT_FOUND" });
  };
  assert.equal(nodeModulesDirFrom(resolve), null);
});

test("a file outside any node_modules is null rather than its own directory", () => {
  // A linked or vendored checkout. Returning the containing directory would add
  // an unrelated tree to the allow list; there is simply nothing to widen.
  const resolve = () => p("", "elsewhere", "src", "setup-file.js");
  assert.equal(nodeModulesDirFrom(resolve), null);
});

test("against the real resolver, it names a directory that contains the file", () => {
  // The end-to-end shape, without asserting a machine-specific path: whatever
  // it returns, the resolved file must sit under it in a node_modules.
  const require_ = createRequire(import.meta.url);
  const root = nodeModulesDirFrom((id) => require_.resolve(id));
  if (root === null) return; // dependency absent (a --omit=dev install); nothing to assert
  const resolved = require_.resolve("@storybook/addon-vitest/internal/setup-file");
  assert.ok(resolved.startsWith(root + path.sep), `${resolved} is not under ${root}`);
  assert.equal(path.basename(root), "node_modules", `${root} is not a node_modules directory`);
});
