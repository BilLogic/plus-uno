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
