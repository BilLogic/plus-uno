// A run cut off after the Gate's claim says so, and re-stages what did not run.
//
// The claim consumes the card, which is right for the lock and was wrong for
// the one case where the run is then killed — an evicted isolate, a
// `waitUntil` past its budget, a throw past a tool's own handling. The card sat
// approved, no note came, and it could not be approved again. Nothing told the
// requester whether the action ran.
//
// Every case drives the real Gate and the real batch runner against the
// in-memory ThreadState on a hand-wound clock. A cut-off is simulated the only
// honest way a test can: an operation whose promise never settles, left
// running, so the execution record is exactly what production would leave.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  resolveSignal,
  runOperations,
  runReactionDoor,
  settleInto,
  type GateRestage,
  type GateSignal,
  type GateVerdict,
} from "../src/gate/index";
import {
  EXECUTION_CUTOFF_MS,
  createInMemoryThreadState,
  type PendingProposal,
  type ProposalOperation,
  type ThreadState,
} from "../src/thread-state/index";
import { recordingDelivery, runTurn, type RecordingDelivery } from "../src/turn/index";
import { runButtonDoor } from "../src/slack/button-door";
import { renderGateNote } from "../src/slack/gate-note";
import { renderProposalCard } from "../src/slack/proposal-render";
import { harness, postsOf, request } from "./helpers/turn-harness";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";

const BATCH: ProposalOperation[] = [
  { toolName: "notion_create", input: { title: "One" } },
  { toolName: "github_issue_create", input: { title: "Two", body: "b" } },
  { toolName: "dm_relay", input: { recipients: ["U9"], message: "Three" } },
];

const PROPOSAL: PendingProposal = {
  operations: BATCH,
  toolName: BATCH[0]!.toolName,
  input: BATCH[0]!.input,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1700000000.000190",
  proposalTs: CARD_TS,
  proposalText: "(the staged card)",
  requesterUserId: "U1",
};

function clock(start = 1_700_000_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => void (t += ms) };
}

async function staged(): Promise<{ store: ThreadState; time: ReturnType<typeof clock> }> {
  const time = clock();
  const store = createInMemoryThreadState({ now: time.now });
  await store.putProposal(PROPOSAL);
  return { store, time };
}

const press = (decision: "confirm" | "cancel" = "confirm", messageTs = CARD_TS): GateSignal => ({
  kind: "button",
  messageTs,
  decision,
  userId: "U2",
});

/** Settle every pending microtask, so an unawaited batch gets as far as it can. */
const drain = () => new Promise<void>((r) => setImmediate(r));

/**
 * Win the claim and start the batch the way `executeVerdict` does — each
 * operation settled into the execution record as it comes back — without
 * awaiting it. `hangAt` is the operation that never returns.
 */
async function approveAndCutOff(store: ThreadState, hangAt: number): Promise<{ ran: string[] }> {
  const verdict = await resolveSignal(press(), { threadState: store });
  assert.equal(verdict.outcome, "won");
  const ran: string[] = [];
  void runOperations(
    verdict.execute!.operations,
    (op) => {
      ran.push(op.toolName);
      return ran.length - 1 === hangAt
        ? new Promise<string>(() => {})
        : Promise.resolve(JSON.stringify({ ok: true }));
    },
    settleInto(store, CARD_TS),
  );
  await drain();
  return { ran };
}

