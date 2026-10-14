// Thanks given as a reaction: which emoji count, which messages and reactors
// the door records them for, and the in-memory log against the conformance
// suite (the D1 log runs the same suite under workerd).
import assert from "node:assert/strict";
import test from "node:test";

import { runReactionDoor, type ReactionRequest } from "../src/gate/reaction-door";
import { GATE_RESERVED } from "../src/gate/reactions";
import { createInMemoryThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { createInMemoryAppreciationLog, thanksEmojiOf, type KnownMessage } from "../src/usage/index";
import { runAppreciationConformance } from "./helpers/appreciation-conformance";

const BOT = "U0BOT";

test("the thanks emoji are 🙏 ❤️ 🐐 👏 🔥 💯 🥹, with any skin tone, and any custom goat", () => {
  for (const name of ["pray", "heart", "goat", "clap", "fire", "100", "face_holding_back_tears", "party-goat", "goat_dance"]) {
    assert.equal(thanksEmojiOf(name), name, name);
  }
  assert.equal(thanksEmojiOf("clap::skin-tone-3"), "clap");
  assert.equal(thanksEmojiOf("pray::skin-tone-5"), "pray");
});

test("✅, 👍, 🙌 and every gate glyph are never thanks; nor is any other emoji", () => {
  for (const name of [...GATE_RESERVED, "raised_hands", "tada", "eyes", "thumbsdown", "heart_eyes", ""]) {
    assert.equal(thanksEmojiOf(name), null, name);
  }
});

async function react(over: Partial<ReactionRequest>, opts: { withRecorder?: boolean } = {}) {
  const recorded: unknown[] = [];
  const delivery = recordingDelivery();
  await runReactionDoor(
    { channel: "C1", messageTs: "1700000005.000200", glyph: "pray", userId: "U1", messageAuthorId: BOT, ...over },
    {
      threadState: createInMemoryThreadState(),
      delivery: () => delivery,
      threadRootOf: async () => "1700000000.000100",
      botUserId: async () => BOT,
      applyVerdict: async () => {},
      restage: async () => {},
      ...(opts.withRecorder === false
        ? {}
        : {
            async recordThanks(r) {
              recorded.push(r);
            },
          }),
    },
  );
  return { recorded, delivery };
}

test("a person's thanks on the bot's message is recorded, by its short name, and nothing is posted", async () => {
  const { recorded, delivery } = await react({ glyph: "clap::skin-tone-2" });
  assert.deepEqual(recorded, [{ channel: "C1", itemTs: "1700000005.000200", userId: "U1", emoji: "clap" }]);
  assert.deepEqual(delivery.calls, []);
});

test("a thanks on someone else's message, by the bot itself, or with no author records nothing", async () => {
  assert.deepEqual((await react({ messageAuthorId: "U2" })).recorded, []);
  assert.deepEqual((await react({ userId: BOT })).recorded, []);
  assert.deepEqual((await react({ messageAuthorId: undefined })).recorded, []);
});

test("a ✅, a 👍 or a 🙌 on the bot's message is never recorded as thanks", async () => {
  for (const glyph of ["white_check_mark", "+1", "raised_hands"]) {
    assert.deepEqual((await react({ glyph })).recorded, [], glyph);
  }
});

test("a door with no recorder still takes the reaction", async () => {
  const { delivery } = await react({}, { withRecorder: false });
  assert.deepEqual(delivery.calls, []);
});

runAppreciationConformance(
  "in-memory",
  () => {
    const known = new Map<string, KnownMessage>();
    return {
      log: createInMemoryAppreciationLog({ known: (channel, itemTs) => known.get(`${channel}:${itemTs}`) ?? null }),
      async know(channel, itemTs, message) {
        known.set(`${channel}:${itemTs}`, message);
      },
    };
  },
  { it: (name, fn) => test(name, fn) },
);
