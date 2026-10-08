// The Notion attribution line's words, pinned twice: as the literal a reader
// sees, and against `docs/connectors/notion.md` § Attribution, which states
// the same sentence to the model. A rewording in one place is a failure here
// until the other says it too.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { attributionBlock, notionAttribution } from "../src/integrations/notion-attribution";

test("the attribution line names the bot as le goat and the person it wrote for", () => {
  assert.equal(notionAttribution("Bill Guo"), "Written by le goat on behalf of Bill Guo");
});

test("the attribution block carries exactly the line, as one quiet paragraph", () => {
  const block = attributionBlock("Bill Guo") as {
    type: string;
    paragraph: { rich_text: Array<{ text: { content: string }; annotations: Record<string, unknown> }> };
  };
  assert.equal(block.type, "paragraph");
  assert.equal(block.paragraph.rich_text.length, 1);
  assert.equal(block.paragraph.rich_text[0]!.text.content, "Written by le goat on behalf of Bill Guo");
  assert.deepEqual(block.paragraph.rich_text[0]!.annotations, { italic: true, color: "gray" });
});

test("the Notion connector doc states the same line the Worker writes", () => {
  // The suite runs from `agents/uno-bot`, as `figma-copy.test.ts` reads its doc.
  const doc = readFileSync(join(process.cwd(), "..", "..", "docs", "connectors", "notion.md"), "utf8");
  assert.ok(doc.includes(`"${notionAttribution("{name}")}"`), "notion.md § Attribution quotes the line");
});
