// What an eval transcript is allowed to say about a tool RESULT (#452).
//
// THE FAILURE THIS PINS. S3 — "unconsented in own DM offers the connect link" —
// read 0/3 against Worker r254. All three replies said workspace search "isn't
// available on this turn", and the artifact recorded the tool ARGUMENTS and
// nothing else, so nobody could tell which of three legs had failed: the own-DM
// gate on a synthetic channel, a null connect URL, or no viable credential. The
// transcript now carries the result's own note/visibility/error, which is
// exactly the difference between those three.
//
// THE PROMISE ON THE OTHER SIDE. Rows never travel. An eval artifact is written
// to a file, attached to a run and read weeks later; a `results` array in it is
// the S2 disclosure failure moved one layer up, into the instrument.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toolResultDigest,
  attachToolResult,
  MAX_TRANSCRIPT_FIELD_CHARS,
  type ToolCall,
} from "../src/agent/tool-transcript";

test("the digest carries note and visibility, and nothing else the tool returned", () => {
  const result = JSON.stringify({
    ok: true,
    query: "migration deadline",
    visibility: "public-only (no user credential — public channels are the whole search)",
    searched_surfaces: "public_channel",
    results: [{ text: "a real message someone sent", permalink: "https://x" }],
    note: "these results do not cover DMs or un-allowlisted private channels. Connect at https://uno-bot.example/oauth/slack/start",
  });
  const digest = toolResultDigest("slack_search", result);
  assert.equal(digest.name, "slack_search");
  assert.match(String(digest.visibility), /public-only/);
  assert.match(String(digest.note), /oauth\/slack\/start/);
  // The whole point of the cap on what is kept.
  assert.equal("results" in digest, false);
  assert.equal("searched_surfaces" in digest, false);
  assert.equal(JSON.stringify(digest).includes("a real message someone sent"), false);
});

test("an error result is recorded as an error, not as an empty one", () => {
  // The S3 leg itself: search returned before it ran. A transcript that showed
  // only the arguments made this indistinguishable from a search that ran and
  // found nothing.
  const digest = toolResultDigest(
    "slack_search",
    JSON.stringify({
      ok: false,
      error: "workspace search unavailable (no search credential stored) — use thread/channel reads instead",
      note: "no search ran, so this is NOT an empty result and must not be reported as one. The requester can connect their own Slack history — searches here will then cover everything they can see — at https://uno-bot.example/oauth/slack/start",
    }),
  );
  assert.match(String(digest.error), /no search credential stored/);
  assert.match(String(digest.note), /oauth\/slack\/start/);
});

test("a note deep inside a row is that row's content and is never read", () => {
  const digest = toolResultDigest(
    "search_blueprint",
    JSON.stringify({ ok: true, rows: [{ title: "a cell", note: "prose from the board" }] }),
  );
  assert.deepEqual(digest, { name: "search_blueprint" });
});

test("a result that is not JSON, or not an object, costs the digest and never the turn", () => {
  assert.deepEqual(toolResultDigest("source_read", "not json at all"), { name: "source_read" });
  assert.deepEqual(toolResultDigest("source_read", "[1,2,3]"), { name: "source_read" });
  assert.deepEqual(toolResultDigest("source_read", ""), { name: "source_read" });
  // Empty and whitespace-only fields say nothing and are dropped rather than
  // recorded as a note that exists.
  assert.deepEqual(toolResultDigest("x", JSON.stringify({ note: "   ", visibility: "" })), { name: "x" });
});

test("no single field can carry a payload", () => {
  const digest = toolResultDigest("x", JSON.stringify({ note: "z".repeat(5000) }));
  assert.ok(String(digest.note).length <= MAX_TRANSCRIPT_FIELD_CHARS + 20);
  assert.match(String(digest.note), /truncated/);
});

// ── attachment: which call a result belongs to ───────────────────────────────

test("the result lands on the call it answers", () => {
  const tools: ToolCall[] = [
    { name: "read_reference", args: { name: "uno-maintain/method" } },
    { name: "slack_search", args: { query: "migration deadline" } },
  ];
  const filled = new Set<number>();
  const i = attachToolResult(
    tools,
    { name: "slack_search", visibility: "public-only", note: "connect at https://x" },
    filled,
  );
  assert.equal(i, 1);
  assert.equal(tools[1]?.visibility, "public-only");
  assert.equal(tools[1]?.note, "connect at https://x");
  // The arguments are untouched — the transcript still says what was asked.
  assert.deepEqual(tools[1]?.args, { query: "migration deadline" });
  assert.equal("note" in tools[0]!, false);
});

test("two calls to the same tool keep their own results", () => {
  // FIFO, because results come back in the order the calls were issued. A
  // second search overwriting the first one's visibility would collapse two
  // reads into one and quietly lose the one that failed.
  const tools: ToolCall[] = [
    { name: "search_blueprint", args: { query: "one" } },
    { name: "search_blueprint", args: { query: "two" } },
  ];
  const filled = new Set<number>();
  attachToolResult(tools, { name: "search_blueprint", note: "first" }, filled);
  attachToolResult(tools, { name: "search_blueprint", note: "second" }, filled);
  assert.equal(tools[0]?.note, "first");
  assert.equal(tools[1]?.note, "second");
});

test("a digest with nothing to say still consumes its call", () => {
  // Otherwise an empty digest would leave the entry looking unanswered and the
  // NEXT result of the same tool would be filed against the wrong call.
  const tools: ToolCall[] = [
    { name: "notion_search", args: { query: "a" } },
    { name: "notion_search", args: { query: "b" } },
  ];
  const filled = new Set<number>();
  assert.equal(attachToolResult(tools, { name: "notion_search" }, filled), 0);
  assert.equal(attachToolResult(tools, { name: "notion_search", note: "b's note" }, filled), 1);
  assert.equal(tools[0]?.note, undefined);
  assert.equal(tools[1]?.note, "b's note");
});

test("a result with no call waiting is dropped, not filed against something else", () => {
  const tools: ToolCall[] = [{ name: "slack_search", args: {} }];
  const filled = new Set<number>();
  attachToolResult(tools, { name: "slack_search", note: "first" }, filled);
  assert.equal(attachToolResult(tools, { name: "slack_search", note: "orphan" }, filled), -1);
  assert.equal(tools[0]?.note, "first");
});
