// What `chat.postMessage` is handed as `text`, through the real post pipeline
// over a stubbed fetch.
//
// Slack drops the WHOLE text of a message that carries markup it cannot parse:
// live 2026-09-22, a relayed DM whose body quoted `<@U...>` and `<@teammate>`
// inside a code fence posted with empty text — the attribution line above the
// body vanished with it — and the same relay without those tokens posted in
// full. The 2026-09-21 failure note that went out blank was the same thing.
// So valid markup must pass byte for byte and everything else is escaped.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { test } from "node:test";
import assert from "node:assert/strict";

let sent: Array<Record<string, unknown>> = [];
globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
  return new Response(JSON.stringify({ ok: true, ts: "1.0" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

type Env = import("../src/types").Env;
const ENV = { SLACK_BOT_TOKEN: "xoxb-test" } as Env;

async function posted(text: string): Promise<string> {
  const { postMessage } = await import("../src/slack/api.js");
  sent = [];
  await postMessage(ENV, { channel: "D0123", text });
  assert.equal(sent.length, 1);
  return String(sent[0]!.text);
}

/** Every `<…>` left in a posted text — each must be markup Slack can parse. */
function tokens(text: string): string[] {
  return text.match(/<[^<>]*>/g) ?? [];
}

const VALID = [
  "<@U0A8JFHQPU2>",
  "<@W0A8JFHQPU2|bill>",
  "<#C123|c>",
  "<#C0APTB20SK0>",
  "<!here>",
  "<!channel>",
  "<!everyone>",
  "<!subteam^S0123ABCD>",
  "<!date^1392734382^{date_short}|Feb 18, 2014>",
  "<https://x|y>",
  "<https://github.com/BilLogic/plus-uno/issues/702>",
  "<mailto:bill@example.com|Bill>",
];

// The live repro's shape: a relay body with a fence quoting invalid mentions.
const REPRO_BODY = [
  "Heads up — the mention strip is back:",
  "```",
  "Other user mentions (`<@U...>` tokens) should be preserved.",
  "the `<@teammate>` token is missing",
  "```",
].join("\n");

// The 2026-09-21 failure note's shape: inline code, no fence of its own.
const INCIDENT_BODY =
  "Other user mentions (`<@U...>` tokens) should be preserved, and a -> b & c < d.";

test("valid Slack markup survives the post byte for byte", async () => {
  for (const markup of VALID) {
    const text = `before ${markup} after`;
    assert.equal(await posted(text), text, markup);
  }
});

test("the live repro's relay body posts with no invalid markup, its fence intact", async () => {
  const { renderRelayedDm } = await import("../src/tools/relayed-dm-render.js");
  const text = await posted(
    renderRelayedDm({
      requesterId: "U03FYQJRQHX",
      text: REPRO_BODY,
      permalink: "https://devoli.slack.com/archives/D0APTB20SK0/p1790090039134069",
      originIsDm: true,
    }),
  );
  // Only the attribution mentions and the permalink are markup; all survive.
  assert.deepEqual(tokens(text), [
    "<@U03FYQJRQHX>",
    "<@U03FYQJRQHX>",
    "<https://devoli.slack.com/archives/D0APTB20SK0/p1790090039134069|the request>",
  ]);
  assert.ok(text.startsWith("<@U03FYQJRQHX> asked me to pass this on:"), text);
  assert.ok(text.includes("`&lt;@U...&gt;`"), text);
  assert.ok(text.includes("`&lt;@teammate&gt;`"), text);
  assert.equal(text.match(/```/g)?.length, 2, "the fence is intact");
});

test("the incident's draft line is escaped, and nothing is escaped twice", async () => {
  const text = await posted(INCIDENT_BODY);
  assert.deepEqual(tokens(text), []);
  assert.equal(
    text,
    "Other user mentions (`&lt;@U...&gt;` tokens) should be preserved, and a -&gt; b &amp; c &lt; d.",
  );
  // Already escaped text passes unchanged — the pass is idempotent.
  assert.equal(await posted(text), text);
  assert.equal(await posted("fish &amp; chips &lt;3"), "fish &amp; chips &lt;3");
});

test("a relay body that names a real person still mentions them", async () => {
  const { renderRelayedDm } = await import("../src/tools/relayed-dm-render.js");
  const text = await posted(
    renderRelayedDm({
      requesterId: "U03FYQJRQHX",
      text: "Can <@U0A8JFHQPU2> look at <https://x|the PRD> before Friday?",
      permalink: null,
      originIsDm: false,
    }),
  );
  assert.ok(text.includes("Can <@U0A8JFHQPU2> look at <https://x|the PRD> before Friday?"), text);
});

test("a link label carrying an ampersand is made safe without breaking the link", async () => {
  assert.equal(await posted("<https://x|Q&A notes>"), "<https://x|Q&amp;A notes>");
});

test("the model's Markdown link becomes a valid link that survives", async () => {
  assert.equal(await posted("see [the card](https://x.test/a)"), "see <https://x.test/a|the card>");
});

// ── id length, DMs, dates, quotes, blocks, response_url ──────────────────────

test("a mention id needs six characters after its U or W — the share-out's own rule", async () => {
  assert.equal(await posted("<@U0A8JFH>"), "<@U0A8JFH>");
  assert.equal(await posted("<@U0A8JF>"), "&lt;@U0A8JF&gt;");
  const { renderReviewer } = await import("../src/tools/share-out-render.js");
  assert.equal(renderReviewer("U0A8JFH"), "<@U0A8JFH>", "what the share-out mentions, the pass keeps");
  assert.equal(renderReviewer("U0A8JF"), "U0A8JF");
});

test("a DM link the Worker builds itself survives, and so does a labelled channel", async () => {
  assert.equal(await posted("thread in <#D0APTB20SK0>"), "thread in <#D0APTB20SK0>");
  assert.equal(await posted("see <#C0APTB20SK0|uno-bot>"), "see <#C0APTB20SK0|uno-bot>");
});

test("a date token survives with or without its fallback label", async () => {
  assert.equal(await posted("<!date^1392734382^{date_short}>"), "<!date^1392734382^{date_short}>");
});

test("a quote marker opening a line stays a quote; a `>` mid-line is escaped", async () => {
  assert.equal(await posted("> quoted\n>>> the rest\na > b"), "> quoted\n>>> the rest\na &gt; b");
});

test("a section block's mrkdwn is sanitised, its valid mention kept, its plain_text untouched", async () => {
  const { postMessage } = await import("../src/slack/api.js");
  const { textSections } = await import("../src/slack/render.js");
  sent = [];
  const body = "Ask <@U0A8JFHQPU2>: the `<@teammate>` token is gone";
  await postMessage(ENV, {
    channel: "D0123",
    text: body,
    blocks: [
      ...textSections(body),
      { type: "header", text: { type: "plain_text", text: "a <b> header" } },
    ],
  });
  const blocks = JSON.stringify(sent[0]!.blocks);
  assert.ok(blocks.includes("Ask <@U0A8JFHQPU2>: the `&lt;@teammate&gt;` token is gone"), blocks);
  assert.ok(blocks.includes('"text":"a <b> header"'), blocks);
  assert.equal(sent[0]!.text, "Ask <@U0A8JFHQPU2>: the `&lt;@teammate&gt;` token is gone");
});

test("a card replaced over response_url is sanitised, text and blocks", async () => {
  const { postToResponseUrl } = await import("../src/slack/api.js");
  const { proposalCardBlocks } = await import("../src/slack/proposal-render.js");
  sent = [];
  const text = "About to relay: `<@teammate>` should see <https://x|this>";
  await postToResponseUrl("https://hooks.slack.test/actions/1", {
    replace_original: true,
    text,
    blocks: proposalCardBlocks(text, ":white_check_mark: Approved by <@U03FYQJRQHX>"),
  });
  const wire = JSON.stringify(sent[0]);
  assert.doesNotMatch(wire, /<@teammate>/, wire);
  assert.ok(wire.includes("<https://x|this>"), wire);
  assert.ok(wire.includes("Approved by <@U03FYQJRQHX>"), wire);
  assert.equal(sent[0]!.replace_original, true);
});
