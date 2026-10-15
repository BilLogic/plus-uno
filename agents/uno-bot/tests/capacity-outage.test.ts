// A capacity outage, told to the lead only when it lasts (#1228).
//
// Driven over the module's own dependencies: the serialised in-memory store
// (the Durable Object's stand-in; its own serialisation is the workerd
// suite's), a hint that counts its reads and writes, a recording DM and a
// clock the test moves.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capacityOutage,
  inMemoryOutageStore,
  NOT_WATCHED,
  outageForPlace,
  outageOnFailure,
  watchCapacity,
  type OutageDeps,
  type OutageStore,
} from "../src/turn/capacity-outage";
import { ModelCallError, isCapacityFailure } from "../src/agent/model-provider";

const MIN = 60_000;
const T0 = Date.UTC(2026, 9, 14, 15, 0);

function harness(opts: { refuse?: () => boolean } = {}) {
  const inner = inMemoryOutageStore();
  const calls = { store: 0, hintReads: 0, hintWrites: 0 };
  const store: OutageStore = {
    failed: (at) => (calls.store++, inner.failed(at)),
    succeeded: (at) => (calls.store++, inner.succeeded(at)),
    release: (told) => (calls.store++, inner.release(told)),
  };
  let up = false;
  let now = T0;
  const dms: Array<{ to: string; text: string }> = [];
  const deps: OutageDeps = {
    lead: "ULEAD",
    models: "gemini-3.8-flash and its backup, gemini-3.7-flash",
    store,
    hint: {
      isUp: async () => (calls.hintReads++, up),
      raise: async () => void (calls.hintWrites++, (up = true)),
      lower: async () => void (calls.hintWrites++, (up = false)),
    },
    async dm(to, text) {
      if (opts.refuse?.()) return { ok: false, error: "channel_not_found" };
      dms.push({ to, text });
      return { ok: true };
    },
    now: () => now,
  };
  return {
    outage: capacityOutage(deps),
    dms,
    calls,
    held: () => inner.held(),
    at(minutes: number) {
      now = T0 + minutes * MIN;
    },
    async failAt(...minutes: number[]) {
      for (const m of minutes) {
        this.at(m);
        await this.outage.failed();
      }
    },
  };
}

test("a first failure is recorded, and nobody is told", async () => {
  const h = harness();
  await h.failAt(0);
  assert.deepEqual(h.dms, []);
  assert.equal(h.held()?.asks, 1);
});

test("a 5-minute blip gives no DM, and the next success clears it quietly", async () => {
  const h = harness();
  await h.failAt(0, 2, 5);
  h.at(6);
  await h.outage.succeeded();
  assert.deepEqual(h.dms, []);
  assert.equal(h.held(), null);
});

test("failures over 30 minutes give exactly one DM, then one recovery line on the next success", async () => {
  const h = harness();
  await h.failAt(0, 8, 16, 24, 31, 35, 39);
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
  assert.equal(h.held(), null);

  h.at(53);
  await h.outage.succeeded();
  assert.equal(h.dms.length, 2, "and nothing after it");
});

test("an outage that cleared at 2am with no turn to see it closes at the 9am failure, which starts a new one", async () => {
  const h = harness();
  // 01:00 to 01:40: an outage, told at 01:31. Its last failure is 01:40.
  await h.failAt(600, 608, 616, 624, 631, 640);
  assert.equal(h.dms.length, 1);
  // Overnight only scheduled jobs run, and they are not turns: nothing closes it.
  // 09:00: a new failure. The old outage is over, measured to its last failure.
  await h.failAt(1080);
  assert.equal(h.dms.length, 2);
  assert.match(h.dms[1]!.text, /^Back to normal/);
  assert.match(h.dms[1]!.text, /40 minutes/);
  assert.deepEqual(h.held(), { first: T0 + 1080 * MIN, last: T0 + 1080 * MIN, asks: 1 }, "a fresh outage, untold");
  // And the new one, once it lasts, gets its own DM.
  await h.failAt(1088, 1096, 1104, 1111);
  assert.equal(h.dms.length, 3);
  assert.match(h.dms[2]!.text, /31 minutes/);
  assert.match(h.dms[2]!.text, /5 asks/);
});

test("a success long after a told outage's last failure measures it to that failure", async () => {
  const h = harness();
  await h.failAt(0, 8, 16, 24, 31);
  h.at(300);
  await h.outage.succeeded();
  assert.match(h.dms[1]!.text, /31 minutes/);
});

test("a gap of more than 10 minutes before anyone was told starts a new outage", async () => {
  const h = harness();
  await h.failAt(0, 25, 33);
  assert.deepEqual(h.dms, [], "first failure of this run was 25, so 8 minutes, not 33");
  assert.equal(h.held()?.first, T0 + 25 * MIN);
});

test("a told outage with failures inside the quiet period stays one outage", async () => {
  const h = harness();
  await h.failAt(0, 10, 20, 30, 55, 80);
  assert.equal(h.dms.length, 1, "no second DM for the same outage");
  assert.equal(h.held()?.asks, 6);
});

