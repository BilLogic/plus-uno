// The working signal answers for itself.
//
// The gap was never a Slack refusal — api.ts has logged `[slack] <method>
// failed: <error>` on every `ok: false` for as long as there has been a
// `parseSlackResponse`. What was silence is the two cases that produce no Slack
// response at all: a clear that SUCCEEDED, and a clear that never left the
// Worker because the invocation died on the external-subrequest cap or was
// hard-killed. Same symptom, opposite fixes, and nothing in the logs to part
// them.
//
// So what is pinned here is that the vocabulary keeps them apart, and that
// exactly one outcome is allowed to say Slack refused anything. The rest — a
// dropped socket, a 502, a budget stop, a threadless surface — reach the log as
// themselves, because api.ts degrades all of them into the one `{ ok: false,
// error }` shape a refusal arrives in.
//
// And then the ADAPTER, driven. The pure vocabulary above was always testable;
// what was not was whether the thing that calls it does. That half used to be a
// `readFileSync` and three regexes over `slack-delivery.ts` — a check that
// could ask whether `reportStatus("set", () => setSessionStatus(` appeared in a
// file and nothing else. It went green on an adapter nobody calls, it could not
// tell a status computed from the settlement from a literal written on the way
// past, and it broke on a reflow. The adapter takes its Slack client by name
// now (#594), so every case below runs the real adapter on a recording client
// and asserts which status Slack was handed, on which thread, and what the
// pairing reported.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SUBREQUEST_CAP } from "../src/agent/loop-policy";
import { SubrequestBudgetError } from "../src/net";
import {
  outcomeOf,
  settledStatus,
  workingSignalLine,
  WORKING_STATUS,
  type SessionStatus,
  type WorkingSignalOutcome,
} from "../src/slack/working-signal";
import { settlementOf, type TurnDisposition, type TurnSettlement } from "../src/turn/index";
import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { recordingSlack } from "./helpers/recording-slack";

describe("what came back, classified", () => {
  it("reads an accepted call as ok", () => {
    assert.deepEqual(outcomeOf({ ok: true }), { kind: "ok" });
  });

  it("carries the error code of a refusal Slack actually made", () => {
    assert.deepEqual(outcomeOf({ ok: false, error: "thread_not_found" }), {
      kind: "declined",
      error: "thread_not_found",
    });
  });

  it("does not call a transport failure a refusal", () => {
    // `slackCall` degrades a fetch throw to `network_error` and an unreadable
    // body to `http_<status>` so every caller handles one shape. Slack may
    // never have seen either, and "Slack declined: network_error" sends the
    // next person to check app scopes for a problem in the network.
    for (const error of ["network_error", "http_502", "http_429"]) {
      assert.deepEqual(outcomeOf({ ok: false, error }), { kind: "unanswered", error }, error);
    }
  });

  it("keeps the threadless sentinel out of Slack's vocabulary", () => {
    // `setSessionStatus` returns this when there is no thread to decorate; nothing was
    // ever sent, so nothing declined it.
    assert.deepEqual(outcomeOf({ ok: false, error: "no_thread" }), { kind: "no-thread" });
  });

  it("names something even when the refusal carried no code", () => {
    // An empty `error=` in the log is the same dead end as no log at all.
    assert.deepEqual(outcomeOf({ ok: false }), { kind: "declined", error: "unknown" });
    assert.deepEqual(outcomeOf({ ok: false, error: "" }), { kind: "declined", error: "unknown" });
  });
});

