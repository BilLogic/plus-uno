// Reminders learn from people's answers: the end-of-day detector is shown the
// newest commitments people marked 🤔 (not a promise) and 🙌 (done), as the
// detector's own short summaries, so it misreads fewer messages as promises.
//
// Runs the real sweep over the sweep harness's fake Slack, the real detector
// over a fake provider that records each request, and the in-memory store.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob } from "../src/sweep/index";
import type { ChannelKind } from "../src/sweep/finding";
import {
  commitmentThreadHook,
  createInMemoryCommitmentStore,
  fewShotBlock,
  MAX_FEW_SHOT_PER_ANSWER,
  modelCommitmentDetector,
  type CommitmentState,
  type InMemoryCommitmentStore,
} from "../src/commitments/index";
import { commitmentRow } from "./helpers/commitment-records-conformance";
import { at, DESIGN, msg, sweepHarness, ts, UNO_BOT } from "./helpers/sweep-harness";

const EOD: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const BEA = "U0BEA";
const MAYA = "U0MAYA";
const ROOT = ts(29, 14);
const PROMISE = ts(29, 15);

/** An answered commitment, with its summary in the text store. */
async function answered(
  store: InMemoryCommitmentStore,
  o: { id: string; state: CommitmentState; resolvedAt: number; what?: string | null; channel?: string; channelKind?: ChannelKind },
): Promise<void> {
  await store.addCommitments([
    commitmentRow({
      id: o.id,
      messageTs: o.id,
      channel: o.channel ?? DESIGN,
      channelKind: o.channelKind ?? "public",
      state: o.state,
      resolvedAt: o.resolvedAt,
    }),
  ]);
  if (o.what !== null) await store.saveText(o.id, { what: o.what ?? `task ${o.id}`, bodies: {} }, Number.MAX_SAFE_INTEGER);
}

/** Tuesday's end-of-day sweep of #design over one thread holding a promise. */
async function sweep(store: InMemoryCommitmentStore, opts: { fewShot?: number; text?: string } = {}) {
  const provider = fakeProvider({ generateReplies: [JSON.stringify({ commitments: [] })] });
  const h = sweepHarness({
    channels: {
      [DESIGN]: {
        kind: "public",
        history: [msg(BEA, ROOT, "Where are the updated reflection screens?", { reply_count: 1, latest_reply: PROMISE })],
        threads: {
          [ROOT]: [msg(BEA, ROOT, "Where are the updated reflection screens?"), msg(MAYA, PROMISE, opts.text ?? "I'll share the Figma link by Thu.")],
        },
      },
    },
    now: at(29, 22),
  });
  h.deps.onThread = commitmentThreadHook({
    detector: modelCommitmentDetector(provider),
    store,
    config: { unoBot: UNO_BOT, ...(opts.fewShot !== undefined ? { fewShot: opts.fewShot } : {}) },
    now: () => h.clock.now,
  });
  await runSweepJob(EOD, h.deps);
  return provider;
}

const promptOf = (provider: ReturnType<typeof fakeProvider>) => {
  assert.equal(provider.generated.length, 1);
  return provider.generated[0]!.prompt;
};

