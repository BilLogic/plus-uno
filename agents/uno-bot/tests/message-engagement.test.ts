// The event gate for plain `message` events: which posts the bot engages on
// with no @mention.
//
// `shouldHandleMessage` is bound to `Env`, so it is driven on a stubbed one: a
// ThreadState namespace answering "no card, no history", and a fetch stub
// standing where Slack would — `auth.test` names the bot, and
// `conversations.replies` answers a thread the bot has no part in. `net.ts`
// binds fetch at first evaluation, so the stub goes on `globalThis` before the
// lazy import. Nothing here reaches Slack.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { SlackMessageEvent } from "../src/slack/types";
import type { Env } from "../src/types";

const BOT = "UBOT";
const UNO_BOT = "C0UNOBOT";
const OTHER = "C0DESIGN";

let slackCalls: string[] = [];
globalThis.fetch = (async (input: unknown) => {
  const url = String(input instanceof Request ? input.url : input);
  slackCalls.push(url.replace("https://slack.com/api/", ""));
  const body = url.endsWith("auth.test")
    ? { ok: true, user_id: BOT, bot_id: "BBOT" }
    : { ok: true, messages: [{ user: "U1", text: "root", ts: "1700.1" }] };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}) as typeof fetch;

const ENV = {
  SLACK_BOT_TOKEN: "xoxb-test",
  UNO_BOT_CHANNEL_ID: UNO_BOT,
  THREAD_STATE: {
    idFromName: (name: string) => name,
    get: () => ({
      async getProposalByThread() {
        return null;
      },
      async readHistory() {
        return [];
      },
    }),
  },
} as unknown as Env;

const post = (over: Partial<SlackMessageEvent> = {}): SlackMessageEvent => ({
  type: "message",
  channel: UNO_BOT,
  user: "U1",
  ts: "1700.1",
  text: "uno-bot keeps quoting last week's Design Status",
  ...over,
});

async function engages(event: SlackMessageEvent, env: Env = ENV): Promise<boolean> {
  const { shouldHandleMessage } = await import("../src/slack/events.js");
  slackCalls = [];
  return shouldHandleMessage(env, event);
}

test("a top-level user post in #uno-bot engages, with no @mention and no lookup", async () => {
  assert.equal(await engages(post()), true);
  assert.deepEqual(slackCalls, [], "decided from the event and the config alone");
});

test("the same post in any other channel does not", async () => {
  assert.equal(await engages(post({ channel: OTHER })), false);
});

test("with no #uno-bot configured, a post there is an ordinary channel post", async () => {
  assert.equal(await engages(post(), { ...ENV, UNO_BOT_CHANNEL_ID: undefined } as Env), false);
});

test("bot posts and subtypes in #uno-bot do not", async () => {
  assert.equal(await engages(post({ bot_id: "BOTHER" })), false, "a bot's post");
  assert.equal(await engages(post({ subtype: "message_changed" })), false, "an edit");
  assert.equal(await engages(post({ subtype: "channel_join" })), false, "a join");
});

test("a thread reply in #uno-bot keeps the follow-up rule: no bot in the thread, no engagement", async () => {
  assert.equal(await engages(post({ ts: "1700.2", thread_ts: "1700.1" })), false);
  assert.ok(slackCalls.some((c) => c.startsWith("conversations.replies")), "it asked the thread, as any reply does");
});

test("an @mention anywhere still engages", async () => {
  assert.equal(await engages(post({ channel: OTHER, text: `<@${BOT}> what's the token for primary?` })), true);
});

// ── The weekly DS precedence list threads ───────────────────────────────────
// uno-bot posts a list and a card there on a schedule, which leaves a live
// card and uno-bot's own posts in the thread. People reply to each other about
// the list, so a reply is not a turn: an @mention or a typed gate emoji
// engages, and nothing else does — not uno-bot having answered there, not a
// newer week's thread, not a card that never posted. Every list thread is
// recorded under its own ts.

const UNIVERSAL = "C072E8SFLKV";
const LAST_WEEK = "1759000000.000001";
const THIS_WEEK = "1759500000.000001";

function weeklyEnv(history: unknown[] = [], recorded: string[] = [LAST_WEEK, THIS_WEEK]): Env {
  return {
    ...ENV,
    PLUS_UNIVERSAL_CHANNEL_ID: UNIVERSAL,
    HARNESS_KV: {
      get: async (key: string) => {
        const ts = recorded.find((t) => key === `ds-precedence:thread:${t}`);
        return ts ? { channel: UNIVERSAL, ts, cardTs: "" } : null;
      },
    },
    THREAD_STATE: {
      idFromName: (name: string) => name,
      get: () => ({
        // A card is live in the thread.
        async getProposalByThread() {
          return { proposalTs: "1759500000.000002" };
        },
        async readHistory() {
          return history;
        },
      }),
    },
  } as unknown as Env;
}

const listReply = (text: string, thread = THIS_WEEK) =>
  post({ channel: UNIVERSAL, ts: "1759500100.000001", thread_ts: thread, text });

test("a plain reply in a list thread does not engage, though a card is live there", async () => {
  assert.equal(await engages(listReply("agree with 2, the set exists"), weeklyEnv()), false);
});

test("an @mention or a typed gate emoji in a list thread engages", async () => {
  assert.equal(await engages(listReply(`<@${BOT}> why is Button listed?`), weeklyEnv()), true);
  assert.equal(await engages(listReply("✅"), weeklyEnv()), true);
});

test("uno-bot having answered in a list thread (a typed ✅, a mention) does not make every reply a turn", async () => {
  assert.equal(await engages(listReply("and item 3?"), weeklyEnv([{ role: "assistant", content: "…" }])), false);
});

test("last week's list thread stays exempt after this week's posts", async () => {
  assert.equal(await engages(listReply("still think 4 is wrong", LAST_WEEK), weeklyEnv()), false);
});

test("a list thread whose card never posted is still a list thread", async () => {
  // Recorded when the list posted, before any card: no card, only the list.
  assert.equal(await engages(listReply("nothing to confirm here?"), weeklyEnv([], [THIS_WEEK])), false);
});

test("another thread in #plus-universal with a live card keeps the ordinary rule", async () => {
  const other = post({ channel: UNIVERSAL, ts: "1759500100.000002", thread_ts: "1759400000.000001", text: "looks good" });
  assert.equal(await engages(other, weeklyEnv()), true);
});
