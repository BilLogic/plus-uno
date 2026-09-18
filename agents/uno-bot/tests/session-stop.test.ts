// Slack's stop control: what a press comes to, on all three doors.
//
// The press cannot be observed from here — the in-thread control's event
// subscription has to be pasted into the live app by hand
// (`apps.manifest.update` is refused on this app), so nothing in this repo has
// ever seen the control. What CAN be pinned is everything the doors decide and
// do once a press arrives, and that is all of it. Each door takes named
// dependencies rather than `Env` (#593), so every case here drives a real door
// on the in-memory ThreadState and the recording Delivery, and asserts the
// cancel flag the running loop would read, the status the session settles to,
// and the line the thread gets — where it was posted and in what order.
//
// NOTHING HERE READS SOURCE. It used to: three doors that held `Env` could only
// be checked with `readFileSync` and a regex over their adapters, which could
// ask whether `inThreadStopLine(`, `threadArg(` and two `console.error` lines
// appeared in a file and nothing else. A regex cannot tell a line posted into
// the run's thread from the same call posted into the wrong conversation, and
// it goes green on a door nobody ever calls. The doors are modules now, so the
// suite drives them instead. (The manifest-to-dispatcher check that also lived
// here is not about the stop control and could not become behavioural; it moved
// intact to `manifest-subscriptions.test.ts`.)
//
// The properties worth the file are the ones that are easy to get wrong, and
// three of them were wrong in the first cut:
//
//   1. THE CANCEL LANDS ON THE KEYS THE LOOP READS, AND NOWHERE ELSE.
//      `run-agent.ts` derives `cancelThread` as the CONVERSATION key — the
//      thread root in a channel, the constant "dm" for a loose DM ask — so a
//      flag written anywhere else is a stop that silently does nothing, the
//      bug `/stop` shipped with. And resolving by PERSON reaches outside this
//      conversation entirely: `setActiveRun` keeps one record per person,
//      overwritten by every turn they start anywhere, so it can name a channel
//      run while the person is pressing stop in a DM.
//   2. THE HANDLER AND THE TURN AGREE ON THE SETTLE, on every ending that
//      consults the card: both compute `settledStatus` over the same live-card
//      question rather than racing two literals.
//   3. THE IN-THREAD DOOR'S ORDER IS AN INVARIANT. The settle has to survive a
//      refused post and has to follow its own read with no Slack call in
//      between — a reordered pair typechecks and breaks nothing else. The door
//      takes the settle and the Delivery port by name, so the order is
//      observable: the settle is asserted to happen with nothing yet posted.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  NOTHING_UNDONE,
  STOPPING_PROMISE,
  inThreadStopLine,
  resolveStop,
} from "../src/slack/session-stop";
import {
  SLASH_STOP_RECEIPT,
  homeStopReceipt,
  runHomeStopDoor,
  runSessionStopDoor,
  runSlashStopDoor,
  type CancelledRun,
  type StopDoorTarget,
} from "../src/slack/stop-doors";
import type { SessionStatus } from "../src/slack/session-status";
import {
  recordingDelivery,
  type RecordingDelivery,
  type RecordingDeliveryOptions,
} from "../src/turn/index";
import {
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const DM = "D1";
const DM_THREAD = "1700000000.000200";
const ASKER = "U_ASKER";
const PRESSER = "U_PRESSER";

function cardIn(channel: string, threadTs: string, conversation: string): PendingProposal {
  return {
    toolName: "notion_create",
    input: { title: "Reflection redesign" },
    channel,
    threadTs: conversation,
    replyTs: threadTs,
    userMsgTs: "1700000000.000090",
    proposalTs: "1700000000.000095",
    proposalText: "Create a Roadmap card for the reflection redesign?",
    requesterUserId: ASKER,
  };
}

describe("the stop control stops the run it was pressed on", () => {
  it("flags the channel thread the loop reads", async () => {
    const state: ThreadState = createInMemoryThreadState();
    await resolveStop({ channel: CHANNEL, threadTs: THREAD, userId: PRESSER }, state);
    assert.equal(await state.consumeCancel({ channel: CHANNEL, thread: THREAD }), true);
  });

  it("reaches no conversation but the one the event names", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // The person pressing has their own, unrelated run somewhere else — the
    // shape that breaks person-resolution, since `setActiveRun` keeps one
    // record per person and the latest turn wins. A press here must not touch
    // it, and must not depend on it either.
    await state.setActiveRun(PRESSER, { channel: "C_OTHER", thread: "1700000000.000900" });

    await resolveStop({ channel: CHANNEL, threadTs: THREAD, userId: PRESSER }, state);

    assert.equal(await state.consumeCancel({ channel: CHANNEL, thread: THREAD }), true);
    assert.equal(
      await state.consumeCancel({ channel: "C_OTHER", thread: "1700000000.000900" }),
      false,
      "a run in another conversation is left alone",
    );
  });

  it("stops the DM whichever key its run is filed under", async () => {
    // A DM ask lives under the constant "dm" when it was typed in the composer
    // and under its own thread ts when the person threaded it by hand, and the
    // event cannot say which. Both are inside the conversation the event named,
    // so both are written.
    const state: ThreadState = createInMemoryThreadState();
    await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);

    assert.equal(await state.consumeCancel({ channel: DM, thread: "dm" }), true);
    assert.equal(await state.consumeCancel({ channel: DM, thread: DM_THREAD }), true);
  });

  it("stops a DM run when the person is also running somewhere else", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // Ask in the DM, then ask in a channel: the person's active-run pointer now
    // names the CHANNEL. Pressing stop on the DM must stop the DM and leave the
    // channel run alone — the exact sequence person-resolution got backwards.
    await state.setActiveRun(ASKER, { channel: DM, thread: "dm" });
    await state.setActiveRun(ASKER, { channel: "C_LATER", thread: "1700000000.000800" });

    await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);

    assert.equal(await state.consumeCancel({ channel: DM, thread: "dm" }), true);
    assert.equal(
      await state.consumeCancel({ channel: "C_LATER", thread: "1700000000.000800" }),
      false,
      "the channel run the pointer happened to name keeps going",
    );
  });
});

