// How the runner threads a turn's outcome into the next turn's history, and
// what `expectHistory` asserts about it (#426).
//
// THE PROPERTY THIS FILE HOLDS: a turn that read a reference hands the next
// turn the receipt — the name, on the user turn that read it, as
// slack/events.ts persists it — and never the text. The text is ~10k chars of
// tool result; production drops it at the turn boundary
// (agent/provider-conversation.ts renders the name as a one-line stub), and
// the eval runner must send the same shape or the clearing case C1 measures
// the runner's history rather than the bot's.
import { test } from "node:test";
import assert from "node:assert/strict";
import { threadTurn, checkHistory, sentSummary } from "./eval-history.mjs";

const METHOD_TEXT = "# uno-maintain — method\n" + "The severity pipeline, in full. ".repeat(320); // ~10k, like the real one
const NAME = "uno-maintain/method";

// A turn-1 response shaped like /debug/eval's: the model read the method (the
// tools list shows the call, the text rode the turn's tool result), and the
// route reported the hit as `references`.
const turn1 = {
  ok: true,
  result: { kind: "text", text: "Filed as an intake: inaccuracy, codebase, Tier 2 — touches a skill." },
  tools: [
    { name: "read_reference", args: { name: NAME } },
    { name: "notion_search", args: { query: "maintain intake" } },
  ],
  references: [NAME],
};

test("a read_reference hit becomes a receipt on the user turn, and the text stays behind", () => {
  const history = [];
  const pending = threadTurn(history, "Take this as an intake.", turn1, null);
  assert.equal(pending, null);
  assert.equal(history.length, 2);
  assert.deepEqual(history[0], { role: "user", content: "Take this as an intake.", references: [NAME] });
  assert.equal(history[1].role, "assistant");
  assert.equal("references" in history[1], false, "the receipt sits on the turn that read it, not the reply");
  const sent = JSON.stringify(history);
  assert.ok(!sent.includes(METHOD_TEXT.slice(0, 60)), "the method's text must not ride the thread");
  assert.ok(sent.length < 1000, `history sent is ${sent.length} chars — the text travelled`);
});

test("the C1 assertion passes on that history and fails when the text is carried", () => {
  const history = [];
  threadTurn(history, "Take this as an intake.", turn1, null);
  const spec = { expectHistory: { references: [NAME], maxChars: 8000 } };
  assert.deepEqual(checkHistory(spec, history), []);

  // The failure mode C1 exists to catch: the fetched text riding along as
  // history. ~10k of method in the assistant turn breaks the bound.
  const leaked = [history[0], { role: "assistant", content: `${history[1].content}\n\n${METHOD_TEXT}` }];
  const failures = checkHistory(spec, leaked);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /chars \(max 8000\)/);
});

test("a route that reports no references yields no receipt, and the assertion says so", () => {
  // No fallback from the `tools` list: a miss is a read_reference call too,
  // and only the route's turn scope knows which calls were served.
  const { references: _omitted, ...withoutReceipt } = turn1;
  const history = [];
  threadTurn(history, "Take this as an intake.", withoutReceipt, null);
  assert.equal("references" in history[0], false);
  const failures = checkHistory({ expectHistory: { references: [NAME] } }, history);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /no reference receipt for 'uno-maintain\/method'/);
  assert.match(failures[0], /receipts: none/);
});

test("receipts are de-duplicated and a spec without expectHistory checks nothing", () => {
  const history = [];
  threadTurn(history, "again", { ...turn1, references: [NAME, NAME, ""] }, null);
  assert.deepEqual(history[0].references, [NAME]);
  assert.deepEqual(checkHistory({ expectKind: ["text"] }, history), []);
  assert.deepEqual(sentSummary(history), {
    historyTurns: 2,
    historyChars: JSON.stringify(history).length,
    references: [NAME],
  });
});

test("proposal and resolved turns thread the way production records them", () => {
  const history = [];
  const pending = threadTurn(
    history,
    "File an intake card.",
    { ok: true, result: { kind: "proposal", toolName: "notion_create", input: { surface: "intake" } }, references: [NAME] },
    null,
  );
  assert.deepEqual(pending, { toolName: "notion_create", input: { surface: "intake" } });
  assert.deepEqual(history[0].references, [NAME]);
  assert.equal(history[1].content, "(staged a notion_create proposal awaiting confirmation)");

  const after = threadTurn(history, "no, cancel", { ok: true, result: { kind: "resolved", decision: "cancel" } }, pending);
  assert.equal(after, null);
  // The OUTCOME MARKER, which events.ts reads to refuse re-carding (R5).
  assert.equal(history[3].content, "(Cancelled the proposed notion_create — nothing was done.)");
});
