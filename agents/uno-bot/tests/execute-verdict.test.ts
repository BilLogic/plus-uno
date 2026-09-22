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
  if (url.includes("slack.com/api/users.info")) {
    const user = new URL(url).searchParams.get("user");
    return reply({ ok: true, user: { id: user, profile: { display_name: user === "U0REQ1" ? "Bill Guo" : "" } } });
  }
  if (url.includes("slack.com/api/")) return reply({ ok: true, ts: "1700000000.999999" });
  if (url.startsWith("https://api.github.com/repos/") && url.endsWith("/issues")) {
    return new Response(
      JSON.stringify({ number: 701, html_url: "https://github.com/BilLogic/plus-uno/issues/701" }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  }
  if (url.startsWith("https://api.github.com/repos/") && url.endsWith("/comments")) {
    return new Response(
      JSON.stringify({ html_url: "https://github.com/BilLogic/plus-uno/issues/688#issuecomment-1" }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  }
  if (/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/issues\/\d+$/.test(url)) return reply({ number: 688 });
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

test("an approved GitHub intake names who asked in its footer, and links the issue under the reply ts", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env({ GITHUB_TOKEN: "ghp_test", GITHUB_REPO: "BilLogic/plus-uno" }),
    won([{ toolName: "github_issue_create", input: { title: "A bot gap", body: "What went wrong." } }]),
  );

  const filed = calls.find((c) => c.url === "https://api.github.com/repos/BilLogic/plus-uno/issues");
  assert.ok(filed, "the issue was filed on the configured repo");
  const body = String(filed.body?.body);
  // The requester of record, resolved to a name — not whoever pressed ✅.
  assert.match(body, /on behalf of Bill Guo/);
  // Asked in a DM, so the public issue carries no link into it.
  assert.match(body, /filed from a DM/);
  assert.doesNotMatch(body, /slack\.com/);
  assert.deepEqual(filed.body?.labels, ["harness-intake", "needs-triage"]);

  const note = posts().find((p) => String(p.text).includes("issues/701"));
  assert.ok(note, "the issue link came back to the requesting conversation");
  assert.equal(note.channel, "D0REQUESTER");
  assert.equal(note.thread_ts, "1700000000.000100", "under the real reply ts, not the conversation key");
});

test("an approved issue follow-up comments with the requester's footer, then closes with its reason", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env({ GITHUB_TOKEN: "ghp_test", GITHUB_REPO: "BilLogic/plus-uno" }),
    won([{ toolName: "github_issue_update", input: { issue_number: 688, comment: "Fixed in r384.", state: "closed_completed" } }]),
  );

  const github = calls.filter((c) => c.url.startsWith("https://api.github.com/"));
  assert.deepEqual(
    github.map((c) => c.url),
    [
      "https://api.github.com/repos/BilLogic/plus-uno/issues/688/comments",
      "https://api.github.com/repos/BilLogic/plus-uno/issues/688",
    ],
    "the comment lands before the close",
  );
  const comment = String(github[0]!.body?.body);
  assert.ok(comment.startsWith("Fixed in r384."), comment);
  assert.match(comment, /Posted from Slack by uno-bot on behalf of Bill Guo, posted from a DM/);
  assert.doesNotMatch(comment, /slack\.com/);
  assert.deepEqual(github[1]!.body, { state: "closed", state_reason: "completed" });

  const note = posts().find((p) => String(p.text).includes("issues/688"));
  assert.ok(note, "the issue link came back to the requesting conversation");
  assert.equal(note.thread_ts, "1700000000.000100", "under the real reply ts, not the conversation key");
});

const LISTED = {
  GITHUB_TOKEN: "ghp_test",
  GITHUB_REPO: "BilLogic/plus-uno",
  GITHUB_REPOS: JSON.stringify([
    { repo: "BilLogic/plus-uno", purpose: "uno-bot and the harness", workflows: [] },
    { repo: "BilLogic/plus-marketing-website", purpose: "the public marketing site", workflows: [] },
  ]),
};

test("an approved intake naming a listed repo is filed there, with the two fixed labels and the footer", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(LISTED),
    won([{
      toolName: "github_issue_create",
      // The model's spelling; the list's is what reaches GitHub.
      input: { title: "Hero CTA 404s", body: "The hero button links nowhere.", repo: "plus-marketing-website" },
    }]),
  );

  const filings = calls.filter((c) => /^https:\/\/api\.github\.com\/repos\/.+\/issues$/.test(c.url));
  assert.deepEqual(filings.map((c) => c.url), ["https://api.github.com/repos/BilLogic/plus-marketing-website/issues"]);
  const sent = filings[0]!.body!;
  assert.deepEqual(sent.labels, ["harness-intake", "needs-triage"]);
  assert.match(String(sent.body), /^The hero button links nowhere\.\n\n---\nFiled from Slack by uno-bot on behalf of Bill Guo/);
  assert.equal(sent.repo, undefined, "the repo is the URL's, never a field of the model's");
  assert.ok(posts().some((p) => /on BilLogic\/plus-marketing-website/.test(String(p.text))));
});

test("an approved intake naming a repo off the list is refused, and nothing reaches GitHub", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(LISTED),
    won([{ toolName: "github_issue_create", input: { title: "A gap", body: "Details.", repo: "someone/else" } }]),
  );
  assert.deepEqual(calls.filter((c) => c.url.startsWith("https://api.github.com/")), []);
});