describe("the session leaves the working state by the turn's own card rule", () => {
  it("settles active when the thread holds nothing to decide", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.equal(verdict.settleTo, "active");
  });

  it("settles suspended over a live card, as a finished turn would", async () => {
    const state: ThreadState = createInMemoryThreadState();
    await state.putProposal(cardIn(CHANNEL, THREAD, THREAD));

    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.equal(verdict.settleTo, "suspended");
    assert.match(verdict.text, /still waiting/);
  });

  it("finds a DM card filed under the 'dm' conversation key", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // Staged by a loose DM ask: conversation key "dm", reply thread its own ts.
    await state.putProposal(cardIn(DM, DM_THREAD, "dm"));

    const verdict = await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);
    assert.equal(verdict.settleTo, "suspended");
  });

  it("leaves another ask's card in the same DM out of it", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // A card staged under a DIFFERENT ask in the same DM shares the "dm"
    // conversation key. The grain is the reply thread, so stopping this ask
    // settles active and the other ask keeps its own suspension.
    await state.putProposal(cardIn(DM, "1700000000.000300", "dm"));

    const verdict = await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);
    assert.equal(verdict.settleTo, "active");
  });
});


// ── Driving the doors ────────────────────────────────────────────────────────
//
// One stand-in for the Delivery port, shared by all three doors. It records
// WHERE each delivery was opened as well as what was said through it, because
// the property that used to be checked with a regex — "the line goes into the
// stopped run's own conversation, threaded on a real ts" — is a fact about the
// target and not about the text.
interface Spoken {
  channel: string;
  replyTs?: string;
  text: string;
}

function stage(opts: RecordingDeliveryOptions = {}) {
  const opened: Array<{ target: StopDoorTarget; delivery: RecordingDelivery }> = [];
  return {
    opened,
    delivery(target: StopDoorTarget): RecordingDelivery {
      const delivery = recordingDelivery(opts);
      opened.push({ target, delivery });
      return delivery;
    },
    /** Every note ATTEMPTED, in order — including one Slack refused, which is
     *  the case where "was it sent" and "did it land" come apart. */
    attempts(): Spoken[] {
      return opened.flatMap(({ target, delivery }) =>
        delivery.calls
          .filter((call) => call.kind === "note")
          .map((call) => ({
            channel: target.channel,
            ...(target.replyTs === undefined ? {} : { replyTs: target.replyTs }),
            text: (call as { kind: "note"; text: string }).text,
          })),
      );
    },
  };
}

const running = (channel: string, thread: string): CancelledRun => ({
  cancelled: true,
  channel,
  thread,
});
const NOTHING_RUNNING: CancelledRun = { cancelled: false };

