// The commitment records conformance suite.
//
// Written only against the `CommitmentRecords` port and handed its runner, so
// the same cases run against the in-memory store under `node --test`
// (`tests/commitment-records-in-memory.test.ts`) and against the D1 adapter
// under workerd with the real migrations applied to a local D1
// (`tests/workerd/commitment-records.conformance.test.ts`). The sweep records'
// pattern (`tests/helpers/sweep-records-conformance.ts`).
import assert from "node:assert/strict";

import type { CommitmentRecord, CommitmentRecords } from "../../src/commitments/store";

export interface ConformanceRunner {
  it(name: string, fn: () => Promise<void>): void;
}

export function commitmentRow(over: Partial<CommitmentRecord> = {}): CommitmentRecord {
  return {
    id: "C0DESIGN:1790694600.000200",
    kind: "thread_promise",
    channel: "C0DESIGN",
    channelKind: "public",
    threadTs: "1790694000.000100",
    messageTs: "1790694600.000200",
    promiserId: "U0MAYA",
    requesterId: "U0BEA",
    deadlineAt: 1_790_914_400_000,
    dueAt: 1_790_914_400_000,
    state: "open",
    nudges: 0,
    snoozes: 0,
    confidence: 0.9,
    promisedAt: 1_790_694_600_000,
    detectedAt: 1_790_719_200_000,
    runDate: "2026-09-29",
    nudgeTs: null,
    followupTs: null,
    checkedOn: null,
    holds: 0,
    remindedOn: null,
    resolvedAt: null,
    ...over,
  };
}

