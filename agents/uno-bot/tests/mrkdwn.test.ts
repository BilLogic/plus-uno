// The model writes standard Markdown (2026-08-22). These are the two things
// the Worker still has to do to it: strip tables on every path, and coerce to
// mrkdwn on the paths that are mrkdwn-only.
//
// Until this file existed, `src/slack/mrkdwn.ts` was not in tsconfig.test.json
// at all — it was not compiled by `npm test`, let alone asserted. It was also,
// for months, applied only to `chat.postMessage`'s `text` field while Slack
// rendered the blocks beside it, so nothing it did reached anyone.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { headingsToBold, stripMarkdownTables, toSlackMrkdwn } from "../src/slack/mrkdwn";

const TABLE = [
  "Here are the touchpoints:",
  "",
  "| Lane | Step | Owner |",
  "|---|---|---|",
  "| Tutor | Session prep | Ops |",
  "| System | Day-of | — |",
  "",
  "That's all three.",
].join("\n");

describe("tables die on every path", () => {
  it("turns a pipe table into bullet lines", () => {
    const out = stripMarkdownTables(TABLE);
    assert.ok(!out.includes("|"), `pipes survived:\n${out}`);
    assert.ok(out.includes("• Tutor — Session prep — Ops"), out);
    assert.ok(out.includes("• System — Day-of"), out);
    // The prose around it is untouched.
    assert.ok(out.startsWith("Here are the touchpoints:"), out);
    assert.ok(out.trimEnd().endsWith("That's all three."), out);
  });

  it("leaves a table inside a code fence alone", () => {
    // Inside a fence the pipes ARE the content — a schema, a SQL result, an
    // ASCII diagram. Converting them would corrupt what was being shown.
    const fenced = "```\n| a | b |\n|---|---|\n| 1 | 2 |\n```";
    assert.equal(stripMarkdownTables(fenced), fenced);
  });

  it("leaves a plain horizontal rule alone", () => {
    // `---` with no pipe is a divider, not a table separator.
    assert.equal(stripMarkdownTables("above\n\n---\n\nbelow"), "above\n\n---\n\nbelow");
  });

  it("is free when there is no pipe at all", () => {
    const plain = "no tables here, just prose";
    assert.equal(stripMarkdownTables(plain), plain);
  });

  it("is also covered by the mrkdwn path", () => {
    // Belt and braces: the blocks path runs toSlackMrkdwn, which converts
    // tables too, so a table cannot reach a reader through either door.
    assert.ok(!toSlackMrkdwn(TABLE).includes("|"));
  });
});

describe("headings keep their weight on the Markdown path", () => {
  // Measured 2026-08-22: Slack's Markdown parser drops the `#` and renders the
  // text as an ordinary line, so a reply that used headings for structure
  // arrived as undifferentiated prose. The mrkdwn path never had this problem,
  // so the two egress paths rendered the same reply at different quality.
  it("turns every ATX level into bold", () => {
    assert.equal(headingsToBold("# One"), "**One**");
    assert.equal(headingsToBold("### Three"), "**Three**");
    assert.equal(headingsToBold("###### Six"), "**Six**");
  });

  it("handles a heading among other lines", () => {
    assert.equal(
      headingsToBold("intro\n\n## Rollback\n\nbody"),
      "intro\n\n**Rollback**\n\nbody",
    );
  });

  it("strips a closing hash run", () => {
    assert.equal(headingsToBold("## Balanced ##"), "**Balanced**");
  });

  it("leaves a bare # alone — it is not a heading", () => {
    assert.equal(headingsToBold("#hashtag"), "#hashtag");
    assert.equal(headingsToBold("C# and F#"), "C# and F#");
  });

  it("never touches a # inside a code fence", () => {
    // A comment, or a root shell prompt.
    const code = "```bash\n# install first\nnpm i\n```";
    assert.equal(headingsToBold(code), code);
  });

  it("is free when there is no hash at all", () => {
    assert.equal(headingsToBold("plain prose"), "plain prose");
  });

  it("composes with the mrkdwn path without doubling up", () => {
    // renderDeliveredBody runs this, then the blocks path runs toSlackMrkdwn:
    // `## X` → `**X**` → `*X*`, which is what the mrkdwn path produced before.
    assert.equal(toSlackMrkdwn(headingsToBold("## Rollback")), "*Rollback*");
  });
});

describe("Markdown → mrkdwn, for the block and text paths", () => {
  it("converts the four constructs that actually differ", () => {
    assert.equal(toSlackMrkdwn("**bold**"), "*bold*");
    assert.equal(toSlackMrkdwn("__bold__"), "*bold*");
    assert.equal(toSlackMrkdwn("- item"), "• item");
    assert.equal(toSlackMrkdwn("## Heading"), "*Heading*");
    assert.equal(
      toSlackMrkdwn("[the card](https://notion.so/x)"),
      "<https://notion.so/x|the card>",
    );
  });

  it("keeps indentation on nested bullets", () => {
    assert.equal(toSlackMrkdwn("- top\n  - sub"), "• top\n  • sub");
  });

  it("strips the fence language tag", () => {
    // mrkdwn code blocks take no info string, so ```ts renders "ts" as a
    // literal first line inside the block.
    assert.equal(toSlackMrkdwn("```ts\nconst a = 1;\n```"), "```\nconst a = 1;\n```");
    // An inline fence has no newline and is left alone.
    assert.equal(toSlackMrkdwn("```x```"), "```x```");
  });

  it("does not touch code inside a fence", () => {
    const code = "```\n**not bold** and - not a bullet\n```";
    assert.equal(toSlackMrkdwn(code), code);
  });

  it("is idempotent on text the Worker itself wrote", () => {
    // Proposal cards, gate messages and the confirmation footer are authored
    // as mrkdwn and pass through the same converter.
    const card = "*About to create this card:*\n• *Title:* a thing\n<https://x|link>";
    assert.equal(toSlackMrkdwn(card), card);
  });

  it("is idempotent when run twice", () => {
    const once = toSlackMrkdwn(TABLE + "\n\n**bold** and [a](https://x)");
    assert.equal(toSlackMrkdwn(once), once);
  });
});
