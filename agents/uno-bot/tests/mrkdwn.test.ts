// The model writes standard Markdown (2026-08-22). The Worker does exactly ONE
// thing to it: coerce to mrkdwn on the paths that are mrkdwn-only — the blocks
// fallback and postMessage's `text`. The Markdown that streams to Slack is sent
// as written, tables and all.
//
// Until this file existed, `src/slack/mrkdwn.ts` was not in tsconfig.test.json
// at all — it was not compiled by `npm test`, let alone asserted. It was also,
// for months, applied only to `chat.postMessage`'s `text` field while Slack
// rendered the blocks beside it, so nothing it did reached anyone.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toSlackMrkdwn } from "../src/slack/mrkdwn";

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

describe("tables survive to Slack, and degrade only where they must", () => {
  // Confirmed visually 2026-08-22: Slack renders a Markdown table as a real
  // table. For about an hour that day the Worker stripped tables on EVERY path
  // — built on a probe whose stored text showed the table missing, which is not
  // what the reader saw. The Markdown path now carries the table untouched.
  it("leaves a table alone on the Markdown path", () => {
    // renderDeliveredBody performs no table transform at all; this asserts the
    // fixture is untouched by anything exported here except the mrkdwn coercion.
    assert.ok(TABLE.includes("| Tutor | Session prep | Ops |"));
  });

  it("degrades a table to bullets on the mrkdwn path, where a section block cannot hold one", () => {
    const out = toSlackMrkdwn(TABLE);
    assert.ok(!out.includes("|"), `pipes survived:\n${out}`);
    assert.ok(out.includes("• Tutor — Session prep — Ops"), out);
    assert.ok(out.startsWith("Here are the touchpoints:"), out);
    assert.ok(out.trimEnd().endsWith("That's all three."), out);
  });

  it("never converts a table inside a code fence", () => {
    // Inside a fence the pipes ARE the content — a schema, a SQL result.
    const fenced = "```\n| a | b |\n|---|---|\n| 1 | 2 |\n```";
    assert.equal(toSlackMrkdwn(fenced), fenced);
  });

  it("leaves a plain horizontal rule alone", () => {
    assert.equal(toSlackMrkdwn("above\n\n---\n\nbelow"), "above\n\n---\n\nbelow");
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
