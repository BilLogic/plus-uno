/**
 * The contract gate's exits, pinned — including the ones that must NOT pass.
 *
 * #258: this script is named in `npm run deploy` as one of four gates in front
 * of an auto-deploy to main, and until now it had no test at all. It also spent
 * a stretch unable to fail: `--check` exited 0 on a missing app checkout, which
 * is EVERY runner, so it reported success without comparing anything. That was
 * fixed on 2026-08-17 — and then the deploy workflow set
 * BLUEPRINT_CONTRACT_OPTIONAL=1 whenever the checkout secret was unconfigured,
 * which put it straight back to reporting a green skip on every run. The
 * vendored contract then drifted for real (plus-uno-blueprint#144 renamed the
 * breadcrumb label to `Lane`; the vendored copy went on declaring `Layer`) and
 * a human found it, not the gate.
 *
 * So the cases below are mostly about the escape hatch: what it may excuse, and
 * what it must never excuse.
 *
 * Dependency-free and run with plain `node --test`, matching the other script
 * tests here — this runs inside `npm run deploy` via `test:bundle`, so it has
 * to work before anything beyond node is available.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "sync-blueprint-contract.mjs");

const CANONICAL = "export const BLUEPRINT_CONTRACT = { breadcrumb: 'Lane' };\n";
const DRIFTED = "export const BLUEPRINT_CONTRACT = { breadcrumb: 'Layer' };\n";

/**
 * A throwaway pair of repos.
 *
 * `cwd` stands in for `agents/uno-bot`, since the script resolves the vendored
 * copy relative to the working directory. `app` is null to model the checkout
 * being absent, which is the case the escape hatch is about.
 */
