// Markdown → Notion blocks.
//
// Before 2026-08-22 a Notion body was split on blank lines into paragraph
// blocks and nothing else — so `**Decision:** one sentence`, the exact shape
// `docs/conventions/notion.md` § Decisions tells the model to write, landed on
// the page as literal asterisks. These assertions are that bug's fence.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  chunkBlocks,
  markdownToNotionBlocks,
  parseInline,
  MAX_BLOCKS_PER_REQUEST,
  type NotionBlock,
  type RichTextRun,
} from "../src/integrations/notion-blocks";

/** The rich_text of a block, whatever its type. */
function runs(block: NotionBlock): RichTextRun[] {
  return (block[block.type] as { rich_text: RichTextRun[] }).rich_text;
}
function plain(block: NotionBlock): string {
  return runs(block).map((r) => r.text.content).join("");
}
function types(blocks: NotionBlock[]): string[] {
  return blocks.map((b) => b.type);
}

describe("inline annotations", () => {
  it("marks bold, italic, code and strikethrough", () => {
    assert.deepEqual(parseInline("**bold**"), [
      { type: "text", text: { content: "bold" }, annotations: { bold: true } },
    ]);
    assert.equal(parseInline("_italic_")[0]!.annotations?.italic, true);
    assert.equal(parseInline("*italic*")[0]!.annotations?.italic, true);
    assert.equal(parseInline("`code`")[0]!.annotations?.code, true);
    assert.equal(parseInline("~~gone~~")[0]!.annotations?.strikethrough, true);
  });

  it("splits a mixed line into the right runs", () => {
    const out = parseInline("**Decision:** ship it");
    assert.equal(out.length, 2);
    assert.deepEqual(out[0], {
      type: "text",
      text: { content: "Decision:" },
      annotations: { bold: true },
    });
    assert.equal(out[1]!.text.content, " ship it");
    assert.equal(out[1]!.annotations, undefined);
  });

  it("composes annotations through nesting", () => {
    const out = parseInline("**bold with _italic_ inside**");
    assert.deepEqual(out.map((r) => r.text.content), ["bold with ", "italic", " inside"]);
    assert.deepEqual(out.map((r) => r.annotations?.italic ?? false), [false, true, false]);
    assert.ok(out.every((r) => r.annotations?.bold));
  });

  it("takes a code span literally", () => {
    // The point of a code span is that its contents are not markup.
    const out = parseInline("`**not bold**`");
    assert.equal(out.length, 1);
    assert.equal(out[0]!.text.content, "**not bold**");
    assert.equal(out[0]!.annotations?.code, true);
    assert.equal(out[0]!.annotations?.bold, undefined);
  });

  it("does NOT italicise snake_case", () => {
    // The regression this codebase would actually hit: its own vocabulary is
    // full of snake_case, and a naive `_..._` rule turns "notion_create and
    // source_read" into mangled emphasis.
    const out = parseInline("notion_create and source_read both run");
    assert.equal(out.length, 1);
    assert.equal(out[0]!.text.content, "notion_create and source_read both run");
    assert.equal(out[0]!.annotations, undefined);
  });

  it("turns a Markdown link into a real Notion link", () => {
    const out = parseInline("see [the card](https://notion.so/x) for detail");
    assert.equal(out[1]!.text.content, "the card");
    assert.deepEqual(out[1]!.text.link, { url: "https://notion.so/x" });
    assert.equal(out[0]!.text.link, undefined);
  });

  it("keeps emphasis inside a link label", () => {
    const out = parseInline("[**bold label**](https://x.com)");
    assert.equal(out[0]!.annotations?.bold, true);
    assert.deepEqual(out[0]!.text.link, { url: "https://x.com" });
  });

  it("degrades an unusable scheme to text rather than 400ing the write", () => {
    // Notion rejects a link whose url is not http(s)/mailto, and it rejects the
    // WHOLE request — so one relative link in one paragraph would lose the page.
    const out = parseInline("[a doc](../relative/path.md)");
    assert.equal(out.length, 1);
    assert.equal(out[0]!.text.link, undefined);
    assert.equal(out[0]!.text.content, "a doc (../relative/path.md)");
  });
});

