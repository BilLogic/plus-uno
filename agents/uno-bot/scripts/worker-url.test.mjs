/**
 * The Worker's host: one definition, and the check that keeps it that way.
 *
 * #288 moves this Worker to another Cloudflare account, which changes the
 * hostname. The host was written out in TEN places across five files — the two
 * eval workflows, the deploy's health check, two script doc-comments, and
 * sixteen URLs across the two Slack app manifests. Missing one during a cutover
 * is silent in the worst way: an eval run pointed at the OLD deployment scores
 * the wrong Worker and reports a clean pass. That is the failure #249 already
 * cost this repo, which is why the build stamp derives from the deploy now
 * rather than being typed by hand.
 *
 * The manifests found themselves — the check was written first and listed two
 * files nobody had accounted for.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_WORKER_ORIGIN, workerOrigin, workerUrl } from "./worker-url.mjs";
import { ALLOWED, HOST, findStrays } from "./check-worker-host.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/* ------------------------------------------------------------------ the origin */

test("with nothing set, it is the production Worker", () => {
  assert.equal(workerOrigin({}), DEFAULT_WORKER_ORIGIN);
});

test("UNO_BOT_WORKER_URL overrides it — the switch that makes #288 a setting", () => {
  assert.equal(
    workerOrigin({ UNO_BOT_WORKER_URL: "https://uno-bot.bill.workers.dev" }),
    "https://uno-bot.bill.workers.dev",
  );
});

test("a trailing slash is tolerated — a copied dashboard URL has one", () => {
  // Without this, `${origin}/health` asks for `//health`.
  assert.equal(
    workerOrigin({ UNO_BOT_WORKER_URL: "https://uno-bot.bill.workers.dev/" }),
    "https://uno-bot.bill.workers.dev",
  );
  assert.equal(workerUrl("/health", { UNO_BOT_WORKER_URL: "https://x.dev/" }), "https://x.dev/health");
});

test("an empty or whitespace override falls back rather than yielding a bare path", () => {
  // An UNSET GitHub repo variable interpolates to the empty string. Taking it
  // literally would make every health check request `/health` against nothing.
  for (const raw of ["", "   "]) {
    assert.equal(workerOrigin({ UNO_BOT_WORKER_URL: raw }), DEFAULT_WORKER_ORIGIN);
  }
});

test("workerUrl joins with exactly one slash, given or not", () => {
  assert.equal(workerUrl("/health", {}), `${DEFAULT_WORKER_ORIGIN}/health`);
  assert.equal(workerUrl("health", {}), `${DEFAULT_WORKER_ORIGIN}/health`);
});

test("an override carrying a path is refused, not concatenated onto", () => {
  // The dashboard hands you `https://…/health`. Silently accepting it makes the
  // deploy poll `/health/health`, which 404s, which the deploy check reads as
  // "unreachable" — so the run fails 150 seconds later blaming the deploy.
  assert.throws(
    () => workerOrigin({ UNO_BOT_WORKER_URL: "https://uno-bot.new.workers.dev/health" }),
    /origin, not a URL with a path/,
  );
});

test("an override with no scheme is refused", () => {
  // `fetch` would throw "Failed to parse URL" from inside the poll loop instead.
  assert.throws(
    () => workerOrigin({ UNO_BOT_WORKER_URL: "uno-bot.new.workers.dev" }),
    /must be an absolute origin/,
  );
  assert.throws(
    () => workerOrigin({ UNO_BOT_WORKER_URL: "ftp://uno-bot.new.workers.dev" }),
    /must be http\(s\)/,
  );
});

/* ------------------------------------------------------------------- the check */

/** A throwaway repo with one file at `rel` containing `body`. */
function withRepo(rel, body, run) {
  const root = mkdtempSync(path.join(tmpdir(), "worker-host-"));
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, body);
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a new hardcoded host is caught", () => {
  withRepo("src/thing.ts", `const u = "https://${HOST}/health";\n`, (root) => {
    assert.deepEqual(findStrays(root), ["src/thing.ts"]);
  });
});

test("a file with no mention is silent — this is not just always red", () => {
  withRepo("src/thing.ts", 'const u = workerUrl("/health");\n', (root) => {
    assert.deepEqual(findStrays(root), []);
  });
});

test("the documented exceptions are exempt, and only they are", () => {
  for (const rel of ALLOWED.keys()) {
    withRepo(rel, `https://${HOST}/x\n`, (root) => {
      assert.deepEqual(findStrays(root), [], `${rel} should be allowed`);
    });
  }
  // ...and a path that merely looks like one is not.
  withRepo("agents/uno-bot/wrangler.toml.bak", `https://${HOST}/x\n`, (root) => {
    assert.deepEqual(findStrays(root), []); // .bak is not a scanned extension
  });
  withRepo("agents/uno-bot/scripts/worker-url-copy.mjs", `https://${HOST}/x\n`, (root) => {
    assert.deepEqual(findStrays(root), ["agents/uno-bot/scripts/worker-url-copy.mjs"]);
  });
});

