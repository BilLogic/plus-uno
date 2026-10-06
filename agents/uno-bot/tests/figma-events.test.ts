// POST /figma/events, at HTTP level (#895; #891 § Seam 3).
//
// Every case sends a real `Request` and reads the `Response`. The route runs
// two ways: on named fakes — the claim backed by the real queue over in-memory
// runner storage, and KV as a map that counts its calls — and through
// `figmaEventsDepsFor` on a fake `Env`, whose AGENT_RUNNER stub hands the
// request to the real AgentRunner class over in-memory storage, whose alarm
// then runs the job. What is asserted is what an outsider sees: the status,
// what was queued, what KV holds, and what was never stored.
//
// The Worker's fetch handler itself — the one routing line in `src/index.ts`,
// which Node cannot load — is driven under workerd in
// tests/workerd/figma-events.route.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { handleFigmaEvents, writeNote, type FigmaEventsDeps, type FigmaNotes } from "../src/figma-notify/route";
import {
  CHANGED_TTL_S,
  COMMENTED_TTL_S,
  etDateOf,
  eventIdOf,
  noteFor,
  readFigmaEvent,
  type FigmaEventJob,
} from "../src/figma-notify/event";
import { FIGMA_EVENTS_RUNNER, figmaEventsDepsFor } from "../src/figma-notify/env";
import { runFigmaEventJob } from "../src/figma-notify/job";
import { createInMemoryRunnerStorage, type InMemoryRunnerStorage } from "../src/runner/storage";
import { enqueueThreadJobOnce } from "../src/runner/queue";
import { AgentRunner } from "../src/agent-runner";
import type { RunnerJobPayload } from "../src/slack/types";
import type { Env } from "../src/types";

const PASSCODE = "a-test-passcode-not-a-real-one";
const NOW = Date.parse("2026-10-03T18:00:00Z");

const COMMENT = {
  event_type: "FILE_COMMENT",
  passcode: PASSCODE,
  timestamp: "2026-10-03T16:00:00Z",
  webhook_id: "3301",
  file_key: "FILEKEY1",
  file_name: "Goal Setting / Card 2482 / Meryem",
  comment: [{ text: "Keep the progress bar hidden until the first goal is set" }],
  comment_id: "1700001",
  parent_id: "",
  created_at: "2026-10-03T16:00:00Z",
  resolved_at: "",
  mentions: [],
  triggered_by: { id: "1500001", handle: "sarah", img_url: "https://example.test/sarah.png" },
};
const UPDATE = {
  event_type: "FILE_UPDATE",
  passcode: PASSCODE,
  timestamp: "2026-10-03T17:00:00Z",
  webhook_id: "3302",
  file_key: "FILEKEY1",
  file_name: "Goal Setting / Card 2482 / Meryem",
};
const PING = { event_type: "PING", passcode: PASSCODE, timestamp: "2026-10-03T15:00:00Z", webhook_id: "3301" };

