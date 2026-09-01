import assert from "node:assert/strict";
import test from "node:test";
import {
  historyVisionTurn,
  selectPreviousVisionReference,
} from "../src/slack/vision-reference";

const reference = {
  files: [{ name: "dashboard.png", mimetype: "image/png", url_private: "https://files.slack.test/dashboard" }],
};

test("the immediately previous user image lives for one follow-up", () => {
  assert.deepEqual(
    selectPreviousVisionReference([
      { role: "user", content: "look at this", ts: "1", vision: reference },
      { role: "assistant", content: "I see it" },
    ], false),
    { turnTs: "1", reference },
  );
});

test("a text-only user turn ends the previous image's lifetime", () => {
  assert.equal(
    selectPreviousVisionReference([
      { role: "user", content: "look at this", ts: "1", vision: reference },
      { role: "assistant", content: "I see it" },
      { role: "user", content: "first follow-up", ts: "2" },
      { role: "assistant", content: "answered" },
    ], false),
    null,
  );
});

test("a new current image supersedes the previous one", () => {
  assert.equal(
    selectPreviousVisionReference([
      { role: "user", content: "look at this", ts: "1", vision: reference },
    ], true),
    null,
  );
});

test("an image-only Slack message survives thread-history reconstruction", () => {
  assert.deepEqual(
    historyVisionTurn("", reference.files),
    { content: "[image attached: dashboard.png]", vision: reference },
  );
});
