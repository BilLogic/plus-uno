// Linkable items reach the person as cards: the model asks with `present`,
// shape `cards`, naming the lookup and the fields for each card's title and
// subtitle, and code builds every card — its logo, its words, its link
// buttons — from what that lookup returned this turn.
//
// Driven across `runTurn` on the Turn harness, then the cards Delivery was
// handed are posted on the recording posting client, which holds them to the
// block rules Slack holds them to. Asserted: what Delivery was handed, what the
// model was told, what Slack receives and what the thread remembers.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall, type Presentation } from "../src/turn/index";
import { postTextVerified } from "../src/slack/delivery";
import { cardList } from "../src/turn/answer-cards";
import { harness, request } from "./helpers/turn-harness";
import { expectRefusals, recordingPosting, type RecordingPostingOptions } from "./helpers/recording-slack";

/** One Figma frame, as a lookup lists it. */
function frame(n: number, over: Record<string, unknown> = {}) {
  return {
    name: `Onboarding ${n}`,
    page: "Tutor onboarding",
    url: `https://www.figma.com/design/FILE/Onboarding?node-id=1-${n}`,
    prototype_url: `https://www.figma.com/proto/FILE/Onboarding?node-id=1-${n}`,
    ...over,
  };
}

/** A lookup that listed `n` frames. */
function framesResult(n: number, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ ok: true, frames: Array.from({ length: n }, (_, i) => frame(i + 1)), ...extra });
}

const LOOKUP = { name: "source_read", args: { url: "https://www.figma.com/design/FILE/Onboarding" } };

const present = (args: Record<string, unknown>) => ({
  name: "present",
  args: { shape: "cards", lookup: "source_read", columns: ["name", "page"], takeaway: "The onboarding flow is four frames.", ...args },
});

/** Run one turn: the lookup, the model's `present`, then its prose. */
async function turn(presentArgs: Record<string, unknown> = {}, opts: { result?: string; prose?: string } = {}) {
  const h = harness({
    replies: [
      { toolCalls: [LOOKUP] },
      { toolCalls: [present(presentArgs)] },
      { text: opts.prose ?? "**The onboarding flow is four frames.** Start with the first." },
    ],
    toolResultFor: (name) => (name === "source_read" ? (opts.result ?? framesResult(4)) : "{}"),
  });
  await runTurn(request({ text: "show me the onboarding frames" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  const told = h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .filter((r) => r.name === "present")
    .map((r) => JSON.parse(r.text) as Record<string, unknown>);
  return { answer, cards: answer.presentation?.cards, told: told.at(-1)! };
}

type Text = { type: string; text: string };
type Button = { type: string; text: Text; url?: string; action_id?: string };
type Card = { type: string; title?: Text; subtitle?: Text; icon?: { type: string; image_url: string; alt_text: string }; actions?: Button[]; hero_image?: unknown };
type Block = { type: string; elements?: Card[] } & Card;

/** Post the prose and its presentation, as the Slack path does. */
async function posted(prose: string, presentation: Presentation, opts: RecordingPostingOptions = {}) {
  const slack = recordingPosting(opts);
  const result = await postTextVerified(slack.deps({ streamingOn: true }), "C1", "100.1", prose, { userId: "U1", team: "T1" }, undefined, {
    presentation,
  });
  const messages = slack.of("message");
  const last = messages.at(-1)!;
  return { slack, result, messages, last, blocks: (last.blockList ?? []) as Block[] };
}

test("a set of Figma frames posts as a carousel of cards beneath the prose, each with its logo and link buttons", async () => {
  const { answer, cards, told } = await turn();

  assert.ok(cards, "cards ride with the answer");
  assert.equal(cards.cards.length, 4);
  assert.equal(told.cards_attached, true);
  assert.equal(told.card_count, 4);

  const { blocks, last, slack } = await posted(answer.text, answer.presentation!);
  assert.deepEqual(slack.refused, [], "Slack takes every block");
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "carousel", "context"]);
  const [first] = blocks[1]!.elements!;
  assert.equal(first!.type, "card");
  assert.deepEqual(first!.title, { type: "plain_text", text: "Onboarding 1" });
  assert.deepEqual(first!.subtitle, { type: "plain_text", text: "Tutor onboarding" });
  assert.equal(first!.icon?.type, "image");
  assert.match(first!.icon!.image_url, /^https:\/\//, "the logo is a public image URL");
  assert.equal(first!.icon!.alt_text, "Figma");
  assert.equal(first!.hero_image, undefined, "no hero images");
  assert.deepEqual(
    first!.actions!.map((b) => b.url),
    ["https://www.figma.com/design/FILE/Onboarding?node-id=1-1", "https://www.figma.com/proto/FILE/Onboarding?node-id=1-1"],
  );
  assert.equal(first!.actions![0]!.text.text, "Open");
  assert.match(last.text, /Onboarding 2/, "the text copy lists the cards");
});

test("one linkable item posts as one card, not a carousel", async () => {
  const { answer, cards } = await turn({}, { result: framesResult(1) });

  assert.equal(cards!.cards.length, 1);
  const { blocks } = await posted(answer.text, answer.presentation!);
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "card", "context"]);
});

