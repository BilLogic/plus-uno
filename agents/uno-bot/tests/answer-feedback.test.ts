// A press of an answer's feedback buttons, through the feedback door: what
// lands on the usage record, and the pop-up a "bad answer" opens.
//
// Driven on the in-memory feedback log and the recording views client, which
// refuses a view Slack would refuse — so a green case means the pop-up opens,
// not merely that the door called something.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runFeedbackReason, runFeedbackTap, type FeedbackDoorDeps } from "../src/slack/feedback-door";
import { feedbackAckFor, feedbackBlock } from "../src/slack/feedback";
import { viewRefusal } from "./helpers/slack-block-rules";
import { createInMemoryAnswerFeedbackLog } from "../src/usage/feedback";
import { recordingViews } from "./helpers/recording-slack";

const TURN = "C1:1700000000.000100";
const ANSWER = "1700000009.000300";
const NOW = 1_700_000_100_000;

/** A button's value, as the posted row spells it. */
function valueOf(rating: "up" | "down"): string {
  const element = (feedbackBlock({ turnId: TURN }).elements as Array<Record<string, { value: string }>>)[0]!;
  return element[rating === "up" ? "positive_button" : "negative_button"]!.value;
}

function door() {
  const log = createInMemoryAnswerFeedbackLog();
  const views = recordingViews();
  const notes: Array<{ channel: string; threadTs: string; text: string }> = [];
  const deps: FeedbackDoorDeps = {
    log,
    openView: views.client.open,
    postNote: async (channel, threadTs, text) => void notes.push({ channel, threadTs, text }),
    now: () => NOW,
  };
  return { log, views, notes, deps };
}

const tap = (value: string) => ({
  channel: "C1",
  answerTs: ANSWER,
  threadTs: "1700000000.000100",
  userId: "U1",
  value,
  triggerId: "trigger-1",
});

/** The pop-up as Slack sends it back: its metadata and what was picked. */
function submitted(view: unknown, reason: string | null, note: string | null) {
  const v = view as { private_metadata: string };
  return {
    private_metadata: v.private_metadata,
    state: {
      values: {
        uno_feedback_reason: { reason: { selected_option: reason ? { value: reason } : null } },
        uno_feedback_note: { note: { value: note } },
      },
    },
  };
}

describe("a good answer", () => {
  it("is recorded against the answer's ts and its turn, and opens nothing", async () => {
    const { log, views, deps } = door();
    await runFeedbackTap(tap(valueOf("up")), deps);

    assert.deepEqual(await log.get(ANSWER, "U1"), {
      answerTs: ANSWER,
      userId: "U1",
      turnId: TURN,
      rating: "up",
      reason: null,
      hasNote: false,
      at: NOW,
    });
    assert.equal(views.calls.length, 0);
  });
});

describe("a bad answer", () => {
  it("is recorded at the press, before any reason is given", async () => {
    const { log, deps } = door();
    await runFeedbackTap(tap(valueOf("down")), deps);

    assert.equal((await log.get(ANSWER, "U1"))?.rating, "down");
    assert.equal((await log.get(ANSWER, "U1"))?.reason, null);
  });

  it("opens a pop-up offering the four reasons and a note", async () => {
    const { views, deps } = door();
    await runFeedbackTap(tap(valueOf("down")), deps);

    const [open] = views.calls;
    assert.equal(open?.kind, "open");
    const view = (open as { view: { blocks: Array<Record<string, any>> } }).view;
    const [reasons, note] = view.blocks;
    assert.deepEqual(
      reasons!.element.options.map((o: { text: { text: string } }) => o.text.text),
      ["Wrong facts", "Missing source", "Too long", "Other"],
    );
    assert.equal(note!.optional, true);
  });

  it("stores the reason the pop-up came back with", async () => {
    const { log, views, notes, deps } = door();
    await runFeedbackTap(tap(valueOf("down")), deps);
    const view = (views.calls[0] as { view: unknown }).view;
    await runFeedbackReason({ userId: "U1", view: submitted(view, "missing_source", null) }, deps);

    const row = await log.get(ANSWER, "U1");
    assert.equal(row?.reason, "missing_source");
    assert.equal(row?.hasNote, false);
    assert.equal(row?.turnId, TURN);
    assert.equal(notes.length, 0, "no note, nothing posted");
  });

  it("turns into one line saying it registered, once sent", async () => {
    const { views, deps } = door();
    await runFeedbackTap(tap(valueOf("down")), deps);
    const view = (views.calls[0] as { view: unknown }).view;
    const ack = feedbackAckFor(submitted(view, "other", null)) as { response_action: string; view: unknown };

    assert.equal(ack.response_action, "update");
    assert.equal(viewRefusal(ack.view), null);
    assert.equal(feedbackAckFor(submitted(view, null, "no reason picked")), null);
  });

  it("posts a note in the answer's thread and keeps only that there was one", async () => {
    const { log, views, notes, deps } = door();
    await runFeedbackTap(tap(valueOf("down")), deps);
    const view = (views.calls[0] as { view: unknown }).view;
    await runFeedbackReason({ userId: "U1", view: submitted(view, "too_long", "Half of this was the plan again.") }, deps);

    assert.equal((await log.get(ANSWER, "U1"))?.hasNote, true);
    assert.equal(notes.length, 1);
    assert.equal(notes[0]!.channel, "C1");
    assert.equal(notes[0]!.threadTs, "1700000000.000100");
    assert.match(notes[0]!.text, /<@U1>/);
    assert.match(notes[0]!.text, /too long/);
    assert.match(notes[0]!.text, /Half of this was the plan again\./);
  });

  it("still records the press when the pop-up cannot open", async () => {
    const { log, deps } = door();
    await runFeedbackTap(tap(valueOf("down")), { ...deps, openView: async () => null });

    assert.equal((await log.get(ANSWER, "U1"))?.rating, "down");
  });
});

describe("a press the door cannot read", () => {
  it("records nothing", async () => {
    const { log, deps } = door();
    await runFeedbackTap(tap("sideways"), deps);

    assert.equal(log.records().length, 0);
  });

  it("does not take down the press when the record fails", async () => {
    const { views, deps } = door();
    const orig = console.error;
    console.error = () => {};
    try {
      await runFeedbackTap(tap(valueOf("down")), {
        ...deps,
        log: { record: async () => Promise.reject(new Error("D1 down")), get: async () => null },
      });
    } finally {
      console.error = orig;
    }
    assert.equal(views.calls.length, 1, "the pop-up still opened");
  });
});
