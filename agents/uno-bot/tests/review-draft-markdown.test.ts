// A drafted GitHub issue reads as Slack text in the Review pop-up, not as the
// Markdown GitHub will render: no hidden comment, a table row as one bullet
// with its name once, and every row shown however long the body runs.
//
// Driven at the render seam, `readableDraft`, with a body the Figma library
// poll filed live. The issue it creates is not touched: the body on the
// operation stays exactly as staged. The tidy-up is the issue's alone: an
// email, a DM and a Notion append preview the text that is sent, and the
// pop-up's card-text paths (an unread tool, a decided card) are untouched.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { readableDraft } from "../src/slack/review-draft";
import { decidedView, draftView } from "../src/slack/review-view";
import { textSections } from "../src/slack/render";
import { toSlackMrkdwn } from "../src/slack/mrkdwn";
import type { PendingProposal } from "../src/thread-state/index";
import { FIGMA_PUBLISH_ISSUE_BODY } from "./helpers/figma-publish-issue";

type Block = { type: string; text?: { text: string } };

function issue(body: string) {
  return [{ toolName: "github_issue_create", input: { title: "Figma library published", body } }];
}

/** The body's sections, in order — the properties section first is skipped. */
function bodySections(body: string): string[] {
  const blocks = readableDraft(issue(body)) as Block[];
  return blocks.slice(1).filter((b) => b.type === "section").map((b) => b.text!.text);
}

const rendered = (body: string) => bodySections(body).join("\n");