describe("/stop tells the run's own thread, wherever the run turned out to be", () => {
  it("posts the shared line into the conversation the cancel reported", async () => {
    const speak = stage();
    await runSlashStopDoor(
      { userId: PRESSER },
      { cancelForUser: async () => running(CHANNEL, THREAD), delivery: speak.delivery },
    );
    assert.deepEqual(speak.attempts(), [
      { channel: CHANNEL, replyTs: THREAD, text: inThreadStopLine(PRESSER) },
    ]);
  });

  it("posts at the top of the DM when the run was a loose DM ask", async () => {
    // The conversation key is the constant "dm", not a timestamp: passing it as
    // a thread_ts is a Slack error rather than a thread, so the post is made
    // with no reply target at all.
    const speak = stage();
    await runSlashStopDoor(
      { userId: ASKER },
      { cancelForUser: async () => running(DM, "dm"), delivery: speak.delivery },
    );
    assert.deepEqual(speak.attempts(), [{ channel: DM, text: inThreadStopLine(ASKER) }]);
  });

  it("says nothing in any thread when nothing was running", async () => {
    // The ephemeral receipt covers this case; a stop line in a thread nobody
    // was waiting in would be noise in someone else's conversation.
    const speak = stage();
    await runSlashStopDoor(
      { userId: PRESSER },
      { cancelForUser: async () => NOTHING_RUNNING, delivery: speak.delivery },
    );
    assert.deepEqual(speak.attempts(), []);
  });

  it("treats a failed cancel as nothing running rather than failing the press", async () => {
    const speak = stage();
    await runSlashStopDoor(
      { userId: PRESSER },
      {
        cancelForUser: async () => {
          throw new Error("durable object unreachable");
        },
        delivery: speak.delivery,
      },
    );
    assert.deepEqual(speak.attempts(), []);
  });

  it("answers its caller with the shared promises and its own last clause", () => {
    assert.ok(SLASH_STOP_RECEIPT.includes(STOPPING_PROMISE), "the cooperative-cancel promise");
    assert.ok(SLASH_STOP_RECEIPT.includes(NOTHING_UNDONE), "the not-an-undo reassurance");
    assert.match(SLASH_STOP_RECEIPT, /nothing of mine was running/i);
  });
});

describe("the Home-tab button answers the thread first and the presser second", () => {
  const homeDeps = (
    speak: ReturnType<typeof stage>,
    run: CancelledRun,
    dm: string | null = DM,
  ) => ({
    cancelForUser: async () => run,
    dmChannelFor: async () => dm,
    delivery: speak.delivery,
  });

  it("posts the shared line in the run's thread, then the receipt in the DM", async () => {
    const speak = stage();
    await runHomeStopDoor({ userId: PRESSER }, homeDeps(speak, running(CHANNEL, THREAD)));
    assert.deepEqual(speak.attempts(), [
      { channel: CHANNEL, replyTs: THREAD, text: inThreadStopLine(PRESSER) },
      { channel: DM, text: homeStopReceipt(true) },
    ]);
  });

  it("sends only the receipt when nothing was running, and says so", async () => {
    const speak = stage();
    await runHomeStopDoor({ userId: PRESSER }, homeDeps(speak, NOTHING_RUNNING));
    assert.deepEqual(speak.attempts(), [{ channel: DM, text: homeStopReceipt(false) }]);
    assert.match(homeStopReceipt(false), /nothing to stop/);
  });

  it("still sends the receipt when the in-thread line is refused", async () => {
    // A press that reached the cancel and lost the thread line is still a press
    // the person is owed an answer to.
    const speak = stage({ noteFails: true });
    await runHomeStopDoor({ userId: PRESSER }, homeDeps(speak, running(CHANNEL, THREAD)));
    assert.equal(speak.attempts().length, 2);
  });

  it("honours the press when Slack will not open a DM to report it", async () => {
    const speak = stage();
    await runHomeStopDoor({ userId: PRESSER }, homeDeps(speak, running(CHANNEL, THREAD), null));
    assert.deepEqual(speak.attempts(), [
      { channel: CHANNEL, replyTs: THREAD, text: inThreadStopLine(PRESSER) },
    ]);
  });
});

