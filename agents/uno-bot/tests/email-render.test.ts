// Markdown → email, both parts.
//
// Until 2026-08-22 `email_send` posted the body as `text/plain` with no
// conversion, so an external recipient — the reader least equipped to guess
// what it meant — received literal `**bold**` and `[label](url)`. These
// assertions are that bug's fence, on both parts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { markdownToEmail, renderHtml, renderPlainText } from "../src/integrations/email-render";
import { markdownToNotionBlocks } from "../src/integrations/notion-blocks";

const BODY = [
  "Hi Alex,",
  "",
  "**Short version:** the reconfirmation flow ships next sprint.",
  "",
  "What changes:",
  "",
  "- Tutors get the reminder 24h out",
  "- Ops calls if it is still unconfirmed by 10:00",
  "",
  "See [the PRD](https://notion.so/prd) for detail.",
  "",
  "Thanks,",
  "Bill",
].join("\n");

describe("no Markdown syntax survives into either part", () => {
  const { text, html } = markdownToEmail(BODY);

  it("leaves no asterisks or bracket-links in the plain-text part", () => {
    assert.ok(!text.includes("**"), text);
    assert.ok(!text.includes("]("), text);
    assert.ok(text.includes("Short version: the reconfirmation flow"), text);
  });

  it("keeps the URL in the plain-text part, where it stays clickable", () => {
    // Mail clients auto-link a bare URL, so `label (url)` survives as a link
    // even with no HTML. Losing the URL is the one thing plain text must not do.
    assert.ok(text.includes("the PRD (https://notion.so/prd)"), text);
  });

  it("renders bullets as bullets, not as hyphens", () => {
    assert.ok(text.includes("• Tutors get the reminder 24h out"), text);
  });

  it("renders the HTML part with real elements", () => {
    assert.ok(html.includes("<strong>Short version:</strong>"), html);
    assert.ok(html.includes('<a href="https://notion.so/prd">the PRD</a>'), html);
    assert.ok(html.includes("<ul><li>Tutors get the reminder 24h out</li>"), html);
  });
});

describe("plain text", () => {
  const render = (md: string) => renderPlainText(markdownToNotionBlocks(md));

  it("underlines a heading rather than shouting it", () => {
    assert.equal(render("## Rollback"), "Rollback\n--------");
  });

  it("keeps a list tight and separates everything else with a blank line", () => {
    assert.equal(render("- one\n- two\n\nAfter."), "• one\n• two\n\nAfter.");
  });

  it("indents a nested item", () => {
    assert.equal(render("- parent\n  - child"), "• parent\n  • child");
  });

  it("marks checkbox state", () => {
    assert.equal(render("- [x] done\n- [ ] not"), "[x] done\n[ ] not");
  });

  it("indents a code block instead of fencing it", () => {
    assert.equal(render("```sql\nselect 1;\n```"), "    select 1;");
  });

  it("prefixes a quote", () => {
    assert.equal(render("> careful"), "> careful");
  });

  it("collapses a link whose label is its own URL", () => {
    assert.equal(render("[https://x.com](https://x.com)"), "https://x.com");
  });
});

describe("html", () => {
  const render = (md: string) => renderHtml(markdownToNotionBlocks(md));

  it("escapes text that would otherwise be markup", () => {
    // The body is written by a model reading arbitrary fetched content; an
    // unescaped `<` reaching a mail client's HTML parser is how a body breaks
    // apart, or worse.
    const html = render("a < b && c > d, said \"x\"");
    assert.ok(html.includes("a &lt; b &amp;&amp; c &gt; d"), html);
    assert.ok(!/<p>a < b/.test(html));
  });

  it("escapes a URL in an href", () => {
    const html = render('[x](https://e.com/?a=1&b="2")');
    assert.ok(html.includes('href="https://e.com/?a=1&amp;b=&quot;2&quot;"'), html);
  });

  it("groups consecutive items into ONE list", () => {
    // A <ul> per item renders with a gap between every bullet in most clients.
    const html = render("- a\n- b\n- c");
    assert.equal(html.match(/<ul>/g)?.length, 1);
    assert.equal(html.match(/<li>/g)?.length, 3);
  });

  it("uses an ordered list for numbered items", () => {
    const html = render("1. a\n2. b");
    assert.ok(html.includes("<ol><li>a</li><li>b</li></ol>"), html);
  });

  it("nests a child list inside its parent item", () => {
    const html = render("- parent\n  - child");
    assert.ok(html.includes("<li>parent<ul><li>child</li></ul></li>"), html);
  });

  it("renders checkboxes as glyphs, since inputs are inert in mail", () => {
    const html = render("- [x] done\n- [ ] not");
    assert.ok(html.includes("&#9745; done"), html);
    assert.ok(html.includes("&#9744; not"), html);
  });

  it("never emits raw markup from a code block", () => {
    const html = render("```\n<script>alert(1)</script>\n```");
    assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), html);
    assert.ok(!html.includes("<script>"), html);
  });

  it("composes nested annotations", () => {
    assert.ok(render("**bold _and italic_**").includes("<strong><em>and italic</em></strong>"));
  });
});

describe("a table becomes bullets, on both parts", () => {
  // Deliberate (user, 2026-08-22: "Email, not working, bullet point instead").
  // Slack renders tables and Notion gets a real table block; email does not,
  // because HTML mail tables are the classic cross-client mess. Pairing each
  // cell with its column name is what keeps the flattening lossless.
  const TABLE = [
    "Statuses:",
    "",
    "| Card | Status | Owner |",
    "|---|---|---|",
    "| Sign Up | WIP | Ops |",
    "| Reconfirm | Shipped | Tutor |",
  ].join("\n");
  const { text, html } = markdownToEmail(TABLE);

  it("labels each cell with its column in the plain-text part", () => {
    assert.ok(text.includes("• Card: Sign Up · Status: WIP · Owner: Ops"), text);
    assert.ok(text.includes("• Card: Reconfirm · Status: Shipped · Owner: Tutor"), text);
  });

  it("emits no pipes and no header row of its own", () => {
    assert.ok(!text.includes("|"), text);
    // The header became labels, so it must not also appear as its own bullet.
    assert.ok(!text.includes("• Card: Card"), text);
  });

  it("uses one list in the HTML part, never a <table>", () => {
    assert.ok(!html.includes("<table"), html);
    assert.equal(html.match(/<ul>/g)?.length, 1);
    assert.ok(html.includes("<li>Card: Sign Up · Status: WIP · Owner: Ops</li>"), html);
  });

  it("keeps the prose around it, with no ragged gap", () => {
    assert.ok(text.startsWith("Statuses:"), text);
    assert.ok(text.trimEnd().endsWith("Owner: Tutor"), text);
    // A table's `children` ARE its rows, so the generic child-walk rendered
    // each one a second time as a blank indented line.
    for (const line of text.split("\n")) {
      assert.equal(line, line.trimEnd(), `trailing whitespace: ${JSON.stringify(line)}`);
    }
    assert.ok(!/\n{3,}/.test(text), JSON.stringify(text));
  });

  it("survives a header-only table", () => {
    const { text: t, html: h } = markdownToEmail("| a | b |\n|---|---|");
    assert.equal(t, "");
    assert.ok(!h.includes("<li>"), h);
  });
});

describe("degenerate input", () => {
  it("survives an empty body", () => {
    const { text, html } = markdownToEmail("");
    assert.equal(text, "");
    assert.ok(html.includes("<body"), html);
  });

  it("survives a body that is only whitespace", () => {
    assert.equal(markdownToEmail("   \n\n ").text, "");
  });
});
