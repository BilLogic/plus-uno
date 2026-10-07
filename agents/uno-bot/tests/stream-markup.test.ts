// What a stream sends as `markdown_text`, through the real stream senders over
// a stubbed fetch.
//
// Posted text blanks on `<…>` markup Slack cannot parse (live 2026-09-22), and
// Slack does not document whether `markdown_text` does the same, so the stream
// takes the same pass. A stream arrives in appends, and a token can straddle
// two of them: joined, what the senders send must equal the one-shot pass over
// the whole text, wherever the cuts fall.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { test } from "node:test";
import assert from "node:assert/strict";

let sent: Array<{ method: string; body: Record<string, unknown> }> = [];
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const method = String(input).replace("https://slack.com/api/", "");
  sent.push({ method, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
  return new Response(JSON.stringify({ ok: true, ts: "1.0" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

type Env = import("../src/types").Env;
const ENV = { SLACK_BOT_TOKEN: "xoxb-test" } as Env;

let streamCount = 0;

/** Open a stream, append `chunks` in order, close it; return every text sent. */
async function streamed(chunks: string[], blocks?: Array<Record<string, unknown>>): Promise<string[]> {
  const { startStream, appendStream, stopStream } = await import("../src/slack/api.js");
  sent = [];
  const ts = await startStream(ENV, "D0123", "1.0", "U0A8JFHQPU2", "T0123");
  assert.equal(ts, "1.0");
  // A distinct ts per stream, so no stream's held tail leaks into the next.
  const streamTs = `9.${++streamCount}`;
  for (const chunk of chunks) assert.equal(await appendStream(ENV, "D0123", streamTs, chunk), true);
  assert.equal(await stopStream(ENV, "D0123", streamTs, blocks), true);
  assert.equal(sent[0]!.method, "chat.startStream");
  assert.equal(sent[0]!.body.markdown_text, undefined, "startStream carries no text");
  return sent
    .filter((s) => typeof s.body.markdown_text === "string")
    .map((s) => String(s.body.markdown_text));
}

const REPRO = [
  "Heads up — the mention strip is back:",
  "```",
  "Other user mentions (`<@U...>` tokens) should be preserved.",
  "the `<@teammate>` token is missing",
  "```",
  "> quoted, and <@U0A8JFHQPU2> should see <https://x|the PRD> & more",
].join("\n");

test("a streamed body takes the posted-text markup pass", async () => {
  const { sanitizeSlackMarkup } = await import("../src/slack/mrkdwn.js");
  const texts = await streamed([REPRO]);
  assert.deepEqual(texts, [sanitizeSlackMarkup(REPRO)]);
  const text = texts[0]!;
  assert.ok(text.includes("`&lt;@teammate&gt;`"), text);
  assert.ok(text.includes("`&lt;@U...&gt;`"), text);
  assert.ok(text.includes("<@U0A8JFHQPU2>"), text);
  assert.ok(text.includes("<https://x|the PRD> &amp; more"), text);
  assert.ok(text.includes("\n> quoted"), "the quote marker stays");
});

test("`<@team` in one append and `mate>` in the next are one token, escaped once", async () => {
  const texts = await streamed(["the `<@team", "mate>` token"]);
  assert.deepEqual(texts, ["the `", "&lt;@teammate&gt;` token"]);
});

test("a valid mention split across appends still mentions", async () => {
  const texts = await streamed(["ask <@U0A8", "JFHQPU2> first"]);
  assert.equal(texts.join(""), "ask <@U0A8JFHQPU2> first");
});

test("an append that is all held tail sends nothing, and the close sends it escaped", async () => {
  const texts = await streamed(["done ", "<@team"]);
  assert.deepEqual(texts, ["done ", "&lt;@team"]);
  const close = sent.at(-1)!;
  assert.equal(close.method, "chat.stopStream");
  assert.equal(close.body.markdown_text, "&lt;@team");
  // The empty append never reached Slack.
  assert.equal(sent.filter((s) => s.method === "chat.appendStream").length, 1);
});

test("a close with nothing held sends no text, and its blocks still pass", async () => {
  const footer = [{ type: "context", elements: [{ type: "mrkdwn", text: "check <@teammate>" }] }];
  await streamed(["all clear"], footer);
  const close = sent.at(-1)!;
  assert.equal(close.body.markdown_text, undefined);
  assert.deepEqual(close.body.blocks, [
    { type: "context", elements: [{ type: "mrkdwn", text: "check &lt;@teammate&gt;" }] },
  ]);
});

test("joined, the appends equal the one-shot pass wherever the cuts fall", async () => {
  const { sanitizeSlackMarkup } = await import("../src/slack/mrkdwn.js");
  const bodies = [
    REPRO,
    "a &amp; b &lt;3 &am c\n>>> quote\nx > y <#C0APTB20SK0> <!here> <mailto:b@x.y|B>",
    "<a<b> <@U0A8JFHQPU2|bill> <!date^1392734382^{date_short}|Feb 18> &",
  ];
  for (const body of bodies) {
    const whole = sanitizeSlackMarkup(body);
    for (let i = 0; i <= body.length; i++) {
      assert.equal((await streamed([body.slice(0, i), body.slice(i)])).join(""), whole, `cut at ${i}`);
    }
    for (let i = 1; i < body.length; i += 3) {
      const parts = [body.slice(0, i), body.slice(i, i + 2), body.slice(i + 2, i + 5), body.slice(i + 5)];
      assert.equal((await streamed(parts)).join(""), whole, `cuts at ${i}`);
    }
  }
});

test("streamed text already escaped passes unchanged", async () => {
  const text = "fish &amp; chips &lt;3 and `&lt;@teammate&gt;`";
  assert.deepEqual(await streamed([text]), [text]);
});

test("neither streaming flag turns on without a recorded probe PASS", async () => {
  const { postingDeps, streamFlagOn } = await import("../src/slack/slack-delivery.js");
  const warn = console.warn;
  const warnings: string[] = [];
  console.warn = (msg: string) => void warnings.push(msg);
  try {
    const on = { SLACK_STREAMING: "on", SLACK_STREAM_PLAN: "on" } as Env;
    for (const probe of [undefined, "", "yes", "fail:2026-10-01 blank", "2026-10-01 renders", "pass:soon"]) {
      const env = { ...on, SLACK_STREAM_MARKUP_PROBE: probe } as Env;
      assert.equal(postingDeps(env).streamingOn, false, String(probe));
      assert.equal(streamFlagOn(env, "SLACK_STREAM_PLAN"), false, String(probe));
    }
    // Once per flag per isolate, not once per turn.
    assert.equal(warnings.length, 2);
    assert.match(warnings[0]!, /SLACK_STREAMING.*pass:YYYY-MM-DD/);
    assert.match(warnings[1]!, /SLACK_STREAM_PLAN/);

    for (const probe of ["pass:2026-10-01", " pass:2026-10-01 fence shows &lt; ", "pass:2026-10-01\tok"]) {
      const env = { ...on, SLACK_STREAM_MARKUP_PROBE: probe } as Env;
      assert.equal(postingDeps(env).streamingOn, true, probe);
      assert.equal(streamFlagOn(env, "SLACK_STREAM_PLAN"), true, probe);
    }

    const off = { SLACK_STREAMING: "off", SLACK_STREAM_MARKUP_PROBE: "pass:2026-10-01" } as Env;
    assert.equal(postingDeps(off).streamingOn, false);
    assert.equal(warnings.length, 2, "an off flag says nothing");
  } finally {
    console.warn = warn;
  }
});

test("a task card's text goes as plain text, as handed, within the chunk limit", async () => {
  // Slack shows a card's title, details, output and a source's name unparsed,
  // so the client sends them as the adapter passed them (`toPlainText`) and
  // only cuts: the mrkdwn escaper here put a visible `&amp;` on a source.
  const { appendTasks } = await import("../src/slack/api.js");
  sent = [];
  await appendTasks(ENV, "D0123", "9.0", [
    { id: "t0", title: "Searching Notion", status: "error", output: "502 from api " + "z".repeat(300) },
    { id: "t1", title: "Searching Slack", status: "in_progress", details: "R&D notes" },
  ]);
  // Closing one card and opening the next travel as two chunks of ONE call.
  assert.equal(sent.length, 1);
  const pair = sent[0]!.body.chunks as Array<Record<string, unknown>>;
  assert.deepEqual(pair.map((c) => `${c.id}:${c.status}`), ["t0:error", "t1:in_progress"]);
  const output = String(pair[0]!.output);
  assert.ok(output.startsWith("502 from api z"), output);
  assert.equal(output.length, 250);
  assert.equal(pair[1]!.details, "R&D notes", "an ampersand is a character, not an entity");

  // A card's sources go as Slack's url sources: each name as handed, within
  // the same limit, and the link as it came.
  sent = [];
  const url = "https://www.notion.so/Recap-1?a=1&b=2";
  await appendTasks(ENV, "D0123", "9.0", [
    { id: "t4", title: "t", status: "complete", output: "2 pages", sources: [{ text: "R&D notes" + "w".repeat(300), url }] },
  ]);
  const withSources = (sent[0]!.body.chunks as Array<Record<string, unknown>>)[0]!;
  assert.equal(withSources.output, "2 pages");
  const [source] = withSources.sources as Array<{ type: string; text: string; url: string }>;
  assert.equal(source!.type, "url");
  assert.equal(source!.url, url);
  assert.ok(source!.text.startsWith("R&D notes"), source!.text);
  assert.ok(source!.text.length <= 250, String(source!.text.length));
});

test("the markup probe streams raw text only to a DM or the alert channel, and only so much", async () => {
  const { slackStreamProbe, PROBE_TEXT_LIMIT } = await import("../src/diagnostics/probes/slack.js");
  const probe = async (q: string) => {
    const url = `https://w/debug/slack-stream?${q}`;
    const report = await slackStreamProbe(ENV, new URL(url), new Request(url));
    assert.ok("body" in report);
    return report as { body: Record<string, unknown>; status?: number };
  };
  const base = "thread_ts=1.0&user=U0A8JFHQPU2&team=T0123";

  sent = [];
  let res = await probe(`channel=C0PUBLIC1&${base}&text=hi`);
  assert.equal(res.status, 400);
  assert.match(String((res.body as { error: string }).error), /DM \(D…\) or the alert channel/);
  res = await probe(`channel=D0123&${base}&text=${"x".repeat(PROBE_TEXT_LIMIT + 1)}`);
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0, "a refused probe calls nothing");

  res = await probe(`channel=D0123&${base}&text=${encodeURIComponent("a <@teammate>\n```\n<@teammate>\n```")}`);
  assert.equal((res.body as { appended: boolean }).appended, true);
  assert.deepEqual(sent.map((s) => s.method), ["chat.startStream", "chat.appendStream", "chat.stopStream"]);
  assert.equal(sent[1]!.body.markdown_text, "a <@teammate>\n```\n<@teammate>\n```", "raw, on purpose");

  // The alert channel is the one non-DM target.
  sent = [];
  res = await probe(`channel=C0ARJ2A3A69&${base}&text=hi`);
  assert.equal((res.body as { appended: boolean }).appended, true);
});

test("a task card's logo goes as Slack's icon object, and a card without one sends no icon", async () => {
  const { appendTasks } = await import("../src/slack/api.js");
  const logo = "https://plus-uno.netlify.app/uno-bot/estate-logos/github.png";
  sent = [];
  await appendTasks(ENV, "D0123", "9.0", [
    { id: "t1", title: "Reading GitHub", status: "in_progress", icon: logo },
    { id: "t2", title: "Setting your reminder", status: "in_progress" },
  ]);
  const [withLogo, without] = sent[0]!.body.chunks as Array<Record<string, unknown>>;
  assert.deepEqual(withLogo!.icon, { type: "icon", name: logo });
  assert.equal("icon" in without!, false);
});
