// The agent-session methods uno-bot sends, and the ones it no longer does.
//
// SOURCE-READ ON PURPOSE, and it is not a door. `slack/assistant.ts` is the
// Slack CLIENT — a thin currying of `slackCall` onto Slack's method names — and
// the acceptance criterion behind it is a NEGATIVE one: "no bridged assistant
// status or title calls remain". A negative is exactly what a behavioural test
// cannot see, because a bridged call still works today. It works until February
// 2027, and it no longer clears the indicator when the answer posts, which is
// the defect (#574).
//
// The regexes that went in #594 were the ones over the ADAPTER, which decides
// things and can therefore be driven (`tests/working-signal.test.ts`). This one
// asks only which string is sent to Slack, and nothing behavioural can replace
// it — so it moved here intact rather than being deleted with them, the way the
// manifest-to-dispatcher check moved out of `session-stop.test.ts` in #593.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("the methods the working signal sends", () => {
  const src = readFileSync(resolve(process.cwd(), "src/slack/assistant.ts"), "utf8");

  it("moves the session's status and renames the session", () => {
    assert.match(src, /slackCall\(env, "agents\.sessions\.setStatus"/);
    assert.match(src, /slackCall\(env, "agents\.sessions\.rename"/);
  });

  it("sends no bridged status or title call", () => {
    assert.ok(!src.includes('"assistant.threads.setStatus"'), "setStatus is gone");
    assert.ok(!src.includes('"assistant.threads.setTitle"'), "setTitle is gone");
  });

  it("leaves suggested prompts alone — Slack has published no replacement", () => {
    assert.match(src, /slackCall\(env, "assistant\.threads\.setSuggestedPrompts"/);
  });

  it("keeps the thread guard the session methods still need", () => {
    // `thread_ts` is required for thread-based sessions in regular channels and
    // DMs, which is every surface this bot has.
    assert.match(src, /if \(!thread_ts\) return \{ ok: false, error: "no_thread" \}/);
    assert.match(src, /thread_ts,/);
  });

  it("sends no argument the session method does not define", () => {
    // `loading_messages` was `assistant.threads.setStatus`'s. `agents.sessions.
    // setStatus` documents status, channel_id, thread_ts, title,
    // initiator_user_id and the customize trio — and nothing else.
    assert.ok(!/loading_messages:/.test(src), "loading_messages is not a session argument");
  });
});
