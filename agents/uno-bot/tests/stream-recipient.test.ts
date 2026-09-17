// `chat.startStream` needs `recipient_user_id` and `recipient_team_id` when it
// streams to a channel (the argument contract is stated once, above
// `startStream` in src/slack/api.ts). The plan-mode call site passed both from
// the day it was written; the answer path passed neither, so for six revisions
// every channel turn opened a stream Slack refused, fell back to an ordinary
// post, and said so only in a console.warn that read as Slack being fussy —
// one wasted call per turn, invisible because the fallback works (#572).
//
// The decision itself lives in `slack/stream-recipient.ts` so it can be tested
// by RUNNING it. What is left to source assertions is only what the Node lane
// cannot reach: `slack/delivery.ts` and `slack/slack-delivery.ts` both name
// `Env` and the Slack client, and `startStream`'s recipient parameters are
// optional, so a caller can drop them again with the type checker none the
// wiser. Reading source for that is the same move as the door check in
// `confirmation-paths.test.ts`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { decideStream } from "../src/slack/stream-recipient";

/** A source file with its whitespace collapsed, so a reflow cannot fail a test
 *  about arguments with a message about formatting. */
function flatSource(file: string): string {
  return readFileSync(resolve(process.cwd(), file), "utf8").replace(/\s+/g, " ");
}

const BOTH = { userId: "U1", team: "T1" };
const OPEN_TS = "1700000000.000200";

describe("opening a stream", () => {
  it("needs both recipient ids", () => {
    assert.deepEqual(decideStream(undefined, BOTH), { open: true });
  });

  it("is refused when either id is missing, and names the half", () => {
    // Named, because the caller logs it: a turn that lost streaming without
    // saying so is the same silence #572 was about.
    assert.deepEqual(decideStream(undefined, { userId: "U1" }), {
      open: false,
      missing: "team",
    });
    assert.deepEqual(decideStream(undefined, { userId: "", team: "T1" }), {
      open: false,
      missing: "user",
    });
  });

  it("calls a recipient with nothing in it unremarkable", () => {
    // Neither half: a path that never had a recipient, not a turn that lost
    // one — so `delivery.ts` stays quiet about it.
    assert.deepEqual(decideStream(undefined, { userId: "", team: "" }), {
      open: false,
      missing: "recipient",
    });
    // `userId` reaches this via `event.user!` in slack/turn-adapter.ts, so a
    // wholly absent recipient is reachable at runtime whatever the type says.
    assert.deepEqual(decideStream(undefined, undefined), {
      open: false,
      missing: "recipient",
    });
  });

  it("reuses a stream already open, whatever the recipient looks like", () => {
    // Plan mode opened it WITH the ids; the answer only closes it, and a
    // handed-over stream left unclosed renders as work still in progress.
    assert.deepEqual(decideStream(OPEN_TS, BOTH), { open: true });
    assert.deepEqual(decideStream(OPEN_TS, { userId: "" }), { open: true });
    assert.deepEqual(decideStream(OPEN_TS, undefined), { open: true });
  });
});

describe("the answer path", () => {
  it("asks Slack for the recipient ids it requires", () => {
    const src = flatSource("src/slack/delivery.ts");
    const call = src.slice(src.indexOf("await startStream("));
    const args = call.slice(0, call.indexOf(")"));
    assert.ok(args.includes("recipient.userId"), "the asker reaches startStream");
    assert.ok(args.includes("recipient.team"), "and their workspace with them");
  });

  it("consults the decision before it calls Slack, and says when it skips", () => {
    // `decideStream` being correct is no use if the answer path stops asking
    // it. Positions, not formatting: the question has to be put BEFORE the
    // call, or it is not a guard.
    const src = flatSource("src/slack/delivery.ts");
    const guard = src.indexOf("decideStream(");
    assert.ok(guard > 0, "the answer path asks whether it may open a stream");
    assert.ok(guard < src.indexOf("await startStream("), "and asks first");
    // And an incomplete recipient is never a silent no-op — the whole lesson
    // of #572 is that an unlogged fallback outlives the people who caused it.
    const skip = src.indexOf("[slack] stream skipped");
    assert.ok(skip > guard, "the skip is logged where it is decided");
    assert.ok(
      src.slice(guard, skip).includes('decision.missing !== "recipient"'),
      "and only for the surprising half-recipient case",
    );
  });

  it("is handed the ids by the adapter that holds them", () => {
    const src = flatSource("src/slack/slack-delivery.ts");
    const call = src.slice(src.indexOf("await postTextVerified("));
    const args = call.slice(0, call.indexOf(");"));
    assert.ok(
      args.includes("userId: target.userId"),
      "postAnswer passes the asker through to the answer path",
    );
    assert.ok(args.includes("team: target.team"), "and their workspace with them");
  });
});