function withRepos({ app, vendored }, run) {
  const root = mkdtempSync(path.join(tmpdir(), "contract-gate-"));
  const cwd = path.join(root, "uno-bot");
  mkdirSync(path.join(cwd, "src", "generated"), { recursive: true });
  const vendoredPath = path.join(cwd, "src", "generated", "blueprint-contract.ts");
  if (vendored !== null) writeFileSync(vendoredPath, vendored);

  let appRoot = path.join(root, "absent");
  if (app !== null) {
    appRoot = path.join(root, "uno-blueprint");
    mkdirSync(path.join(appRoot, "src", "lib"), { recursive: true });
    writeFileSync(path.join(appRoot, "src", "lib", "blueprintContract.ts"), app);
  }

  const summary = path.join(root, "summary.md");
  writeFileSync(summary, "");

  const invoke = (args, env = {}) => {
    const result = spawnSync(process.execPath, [script, ...args], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        BLUEPRINT_REPO: appRoot,
        // Annotations are CI-only, so the default here is a CI-shaped
        // environment. The last case below drops it to check the other side.
        GITHUB_ACTIONS: "true",
        GITHUB_STEP_SUMMARY: summary,
        BLUEPRINT_CONTRACT_OPTIONAL: "",
        BLUEPRINT_CONTRACT_REQUIRED: "",
        ...env,
      },
    });
    return {
      status: result.status,
      out: `${result.stdout}${result.stderr}`,
      summary: readFileSync(summary, "utf8"),
      vendored: () => readFileSync(vendoredPath, "utf8"),
    };
  };

  try {
    return run(invoke);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("drift fails the check, and says which file to look at", () => {
  withRepos({ app: CANONICAL, vendored: DRIFTED }, (invoke) => {
    const { status, out } = invoke(["--check"]);
    assert.equal(status, 1);
    assert.match(out, /drift: src\/generated\/blueprint-contract\.ts differs/);
  });
});

test("a matching pair passes", () => {
  withRepos({ app: CANONICAL, vendored: CANONICAL }, (invoke) => {
    const { status, out } = invoke(["--check"]);
    assert.equal(status, 0);
    assert.match(out, /vendored contract matches the app/);
  });
});

test("BLUEPRINT_CONTRACT_OPTIONAL does NOT excuse real drift", () => {
  // The single most important case here. The escape hatch covers a MISSING
  // checkout; if it also silenced a failing comparison then configuring the
  // secret would have made the gate weaker, not stronger, and the drift that
  // prompted #258 would still have shipped green.
  withRepos({ app: CANONICAL, vendored: DRIFTED }, (invoke) => {
    const { status } = invoke(["--check"], { BLUEPRINT_CONTRACT_OPTIONAL: "1" });
    assert.equal(status, 1);
  });
});

test("an absent app checkout fails by default", () => {
  // The 2026-08-17 fix. Before it, this exited 0 — on every runner.
  withRepos({ app: null, vendored: CANONICAL }, (invoke) => {
    const { status, out } = invoke(["--check"]);
    assert.equal(status, 1);
    assert.match(out, /blueprint contract not found/);
  });
});

test("an absent app checkout is excused only when explicitly made optional", () => {
  withRepos({ app: null, vendored: CANONICAL }, (invoke) => {
    const { status, out } = invoke(["--check"], { BLUEPRINT_CONTRACT_OPTIONAL: "1" });
    assert.equal(status, 0);
    assert.match(out, /SKIPPED: contract drift was NOT checked on this run/);
  });
});

test("a skipped run announces itself where someone will see it", () => {
  // The #258 complaint in one assertion: the SKIPPED line was already printed,
  // and being printed was not enough. It has to reach the run summary page.
  withRepos({ app: null, vendored: CANONICAL }, (invoke) => {
    const { out, summary } = invoke(["--check"], { BLUEPRINT_CONTRACT_OPTIONAL: "1" });
    assert.match(out, /^::warning::.*SKIPPED/m);
    assert.match(summary, /contract gate.*SKIPPED/);
    assert.match(summary, /BLUEPRINT_REPO_TOKEN/);
  });
});

test("BLUEPRINT_CONTRACT_REQUIRED closes the escape hatch", () => {
  // The switch #258 asks for: once the secret exists, an unconfigured checkout
  // should stop deploying rather than quietly not checking. Settable from repo
  // variables, so closing it needs no code change.
  withRepos({ app: null, vendored: CANONICAL }, (invoke) => {
    const { status, summary } = invoke(["--check"], {
      BLUEPRINT_CONTRACT_OPTIONAL: "1",
      BLUEPRINT_CONTRACT_REQUIRED: "1",
    });
    assert.equal(status, 1);
    assert.match(summary, /BLUEPRINT_CONTRACT_REQUIRED=1/);
  });
});

test("a passing check is recorded too, so a green run proves it ran", () => {
  // Without this a reader cannot tell "compared and matched" from "never
  // compared" by looking at the summary — which is the whole failure of #258.
  withRepos({ app: CANONICAL, vendored: CANONICAL }, (invoke) => {
    const { summary } = invoke(["--check"]);
    assert.match(summary, /contract gate.*matches the app/);
  });
});

test("without --check it repairs the vendored copy instead of failing", () => {
  withRepos({ app: CANONICAL, vendored: DRIFTED }, (invoke) => {
    const { status, out, vendored } = invoke([]);
    assert.equal(status, 0);
    assert.match(out, /synced: blueprint-contract\.ts/);
    assert.equal(vendored(), CANONICAL);
  });
});

test("without --check an absent app checkout still fails — there is nothing to copy", () => {
  withRepos({ app: null, vendored: CANONICAL }, (invoke) => {
    // Even with the hatch open: it excuses a missing CHECK, not a missing sync.
    const { status } = invoke([], { BLUEPRINT_CONTRACT_OPTIONAL: "1" });
    assert.equal(status, 1);
  });
});

test("off CI it prints no workflow syntax, and exits the same way", () => {
  // The annotations must not become a dependency, and must not leak. A
  // developer running this by hand — which is what the drift message tells
  // them to do — should see the plain sentence, not `::error::`.
  withRepos({ app: CANONICAL, vendored: DRIFTED }, (invoke) => {
    const { status, out, summary } = invoke(["--check"], { GITHUB_ACTIONS: "" });
    assert.equal(status, 1);
    assert.doesNotMatch(out, /^::/m);
    assert.match(out, /drift: src\/generated\/blueprint-contract\.ts differs/);
    assert.equal(summary, "");
  });

  withRepos({ app: CANONICAL, vendored: DRIFTED }, (invoke) => {
    const { status } = invoke(["--check"], { GITHUB_STEP_SUMMARY: "" });
    assert.equal(status, 1);
  });
  withRepos({ app: null, vendored: CANONICAL }, (invoke) => {
    const { status } = invoke(["--check"], {
      BLUEPRINT_CONTRACT_OPTIONAL: "1",
      GITHUB_STEP_SUMMARY: path.join(tmpdir(), "no-such-dir-258", "summary.md"),
    });
    assert.equal(status, 0);
  });
});