function post(body: unknown): Request {
  return new Request("https://uno-bot.test/figma/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** KV as a map, counting what the route asked of it. */
function memoryNotes() {
  const store = new Map<string, { value: { at: string }; ttlS: number }>();
  let gets = 0;
  let puts = 0;
  const notes: FigmaNotes = {
    async get(key) {
      gets += 1;
      return store.get(key)?.value ?? null;
    },
    async put(key, value, ttlS) {
      puts += 1;
      store.set(key, { value: structuredClone(value), ttlS });
    },
  };
  return { notes, store, counts: () => ({ gets, puts }) };
}

/** The route on fakes: the claim is the real queue over in-memory storage. */
function setup(over: Partial<FigmaEventsDeps> = {}) {
  const runner = createInMemoryRunnerStorage();
  const kv = memoryNotes();
  // Each delivery arrives a moment after the last, so the queue keeps their order.
  let arrivals = 0;
  const deps: FigmaEventsDeps = {
    passcode: PASSCODE,
    async enqueueOnce(eventId, event) {
      const job: RunnerJobPayload = { kind: "figma-event", event };
      const at = NOW + arrivals++;
      return (await enqueueThreadJobOnce(runner, { job, enqueuedAt: at }, eventId, at)) ? "queued" : "seen";
    },
    notes: kv.notes,
    now: () => NOW,
    ...over,
  };
  return { deps, runner, kv };
}

/** The jobs waiting on the runner, as the route queued them. */
async function queued(runner: InMemoryRunnerStorage): Promise<FigmaEventJob[]> {
  const jobs = await runner.list<{ job: RunnerJobPayload }>({ prefix: "job:" });
  return [...jobs.values()].map(({ job }) => {
    assert.equal(job.kind, "figma-event");
    return (job as Extract<RunnerJobPayload, { kind: "figma-event" }>).event;
  });
}

describe("a delivery without the right passcode", () => {
  const refused: Array<[string, unknown]> = [
    ["a wrong passcode", { ...COMMENT, passcode: "not-it" }],
    ["no passcode", { ...COMMENT, passcode: undefined }],
    ["a passcode that is not a string", { ...COMMENT, passcode: 12345 }],
    ["a body that is not JSON", "event_type=FILE_COMMENT"],
    ["a JSON body that is not an object", "[1,2,3]"],
    ["an empty body", ""],
  ];

  for (const [name, body] of refused) {
    it(`is 401 and queues and writes nothing: ${name}`, async () => {
      const { deps, runner, kv } = setup();
      const res = await handleFigmaEvents(post(body), deps);
      assert.equal(res.status, 401);
      assert.deepEqual(await queued(runner), []);
      assert.deepEqual(kv.counts(), { gets: 0, puts: 0 });
    });
  }

  it("is 401 for everything when the Worker has no passcode set, even Figma's own", async () => {
    const { deps, runner, kv } = setup({ passcode: undefined });
    for (const body of [COMMENT, UPDATE, PING]) assert.equal((await handleFigmaEvents(post(body), deps)).status, 401);
    assert.deepEqual(await queued(runner), []);
    assert.equal(kv.store.size, 0);
  });

  // Figma stops a webhook that is answered 400 for a wrong passcode, so no
  // input may produce one: a stray call must not switch off a subscription.
  it("is never answered 400, whatever arrives", async () => {
    const { deps } = setup();
    const bodies: unknown[] = [...refused.map(([, b]) => b), { passcode: PASSCODE }, { ...COMMENT, file_key: "" }, "null"];
    for (const body of bodies) assert.notEqual((await handleFigmaEvents(post(body), deps)).status, 400, JSON.stringify(body));
  });

  it("is 413 for a body past the limit, before it is read as JSON", async () => {
    const { deps } = setup();
    const res = await handleFigmaEvents(post(JSON.stringify({ ...COMMENT, pad: "x".repeat(1_000_001) })), deps);
    assert.equal(res.status, 413);
  });
});

describe("a delivery with the right passcode", () => {
  it("queues one job for a new comment, writes the commented-today note, and answers 200", async () => {
    const { deps, runner, kv } = setup();
    const res = await handleFigmaEvents(post(COMMENT), deps);
    assert.equal(res.status, 200);
    assert.deepEqual(await queued(runner), [
      {
        eventId: "comment:1700001",
        type: "FILE_COMMENT",
        webhookId: "3301",
        fileKey: "FILEKEY1",
        commentId: "1700001",
        userId: "1500001",
        at: "2026-10-03T16:00:00Z",
      },
    ]);
    assert.deepEqual([...kv.store.entries()], [
      ["figma-notify:commented:2026-10-03:FILEKEY1", { value: { at: "2026-10-03T16:00:00Z" }, ttlS: COMMENTED_TTL_S }],
    ]);
    assert.equal(COMMENTED_TTL_S, 8 * 24 * 60 * 60);
  });

  it("answers a redelivery 200 and does nothing: no second job, no KV call", async () => {
    const { deps, runner, kv } = setup();
    await handleFigmaEvents(post(COMMENT), deps);
    const before = kv.counts();
    const again = await handleFigmaEvents(post(COMMENT), deps);
    assert.equal(again.status, 200);
    assert.equal((await queued(runner)).length, 1);
    assert.deepEqual(kv.counts(), before);
  });

  it("queues a job per comment, and writes a file's note once a day", async () => {
    const { deps, runner, kv } = setup();
    await handleFigmaEvents(post(COMMENT), deps);
    await handleFigmaEvents(post({ ...COMMENT, comment_id: "1700002", parent_id: "1700001" }), deps);
    const jobs = await queued(runner);
    assert.deepEqual(jobs.map((j) => [j.commentId, j.parentId]), [["1700001", undefined], ["1700002", "1700001"]]);
    assert.equal(kv.counts().puts, 1, "the second comment found the day's note there");
  });

  it("reads a resolution as an event of its own, not a repeat of the comment", async () => {
    const { deps, runner } = setup();
    await handleFigmaEvents(post(COMMENT), deps);
    await handleFigmaEvents(post({ ...COMMENT, resolved_at: "2026-10-04T14:00:00Z", timestamp: "2026-10-04T14:00:00Z" }), deps);
    assert.deepEqual((await queued(runner)).map((j) => j.eventId), ["comment:1700001", "comment:1700001:resolved:2026-10-04T14:00:00Z"]);
  });

  it("queues a resolution but leaves no commented note: a day of only resolutions is not a day of comments", async () => {
    const { deps, runner, kv } = setup();
    await handleFigmaEvents(post({ ...COMMENT, resolved_at: "2026-10-04T14:00:00Z", timestamp: "2026-10-04T14:00:00Z" }), deps);
    assert.deepEqual((await queued(runner)).map((j) => j.eventId), ["comment:1700001:resolved:2026-10-04T14:00:00Z"]);
    assert.equal(kv.store.size, 0);
    assert.deepEqual(kv.counts(), { gets: 0, puts: 0 });
  });

  it("dates a comment on the team's day: 22:30 ET is still that day", async () => {
    const { deps, kv } = setup();
    // 02:30 UTC on Oct 4 is 22:30 EDT on Oct 3.
    await handleFigmaEvents(post({ ...COMMENT, created_at: "2026-10-04T02:30:00Z", timestamp: "2026-10-04T02:30:00Z" }), deps);
    assert.deepEqual([...kv.store.keys()], ["figma-notify:commented:2026-10-03:FILEKEY1"]);
    assert.equal(etDateOf(Date.parse("2026-12-04T04:30:00Z")), "2026-12-03", "and 23:30 EST too");
  });

  it("queues a job for a file change and moves the file's last-change note forward only", async () => {
    const { deps, runner, kv } = setup();
    await handleFigmaEvents(post(UPDATE), deps);
    assert.deepEqual(await queued(runner), [
      { eventId: "update:FILEKEY1:2026-10-03T17:00:00Z", type: "FILE_UPDATE", webhookId: "3302", fileKey: "FILEKEY1", at: "2026-10-03T17:00:00Z" },
    ]);
    assert.deepEqual(kv.store.get("figma-notify:changed:FILEKEY1"), { value: { at: "2026-10-03T17:00:00Z" }, ttlS: CHANGED_TTL_S });
    assert.equal(CHANGED_TTL_S, 30 * 24 * 60 * 60);

    // A later change moves it; an earlier one, arriving late, does not.
    await handleFigmaEvents(post({ ...UPDATE, timestamp: "2026-10-03T19:00:00Z" }), deps);
    await handleFigmaEvents(post({ ...UPDATE, timestamp: "2026-10-03T18:00:00Z" }), deps);
    assert.equal(kv.store.get("figma-notify:changed:FILEKEY1")?.value.at, "2026-10-03T19:00:00Z");
    assert.equal((await queued(runner)).length, 3, "each change is still its own event");
  });

  it("answers a PING 200 and queues nothing — what a new subscription sends", async () => {
    const { deps, runner, kv } = setup();
    assert.equal((await handleFigmaEvents(post(PING), deps)).status, 200);
    assert.deepEqual(await queued(runner), []);
    assert.equal(kv.store.size, 0);
  });

  it("answers an event nobody subscribed to 200 and does nothing", async () => {
    const { deps, runner, kv } = setup();
    const version = { ...UPDATE, event_type: "FILE_VERSION_UPDATE", version_id: "77" };
    assert.equal((await handleFigmaEvents(post(version), deps)).status, 200);
    assert.deepEqual(await queued(runner), []);
    assert.equal(kv.store.size, 0);
  });

  it("answers a file event missing its ids 200 and drops it: a retry would carry the same gap", async () => {
    const { deps, runner } = setup();
    for (const body of [{ ...COMMENT, comment_id: "" }, { ...COMMENT, file_key: undefined }, { ...UPDATE, timestamp: "not a time" }]) {
      assert.equal((await handleFigmaEvents(post(body), deps)).status, 200);
    }
    assert.deepEqual(await queued(runner), []);
  });

  it("answers 503 with nothing written when the runner refuses, so Figma retries a first delivery", async () => {
    const { deps, kv } = setup({
      enqueueOnce: async () => {
        throw new Error("the runner refused the enqueue: 500");
      },
    });
    assert.equal((await handleFigmaEvents(post(COMMENT), deps)).status, 503);
    assert.equal(kv.store.size, 0);
  });

  it("still answers 200 when the job is queued and only its note fails", async () => {
    const { deps, runner } = setup({
      notes: {
        get: async () => null,
        put: async () => {
          throw new Error("KV put failed: 429");
        },
      },
    });
    assert.equal((await handleFigmaEvents(post(COMMENT), deps)).status, 200);
    assert.equal((await queued(runner)).length, 1);
  });

  // ADR-030: ids and timestamps, never words.
  it("keeps no comment text, file name or handle — in the job or in KV", async () => {
    const { deps, runner, kv } = setup();
    await handleFigmaEvents(post(COMMENT), deps);
    await handleFigmaEvents(post(UPDATE), deps);
    const kept = JSON.stringify({ jobs: await queued(runner), kv: [...kv.store.entries()] });
    for (const word of ["progress bar", "Goal Setting", "Meryem", "sarah", "example.test", PASSCODE]) {
      assert.ok(!kept.includes(word), `"${word}" was kept: ${kept}`);
    }
  });
});

describe("reading a payload", () => {
  it("takes ids sent as numbers", () => {
    const event = readFigmaEvent({ ...COMMENT, comment_id: 1700001, webhook_id: 3301, parent_id: 1700000 });
    assert.equal(event?.type, "FILE_COMMENT");
    if (event?.type !== "FILE_COMMENT") return;
    assert.equal(event.commentId, "1700001");
    assert.equal(event.parentId, "1700000");
    assert.equal(eventIdOf(event), "comment:1700001");
  });

  it("dates a comment that carries no time of its own by now", () => {
    const event = readFigmaEvent({ ...COMMENT, created_at: undefined, timestamp: undefined });
    assert.equal(event?.type, "FILE_COMMENT");
    if (event?.type !== "FILE_COMMENT") return;
    assert.equal(noteFor(event, NOW)?.key, "figma-notify:commented:2026-10-03:FILEKEY1");
  });

  it("writes a last-change note over one it cannot read", async () => {
    const { notes, store } = memoryNotes();
    store.set("figma-notify:changed:F", { value: { at: "garbled" }, ttlS: 1 });
    assert.equal(await writeNote(notes, { key: "figma-notify:changed:F", at: "2026-10-03T17:00:00Z", ttlS: 9, write: "if-newer" }), true);
  });
});

describe("the route on the Worker's bindings", () => {
  /** A fake Env: KV in a map, and an AGENT_RUNNER whose stub is the real
   *  AgentRunner over in-memory storage. */
  function workerEnv(over: Partial<Env> = {}) {
    const storage = createInMemoryRunnerStorage();
    const kv = new Map<string, { value: string; ttl?: number }>();
    const names: string[] = [];
    let runner: AgentRunner | undefined;
    const env = {
      FIGMA_WEBHOOK_PASSCODE: PASSCODE,
      HARNESS_KV: {
        async get(key: string, type?: string) {
          const hit = kv.get(key);
          if (!hit) return null;
          return type === "json" ? JSON.parse(hit.value) : hit.value;
        },
        async put(key: string, value: string, opts?: { expirationTtl?: number }) {
          kv.set(key, { value, ...(opts?.expirationTtl ? { ttl: opts.expirationTtl } : {}) });
        },
      },
      AGENT_RUNNER: {
        idFromName: (name: string) => {
          names.push(name);
          return name;
        },
        get: () => ({ fetch: (url: string, init: RequestInit) => runner!.fetch(new Request(url, init)) }),
      },
      ...over,
    } as unknown as Env;
    runner = new AgentRunner({ storage } as unknown as DurableObjectState, env);
    return { env, storage, kv, names, runner };
  }

  it("claims on the figma/events runner, writes KV with its expiry, and the alarm runs the job", async () => {
    const w = workerEnv();
    const res = await handleFigmaEvents(post(COMMENT), figmaEventsDepsFor(w.env));
    assert.equal(res.status, 200);
    assert.deepEqual(w.names, [FIGMA_EVENTS_RUNNER]);
    assert.equal((await w.storage.list({ prefix: "job:" })).size, 1);
    const note = [...w.kv.entries()];
    assert.equal(note.length, 1);
    assert.equal(note[0]![0], "figma-notify:commented:2026-10-03:FILEKEY1");
    assert.deepEqual(JSON.parse(note[0]![1].value), { at: "2026-10-03T16:00:00Z" });
    assert.equal(note[0]![1].ttl, COMMENTED_TTL_S);

    // A redelivery reaches the same runner and is refused there.
    assert.equal((await handleFigmaEvents(post(COMMENT), figmaEventsDepsFor(w.env))).status, 200);
    assert.equal((await w.storage.list({ prefix: "job:" })).size, 1);

    // The alarm drains it: one job, handled, gone.
    assert.notEqual(w.storage.takeAlarm(), null);
    await w.runner.alarm();
    assert.equal((await w.storage.list({ prefix: "job:" })).size, 0);
  });

  it("is 401 with nothing queued when the secret is unset", async () => {
    const w = workerEnv({ FIGMA_WEBHOOK_PASSCODE: undefined });
    assert.equal((await handleFigmaEvents(post(COMMENT), figmaEventsDepsFor(w.env))).status, 401);
    assert.deepEqual(w.names, []);
    assert.equal(w.kv.size, 0);
  });

  it("queues the job and writes no note on a Worker without KV", async () => {
    const w = workerEnv({ HARNESS_KV: undefined });
    assert.equal((await handleFigmaEvents(post(COMMENT), figmaEventsDepsFor(w.env))).status, 200);
    assert.equal((await w.storage.list({ prefix: "job:" })).size, 1);
  });
});

describe("the queued job", () => {
  it("says what it ran on, by id", async () => {
    const line = await runFigmaEventJob({
      eventId: "comment:2",
      type: "FILE_COMMENT",
      webhookId: "3301",
      fileKey: "FILEKEY1",
      commentId: "2",
      parentId: "1",
    });
    assert.match(line, /^\[figma-notify\] FILE_COMMENT on FILEKEY1: comment 2, a reply to 1/);
  });
});
