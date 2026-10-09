// The snapshot refresh job on the Worker's bindings (#898): KV in memory and
// GitHub behind a fetch stub, so what is checked is the wire — which files it
// reads to learn what landed, and what it sends.
//
// The stub is installed before the Worker's modules load: `net.ts` binds
// `fetch` once, at import.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { RefreshOwed } from "../src/figma-library/snapshot-refresh";

const V2 = "2210000000000000002";
const V4 = "2210000000000000004";
const OWED: RefreshOwed = { versionIds: [V4, V2], since: "2026-09-29T22:00:00.000Z" };

/** What GitHub holds: the snapshot's version ids on main and on the refresh
 *  branch (absent, a 404). */
const github: { main: string[]; branch: string[] | null; requests: string[] } = { main: [], branch: null, requests: [] };

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  github.requests.push(`${init?.method ?? "GET"} ${url}`);
  if (url.endsWith("/dispatches")) return new Response(null, { status: 204 });
  if (url.includes("/contents/scripts/figma-component-snapshot.json")) {
    const ids = url.includes("?ref=") ? github.branch : github.main;
    if (!ids) return new Response("{}", { status: 404 });
    return new Response(JSON.stringify({ versionIds: ids.map((id) => ({ id, label: "Components published" })) }));
  }
  throw new Error(`unexpected fetch: ${url}`);
}) as typeof fetch;

/** A HARNESS_KV holding `owed`, in memory. */
function kvWith(owed: RefreshOwed | null) {
  const map = new Map<string, string>(owed ? [["figma-poll:refresh-owed", JSON.stringify(owed)]] : []);
  const kv = {
    get: async (key: string) => (map.has(key) ? JSON.parse(map.get(key)!) : null),
    put: async (key: string, value: string) => void map.set(key, value),
    delete: async (key: string) => void map.delete(key),
  } as unknown as KVNamespace;
  return { kv, map };
}

const CONFIGURED = { GITHUB_TOKEN: "t", GITHUB_REPO: "BilLogic/plus-uno" };

describe("the snapshot refresh job on the Worker's bindings", () => {
  it("says so without KV, and keeps the refresh owed without a GitHub token", async () => {
    const { runSnapshotRefreshOnEnv } = await import("../src/figma-library/env.js");
    assert.match((await runSnapshotRefreshOnEnv({} as Env, { dryRun: false })).summary, /HARNESS_KV not bound/);
    const { kv, map } = kvWith(OWED);
    const report = await runSnapshotRefreshOnEnv({ HARNESS_KV: kv } as Env, { dryRun: false });
    assert.match(report.summary, /GITHUB_TOKEN or GITHUB_REPO is not set\) — still owed/);
    assert.ok(map.has("figma-poll:refresh-owed"));
  });

  it("reads the snapshot on main and on the refresh branch, and sends the dispatch when neither records it", async () => {
    const { runSnapshotRefreshOnEnv } = await import("../src/figma-library/env.js");
    Object.assign(github, { main: ["older"], branch: null, requests: [] });
    const { kv, map } = kvWith(OWED);
    const report = await runSnapshotRefreshOnEnv({ HARNESS_KV: kv, ...CONFIGURED } as unknown as Env, { dryRun: false });
    assert.equal(report.summary, `started the refresh for 2 publish(es), newest version ${V4}`);
    assert.deepEqual(github.requests.sort(), [
      "GET https://api.github.com/repos/BilLogic/plus-uno/contents/scripts/figma-component-snapshot.json",
      "GET https://api.github.com/repos/BilLogic/plus-uno/contents/scripts/figma-component-snapshot.json?ref=chore%2Ffigma-snapshot-refresh",
      "POST https://api.github.com/repos/BilLogic/plus-uno/dispatches",
    ]);
    assert.deepEqual((JSON.parse(map.get("figma-poll:refresh-owed")!) as RefreshOwed).versionIds, [V4, V2], "owed until it lands");
  });

  it("settles a refresh the branch's draft PR records, and sends nothing", async () => {
    const { runSnapshotRefreshOnEnv } = await import("../src/figma-library/env.js");
    Object.assign(github, { main: ["older"], branch: [V4, V2, "older"], requests: [] });
    const { kv, map } = kvWith(OWED);
    const report = await runSnapshotRefreshOnEnv({ HARNESS_KV: kv, ...CONFIGURED } as unknown as Env, { dryRun: false });
    assert.equal(report.summary, `the repo's snapshot records version ${V4}: nothing owed`);
    assert.ok(!map.has("figma-poll:refresh-owed"));
    assert.ok(!github.requests.some((r) => r.startsWith("POST")));
  });
});
