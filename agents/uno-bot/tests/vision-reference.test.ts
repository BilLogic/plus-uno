import assert from "node:assert/strict";
import test from "node:test";
import {
  historyVisionTurn,
  selectPreviousVisionReference,
  visionReferenceFor,
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

test("a stored figma reference is one the renderer can actually honour", () => {
  // These four were accepted by the old substring pattern and refused by
  // parseFigmaUrl, so each stored a reference the next turn could never
  // render — and made the turn look like it carried files, which costs it the
  // trivial-turn shortcut.
  const unrenderable = [
    "https://www.figma.com/board/ABC123/Jam?node-id=1-2",
    "https://www.figma.com/design/ABC123/Spec#node-id=1-2",
    "https://www.figma.com/design/ABC123/Spec?Node-Id=1-2",
    "https://www.figma.com/design/ABC123/Spec",
  ];
  for (const url of unrenderable) {
    assert.equal(visionReferenceFor(url, undefined), undefined, url);
  }

  const renderable = "https://www.figma.com/design/ABC123/Spec?node-id=158-21725";
  assert.equal(visionReferenceFor(renderable, undefined)?.figmaUrl, renderable);
});

test("the recognizer stops at Slack's link delimiters", () => {
  const wrapped = "<https://www.figma.com/design/ABC123/Spec?node-id=158-21725|the frame>";
  assert.equal(
    visionReferenceFor(wrapped, undefined)?.figmaUrl,
    "https://www.figma.com/design/ABC123/Spec?node-id=158-21725",
  );
});
