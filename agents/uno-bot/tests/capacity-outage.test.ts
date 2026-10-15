// A capacity outage, told to the lead only when it lasts (#1228).
//
// Driven over the module's own dependencies: a one-key store that counts its
// reads and writes, a recording DM and a clock the test moves.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capacityOutage,
  watchCapacity,
  type OutageDeps,
  type OutageRecord,
} from "../src/turn/capacity-outage";
import { isCapacityError } from "../src/slack/delivery";

const MIN = 60_000;

function harness(opts: { lead?: string | null } = {}) {
  let stored: OutageRecord | null = null;
  let now = Date.UTC(2026, 9, 14, 15, 0);
  const dms: Array<{ to: string; text: string }> = [];
  const ops = { reads: 0, writes: 0 };
  const deps: OutageDeps = {
    lead: opts.lead === undefined ? "ULEAD" : opts.lead,
    models: "gemini-3.8-flash and its backup, gemini-3.7-flash",
    async read() {
      ops.reads++;
      return stored ? { ...stored } : null;
    },
    async write(record) {
      ops.writes++;
      stored = record ? { ...record } : null;
    },
    async dm(to, text) {
      dms.push({ to, text });
      return { ok: true };
    },
    now: () => now,
  };
  return {
    outage: capacityOutage(deps),
    dms,
    ops,
    stored: () => stored,
    at(minutes: number) {
      now = Date.UTC(2026, 9, 14, 15, 0) + minutes * MIN;
    },
  };
}

test("a first failure is recorded, and nobody is told", async () => {
  const h = harness();
  await h.outage.failed();
  assert.deepEqual(h.dms, []);
  assert.equal(h.stored()?.asks, 1);
});

test("a 5-minute blip gives no DM, and the next success clears it quietly", async () => {
  const h = harness();
  for (const m of [0, 2, 5]) {
    h.at(m);
    await h.outage.failed();
  }
  h.at(6);
  await h.outage.succeeded();
  assert.deepEqual(h.dms, []);
  assert.equal(h.stored(), null);
});

test("failures over 30 minutes give exactly one DM, then one recovery line on the next success", async () => {
  const h = harness();
  for (const m of [0, 8, 16, 24, 31, 35, 39]) {
    h.at(m);
    await h.outage.failed();
  }
  assert.equal(h.dms.length, 1, "one DM for the outage");
  assert.equal(h.dms[0]!.to, "ULEAD");
  assert.match(h.dms[0]!.text, /31 minutes/);
  assert.match(h.dms[0]!.text, /5 asks/);
  assert.match(h.dms[0]!.text, /gemini-3\.8-flash/);
  assert.match(h.dms[0]!.text, /Quotas/);

  h.at(52);
  await h.outage.succeeded();
  assert.equal(h.dms.length, 2, "one recovery line");
  assert.equal(h.dms[1]!.to, "ULEAD");
  assert.match(h.dms[1]!.text, /^Back to normal/);
  assert.match(h.dms[1]!.text, /52 minutes/);
  assert.equal(h.stored(), null);

  h.at(53);
  await h.outage.succeeded();
  assert.equal(h.dms.length, 2, "and nothing after it");
});

test("a gap of more than 10 minutes before anyone was told starts a new outage", async () => {
  const h = harness();
  h.at(0);
  await h.outage.failed();
  h.at(25);
  await h.outage.failed();
  h.at(33);
  await h.outage.failed();
  assert.deepEqual(h.dms, [], "first failure of this run was 25, so 8 minutes, not 33");
  assert.equal(h.stored()?.first, Date.UTC(2026, 9, 14, 15, 25));
});

test("an outage already told stays the same outage until a turn succeeds", async () => {
  const h = harness();
  for (const m of [0, 10, 20, 30]) {
    h.at(m);
    await h.outage.failed();
  }
  h.at(120);
  await h.outage.failed();
  assert.equal(h.dms.length, 1, "no second DM for the same outage");
  assert.equal(h.stored()?.asks, 5);
});

test("a failing turn costs at most one read and one write", async () => {
  const h = harness();
  for (const m of [0, 9, 18, 27, 31]) {
    h.at(m);
    const before = { ...h.ops };
    await h.outage.failed();
    assert.ok(h.ops.reads - before.reads <= 1, `reads at ${m}`);
    assert.ok(h.ops.writes - before.writes <= 1, `writes at ${m}`);
  }
});

test("a success with no outage on record reads once and writes nothing", async () => {
  const h = harness();
  await h.outage.succeeded();
  assert.deepEqual(h.ops, { reads: 1, writes: 0 });
});

test("with no lead, the outage is kept but nobody is DMed", async () => {
  const h = harness({ lead: null });
  for (const m of [0, 8, 16, 24, 31]) {
    h.at(m);
    await h.outage.failed();
  }
  h.at(40);
  await h.outage.succeeded();
  assert.deepEqual(h.dms, []);
});

test("a DM that fails is tried again on the next failure, so the lead still hears once", async () => {
  let refuse = true;
  const deps: OutageDeps = {
    lead: "ULEAD",
    models: "m",
    read: async () => stored,
    write: async (r) => void (stored = r),
    dm: async (to, text) => {
      if (refuse) return { ok: false, error: "channel_not_found" };
      sent.push({ to, text });
      return { ok: true };
    },
    now: () => now,
  };
  let stored: OutageRecord | null = null;
  let now = 0;
  const sent: Array<{ to: string; text: string }> = [];
  const outage = capacityOutage(deps);
  for (const m of [0, 8, 16, 24, 31]) {
    now = m * MIN;
    await outage.failed();
  }
  assert.deepEqual(sent, []);
  refuse = false;
  now = 35 * MIN;
  await outage.failed();
  now = 36 * MIN;
  await outage.failed();
  assert.equal(sent.length, 1);
});

test("the bookkeeping never breaks the turn it rides on", async () => {
  const outage = capacityOutage({
    lead: "ULEAD",
    models: "m",
    read: async () => {
      throw new Error("KV down");
    },
    write: async () => {
      throw new Error("KV down");
    },
    dm: async () => ({ ok: true }),
    now: () => 0,
  });
  await outage.failed();
  await outage.succeeded();
});

// ── The watch around a turn's model run ──────────────────────────────────────

function recordingOutage() {
  const calls: string[] = [];
  return {
    calls,
    outage: {
      failed: async () => void calls.push("failed"),
      succeeded: async () => void calls.push("succeeded"),
    },
  };
}

test("a run that answers is a success", async () => {
  const r = recordingOutage();
  assert.equal(await watchCapacity(r.outage, isCapacityError, async () => "answer"), "answer");
  assert.deepEqual(r.calls, ["succeeded"]);
});

test("a capacity failure is recorded and still thrown, so the asker gets the plain line", async () => {
  const r = recordingOutage();
  await assert.rejects(
    watchCapacity(r.outage, isCapacityError, async () => {
      throw new Error("gemini 429: Resource has been exhausted (e.g. check quota).");
    }),
    /429/,
  );
  assert.deepEqual(r.calls, ["failed"]);
});

test("any other failure is neither an outage nor a recovery", async () => {
  const r = recordingOutage();
  await assert.rejects(
    watchCapacity(r.outage, isCapacityError, async () => {
      throw new Error("gemini 400: Invalid argument");
    }),
    /400/,
  );
  assert.deepEqual(r.calls, []);
});