test("recorded eval runs are left alone — rewriting them would falsify the record", () => {
  // A run artifact says which Worker it scored. That run really did hit the old
  // one; editing it to the new host would be a lie about history.
  withRepo("docs/evals/runs/2026-08-19-baseline.json", `{"worker":"https://${HOST}"}\n`, (root) => {
    assert.deepEqual(findStrays(root), []);
  });
  withRepo("docs/plans/2026-08-19-001-plan.md", `curl https://${HOST}/health\n`, (root) => {
    assert.deepEqual(findStrays(root), []);
  });

  // ...but the exemption is those two prefixes, NOT docs/ at large. Live
  // documentation has to be updated on cutover like anything else, and a
  // broader pattern here would swallow it silently. Caught by mutation: relaxing
  // HISTORY to /^docs\// left every other case in this file green.
  withRepo("docs/connectors/slack.md", `The Worker is at https://${HOST}.\n`, (root) => {
    assert.deepEqual(findStrays(root), ["docs/connectors/slack.md"]);
  });
  withRepo("docs/adr/025-docs-tabs.md", `https://${HOST}/health\n`, (root) => {
    assert.deepEqual(findStrays(root), ["docs/adr/025-docs-tabs.md"]);
  });
});

test("a nested checkout is not scanned — this repo keeps worktrees inside itself", () => {
  // Measured before the fix: from the main checkout, the ten copies under
  // .claude/worktrees/ produced 112 strays — every ALLOWED file at a path
  // prefix ALLOWED does not carry. Red for everyone is as bad as never red.
  const root = mkdtempSync(path.join(tmpdir(), "worker-host-"));
  const nested = path.join(root, ".claude", "worktrees", "wt", "agents", "uno-bot", "scripts");
  mkdirSync(nested, { recursive: true });
  writeFileSync(path.join(root, ".claude", "worktrees", "wt", ".git"), "gitdir: elsewhere\n");
  writeFileSync(path.join(nested, "worker-url.mjs"), `https://${HOST}\n`);
  try {
    assert.deepEqual(findStrays(root), []);
    // ...and .claude itself is still scanned, so a skill or agent that pins the
    // host is still caught.
    writeFileSync(path.join(root, ".claude", "notes.md"), `https://${HOST}\n`);
    assert.deepEqual(findStrays(root), [path.join(".claude", "notes.md")]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("node_modules is not scanned — a dependency mentioning the host is not ours", () => {
  withRepo("node_modules/pkg/index.js", `https://${HOST}\n`, (root) => {
    assert.deepEqual(findStrays(root), []);
  });
});

test("binary and unknown extensions are skipped rather than read", () => {
  withRepo("assets/screenshot.png", `https://${HOST}`, (root) => {
    assert.deepEqual(findStrays(root), []);
  });
});

test("every exception carries a reason, so the list cannot grow silently", () => {
  // The failure mode this guards: someone hits the check, adds their path to
  // ALLOWED to make it green, and the single-definition property quietly dies.
  for (const [rel, why] of ALLOWED) {
    assert.ok(typeof why === "string" && why.length > 20, `${rel} needs a real reason`);
  }
});

test("a gitignored artifact is not a finding — it is not part of the repo", () => {
  // `npm run evals` writes eval-results.json to the root, and it records the
  // WORKER_URL it hit. Walking the working copy flagged it on the one machine
  // that had run evals, and nowhere else.
  const root = mkdtempSync(path.join(tmpdir(), "worker-host-git-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    writeFileSync(path.join(root, ".gitignore"), "eval-results.json\n");
    writeFileSync(path.join(root, "eval-results.json"), `{"worker":"https://${HOST}"}\n`);
    assert.deepEqual(findStrays(root), []);

    // ...while an ordinary new file is still caught, staged or not.
    writeFileSync(path.join(root, "notes.md"), `https://${HOST}\n`);
    assert.deepEqual(findStrays(root), ["notes.md"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--host asks about a FOREIGN host, and ALLOWED does not apply there", () => {
  // The cutover audit. ALLOWED exempts the files that may hold the CURRENT host;
  // those same files — wrangler.toml, both Slack manifests, both workflow
  // fallbacks — are exactly what a move has to rewrite. Exempting them here
  // would report the move complete with five files pointing at a dead account.
  const OLD = "uno-bot.old-account.workers.dev";
  withRepo("agents/uno-bot/wrangler.toml", `redirect = "https://${OLD}/slack/oauth"\n`, (root) => {
    assert.deepEqual(findStrays(root, OLD), ["agents/uno-bot/wrangler.toml"]);
    // ...and the same file is still exempt for the host it is allowed to hold.
    assert.deepEqual(findStrays(root), []);
  });

  // Recorded history stays exempt in both modes: those runs really did hit it.
  withRepo("docs/evals/runs/2026-08-19.json", `{"worker":"https://${OLD}"}\n`, (root) => {
    assert.deepEqual(findStrays(root, OLD), []);
  });
});

test("every exception is live — a dead one is a silent hole", () => {
  // The reason this matters: an entry whose stated reason no longer holds still
  // grants the exemption. The suite cannot catch that by writing the host into
  // each ALLOWED path — that passes by construction — so check the real files.
  for (const rel of ALLOWED.keys()) {
    const abs = path.join(REPO_ROOT, rel);
    assert.ok(existsSync(abs), `${rel} is in ALLOWED but does not exist`);
    assert.ok(
      readFileSync(abs, "utf8").includes(HOST),
      `${rel} is in ALLOWED but no longer mentions the host — drop the exception`,
    );
  }
});

test("the real repo is clean — the check passes where it actually runs", () => {
  assert.deepEqual(findStrays(), []);
});
