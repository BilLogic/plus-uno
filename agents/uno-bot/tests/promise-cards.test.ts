// Promise reminders as cards (render seam): promises in, the morning's
// message and its pop-ups out. A test checks what a person would see — the
// opener, each card's title, subtitle, body and buttons, an answered card —
// and that Slack would take it (`tests/helpers/slack-block-rules.ts`).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DROP_CHOICES,
  MAX_PROMISE_CARDS,
  PROMISE_ACTION_PREFIX,
  answeredMessage,
  cardValueOf,
  openRefs,
  dateView,
  droppedAsOf,
  dropView,
  initialPickDay,
  pickedDayOf,
  promiseMessage,
  promisePressOf,
  promiseRef,
  promiseViewMetaOf,
  refOf,
  type PromiseCardInput,
} from "../src/commitments/promise-cards";
import { messageBlocksRefusal, viewRefusal } from "./helpers/slack-block-rules";

/** An ET day in October 2026. Mon Oct 19 is the morning these post on. */
const oct = (d: number) => Date.UTC(2026, 9, d);
const MON = oct(19);
const DM = "https://plus.slack.com/archives/D0SHIV/p1760000000000100";

const card = (over: Partial<PromiseCardInput>): PromiseCardInput => ({
  ref: promiseRef("thread", "C0DESIGN:1760000000.000100"),
  kind: "due-soon",
  what: "share the teacher report Figma with Shiv",
  other: "Shiv",
  dueDay: oct(20),
  madeDay: oct(15),
  today: MON,
  place: { url: DM, label: "Your DM with Shiv" },
  ...over,
});

type Card = { title: { text: string }; subtitle: { text: string }; body: { text: string }; actions?: Array<{ text: { text: string }; action_id: string; value: string }> };
function cardsOf(blocks: unknown[]): Card[] {
  return (blocks as Array<{ type: string; elements?: Card[] }>).flatMap((b) => (b.type === "carousel" ? b.elements! : b.type === "card" ? [b as unknown as Card] : []));
}
const labels = (c: Card) => (c.actions ?? []).map((a) => a.text.text);

