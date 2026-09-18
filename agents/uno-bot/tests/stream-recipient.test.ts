// `chat.startStream` needs `recipient_user_id` and `recipient_team_id` when it
// streams to a channel (the argument contract is stated once, above
// `startStream` in src/slack/api.ts). The plan-mode call site passed both from
// the day it was written; the answer path passed neither, so for six revisions
// every channel turn opened a stream Slack refused, fell back to an ordinary
// post, and said so only in a console.warn that read as Slack being fussy —
// one wasted call per turn, invisible because the fallback works (#572).
//
// The decision itself lives in `slack/stream-recipient.ts` so it can be tested
// by RUNNING it. The posting functions that consult it take a named Slack
// client (#654), so the recipient pair is watched arriving rather than matched
// in source. The Slack Delivery adapter that hands the pair over is DRIVEN
// too — it takes its client by name since #594.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decideStream } from "../src/slack/stream-recipient";
import { postTextVerified } from "../src/slack/delivery";
import { deliveryAdapter } from "../src/slack/delivery-adapter";
import { recordingPosting, recordingSlack } from "./helpers/recording-slack";

const BOTH = { userId: "U1", team: "T1" };
const OPEN_TS = "1700000000.000200";
const CHANNEL = "C_DESIGN";
const ANSWER = "Tabs are documented in the design system.";

/**
 * Capture `console.warn` for the duration of `fn`.
 *
 * @param fn the posting call that may log a skip
 * @returns every warning line, in order
 */
async function withWarns(fn: () => Promise<unknown>): Promise<string[]> {
  const warns: string[] = [];
  const orig = console.warn;
  console.warn = (...args: unknown[]) => {
    warns.push(args.map(String).join(" "));
  };
  try {
    await fn();
    return warns;
  } finally {
    console.warn = orig;
  }
}

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
  it("asks Slack for the recipient ids it requires", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps(), CHANNEL, OPEN_TS, ANSWER, BOTH);

    assert.deepEqual(
      slack.of("startStream").map(({ userId, team }) => ({ userId, team })),
      [BOTH],
      "the asker and their workspace reach startStream together",
    );
    assert.equal(slack.of("appendStream").length, 1);
    assert.equal(slack.of("stopStream").length, 1);
    // Stream finished: the ordinary post is the fallback, not a second copy.
    assert.deepEqual(slack.of("message"), []);
  });

  it("does not open a stream for a half recipient, and says so", async () => {
    // The surprising case: a turn that quietly lost streaming. Until #572 the
    // only symptom was a wasted `invalid_arguments` on the way to the ordinary
    // post. A call that cannot succeed must not be made.
    const slack = recordingPosting();
    const warns = await withWarns(() =>
      postTextVerified(slack.deps(), CHANNEL, OPEN_TS, ANSWER, { userId: "U1" }),
    );

    assert.deepEqual(slack.of("startStream"), [], "startStream is not called with a half recipient");
    assert.ok(slack.of("message").length > 0, "the answer still posts as an ordinary message");
    assert.match(warns.join("\n"), /stream skipped: recipient missing team/);
  });

  it("stays quiet, and still does not call Slack, when there is no recipient at all", async () => {
    // A path that never had a recipient was never going to stream — logging
    // that is noise, calling Slack for it is the #572 defect again.
    const slack = recordingPosting();
    const warns = await withWarns(() =>
      postTextVerified(slack.deps(), CHANNEL, OPEN_TS, ANSWER, { userId: "", team: "" }),
    );

    assert.deepEqual(slack.of("startStream"), []);
    assert.ok(slack.of("message").length > 0);
    assert.equal(
      warns.filter((line) => line.includes("stream skipped")).length,
      0,
      "an absent recipient is unremarkable and is not logged",
    );
  });

  it("is handed the ids by the adapter that holds them", async () => {
    // DRIVEN, not read: the Slack Delivery adapter takes its client by name
    // (#594), so the pair can be watched arriving rather than matched in the
    // adapter's source.
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), {
      channel: CHANNEL,
      replyTs: OPEN_TS,
      userMsgTs: "1700000000.000090",
      userId: BOTH.userId,
      team: BOTH.team,
    }).postAnswer(ANSWER);

    assert.deepEqual(
      slack.of("answer").map(({ userId, team }) => ({ userId, team })),
      [BOTH],
      "the asker and their workspace reach the answer path together",
    );
  });
});
