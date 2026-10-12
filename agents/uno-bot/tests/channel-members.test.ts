// Who may decide a Worker-posted card: a channel's members, or, for a card
// posted into a 1:1 DM, the deployment's standing confirmers — Slack will not
// list a DM's members and the bot holds no `im:read` to ask who it is with.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  const channel = new URL(url).searchParams.get("channel");
  if (url.includes("conversations.members")) {
    if (channel?.startsWith("D")) return Response.json({ ok: false, error: "method_not_supported_for_channel_type" });
    return Response.json({ ok: true, members: ["U1", "U2"] });
  }
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

const members = async (env: Env, channel: string) => (await import("../src/slack/channel-members.js")).channelMembers(env, channel);

const env = { SLACK_BOT_TOKEN: "xoxb-test", STANDING_CONFIRMER_IDS: "U03FYQJRQHX,U09E652SJ02" } as unknown as Env;

describe("channelMembers", () => {
  it("lists a channel's members", async () => {
    assert.deepEqual(await members(env, "C0DESIGN"), ["U1", "U2"]);
  });

  it("gives a 1:1 DM's card to the standing confirmers, since Slack will not list a DM's members", async () => {
    assert.deepEqual(await members(env, "D0APTB20SK0"), ["U03FYQJRQHX", "U09E652SJ02"]);
  });

  it("leaves a DM's card undecidable when no standing confirmer is set", async () => {
    assert.equal(await members({ SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env, "D0APTB20SK0"), null);
  });
});
