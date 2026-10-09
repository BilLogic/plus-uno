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
  reminderText,
  SELF_REMINDER_CHOICES,
  SELF_REMINDER_LAST_CHOICES,
  eitherDoor,
  tapReply,
  TAP_FAILED,
  TAP_RECORDED,
  TAP_REFUSED,
  type ReminderOutcome,
} from "../src/commitments/index";
import { ASK_FOOTER } from "../src/dm-sweep/copy";
import { MADE_LAST_CHOICES, MADE_TO_CHOICES, MADE_TO_LAST_CHOICES } from "../src/dm-watch/index";
import { cardAnswer } from "../src/follow-through/copy";

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

describe("a promise reminder", () => {
  const permalink = "https://plus.slack.com/archives/C1/p100";
  const body = reminderText({ promiser: "U1", what: "send Bryan the onboarding notes", deadlineLabel: "Thu", promisedLabel: "Mon", permalink });
  const blocks = reminderBlocks(body, { choices: REMINDER_CHOICES }) as Block[];

  it("leads with a card-like heading: what was promised, by when", () => {
    assert.deepEqual(blocks.map((b) => b.type), ["section", "context", "actions"]);
    assert.equal(blocks[0]!.text!.text, "*You said you'd send Bryan the onboarding notes by Thu*");
  });

  it("puts the mention, the question and the original link under the heading, small", () => {
    const [line] = blocks[1]!.elements! as Array<{ type: string; text: string }>;
    assert.equal(line!.type, "mrkdwn");
    assert.match(line!.text, /^<@U1> /);
    assert.match(line!.text, /Is it done, or does the date need to move\?/);
    assert.ok(line!.text.endsWith(`<${permalink}|Original message>`));
  });

  it("names the day it was said when no deadline was", () => {
    const undated = reminderText({ promiser: "U1", what: "review the PRD", deadlineLabel: null, promisedLabel: "Tue", permalink: null });
    assert.equal(undated.split("\n")[0], "*On Tue you said you'd review the PRD*");
    assert.doesNotMatch(undated, /Original message/);
  });

  it("keeps all four answers, in words", () => {
    const buttons = blocks[2]!.elements! as Array<{ value: string; text: { text: string } }>;
    assert.deepEqual(
      buttons.map((b) => [b.text.text, b.value]),
      [
        ["Done", "raised_hands"],
        ["Later", "hourglass_flowing_sand"],
        ["Dropped", "no_good"],
        ["Wasn't a promise", "thinking_face"],
      ],
    );
  });

  it("keeps its heading when an answer replaces the buttons", () => {
    const answered = reminderBlocks(body, "Nice, marked done.") as Block[];
    assert.deepEqual(answered.map((b) => b.type), ["section", "context", "context"]);
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

  // A card follow-up posted before the shared card still shows these buttons
  // until it closes: Draft it · Drop it, and Done · Still on it · Drop it.
  const cardButtons = {
    card_todo: ["white_check_mark", "no_good"],
    card_stale: ["raised_hands", "hourglass_flowing_sand", "no_good"],
  } as const;
  for (const kind of ["card_todo", "card_stale"] as const) {
    it(`a ${kind} follow-up posted before the shared card`, () => {
      for (const glyph of cardButtons[kind]) assert.notEqual(cardAnswer(kind, glyph), null, `${glyph} answers nothing`);
    });
  }
});

describe("a press through both reminder doors", () => {
  const press = { channel: "C1", messageTs: "1.1", glyph: "raised_hands", userId: "U1", via: "button" as const };
  const door = (outcome: ReminderOutcome, seen: string[], name: string) => async () => {
    seen.push(name);
    return outcome;
  };

  it("the first door to claim it answers, refusal and all, and the second is never asked", async () => {
    const seen: string[] = [];
    const both = eitherDoor(door({ claimed: true, refused: "why" }, seen, "dm"), door({ claimed: true }, seen, "thread"))!;
    assert.deepEqual(await both(press), { claimed: true, refused: "why" });
    assert.deepEqual(seen, ["dm"]);
  });

  it("passes to the second door's refusal when the first does not claim it", async () => {
    const seen: string[] = [];
    const both = eitherDoor(door({ claimed: false }, seen, "dm"), door({ claimed: true, refused: "why" }, seen, "thread"))!;
    assert.deepEqual(await both(press), { claimed: true, refused: "why" });
    assert.deepEqual(seen, ["dm", "thread"]);
  });

  it("unclaimed by both, a failed lookup in either is the outcome", async () => {
    const both = eitherDoor(door({ claimed: false, failed: true }, [], "dm"), door({ claimed: false }, [], "thread"))!;
    assert.deepEqual(await both(press), { claimed: false, failed: true });
    const neither = eitherDoor(door({ claimed: false }, [], "dm"), door({ claimed: false }, [], "thread"))!;
    assert.deepEqual(await neither(press), { claimed: false });
  });
});

describe("what a tapper is told", () => {
  it("nothing, when the answer shows on the message", () => {
    assert.equal(tapReply({ claimed: true }), null);
  });

  it("the door's reason, when it refused", () => {
    assert.equal(tapReply({ claimed: true, refused: TAP_REFUSED.settled }), TAP_REFUSED.settled);
  });

  it("that it was recorded, when the edit missed", () => {
    assert.equal(tapReply({ claimed: true, unedited: true }), TAP_RECORDED);
  });

  it("no longer tracked for a message no reminder holds; a failure for an error, never the same line", () => {
    assert.equal(tapReply({ claimed: false }), TAP_REFUSED.gone);
    assert.equal(tapReply({ claimed: false, failed: true }), TAP_FAILED);
    assert.equal(tapReply("error"), TAP_FAILED);
    assert.notEqual(TAP_FAILED, TAP_REFUSED.gone);
  });
});
