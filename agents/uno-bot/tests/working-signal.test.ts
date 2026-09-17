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
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { SUBREQUEST_CAP } from "../src/agent/loop-policy";
import {
  outcomeOf,
  settledStatus,
  workingSignalLine,
  WORKING_STATUS,
  type SessionStatus,
  type WorkingSignalOutcome,
} from "../src/slack/working-signal";
import { settlementOf, type TurnDisposition, type TurnSettlement } from "../src/turn/index";

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
// a seventh disposition added to Turn leaves this object missing a key and
// `tsc` refuses the build. Counting entries would not.
describe("what the thread says once the turn is over", () => {
  const statusFor = (disposition: TurnDisposition, cardLive: boolean): SessionStatus =>
    settledStatus(settlementOf({ disposition, cardLive }));

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
  };

  for (const [disposition, expected] of Object.entries(WITH_NO_CARD_LIVE) as Array<
    [TurnDisposition, SessionStatus]
  >) {
    it(`a turn that ${disposition} with no card live settles to ${expected}`, () => {
      assert.equal(statusFor(disposition, false), expected);
    });
  }

  it("suspends an answer delivered while a card is still live in the thread", () => {
    // The case that makes this a function of the thread and not of the
    // disposition alone: ask something unrelated while a card is pending, get
    // a text answer, and the turn ended fine with the thread still blocked.
    assert.equal(statusFor("answered", true), "suspended");
    assert.equal(statusFor("answered", false), "active");
  });

  it("does not let a live card override the endings that are nobody's turn", () => {
    // `resolved` retires the card it resolved, and a `failed` turn leaves a
    // person deciding about a retry rather than about a card. Reading the
    // thread's card as "suspended" everywhere would make the status a
    // property of the thread's history instead of this turn's ending.
    for (const disposition of ["resolved", "reacted", "failed"] as const) {
      assert.equal(statusFor(disposition, true), "active", disposition);
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

// `slack-delivery.ts` names `Env` and the Slack client, so this suite's compile
// cannot reach it (`tsconfig.test.json` types only Node). Read it instead —
// same move as the door check in `confirmation-paths.test.ts`. The failure this
// guards is silent: an adapter that goes back to `.catch(() => {})` still
// clears the indicator, and still reports nothing when it doesn't.
describe("the Slack adapter routes both halves through the report", () => {
  const src = readFileSync(resolve(process.cwd(), "src/slack/slack-delivery.ts"), "utf8");

  it("reports the set and the clear instead of swallowing them", () => {
    assert.match(src, /reportStatus\("set", \(\) => setSessionStatus\(/);
    assert.match(src, /reportStatus\("clear", \(\) =>\s*setSessionStatus\(/);
    // The swallow that made the signal undiagnosable in the first place.
    assert.ok(
      !/setSessionStatus\([^)]*\)\.catch\(/.test(src),
      "no status call is silently swallowed",
    );
  });

  it("raises and settles through the named statuses rather than writing them here", () => {
    // The settle is the ONLY thing that clears the indicator now — the guide:
    // "the loading UX no longer disappears automatically when your app posts a
    // message to the thread" — so a literal `"active"` written at the exit is a
    // settle #575 would have to go and find again. Both halves read the pure
    // module instead (#574).
    //
    // These two positive matches are the whole guard, deliberately. A negative
    // one — grepping this file for the literals — was written and dropped: it
    // sees only this file and only the double-quoted spelling, so it would
    // miss a literal in `assistant.ts` or in either Gate door while failing on
    // a doc comment that merely quotes a status name. An assertion that strict
    // in the wrong places and absent in the right ones is worse than none.
    assert.match(src, /setSessionStatus\(env, channel, replyTs, WORKING_STATUS\)/);
    assert.match(src, /setSessionStatus\(env, channel, replyTs, settledStatus\(settlement\)\)/s);
  });

  it("reads the subrequest meter and tells a budget stop apart", () => {
    assert.match(src, /subrequestsUsed\(\)/);
    assert.match(src, /isSubrequestBudgetError\(err\)/);
    // The catch's other arm is the compiler's, not a case — but if it ever
    // fires it must not render a JS exception message as a Slack refusal.
    const caught = src.slice(src.indexOf("isSubrequestBudgetError(err)"));
    assert.ok(!/kind: "declined"/.test(caught), "a throw is never reported as a Slack decline");
  });
});

// `assistant.ts` names `Env` too, so this is the same genre of check: read the
// module and assert on what it sends. The acceptance criterion is a negative
// one — "no bridged assistant status or title calls remain" — and a negative is
// exactly what a behavioural test cannot see, because a bridged call still
// works today. It works until February 2027, and it no longer clears the
// indicator when the answer posts, which is the defect (#574).
describe("the methods the working signal sends", () => {
  const src = readFileSync(resolve(process.cwd(), "src/slack/assistant.ts"), "utf8");

  it("moves the session's status and renames the session", () => {
    assert.match(src, /slackCall\(env, "agents\.sessions\.setStatus"/);
    assert.match(src, /slackCall\(env, "agents\.sessions\.rename"/);
  });

  it("sends no bridged status or title call", () => {
    assert.ok(!src.includes('"assistant.threads.setStatus"'), "setStatus is gone");
    assert.ok(!src.includes('"assistant.threads.setTitle"'), "setTitle is gone");
  });

  it("leaves suggested prompts alone — Slack has published no replacement", () => {
    assert.match(src, /slackCall\(env, "assistant\.threads\.setSuggestedPrompts"/);
  });

  it("keeps the thread guard the session methods still need", () => {
    // `thread_ts` is required for thread-based sessions in regular channels and
    // DMs, which is every surface this bot has.
    assert.match(src, /if \(!thread_ts\) return \{ ok: false, error: "no_thread" \}/);
    assert.match(src, /thread_ts,/);
  });

  it("sends no argument the session method does not define", () => {
    // `loading_messages` was `assistant.threads.setStatus`'s. `agents.sessions.
    // setStatus` documents status, channel_id, thread_ts, title,
    // initiator_user_id and the customize trio — and nothing else.
    assert.ok(!/loading_messages:/.test(src), "loading_messages is not a session argument");
  });
});