describe("a promise reminder's cards", () => {
  const kinds: Array<[string, Partial<PromiseCardInput>, string, string, string[]]> = [
    ["due soon", {}, "Share the teacher report Figma with Shiv", "Due tomorrow, Tue Oct 20", ["New date", "On track", "Done"]],
    [
      "overdue",
      { kind: "overdue", what: "send Ken the complete teacher report mockups", other: "Ken", dueDay: oct(16), madeDay: oct(14) },
      "Send Ken the complete teacher report mockups",
      "Overdue, was due Fri Oct 16",
      ["Drop it", "New date", "Done"],
    ],
    ["no date", { kind: "no-date", what: "simplify the AI coach system diagram", dueDay: undefined }, "Simplify the AI coach system diagram", "Set a date", ["Drop it", "Pick a date", "Done"]],
    [
      "owed to you",
      { kind: "owed", what: "the last set of teacher report data", other: "Suraj", dueDay: oct(16) },
      "Suraj: the last set of teacher report data",
      "Owed to you, was due Fri Oct 16",
      ["Drop it", "Wait", "Got it"],
    ],
  ];
  for (const [name, over, title, subtitle, buttons] of kinds) {
    it(`${name}: "${title}", "${subtitle}", ${buttons.join(" · ")}`, () => {
      const { blocks } = promiseMessage([card(over)]);
      assert.equal(messageBlocksRefusal(blocks), null);
      const [c] = cardsOf(blocks);
      assert.equal(c!.title.text, title);
      assert.equal(c!.subtitle.text, subtitle);
      assert.deepEqual(labels(c!), buttons, "three at most, the main answer on the right");
      assert.ok(c!.title.text.length <= 60);
      assert.ok(c!.body.text.length <= 200);
      assert.doesNotMatch(c!.body.text, /\bthis\b/i, "names the thing");
      assert.match(c!.body.text, /<https:\/\/plus\.slack\.com\/archives\/D0SHIV\/p1760000000000100\|Your DM with Shiv>/, "where, linked, with no ↗: it opens in Slack");
      for (const a of c!.actions!) assert.equal(promisePressOf(a.action_id)?.ref, cardValueOf(a.value)?.ref);
    });
  }

  it("says what was promised and to whom, then where and when", () => {
    const [c] = cardsOf(promiseMessage([card({})]).blocks);
    assert.equal(c!.body.text, `You told Shiv you'd share the teacher report Figma with Shiv. <${DM}|Your DM with Shiv>, last Thu.`);
    const [owed] = cardsOf(promiseMessage([card({ kind: "owed", other: "Suraj", what: "share the data right after the tech call" })]).blocks);
    assert.match(owed!.body.text, /^Suraj told you they'd share the data right after the tech call\. /);
  });

  it("opens on one bullet per kind", () => {
    const { blocks, text } = promiseMessage([card({}), card({ kind: "overdue", dueDay: oct(16) }), card({ kind: "owed", dueDay: oct(16) }), card({ kind: "no-date", dueDay: undefined })]);
    const opener = (blocks[0] as { text: { text: string } }).text.text;
    assert.equal(opener, "• 3 promises due or overdue.\n• 1 promise needs a date.");
    assert.match(text, /^• 3 promises due or overdue\./);
  });

  it("holds at most 10 cards a message; the rest wait for the next morning", () => {
    const many = Array.from({ length: 13 }, (_, i) => card({ ref: promiseRef("dm", `row${i}`) }));
    const { blocks, shown, held } = promiseMessage(many);
    assert.equal(MAX_PROMISE_CARDS, 10);
    assert.equal(cardsOf(blocks).length, 10);
    assert.deepEqual([shown.length, held.length], [10, 3]);
    assert.equal(messageBlocksRefusal(blocks), null);
  });

  describe("once answered, the card stays: its subtitle changes and its buttons go", () => {
    const outcomes = [
      [{ kind: "done" }, "Done"],
      [{ kind: "moved", day: oct(22) }, "Moved to Thu Oct 22"],
      [{ kind: "dropped" }, "Dropped"],
      [{ kind: "not-a-promise" }, "Not a promise, won't track"],
    ] as const;
    for (const [outcome, line] of outcomes) {
      it(line, () => {
        const other = card({ ref: promiseRef("dm", "other") });
        const { blocks } = promiseMessage([card({}), other]);
        const after = answeredMessage(blocks, card({}).ref, outcome)!;
        const [answered, left] = cardsOf(after);
        assert.equal(answered!.subtitle.text, line);
        assert.equal(answered!.actions, undefined);
        assert.equal(answered!.body.text, cardsOf(blocks)[0]!.body.text, "the body keeps the promise");
        assert.deepEqual(labels(left!), ["New date", "On track", "Done"], "the other card is untouched");
        assert.equal(messageBlocksRefusal(after), null);
      });
    }
    it("a ref the message doesn't hold changes nothing", () => {
      assert.equal(answeredMessage(promiseMessage([card({})]).blocks, promiseRef("dm", "nope"), { kind: "done" }), null);
    });
  });
});

describe("a promise card's pop-ups", () => {
  const meta = { channel: "D0UNO", ts: "1760900000.000100", ref: promiseRef("thread", "C0DESIGN:1760000000.000100") };

  it("the date picker opens on the next working day after the current due date", () => {
    assert.equal(initialPickDay(oct(20), MON), oct(21), "due Tue: Wed");
    assert.equal(initialPickDay(oct(23), MON), oct(26), "due Fri: past the weekend, Mon");
    assert.equal(initialPickDay(oct(16), MON), oct(20), "overdue: the next working day from today");
    assert.equal(initialPickDay(undefined, MON), oct(20), "no date: the next working day");
    const view = dateView(meta, oct(21), "New date");
    assert.equal(viewRefusal(view), null);
    const picker = (view.blocks as Array<{ element: { type: string; initial_date: string } }>)[0]!.element;
    assert.deepEqual([picker.type, picker.initial_date], ["datepicker", "2026-10-21"]);
    assert.deepEqual(promiseViewMetaOf(view.private_metadata as string), meta);
  });

  it("reads the day Save picked", () => {
    assert.equal(pickedDayOf({ values: { uno_promise_date_block: { uno_promise_date_pick: { selected_date: "2026-10-22" } } } }), oct(22));
    assert.equal(pickedDayOf({ values: {} }), null);
  });

  it("Drop it offers its two choices", () => {
    const view = dropView(meta);
    assert.equal(viewRefusal(view), null);
    const radios = (view.blocks as Array<{ element: { options: Array<{ text: { text: string } }> } }>)[0]!.element;
    assert.deepEqual(radios.options.map((o) => o.text.text), ["No longer needed", "It wasn't a promise"]);
    assert.deepEqual(DROP_CHOICES.map((c) => c.value), ["no-longer-needed", "not-a-promise"]);
    assert.equal(droppedAsOf({ values: { uno_promise_drop_block: { uno_promise_drop_pick: { selected_option: { value: "not-a-promise" } } } } }), "not-a-promise");
    assert.equal(droppedAsOf({ values: {} }), null);
  });

  it("a button carries its row and the day its card shows due, for the date pop-up", () => {
    const [c] = cardsOf(promiseMessage([card({})]).blocks);
    assert.deepEqual(cardValueOf(c!.actions![0]!.value), { ref: card({}).ref, dueDay: oct(20) });
    const [none] = cardsOf(promiseMessage([card({ kind: "no-date", dueDay: undefined })]).blocks);
    assert.deepEqual(cardValueOf(none!.actions![0]!.value), { ref: card({}).ref });
    assert.equal(cardValueOf("uno_reminder_raised_hands"), null);
  });

  it("knows which cards in a message are still open", () => {
    const other = card({ ref: promiseRef("dm", "U1:D1:1.2") });
    const { blocks } = promiseMessage([card({}), other]);
    assert.deepEqual(openRefs(blocks), [card({}).ref, other.ref]);
    assert.deepEqual(openRefs(answeredMessage(blocks, other.ref, { kind: "done" })!), [card({}).ref]);
  });

  it("a press names its answer and its row, and nothing else is one", () => {
    assert.deepEqual(promisePressOf(`${PROMISE_ACTION_PREFIX}new-date:d|U1:D1:1.2`), { answer: "new-date", ref: "d|U1:D1:1.2" });
    assert.equal(promisePressOf(`${PROMISE_ACTION_PREFIX}explode:d|x`), null);
    assert.equal(promisePressOf("uno_reminder_raised_hands"), null);
    assert.deepEqual(refOf("c|C1:1.2"), { store: "thread", id: "C1:1.2" });
  });
});