describe("a run cut off after the claim", () => {
  it("is left alone while it may still be running", async () => {
    const { store, time } = await staged();
    await approveAndCutOff(store, 1);
    time.advance(EXECUTION_CUTOFF_MS);
    const verdict = await resolveSignal(press(), { threadState: store });
    // Exactly what a second press on a claimed card said before: nothing here
    // claims a run is lost while it could still report back.
    assert.equal(verdict.outcome, "stale");
    assert.deepEqual(verdict.post?.note, { kind: "already-resolved" });
    assert.equal(verdict.restage, undefined);
  });

  it("says what finished and re-stages only the remainder, once", async () => {
    const { store, time } = await staged();
    const { ran } = await approveAndCutOff(store, 1);
    assert.deepEqual(ran, ["notion_create", "github_issue_create"]);
    time.advance(EXECUTION_CUTOFF_MS + 1);

    const verdict = await resolveSignal(press(), { threadState: store });
    assert.equal(verdict.outcome, "stale");
    assert.equal(verdict.execute, undefined, "a later look never runs anything");
    assert.deepEqual(verdict.post, {
      note: {
        kind: "cut-off",
        finished: [{ toolName: "notion_create", ok: true }],
        unfinished: ["github_issue_create", "dm_relay"],
        restaged: true,
      },
      replyTs: THREAD,
    });
    // The operation that hung may have happened, so it is offered back for a
    // person to approve — never re-run on the original ✅. The one that
    // finished is not offered at all.
    assert.deepEqual(verdict.restage?.operations, [BATCH[1], BATCH[2]]);
    assert.equal(verdict.restage?.proposal.proposalTs, CARD_TS);

    // The take is the lock: a second press gets the old answer, not a second
    // note and a second card.
    const again = await resolveSignal(press(), { threadState: store });
    assert.deepEqual(again.post?.note, { kind: "already-resolved" });
    assert.equal(again.restage, undefined);
  });

  // A slow run is not a dead one. The take fences it: the batch reads the
  // mark at its next settle and starts nothing else, so the work the fresh
  // card offers again cannot also complete underneath it. (A throw inside the
  // batch, and one after it, are driven through the real `executeVerdict` in
  // `tests/execute-verdict.test.ts`.)
  it("a run taken mid-batch starts no later operation", async () => {
    const { store, time } = await staged();
    const verdict = await resolveSignal(press(), { threadState: store });
    let release!: (result: string) => void;
    const ran: string[] = [];
    let fenced = false;
    const batch = runOperations(
      verdict.execute!.operations,
      (op) => {
        ran.push(op.toolName);
        return ran.length === 1
          ? new Promise<string>((r) => (release = r))
          : Promise.resolve(JSON.stringify({ ok: true }));
      },
      settleInto(store, CARD_TS, () => (fenced = true)),
    );
    await drain();
    // Operation one is slow; a later look takes the run as cut off meanwhile.
    time.advance(EXECUTION_CUTOFF_MS + 1);
    const look = await resolveSignal(press(), { threadState: store });
    assert.deepEqual(look.restage?.operations, BATCH);
    // Operation one then comes back — and the batch stops there.
    release(JSON.stringify({ ok: true }));
    const outcomes = await batch;
    assert.deepEqual(ran, ["notion_create"]);
    assert.equal(outcomes.length, 1);
    assert.equal(fenced, true);
  });

  it("a completed run is never re-staged", async () => {
    const { store, time } = await staged();
    const verdict = await resolveSignal(press(), { threadState: store });
    await runOperations(
      verdict.execute!.operations,
      async () => JSON.stringify({ ok: true }),
      settleInto(store, CARD_TS),
    );
    await store.endExecution(CARD_TS);
    time.advance(EXECUTION_CUTOFF_MS + 1);

    const later = await resolveSignal(press(), { threadState: store });
    assert.deepEqual(later.post?.note, { kind: "already-resolved" });
    assert.equal(later.restage, undefined);
    assert.equal(await store.takeCutOffExecutionInThread({ channel: CHANNEL, thread: THREAD }), null);
  });

  it("a cancelled card leaves no execution behind", async () => {
    const { store, time } = await staged();
    const verdict = await resolveSignal(press("cancel"), { threadState: store });
    assert.equal(verdict.outcome, "won");
    time.advance(EXECUTION_CUTOFF_MS + 1);
    assert.equal(await store.takeCutOffExecution(CARD_TS), null);
  });

  it("a ⛔ on the stuck card gets the note and no card", async () => {
    const { store, time } = await staged();
    await approveAndCutOff(store, 0);
    time.advance(EXECUTION_CUTOFF_MS + 1);
    const verdict = await resolveSignal(press("cancel"), { threadState: store });
    assert.equal(verdict.post?.note.kind, "cut-off");
    assert.equal((verdict.post?.note as { restaged: boolean }).restaged, false);
    assert.equal(verdict.restage, undefined);
  });

  it("a reaction anywhere but the stuck card does not collect its note", async () => {
    const { store, time } = await staged();
    await approveAndCutOff(store, 0);
    time.advance(EXECUTION_CUTOFF_MS + 1);
    const elsewhere = await resolveSignal(
      { kind: "reaction", messageTs: "1700000000.000555", channel: CHANNEL, thread: THREAD, glyph: "white_check_mark", userId: "U2" },
      { threadState: store },
    );
    assert.equal(elsewhere.restage, undefined);
    // Still there for the look that is about it.
    assert.notEqual(await store.takeCutOffExecution(CARD_TS), null);
  });

  it("reads, in Slack, as what may not have run — never as a promise either way", () => {
    const line = renderGateNote({
      kind: "cut-off",
      finished: [{ toolName: "notion_create", ok: true }],
      unfinished: ["github_issue_create"],
      restaged: true,
    });
    assert.match(line, /cut off before it reported back/);
    assert.match(line, /Finished: `notion_create` done\./);
    assert.match(line, /`github_issue_create` — it may or may not have happened/);
    assert.match(line, /fresh card below/);
  });
});

