// A drafted GitHub issue reads as Slack text in the Review pop-up, not as the
// Markdown GitHub will render: no hidden comment, a table row as one bullet
// with its name once, and every row shown however long the body runs.
//
// Driven at the render seam, `readableDraft`, with a body the Figma library
// poll filed live. The issue it creates is not touched: the body on the
// operation stays exactly as staged.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { readableDraft } from "../src/slack/review-draft";
import { toSlackMrkdwn } from "../src/slack/mrkdwn";
import { FIGMA_PUBLISH_ISSUE_BODY } from "./fixtures/figma-publish-issue";

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

  it("drops an empty cell and a cell that repeats an earlier one", () => {
    const table = ["| A | B | C | D |", "|---|---|---|---|", "| x | | `y` | y |"].join("\n");
    assert.equal(rendered(table), "• *x* · `y`");
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
