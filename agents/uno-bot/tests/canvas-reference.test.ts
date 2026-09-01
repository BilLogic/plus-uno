import assert from "node:assert/strict";
import test from "node:test";
import {
  canvasIdsSharedByMessage,
  canvasIdsSharedBySlackHistoryMessage,
  canvasIdsSharedIntoConversation,
  messageTextWithCanvasAttachments,
} from "../src/slack/canvas-reference";
import { appMentionToMessage } from "../src/slack/event-provenance";

test("a Canvas permalink shared in a Slack message enters the conversation allowlist", () => {
  assert.deepEqual(
    canvasIdsSharedByMessage(
      "Please review https://plus.slack.com/docs/T01234567/F012CANVAS9 today",
      undefined,
    ),
    ["F012CANVAS9"],
  );
});

test("a Canvas attachment enters the allowlist while ordinary files do not", () => {
  assert.deepEqual(
    canvasIdsSharedByMessage("", [
      { id: "F012CANVAS9", mimetype: "application/vnd.slack-docs" },
      { id: "F012IMAGE99", mimetype: "image/png" },
    ]),
    ["F012CANVAS9"],
  );
});

test("the allowlist is the union of canvases shared in the current message and its conversation history", () => {
  assert.deepEqual(
    canvasIdsSharedIntoConversation(
      "Use https://plus.slack.com/docs/T01234567/F012CURRENT9",
      undefined,
      [
        {
          role: "user",
          content: "Earlier context",
          sharedCanvasIds: ["F012HISTORY9"],
        },
      ],
    ),
    ["F012HISTORY9", "F012CURRENT9"],
  );
});

test("a Canvas URL emitted by the assistant does not enter the allowlist", () => {
  assert.deepEqual(
    canvasIdsSharedIntoConversation("What does that say?", undefined, [
      {
        role: "assistant",
        content: "Try https://plus.slack.com/docs/T01234567/F012CANVAS9",
      },
    ]),
    [],
  );
});

test("a Canvas link posted by another Slack bot does not enter the allowlist", () => {
  assert.deepEqual(
    canvasIdsSharedBySlackHistoryMessage({
      user: "U012BOTUSER",
      bot_id: "B012FOREIGN",
      text: "https://plus.slack.com/docs/T01234567/F012CANVAS9",
    }),
    [],
  );
});

test("app_mention conversion preserves foreign-bot provenance", () => {
  const message = appMentionToMessage({
    type: "app_mention",
    channel: "C012CHANNEL",
    user: "U012BOTUSER",
    bot_id: "B012FOREIGN",
    text: "<@U012UNO> read https://plus.slack.com/docs/T01234567/F012CANVAS9",
    ts: "123.456",
  });

  assert.equal(message.bot_id, "B012FOREIGN");
});

test("user-role history text without trusted share metadata does not grant Canvas access", () => {
  assert.deepEqual(
    canvasIdsSharedIntoConversation("What does that say?", undefined, [
      {
        role: "user",
        content: "https://plus.slack.com/docs/T01234567/F012CANVAS9",
      },
    ]),
    [],
  );
});

test("a Canvas attachment gives the model a source_read URL in the user turn", () => {
  assert.equal(
    messageTextWithCanvasAttachments("Summarize this", [
      {
        id: "F012CANVAS9",
        mimetype: "application/vnd.slack-docs",
        permalink: "https://plus.slack.com/docs/T01234567/F012CANVAS9",
      },
    ]),
    "Summarize this\n\n[Slack Canvas shared in this conversation: https://plus.slack.com/docs/T01234567/F012CANVAS9]",
  );
});
