// The repo's library snapshot, refreshed once per publish (#898): what the
// poll leaves owed, the job that starts the refresh, and the workflow it
// starts.
//
// What an outsider sees: whether a `repository_dispatch` was sent, with which
// version, whether the refresh is still owed afterwards, and whether anyone
// was told it is stuck. The poll's side — which publishes are owed — is in
// tests/figma-library.test.ts; the job on the Worker's bindings is in
// tests/figma-snapshot-refresh-env.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  coveredBy,
  owedAfter,
  owedWith,
  REFRESH_EVENT,
  runSnapshotRefresh,
  STALL_LIMIT,
  type RefreshOwed,
  type SnapshotRefreshDeps,
} from "../src/figma-library/snapshot-refresh";
import { FIGMA_PER_MINUTE, SNAPSHOT_REFRESH_PER_MINUTE, UNO_SHARE_PER_MINUTE } from "../src/figma/rest";
import { SubrequestBudgetError } from "../src/net";

const V2 = "2210000000000000002";
const V4 = "2210000000000000004";
const V5 = "2210000000000000005";
const OWED: RefreshOwed = { versionIds: [V4, V2], since: "2026-09-29T22:00:00.000Z" };

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
    /** What a poll writes meanwhile. */
    record(next: RefreshOwed) {
      value = next;
    },
    store: {
      read: async () => ((reads += 1), value ? structuredClone(value) : null),
      update: async (change) => void (value = change(value ? structuredClone(value) : null)),
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

/** The repo and GitHub around one store: what the snapshot records, what
 *  was dispatched, and what was filed. */
function world(initial: RefreshOwed | null, opts: { answers?: Array<{ ok: boolean; status: number } | Error>; fileFails?: number } = {}) {
  const owed = owedStore(initial);
  const gh = dispatcher(opts.answers);
  let recorded: readonly string[] | Error = [];
  const filed: Array<{ title: string; body: string }> = [];
  let fileFails = opts.fileFails ?? 0;
  const deps: SnapshotRefreshDeps = {
    owed: owed.store,
    landed: async () => {
      if (recorded instanceof Error) throw recorded;
      return recorded;
    },
    dispatch: gh.dispatch,
    fileBlocked: async (issue) => {
      if (fileFails-- > 0) throw new Error("GitHub issues 502");
      filed.push(issue);
      return 900 + filed.length;
    },
  };
  return {
    owed,
    gh,
    filed,
    deps,
    /** What the repo's snapshot records, on main and the refresh branch. */
    records(ids: readonly string[] | Error) {
      recorded = ids;
    },
    night: (dryRun = false) => runSnapshotRefresh({ ...deps, dryRun }),
  };
}

describe("the snapshot refresh job", () => {
  it("sends nothing when nothing was published (AC 3)", async () => {
    const w = world(null);
    const report = await w.night();
    assert.equal(report.summary, "nothing published since the last refresh");
    assert.equal(report.dispatched, false);
    assert.deepEqual(w.gh.sent, []);
    assert.equal(w.owed.reads, 1, "one read, and nothing else");
  });

  it("starts one refresh for everything owed, with the newest version (AC 1)", async () => {
    const w = world(OWED);
    const report = await w.night();
    assert.deepEqual(w.gh.sent, [{ eventType: REFRESH_EVENT, payload: { figma_version_id: V4 } }]);
    assert.equal(report.dispatched, true);
    assert.equal(report.summary, `started the refresh for 2 publish(es), newest version ${V4}`);
  });

  it("keeps it owed until the repo's snapshot records it, then sends nothing more (AC 1)", async () => {
    const w = world(OWED);
    await w.night();
    assert.deepEqual(w.owed.value?.versionIds, [V4, V2], "GitHub taking the dispatch is not the refresh landing");

    // The run pushed the refresh branch: its snapshot records the newest.
    w.records([V4, V2, "older"]);
    const settled = await w.night();
    assert.equal(settled.summary, `the repo's snapshot records version ${V4}: nothing owed`);
    assert.equal(w.owed.value, null);
    assert.equal(w.gh.sent.length, 1, "one refresh per publish");

    await w.night();
    assert.equal(w.gh.sent.length, 1);
  });

  it("completes a run that gave up on a later night: still owed, so it is sent again (AC 2)", async () => {
    const w = world(OWED);
    await w.night();
    // The run waited out its budget on a 429 and wrote nothing (exit 75).
    const again = await w.night();
    assert.equal(again.dispatched, true);
    assert.equal(w.gh.sent.length, 2);
    assert.equal(w.owed.value?.tries, 2);

    w.records([V4]);
    await w.night();
    assert.equal(w.owed.value, null, "the later run landed it");
  });

  it("settles what landed and starts the refresh for a newer publish, counting tries from none", async () => {
    const w = world({ ...OWED, versionIds: [V5, V4, V2], tries: 2, blockedIssue: 77 });
    w.records([V4, V2]);
    const report = await w.night();
    assert.equal(report.summary, `2 landed; started the refresh for 1 publish(es), newest version ${V5}`);
    assert.deepEqual(w.gh.sent.map((s) => s.payload), [{ figma_version_id: V5 }]);
    assert.deepEqual(w.owed.value, {
      versionIds: [V5],
      since: OWED.since,
      tries: 1,
      lastTry: "GitHub accepted the dispatch, and nothing has landed since",
    });
  });

  it("starts the refresh when the repo's snapshot cannot be read, and settles nothing", async () => {
    const w = world(OWED);
    w.records(new Error("GitHub contents read 502"));
    const report = await w.night();
    assert.equal(report.dispatched, true);
    assert.deepEqual(w.owed.value?.versionIds, [V4, V2]);

    w.records(new SubrequestBudgetError(38));
    await assert.rejects(w.night(), SubrequestBudgetError);
  });

  it("keeps it owed when GitHub refuses, and the next night sends it once", async () => {
    const w = world(OWED, { answers: [{ ok: false, status: 502 }] });
    const refused = await w.night();
    assert.equal(refused.summary, "GitHub refused the dispatch (502) — still owed, so the next night tries again");
    assert.deepEqual(w.owed.value?.versionIds, OWED.versionIds);

    const retried = await w.night();
    assert.equal(retried.dispatched, true);
    assert.equal(w.gh.sent.length, 2);
  });

  it("keeps it owed when the dispatch cannot be sent, and stops on a budget stop", async () => {
    const unset = world(OWED, { answers: [new Error("GITHUB_TOKEN or GITHUB_REPO is not set")] });
    const report = await unset.night();
    assert.match(report.summary, /the dispatch failed \(GITHUB_TOKEN or GITHUB_REPO is not set\) — still owed/);
    assert.deepEqual(unset.owed.value?.versionIds, OWED.versionIds);

    const stopped = world(OWED, { answers: [new SubrequestBudgetError(38)] });
    await assert.rejects(stopped.night(), SubrequestBudgetError);
    assert.deepEqual(stopped.owed.value, OWED, "nothing written");
  });

  it(`files one automation-blocked issue after ${STALL_LIMIT} refused nights, and no second`, async () => {
    const refusals = Array.from({ length: 6 }, () => ({ ok: false, status: 403 }));
    const w = world(OWED, { answers: refusals });
    for (let night = 1; night < STALL_LIMIT; night++) await w.night();
    assert.equal(w.filed.length, 0, "a night or two of refusals is not yet a signal");

    const third = await w.night();
    assert.match(third.summary, /GitHub refused the dispatch \(403\) — still owed, so the next night tries again; filed #901$/);
    assert.equal(w.filed.length, 1);
    assert.match(w.filed[0]!.title, /^\[figma-snapshot-refresh\] blocked: /);
    assert.match(w.filed[0]!.body, new RegExp(`Last night: GitHub refused the dispatch \\(403\\)`));
    assert.match(w.filed[0]!.body, new RegExp(`Versions owed, newest first: ${V4}, ${V2}`));
    assert.equal(w.owed.value?.blockedIssue, 901);

    await w.night();
    await w.night();
    assert.equal(w.filed.length, 1, "said once");
    assert.equal(w.gh.sent.length, 5, "and still tried each night");
  });

  it("files it too for dispatches GitHub took that never landed, and tries the filing again when it fails", async () => {
    const w = world(OWED, { fileFails: 1 });
    for (let night = 1; night < STALL_LIMIT; night++) await w.night();
    const unfiled = await w.night();
    assert.match(unfiled.summary, /the blocked issue was not filed \(GitHub issues 502\), so the next night tries again$/);
    assert.equal(w.owed.value?.blockedIssue, undefined);

    await w.night();
    assert.equal(w.filed.length, 1);
    assert.match(w.filed[0]!.body, /Last night: GitHub accepted the dispatch, and nothing has landed since/);
  });

  it("says what it would start on a dry run, and sends, files and settles nothing", async () => {
    const w = world({ ...OWED, tries: STALL_LIMIT });
    const report = await w.night(true);
    assert.equal(report.summary, `would start the refresh for 2 publish(es), newest version ${V4}`);
    assert.deepEqual(w.gh.sent, []);
    assert.deepEqual(w.filed, []);

    w.records([V4]);
    await w.night(true);
    assert.deepEqual(w.owed.value?.versionIds, OWED.versionIds, "a dry run settles nothing either");
  });

  it("keeps a publish the poll recorded while the job was out", async () => {
    const w = world(OWED);
    w.records([V4]);
    const report = await runSnapshotRefresh({
      ...w.deps,
      async landed() {
        // The poll records a newer publish between this job's read and its write.
        w.owed.record(owedWith(w.owed.value, [V5], "2026-09-30T22:00:00.000Z"));
        return [V4];
      },
    });
    assert.equal(report.summary, `the repo's snapshot records version ${V4}: nothing owed`);
    assert.deepEqual(w.owed.value, { versionIds: [V5], since: OWED.since }, "the newer one is still owed");
  });

  it("merges a new publish into what is owed: newest first, each once, from the first one's date, tries kept", () => {
    assert.deepEqual(owedWith(null, ["2"], "2026-09-29T22:00:00.000Z"), { versionIds: ["2"], since: "2026-09-29T22:00:00.000Z" });
    assert.deepEqual(owedWith({ versionIds: ["2"], since: "A", tries: 2 }, ["4", "2"], "B"), { versionIds: ["4", "2"], since: "A", tries: 2 });
    assert.deepEqual(owedAfter(OWED, OWED.versionIds), null);
    assert.deepEqual(owedAfter(null, ["4"]), null);
  });

  it("counts a snapshot holding version N as holding every version before it", () => {
    assert.deepEqual(coveredBy([V5, V4, V2], [V4]), [V4, V2], "V2 fell out of the snapshot's window, but V4 came after it");
    assert.deepEqual(coveredBy([V5, V4], ["older"]), []);
    assert.deepEqual(coveredBy([V5], [V5]), [V5]);
  });
});

describe("the Action's share of Figma's Tier 1", () => {
  it("is the spacing the snapshot script paces its node fetches at, and leaves Bill his half", async () => {
    // The script is plain Node and cannot import rest.ts (its header says why),
    // so the two are held equal here.
    const script = pathToFileURL(join(process.cwd(), "..", "..", "scripts", "snapshot-figma-components.mjs")).href;
    const { NODES_SPACING_MS } = (await import(script)) as { NODES_SPACING_MS: number };
    assert.equal(NODES_SPACING_MS, 60_000 / SNAPSHOT_REFRESH_PER_MINUTE);
    assert.ok(SNAPSHOT_REFRESH_PER_MINUTE <= UNO_SHARE_PER_MINUTE[1], "never more than uno-bot's half");
    assert.ok(SNAPSHOT_REFRESH_PER_MINUTE <= FIGMA_PER_MINUTE[1] / 2, "so Bill keeps his");
  });
});

describe("the workflow the job starts", () => {
  const workflow = readFileSync(join(process.cwd(), "..", "..", ".github", "workflows", "figma-snapshot-refresh.yml"), "utf8");

  it("lets nothing from the dispatch's payload into a command", () => {
    const uses = workflow.split(/\r?\n/).filter((line) => line.includes("client_payload") && !line.trim().startsWith("#"));
    assert.deepEqual(
      uses.map((line) => line.trim()),
      ["VERSION_ID: ${{ github.event.client_payload.figma_version_id }}"],
      "only into env, where the step checks it is digits",
    );
  });
});
