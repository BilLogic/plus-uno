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
  workingSignalLine,
  type WorkingSignalOutcome,
} from "../src/slack/working-signal";

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
    // `setStatus` returns this when there is no thread to decorate; nothing was
    // ever sent, so nothing declined it.
    assert.deepEqual(outcomeOf({ ok: false, error: "no_thread" }), { kind: "no-thread" });
  });

  it("names something even when the refusal carried no code", () => {
    // An empty `error=` in the log is the same dead end as no log at all.
    assert.deepEqual(outcomeOf({ ok: false }), { kind: "declined", error: "unknown" });
    assert.deepEqual(outcomeOf({ ok: false, error: "" }), { kind: "declined", error: "unknown" });
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
    assert.match(src, /reportStatus\("set", \(\) => setStatus\(/);
    assert.match(src, /reportStatus\("clear", \(\) => setStatus\(/);
    // The swallow that made the signal undiagnosable in the first place.
    assert.ok(!/setStatus\([^)]*\)\.catch\(/.test(src), "no status call is silently swallowed");
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
