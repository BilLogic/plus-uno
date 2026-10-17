// An edit Slack refuses as too long still lands (live 2026-10-17, Worker
// r674).
//
// A revised PRD card rejected from Review was refused `msg_too_long` even
// with its text held to Slack's documented 4,000 characters, so the
// documented ceiling is not the whole rule. `updateMessage` answers that
// refusal once: it sends the edit again with only the text's opening and its
// last line (the outcome), and logs what it had sent, so the real ceiling can
// be read off the next refusal.
// First: the stub has to be in place before net.ts captures fetch.
import { expiryEdits, expiryTextLimit } from "./helpers/report-expiry-fetch";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { updateMessage, UPDATE_RETRY_TEXT_CHARS } from "../src/slack/api";
import type { Env } from "../src/types";

const env = { SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env;
const OUTCOME = "Rejected by <@U03FYQJRQHX>.";
const longText = `${"A requirement the card carries in full. ".repeat(90)}\n${OUTCOME}`;

describe("an edit Slack refuses as too long", () => {
  afterEach(() => {
    expiryTextLimit();
    expiryEdits.length = 0;
  });

  it("is sent once more with a short text that keeps its last line, and lands", async () => {
    expiryTextLimit(1_500);
    const blocks = [{ type: "section", text: { type: "mrkdwn", text: OUTCOME } }];
    const res = await updateMessage(env, { channel: "D1", ts: "1.0", text: longText, blocks });
    assert.equal(res.ok, true);
    assert.equal(expiryEdits.length, 2, "the refused edit, then the short one");
    const retry = String(expiryEdits[1]!.text);
    assert.ok(retry.length <= UPDATE_RETRY_TEXT_CHARS, `${retry.length} chars`);
    assert.ok(retry.endsWith(OUTCOME), "the outcome survives");
    assert.deepEqual(expiryEdits[1]!.blocks, expiryEdits[0]!.blocks, "the blocks are unchanged");
  });

  it("is not sent twice when Slack takes it the first time", async () => {
    await updateMessage(env, { channel: "D1", ts: "1.0", text: longText });
    assert.equal(expiryEdits.length, 1);
  });
});
