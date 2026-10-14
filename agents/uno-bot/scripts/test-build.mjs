// The Node build a script runs the Worker's own modules on.
//
// `tsconfig.test.json` compiles `src/` to CommonJS under `.test-build/`, which
// is what lets a script in this folder reuse the Worker's clients and pure
// modules rather than keep a second copy of them.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The package root (agents/uno-bot), from this file. */
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Newest mtime under a directory tree, for `.ts` sources. */
function newestSource(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestSource(path));
    else if (entry.name.endsWith(".ts")) newest = Math.max(newest, statSync(path).mtimeMs);
  }
  return newest;
}

/**
 * Compile `tsconfig.test.json` when `.test-build/` is missing or older than
 * `src/`.
 *
 * MTIMES, and the comparison is deliberately one-sided: the newest source
 * against one emitted file. A build newer than every source is fresh; anything
 * else is rebuilt. Always building costs ~8s on every run, and not checking at
 * all runs code nobody has.
 *
 * @param {{ pkg?: string, log?: (line: string) => void }} [options]
 */
export function ensureTestBuild({ pkg = PKG, log = console.log } = {}) {
  const entry = join(pkg, ".test-build", "src", "turn", "turn.js");
  const sources = Math.max(newestSource(join(pkg, "src")), statSync(join(pkg, "tsconfig.test.json")).mtimeMs);
  if (existsSync(entry) && statSync(entry).mtimeMs >= sources) return { built: false };
  log("compiling tsconfig.test.json — .test-build is missing or older than src/");
  const tsc = join(pkg, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(tsc)) {
    throw new Error(`typescript is not installed in ${pkg} — run npm ci there first`);
  }
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json"], { cwd: pkg, stdio: "inherit" });
  return { built: true };
}