test("a failing turn makes one store call and one hint write", async () => {
  const h = harness();
  for (const m of [0, 9, 18, 27, 31]) {
    const before = { ...h.calls };
    await h.failAt(m);
    assert.equal(h.calls.store - before.store, 1, `store calls at ${m}`);
    assert.ok(h.calls.hintWrites - before.hintWrites <= 1, `hint writes at ${m}`);
    assert.equal(h.calls.hintReads - before.hintReads, 0, `hint reads at ${m}`);
  }
});

test("a normal success reads the hint once and calls nothing else", async () => {
  const h = harness();
  await h.outage.succeeded();
  assert.deepEqual(h.calls, { store: 0, hintReads: 1, hintWrites: 0 });
});

test("a refused DM gives its claim back, so the lead still hears exactly once", async () => {
  let refuse = true;
  const h = harness({ refuse: () => refuse });
  await h.failAt(0, 8, 16, 24, 31);
  assert.deepEqual(h.dms, []);
  assert.equal(h.held()?.told, undefined, "the claim was released");
  refuse = false;
  await h.failAt(35, 36);
  assert.equal(h.dms.length, 1);
});

test("failures arriving together are handed the DM once", async () => {
  const store = inMemoryOutageStore();
  await store.failed(T0);
  for (const m of [8, 16, 24]) await store.failed(T0 + m * MIN);
  const steps = await Promise.all([31, 31, 31, 32].map((m) => store.failed(T0 + m * MIN)));
  assert.equal(steps.filter((s) => s.tell).length, 1);
});

test("the claim a refused DM releases is only its own", async () => {
  const { record } = outageOnFailure({ first: 0, last: 0, asks: 1, told: 5 }, 1);
  assert.equal(record.told, 5);
});

test("the bookkeeping never breaks the turn it rides on", async () => {
  const broken = async () => {
    throw new Error("store down");
  };
  const outage = capacityOutage({
    lead: "ULEAD",
    models: "m",
    store: { failed: broken, succeeded: broken, release: broken },
    hint: { isUp: async () => true, raise: broken, lower: broken },
    dm: async () => ({ ok: true }),
    now: () => 0,
  });
  await outage.failed();
  await outage.succeeded();
});

// ── What counts as capacity ──────────────────────────────────────────────────

test("capacity is the model call's status or status word, never an error's words", () => {
  assert.equal(isCapacityFailure(new ModelCallError("gemini", 429, "Resource has been exhausted")), true);
  assert.equal(isCapacityFailure(new ModelCallError("gemini", 503, "The model is overloaded")), true);
  assert.equal(isCapacityFailure(new ModelCallError("vertex-claude", 529, "Overloaded")), true);
  assert.equal(isCapacityFailure(new ModelCallError("gemini", 400, "x", "RESOURCE_EXHAUSTED")), true);
  assert.equal(isCapacityFailure(new ModelCallError("gemini", 500, "Internal")), false);
  assert.equal(isCapacityFailure(new ModelCallError("gemini", 400, "Invalid argument")), false);
  // A tool's or a source's failure reads like capacity and is not.
  assert.equal(isCapacityFailure(new Error("notion 503: Service Unavailable")), false);
  assert.equal(isCapacityFailure(new Error("429 Too Many Requests: quota")), false);
  assert.equal(isCapacityFailure("UNAVAILABLE"), false);
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
  assert.equal(await watchCapacity(r.outage, async () => "answer"), "answer");
  assert.deepEqual(r.calls, ["succeeded"]);
});

test("a capacity failure is recorded and still thrown, so the asker gets the plain line", async () => {
  const r = recordingOutage();
  await assert.rejects(
    watchCapacity(r.outage, async () => {
      throw new ModelCallError("gemini", 429, "Resource has been exhausted (e.g. check quota).");
    }),
    /gemini 429/,
  );
  assert.deepEqual(r.calls, ["failed"]);
});

test("any other failure is neither an outage nor a recovery, whatever it says", async () => {
  for (const err of [new ModelCallError("gemini", 400, "Invalid argument"), new Error("Service Unavailable (503)")]) {
    const r = recordingOutage();
    await assert.rejects(
      watchCapacity(r.outage, async () => {
        throw err;
      }),
    );
    assert.deepEqual(r.calls, []);
  }
});

test("test traffic neither counts toward an outage nor closes one", () => {
  const real = recordingOutage().outage;
  const ids = ["CSANDBOX"];
  assert.equal(outageForPlace({ origin: "debug", channel: "", testChannelIds: ids }, () => real), NOT_WATCHED);
  assert.equal(outageForPlace({ origin: "slack", channel: "CSANDBOX", testChannelIds: ids }, () => real), NOT_WATCHED);
  assert.equal(outageForPlace({ origin: "slack", channel: "CDESIGN", testChannelIds: ids }, () => real), real);
  assert.equal(outageForPlace({ origin: "figma", channel: "CDESIGN", testChannelIds: ids }, () => real), real);
});

test("a sandbox turn's capacity failure and answer leave a real outage as it was", async () => {
  const h = harness();
  await h.failAt(0, 8);
  const sandbox = outageForPlace({ origin: "slack", channel: "CSANDBOX", testChannelIds: ["CSANDBOX"] }, () => h.outage);
  await assert.rejects(watchCapacity(sandbox, async () => {
    throw new ModelCallError("gemini", 429, "quota");
  }));
  await watchCapacity(sandbox, async () => "answer");
  assert.equal(h.held()?.asks, 2, "not counted, and not closed");
});
