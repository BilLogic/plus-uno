// The repo's library snapshot, refreshed once per publish (#898): what the
// poll leaves owed, the job that starts the refresh, and the workflow it
// starts.
//
// What an outsider sees: whether a `repository_dispatch` was sent, with which
// version, and whether the refresh is still owed afterwards. The poll's side —
// which publishes are owed — is in tests/figma-library.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  owedWith,
  REFRESH_EVENT,
  REFRESH_OWED_KV_KEY,
  runSnapshotRefresh,
  type RefreshOwed,
  type SnapshotRefreshDeps,
} from "../src/figma-library/snapshot-refresh";
import { runSnapshotRefreshOnEnv } from "../src/figma-library/env";
import { SubrequestBudgetError } from "../src/net";
import type { Env } from "../src/types";

const OWED: RefreshOwed = { versionIds: ["2210000000000000004", "2210000000000000002"], since: "2026-09-29T22:00:00.000Z" };

/** What is owed, in memory, counting reads. */
function owedStore(initial: RefreshOwed | null) {
  let value = initial;
  let reads = 0;
  return {
    get value() {
      return value;
    },
    get reads() {
      return reads;
    },
    store: {
      read: async () => ((reads += 1), value ? structuredClone(value) : null),
      clear: async () => void (value = null),
    } satisfies SnapshotRefreshDeps["owed"],
  };
}

/** A dispatch that answers from a script, keeping what it was sent. */
function dispatcher(answers: Array<{ ok: boolean; status: number } | Error> = []) {
  const sent: Array<{ eventType: string; payload: Record<string, unknown> }> = [];
  return {
    sent,
    dispatch: async (eventType: string, payload: Record<string, unknown>) => {
      sent.push({ eventType, payload });
      const answer = answers.shift() ?? { ok: true, status: 204 };
      if (answer instanceof Error) throw answer;
      return answer;
    },
  };
}

describe("the snapshot refresh job", () => {
  it("sends nothing when nothing was published (AC 3)", async () => {
    const owed = owedStore(null);
    const gh = dispatcher();
    const report = await runSnapshotRefresh({ owed: owed.store, dispatch: gh.dispatch });
    assert.equal(report.summary, "nothing published since the last refresh");
    assert.equal(report.dispatched, false);
    assert.deepEqual(gh.sent, []);
    assert.equal(owed.reads, 1, "one read, and nothing else");
  });

  it("starts one refresh for everything owed, with the newest version, and clears it (AC 1)", async () => {
    const owed = owedStore(OWED);
    const gh = dispatcher();
    const report = await runSnapshotRefresh({ owed: owed.store, dispatch: gh.dispatch });
    assert.deepEqual(gh.sent, [{ eventType: REFRESH_EVENT, payload: { figma_version_id: "2210000000000000004" } }]);
    assert.equal(owed.value, null);
    assert.equal(report.dispatched, true);
    assert.equal(report.summary, "started the refresh for 2 publish(es), newest version 2210000000000000004");

    // The next run finds nothing owed: one refresh per publish.
    await runSnapshotRefresh({ owed: owed.store, dispatch: gh.dispatch });
    assert.equal(gh.sent.length, 1);
  });

  it("keeps it owed when GitHub refuses, and the next run sends it once", async () => {
    const owed = owedStore(OWED);
    const gh = dispatcher([{ ok: false, status: 502 }]);
    const refused = await runSnapshotRefresh({ owed: owed.store, dispatch: gh.dispatch });
    assert.match(refused.summary, /^GitHub refused the dispatch \(502\) — still owed, so the next run tries again$/);
    assert.deepEqual(owed.value, OWED);

    const retried = await runSnapshotRefresh({ owed: owed.store, dispatch: gh.dispatch });
    assert.equal(retried.dispatched, true);
    assert.equal(gh.sent.length, 2);
    assert.equal(owed.value, null);
  });

  it("keeps it owed when the dispatch cannot be sent, and stops on a budget stop", async () => {
    const owed = owedStore(OWED);
    const unset = await runSnapshotRefresh({ owed: owed.store, dispatch: dispatcher([new Error("GITHUB_TOKEN or GITHUB_REPO is not set")]).dispatch });
    assert.match(unset.summary, /the dispatch failed \(GITHUB_TOKEN or GITHUB_REPO is not set\) — still owed/);
    assert.deepEqual(owed.value, OWED);

    await assert.rejects(
      runSnapshotRefresh({ owed: owed.store, dispatch: dispatcher([new SubrequestBudgetError(38)]).dispatch }),
      SubrequestBudgetError,
    );
    assert.deepEqual(owed.value, OWED);
  });

  it("says what it would start on a dry run, and sends and clears nothing", async () => {
    const owed = owedStore(OWED);
    const gh = dispatcher();
    const report = await runSnapshotRefresh({ owed: owed.store, dispatch: gh.dispatch, dryRun: true });
    assert.equal(report.summary, "would start the refresh for 2 publish(es), newest version 2210000000000000004");
    assert.deepEqual(gh.sent, []);
    assert.deepEqual(owed.value, OWED);
  });

  it("merges a new publish into what is owed: newest first, each once, from the first one's date", () => {
    assert.deepEqual(owedWith(null, ["2"], "2026-09-29T22:00:00.000Z"), { versionIds: ["2"], since: "2026-09-29T22:00:00.000Z" });
    assert.deepEqual(owedWith({ versionIds: ["2"], since: "A" }, ["4", "2"], "B"), { versionIds: ["4", "2"], since: "A" });
  });
});