describe("the detector learns from people's answers", () => {
  it("carries the newest 🤔 and 🙌 summaries, capped at the configured count, newest first", async () => {
    const store = createInMemoryCommitmentStore();
    for (let i = 1; i <= MAX_FEW_SHOT_PER_ANSWER + 1; i++) {
      await answered(store, { id: `C0DESIGN:done${i}`, state: "done", resolvedAt: 1000 + i, what: `ship thing ${i}` });
      await answered(store, { id: `C0DESIGN:nope${i}`, state: "not_promise", resolvedAt: 2000 + i, what: `joke about ${i}` });
    }
    // Neither answer: never an example.
    await answered(store, { id: "C0DESIGN:dropped", state: "dropped", resolvedAt: 9000, what: "dropped task" });
    await answered(store, { id: "C0DESIGN:auto", state: "auto_done", resolvedAt: 9001, what: "auto task" });
    await answered(store, { id: "C0DESIGN:open", state: "open", resolvedAt: 9002, what: "open task" });

    const prompt = promptOf(await sweep(store));
    const lines = prompt.split("\n");
    const nope = lines.filter((l) => l.startsWith("- joke about"));
    const done = lines.filter((l) => l.startsWith("- ship thing"));
    assert.deepEqual(nope, ["- joke about 4", "- joke about 3", "- joke about 2"]);
    assert.deepEqual(done, ["- ship thing 4", "- ship thing 3", "- ship thing 2"]);
    for (const absent of ["dropped task", "auto task", "open task"]) assert.ok(!prompt.includes(absent), absent);
    // The examples come first; the thread follows exactly as an empty store's run asks it.
    const baseline = promptOf(await sweep(createInMemoryCommitmentStore()));
    assert.ok(prompt.endsWith(`\n\n${baseline}`));
    assert.ok(prompt.indexOf("- joke about 4") < prompt.indexOf("- ship thing 4"));
  });

  it("the count is a setting", async () => {
    const store = createInMemoryCommitmentStore();
    await answered(store, { id: "C0DESIGN:d1", state: "done", resolvedAt: 1, what: "older done" });
    await answered(store, { id: "C0DESIGN:d2", state: "done", resolvedAt: 2, what: "newer done" });
    await answered(store, { id: "C0DESIGN:n1", state: "not_promise", resolvedAt: 3, what: "older nope" });
    await answered(store, { id: "C0DESIGN:n2", state: "not_promise", resolvedAt: 4, what: "newer nope" });
    const prompt = promptOf(await sweep(store, { fewShot: 1 }));
    assert.ok(prompt.includes("- newer done"));
    assert.ok(prompt.includes("- newer nope"));
    assert.ok(!prompt.includes("older"));
  });

  it("never shows a DM's commitment, or another private channel's, to a channel job", async () => {
    const store = createInMemoryCommitmentStore();
    await answered(store, { id: "D0MAYA:1", channel: "D0MAYA", channelKind: "dm", state: "not_promise", resolvedAt: 50, what: "dm secret one" });
    await answered(store, { id: "C0GROUP:1", channel: "C0GROUP", channelKind: "group-dm", state: "done", resolvedAt: 51, what: "group dm secret" });
    await answered(store, { id: "C0PRIV:1", channel: "C0PRIV", channelKind: "private", state: "done", resolvedAt: 52, what: "private secret" });
    await answered(store, { id: "C0OTHER:1", channel: "C0OTHER", state: "done", resolvedAt: 10, what: "another public channel" });
    const prompt = promptOf(await sweep(store));
    for (const secret of ["dm secret", "group dm secret", "private secret"]) assert.ok(!prompt.includes(secret), secret);
    // A public channel's answers teach every channel.
    assert.ok(prompt.includes("- another public channel"));
  });

  it("a private channel's own answers teach its own job", async () => {
    const store = createInMemoryCommitmentStore();
    await answered(store, { id: "C0PRIV:1", channel: "C0PRIV", channelKind: "private", state: "done", resolvedAt: 52, what: "our own private task" });
    await answered(store, { id: "C0ELSE:1", channel: "C0ELSE", channelKind: "private", state: "done", resolvedAt: 53, what: "someone else's private task" });
    const provider = fakeProvider({ generateReplies: [JSON.stringify({ commitments: [] })] });
    const hook = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store, config: {}, now: () => at(29, 22) });
    await hook(
      { channel: "C0PRIV", channelKind: "private", rootTs: ROOT, messages: [{ ts: PROMISE, user: MAYA, text: "I'll do it" }] },
      ROOT,
    );
    const prompt = promptOf(provider);
    assert.ok(prompt.includes("- our own private task"));
    assert.ok(!prompt.includes("someone else's"));
  });

  it("with an empty store the detector prompt is unchanged", async () => {
    const prompt = promptOf(await sweep(createInMemoryCommitmentStore()));
    assert.ok(prompt.startsWith("THREAD (oldest first; NEW marks tonight's messages):"));
    assert.equal(fewShotBlock([]), "");
  });

  it("an answer whose summary has expired is left out, and none left is no block", async () => {
    const store = createInMemoryCommitmentStore();
    await answered(store, { id: "C0DESIGN:gone", state: "done", resolvedAt: 5, what: null });
    const prompt = promptOf(await sweep(store));
    assert.ok(prompt.startsWith("THREAD ("));
  });

  it("a thread with no promise words reads no examples and asks no model", async () => {
    const store = createInMemoryCommitmentStore();
    await answered(store, { id: "C0DESIGN:d1", state: "done", resolvedAt: 1, what: "a task" });
    let reads = 0;
    const counting = { ...store, latestAnswers: async (...args: Parameters<typeof store.latestAnswers>) => (reads++, store.latestAnswers(...args)) };
    const provider = fakeProvider({ generateReplies: [] });
    const hook = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store: counting, config: {}, now: () => at(29, 22) });
    await hook({ channel: DESIGN, channelKind: "public", rootTs: ROOT, messages: [{ ts: PROMISE, user: MAYA, text: "The screens look great." }] }, ROOT);
    assert.equal(reads, 0);
    assert.equal(provider.generated.length, 0);
  });

  it("reads the examples once a job, however many threads it asks about", async () => {
    const store = createInMemoryCommitmentStore();
    await answered(store, { id: "C0DESIGN:d1", state: "done", resolvedAt: 1, what: "a task" });
    let reads = 0;
    const counting = { ...store, latestAnswers: async (...args: Parameters<typeof store.latestAnswers>) => (reads++, store.latestAnswers(...args)) };
    const provider = fakeProvider({ generateReplies: [JSON.stringify({ commitments: [] }), JSON.stringify({ commitments: [] })] });
    const hook = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store: counting, config: {}, now: () => at(29, 22) });
    for (const root of [ROOT, ts(29, 16)]) {
      await hook({ channel: DESIGN, channelKind: "public", rootTs: root, messages: [{ ts: PROMISE, user: MAYA, text: "I'll do it" }] }, ROOT);
    }
    assert.equal(reads, 1);
    assert.equal(provider.generated.length, 2);
    assert.ok(provider.generated.every((g) => g.prompt.includes("- a task")));
  });

  it("an example store that fails leaves the prompt as it was, and the promise is still kept", async () => {
    const store = createInMemoryCommitmentStore();
    const failing = { ...store, latestAnswers: async () => Promise.reject(new Error("no such column: channel_kind")) };
    const provider = fakeProvider({
      generateReplies: [JSON.stringify({ commitments: [{ message_ts: PROMISE, promiser: MAYA, requester: null, what: "do it", deadline: null, confidence: 0.9 }] })],
    });
    const hook = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store: failing, config: {}, now: () => at(29, 22) });
    await hook({ channel: DESIGN, channelKind: "public", rootTs: ROOT, messages: [{ ts: PROMISE, user: MAYA, text: "I'll do it" }] }, ROOT);
    assert.ok(promptOf(provider).startsWith("THREAD ("));
    assert.equal(store.rows.size, 1);
  });

  it("a kept promise remembers the kind of place it was made in", async () => {
    const store = createInMemoryCommitmentStore();
    const provider = fakeProvider({
      generateReplies: [JSON.stringify({ commitments: [{ message_ts: PROMISE, promiser: MAYA, requester: null, what: "do it", deadline: null, confidence: 0.9 }] })],
    });
    const hook = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store, config: {}, now: () => at(29, 22) });
    await hook({ channel: "C0PRIV", channelKind: "private", rootTs: ROOT, messages: [{ ts: PROMISE, user: MAYA, text: "I'll do it" }] }, ROOT);
    assert.equal([...store.rows.values()][0]?.channelKind, "private");
  });

  it("a promise from a private sweep channel is kept as private, and never teaches a public channel's job", async () => {
    const PRIV = "C074QG2V7DJ";
    const store = createInMemoryCommitmentStore();
    const provider = fakeProvider({
      generateReplies: [
        JSON.stringify({ commitments: [{ message_ts: PROMISE, promiser: MAYA, requester: BEA, what: "send the private feedback deck", deadline: null, confidence: 0.9 }] }),
      ],
    });
    const h = sweepHarness({
      channels: {
        [PRIV]: {
          kind: "private",
          members: [BEA, MAYA],
          history: [msg(BEA, ROOT, "Can someone send the feedback deck?", { reply_count: 1, latest_reply: PROMISE })],
          threads: { [ROOT]: [msg(BEA, ROOT, "Can someone send the feedback deck?"), msg(MAYA, PROMISE, "I'll send it.")] },
        },
      },
      privateAllowlist: [PRIV],
      now: at(29, 22),
    });
    h.deps.onThread = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store, config: { unoBot: UNO_BOT }, now: () => h.clock.now });
    await runSweepJob({ key: `sweep:${PRIV}`, kind: "sweep-channel", channel: PRIV }, h.deps);
    const row = store.rows.get(`${PRIV}:${PROMISE}`);
    assert.equal(row?.channelKind, "private");

    // Its promiser answers 🙌; #design's next job still never sees it.
    await store.update(row!.id, { state: "done", resolvedAt: at(30, 15) });
    const publicPrompt = promptOf(await sweep(store));
    assert.ok(!publicPrompt.includes("private feedback deck"));
    assert.ok(publicPrompt.startsWith("THREAD ("));
  });

  it("a group DM's or a DM's thread keeps no commitment", async () => {
    for (const channelKind of ["group-dm", "dm"] as const) {
      const store = createInMemoryCommitmentStore();
      const provider = fakeProvider({ generateReplies: [] });
      const hook = commitmentThreadHook({ detector: modelCommitmentDetector(provider), store, config: {}, now: () => at(29, 22) });
      await hook({ channel: "C0GROUP", channelKind, rootTs: ROOT, messages: [{ ts: PROMISE, user: MAYA, text: "I'll do it" }] }, ROOT);
      assert.equal(store.rows.size, 0);
      assert.equal(provider.generated.length, 0);
    }
  });

  it("at the cap, the block stays small", () => {
    // Twelve words is the most a summary may be (COMMITMENT_DETECTOR_SYSTEM).
    const twelve = "update the reflection screens prototype with the new onboarding copy and states";
    const examples = [
      ...Array.from({ length: MAX_FEW_SHOT_PER_ANSWER }, () => ({ answer: "not_promise" as const, what: twelve })),
      ...Array.from({ length: MAX_FEW_SHOT_PER_ANSWER }, () => ({ answer: "done" as const, what: twelve })),
    ];
    const block = fewShotBlock(examples);
    assert.ok(block.length <= 1_000, `${block.length} chars`);
  });
});