describe("the in-thread control settles before it speaks, and settles regardless", () => {
  interface Settled {
    channel: string;
    threadTs: string;
    status: SessionStatus;
    /** How much had been said when the settle ran. The ordering invariant is
     *  that this is zero: a post between the card read and the status write
     *  gives the in-flight turn a whole Slack round trip in which to stage a
     *  card and settle `suspended`, after which this door's `active` lands last
     *  and is wrong. */
    saidSoFar: number;
  }

  function sessionDeps(state: ThreadState, speak: ReturnType<typeof stage>, settles: Settled[]) {
    return {
      threadState: state,
      delivery: speak.delivery,
      async settleSession(channel: string, threadTs: string, status: SessionStatus) {
        settles.push({ channel, threadTs, status, saidSoFar: speak.attempts().length });
        return { ok: true };
      },
    };
  }

  it("settles with the verdict's status and posts the verdict's line, in that order", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const speak = stage();
    const settles: Settled[] = [];
    await runSessionStopDoor(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      sessionDeps(state, speak, settles),
    );

    assert.deepEqual(settles, [
      { channel: CHANNEL, threadTs: THREAD, status: "active", saidSoFar: 0 },
    ]);
    assert.deepEqual(speak.attempts(), [
      { channel: CHANNEL, replyTs: THREAD, text: inThreadStopLine(PRESSER) },
    ]);
    // And the cancel the loop reads was raised before either of them.
    assert.equal(await state.consumeCancel({ channel: CHANNEL, thread: THREAD }), true);
  });

  it("settles suspended over a live card, and says the card is still waiting", async () => {
    const state: ThreadState = createInMemoryThreadState();
    await state.putProposal(cardIn(CHANNEL, THREAD, THREAD));
    const speak = stage();
    const settles: Settled[] = [];
    await runSessionStopDoor(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      sessionDeps(state, speak, settles),
    );

    assert.equal(settles[0]?.status, "suspended");
    assert.match(speak.attempts()[0]?.text ?? "", /still waiting/);
  });

  it("settles even when Slack refuses the confirmation", async () => {
    // An indicator that outlives the press is the failure this control exists
    // to remove, so a line Slack would not take is no reason to leave it up.
    const state: ThreadState = createInMemoryThreadState();
    const speak = stage({ noteFails: true });
    const settles: Settled[] = [];
    await runSessionStopDoor(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      sessionDeps(state, speak, settles),
    );

    assert.equal(settles.length, 1);
    assert.equal(speak.attempts().length, 1, "the line was attempted and refused");
  });

  it("settles even when the post throws rather than refusing", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const settles: Settled[] = [];
    await runSessionStopDoor(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      {
        threadState: state,
        delivery: () => ({
          ...recordingDelivery(),
          postNote: async () => {
            throw new Error("slack is down");
          },
        }),
        async settleSession(channel: string, threadTs: string, status: SessionStatus) {
          settles.push({ channel, threadTs, status, saidSoFar: 0 });
          return { ok: true };
        },
      },
    );
    assert.equal(settles.length, 1);
  });

  it("drops a malformed payload without settling or speaking", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const speak = stage();
    const settles: Settled[] = [];
    await runSessionStopDoor({ channel: CHANNEL, userId: PRESSER }, sessionDeps(state, speak, settles));
    assert.deepEqual(settles, []);
    assert.deepEqual(speak.attempts(), []);
  });
});

// ── The line the run's own thread gets, from whichever door ─────────────────
//
// All three doors put the same sentence in the run's thread now. Before #589
// the loop posted a stop line there and the other two doors only spoke
// privately — `/stop` by ephemeral, the Home-tab button by DM — so once the
// loop went silent, a run stopped by either left the ASKER watching a thread
// where nothing arrived and nothing explained it.
describe("the stop line the run's thread gets", () => {
  it("names the presser and makes both shared promises", () => {
    const line = inThreadStopLine(PRESSER);
    assert.match(line, new RegExp(`<@${PRESSER}>`));
    assert.ok(line.includes(STOPPING_PROMISE), "the cooperative-cancel promise, verbatim");
    assert.ok(line.includes(NOTHING_UNDONE), "the not-an-undo reassurance, verbatim");
  });

  it("is one sentence from three doors, or the three drift again (#586)", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const slash = stage();
    const home = stage();
    const inThread = stage();

    await runSlashStopDoor(
      { userId: PRESSER },
      { cancelForUser: async () => running(CHANNEL, THREAD), delivery: slash.delivery },
    );
    await runHomeStopDoor(
      { userId: PRESSER },
      {
        cancelForUser: async () => running(CHANNEL, THREAD),
        dmChannelFor: async () => null,
        delivery: home.delivery,
      },
    );
    await runSessionStopDoor(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      {
        threadState: state,
        delivery: inThread.delivery,
        settleSession: async () => ({ ok: true }),
      },
    );

    const said = [slash, home, inThread].map((s) => s.attempts()[0]?.text ?? "");
    for (const text of said) {
      assert.ok(text.startsWith(inThreadStopLine(PRESSER)), `"${text}" opens with the shared line`);
    }
    // Two of the three say nothing else. The card clause is the in-thread
    // door's alone, and only it can afford one: it already reads the live card
    // to compute the status it must settle.
    assert.deepEqual(said.slice(0, 2), [inThreadStopLine(PRESSER), inThreadStopLine(PRESSER)]);
  });

  it("names the presser, who in a channel need not be the asker", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.match(verdict.text, new RegExp(`<@${PRESSER}>`));
    assert.doesNotMatch(verdict.text, new RegExp(`<@${ASKER}>`));
  });
});