describe("the agent-session status the signal moves through", () => {
  it("raises with the one status that means work is in flight", () => {
    // The migration guide's mapping: a non-empty `assistant.threads.setStatus`
    // becomes `agents.sessions.setStatus` with `status: "processing"`.
    assert.equal(WORKING_STATUS, "processing");
  });

  it("settles an idle thread to active, which is open-and-idle rather than off", () => {
    // The other half of the same row: the empty-string clear becomes "active".
    assert.equal(settledStatus("idle"), "active");
  });

  it("settles a thread waiting on a person to suspended", () => {
    // Slack's own sentence: "If the agent needs user input to continue, it sets
    // `status: 'suspended'`". A thread holding a staged card is exactly that,
    // and `active` there told the person the agent was done and said nothing
    // about the ✅ still owed (#575).
    assert.equal(settledStatus("waiting-on-person"), "suspended");
  });

  it("maps every settlement the port can express, and nothing else", () => {
    // The guard is the COMPILE again: `settledStatus` switches exhaustively
    // over `TurnSettlement`, so a third settlement added to the port leaves it
    // without a return on that arm and `tsc` fails. What is asserted here is
    // that the two it has are DIFFERENT statuses — a mapping that collapsed
    // them would restore the bug while every other test passed.
    const settlements: TurnSettlement[] = ["idle", "waiting-on-person"];
    const statuses = settlements.map(settledStatus);
    assert.deepEqual(statuses, ["active", "suspended"]);
    assert.equal(new Set(statuses).size, settlements.length);
  });

  it("names all four lifecycle statuses, including the two it does not send", () => {
    // `closed` is Slack's vocabulary whether this app sends it or not, and a
    // type that named only what the app sends would have to be widened before
    // any mapping could be written against the rest.
    //
    // The guard is the COMPILE, not the assertion: `meaningOf` is exhaustive
    // over `SessionStatus`, so a fifth member added to the union leaves this
    // switch without a return on that arm and `tsc` fails the build. A runtime
    // check over a hand-written array would keep passing.
    const meaningOf = (status: SessionStatus): string => {
      switch (status) {
        case "active":
          return "open and idle — where a turn that blocks nobody settles";
        case "processing":
          return "work in flight — the raise";
        case "suspended":
          return "awaiting user input — where a turn waiting on a person settles";
        case "closed":
          return "the conversation is over — sent by nothing here";
      }
    };
    assert.match(meaningOf(WORKING_STATUS), /work in flight/);
    assert.match(meaningOf(settledStatus("idle")), /open and idle/);
    assert.match(meaningOf(settledStatus("waiting-on-person")), /awaiting user input/);
    assert.match(meaningOf("suspended"), /awaiting user input/);
    assert.match(meaningOf("closed"), /conversation is over/);
  });
});

