#!/usr/bin/env node
// Lists, creates or checks uno-bot's Figma notification subscriptions (#895).
//
// It runs in `.github/workflows/figma-subscriptions.yml`, because only the
// repo's secrets hold the Figma token and the passcode. The work is
// `src/figma-notify/subscribe.ts`, compiled by `tsconfig.test.json` and run
// over the Worker's own Figma client — paced and retried like every other
// Figma call, against the budget Bill's tokens share.
//
//   node scripts/figma-subscriptions.mjs --action list|create|status \
//     [--teams Universal|all|Universal,Training] [--events FILE_COMMENT[,FILE_UPDATE]]
//
//   list    each team's subscriptions to this Worker's route, and what is missing
//   create  the same, then creates what is missing — the workflow puts this
//           behind the uno-bot-production environment, whose required reviewer
//           approves it (Bill's OK, #884)
//   status  each subscription's newest deliveries and how the route answered —
//           the PING, then the first live comment
//
// The defaults are every team and both events — the 12 #896 asks for, of
// which #895's run made the first. The teams come from
// FIGMA_TEAM_IDS in wrangler.toml; the route from UNO_BOT_WORKER_URL, else the
// production Worker (worker-url.mjs). FIGMA_ACCESS_TOKEN is required, and
// FIGMA_WEBHOOK_PASSCODE for `create`; neither is ever printed.

import { appendFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ensureTestBuild } from "./eval-transport-local.mjs";
import { varValueInWrangler } from "./secrets.mjs";
import { workerOrigin } from "./worker-url.mjs";
import { isEntry } from "../../../scripts/lib/findings.mjs";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ACTIONS = ["list", "create", "status"];
/** The route the subscriptions point at, on the Worker's origin. */
export const ROUTE = "/figma/events";

/**
 * The command line, read.
 *
 * @param {string[]} argv - Arguments after the script
 * @returns {{action: string, teams: string, events: string[]}}
 * @throws On an unknown flag or action, or a flag with no value, so a typo
 *   creates nothing
 */
export function parseArgs(argv) {
  const out = { action: "list", teams: "all", events: ["FILE_COMMENT", "FILE_UPDATE"] };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!["--action", "--teams", "--events"].includes(flag)) throw new Error(`unknown argument ${flag}`);
    if (value === undefined || value.startsWith("--")) throw new Error(`${flag} needs a value`);
    if (flag === "--action") out.action = value.trim().toLowerCase();
    if (flag === "--teams") out.teams = value;
    if (flag === "--events") out.events = value.split(",").map((e) => e.trim().toUpperCase()).filter(Boolean);
  }
  if (!ACTIONS.includes(out.action)) throw new Error(`--action is one of ${ACTIONS.join(", ")}, not ${out.action}`);
  if (!out.events.length) throw new Error("--events names no event");
  return out;
}

/**
 * The route the subscriptions point at.
 *
 * @param {Record<string, string|undefined>} [env]
 */
export function endpointFor(env = process.env) {
  return `${workerOrigin(env)}${ROUTE}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) throw new Error("FIGMA_ACCESS_TOKEN is not set");

  ensureTestBuild({ pkg: PKG, log: (line) => console.error(line.replace("[evals]", "[figma-subscriptions]")) });
  const require = createRequire(import.meta.url);
  const { createFigmaRestClient } = require(path.join(PKG, ".test-build/src/figma/rest.js"));
  const { figmaTeamsFrom, selectTeams } = require(path.join(PKG, ".test-build/src/figma-notify/teams.js"));
  const subscribe = require(path.join(PKG, ".test-build/src/figma-notify/subscribe.js"));

  for (const event of args.events) {
    if (!subscribe.SUBSCRIBABLE.includes(event)) {
      throw new Error(`--events takes ${subscribe.SUBSCRIBABLE.join(", ")}, not ${event}`);
    }
  }
  const toml = readFileSync(path.join(PKG, "wrangler.toml"), "utf8");
  const teams = selectTeams(figmaTeamsFrom(varValueInWrangler(toml, "FIGMA_TEAM_IDS")), args.teams);
  const endpoint = endpointFor();
  const figma = createFigmaRestClient({ token });

  let lines;
  let failed;
  if (args.action === "status") {
    const status = await subscribe.subscriptionStatus({ figma, teams, endpoint });
    lines = subscribe.statusLines(status, endpoint);
    failed = status.some((s) => s.detail);
  } else {
    const report = await subscribe.ensureSubscriptions({
      figma,
      teams,
      events: args.events,
      endpoint,
      passcode: process.env.FIGMA_WEBHOOK_PASSCODE,
      create: args.action === "create",
    });
    lines = subscribe.reportLines(report, endpoint);
    failed = report.stopped;
  }
  const text = lines.join("\n");
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fence = "```";
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Figma subscriptions: ${args.action}\n\n${fence}\n${text}\n${fence}\n`);
  }
  if (failed) process.exitCode = 1;
}

if (isEntry(import.meta.url)) {
  main().catch((err) => {
    console.error(`[figma-subscriptions] ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
