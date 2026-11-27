// slack_channel_read at its executor seam, Slack's API stubbed: a public
// channel reads, an allowlisted private one reads, an unlisted private one,
// a DM and a group DM are refused, and a `publicOnly` turn reads public only.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

const PUBLIC = "CPUBLIC1";
const LISTED = "CLISTED01";
const PRIVATE = "CPRIVATE1";
const DM = "DDIRECT01";
const MPIM = "GGROUPDM1";
let route: typeof fetch = async () => Response.json({ ok: false, error: "no stub" });
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => route(input, init)) as typeof fetch;

const read = async () => (await import("../src/tools/slack-channel-read.js")).executeSlackChannelRead;

function stubSlack(): string[] {
  const urls: string[] = [];
  route = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const channel = new URL(url).searchParams.get("channel");
    if (url.includes("conversations.info")) {
      return Response.json({
        ok: true,
        channel: { id: channel, is_private: channel !== PUBLIC, is_im: channel === DM, is_mpim: channel === MPIM },
      });
    }
    if (url.includes("conversations.history")) {
      // Slack answers newest-first.
      return Response.json({
        ok: true,
        messages: [
          { user: "U2", ts: "1700000002.000100", text: "second" },
          { subtype: "channel_join", user: "U9", ts: "1700000001.500000", text: "joined" },
          { user: "U1", ts: "1700000001.000100", text: "first" },
          { bot_id: "B1", ts: "1700000000.000100" },
        ],
      });
    }
    return Response.json({ ok: false, error: "unexpected" });
  }) as typeof fetch;
  return urls;
}

const env = () =>
  ({ SLACK_BOT_TOKEN: "xoxb-test", SLACK_SEARCH_PRIVATE_ALLOWLIST: ` ${LISTED}, ` }) as unknown as Env;

describe("slack_channel_read", () => {
  it("returns a public channel's text messages oldest-first, shaped like slack_thread_read", async () => {
    stubSlack();
    const out = JSON.parse(await (await read())(env(), { channel: PUBLIC, limit: 10 }));
    assert.equal(out.ok, true);
    assert.equal(out.channel, PUBLIC);
    assert.equal(out.count, 2);
    assert.deepEqual(out.messages, [
      { author: "U1", ts: "1700000001.000100", text: "first" },
      { author: "U2", ts: "1700000002.000100", text: "second" },
    ]);
  });

  it("caps the limit at 50", async () => {
    const urls = stubSlack();
    await (await read())(env(), { channel: PUBLIC, limit: 500 });
    const history = urls.find((u) => u.includes("conversations.history"))!;
    assert.equal(new URL(history).searchParams.get("limit"), "50");
  });

  it("reads a private channel only when its id is allowlisted", async () => {
    stubSlack();
    const ok = JSON.parse(await (await read())(env(), { channel: LISTED }));
    assert.equal(ok.ok, true);
    const no = JSON.parse(await (await read())(env(), { channel: PRIVATE }));
    assert.equal(no.ok, false);
    assert.doesNotMatch(JSON.stringify(no), /first|second/);
  });

  it("refuses a DM and a group DM", async () => {
    const urls = stubSlack();
    for (const channel of [DM, MPIM]) {
      const out = JSON.parse(await (await read())(env(), { channel }));
      assert.equal(out.ok, false);
    }
    assert.ok(urls.every((u) => !u.includes("conversations.history")));
  });

  it("on a publicOnly turn refuses even an allowlisted private channel", async () => {
    const urls = stubSlack();
    const run = await read();
    const out = JSON.parse(await run(env(), { channel: LISTED }, { publicOnly: true }));
    assert.equal(out.ok, false);
    assert.ok(urls.every((u) => !u.includes("conversations.history")));
    const pub = JSON.parse(await run(env(), { channel: PUBLIC }, { publicOnly: true }));
    assert.equal(pub.ok, true);
  });

  it("surfaces a Slack failure instead of an empty read", async () => {
    route = (async (input: RequestInfo | URL) =>
      String(input).includes("conversations.info")
        ? Response.json({ ok: true, channel: { id: PUBLIC, is_private: false } })
        : Response.json({ ok: false, error: "not_in_channel" })) as typeof fetch;
    const out = JSON.parse(await (await read())(env(), { channel: PUBLIC }));
    assert.equal(out.ok, false);
    assert.match(out.error, /not_in_channel/);
  });
});