// The whole of #575, as one table: what a turn ended up being, and what the
// person's surface says afterwards.
//
// It is read through BOTH halves — `settlementOf` (the turn's fact) then
// `settledStatus` (Slack's word for it) — because either half alone can be
// right while the pair is wrong, and the pair is what a person sees.
//
// The `Record` is the compile-time guard: it is keyed by `TurnDisposition`, so
// a further disposition added to Turn leaves this object missing a key and
// `tsc` refuses the build. Counting entries would not.
describe("what the thread says once the turn is over", () => {
  const statusFor = (disposition: TurnDisposition, cardLive: boolean): SessionStatus =>
    settledStatus(settlementOf({ disposition, cardLive }));

  /** No card live in this reply thread: the disposition is the whole story. */
  const WITH_NO_CARD_LIVE: Record<TurnDisposition, SessionStatus> = {
    // A card is up behind ✅ / ⛔ and nothing moves until it is clicked.
    staged: "suspended",
    // The turn asked instead of acting, so the next move is the person's.
    asked: "suspended",
    // Answered, and nothing outstanding.
    answered: "active",
    // The decision was taken and the tool ran.
    resolved: "active",
    // A 🙏 and no words is a finished turn.
    reacted: "active",
    // The person is choosing whether to retry — which is not the agent
    // waiting on an input it asked for.
    failed: "active",
    // Stop was pressed, the answer went undelivered, and nothing is owed
    // either way: the thread is open and quiet (#589).
    stopped: "active",
  };

  for (const [disposition, expected] of Object.entries(WITH_NO_CARD_LIVE) as Array<
    [TurnDisposition, SessionStatus]
  >) {
    it(`a turn that ${disposition} with no card live settles to ${expected}`, () => {
      assert.equal(statusFor(disposition, false), expected);
    });
  }

  /**
   * A card live in this reply thread, which one ending consumed.
   *
   * The second column, keyed the same way so it cannot fall behind the first.
   * #575's text listed `failed` and `reacted` as `active` outright; that would
   * let a turn which merely went wrong — or acknowledged with a 🙏 — overwrite
   * a thread's `suspended` with `active` while the card it is about sits there,
   * which is the claim the ticket's own third case exists to stop. The issue is
   * being updated to match this table.
   */
  const WITH_A_CARD_LIVE: Record<TurnDisposition, SessionStatus> = {
    staged: "suspended",
    asked: "suspended",
    // The ending the disposition alone gets wrong: the answer landed and the
    // card is still sitting there needing a click.
    answered: "suspended",
    // A later turn going wrong, or saying nothing, does not stop the thread
    // waiting on the decision it was already waiting on.
    failed: "suspended",
    reacted: "suspended",
    // A stop does not touch the card it found — it is not an undo, and the
    // click the card is waiting for is still owed.
    stopped: "suspended",
    // The one ending that consumed the card: the claim IS the resolution.
    resolved: "active",
  };

  for (const [disposition, expected] of Object.entries(WITH_A_CARD_LIVE) as Array<
    [TurnDisposition, SessionStatus]
  >) {
    it(`a turn that ${disposition} with a card live settles to ${expected}`, () => {
      assert.equal(statusFor(disposition, true), expected);
    });
  }

  it("reads the card as the deciding fact wherever the two columns differ", () => {
    // Stated as a relation rather than a third list: the live card may only
    // move an ending TOWARDS suspended, never away from it. A mapping that
    // ever read a live card as a reason to say `active` would be the original
    // bug wearing the new argument.
    for (const disposition of Object.keys(WITH_NO_CARD_LIVE) as TurnDisposition[]) {
      if (WITH_NO_CARD_LIVE[disposition] === "suspended") {
        assert.equal(WITH_A_CARD_LIVE[disposition], "suspended", disposition);
      }
    }
  });

  it("settles to closed from nothing at all", () => {
    // "The conversation is complete" is a claim no turn of ours can make: a
    // thread is never over, it is only quiet. Asserted over the whole table
    // rather than case by case, so a later ending cannot quietly acquire it.
    for (const disposition of Object.keys(WITH_NO_CARD_LIVE) as TurnDisposition[]) {
      for (const cardLive of [false, true]) {
        assert.notEqual(statusFor(disposition, cardLive), "closed", disposition);
      }
    }
  });
});

describe("the line a set or a clear leaves behind", () => {
  const ALL: WorkingSignalOutcome[] = [
    { kind: "ok" },
    { kind: "declined", error: "thread_not_found" },
    { kind: "unanswered", error: "network_error" },
    { kind: "budget-stop" },
    { kind: "no-thread" },
  ];

  it("says which half of the pairing spoke", () => {
    assert.match(workingSignalLine("set", { kind: "ok" }, 4), /^\[working\] set ok /);
    assert.match(workingSignalLine("clear", { kind: "ok" }, 31), /^\[working\] clear ok /);
  });

  it("names the Slack error code on a refusal", () => {
    const line = workingSignalLine("clear", { kind: "declined", error: "expired_thread" }, 31);
    assert.match(line, /declined by Slack/);
    assert.match(line, /error=expired_thread/);
  });

  it("blames Slack in exactly one outcome, and only where Slack answered", () => {
    // The defect this ticket exists to end, pinned as an invariant rather than
    // as four separate wordings: anything that did not get Slack's own verdict
    // must not put its name in the line.
    for (const outcome of ALL) {
      const line = workingSignalLine("clear", outcome, 12);
      assert.equal(/Slack/.test(line), outcome.kind === "declined", line);
    }
  });

  it("separates a call that never left the Worker from one that got no answer", () => {
    // Opposite fixes: a cheaper turn, versus a retry or an upstream check.
    const budget = workingSignalLine("clear", { kind: "budget-stop" }, SUBREQUEST_CAP);
    assert.match(budget, /never sent/);
    assert.match(budget, /subrequest budget/);

    const noAnswer = workingSignalLine("clear", { kind: "unanswered", error: "http_502" }, 27);
    assert.match(noAnswer, /got no answer/);
    assert.match(noAnswer, /error=http_502/);
    assert.doesNotMatch(noAnswer, /never sent/);

    const noThread = workingSignalLine("clear", { kind: "no-thread" }, 2);
    assert.match(noThread, /never sent/);
    assert.match(noThread, /no thread/);
  });

  it("carries the turn's external spend against the cap, on every outcome", () => {
    for (const outcome of ALL) {
      assert.match(
        workingSignalLine("clear", outcome, 38),
        new RegExp(`spent=38/${SUBREQUEST_CAP}\\b`),
        outcome.kind,
      );
    }
  });

  it("is one line — a log reader greps for it, and two lines is two events", () => {
    for (const outcome of ALL) {
      assert.ok(!workingSignalLine("clear", outcome, 9).includes("\n"), outcome.kind);
    }
  });
});


