/**
 * The `node_modules` directory this repo's dependencies actually live in.
 *
 * #282. The work in this repo happens in git worktrees under
 * `.claude/worktrees/`, and those have no `node_modules` of their own. Node
 * resolves upward, so every dependency comes from the primary checkout —
 * ABOVE the Vite root. Vite refuses to serve a file outside its serving allow
 * list, so `check:storybook` aborted all 388 story files before a single test
 * ran, and the gate could only ever be exercised in CI or by hand in the
 * primary checkout.
 *
 * Lives in its own module, rather than inline in vite.config.js, because the
 * one thing here that can be wrong quietly is the answer to "which directory?"
 * — and a wrong answer looks exactly like a right one until the suite aborts.
 */

import path from "node:path";

/**
 * The `node_modules` directory that holds `specifier`.
 *
 * Derived from where the specifier actually resolves — NOT from walking up
 * looking for a `node_modules` directory. A worktree grows one the first time
 * anything runs there, holding only Vite's own caches (`.vite`, `.cache`, and
 * nothing else), and an existence test then answers "right here", confidently
 * and wrongly. That mistake was made while fixing this and cost a run: the
 * allow-list entry was added, pointed at the worktree, and the 404 did not move.
 *
 * Returns the `node_modules` directory itself, not its parent: that is the
 * smallest thing that has to be servable, and the parent is the whole checkout.
 * `npm run storybook` binds `--host 0.0.0.0`, so allowing the parent would put
 * every untracked file in the primary checkout on the LAN.
 *
 * @param {(id: string) => string} resolve  a `require.resolve`
 * @param {string} [specifier] the file that has to be served
 * @returns {string|null} null when it cannot be resolved, or resolves to
 *   something outside any `node_modules` (a linked or vendored checkout) —
 *   callers treat that as "nothing to widen", never as a path
 */
export function nodeModulesDirFrom(resolve, specifier = "@storybook/addon-vitest/internal/setup-file") {
  let resolved;
  try {
    resolved = resolve(specifier);
  } catch {
    return null;
  }
  const marker = `${path.sep}node_modules${path.sep}`;
  // Last, not first: a nested install (`a/node_modules/b/node_modules/c`) is
  // served out of the outermost tree, and taking the first match would name a
  // directory that does not contain the file.
  const cut = resolved.lastIndexOf(marker);
  return cut === -1 ? null : resolved.slice(0, cut + marker.length - 1);
}