describe("the job on the Worker's bindings", () => {
  /** A HARNESS_KV holding `owed`, in memory. */
  function kvWith(owed: RefreshOwed | null) {
    const map = new Map<string, string>(owed ? [[REFRESH_OWED_KV_KEY, JSON.stringify(owed)]] : []);
    const kv = {
      get: async (key: string) => (map.has(key) ? JSON.parse(map.get(key)!) : null),
      put: async (key: string, value: string) => void map.set(key, value),
      delete: async (key: string) => void map.delete(key),
    } as unknown as KVNamespace;
    return { kv, map };
  }

  it("says so without KV, and keeps the refresh owed without a GitHub token", async () => {
    assert.match((await runSnapshotRefreshOnEnv({} as Env, { dryRun: false })).summary, /HARNESS_KV not bound/);
    const { kv, map } = kvWith(OWED);
    const report = await runSnapshotRefreshOnEnv({ HARNESS_KV: kv } as Env, { dryRun: false });
    assert.match(report.summary, /GITHUB_TOKEN or GITHUB_REPO is not set\) — still owed/);
    assert.ok(map.has(REFRESH_OWED_KV_KEY));
  });
});

describe("the workflow the job starts", () => {
  const workflow = readFileSync(join(process.cwd(), "..", "..", ".github", "workflows", "figma-snapshot-refresh.yml"), "utf8");

  it("runs on the event the job sends, and by hand", () => {
    assert.match(workflow, /^\s+repository_dispatch:\r?\n\s+types: \[figma-library-published\]/m);
    assert.equal(REFRESH_EVENT, "figma-library-published");
    assert.match(workflow, /^\s+workflow_dispatch: \{\}/m);
  });

  it("runs one refresh at a time, and holds the next behind it rather than cancelling it (AC 1)", () => {
    assert.match(workflow, /^concurrency:\r?\n\s+group: figma-snapshot-refresh\r?\n\s+cancel-in-progress: false/m);
  });

  it("lets nothing from the dispatch's payload into a command", () => {
    const uses = workflow.split(/\r?\n/).filter((line) => line.includes("client_payload") && !line.trim().startsWith("#"));
    assert.deepEqual(
      uses.map((line) => line.trim()),
      ["VERSION_ID: ${{ github.event.client_payload.figma_version_id }}"],
      "only into env, where the step checks it is digits",
    );
  });

  it("tells a rate limit the script gave up on from a failure (AC 2)", () => {
    assert.match(workflow, /if \[ "\$status" -eq 75 \]; then/);
    assert.match(workflow, /Figma was busy/);
  });
});