// ── Driving the adapter ──────────────────────────────────────────────────────
//
// The real Slack Delivery adapter, on a recording Slack client. What each case
// asks is what Slack was HANDED: which status, on which channel and thread, in
// what order, and what the pairing reported about it.

const CHANNEL = "C_DESIGN";
const THREAD = "1700000000.000100";
const DM = "D_ASSISTANT";
const ASKER = "U_ASKER";

function target(over: Partial<SlackDeliveryTarget> = {}): SlackDeliveryTarget {
  return {
    channel: CHANNEL,
    replyTs: THREAD,
    userMsgTs: "1700000000.000090",
    userId: ASKER,
    team: "T1",
    ...over,
  };
}

describe("the Slack adapter raises the signal on the thread it will settle", () => {
  it("raises the one status that means work is in flight", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target()).setWorking({ status: "is working on that…" });

    assert.deepEqual(slack.of("status"), [
      { kind: "status", channel: CHANNEL, threadTs: THREAD, status: WORKING_STATUS },
    ]);
  });

  it("raises nothing on a surface with no thread to decorate", async () => {
    // An agent_view DM posts at channel level; there is nothing to address, so
    // neither half is sent and neither half is reported. Absence of a PAIR is
    // the instrument — a lone set is what says an invocation died — so a half
    // that was never sent must not leave a line either.
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(), target({ replyTs: undefined }));
    await delivery.setWorking({ status: "is working on that…" });
    await delivery.clearWorking("idle");

    assert.deepEqual(slack.of("status"), []);
    assert.deepEqual(slack.lines, []);
  });

  it("raises nothing when the turn asked for no signal", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target()).setWorking({ titleFrom: "How do tabs work?" });
    assert.deepEqual(slack.of("status"), []);
  });

  it("clears where it set, so the pairing is one thread", async () => {
    // A set on one surface and a clear on another is an indicator nobody can
    // take down and a log that reads as if it had been.
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(), target());
    await delivery.setWorking({ status: "is working on that…" });
    await delivery.clearWorking("idle");

    const addressed = slack.of("status").map(({ channel, threadTs }) => ({ channel, threadTs }));
    assert.deepEqual(addressed, [
      { channel: CHANNEL, threadTs: THREAD },
      { channel: CHANNEL, threadTs: THREAD },
    ]);
  });
});

