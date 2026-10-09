import { test } from "node:test";
import assert from "node:assert/strict";
import { runTurn } from "../src/turn/index";
import { harness, request } from "./helpers/turn-harness";

const URL = "https://www.figma.com/design/AbC123xyz/Sessions?node-id=158-21725";
const FRESHNESS = "I read the comment thread on the linked Figma frame just now, so this transcript is current.";

test("a pasted-frame answer uses the retrieved title and leaves freshness to Sources, after judge revision too", async () => {
  for (const answer of [
    `On [node 158-21725](${URL}), Coco said “Use Join.”\n\n${FRESHNESS}`,
    `On <${URL}|node 158-21725>, Coco said “Use Join.” ${FRESHNESS}`,
  ]) {
    const h = harness({
      replies: [{ toolCalls: [{ name: "source_read", args: { url: URL } }] }, { text: answer }],
      toolResult: JSON.stringify({ ok: true, source_type: "figma", url: URL, title: "Session & join card", content: "Join", comments: [] }),
      judge: () => ({ text: answer, verdict: "ok" }),
    });
    await runTurn(request({ text: `${URL} what does this comment say?` }), h.deps);
    const posted = h.delivery.calls.find((c) => c.kind === "answer");
    assert.ok(posted?.kind === "answer");
    assert.match(posted.text, /Session (?:&|&amp;) join card/);
    assert.doesNotMatch(posted.text, /node 158-21725|just now|transcript is current/);
    assert.match(posted.text, /Coco said “Use Join.”/);
  }
});

test("a quoted comment about freshness remains intact", async () => {
  const answer = `Coco wrote: “${FRESHNESS}”`;
  const h = harness({ replies: [{ toolCalls: [{ name: "source_read", args: { url: URL } }] }, { text: answer }], toolResult: JSON.stringify({ ok: true, source_type: "figma", url: URL, title: "Session card", content: "Join" }) });
  await runTurn(request({ text: `${URL} what does this comment say?` }), h.deps);
  const posted = h.delivery.calls.find((c) => c.kind === "answer");
  assert.ok(posted?.kind === "answer");
  assert.match(posted.text, /Coco wrote: “I read/);
});
