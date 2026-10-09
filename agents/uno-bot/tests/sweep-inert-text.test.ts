// Notion-sourced words on a Worker post are text, never markup: a page titled
// `<!channel>` pings nobody. Asserted on what Slack receives — a report's
// blocks, or a card's, after the same sanitize pass `slack/api.ts` runs — and
// on what a sweep fix's Review pop-up shows.

import { test } from "node:test";
import assert from "node:assert/strict";

import { asSweepRevision, cardPlan, sweepItem, sweepItemText, sweepParent } from "../src/sweep/cards";
import { decisionReport, itemText, reportRecord } from "../src/slack/decision-cards";
import { sweepReport } from "../src/sweep/run";
import type { PendingFinding } from "../src/sweep/store";
import type { Destination } from "../src/sweep/finding";
import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import { sanitizeSlackBlocks, sanitizeSlackMarkup } from "../src/slack/mrkdwn";
import type { ProposalCard } from "../src/turn/index";

const HOSTILE = "Tutor guide [v2] <!channel> <@U0123ABCD> <!subteam^S0ABC123> <https://evil.example|click> & more";
const PAGE_URL = "https://www.notion.so/abc123def456";
const OWNER = "UOWNER01";
const HERE: Destination = { rung: "thread", channel: "C1", threadTs: "1.0" };

/** Markup that would ping or link someone if Slack parsed it. */
const LIVE = ["<!channel>", "<@U0123ABCD>", "<!subteam^S0ABC123>", "<!here>", "<https://evil.example|click>"];

function finding(over: Partial<PendingFinding> = {}): PendingFinding {
  return {
    id: "C1:1.0:b1",
    runDate: "2026-09-28",
    detectedAt: 0,
    driftAt: 0,
    target: { url: PAGE_URL, kind: "notion", writable: true, title: HOSTILE, pillars: [] },
    blockId: "b1",
    lastEditedTime: "2026-09-01T10:00:00.000Z",
    original: "Launch date: October 15 <!here>",
    sourceSays: "Launch is October 15 <!here> & soon",
    threadSays: "Launch moved <@U0123ABCD> to November 1",
    replacement: "Launch date: November 1 <!channel>",
    evidence: { channel: "C1", channelKind: "public", threadTs: "1.0", messageTs: ["1.1"], permalinks: [] },
    owner: OWNER,
    confidence: 0.9,
    participants: [OWNER],
    ...over,
  };
}

/** Every mrkdwn text Slack would receive for a card: its follow-up plan
 *  messages and its blocks, sanitized as `slack/api.ts` does. */
function delivered(card: ProposalCard): string[] {
  const rendered = renderProposalCard(card);
  const blocks = sanitizeSlackBlocks(rendered.blocks ?? proposalCardBlocks(rendered.text)) as Array<{
    text?: { type: string; text: string };
  }>;
  return [
    ...(rendered.followUp ?? []).map(sanitizeSlackMarkup),
    sanitizeSlackMarkup(rendered.text),
    ...blocks.flatMap((b) => (b.text?.type === "mrkdwn" ? [b.text.text] : [])),
  ];
}

function assertInert(texts: string[]): void {
  const all = texts.join("\n");
  for (const markup of LIVE) assert.ok(!all.includes(markup), `live markup reached Slack: ${markup}`);
  // Every `<…>` left is the owner's mention or a link to the page.
  for (const m of all.matchAll(/<([^<>]*)>/g)) {
    const inner = m[1]!;
    assert.ok(inner === `@${OWNER}` || inner.startsWith(`${PAGE_URL}|`) || inner.startsWith("https://slack"), `unexpected markup <${inner}>`);
  }
}

/** Every mrkdwn text Slack would receive for a sweep report — its fallback
 *  text and every mrkdwn object in its blocks, sanitized as `slack/api.ts`
 *  does — and each fix's text as its Review pop-up shows it. */
function reported(items: PendingFinding[]): string[] {
  const report = sweepReport(cardPlan("k", HERE, items));
  const mrkdwn: string[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (o.type === "mrkdwn" && typeof o.text === "string") mrkdwn.push(o.text);
      Object.values(o).forEach(walk);
    }
  };
  walk(sanitizeSlackBlocks(report.blocks));
  return [sanitizeSlackMarkup(report.text), ...mrkdwn, ...items.map(sweepItemText)];
}

