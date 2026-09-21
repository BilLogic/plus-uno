// Addressing the bot is not the same as naming a person.
//
// The release test for relayed DMs, 2026-09-21: "send RM-2436 to <@U…> as a
// DM" reached the model as "send RM-2436 to  as a DM" — the cleanup meant to
// drop the @uno-bot address dropped every mention, so the recipient was gone
// before the turn began. Only the bot's own mention is noise.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripBotMentions } from "../src/slack/mention";

const BOT = "U0APP1EU8KV";
const COCO = "U0A8JFHQPU2";

describe("the bot's own mention is dropped", () => {
  it("drops the address that summoned it", () => {
    assert.equal(stripBotMentions(`<@${BOT}> what's RM-2436?`, BOT), "what's RM-2436?");
  });

  it("drops a labelled form of it too", () => {
    assert.equal(stripBotMentions(`<@${BOT}|le goat> hi`, BOT), "hi");
  });
});

describe("everyone else's mention survives", () => {
  it("keeps the recipient of a relay", () => {
    assert.equal(
      stripBotMentions(`<@${BOT}> send this to <@${COCO}> as a DM`, BOT),
      `send this to <@${COCO}> as a DM`,
    );
  });

  it("keeps a person named in a DM, where nobody addresses the bot", () => {
    assert.equal(stripBotMentions(`send RM-2436 to <@${COCO}>`, BOT), `send RM-2436 to <@${COCO}>`);
  });

  it("keeps the lines of a multi-line request", () => {
    assert.equal(stripBotMentions(`<@${BOT}> send to <@${COCO}>:\n- RM-2436\n- RM-2440`, BOT), `send to <@${COCO}>:\n- RM-2436\n- RM-2440`);
  });

  it("keeps every mention when the bot's identity is unknown", () => {
    assert.equal(stripBotMentions(`<@${BOT}> ping <@${COCO}>`, undefined), `<@${BOT}> ping <@${COCO}>`);
  });
});
