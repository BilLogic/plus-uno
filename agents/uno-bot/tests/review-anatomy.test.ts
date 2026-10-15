// The Review pop-up's shared anatomy: the builders every draft is made of,
// the per-tool titles and decision words, the object card and its fallback,
// and the internal inputs no draft shows.
//
// Pure where it can be — the builders, the titles, the card's fallback — and
// through the real `views.update` over a stubbed fetch for the one rung that
// only Slack can trip: a `card` refused with `invalid_blocks`.
// `docs/plans/2026-10-15-review-modal-redesign.md` § The shared anatomy is the
// spec.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  alertBlocks,
  alertsFromCaveats,
  decisionWords,
  factsSection,
  headerBlock,
  listBlock,
  quoteBlock,
  reviewTitle,
  whereLine,
} from "../src/slack/review-anatomy";
import {
  cardFallbackBlocks,
  objectCardBlocks,
  refusedForCard,
  sendWithCardFallback,
  withoutCardBlocks,
} from "../src/slack/card-block";
import { decidedView, draftView } from "../src/slack/review-view";
import { CONFIRM_FOOTER, shortCardOf, withoutInternalFields } from "../src/slack/proposal-render";
import { TOOL_TABLE, runsPastGate, type ToolName } from "../src/agent/tool-table";
import type { PendingProposal, ProposalOperation } from "../src/thread-state/index";
import { viewRefusal } from "./helpers/slack-block-rules";

const op = (toolName: string, input: Record<string, unknown> = {}): ProposalOperation => ({ toolName, input });

describe("the zone builders", () => {
  it("a header is plain text, clipped to Slack's 150", () => {
    const block = headerBlock("x".repeat(400)) as { type: string; text: { type: string; text: string } };
    assert.equal(block.type, "header");
    assert.equal(block.text.type, "plain_text");
    assert.equal(block.text.text.length, 150);
  });

  it("the where line is one rich_text section of native elements", () => {
    const block = whereLine([
      { type: "text", text: "Posts in " },
      { type: "channel", channel_id: "C0X" },
      { type: "text", text: " and pings " },
      { type: "user", user_id: "U0Y" },
      { type: "link", url: "https://github.com/BilLogic/plus-uno", text: "plus-uno" },
    ]) as { type: string; elements: Array<{ type: string; elements: unknown[] }> };
    assert.equal(block.type, "rich_text");
    assert.equal(block.elements.length, 1);
    assert.equal(block.elements[0]!.type, "rich_text_section");
    assert.equal(block.elements[0]!.elements.length, 5);
  });

  it("keeps two caveat alerts at most, each under 200 characters, and the rest as context", () => {
    const blocks = alertBlocks([
      { level: "warning", text: "a".repeat(300) },
      { level: "info", text: "Private repo." },
      { level: "warning", text: "Third." },
    ]) as Array<{ type: string; text?: { text: string }; elements?: Array<{ text: string }> }>;
    assert.deepEqual(blocks.map((b) => b.type), ["alert", "alert", "context"]);
    assert.ok(blocks[0]!.text!.text.length <= 200);
    assert.match(blocks[2]!.elements![0]!.text, /Third\./);
  });

  it("reads the card's caveat lines as one-sentence alerts", () => {
    const alerts = alertsFromCaveats([
      ":warning: *Bundle incomplete — missing: Loom walkthrough · live preview · Decisions DB link.*",
      "Approving posts it *without* them — or drop the links in this thread first and I'll fold them in.",
      ":warning: *An earlier approved run was cut off; some of this may already have happened.* Check before approving.",
    ]);
    assert.deepEqual(alerts.map((a) => a.level), ["warning", "warning"]);
    assert.equal(
      alerts[0]!.text,
      "Bundle incomplete: no Loom walkthrough, live preview or Decisions DB link. Approving posts it without them, or drop the links in the thread first.",
    );
    assert.doesNotMatch(alerts[1]!.text, /[*:]warning/);
    for (const a of alerts) assert.ok(a.text.length <= 200);
  });

  it("short facts are section fields, ten at most", () => {
    const facts = Array.from({ length: 12 }, (_, i) => [`Fact ${i}`, `v${i}`] as [string, string]);
    const block = factsSection(facts) as { type: string; fields: Array<{ type: string; text: string }> };
    assert.equal(block.type, "section");
    assert.equal(block.fields.length, 10);
    assert.equal(block.fields[0]!.text, "*Fact 0*\nv0");
  });

  it("a list is a bold label and a rich_text bullet list; a quote is a rich_text_quote", () => {
    const list = listBlock("Feedback wanted", ["One?", "Two?"]) as { type: string; elements: Array<{ type: string; style?: string; elements: unknown[] }> };
    assert.equal(list.type, "rich_text");
    assert.deepEqual(list.elements.map((e) => e.type), ["rich_text_section", "rich_text_list"]);
    assert.equal(list.elements[1]!.style, "bullet");
    assert.equal(list.elements[1]!.elements.length, 2);
    const quote = quoteBlock("What changed", "The waitlist moved.") as { elements: Array<{ type: string }> };
    assert.deepEqual(quote.elements.map((e) => e.type), ["rich_text_section", "rich_text_quote"]);
  });
});

