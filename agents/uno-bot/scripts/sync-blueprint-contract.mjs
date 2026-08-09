#!/usr/bin/env node
// One-way sync of the cross-repo blueprint contract from the uno-blueprint
// app repo (its src/lib/blueprintContract.ts is the CANONICAL home) into this
// Worker's vendored copy, with a drift check for CI: `--check` exits 1 when
// the vendored bytes differ instead of copying.
//
// Same pattern as the app's own scripts/sync-agent-skill.mjs (plugin → app).
// Two coordination bugs shipped silently before the contract existed (renamed
// slices column, re-shaped findings column — both made bot reads return empty
// for weeks); a drifted copy now fails loudly here instead.
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP = resolve(process.env.BLUEPRINT_REPO ?? "../../../../../uno-blueprint");
const SOURCE = resolve(APP, "src/lib/blueprintContract.ts");
const VENDORED = resolve("src/generated/blueprint-contract.ts");

const check = process.argv.includes("--check");

if (!existsSync(SOURCE)) {
  console.error(`blueprint contract not found at ${SOURCE} (set BLUEPRINT_REPO)`);
  process.exit(check ? 0 : 1); // absent app checkout must not fail CI
}

const same =
  existsSync(VENDORED) && readFileSync(SOURCE, "utf8") === readFileSync(VENDORED, "utf8");
if (same) {
  console.log("vendored contract matches the app");
} else if (check) {
  console.error("drift: src/generated/blueprint-contract.ts differs from the app's blueprintContract.ts");
  process.exit(1);
} else {
  copyFileSync(SOURCE, VENDORED);
  console.log("synced: blueprint-contract.ts");
}
