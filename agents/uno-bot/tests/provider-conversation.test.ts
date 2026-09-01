import assert from "node:assert/strict";
import test from "node:test";
import { buildProviderConversation } from "../src/agent/provider-conversation";

const PRIOR_IMAGE = { media_type: "image/png", data: "prior-image" };
const CURRENT_IMAGE = { media_type: "image/jpeg", data: "current-image" };

test("a rehydrated image stays on the historical user turn", () => {
  const conversation = buildProviderConversation(
    [
      { role: "user", content: "What do you see?", ts: "1" },
      { role: "assistant", content: "I see a dashboard." },
    ],
    "What about the empty state?",
    [],
    { turnTs: "1", images: [PRIOR_IMAGE] },
  );

  assert.deepEqual(conversation, [
    { role: "user", text: "What do you see?", images: [PRIOR_IMAGE] },
    { role: "assistant", text: "I see a dashboard." },
    { role: "user", text: "What about the empty state?" },
  ]);
});

test("current images stay on the current user turn", () => {
  const conversation = buildProviderConversation(
    [{ role: "assistant", content: "Earlier answer" }],
    "Compare this one.",
    [CURRENT_IMAGE],
  );

  assert.deepEqual(conversation, [
    { role: "user", text: "Compare this one.", images: [CURRENT_IMAGE] },
  ]);
});

test("consecutive same-role turns merge even when one carries images", () => {
  // The shape this feature exists to serve, in the two threads where no
  // assistant turn separates the image from the follow-up: the bot reacted
  // instead of replying (a reaction leaves no message, so the rebuilt thread
  // has none), or one person posted the frame and another asked about it.
  // Emitting both as user turns is two user messages in a row, which the
  // provider rejects.
  const conversation = buildProviderConversation(
    [
      { role: "assistant", content: "Earlier answer" },
      { role: "user", content: "here is the frame", ts: "1" },
    ],
    "what about the spacing?",
    [],
    { turnTs: "1", images: [PRIOR_IMAGE] },
  );

  assert.deepEqual(
    conversation.map((t) => t.role),
    ["user"],
    "the image turn and the follow-up are one user turn",
  );
  assert.deepEqual(conversation[0]!.images, [PRIOR_IMAGE]);
  assert.equal(conversation[0]!.text, "here is the frame\n\nwhat about the spacing?");
});

test("roles always alternate, whatever the images do", () => {
  const conversation = buildProviderConversation(
    [
      { role: "user", content: "one", ts: "1" },
      { role: "user", content: "two", ts: "2" },
      { role: "assistant", content: "reply" },
      { role: "assistant", content: "and more" },
    ],
    "three",
    [CURRENT_IMAGE],
    { turnTs: "1", images: [PRIOR_IMAGE] },
  );

  for (let i = 1; i < conversation.length; i++) {
    assert.notEqual(
      conversation[i]!.role,
      conversation[i - 1]!.role,
      `turns ${i - 1} and ${i} share a role`,
    );
  }
  assert.deepEqual(conversation.map((t) => t.role), ["user", "assistant", "user"]);
});

test("images from both sides of a merge survive, in turn order", () => {
  const conversation = buildProviderConversation(
    [{ role: "user", content: "first", ts: "1" }],
    "second",
    [CURRENT_IMAGE],
    { turnTs: "1", images: [PRIOR_IMAGE] },
  );

  assert.equal(conversation.length, 1);
  assert.deepEqual(conversation[0]!.images, [PRIOR_IMAGE, CURRENT_IMAGE]);
});
