// The title `agents.sessions.rename` is handed, driven through `renameSession`
// to the body Slack receives.
//
// Slack refuses a title with `invalid_name` — "The `title` value is not valid
// for a channel name" — and production logged that refusal on every DM turn
// while the asks were ordinary sentences with a colon, an apostrophe, a
// question mark, a line break and the Claude app's `*Sent using* <@U…|Claude>`
// footer. A channel name takes letters, numbers, hyphens and underscores, at
// most 80 of them; Slack's own example title ("Bora Bora trip prep") shows that
// capitals and spaces pass. So what is sent keeps exactly those, and these
// tests pin that on the wire.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` first and the client is imported lazily. Nothing here touches
// Slack.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Env } from "../src/types";

const sent: Array<{ url: string; body: Record<string, unknown> }> = [];
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  sent.push({ url: String(input), body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}) as typeof fetch;

const env = { SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env;

async function titleSentFor(question: string): Promise<unknown> {
  const { renameSession } = await import("../src/slack/assistant.js");
  sent.length = 0;
  await renameSession(env, "D0BILL", "1790780000.000001", question);
  const [call] = sent;
  assert.equal(sent.length, 1);
  assert.equal(call?.url, "https://slack.com/api/agents.sessions.rename");
  return call?.body.title;
}

describe("the session title Slack is sent", () => {
  it("is a long, multi-line, markup-laden ask cut to channel-name characters", async () => {
    const title = await titleSentFor(
      "Checklist test 4: what's the current state of tutor onboarding?\n" +
        "Check the blueprint, the Roadmap board, and any open GitHub issues, and cite where each point comes from.\n\n" +
        "*Sent using* <@U0ASFR2RJ9W|Claude>",
    );
    assert.equal(title, "Checklist test 4 whats the current state of tutor onboarding Check the blueprint");
  });

  it("shows a mention by its label, not its markup", async () => {
    assert.equal(await titleSentFor("*Sent using* <@U0ASFR2RJ9W|Claude>"), "Sent using Claude");
  });

  it("drops the ellipsis a shortened question carries", async () => {
    assert.equal(await titleSentFor("What does the tutor see first…"), "What does the tutor see first");
  });

  it("keeps hyphens and underscores, which a channel name allows", async () => {
    assert.equal(await titleSentFor("design-system tokens_v2"), "design-system tokens_v2");
  });

  it("falls back to a name when nothing nameable is left", async () => {
    assert.equal(await titleSentFor("??? :) …"), "Chat with UNO Bot");
  });
});
