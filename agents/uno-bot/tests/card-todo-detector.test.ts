// The card to-do detector (Follow through F3): a thread in, to-dos to create
// a Roadmap card out, on the `chill` tier — and a parse that keeps only what
// the thread can stand behind.
//
// The eval cases (docs/evals/fixtures/card-todo-cases.json) are replayed here
// through the real detector over the fake adapter: a card to-do with and
// without an assignee, a to-do that is not about a card, and talk about a card
// that already exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fakeProvider } from "../src/agent/providers/fake";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import { detectCardTodos, mayHoldCardTodo, parseCardTodoReply } from "../src/follow-through/index";
import type { SweepMessage, SweepThread } from "../src/sweep/index";

interface CardTodoCase {
  id: string;
  name: string;
  judgeNote: string;
  since: string;
  thread: SweepMessage[];
  recording: { source: "authored" | "captured"; reply: string };
  expect: { todos: Array<Record<string, unknown>> };
}

const FIXTURE = resolve(process.cwd(), "../..", "docs/evals/fixtures/card-todo-cases.json");
const cases = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: CardTodoCase[] }).cases;

const threadOf = (messages: SweepMessage[]): SweepThread => ({ channel: "C0DESIGN", channelKind: "public", rootTs: messages[0]!.ts, messages });

test("the fixture holds a card to-do against one that is not, each with a rubric and a recorded reply", () => {
  assert.deepEqual(cases.map((c) => c.id), ["CT1", "CT2", "CT3", "CT4"]);
  assert.equal(isWithheldRepoPath("docs/evals/fixtures/card-todo-cases.json"), true);
  for (const c of cases) {
    assert.ok(c.judgeNote.trim(), `${c.id} has a judgeNote`);
    assert.ok(["authored", "captured"].includes(c.recording.source));
  }
});

for (const c of cases) {
  test(`eval ${c.id}: ${c.name}`, async () => {
    const provider = fakeProvider({ generateReplies: [c.recording.reply] });
    const result = await detectCardTodos(provider, { thread: threadOf(c.thread), since: c.since });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.todos.map((t) => ({ messageTs: t.messageTs, assignee: t.assignee, what: t.what })), c.expect.todos);
    // Every case carries card words, so each asks the model once.
    assert.equal(provider.generated.length, 1);
    assert.equal(provider.generated[0]!.tier, "chill");
  });
}

test("a thread with no card words costs no model call", async () => {
  const provider = fakeProvider({ generateReplies: [] });
  const thread = threadOf([{ ts: "200.1", user: "U0MAYA", text: "I'll share the Figma link by Thu." }]);
  assert.equal(mayHoldCardTodo(thread.messages, "100"), false);
  const result = await detectCardTodos(provider, { thread, since: "100" });
  assert.deepEqual(result, { ok: true, todos: [] });
  assert.equal(provider.generated.length, 0);
});

test("the parse refuses an old message, an assignee the thread never shows, and a low confidence", () => {
  const shown: SweepMessage[] = [
    { ts: "100.1", user: "U0BEA", text: "old: make a card for X" },
    { ts: "200.1", user: "U0BEA", text: "create a card for the filters" },
  ];
  const entry = (over: Record<string, unknown>) =>
    JSON.stringify({ todos: [{ message_ts: "200.1", assignee: "U0BEA", what: "the filters", confidence: 0.9, ...over }] });
  assert.equal(parseCardTodoReply(entry({ message_ts: "100.1" }), shown, "150").length, 0);
  assert.equal(parseCardTodoReply(entry({ assignee: "U0GHOST" }), shown, "150")[0]!.assignee, null);
  assert.equal(parseCardTodoReply(entry({ confidence: 0.5 }), shown, "150").length, 0);
  assert.equal(parseCardTodoReply(entry({ what: "<@U0X>" }), shown, "150").length, 0);
  assert.equal(parseCardTodoReply("not json", shown, "150").length, 0);
});