test("a sweep report shows a hostile page title as text", () => {
  const texts = reported([finding()]);
  assertInert(texts);
  const all = texts.join("\n");
  assert.ok(all.includes("*Tutor guide [v2] &lt;!channel&gt; &lt;@U0123ABCD&gt;"), all);
  assert.ok(all.includes("&amp; more"));
  assert.ok(all.includes(`<@${OWNER}>`), "the owner is still mentioned");
});

test("a sweep fix's words, on its card and in its pop-up, show mention markup as text", () => {
  const all = reported([finding()]).join("\n");
  assert.ok(all.includes("moved &lt;@U0123ABCD&gt; to"), all);
  assert.ok(all.includes("Page says now: Launch date: October 15 &lt;!here&gt;"), all);
  assert.ok(all.includes("Will say: Launch date: November 1 &lt;!channel&gt;"), all);
});

test("a several-fix report shows each replacement as text", () => {
  const items = [
    finding(),
    finding({ id: "C1:1.0:b2", blockId: "b2", original: "Owner: design", replacement: "Owner: <!subteam^S0ABC123> & co" }),
  ];
  const texts = reported(items);
  assertInert(texts);
  assert.ok(texts.join("\n").includes("Will say: Owner: &lt;!subteam^S0ABC123&gt; &amp; co"));
});

test("a revision card of a sweep card shows the page title, its parent and previews as text", () => {
  const revised = asSweepRevision({
    kind: "revision",
    verb: "update this Notion page",
    fields: [],
    caveats: [],
    operations: [],
    revision: {
      page: { url: PAGE_URL, title: HOSTILE, parent: "Roadmap <!here>" },
      properties: [{ label: "Status <!channel>", from: "Draft <@U0123ABCD>", to: "Done & dusted" }],
      rewrite: { blocks: 1, previews: ["Launch date: November 1 <!channel>"] },
      append: { headings: ["Notes <!here>"] },
    },
  });
  const texts = delivered(revised);
  assertInert(texts);
  const all = texts.join("\n");
  assert.ok(all.includes(`<${PAGE_URL}|Tutor guide [v2] &lt;!channel&gt;`), all);
  assert.ok(all.includes("Roadmap &lt;!here&gt;"), all);
  assert.ok(all.includes("Done &amp; dusted"), all);
});

test("an archive card's target shows the page title as text", () => {
  const texts = delivered({
    kind: "confirm",
    verb: "archive this Notion page",
    fields: [],
    caveats: [],
    operations: [],
    target: { title: HOSTILE, parent: "Roadmap <!here>", url: PAGE_URL },
  });
  assertInert(texts);
});

test("a long fix's card keeps the decision in view: each half is clipped on its own, and View shows both whole", () => {
  const long = finding({
    sourceSays: `Reward Eligible percentage is not defined yet: ${"5/10 or 5/29 depending on the denominator, ".repeat(6)}`,
    threadSays: `Obsolete: the percentage was deleted from the report, ${"per the card comment, ".repeat(6)}`,
  });
  const item = sweepItem(long, HERE);
  assert.ok(item.body.length <= 200, `${item.body.length} characters`);
  assert.match(item.body, /^Page says “Reward Eligible.*…” · decision says “Obsolete: the percentage was deleted.*…”$/);
  const record = reportRecord("C1", "1790000000.000100", decisionReport([item], "parent"), 1000);
  const view = itemText(record, item.id)!;
  assert.ok(view.includes("per the card comment, per the card comment, per the card comment, per the card comment, per the card comment, per the card comment"), "View keeps the whole decision");
});

test("the parent line reads as the design words it: one fix names its page and source, several count the pages", () => {
  const record = { kind: "card" as const, url: "https://www.notion.so/card", title: "Card", entryIds: ["comment:c1"] };
  const one = finding({ target: { url: PAGE_URL, kind: "notion", writable: true, title: "Teacher Insights Report — Part 2", pillars: [] } });
  assert.equal(
    sweepParent([{ ...one, evidence: { ...one.evidence, record } }], { rung: "design", channel: "plus-design" }),
    "A card comment settled something that *Teacher Insights Report — Part 2* still states the old way.",
  );
  const pages = ["a", "b", "c"].map((p) => finding({ id: p, blockId: p, target: { url: `${PAGE_URL}${p}`, kind: "notion", writable: true, title: p, pillars: [] } }));
  assert.equal(sweepParent(pages, HERE), "3 pages still state what their threads changed.");
});
