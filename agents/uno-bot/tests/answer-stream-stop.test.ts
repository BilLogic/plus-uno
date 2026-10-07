// An answer stream is stopped once.
//
// When the append fails and the stop succeeds, the stream is already closed:
// stopping it again is the `message_not_in_streaming_state` production logged
// on every checklist turn. A second stop is only for a first one that failed.
//
// Driven on the recording posting client, which refuses a stop on a stream
// already stopped the way Slack does.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { recordingPosting } from "./helpers/recording-slack";

const RECIPIENT = { userId: "U1", team: "T1" };
const ANSWER = "Tabs are documented in the design system.";

/** Run `fn` with `console.warn` silenced; the fallback's line is expected. */
async function quietly<T>(fn: () => Promise<T>): Promise<T> {
  const orig = console.warn;
  console.warn = () => {};
  try {
    return await fn();
  } finally {
    console.warn = orig;
  }
}

describe("finishing an answer stream", () => {
  it("stops once when the append fails, then posts the answer the ordinary way", async () => {
    const slack = recordingPosting({ appendFails: true });
    const posted = await quietly(() => postTextVerified(slack.deps(), "C1", "100.1", ANSWER, RECIPIENT));

    assert.equal(posted.ok, true);
    assert.equal(slack.of("stopStream").length, 1, "one stop per stream");
    assert.equal(slack.of("message").length, 1, "the answer posts beneath");
  });

  it("stops again when the first stop failed, so nothing is left streaming", async () => {
    const slack = recordingPosting({ stopFails: true });
    await quietly(() => postTextVerified(slack.deps(), "C1", "100.1", ANSWER, RECIPIENT));

    assert.equal(slack.of("stopStream").length, 2);
  });
});