describe("the later looks", () => {
  async function cutOffStore(): Promise<ThreadState> {
    const { store, time } = await staged();
    await approveAndCutOff(store, 1);
    time.advance(EXECUTION_CUTOFF_MS + 1);
    return store;
  }

  it("the next turn in the thread says so and stages a card for the remainder alone", async () => {
    const store = await cutOffStore();
    const h = harness({ threadState: store });
    const outcome = await runTurn(request({ text: "did that go through?" }), h.deps);

    assert.equal(outcome.disposition, "staged");
    assert.equal(h.provider.sends.length, 0, "the note and the card are the reply; no model turn stages over them");
    assert.equal(h.delivery.gateNotes[0]?.kind, "cut-off");
    assert.deepEqual(h.delivery.stagedCards.map((c) => c.operations), [[BATCH[1], BATCH[2]]]);
    // The note, then a line saying their own message is still unanswered,
    // then the card — which comes last because it holds the buttons.
    assert.deepEqual(
      h.delivery.calls.filter((c) => ["gate-note", "note", "proposal"].includes(c.kind)).map((c) => c.kind),
      ["gate-note", "note", "proposal"],
    );
    assert.match(postsOf(h.delivery).find((p) => p.includes("haven't answered")) ?? "", /ask again once you've sorted the card below/);
    // The warning rides the card itself, ahead of the card's own caveats, so a
    // note that failed to post still leaves the person warned.
    assert.equal(h.delivery.stagedCards[0]!.caveats[0]?.kind, "cut-off-rerun");
    assert.match(
      renderProposalCard(h.delivery.stagedCards[0]!).text,
      /An earlier approved run was cut off; some of this may already have happened.*Check before approving/,
    );

    // The fresh card is a card like any other: live in the thread, and its own
    // ✅ runs exactly what it shows.
    const fresh = outcome.staged!.proposal;
    assert.notEqual(fresh.proposalTs, CARD_TS);
    assert.deepEqual((await store.getProposalByThread({ channel: CHANNEL, thread: THREAD }))?.operations, [BATCH[1], BATCH[2]]);
    const approved = await resolveSignal(press("confirm", fresh.proposalTs), { threadState: store });
    assert.equal(approved.outcome, "won");
    assert.deepEqual(approved.execute?.operations, [BATCH[1], BATCH[2]]);
  });

  it("the next turn after a run that finished is an ordinary turn", async () => {
    const { store, time } = await staged();
    const verdict = await resolveSignal(press(), { threadState: store });
    await runOperations(verdict.execute!.operations, async () => JSON.stringify({ ok: true }));
    await store.endExecution(CARD_TS);
    time.advance(EXECUTION_CUTOFF_MS + 1);
    const h = harness({ threadState: store });
    const outcome = await runTurn(request({ text: "thanks" }), h.deps);
    assert.notEqual(outcome.disposition, "staged");
    assert.equal(h.delivery.gateNotes.length, 0);
  });

  it("the button door answers in the thread, re-stages, and retires the stuck card's buttons", async () => {
    const store = await cutOffStore();
    const delivery = recordingDelivery();
    const restaged: GateRestage[] = [];
    const ephemerals: string[] = [];
    const replaced: string[] = [];
    const applied: GateVerdict[] = [];
    await runButtonDoor(
      { channel: CHANNEL, messageTs: CARD_TS, decision: "confirm", userId: "U2" },
      {
        threadState: store,
        delivery: () => delivery,
        applyVerdict: async (v) => void applied.push(v),
        replyEphemeral: async (text) => void ephemerals.push(text),
        replaceCard: async (_text, note) => void replaced.push(note),
        restage: async (r) => void restaged.push(r),
      },
    );
    assert.deepEqual(ephemerals, [], "what may not have run is the thread's business, not the presser's");
    assert.deepEqual(applied, [], "nothing is executed");
    assert.equal(delivery.gateNotes[0]?.kind, "cut-off");
    assert.deepEqual(restaged.map((r) => r.operations), [[BATCH[1], BATCH[2]]]);
    assert.equal(replaced.length, 1);
    assert.equal(settled(delivery), "waiting-on-person");
  });

  it("the reaction door answers under the card and re-stages", async () => {
    const store = await cutOffStore();
    const delivery = recordingDelivery();
    const restaged: GateRestage[] = [];
    await runReactionDoor(
      { channel: CHANNEL, messageTs: CARD_TS, glyph: "white_check_mark", userId: "U2" },
      {
        threadState: store,
        delivery: () => delivery,
        threadRootOf: async () => THREAD,
        botUserId: async () => "UBOT",
        applyVerdict: async () => {},
        restage: async (r) => void restaged.push(r),
      },
    );
    assert.equal(delivery.gateNotes[0]?.kind, "cut-off");
    assert.deepEqual(restaged.map((r) => r.operations), [[BATCH[1], BATCH[2]]]);
    assert.equal(settled(delivery), "waiting-on-person");
  });
});

function settled(delivery: RecordingDelivery): string | undefined {
  return delivery.calls.find((c) => c.kind === "working-clear")?.settlement;
}
