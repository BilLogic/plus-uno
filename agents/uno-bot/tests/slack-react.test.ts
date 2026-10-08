// The persona's "at most one content-matched reaction per message", held by
// the reaction tool rather than by prose.
//
// Driven at the guard the turn's dispatch wraps `slack_react` in
// (`agent/run-agent.ts` § TURN_WRAPPERS), around a body that records what it
// was asked to post. The live body reaches Slack, which a Node suite does not;
// what the guard decides is which calls ever reach it.
import { test } from "node:test";
import assert from "node:assert/strict";

import { oneReactionPerMessage } from "../src/tools/slack-react";
import type { ToolBody } from "../src/agent/tool-bodies";
import type { Env, SlackContext } from "../src/types";

const SLACK = { channel: "C1", threadTs: "1700000000.000100", userMsgTs: "1700000000.000190" } as SlackContext;
const env = {} as Env;

/** A body that posts every reaction it is handed, or fails the ones `fails` names. */
function postingBody(fails: string[] = []) {
  const posted: Array<{ emoji: string; ts: string }> = [];
  const body: ToolBody = async (_env, input, slack) => {
    const emoji = String(input.emoji);
    const ts = typeof input.message_ts === "string" ? input.message_ts : slack.userMsgTs;
    if (fails.includes(emoji)) return JSON.stringify({ ok: false, error: "invalid_name" });
    posted.push({ emoji, ts });
    return JSON.stringify({ ok: true, reacted: emoji, message_ts: ts });
  };
  return { body, posted };
}

test("a second reaction on the same message in a turn is refused, with a reason the model reads", async () => {
  const { body, posted } = postingBody();
  const react = oneReactionPerMessage(body, new Set());

  assert.equal(JSON.parse(await react(env, { emoji: "pray" }, SLACK)).ok, true);
  const second = JSON.parse(await react(env, { emoji: "tada" }, SLACK)) as { ok: boolean; error: string };

  assert.equal(second.ok, false);
  assert.match(second.error, /already reacted to this message/);
  assert.deepEqual(posted, [{ emoji: "pray", ts: SLACK.userMsgTs }]);
});

test("the person's message named by its ts is the same message as the default", async () => {
  const { body, posted } = postingBody();
  const react = oneReactionPerMessage(body, new Set());
  await react(env, { emoji: "pray" }, SLACK);
  await react(env, { emoji: "tada", message_ts: SLACK.userMsgTs }, SLACK);
  assert.equal(posted.length, 1);
});

test("a different message still takes its own one reaction", async () => {
  const { body, posted } = postingBody();
  const react = oneReactionPerMessage(body, new Set());
  await react(env, { emoji: "pray" }, SLACK);
  await react(env, { emoji: "eyes", message_ts: "1700000000.000150" }, SLACK);
  assert.deepEqual(posted.map((p) => p.ts), [SLACK.userMsgTs, "1700000000.000150"]);
});

test("a reaction that failed to post does not use up the message's one", async () => {
  const { body, posted } = postingBody(["not-an-emoji"]);
  const react = oneReactionPerMessage(body, new Set());
  assert.equal(JSON.parse(await react(env, { emoji: "not-an-emoji" }, SLACK)).ok, false);
  assert.equal(JSON.parse(await react(env, { emoji: "pray" }, SLACK)).ok, true);
  assert.deepEqual(posted, [{ emoji: "pray", ts: SLACK.userMsgTs }]);
});

test("the count is the turn's: a new turn's ledger starts empty", async () => {
  const { body, posted } = postingBody();
  await oneReactionPerMessage(body, new Set())(env, { emoji: "pray" }, SLACK);
  await oneReactionPerMessage(body, new Set())(env, { emoji: "pray" }, SLACK);
  assert.equal(posted.length, 2);
});
