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

const ROOT_ONLY = [{ user: "U1", text: "root", ts: "1700.1" }];
let slackCalls: string[] = [];
/** What `conversations.replies` answers; a case may set its own thread. */
let thread: Array<Record<string, unknown>> = ROOT_ONLY;
/** The card `getProposalByThread` answers; none unless a case sets one. */
let pending: Record<string, unknown> | null = null;
globalThis.fetch = (async (input: unknown) => {
  const url = String(input instanceof Request ? input.url : input);
  slackCalls.push(url.replace("https://slack.com/api/", ""));
  const body = url.endsWith("auth.test")
    ? { ok: true, user_id: BOT, bot_id: "BBOT" }
    : { ok: true, messages: thread };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
}) as typeof fetch;

const ENV = {
  SLACK_BOT_TOKEN: "xoxb-test",
  UNO_BOT_CHANNEL_ID: UNO_BOT,
  THREAD_STATE: {
    idFromName: (name: string) => name,
    get: () => ({
      async getProposalByThread() {
        return pending;
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

// A thread where uno-bot's only post is an end-of-day sweep card is the team's
// own conversation: a reply engages only when it is addressed to the card.
const SWEEP_CARD_POST = {
  user: BOT,
  bot_id: "BBOT",
  ts: "1700.5",
  text: ":mag: *End-of-day sweep* — this thread settled something a linked page still says the old way.",
  metadata: { event_type: "uno_sweep_card", event_payload: { card_key: "2026-09-30:C0DESIGN:1700.1:blk-1" } },
};
const inSweepThread = (text: string) => post({ channel: OTHER, ts: "1700.9", thread_ts: "1700.1", text });

async function withSweepThread<T>(posts: Array<Record<string, unknown>>, fn: () => Promise<T>): Promise<T> {
  thread = [...ROOT_ONLY, ...posts];
  pending = { proposalTs: "1700.5", sweepRun: "2026-09-30" };
  try {
    return await fn();
  } finally {
    thread = ROOT_ONLY;
    pending = null;
  }
}

test("under a sweep card, the thread's own conversation is left alone", async () => {
  await withSweepThread([SWEEP_CARD_POST], async () => {
    assert.equal(await engages(inSweepThread("lunch at noon?")), false);
    assert.equal(await engages(inSweepThread("I'll change the deck before Friday")), false);
    assert.equal(await engages(inSweepThread("we should fix the onboarding flow")), false);
  });
});

test("under a sweep card, a reply about the card, a typed gate emoji or an @mention engages", async () => {
  await withSweepThread([SWEEP_CARD_POST], async () => {
    assert.equal(await engages(inSweepThread("drop 2")), true);
    assert.equal(await engages(inSweepThread("keep the first one, skip the rest")), true);
    assert.equal(await engages(inSweepThread("can you reword fix 3?")), true);
    assert.equal(await engages(inSweepThread(":white_check_mark:")), true);
    assert.equal(await engages(inSweepThread("⛔")), true);
    assert.equal(await engages(inSweepThread(`<@${BOT}> what does this card change?`)), true);
  });
});

test("once uno-bot has said anything else in the thread, every reply engages again", async () => {
  const answer = { user: BOT, bot_id: "BBOT", ts: "1700.7", text: "Dropped the second fix." };
  await withSweepThread([SWEEP_CARD_POST, answer], async () => {
    assert.equal(await engages(inSweepThread("lunch at noon?")), true);
  });
});