describe("per-tool titles", () => {
  const gated = (Object.keys(TOOL_TABLE) as ToolName[]).filter((name) => runsPastGate(TOOL_TABLE[name].access));

  it("every tool that runs past the Gate has its own title, 24 characters or fewer", () => {
    assert.ok(gated.length >= 12);
    for (const name of gated) {
      const title = reviewTitle([op(name)]);
      assert.notEqual(title, "Review proposal", name);
      assert.ok(title.length <= 24, `${name}: ${title}`);
    }
  });

  it("names the doc's titles", () => {
    assert.equal(reviewTitle([op("shareout_post")]), "Review share-out");
    assert.equal(reviewTitle([op("github_issue_create")]), "Review new issue");
    assert.equal(reviewTitle([op("github_issue_update")]), "Review issue update");
    assert.equal(reviewTitle([op("notion_create", { surface: "prd" })]), "Review Roadmap card");
    assert.equal(reviewTitle([op("notion_create", { surface: "intake" })]), "Review Roadmap card");
    assert.equal(reviewTitle([op("notion_create", { surface: "decision" })]), "Review decision");
    assert.equal(reviewTitle([op("notion_archive")]), "Review archive");
    assert.equal(reviewTitle([op("github_workflow_run")]), "Review workflow run");
    assert.equal(reviewTitle([op("dm_relay"), op("dm_relay")]), "Review 2 DMs");
    assert.equal(reviewTitle([op("figma_tidy_up")]), "Figma tidy-up");
    assert.equal(reviewTitle([op("ds_precedence_intake")]), "Review DS intake");
    assert.equal(reviewTitle([op("sweep_share_post")]), "Review shared note");
    assert.equal(reviewTitle([op("figma_dev_links")]), "Review Dev Mode links");
  });

  it("a mixed batch, and a tool with no title, still fit", () => {
    assert.ok(reviewTitle([op("dm_relay"), op("notion_update"), op("shareout_post")]).length <= 24);
    assert.equal(reviewTitle([op("no_such_tool")]), "Review proposal");
  });

  it("every gated tool's decision says what each option does, in 75 characters or fewer", () => {
    for (const name of gated) {
      const words = decisionWords([op(name)]);
      for (const text of [words.confirm, words.revise, words.cancel]) assert.ok(text && text.length <= 75, `${name}: ${text}`);
    }
  });
});

const BASE: PendingProposal = {
  toolName: "notion_update",
  input: { page_url: "https://www.notion.so/abc", append: { text: "A note." } },
  channel: "C1",
  threadTs: "1.0",
  userMsgTs: "1.1",
  proposalTs: "1.2",
  proposalText: "Changes to a page\n" + CONFIRM_FOOTER,
  requesterUserId: "U1",
};
const card = { channel: "C1", ts: "1.2" };
const access = { mayDecide: true, confirmers: ["U1"] };
const blocks = (view: unknown) => (view as { blocks: Array<Record<string, unknown>> }).blocks;

