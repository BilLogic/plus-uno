// A reminder's answers are real buttons, and each one stands in for a reaction.
//
// The button carries the Slack name of the glyph it replaces (`value`), and a
// press goes through the same doors a reaction does — so a button whose glyph
// answers nothing there would be a dead button that looks alive. This pins the
// shape Slack gets and that every offered glyph means something to its door.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  footerLabels,
  REMINDER_ACTION_PREFIX,
  REMINDER_CHOICES,
  reminderAnswer,
  reminderBlocks,
  SELF_REMINDER_CHOICES,
  SELF_REMINDER_LAST_CHOICES,
} from "../src/commitments/index";
import { ASK_FOOTER } from "../src/dm-sweep/copy";
import { MADE_LAST_CHOICES, MADE_TO_CHOICES, MADE_TO_LAST_CHOICES } from "../src/dm-watch/index";
import { cardAnswer, CARD_FOOTERS } from "../src/follow-through/copy";

type Block = { type: string; block_id?: string; elements?: Array<Record<string, unknown>>; text?: { text: string } };

describe("reminderBlocks with answers", () => {
  const blocks = reminderBlocks("Body", { hint: "A hint", choices: REMINDER_CHOICES }) as Block[];

  it("is the body, a row of buttons, then the hint", () => {
    assert.deepEqual(blocks.map((b) => b.type), ["section", "actions", "context"]);
    assert.equal(blocks[0]!.text!.text, "Body");
  });

  it("gives each button its glyph's name as its value and a unique action id under the prefix", () => {
    const buttons = blocks[1]!.elements!;
    assert.equal(buttons.length, REMINDER_CHOICES.length);
    for (const [i, button] of buttons.entries()) {
      assert.equal(button.type, "button");
      assert.equal(button.value, REMINDER_CHOICES[i]!.glyph);
      assert.equal(button.action_id, `${REMINDER_ACTION_PREFIX}${REMINDER_CHOICES[i]!.glyph}`);
      assert.deepEqual(button.text, { type: "plain_text", text: REMINDER_CHOICES[i]!.label, emoji: true });
    }
    assert.equal(new Set(buttons.map((b) => b.action_id)).size, buttons.length);
  });

  it("with no hint, ends at the buttons", () => {
    const bare = reminderBlocks("Body", { choices: SELF_REMINDER_LAST_CHOICES }) as Block[];
    assert.deepEqual(bare.map((b) => b.type), ["section", "actions"]);
  });

  it("with words only, is the body and a context line — what an answer leaves behind", () => {
    const answered = reminderBlocks("Body", "Nice, marked done.") as Block[];
    assert.deepEqual(answered.map((b) => b.type), ["section", "context"]);
    assert.equal(footerLabels(answered), "Nice, marked done.");
  });
});

describe("every offered button means something to the door it goes through", () => {
  const reminderSets: Array<[string, readonly { glyph: string; label: string }[]]> = [
    ["a promise reminder", REMINDER_CHOICES],
    ["a remind-me", SELF_REMINDER_CHOICES],
    ["a remind-me's last post", SELF_REMINDER_LAST_CHOICES],
    ["a promise made to the owner", MADE_TO_CHOICES],
    ["a promise made to the owner, last post", MADE_TO_LAST_CHOICES],
    ["a promise the owner made, last post", MADE_LAST_CHOICES],
    ["the DM ask", ASK_FOOTER.choices],
  ];
  for (const [name, choices] of reminderSets) {
    it(name, () => {
      for (const c of choices) assert.notEqual(reminderAnswer(c.glyph), null, `${c.label} (${c.glyph}) answers nothing`);
    });
  }

  for (const kind of ["card_todo", "card_stale"] as const) {
    it(`a ${kind} follow-up`, () => {
      const footer = CARD_FOOTERS[kind];
      assert.ok(typeof footer !== "string", "a card follow-up with an answer to tap has buttons");
      for (const c of footer.choices) assert.notEqual(cardAnswer(kind, c.glyph), null, `${c.label} (${c.glyph}) answers nothing`);
    });
  }

  it("the follow-up that wants a typed reply has no buttons", () => {
    assert.equal(typeof CARD_FOOTERS.card_unowned, "string");
  });
});
