// What a won verdict hands the tool it runs — driven through `executeVerdict`,
// the production path, not a helper beside it.
//
// The Gate records who asked (`requesterUserId`) and the real ts the card was
// posted under (`post.replyTs`). Both have to reach the tool body: a relayed DM
// names the requester to its recipient and confirms in their thread, and
// `email_send`'s EMAIL_AUTHORIZED_USERS check asks who asked. Until the relayed
// DM, the executor dropped both, so the allowlist compared against `undefined`
// and refused everyone the moment it was set.
//
// HOW THE WORLD IS FAKED. `executeVerdict` names `Env` and reaches Slack and
// Gmail through `net.ts`, which binds `fetch` when it is first evaluated — so,
// as in `notion-write.test.ts`, one routing stub goes onto `globalThis` before
// anything imports it and the module under test is loaded lazily. Thread
// history goes to a fake Durable Object namespace whose stub records nothing
// this file asserts on.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { GateVerdict } from "../src/gate/index";

interface Call {
  url: string;
  body: Record<string, unknown> | null;
}

let calls: Call[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  let body: Record<string, unknown> | null = null;
  if (typeof init?.body === "string") {
    try {
      body = JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      body = null;
    }
  }
  calls.push({ url, body });
  const reply = (payload: unknown) =>
    new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  if (url.includes("slack.com/api/chat.getPermalink")) {
    const u = new URL(url);
    const channel = u.searchParams.get("channel");
    const ts = (u.searchParams.get("message_ts") ?? "").replace(".", "");
    return reply({ ok: true, permalink: `https://plus.slack.com/archives/${channel}/p${ts}` });
  }
  if (url.includes("slack.com/api/conversations.open")) {
    return reply({ ok: true, channel: { id: `D-${String(body?.users)}` } });
  }
  if (url.includes("slack.com/api/")) return reply({ ok: true, ts: "1700000000.999999" });
  if (url.includes("oauth2.googleapis.com/token")) return reply({ access_token: "ya29.test" });
  if (url.includes("gmail.googleapis.com")) return reply({ id: "msg-1" });
  throw new Error(`no stub route for ${url}`);
}) as typeof fetch;

/** Thread history lands in a Durable Object; here it lands nowhere. */
const THREAD_STATE = {
  idFromName: () => "thread-state",
  get: () => ({ appendHistory: async () => ({ length: 1 }) }),
};

function env(over: Partial<Record<string, string>> = {}): Env {
  return { SLACK_BOT_TOKEN: "xoxb-test", THREAD_STATE, ...over } as unknown as Env;
}

/** A won ✅ on a card staged in the requester's own DM — where the
 *  conversation key is not a ts Slack accepts, and the reply ts is. */
function won(operations: Array<{ toolName: string; input: Record<string, unknown> }>): GateVerdict {
  const proposal = {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel: "D0REQUESTER",
    threadTs: "dm",
    replyTs: "1700000000.000100",
    userMsgTs: "1700000000.000200",
    proposalTs: "1700000000.000300",
    proposalText: "(the card)",
    requesterUserId: "U0REQ1",
  };
  return {
    outcome: "won",
    proposal,
    decision: "confirm",
    post: { note: { kind: "resolved", decision: "confirm" }, replyTs: proposal.replyTs },
    execute: {
      operations,
      toolName: proposal.toolName,
      input: proposal.input,
      channel: proposal.channel,
      threadTs: proposal.threadTs,
      userMsgTs: proposal.userMsgTs,
      requesterUserId: proposal.requesterUserId,
    },
  };
}

function executeVerdict(): Promise<typeof import("../src/agent/resolve-proposal")["executeVerdict"]> {
  return import("../src/agent/resolve-proposal.js").then((m) => m.executeVerdict);
}

const posts = () => calls.filter((c) => c.url.includes("chat.postMessage")).map((c) => c.body ?? {});

test("an approved relay reaches its recipient attributed to the requester, and confirms under the reply ts", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(env(), won([{ toolName: "dm_relay", input: { recipient: "U0COCO", text: "RM-2436 is **Ready for QA**." } }]));

  const dm = posts().find((p) => p.channel === "D-U0COCO");
  assert.ok(dm, "the recipient got a DM");
  assert.ok(String(dm.text).startsWith("<@U0REQ1> asked me to pass this on:"), String(dm.text));
  // The text goes out through the same Markdown → mrkdwn conversion as any
  // other reply: the schema asks for standard Markdown.
  assert.ok(String(dm.text).includes("RM-2436 is *Ready for QA*."), String(dm.text));
  assert.ok(String(dm.text).includes("https://plus.slack.com/archives/D0REQUESTER/p1700000000000200"));

  const note = posts().find((p) => p.channel === "D0REQUESTER");
  assert.ok(note, "the requesting conversation heard where it went");
  assert.match(String(note.text), /Sent to <@U0COCO>/);
  assert.equal(note.thread_ts, "1700000000.000100", "under the real reply ts, not the conversation key");
});

test("a multi-recipient relay tells the thread once", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(),
    won([
      { toolName: "dm_relay", input: { recipient: "U0COCO", text: "hi" } },
      { toolName: "dm_relay", input: { recipient: "U0MERYEM", text: "hi" } },
    ]),
  );
  assert.deepEqual(
    posts().filter((p) => String(p.channel).startsWith("D-")).map((p) => p.channel),
    ["D-U0COCO", "D-U0MERYEM"],
  );
  const inThread = posts().filter((p) => p.channel === "D0REQUESTER");
  assert.equal(inThread.length, 1, inThread.map((p) => p.text).join("\n---\n"));
  assert.match(String(inThread[0]!.text), /<@U0COCO>/);
  assert.match(String(inThread[0]!.text), /<@U0MERYEM>/);
});

const EMAIL = {
  toolName: "email_send",
  input: { to: ["sme@example.edu"], subject: "Calendar Sync", body: "A real message body, long enough to send." },
};
const GMAIL = {
  GMAIL_SENDER: "design@example.edu",
  GMAIL_CLIENT_ID: "id",
  GMAIL_CLIENT_SECRET: "secret",
  GMAIL_REFRESH_TOKEN: "refresh",
};
const gmailSends = () => calls.filter((c) => c.url.includes("gmail.googleapis.com")).length;

test("email_send's user allowlist sees who asked: an allowlisted requester sends", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(env({ ...GMAIL, EMAIL_AUTHORIZED_USERS: "U0REQ1" }), won([EMAIL]));
  assert.equal(gmailSends(), 1);
});

test("email_send's user allowlist sees who asked: anyone else is refused", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(env({ ...GMAIL, EMAIL_AUTHORIZED_USERS: "U0SOMEONEELSE" }), won([EMAIL]));
  assert.equal(gmailSends(), 0);
  assert.ok(posts().some((p) => /isn't enabled for you/.test(String(p.text))));
});