describe("a draft outside the share-out keeps its body and gains its title and decision words", () => {
  it("notion_update is drawn as before under its own title, every option described", () => {
    const view = draftView(card, BASE, access) as { title: { text: string } };
    assert.equal(view.title.text, "Review page update");
    assert.equal(viewRefusal(view), null);
    const choice = blocks(view).find((b) => b.block_id === "uno_review_choice") as { element: { options: Array<{ description?: { text: string } }> } };
    assert.ok(choice.element.options.every((o) => o.description?.text));
  });

  it("a card's own answers keep their labels, with their decided words as descriptions", () => {
    const view = draftView(card, {
      ...BASE,
      choices: [
        { value: "done", label: "Done", verdict: "confirm", decided: "Marked done." },
        { value: "still", label: "Still on it", verdict: "cancel", decided: "Nothing written. Checked again Monday." },
      ],
    }, access);
    const choice = blocks(view).find((b) => b.block_id === "uno_review_choice") as { label: { text: string }; element: { options: Array<{ value: string; description?: { text: string } }> } };
    assert.deepEqual(choice.element.options.map((o) => [o.value, o.description?.text]), [
      ["choice:confirm:done", "Marked done."],
      ["choice:cancel:still", "Nothing written. Checked again Monday."],
    ]);
  });

  it("a card-text draft hides place, channel, surface and other internal inputs", () => {
    const text = [
      ":warning: About to *archive this Notion card*:",
      "• *Page link:* https://www.notion.so/abc",
      "• *Place:* channel",
      "• *Channel:* C0SANDBOX1",
      "• *Surface:* prd",
      "• *File key:* AbC123",
      "• *Check:* true",
      "• *Introduce:* false",
      "• *Cards:*",
      "    ◦ one",
      "• *Block id:* 0f1e2d3c",
      CONFIRM_FOOTER,
    ].join("\n");
    const view = draftView(card, { ...BASE, toolName: "notion_archive", input: { page_url: "https://www.notion.so/abc" }, proposalText: text }, access);
    const json = JSON.stringify(view);
    assert.equal((view as { title: { text: string } }).title.text, "Review archive");
    for (const label of ["Place", "Channel", "Surface", "File key", "Check", "Introduce", "Cards", "Block id"]) {
      assert.ok(!json.includes(`*${label}:*`), `${label} is hidden`);
    }
    assert.ok(!json.includes("◦ one"), "a hidden field's items go with it");
    assert.ok(json.includes("Page link"), "a link a person needs stays");
  });

  it("a decided card's View hides them too", () => {
    const view = decidedView(card, ":warning: About to *share this for feedback in #x*:\n• *Summary:* S.\n• *Place:* channel\n• *Channel:* C0X\n✅ Approved");
    const json = JSON.stringify(view);
    assert.ok(!json.includes("*Place:*") && !json.includes("*Channel:*"));
    assert.ok(json.includes("*Summary:*"));
  });

  it("withoutInternalFields leaves every other line as it was", () => {
    const text = "• *Title:* T\n• *Place:* here\n• *Body:* line one\nline two\n• *Channel:* C0X";
    assert.equal(withoutInternalFields(text), "• *Title:* T\n• *Body:* line one\nline two");
  });
});

describe("the posted card's summary line", () => {
  const summaryOf = (fields: string[]) =>
    shortCardOf([":warning: About to *share this for feedback in #plus-design-feedback*:", ...fields, CONFIRM_FOOTER].join("\n"))!.summary;

  it("labels a numeric key field: Round 1, never a bare 1", () => {
    const summary = summaryOf(["• *Deadline:* EOD Friday", "• *Round:* 1", "• *Project:* Live App"]);
    assert.equal(summary, ":warning: Ready to *share this for feedback in #plus-design-feedback*: EOD Friday · Round 1 · Live App");
  });

  it("skips internal inputs, raw ids and flags", () => {
    const summary = summaryOf([
      "• *Place:* channel",
      "• *Channel:* C0SANDBOX1",
      "• *Check:* true",
      "• *Recipient:* U0BRYAN001",
      "• *File key:* AbCdEf123",
      "• *Project:* Live App",
    ]);
    assert.equal(summary, ":warning: Ready to *share this for feedback in #plus-design-feedback*: Live App");
  });
});

