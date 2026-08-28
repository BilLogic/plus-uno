#!/usr/bin/env node
// `wrangler deploy`, with the build stamp substituted into the bundle.
//
// This wrapper exists for one reason: `src/version.ts` must not contain a
// hand-typed release number. It held one for 54 deploys without moving (#249),
// and a bump instruction in a file nobody opens is not a mechanism.
//
// esbuild (which wrangler drives) replaces `__BUILD_ID__` textually wherever it
// appears, so the literal is baked in at bundle time and there is no runtime
// lookup and no env plumbing through the five modules that read BUILD.
//
// Any extra arguments are forwarded, so `npm run deploy -- --dry-run` still
// works.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildIdFromEnv } from "./build-id.mjs";

// wrangler is a devDependency, so a bare "wrangler" only resolves because npm
// puts node_modules/.bin on PATH for the lifetime of a script. That makes this
// wrapper work under `npm run deploy` and fail with ENOENT under `node
// scripts/deploy.mjs` — a difference nobody wants to discover mid-deploy.
// Resolve the binary from the package instead, and keep PATH as the fallback so
// a globally installed wrangler still works.
const LOCAL = fileURLToPath(new URL("../node_modules/.bin/wrangler", import.meta.url));
const WRANGLER = existsSync(LOCAL) ? LOCAL : "wrangler";

const build = buildIdFromEnv();

// A local deploy is allowed — it just must not mint something that reads like a
// CI release. Say which one this is, out loud, because the alternative is
// someone reading `dev` off /health and wondering.
if (build === "dev") {
  console.log("[deploy] no GITHUB_RUN_NUMBER/GITHUB_SHA — bundling as build 'dev'");
} else {
  console.log(`[deploy] build ${build}`);
}

// The define value is JS SOURCE, not a string value, so the quotes are part of
// it. Passed as one argv element, so no shell quoting is involved.
const args = ["deploy", "--define", `__BUILD_ID__:${JSON.stringify(build)}`, ...process.argv.slice(2)];

const res = spawnSync(WRANGLER, args, { stdio: "inherit" });

if (res.error) {
  console.error(`[deploy] could not run wrangler: ${res.error.message}`);
  process.exit(1);
}
// A signal death reports a null status, which `process.exit(null)` would turn
// into a SUCCESSFUL exit — a killed deploy that CI calls green.
if (res.status === null) {
  console.error(`[deploy] wrangler terminated by signal ${res.signal}`);
  process.exit(1);
}
process.exit(res.status);
