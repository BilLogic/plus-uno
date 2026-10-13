// Answer streaming can be held to a few channels while someone decides whether
// the team should get it. With `SLACK_STREAMING_CHANNELS` set, an answer streams
// only in a channel on the list and posts the ordinary way everywhere else;
// unset, the flag means every channel, as it always has.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { postingDeps } from "../src/slack/slack-delivery";
import { recordingPosting } from "./helpers/recording-slack";

type Env = import("../src/types").Env;

const RECIPIENT = { userId: "U1", team: "T1" };
const ANSWER = "Two cards are in WIP.";
const ON = { SLACK_STREAMING: "on", SLACK_STREAM_MARKUP_PROBE: "pass:2026-09-22" } as Env;

describe("the answer-stream channel list", () => {
  it("streams in a listed channel", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamChannels: new Set(["C_SANDBOX", "D_BILL"]) }), "D_BILL", "100.1", ANSWER, RECIPIENT);
    assert.equal(slack.of("startStream").length, 1);
  });

  it("posts the ordinary way in a channel off the list", async () => {
    const slack = recordingPosting();
    const posted = await postTextVerified(slack.deps({ streamChannels: new Set(["C_SANDBOX"]) }), "C_TEAM", "100.1", ANSWER, RECIPIENT);
    assert.equal(posted.ok, true);
    assert.equal(slack.of("startStream").length, 0, "no stream opened");
    assert.equal(slack.of("message").length, 1);
  });

  it("streams everywhere when no list is set", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamChannels: null }), "C_TEAM", "100.1", ANSWER, RECIPIENT);
    assert.equal(slack.of("startStream").length, 1);
  });

  it("is read from SLACK_STREAMING_CHANNELS, comma-separated, blank meaning every channel", () => {
    assert.deepEqual(
      [...(postingDeps({ ...ON, SLACK_STREAMING_CHANNELS: " C0B4QBWAUJU, D0APTB20SK0 ,," } as Env).streamChannels ?? [])],
      ["C0B4QBWAUJU", "D0APTB20SK0"],
    );
    assert.equal(postingDeps(ON).streamChannels, null);
    assert.equal(postingDeps({ ...ON, SLACK_STREAMING_CHANNELS: "  " } as Env).streamChannels, null);
  });
});