describe("the object card and its fallback", () => {
  const CARD = { title: "Session Sign Up", subtitle: "Hi-fi prototype · Round 1", open: { url: "https://x.netlify.app/p", text: "Open prototype" } };

  it("is a card block with its Open button by default", () => {
    const [block] = objectCardBlocks(CARD) as Array<Record<string, unknown>>;
    assert.equal(block!.type, "card");
    assert.equal(viewRefusal({ type: "modal", title: { type: "plain_text", text: "t" }, blocks: [block] }), null);
  });

  it("puts a body over 200 characters under a card that has none", () => {
    const out = objectCardBlocks({ ...CARD, body: "b".repeat(250) }) as Array<Record<string, unknown>>;
    assert.equal(out.length, 2);
    assert.equal("body" in out[0]!, false);
    assert.equal(out[1]!.type, "section");
  });

  it("steps down to a section with the title, the subtitle and the Open link as its button", () => {
    const [block] = objectCardBlocks(CARD);
    const [section] = cardFallbackBlocks(block) as Array<{ type: string; text: { text: string }; accessory: { url: string; text: { text: string } } }>;
    assert.equal(section!.type, "section");
    assert.equal(section!.text.text, "*Session Sign Up*\nHi-fi prototype · Round 1");
    assert.equal(section!.accessory.url, CARD.open.url);
    assert.equal(section!.accessory.text.text, "Open prototype");
  });

  it("retries only for an invalid_blocks that names the card, or names nothing", () => {
    const view = { type: "modal", blocks: [{ type: "header" }, ...objectCardBlocks(CARD)] };
    const named = (m: string) => ({ ok: false, error: "invalid_blocks", response_metadata: { messages: [m] } });
    assert.equal(refusedForCard(view, named("[ERROR] unsupported type: card [json-pointer:/view/blocks/1/type]")), true);
    assert.equal(refusedForCard(view, named("[ERROR] must be a valid enum value [json-pointer:/blocks/1/type]")), true);
    assert.equal(refusedForCard(view, { ok: false, error: "invalid_blocks" }), true);
    assert.equal(refusedForCard(view, named("[ERROR] must be less than 151 characters [json-pointer:/view/blocks/0/text]")), false);
    assert.equal(refusedForCard(view, { ok: false, error: "not_found" }), false);
    assert.equal(refusedForCard({ type: "modal", blocks: [{ type: "header" }] }, { ok: false, error: "invalid_blocks" }), false);
  });

  it("sends once when Slack takes the card", async () => {
    const sent: unknown[] = [];
    const view = { type: "modal", blocks: objectCardBlocks(CARD) };
    const res = await sendWithCardFallback(view, async (v) => (sent.push(v), { ok: true }));
    assert.equal(res.ok, true);
    assert.equal(sent.length, 1);
    assert.equal(blocks(sent[0])[0]!.type, "card");
  });

  it("sends again with the fallback when Slack refuses the card, and logs it", async () => {
    const sent: unknown[] = [];
    const warned: string[] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => void warned.push(args.join(" "));
    try {
      const view = { type: "modal", blocks: objectCardBlocks(CARD) };
      const res = await sendWithCardFallback(view, async (v) => {
        sent.push(v);
        return sent.length === 1
          ? { ok: false, error: "invalid_blocks", response_metadata: { messages: ["[ERROR] unsupported type: card [json-pointer:/view/blocks/0/type]"] } }
          : { ok: true };
      });
      assert.equal(res.ok, true);
    } finally {
      console.warn = warn;
    }
    assert.equal(sent.length, 2);
    assert.equal(blocks(sent[1]).some((b) => b.type === "card"), false);
    assert.equal(blocks(sent[1])[0]!.type, "section");
    assert.ok(warned.some((w) => /card block refused/.test(w)));
    assert.equal(withoutCardBlocks({ blocks: [] }), null);
  });
});