export function runCommitmentRecordsConformance(
  label: string,
  make: () => CommitmentRecords,
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a row reads back field for field, nulls and all", async () => {
    const records = make();
    const row = commitmentRow();
    await records.addCommitments([row]);
    assert.deepEqual(await records.get(row.id), row);
    const bare = commitmentRow({ id: "C0DESIGN:2", messageTs: "2", requesterId: null, deadlineAt: null, channelKind: "private" });
    await records.addCommitments([bare]);
    assert.deepEqual(await records.get(bare.id), bare);
    assert.equal(await records.get("C0DESIGN:missing"), null);
  });

  it("a promise read again keeps the state it has reached", async () => {
    const records = make();
    await records.addCommitments([commitmentRow()]);
    await records.update(commitmentRow().id, { state: "done", resolvedAt: 5 });
    await records.addCommitments([commitmentRow({ confidence: 0.8 })]);
    const row = await records.get(commitmentRow().id);
    assert.equal(row?.state, "done");
    assert.equal(row?.confidence, 0.9);
    assert.equal(row?.resolvedAt, 5);
  });

  it("the next due is the live one due soonest, once per morning", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:late", dueAt: 300 }),
      commitmentRow({ id: "C:soon", dueAt: 100 }),
      commitmentRow({ id: "C:future", dueAt: 900 }),
      commitmentRow({ id: "C:done", dueAt: 50, state: "done" }),
      commitmentRow({ id: "C:lapsed", dueAt: 50, state: "lapsed" }),
      commitmentRow({ id: "C:nudged", dueAt: 200, state: "nudged", nudges: 1 }),
      commitmentRow({ id: "C:snoozed", dueAt: 250, state: "snoozed", snoozes: 1 }),
    ]);
    const order: string[] = [];
    for (;;) {
      const next = await records.nextDue(500, "2026-10-01");
      if (!next) break;
      order.push(next.id);
      await records.update(next.id, { checkedOn: "2026-10-01" });
    }
    assert.deepEqual(order, ["C:soon", "C:nudged", "C:snoozed", "C:late"]);
    // Tomorrow's morning looks again.
    assert.equal((await records.nextDue(500, "2026-10-02"))?.id, "C:soon");
  });

  it("the next due passes over the promisers it is told to", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:maya", dueAt: 100, promiserId: "U0MAYA" }),
      commitmentRow({ id: "C:ade", dueAt: 200, promiserId: "U0ADE" }),
    ]);
    assert.equal((await records.nextDue(500, "2026-10-01", { asked: ["U0MAYA"] }))?.id, "C:ade");
    assert.equal(await records.nextDue(500, "2026-10-01", { asked: ["U0MAYA", "U0ADE"] }), null);
    assert.equal((await records.nextDue(500, "2026-10-01", {}))?.id, "C:maya");
    // The card budget passes over nobody's own asks.
    assert.equal((await records.nextDue(500, "2026-10-01", { cards: ["U0MAYA"] }))?.id, "C:maya");
  });

  it("a person's own asks come before card follow-ups, and each budget skips only its own", async () => {
    const records = make();
    const card = (id: string, dueAt: number) =>
      commitmentRow({ id, kind: "card_stale", dueAt, threadTs: "", messageTs: "", requesterId: null, deadlineAt: null, cardId: id });
    await records.addCommitments([
      card("card:a", 10),
      card("card:b", 20),
      commitmentRow({ id: "R:remind", kind: "self_reminder", dueAt: 400 }),
      commitmentRow({ id: "C:promise", dueAt: 300 }),
    ]);
    assert.equal((await records.nextDue(500, "2026-10-01"))?.id, "C:promise");
    assert.equal((await records.nextDue(500, "2026-10-01", { asked: ["U0MAYA"] }))?.id, "card:a");
    assert.equal((await records.nextDue(500, "2026-10-01", { cards: ["U0MAYA"] }))?.id, "C:promise");
    assert.equal(await records.nextDue(500, "2026-10-01", { asked: ["U0MAYA"], cards: ["U0MAYA"] }), null);
  });

  it("counts each promiser's reminders on a morning", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:1", remindedOn: "2026-10-01" }),
      commitmentRow({ id: "C:2", remindedOn: "2026-10-01" }),
      commitmentRow({ id: "C:3", remindedOn: "2026-09-30" }),
      commitmentRow({ id: "C:4", remindedOn: "2026-10-01", promiserId: "U0ADE" }),
    ]);
    await records.addCommitments([
      commitmentRow({ id: "card:x", kind: "card_unowned", remindedOn: "2026-10-01", threadTs: "", messageTs: "", cardId: "x" }),
    ]);
    assert.deepEqual(await records.remindedOn("2026-10-01"), { asked: { U0MAYA: 2, U0ADE: 1 }, cards: { U0MAYA: 1 } });
    assert.deepEqual(await records.remindedOn("2026-10-02"), { asked: {}, cards: {} });
  });

  it("finds a promiser's live commitment in a thread, and only a live one", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:done", state: "done", promisedAt: 1 }),
      commitmentRow({ id: "C:live", state: "nudged", promisedAt: 2 }),
      commitmentRow({ id: "C:other", promiserId: "U0ADE", promisedAt: 0 }),
    ]);
    const row = commitmentRow();
    assert.equal((await records.liveInThread(row.channel, row.threadTs, "U0MAYA"))?.id, "C:live");
    assert.equal(await records.liveInThread(row.channel, "999.9", "U0MAYA"), null);
  });

  it("a reminder's ts finds its commitment, first reminder or follow-up", async () => {
    const records = make();
    await records.addCommitments([commitmentRow({ state: "nudged", nudgeTs: "111.1", followupTs: "222.2" })]);
    assert.equal((await records.byReminderTs("111.1"))?.id, commitmentRow().id);
    assert.equal((await records.byReminderTs("222.2"))?.id, commitmentRow().id);
    assert.equal(await records.byReminderTs("333.3"), null);
  });

  it("an update changes only the fields it names", async () => {
    const records = make();
    await records.addCommitments([commitmentRow()]);
    await records.update(commitmentRow().id, { state: "nudged", nudges: 1, nudgeTs: "111.1", dueAt: 42, checkedOn: "2026-10-01" });
    await records.update(commitmentRow().id, {});
    assert.deepEqual(await records.get(commitmentRow().id), {
      ...commitmentRow(),
      state: "nudged",
      nudges: 1,
      nudgeTs: "111.1",
      dueAt: 42,
      checkedOn: "2026-10-01",
    });
  });

  it("the latest answers: each of 🙌 and 🤔 capped, newest first, public or this channel's own", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:done1", state: "done", resolvedAt: 10 }),
      commitmentRow({ id: "C:done2", state: "done", resolvedAt: 30 }),
      commitmentRow({ id: "C:done3", state: "done", resolvedAt: 20 }),
      commitmentRow({ id: "C:nope1", state: "not_promise", resolvedAt: 15 }),
      commitmentRow({ id: "C:nope2", state: "not_promise", resolvedAt: 25 }),
      commitmentRow({ id: "C:nope3", state: "not_promise", resolvedAt: 5 }),
      commitmentRow({ id: "C:dropped", state: "dropped", resolvedAt: 99 }),
      commitmentRow({ id: "C:auto", state: "auto_done", resolvedAt: 99 }),
      commitmentRow({ id: "C:open", state: "open" }),
      commitmentRow({ id: "D:dm", channel: "D0MAYA", channelKind: "dm", state: "done", resolvedAt: 99 }),
      commitmentRow({ id: "G:group", channel: "C0GROUP", channelKind: "group-dm", state: "not_promise", resolvedAt: 99 }),
      commitmentRow({ id: "P:mine", channel: "C0PRIV", channelKind: "private", state: "done", resolvedAt: 40 }),
      commitmentRow({ id: "P:other", channel: "C0ELSE", channelKind: "private", state: "done", resolvedAt: 99 }),
    ]);
    const ids = async (channel: string, limit: number) => (await records.latestAnswers(channel, limit)).map((r) => r.id);
    assert.deepEqual(await ids("C0DESIGN", 2), ["C:done2", "C:nope2", "C:done3", "C:nope1"]);
    assert.deepEqual(await ids("C0PRIV", 1), ["P:mine", "C:nope2"]);
    assert.deepEqual(await ids("D0MAYA", 1), ["D:dm", "C:nope2"]);
    assert.deepEqual(await ids("C0DESIGN", 0), []);
    const [first] = await records.latestAnswers("C0PRIV", 1);
    assert.equal(first?.channelKind, "private");
  });

  it("a card follow-up reads back with its card id; the card's latest is the one detected last", async () => {
    const records = make();
    const card = commitmentRow({
      id: "card:p1:unowned:100",
      kind: "card_unowned",
      channel: "C0DESIGN",
      threadTs: "",
      messageTs: "",
      requesterId: null,
      deadlineAt: null,
      cardId: "p1",
      detectedAt: 100,
    });
    const later = commitmentRow({ ...card, id: "card:p1:stale:200", kind: "card_stale", detectedAt: 200 });
    await records.addCommitments([card, later, commitmentRow({ id: "card:p2:stale:300", kind: "card_stale", cardId: "p2", detectedAt: 300 })]);
    assert.deepEqual(await records.get(card.id), card);
    const latest = await records.latestForCards(["p1", "p2", "p9"]);
    assert.deepEqual(Object.keys(latest).sort(), ["p1", "p2"]);
    assert.equal(latest.p1?.id, later.id);
    assert.equal(latest.p2?.id, "card:p2:stale:300");
    assert.deepEqual(await records.latestForCards([]), {});
    assert.equal("cardId" in (await records.get(commitmentRow().id) ?? commitmentRow()), false);
  });

  it("a card follow-up is never a promise: not live in its thread, never an example", async () => {
    const records = make();
    await records.addCommitments([
      commitmentRow({ id: "C:todo", kind: "card_todo", state: "open" }),
      commitmentRow({ id: "C:todo-done", kind: "card_todo", state: "done", resolvedAt: 50 }),
    ]);
    const row = commitmentRow();
    assert.equal(await records.liveInThread(row.channel, row.threadTs, row.promiserId), null);
    assert.deepEqual(await records.latestAnswers("C0DESIGN", 5), []);
  });

  it("a \"remind me\" keeps its kind, and is neither a live promise in its thread nor a detector example", async () => {
    const records = make();
    const self = commitmentRow({ id: "C:self", kind: "self_reminder", requesterId: "U0MAYA", state: "done", resolvedAt: 99 });
    const live = commitmentRow({ id: "C:self-live", kind: "self_reminder", requesterId: "U0MAYA", state: "open" });
    await records.addCommitments([self, live]);
    assert.deepEqual(await records.get(self.id), self);
    assert.equal(await records.liveInThread(self.channel, self.threadTs, "U0MAYA"), null);
    assert.deepEqual(await records.latestAnswers(self.channel, 3), []);
    // It is due like any other.
    assert.equal((await records.nextDue(Number.MAX_SAFE_INTEGER, "2026-10-01"))?.id, live.id);
  });

  it("a DM ask keeps its kind and its DM, goes after a person's own asks on the cards budget, and is never a promise", async () => {
    const records = make();
    const miss = commitmentRow({ id: "D0MAYA:1.0:unanswered", kind: "dm_unanswered", channel: "D0MAYA", channelKind: "dm", requesterId: "U0MAYA", deadlineAt: null, dueAt: 10 });
    const raise = commitmentRow({ id: "D0MAYA:2.0:raise", kind: "dm_disagreement", channel: "D0MAYA", channelKind: "dm", requesterId: "U0MAYA", deadlineAt: null, dueAt: 11 });
    const self = commitmentRow({ id: "D0MAYA:3.0", kind: "self_reminder", channel: "D0MAYA", channelKind: "dm", requesterId: "U0MAYA", deadlineAt: null, dueAt: 50 });
    await records.addCommitments([miss, raise, self]);
    assert.deepEqual(await records.get(miss.id), miss);
    assert.deepEqual(await records.get(raise.id), raise);
    assert.equal(await records.liveInThread(miss.channel, miss.threadTs, "U0MAYA"), null);
    // The "remind me", due later, still goes first.
    assert.equal((await records.nextDue(Number.MAX_SAFE_INTEGER, "2026-10-01"))?.id, self.id);
    assert.equal((await records.nextDue(Number.MAX_SAFE_INTEGER, "2026-10-01", { asked: ["U0MAYA"] }))?.id, miss.id);
    assert.equal((await records.nextDue(Number.MAX_SAFE_INTEGER, "2026-10-01", { asked: ["U0MAYA"], cards: ["U0MAYA"] })), null);
    await records.update(miss.id, { state: "nudged", remindedOn: "2026-10-01" });
    assert.deepEqual(await records.remindedOn("2026-10-01"), { asked: {}, cards: { U0MAYA: 1 } });
    await records.update(miss.id, { state: "done", resolvedAt: 5 });
    assert.deepEqual(await records.latestAnswers(miss.channel, 3), []);
  });
}