test("every card links somewhere: rows with no link are left out, and a list with none is refused", async () => {
  const mixed = JSON.stringify({ ok: true, frames: [frame(1), { name: "Loose sketch", page: "Scratch" }, frame(3)] });
  const { cards } = await turn({}, { result: mixed });
  assert.deepEqual(cards!.cards.map((c) => c.title), ["Onboarding 1", "Onboarding 3"]);
  for (const card of cards!.cards) assert.ok(card.links.length >= 1 && card.links.length <= 3);

  const none = JSON.stringify({ ok: true, frames: [{ name: "A", page: "P" }, { name: "B", page: "P" }] });
  const refused = await turn({}, { result: none, prose: "Two frames, A and B, neither linked." });
  assert.equal(refused.cards, undefined);
  assert.equal(refused.told.cards_attached, false);
  assert.match(String(refused.told.error), /link/);
});

test("11 or more items are capped at 10 cards, and the model is told it sees the first 10", async () => {
  const { answer, cards, told } = await turn({}, { result: framesResult(14) });

  assert.equal(cards!.cards.length, 10);
  assert.equal(cards!.total, 14);
  assert.match(String(told.note), /first 10 of 14/);
  const { blocks, slack } = await posted(answer.text, answer.presentation!);
  assert.deepEqual(slack.refused, []);
  assert.equal(blocks[1]!.elements!.length, 10);
});

test("each card carries the logo of the estate its link leads to, served from our host where we host it", async () => {
  const result = JSON.stringify({
    ok: true,
    items: [
      { title: "WIP card", url: "https://www.notion.so/card-1" },
      { title: "Issue 12", url: "https://github.com/BilLogic/plus-uno/issues/12" },
      { title: "Clearance cell", url: "https://plus-uno.netlify.app/blueprint/cell/9" },
      { title: "Button", url: "https://plus-uno.netlify.app/storybook/?path=/docs/button" },
      { title: "A thread", url: "https://plus.slack.com/archives/C1/p1" },
      { title: "A prototype", url: "https://plus-uno.netlify.app/demo/home" },
    ],
  });
  const { answer } = await turn({ columns: ["title"] }, { result });

  const { blocks, slack } = await posted(answer.text, answer.presentation!);
  assert.deepEqual(slack.refused, []);
  assert.deepEqual(
    blocks[1]!.elements!.map((c) => [c.icon!.alt_text, c.icon!.image_url]),
    [
      ["Notion", "https://www.google.com/s2/favicons?domain=notion.so&sz=64"],
      ["GitHub", "https://plus-uno.netlify.app/uno-bot/logos/github.png"],
      ["uno-blueprint", "https://plus-uno.netlify.app/uno-bot/logos/uno-blueprint.png"],
      ["Storybook", "https://plus-uno.netlify.app/uno-bot/logos/plus.png"],
      ["Slack", "https://plus-uno.netlify.app/uno-bot/logos/slack.png"],
      ["PLUS", "https://plus-uno.netlify.app/uno-bot/logos/plus.png"],
    ],
  );
});

test("a refused card falls back to the plain rung: the prose with the cards as a linked list, nothing lost", async () => {
  const { answer } = await turn();

  const { messages, last, result, slack } = await posted(answer.text, answer.presentation!, { refusesBlockTypes: ["carousel"] });
  assert.deepEqual(expectRefusals(slack.refused).map((r) => r.error), ["invalid_blocks"]);
  assert.equal(result.ok, true);
  assert.equal(messages.length, 2, "one refused post, one that lands");
  const blocks = last.blockList as Block[];
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "context"]);
  const markdown = (blocks[0] as unknown as { text: string }).text;
  assert.match(markdown, /\[Onboarding 3\]\(https:\/\/www\.figma\.com\/design\/FILE\/Onboarding\?node-id=1-3\)/);
});

test("cards and a Sources box each step down on their own: a refused carousel leaves the box aboard", async () => {
  const { answer } = await turn();
  // Three pages the turn read whole, so the answer cites them whether or not
  // its prose names them.
  const sources = [1, 2, 3].map((n) => ({ text: `Page ${n}`, url: `https://www.notion.so/page-${n}`, queried: "page" as const }));
  const presentation: Presentation = { ...answer.presentation!, sources };

  const both = await posted(answer.text, presentation);
  assert.deepEqual(both.blocks.map((b) => b.type), ["markdown", "carousel", "container", "context"]);

  const { messages, last, result, slack } = await posted(answer.text, presentation, { refusesBlockTypes: ["carousel"] });
  assert.deepEqual(expectRefusals(slack.refused).map((r) => r.call), ["post with a carousel block"]);
  assert.equal(result.ok, true);
  assert.equal(messages.length, 2, "one refused post, one that lands");
  const blocks = last.blockList as Block[];
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "container", "context"], "the box stays aboard");
  const markdown = (blocks[0] as unknown as { text: string }).text;
  assert.match(markdown, /\[Onboarding 3\]\(https:\/\/www\.figma\.com\/design\/FILE\/Onboarding\?node-id=1-3\)/);
  assert.doesNotMatch(markdown, /Sources:/, "the box's links are in the box, not the prose");
  assert.equal(last.unfurlLinks, false);
  assert.match(result.text, /Sources: \[Page 1\]/);
});

test("an answer with cards posts as an ordinary message, never a stream", async () => {
  const { answer } = await turn();

  const { slack } = await posted(answer.text, answer.presentation!);
  assert.equal(slack.of("startStream").length, 0);
});

test("a card's title loses its brackets in the linked list, so the link still parses", () => {
  const list = cardList({
    lookup: "figma_search",
    total: 1,
    cards: [{ title: "Onboarding [v2]  draft", links: [{ label: "Open", url: "https://www.figma.com/design/FILE" }] }],
  });
  assert.equal(list, "- [Onboarding v2 draft](https://www.figma.com/design/FILE)");
});