describe("block types", () => {
  it("maps each construct to its Notion block", () => {
    const md = [
      "A paragraph.",
      "",
      "- first",
      "- second",
      "",
      "1. one",
      "2. two",
      "",
      "> a quote",
      "",
      "- [ ] unchecked",
      "- [x] checked",
      "",
      "---",
      "",
      "## A heading",
    ].join("\n");
    assert.deepEqual(types(markdownToNotionBlocks(md)), [
      "paragraph",
      "bulleted_list_item",
      "bulleted_list_item",
      "numbered_list_item",
      "numbered_list_item",
      "quote",
      "to_do",
      "to_do",
      "divider",
      "heading_3",
    ]);
  });

  it("reads the checkbox state", () => {
    const [open, done] = markdownToNotionBlocks("- [ ] a\n- [x] b");
    assert.equal((open![open!.type] as { checked: boolean }).checked, false);
    assert.equal((done![done!.type] as { checked: boolean }).checked, true);
  });

  it("keeps every heading at heading_3", () => {
    // Section headings own heading_2 and fetchNotionPRD walks that outline
    // downstream. A `#` inside a section body is subordinate to its section, so
    // it must render subordinate.
    const blocks = markdownToNotionBlocks("# one\n\n## two\n\n### three");
    assert.deepEqual(types(blocks), ["heading_3", "heading_3", "heading_3"]);
  });

  it("merges consecutive quote lines into one block", () => {
    const blocks = markdownToNotionBlocks("> line one\n> line two");
    assert.equal(blocks.length, 1);
    assert.equal(plain(blocks[0]!), "line one\nline two");
  });

  it("nests an indented list item as a child, one level", () => {
    const blocks = markdownToNotionBlocks("- parent\n  - child\n- sibling");
    assert.deepEqual(types(blocks), ["bulleted_list_item", "bulleted_list_item"]);
    const children = (blocks[0]!.bulleted_list_item as { children?: NotionBlock[] }).children;
    assert.equal(children?.length, 1);
    assert.equal(plain(children![0]!), "child");
  });

  it("builds a code block with a mapped language", () => {
    const [block] = markdownToNotionBlocks("```ts\nconst a = 1;\n```");
    assert.equal(block!.type, "code");
    const code = block!.code as { language: string; rich_text: RichTextRun[] };
    assert.equal(code.language, "typescript");
    assert.equal(code.rich_text[0]!.text.content, "const a = 1;");
  });

  it("falls back to plain text for an unknown language", () => {
    // Notion validates `language` against a closed enum and 400s the whole
    // request on anything else.
    const [block] = markdownToNotionBlocks("```wat\nx\n```");
    assert.equal((block!.code as { language: string }).language, "plain text");
  });

  it("never parses markup inside a fence", () => {
    const [block] = markdownToNotionBlocks("```\n- not a bullet\n**not bold**\n```");
    assert.equal(block!.type, "code");
    assert.equal(
      (block!.code as { rich_text: RichTextRun[] }).rich_text[0]!.text.content,
      "- not a bullet\n**not bold**",
    );
  });

  it("keeps a soft-wrapped paragraph as one block", () => {
    const blocks = markdownToNotionBlocks("line one\nline two\n\nsecond para");
    assert.deepEqual(types(blocks), ["paragraph", "paragraph"]);
    assert.equal(plain(blocks[0]!), "line one\nline two");
  });

  it("returns nothing for empty input", () => {
    assert.deepEqual(markdownToNotionBlocks(""), []);
    assert.deepEqual(markdownToNotionBlocks("   \n\n  "), []);
  });
});

describe("the shape the convention doc asks for", () => {
  it("renders a Decisions body as annotated blocks, not literal asterisks", () => {
    const md = [
      "**Decision:** adopt the lane rename across both repos.",
      "",
      "**Why:** the RPC and the caller disagreed, see [the plan](https://notion.so/p).",
      "",
      "- `filter_layer_role` becomes `filter_lane_role`",
      "- both repos ship in one window",
    ].join("\n");
    const blocks = markdownToNotionBlocks(md);
    assert.deepEqual(types(blocks), [
      "paragraph",
      "paragraph",
      "bulleted_list_item",
      "bulleted_list_item",
    ]);
    // No asterisk survives anywhere in the rendered text.
    assert.ok(!blocks.map(plain).join("").includes("*"));
    assert.equal(runs(blocks[0]!)[0]!.annotations?.bold, true);
    assert.deepEqual(runs(blocks[1]!).at(-2)!.text.link, { url: "https://notion.so/p" });
    assert.equal(runs(blocks[2]!)[0]!.annotations?.code, true);
  });
});

describe("Notion's request limits", () => {
  it("batches children at 100", () => {
    const blocks = Array.from({ length: 250 }, (_, i) => i);
    const batches = chunkBlocks(blocks, MAX_BLOCKS_PER_REQUEST);
    assert.deepEqual(batches.map((b) => b.length), [100, 100, 50]);
    assert.deepEqual(batches.flat(), blocks);
  });

  it("leaves a small body in one batch, and an empty one in none", () => {
    assert.equal(chunkBlocks([1, 2, 3]).length, 1);
    assert.deepEqual(chunkBlocks([]), []);
  });

  it("splits a paragraph that would exceed the per-block text cap", () => {
    const blocks = markdownToNotionBlocks("x".repeat(5000));
    assert.ok(blocks.length > 1, `expected a split, got ${blocks.length}`);
    for (const b of blocks) {
      const total = runs(b).reduce((n, r) => n + r.text.content.length, 0);
      assert.ok(total <= 1900, `block of ${total} chars exceeds the cap`);
    }
    assert.equal(blocks.map(plain).join("").length, 5000);
  });
});
