#!/usr/bin/env node
// What is actually set on the Worker, against what this repo says it needs.
//
// Not a gate. It needs Cloudflare auth, and a gate that needs a credential is a
// gate that gets skipped — the offline half is `npm run check:secrets`, which
// runs on every PR. This is the command you run before and after the #288
// account move, and once in a while to notice what has accumulated.
//
// It reads NO values. `wrangler secret list` returns names; Cloudflare stores
// secrets write-only. That is also why the move requires re-entering them by
// hand: nobody, with any level of access, can export them from the old account.
import { SECRETS, classify } from "./secrets.mjs";
import { liveSecretNames, nodeTooOld } from "./wrangler-secrets.mjs";

const tooOld = nodeTooOld();
if (tooOld) {
  console.error(tooOld);
  process.exit(1);
}

let live;
try {
  live = liveSecretNames();
} catch (err) {
  console.error(String(err.message ?? err));
  process.exit(1);
}

const { present, missing, optionalUnset, undeclared, forbidden } = classify(live);
const why = new Map(SECRETS.map((s) => [s.name, s.why]));

console.log(`${live.length} secret(s) set on the Worker; ${SECRETS.length} declared.\n`);

if (present.length) {
  console.log(`set and accounted for (${present.length}):`);
  for (const n of present) console.log(`  ✓ ${n}`);
}

if (optionalUnset.length) {
  console.log(`\noptional, not set — a deliberate state, not a gap (${optionalUnset.length}):`);
  for (const n of optionalUnset) console.log(`  · ${n}`);
}

let bad = 0;

if (missing.length) {
  bad += missing.length;
  console.log(`\nREQUIRED and not set (${missing.length}):`);
  for (const n of missing) console.log(`  ✗ ${n} — ${why.get(n)}`);
  console.log("  -> npm run secrets:set");
}

if (forbidden.length) {
  bad += forbidden.length;
  console.log(`\nSET AND MUST NOT BE (${forbidden.length}):`);
  for (const n of forbidden) console.log(`  ✗ ${n} — ${why.get(n)}`);
  console.log("  -> npx wrangler secret delete <name>");
}

if (undeclared.length) {
  bad += undeclared.length;
  console.log(`\nSET BUT UNDECLARED (${undeclared.length}):`);
  for (const n of undeclared) console.log(`  ? ${n}`);
  console.log(
    "  These grant whatever they grant, oblige a rotation, and get carried to the\n" +
      "  new account by anyone working from the list (#288). Each one is either a\n" +
      "  gap in scripts/secrets.mjs or a credential to delete — decide which.",
  );
}

if (bad) {
  console.log(`\n${bad} thing(s) to resolve.`);
  process.exit(1);
}
console.log("\nEverything set is declared, and everything required is set.");
