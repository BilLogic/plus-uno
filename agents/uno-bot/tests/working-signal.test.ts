// The working signal answers for itself.
//
// A stuck "Working…" had two possible causes and one symptom: Slack refused the
// clear, or the clear was never sent — the invocation died on the free plan's
// 50-subrequest cap, or was hard-killed. The same silence, opposite fixes, and
// three diagnoses made from screenshots because the logs held nothing.
//
// So what is pinned here is the DISTINCTION: a refusal names Slack's code, a
// budget stop says it never left the Worker, and every clear carries the turn's
// external spend so an absent line reads as "never reached delivery" rather
// than as "nothing to report".
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { SUBREQUEST_CAP } from "../src/agent/loop-policy";
import { outcomeOf, workingSignalLine } from "../src/slack/working-signal";

describe("Slack's verdict on the status call", () => {
  it("reads an accepted call as ok", () => {
    assert.deepEqual(outcomeOf({ ok: true }), { kind: "ok" });
  });

  it("carries the error code of a refusal", () => {
    assert.deepEqual(outcomeOf({ ok: false, error: "thread_not_found" }), {
      kind: "declined",
      error: "thread_not_found",
    });
  });

  it("names something even when Slack refused without a code", () => {
    // An empty `error=` in the log is the same dead end as no log at all.
    assert.deepEqual(outcomeOf({ ok: false }), { kind: "declined", error: "unknown" });
    assert.deepEqual(outcomeOf({ ok: false, error: "" }), { kind: "declined", error: "unknown" });
  });
});

describe("the line a set or a clear leaves behind", () => {
  it("says which half of the pairing spoke", () => {
    assert.match(workingSignalLine("set", { kind: "ok" }, 4), /^\[working\] set ok /);
    assert.match(workingSignalLine("clear", { kind: "ok" }, 31), /^\[working\] clear ok /);
  });

  it("names the Slack error code on a refusal", () => {
    const line = workingSignalLine("clear", { kind: "declined", error: "expired_thread" }, 31);
    assert.match(line, /declined by Slack/);
    assert.match(line, /error=expired_thread/);
  });

  it("reports a budget stop as a budget stop, not as a Slack failure", () => {
    // The two need opposite fixes: a cheaper turn versus a Slack scope. A
    // budget stop logged as a generic failure sends the next diagnosis at the
    // wrong one.
    const line = workingSignalLine("clear", { kind: "budget-stop" }, 50);
    assert.match(line, /never sent/);
    assert.match(line, /subrequest budget/);
    assert.doesNotMatch(line, /Slack/);
  });

  it("carries the turn's external spend against the cap, on every outcome", () => {
    const outcomes = [
      { kind: "ok" } as const,
      { kind: "declined", error: "thread_not_found" } as const,
      { kind: "budget-stop" } as const,
    ];
    for (const outcome of outcomes) {
      assert.match(
        workingSignalLine("clear", outcome, 38),
        new RegExp(`spent=38/${SUBREQUEST_CAP}\\b`),
        outcome.kind,
      );
    }
  });

  it("is one line — a log reader greps for it, and two lines is two events", () => {
    assert.ok(!workingSignalLine("clear", { kind: "budget-stop" }, 50).includes("\n"));
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
  });
});