// #575's two layers, joined: the turn says what it left behind, and what Slack
// is handed for it comes out of `settledStatus` rather than a literal at the
// exit. Asserted THROUGH the adapter, because both halves being right
// separately is exactly what a settle written in place already looked like.
describe("the status a settlement produces, as Slack receives it", () => {
  const settleThrough = async (settlement: TurnSettlement) => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target()).clearWorking(settlement);
    return slack.of("status")[0]?.status;
  };

  it("hands Slack suspended for a thread waiting on a person", async () => {
    assert.equal(await settleThrough("waiting-on-person"), "suspended");
  });

  it("hands Slack active for a thread waiting on nobody", async () => {
    assert.equal(await settleThrough("idle"), "active");
  });

  it("reads every settlement through the pure mapping, never a literal", async () => {
    // The relation, not two more cases: whatever `settledStatus` says for a
    // settlement is what Slack is handed for it. A literal at the exit passes
    // the two cases above on the day it is written and diverges on the day the
    // mapping moves — which is the defect #575 went and found.
    const settlements: TurnSettlement[] = ["idle", "waiting-on-person"];
    for (const settlement of settlements) {
      assert.equal(await settleThrough(settlement), settledStatus(settlement), settlement);
    }
  });
});

describe("the adapter reports both halves instead of swallowing them", () => {
  const reported = async (opts: Parameters<typeof recordingSlack>[0] = {}) => {
    const slack = recordingSlack(opts);
    const delivery = deliveryAdapter(slack.deps(), target());
    await delivery.setWorking({ status: "is working on that…" });
    await delivery.clearWorking("idle");
    return slack.lines;
  };

  it("reports the successful pairing too — the silence was the whole defect", async () => {
    const lines = await reported();
    assert.deepEqual(
      lines.map(({ outcome }) => outcome.kind),
      ["ok", "ok"],
    );
    assert.match(lines[0]?.line ?? "", /^\[working\] set ok /);
    assert.match(lines[1]?.line ?? "", /^\[working\] clear ok /);
  });

  it("carries Slack's own code when Slack refused", async () => {
    const lines = await reported({ status: { ok: false, error: "thread_not_found" } });
    assert.deepEqual(
      lines.map(({ outcome }) => outcome),
      [
        { kind: "declined", error: "thread_not_found" },
        { kind: "declined", error: "thread_not_found" },
      ],
    );
  });

  it("does not put Slack's name on a call Slack never answered", async () => {
    const lines = await reported({ status: { ok: false, error: "network_error" } });
    assert.equal(lines[0]?.outcome.kind, "unanswered");
    assert.doesNotMatch(lines[0]?.line ?? "", /Slack/);
  });

  it("names a budget stop as never sent, not as a refusal", async () => {
    // The one throw that reaches the adapter by construction: `api.ts`
    // degrades every transport and parse failure into `{ ok: false, error }`
    // and rethrows exactly this.
    const lines = await reported({ statusThrows: new SubrequestBudgetError(SUBREQUEST_CAP) });
    assert.deepEqual(lines[0]?.outcome, { kind: "budget-stop" });
    assert.match(lines[0]?.line ?? "", /subrequest budget/);
  });

  it("refuses to render any other throw as a Slack decline", async () => {
    const lines = await reported({ statusThrows: new Error("socket hang up") });
    assert.deepEqual(lines[0]?.outcome, { kind: "unanswered", error: "socket hang up" });
    assert.doesNotMatch(lines[0]?.line ?? "", /Slack/);
  });

  it("never fails the turn over a signal, however the call went", async () => {
    // Best-effort is the contract: the work is already done by the time the
    // clear runs, and a thrown settle would lose the answer with it.
    await reported({ statusThrows: new Error("boom") });
    await reported({ status: { ok: false } });
  });
});

describe("the title is the assistant surface's alone", () => {
  it("names the session from the question that started it", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target({ channel: DM })).setWorking({
      titleFrom: "  How\ndo   tabs work?  ",
    });
    assert.deepEqual(slack.of("rename"), [
      { kind: "rename", channel: DM, threadTs: THREAD, title: "How do tabs work?" },
    ]);
  });

  it("leaves a channel thread unnamed — there is no such name to set", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target()).setWorking({
      status: "is working on that…",
      titleFrom: "How do tabs work?",
    });
    assert.deepEqual(slack.of("rename"), []);
  });

  it("names nothing when the turn handed over no question", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target({ channel: DM })).setWorking({
      status: "is working on that…",
    });
    assert.deepEqual(slack.of("rename"), []);
  });
});
