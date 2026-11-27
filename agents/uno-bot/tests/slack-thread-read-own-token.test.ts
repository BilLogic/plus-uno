// slack_thread_read falls back to the requester's own token in their own bot DM
// (ADR-020). The bot token is tried first; only a refusal that means "the bot
// cannot see that conversation" retries, and only where slack_search would use
// the same own token: the requester's own DM, not a public-only turn.
//
// `net.ts` binds `fetch` at first evaluation, so the stub goes on `globalThis`
// here and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

let route: typeof fetch = async () => Response.json({ ok: false, error: "no stub" });
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => route(input, init)) as typeof fetch;

const LINK = "https://plus.slack.com/archives/GPRIVATE1/p1700000000000100";
const OWN_DM = "D0OWNDM01";

/** Slack, stubbed: the bot token is refused with `botError`; the own token reads. */
function stubSlack(botError = "channel_not_found"): string[] {
  const auths: string[] = [];
  route = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const auth = String((init?.headers as Record<string, string> | undefined)?.authorization ?? "");
    if (!String(input).includes("conversations.replies")) return Response.json({ ok: false, error: "unexpected" });
    auths.push(auth);
    if (auth.includes("xoxb-bot")) return Response.json({ ok: false, error: botError });
    return Response.json({ ok: true, messages: [{ user: "U1", ts: "1700000000.000100", text: "private plan" }] });
  }) as typeof fetch;
  return auths;
}

function env(opts: { ownToken?: boolean } = { ownToken: true }): Env {
  const kv = new Map<string, string>();
  if (opts.ownToken) kv.set("slack_oauth_token:user:U0REQ001", JSON.stringify({ access_token: "xoxp-own-test" }));
  return {
    SLACK_BOT_TOKEN: "xoxb-bot",
    SLACK_MCP_CLIENT_ID: "id",
    SLACK_MCP_CLIENT_SECRET: "secret",
    SLACK_OAUTH_REDIRECT_URI: "https://worker.example/oauth/slack/callback",
    SLACK_OAUTH_KV: { get: async (k: string) => kv.get(k) ?? null, put: async () => {} } as unknown as KVNamespace,
  } as unknown as Env;
}

const dm = { channel: OWN_DM, userMsgTs: "1700000000.000200", requestedBy: "U0REQ001" };
const read = async (e: Env, slack: Parameters<(typeof import("../src/tools/slack-thread-read.js"))["executeSlackThreadRead"]>[2]) =>
  (await import("../src/tools/slack-thread-read.js")).executeSlackThreadRead(e, { link: LINK }, slack);

describe("slack_thread_read own-token retry", () => {
  for (const error of ["not_in_channel", "channel_not_found", "missing_scope"]) {
    it(`retries on the requester's own token in their own DM after the bot gets ${error}`, async () => {
      const auths = stubSlack(error);
      const out = await read(env(), dm);
      assert.match(out, /"ok":true/);
      assert.match(out, /private plan/);
      assert.deepEqual(auths.map((a) => a.replace("Bearer ", "")), ["xoxb-bot", "xoxp-own-test"]);
    });
  }

  it("does not retry on an unrelated refusal", async () => {
    const auths = stubSlack("ratelimited");
    const out = await read(env(), dm);
    assert.match(out, /"ok":false/);
    assert.equal(auths.length, 1);
  });

  it("stays on the bot token in a channel turn", async () => {
    const auths = stubSlack();
    const out = await read(env(), { ...dm, channel: "CDESIGN1" });
    assert.match(out, /"ok":false/);
    assert.doesNotMatch(out, /private plan/);
    assert.deepEqual(auths, ["Bearer xoxb-bot"]);
  });

  it("never retries on a public-only turn", async () => {
    const auths = stubSlack();
    const out = await read(env(), { ...dm, publicOnly: true });
    assert.doesNotMatch(out, /private plan/);
    assert.ok(auths.every((a) => a.includes("xoxb-bot")), auths.join());
  });

  it("stays refused when the requester has stored no token", async () => {
    const auths = stubSlack();
    const out = await read(env({ ownToken: false }), dm);
    assert.match(out, /"ok":false/);
    assert.doesNotMatch(out, /private plan/);
    assert.deepEqual(auths, ["Bearer xoxb-bot"]);
  });

  it("says neither token could read the thread when the own-token retry fails too", async () => {
    route = (async (input: RequestInfo | URL) => {
      if (!String(input).includes("conversations.replies")) return Response.json({ ok: false, error: "unexpected" });
      return Response.json({ ok: false, error: "channel_not_found" });
    }) as typeof fetch;
    const out = JSON.parse(await read(env(), dm)) as { ok: boolean; note?: string };
    assert.equal(out.ok, false);
    assert.match(out.note ?? "", /neither the bot nor your own token/i);
    assert.doesNotMatch(out.note ?? "", /invited first/);
  });

  it("keeps the invite-the-bot note when no retry ran", async () => {
    stubSlack();
    const out = JSON.parse(await read(env({ ownToken: false }), dm)) as { note?: string };
    assert.match(out.note ?? "", /invited first/);
  });
});
