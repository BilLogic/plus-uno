// Cutting a message without breaking what it is made of.
//
// The audit case, 2026-08-22: a reply with a fenced code block straddling the
// 3900-character cap left ONE ``` behind, so the truncation notice and
// everything after it rendered inside the code block. The blocks path had the
// same defect at 2900 — a fence opened in one section and "closed" in the next,
// mangling both. Neither path had a single test.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { splitBalanced } from "../src/slack/split";

/** Every chunk must carry an even number of fences, or it is broken. */
function fenceCount(s: string): number {
  return s.split("\n").filter((l) => /^\s*```/.test(l)).length;
}
function assertAllBalanced(chunks: string[]): void {
  chunks.forEach((c, i) => {
    assert.equal(fenceCount(c) % 2, 0, `chunk ${i} has an unclosed fence:\n${c}`);
  });
}

describe("the shape of the result", () => {
  it("returns nothing for empty input", () => {
    assert.deepEqual(splitBalanced("", 100), []);
  });

  it("returns the text untouched when it already fits", () => {
    assert.deepEqual(splitBalanced("short", 100), ["short"]);
  });

  it("respects the limit on every chunk", () => {
    const text = Array.from({ length: 200 }, (_, i) => `line ${i} of some prose`).join("\n");
    const chunks = splitBalanced(text, 300);
    assert.ok(chunks.length > 1);
    for (const c of chunks) assert.ok(c.length <= 300, `chunk of ${c.length} exceeds 300`);
  });

  it("loses no content", () => {
    const text = Array.from({ length: 120 }, (_, i) => `line ${i}`).join("\n");
    const rejoined = splitBalanced(text, 200).join("\n");
    assert.equal(rejoined.replace(/\s+/g, " ").trim(), text.replace(/\s+/g, " ").trim());
  });
});

describe("a fence never straddles a cut", () => {
  // The reply that started this: prose, then a long code block, then more prose.
  const REPLY = [
    "Here is the query I ran:",
    "",
    "```sql",
    ...Array.from({ length: 40 }, (_, i) => `  select col_${i} from cells where lane_id = $1;`),
    "```",
    "",
    "That is the whole thing.",
  ].join("\n");

  it("closes the fence at the cut and reopens it after", () => {
    const chunks = splitBalanced(REPLY, 700);
    assert.ok(chunks.length > 1, "expected the fixture to actually split");
    assertAllBalanced(chunks);
    // Every chunk after the first that continues the block reopens it WITH the
    // language, so a sql block stays a sql block.
    assert.ok(chunks[1]!.startsWith("```sql"), chunks[1]!.slice(0, 40));
  });

  it("keeps the trailing prose outside the code block", () => {
    const chunks = splitBalanced(REPLY, 700);
    const last = chunks[chunks.length - 1]!;
    assert.ok(last.includes("That is the whole thing."), last);
    // If the fence had been left open, this line would be inside it — which is
    // exactly what shipped before 2026-08-22.
    const beforeProse = last.slice(0, last.indexOf("That is the whole thing."));
    assert.equal(fenceCount(beforeProse) % 2, 0, last);
  });

  it("handles a fence with no language", () => {
    const text = ["```", ...Array.from({ length: 60 }, (_, i) => `row ${i}`), "```"].join("\n");
    const chunks = splitBalanced(text, 200);
    assert.ok(chunks.length > 1);
    assertAllBalanced(chunks);
    assert.ok(chunks[1]!.startsWith("```"));
  });

  it("does not reopen a fence that had already closed at the boundary", () => {
    const text = [
      "```js",
      "const a = 1;",
      "```",
      ...Array.from({ length: 60 }, (_, i) => `prose line ${i}`),
    ].join("\n");
    const chunks = splitBalanced(text, 250);
    assertAllBalanced(chunks);
    // The prose chunks must not start with a stray fence.
    assert.ok(!chunks[chunks.length - 1]!.startsWith("```"), chunks[chunks.length - 1]!);
  });
});

describe("a single line longer than the limit", () => {
  it("cuts at a space rather than mid-word", () => {
    const line = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    const chunks = splitBalanced(line, 120);
    assert.ok(chunks.length > 1);
    for (const c of chunks) {
      assert.ok(c.length <= 120);
      assert.ok(!/^\S*\s/.test(c) || !c.startsWith(" "), c);
    }
    // No word was sliced in half.
    const words = chunks.join(" ").split(/\s+/);
    for (const w of words) assert.match(w, /^word\d+$/, w);
  });

  it("prefers a cut that leaves inline code balanced", () => {
    // An unterminated inline code span swallows the rest of the line visually.
    const line = `${"filler ".repeat(30)}\`search_blueprint\` ${"more ".repeat(30)}`;
    for (const c of splitBalanced(line, 120)) {
      assert.equal((c.match(/`/g) ?? []).length % 2, 0, `unbalanced backticks in: ${c}`);
    }
  });

  it("still terminates when there is no space to cut at", () => {
    const chunks = splitBalanced("x".repeat(500), 100);
    assert.ok(chunks.length >= 5);
    for (const c of chunks) assert.ok(c.length <= 100);
    assert.equal(chunks.join("").length, 500);
  });
});

describe("whitespace", () => {
  it("does not end a chunk with blank lines", () => {
    const text = ["a".repeat(90), "", "", "b".repeat(90), "", "", "c".repeat(90)].join("\n");
    for (const c of splitBalanced(text, 100)) {
      assert.equal(c, c.trimEnd(), `chunk ends with whitespace: ${JSON.stringify(c)}`);
    }
  });
});