describe("a drafted GitHub issue in the Review pop-up", () => {
  it("leaves out the hidden marker, and keeps it on the issue that is filed", () => {
    const ops = issue(FIGMA_PUBLISH_ISSUE_BODY);
    readableDraft(ops);
    assert.doesNotMatch(rendered(FIGMA_PUBLISH_ISSUE_BODY), /<!--|-->|uno-bot:figma-publish/);
    assert.match(String(ops[0]!.input.body), /^<!-- uno-bot:figma-publish:2409546897267215479 -->/);
  });

  it("strips a comment that spans lines", () => {
    assert.equal(rendered("before\n<!-- one\ntwo -->\nafter"), "before\n\nafter");
  });

  it("reads a twelve-row table as twelve bullets, each named once in bold", () => {
    const text = rendered(FIGMA_PUBLISH_ISSUE_BODY);
    const rows = text.split("\n").filter((l) => l.includes("no code mapping ·"));
    assert.equal(rows.length, 12);
    assert.equal(
      rows[0],
      "• *<https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX?node-id=13125-6192|Input Group Button>* · no code mapping · deleted: 18 variants",
    );
    for (const row of rows) {
      const name = row.match(/\|([^>]+)>\*/)![1]!;
      assert.equal(row.split(name).length - 1, 1, `${name} is named once: ${row}`);
    }
    assert.doesNotMatch(text, / — no code mapping — /);
    assert.doesNotMatch(text, /\| *Component *\|/);
  });

  it("drops an empty cell and a cell that repeats the first", () => {
    const table = ["| A | B | C | D |", "|---|---|---|---|", "| `x` | | y | x |"].join("\n");
    assert.equal(rendered(table), "• *`x`* · y");
  });

  it("keeps later cells that match each other, and a repeat in another case", () => {
    const table = ["| Name | Before | After | Note |", "|---|---|---|---|", "| Card | 2 variants | 2 variants | card |"].join("\n");
    assert.equal(rendered(table), "• *Card* · 2 variants · 2 variants · card");
  });

  it("keeps a comment inside code", () => {
    assert.equal(rendered("Tag it `<!-- marker -->` first.\n```\n<!-- kept -->\n```"), "Tag it `<!-- marker -->` first.\n```\n<!-- kept -->\n```");
  });

  it("keeps a link on a cell that does not repeat", () => {
    const table = ["| Name | Doc |", "|---|---|", "| Card | [Spec](https://example.com/spec) |"].join("\n");
    assert.equal(rendered(table), "• *Card* · <https://example.com/spec|Spec>");
  });

  it("renders headings, numbered lists, task items, bold, links and code without raw Markdown", () => {
    const text = rendered(FIGMA_PUBLISH_ISSUE_BODY);
    assert.match(text, /^\*What was published\*$/m);
    assert.match(text, /^1\. \*Input Group Button\* — no code mapping: `component-registry\.json` maps/m);
    assert.match(text, /^12\. \*PLUS \/ student list item\* —/m);
    assert.match(text, /^☐ Each mapped component's code matches the published Figma variants$/m);
    assert.match(text, /<https:\/\/www\.figma\.com\/design\/zAecJNRdvJzAUOcjV32tRX\?version-id=2409546897267215479\|Components published>/);
    assert.doesNotMatch(text, /^#+ |\*\*|\[ \]|\]\(https?:|^---$/m);
    assert.equal(rendered("- [x] Done\n- [ ] Open"), "☑ Done\n☐ Open");
  });

  it("shows every row of a table too long for one section, across several", () => {
    const rows = Array.from({ length: 120 }, (_, i) => `| Component ${i + 1} | no code mapping | deleted: ${i + 1} variants |`);
    const sections = bodySections(["| Component | Code | Change |", "|---|---|---|", ...rows].join("\n"));
    assert.ok(sections.length > 1, "split across sections");
    for (const s of sections) assert.ok(s.length <= 3000, "each within a section's cap");
    const bullets = sections.join("\n").split("\n").filter((l) => l.startsWith("• "));
    assert.equal(bullets.length, 120);
    assert.equal(bullets[119], "• *Component 120* · no code mapping · deleted: 120 variants");
  });

  it("leaves the answer path's table bullets as they were", () => {
    const table = ["| A | B |", "|---|---|", "| x | [x](https://example.com) |"].join("\n");
    assert.equal(toSlackMrkdwn(table), "• x — <https://example.com|x>");
  });
});

/** Markdown the tidy-up would change: a comment, a table, a task item. */
const SENT_AS_WRITTEN = ["<!-- note -->", "| Name | Link |", "|---|---|", "| Card | Card |", "- [ ] Open"].join("\n");

/** The sections a body draws with no tidy-up at all. */
const plain = (text: string) => textSections(text).map((s) => (s as Block).text!.text);

describe("text the pop-up previews as it is sent", () => {
  const sectionsOf = (blocks: unknown[] | null) =>
    (blocks as Block[]).filter((b) => b.type === "section").map((b) => b.text!.text);

  it("an email body", () => {
    const blocks = readableDraft([{ toolName: "email_send", input: { to: "a@example.com", subject: "Hi", body: SENT_AS_WRITTEN } }]);
    assert.deepEqual(sectionsOf(blocks).slice(1), plain(SENT_AS_WRITTEN));
  });

  it("a relayed DM", () => {
    const blocks = readableDraft([{ toolName: "dm_relay", input: { recipient: "U0123456789", text: SENT_AS_WRITTEN } }]);
    assert.deepEqual(sectionsOf(blocks).slice(1), plain(SENT_AS_WRITTEN));
  });

  it("a Notion append", () => {
    const blocks = readableDraft([{ toolName: "notion_update", input: { page_url: "https://www.notion.so/x", append: { text: SENT_AS_WRITTEN } } }]);
    assert.ok(sectionsOf(blocks).join("\n").includes(plain(SENT_AS_WRITTEN).join("\n")));
  });
});

describe("the pop-up's card-text paths", () => {
  const CARD = { channel: "C1", ts: "1700000000.000195" };
  const viewSections = (view: { blocks: unknown[] }) =>
    (view.blocks as Block[]).filter((b) => b.type === "section").map((b) => b.text!.text);

  it("a tool with no reading shows its card's text as the card has it", () => {
    const proposal: PendingProposal = {
      toolName: "figma_comment_reply",
      input: {},
      channel: "C1",
      threadTs: "1700000000.000100",
      userMsgTs: "1700000000.000190",
      proposalTs: CARD.ts,
      proposalText: SENT_AS_WRITTEN,
      requesterUserId: "U0123456789",
    };
    const view = draftView(CARD, proposal, { mayDecide: false, confirmers: [] }) as unknown as { blocks: unknown[] };
    assert.ok(viewSections(view).join("\n").includes(plain(SENT_AS_WRITTEN).join("\n")));
  });

  it("a decided card shows its own words", () => {
    const view = decidedView(CARD, SENT_AS_WRITTEN) as unknown as { blocks: unknown[] };
    assert.deepEqual(viewSections(view), plain(SENT_AS_WRITTEN));
  });
});
