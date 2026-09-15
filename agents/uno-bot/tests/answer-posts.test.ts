// The case, #560: a four-document plan was read twice and approved from a
// remnant, because `postAnswer` cut the body at 3,900 characters and left
// "…truncated — ask me for the rest." in its place. A long answer is now split
// into continuation messages in the same thread, so what these tests guard is
// that nothing is lost, the pieces arrive in order, and a short answer still
// posts exactly as it always did.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  answerMessages,
  deliverAnswer,
  MAX_POST_CHARS,
  type AnswerTransport,
} from "../src/slack/answer-posts";
import { renderDeliveredBody } from "../src/slack/render";

/** A body of `count` distinct paragraphs, each roughly `size` characters. */
function paragraphs(count: number, size: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const head = `Paragraph ${i}: `;
    return head + "word ".repeat(Math.ceil((size - head.length) / 5)).trimEnd();
  });
}

describe("a short answer", () => {
  it("is one message, byte for byte what it was", () => {
    const body = paragraphs(10, 300).join("\n\n");
    assert.ok(body.length > 2900 && body.length < MAX_POST_CHARS);
    assert.deepEqual(answerMessages(body), [body]);
  });

  it("carries no numbering when it is the only message", () => {
    assert.deepEqual(answerMessages("Got it — cancelled."), ["Got it — cancelled."]);
  });
});

describe("a 10,000-character answer", () => {
  const source = paragraphs(50, 200);
  const body = source.join("\n\n");
  const messages = answerMessages(body);

  it("becomes several messages", () => {
    assert.ok(body.length > 10_000, `body was ${body.length} chars`);
    assert.ok(messages.length > 1, "a 10k body posted as one message");
  });

  it("keeps every message under the limit", () => {
    for (const [i, m] of messages.entries()) {
      assert.ok(m.length <= MAX_POST_CHARS, `message ${i} is ${m.length} chars`);
    }
  });

  it("numbers them (i/n), in order", () => {
    messages.forEach((m, i) => {
      assert.ok(
        m.startsWith(`_(${i + 1}/${messages.length})_\n\n`),
        `message ${i} opened with ${JSON.stringify(m.slice(0, 20))}`,
      );
    });
  });

  it("loses nothing and reorders nothing", () => {
    const rejoined = messages.map((m) => m.replace(/^_\(\d+\/\d+\)_\n\n/, "")).join("\n\n");
    assert.equal(rejoined, body);
  });

  it("leaves every paragraph whole, in exactly one message", () => {
    for (const paragraph of source) {
      const holders = messages.filter((m) => m.includes(paragraph));
      assert.equal(holders.length, 1, `paragraph ${JSON.stringify(paragraph.slice(0, 24))} was cut`);
    }
  });
});

describe("a paragraph too long to fit a message", () => {
  it("is cut at a sentence boundary, not mid-clause", () => {
    const sentence = `${"filler ".repeat(30)}end.`;
    const messages = answerMessages(Array.from({ length: 60 }, () => sentence).join(" "));
    assert.ok(messages.length > 1);
    for (const m of messages) {
      assert.ok(m.length <= MAX_POST_CHARS);
      assert.ok(m.trimEnd().endsWith("end."), `message ended mid-sentence: …${m.slice(-40)}`);
    }
  });

  it("never leaves a code fence open", () => {
    const body = ["```sql", "SELECT 1;".repeat(600), "```"].join("\n");
    for (const m of answerMessages(body)) {
      const fences = m.split("\n").filter((l) => /^\s*```/.test(l)).length;
      assert.equal(fences % 2, 0, `unclosed fence in:\n${m.slice(0, 80)}`);
    }
  });
});

describe("the truncation notice", () => {
  it("is gone — a long body comes back whole", () => {
    const body = paragraphs(60, 200).join("\n\n");
    const delivered = renderDeliveredBody(body);
    assert.ok(!delivered.includes("truncated"), "the truncation notice is still being appended");
    assert.equal(delivered, body);
  });
});

/** Records what a transport was asked to send, in the order it was asked. */
function recordingTransport(streamOn: boolean) {
  const sent: Array<{ via: "stream" | "post"; text: string; withFooter: boolean }> = [];
  const transport: AnswerTransport = {
    async stream(text, withFooter) {
      if (!streamOn) return false;
      sent.push({ via: "stream", text, withFooter });
      return true;
    },
    async post(text, withFooter) {
      sent.push({ via: "post", text, withFooter });
      return true;
    },
  };
  return { sent, transport };
}

describe("delivering the pieces", () => {
  const messages = answerMessages(paragraphs(50, 200).join("\n\n"));

  it("posts N messages in order, in the thread", async () => {
    const { sent, transport } = recordingTransport(false);
    assert.equal(await deliverAnswer(messages, transport), true);
    assert.deepEqual(
      sent.map((s) => s.text),
      messages,
    );
  });

  it("streams the first piece and posts the continuations", async () => {
    const { sent, transport } = recordingTransport(true);
    await deliverAnswer(messages, transport);
    assert.equal(sent[0]!.via, "stream");
    assert.ok(sent.slice(1).every((s) => s.via === "post"));
    assert.equal(sent.length, messages.length);
  });

  it("puts the footer on the last message only", async () => {
    const { sent, transport } = recordingTransport(true);
    await deliverAnswer(messages, transport);
    assert.deepEqual(
      sent.map((s) => s.withFooter),
      sent.map((_, i) => i === sent.length - 1),
    );
  });

  it("falls back to a plain post when the stream declines", async () => {
    const { sent, transport } = recordingTransport(false);
    await deliverAnswer(["only one"], transport);
    assert.deepEqual(sent, [{ via: "post", text: "only one", withFooter: true }]);
  });

  it("reports failure when a continuation does not post", async () => {
    const failing: AnswerTransport = {
      async stream() {
        return false;
      },
      async post(_text, withFooter) {
        return !withFooter;
      },
    };
    assert.equal(await deliverAnswer(messages, failing), false);
  });
});
