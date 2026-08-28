#!/usr/bin/env node
// Holds the secret declaration, the code, and wrangler.toml to each other.
//
// Offline on purpose: it reads two files and compares them, so it composes into
// check:harness and runs on every PR. The comparison that needs Cloudflare auth
// — declared versus actually set — is `npm run secrets:audit`, a command you
// run, because a gate that needs a credential is a gate that gets skipped.
//
// Three things it will not let drift:
//
//   1. A declared secret the Env interface does not have. The Worker cannot
//      read it, so it would sit on the deployment granting whatever it grants
//      and obliging a rotation, for nothing.
//   2. A declared secret assigned in [vars]. That table is COMMITTED. This is
//      the one check here with teeth: it is the difference between a secret and
//      a published secret.
//   3. wrangler.toml's expected-names comment falling behind. It was
//      hand-maintained and drifted in both directions at once — four names that
//      were not set, two set names it never mentioned.
//
// `--fix` rewrites the comment block. Nothing else is auto-fixable: the other
// two are decisions.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SECRETS,
  envInterfaceNames,
  expectedBlock,
  readExpectedBlock,
  secretNames,
  varsInWrangler,
} from "./secrets.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const BOT_DIR = path.resolve(here, "..");
const WRANGLER = path.join(BOT_DIR, "wrangler.toml");
const TYPES = path.join(BOT_DIR, "src", "types.ts");

const fix = process.argv.includes("--fix");
const toml = readFileSync(WRANGLER, "utf8");
const failures = [];

// 1. The code can actually read every declared secret.
const envNames = new Set(envInterfaceNames(readFileSync(TYPES, "utf8")));
if (envNames.size === 0) {
  // The parse returning nothing would make checks 1 pass vacuously — the shape
  // of a guard that cannot fail. Treat it as breakage, not as a clean bill.
  failures.push(
    "could not find `export interface Env {` in src/types.ts — the parser in " +
      "scripts/secrets.mjs needs updating, and until it is, this check proves nothing.",
  );
} else {
  const unreadable = secretNames().filter((n) => !envNames.has(n));
  if (unreadable.length) {
    failures.push(
      `declared but absent from \`interface Env\` in src/types.ts: ${unreadable.join(", ")}.\n` +
        "     The Worker cannot read these. Add them to Env, or drop them from SECRETS.",
    );
  }
}

// 2. No secret is sitting in the committed [vars] table.
const vars = new Set(varsInWrangler(toml));
const published = secretNames().filter((n) => vars.has(n));
if (published.length) {
  failures.push(
    `assigned in [vars], which is COMMITTED: ${published.join(", ")}.\n` +
      "     Remove the assignment, `wrangler secret put` the value, and rotate it —\n" +
      "     it is in the git history from the commit that added it.",
  );
}

// 3. The comment block in wrangler.toml still describes the declaration.
const current = readExpectedBlock(toml);
const expected = expectedBlock();
if (current !== expected) {
  if (fix) {
    const next =
      current === null
        ? `${toml.trimEnd()}\n\n${expected}\n`
        // A function replacement, not a string: `$&`, `$\'` and `$1` in a
        // replacement string are patterns, and `expected` is built from
        // author-written prose. One `$` in a future reason would otherwise make
        // --fix write something else and report stale forever after.
        : toml.replace(current, () => expected);
    writeFileSync(WRANGLER, next);
    console.log(`[secrets] wrote the expected-names block into wrangler.toml (${SECRETS.length} secrets).`);
  } else {
    failures.push(
      current === null
        ? "wrangler.toml has no generated secrets block at all. Run `npm run check:secrets -- --fix`."
        : "wrangler.toml's secrets block is stale. Run `npm run check:secrets -- --fix`.",
    );
  }
}

if (failures.length) {
  console.error(`[secrets] ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  -> ${f}`);
  console.error("");
  console.error("  The declaration is scripts/secrets.mjs. Live state: npm run secrets:audit.");
  process.exit(1);
}

const required = SECRETS.filter((s) => s.required).length;
console.log(
  `[secrets] ${SECRETS.length} declared (${required} required); Env, [vars] and wrangler.toml agree.`,
);
