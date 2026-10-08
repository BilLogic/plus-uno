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
import type { ProposalEventLog } from "../src/usage/index";

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
  // A transport failure mid-batch, on demand: the text says when.
  if (String(body?.text ?? "").includes("EXPLODE")) throw new Error("socket hang up");
  const reply = (payload: unknown) =>
    new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  if (url.includes("slack.com/api/chat.getPermalink")) {
    const u = new URL(url);
    const channel = u.searchParams.get("channel");
    const ts = (u.searchParams.get("message_ts") ?? "").replace(".", "");
    return reply({ ok: true, permalink: `https://plus.slack.com/archives/${channel}/p${ts}` });
  }
  if (url.includes("slack.com/api/conversations.info")) {
    // A channel's kind by its test id: C0PRIV… private, G0… a group DM, any
    // other C… public, and C0UNKNOWN one Slack will not describe.
    const id = new URL(url).searchParams.get("channel") ?? "";
    if (id === "C0UNKNOWN") return reply({ ok: false, error: "channel_not_found" });
    return reply({ ok: true, channel: { id, is_private: id.startsWith("C0PRIV"), is_mpim: id.startsWith("G0"), is_im: false } });
  }
  if (url.includes("slack.com/api/conversations.open")) {
    return reply({ ok: true, channel: { id: `D-${String(body?.users)}` } });
  }
  if (url.includes("slack.com/api/users.info")) {
    const user = new URL(url).searchParams.get("user");
    return reply({ ok: true, user: { id: user, profile: { display_name: user === "U0REQUESTR1" ? "Bill Guo" : "" } } });
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
  // A Notion block someone edited after the bot read it: its stamp has moved.
  if (url.startsWith("https://api.notion.com/v1/blocks/") && !init?.method) {
    return reply({
      id: url.split("/").pop(),
      last_edited_time: "2026-09-15T16:40:00.000Z",
      parent: { type: "page_id", page_id: "0123456789abcdef0123456789abcdef" },
    });
  }
  // Notion writes: a created page, an append, a property change and the reads
  // a property change makes first.
  if (url === "https://api.notion.com/v1/pages" && init?.method === "POST") {
    return reply({ id: "9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f", url: "https://www.notion.so/9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f" });
  }
  if (url.startsWith("https://api.notion.com/v1/blocks/") && url.endsWith("/children") && init?.method === "PATCH") {
    return reply({ results: [] });
  }
  if (url.startsWith("https://api.notion.com/v1/pages/") && init?.method === "PATCH") return reply({ id: "page" });
  if (url.startsWith("https://api.notion.com/v1/pages/")) {
    return reply({
      id: "0123456789abcdef0123456789abcdef",
      parent: { type: "database_id", database_id: "dbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdb" },
      properties: { Name: { type: "title", title: [{ plain_text: "A card" }] } },
    });
  }
  if (url.startsWith("https://api.notion.com/v1/databases/")) {
    return reply({ properties: { Name: { type: "title" }, Priority: { type: "rich_text" } } });
  }
  if (url.includes("oauth2.googleapis.com/token")) return reply({ access_token: "ya29.test" });
  if (url.includes("gmail.googleapis.com")) return reply({ id: "msg-1" });
  throw new Error(`no stub route for ${url}`);
}) as typeof fetch;

/** Thread history and the execution record land in a Durable Object; here
 *  history lands in a list, and the record's calls are kept to be asserted. */
let appended: Array<{ ref: { channel: string; thread: string }; turn: { role: string; content: string } }> = [];
let executionCalls: string[] = [];
const THREAD_STATE = {
  idFromName: () => "thread-state",
  get: () => ({
    appendHistory: async (ref: (typeof appended)[number]["ref"], turn: (typeof appended)[number]["turn"]) => {
      appended.push({ ref, turn });
      return { length: 1 };
    },
    settleOperation: async (ts: string, index: number, ok: boolean) => {
      executionCalls.push(`settle ${ts} ${index} ${ok}`);
      return { taken: false };
    },
    endExecution: async (ts: string) => {
      executionCalls.push(`end ${ts}`);
    },
  }),
};

function env(over: Partial<Record<string, string>> = {}): Env {
  return { SLACK_BOT_TOKEN: "xoxb-test", THREAD_STATE, ...over } as unknown as Env;
}

/** A won ✅ on a card staged in the requester's own DM — where the
 *  conversation key is not a ts Slack accepts, and the reply ts is. */
function won(operations: Array<{ toolName: string; input: Record<string, unknown> }>, channel = "D0REQUESTER"): GateVerdict {
  const proposal = {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel,
    threadTs: "dm",
    replyTs: "1700000000.000100",
    userMsgTs: "1700000000.000200",
    proposalTs: "1700000000.000300",
    proposalText: "(the card)",
    requesterUserId: "U0REQUESTR1",
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

test("an approved batch marks each operation as it comes back, then ends its execution record", async () => {
  calls = [];
  executionCalls = [];
  const run = await executeVerdict();
  await run(
    env(),
    won([
      { toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "one" } },
      { toolName: "not_a_tool", input: {} },
    ]),
  );
  // In batch order, a failed operation settled like any other, and the end
  // only once the outcome has been told — which is what a cut-off before it
  // leaves standing for the next look to find.
  assert.deepEqual(executionCalls, [
    "settle 1700000000.000300 0 true",
    "settle 1700000000.000300 1 false",
    "end 1700000000.000300",
  ]);
});

test("an approved relay reaches its recipient attributed to the requester, and confirms under the reply ts", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(env(), won([{ toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "RM-2436 is **Ready for QA**." } }]));

  const dm = posts().find((p) => p.channel === "D-U0COCO0001");
  assert.ok(dm, "the recipient got a DM");
  assert.ok(String(dm.text).startsWith("<@U0REQUESTR1> asked me to pass this on:"), String(dm.text));
  // The text goes out through the same Markdown → mrkdwn conversion as any
  // other reply: the schema asks for standard Markdown.
  assert.ok(String(dm.text).includes("RM-2436 is *Ready for QA*."), String(dm.text));
  assert.ok(String(dm.text).includes("https://plus.slack.com/archives/D0REQUESTER/p1700000000000200"));

  const note = posts().find((p) => p.channel === "D0REQUESTER");
  assert.ok(note, "the requesting conversation heard where it went");
  assert.match(String(note.text), /Sent to <@U0COCO0001>/);
  assert.equal(note.thread_ts, "1700000000.000100", "under the real reply ts, not the conversation key");
});

test("an approved relay is remembered in the recipient's DM conversation, where their reply will look", async () => {
  calls = [];
  appended = [];
  const run = await executeVerdict();
  await run(env(), won([{ toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "RM-2436 is Ready for QA." } }]));

  const remembered = appended.filter((a) => a.ref.channel === "D-U0COCO0001");
  assert.equal(remembered.length, 1, JSON.stringify(appended));
  // The whole DM is one conversation, keyed "dm" — the key an unthreaded
  // reply from the recipient reads its history under.
  assert.equal(remembered[0]!.ref.thread, "dm");
  assert.equal(remembered[0]!.turn.role, "assistant");
  assert.ok(remembered[0]!.turn.content.startsWith("<@U0REQUESTR1> asked me to pass this on:"), remembered[0]!.turn.content);
  assert.ok(remembered[0]!.turn.content.includes("RM-2436 is Ready for QA."), remembered[0]!.turn.content);
});

test("a multi-recipient relay tells the thread once", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(),
    won([
      { toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "hi" } },
      { toolName: "dm_relay", input: { recipient: "U0MERYEM01", text: "hi" } },
    ]),
  );
  assert.deepEqual(
    posts().filter((p) => String(p.channel).startsWith("D-")).map((p) => p.channel),
    ["D-U0COCO0001", "D-U0MERYEM01"],
  );
  const inThread = posts().filter((p) => p.channel === "D0REQUESTER");
  assert.equal(inThread.length, 1, inThread.map((p) => p.text).join("\n---\n"));
  assert.match(String(inThread[0]!.text), /<@U0COCO0001>/);
  assert.match(String(inThread[0]!.text), /<@U0MERYEM01>/);
});

// A sweep card's batch result answers the card, so it carries the sweep's
// tag, as the card does: the thread's later replies read by the sweep's rule.
test("a sweep card's batch result carries the sweep's tag", async () => {
  calls = [];
  const run = await executeVerdict();
  const verdict = won([
    { toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "hi" } },
    { toolName: "dm_relay", input: { recipient: "U0MERYEM01", text: "hi" } },
  ]);
  await run(env(), { ...verdict, proposal: { ...verdict.proposal!, sweepRun: "2026-09-30" } });
  const result = posts().find((p) => p.channel === "D0REQUESTER");
  assert.deepEqual(result?.metadata, { event_type: "uno_sweep_card", event_payload: { role: "result" } });
});

const SHARED_PAGE = "https://www.notion.so/0123456789abcdef0123456789abcdef";
const SHARE_ENV = { PLUS_DESIGN_CHANNEL_ID: "C0DESIGN", PLUS_UNIVERSAL_CHANNEL_ID: "C0UNIVERSAL", UNO_BOT_CHANNEL_ID: "C0UNOBOT" };

test("a group DM's sweep card whose write was refused shares nothing", async () => {
  calls = [];
  const run = await executeVerdict();
  const verdict = won([
    {
      toolName: "notion_update",
      input: {
        page_url: SHARED_PAGE,
        replace: [{ block_id: "0123456789abcdef0123456789abcd01", last_edited_time: "2026-09-01T10:00:00.000Z", content: "x" }],
      },
    },
  ]);
  const proposal = {
    ...verdict.proposal!,
    channel: "G0MPIM",
    sweepRun: "2026-09-30",
    sweepShare: { pages: [{ url: SHARED_PAGE, title: "Launch plan", to: "plus-design" as const }] },
  };
  await run(env({ ...SHARE_ENV, NOTION_TOKEN: "secret_test" }), { ...verdict, proposal });
  assert.equal(posts().filter((p) => p.channel === "C0DESIGN").length, 0, "the block had moved, so nothing was applied");
});

test("a share card's ✅ posts exactly its note to its channel, and nothing to #uno-bot or elsewhere", async () => {
  const note = ":mag: End-of-day sweep: a group conversation settled something the Notion page “Launch plan” still said the old way, and the page is now up to date: " + SHARED_PAGE;
  const share = (channel: string) => ({ toolName: "sweep_share_post", input: { channel, channel_name: "#plus-design", text: note } });
  calls = [];
  const run = await executeVerdict();
  const verdict = won([share("C0DESIGN")]);
  await run(env(SHARE_ENV), { ...verdict, proposal: { ...verdict.proposal!, channel: "G0MPIM", supersedeKey: "sweep-share" } });
  const inDesign = posts().filter((p) => p.channel === "C0DESIGN");
  assert.equal(inDesign.length, 1);
  assert.equal(inDesign[0]!.text, note, "exactly the text the card showed");

  // A card aimed anywhere else — #uno-bot, a private channel — posts nothing there.
  for (const elsewhere of ["C0UNOBOT", "G0SECRET"]) {
    calls = [];
    const aimed = won([share(elsewhere)]);
    await run(env(SHARE_ENV), { ...aimed, proposal: { ...aimed.proposal!, channel: "G0MPIM" } });
    assert.equal(posts().filter((p) => p.channel === elsewhere).length, 0, elsewhere);
  }
});

test("a group DM's fix ✅ posts nothing outside the group DM", async () => {
  calls = [];
  const run = await executeVerdict();
  const verdict = won([{ toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "hi" } }]);
  const proposal = {
    ...verdict.proposal!,
    sweepRun: "2026-09-30",
    sweepShare: { pages: [{ url: SHARED_PAGE, title: "Launch plan", to: "plus-design" as const }] },
  };
  await run(env(SHARE_ENV), { ...verdict, proposal });
  assert.equal(posts().filter((p) => p.channel === "C0DESIGN" || p.channel === "C0UNIVERSAL").length, 0);
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
  await run(env({ ...GMAIL, EMAIL_AUTHORIZED_USERS: "U0REQUESTR1" }), won([EMAIL]));
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
  assert.match(body, /filed from a private conversation/);
  assert.doesNotMatch(body, /slack\.com/);
  assert.deepEqual(filed.body?.labels, ["harness-intake", "needs-triage"]);

  const note = posts().find((p) => String(p.text).includes("issues/701"));
  assert.ok(note, "the issue link came back to the requesting conversation");
  assert.equal(note.channel, "D0REQUESTER");
  assert.equal(note.thread_ts, "1700000000.000100", "under the real reply ts, not the conversation key");
});

// The repo is public: a card staged anywhere but a public channel files no
// link back into its conversation — decided by the conversation's kind, since
// a private channel's id starts with C like a public one's.
for (const [place, channel] of [
  ["a private channel", "C0PRIVATE01"],
  ["a group DM", "G0GROUPDM01"],
  ["a conversation Slack will not describe", "C0UNKNOWN"],
] as const) {
  test(`an approved GitHub intake staged in ${place} carries no permalink footer`, async () => {
    calls = [];
    const run = await executeVerdict();
    await run(
      env({ GITHUB_TOKEN: "ghp_test", GITHUB_REPO: "BilLogic/plus-uno" }),
      won([{ toolName: "github_issue_create", input: { title: "A bot gap", body: "What went wrong." } }], channel),
    );
    const filed = calls.find((c) => c.url === "https://api.github.com/repos/BilLogic/plus-uno/issues");
    const body = String(filed?.body?.body);
    assert.match(body, /filed from a private conversation/);
    assert.doesNotMatch(body, /slack\.com/);
    assert.ok(!calls.some((c) => c.url.includes("chat.getPermalink")), "its permalink is never fetched");
  });
}

test("an approved GitHub intake staged in a public channel links its source thread", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env({ GITHUB_TOKEN: "ghp_test", GITHUB_REPO: "BilLogic/plus-uno" }),
    won([{ toolName: "github_issue_create", input: { title: "A bot gap", body: "What went wrong." } }], "C0PUBLIC01"),
  );
  const filed = calls.find((c) => c.url === "https://api.github.com/repos/BilLogic/plus-uno/issues");
  assert.match(String(filed?.body?.body), /Source thread: https:\/\/plus\.slack\.com\/archives\/C0PUBLIC01\//);
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
  assert.match(comment, /Posted from Slack by uno-bot on behalf of Bill Guo, posted from a private conversation/);
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

// ── The execution record, through the real executor ─────────────────────────
//
// The Gate seam's cut-off cases (`tests/cut-off-run.test.ts`) have to stop a
// run by hand. These drive `executeVerdict` itself, on an in-memory store
// standing in for the Durable Object — its methods take the same arguments,
// and ignore the adapter's trailing clock in favour of their own.

async function realStore() {
  const [{ createInMemoryThreadState, EXECUTION_CUTOFF_MS }, { resolveSignal }] = await Promise.all([
    import("../src/thread-state/index.js"),
    import("../src/gate/index.js"),
  ]);
  let t = 1_700_000_000_000;
  const store = createInMemoryThreadState({ now: () => t });
  const operations = [
    { toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "one" } },
    { toolName: "dm_relay", input: { recipient: "U0COCO0002", text: "EXPLODE two" } },
    { toolName: "dm_relay", input: { recipient: "U0COCO0003", text: "three" } },
  ];
  const card = won(operations).proposal!;
  await store.putProposal(card);
  const press = () =>
    resolveSignal(
      { kind: "button", messageTs: card.proposalTs, decision: "confirm", userId: "U2" },
      { threadState: store },
    );
  const later = () => {
    t += EXECUTION_CUTOFF_MS + 1;
    return press();
  };
  const envOn = (threadState: object): Env =>
    ({ SLACK_BOT_TOKEN: "xoxb-test", THREAD_STATE: { idFromName: () => "x", get: () => threadState } }) as unknown as Env;
  return { store, press, later, envOn };
}

test("an executor that throws mid-batch finishes the batch and ends the record — no cut-off note follows", async () => {
  calls = [];
  const { store, press, later, envOn } = await realStore();
  const run = await executeVerdict();
  const verdict = await press();
  assert.equal(verdict.outcome, "won");
  await run(envOn(store), verdict);
  // All three ran; the second failed on the wire and the third still went.
  assert.ok(calls.some((c) => String(c.body?.text ?? "").includes("three")));
  const look = await later();
  assert.deepEqual(look.post?.note, { kind: "already-resolved" });
  assert.equal(look.restage, undefined);
});

test("a throw after the batch ends the record, so the door's failure note is the only one", async () => {
  calls = [];
  const { store, press, later, envOn } = await realStore();
  const run = await executeVerdict();
  const verdict = await press();
  const failingHistory = {
    ...store,
    appendHistory: async () => {
      throw new Error("history write refused");
    },
  };
  await assert.rejects(run(envOn(failingHistory), verdict), /history write refused/);
  // The reaction door answers that throw with "resolve-failed"; five minutes
  // on, the card must not grow a second, cut-off note about the same run.
  const look = await later();
  assert.deepEqual(look.post?.note, { kind: "already-resolved" });
  assert.equal(look.restage, undefined);
});

test("a run a later look has taken stops at its next operation and tells no outcome of its own", async () => {
  calls = [];
  const { store, press, envOn } = await realStore();
  const run = await executeVerdict();
  const verdict = await press();
  // The store answers the fence as a take made mid-run would.
  const taken = { ...store, settleOperation: async () => ({ taken: true }) };
  await run(envOn(taken), verdict);
  const relayed = posts().filter((p) => String(p.channel).startsWith("D-"));
  assert.equal(relayed.length, 1, "operation one ran; nothing after it started");
  assert.deepEqual(
    posts().filter((p) => p.channel === "D0REQUESTER"),
    [],
    "the note and the re-staged card are the thread's account, not a batch result",
  );
});

// ── What a verdict leaves on the usage record ────────────────────────────────
//
// Every door hands its verdict here, so this is where a verdict's proposal
// events are written (`usage/proposal-events.ts`): the door and the person
// come on the verdict from Gate, and the executor records them.

const CLOCK = () => 1_700_000_500_000;

/** Loaded lazily, like the executor: the usage module reaches `net.ts`. */
function usage(): Promise<typeof import("../src/usage/index")> {
  return import("../src/usage/index.js");
}

function by(verdict: GateVerdict, door: NonNullable<GateVerdict["by"]>["door"], userId?: string): GateVerdict {
  return { ...verdict, by: { door, ...(userId ? { userId } : {}) } };
}

const intake = [{ toolName: "github_issue_create", input: { title: "A bot gap", body: "What went wrong." } }];
const githubEnv = () => env({ GITHUB_TOKEN: "ghp_test", GITHUB_REPO: "BilLogic/plus-uno" });

test("a won ✅ is recorded confirmed, with the door and whether someone other than the requester pressed it", async () => {
  calls = [];
  const events = (await usage()).createInMemoryProposalEventLog();
  const run = await executeVerdict();
  await run(githubEnv(), by(won(intake), "reaction", "U0PRESSER1"), { events, now: CLOCK });
  assert.deepEqual(
    events.events().map((e) => [e.proposalId, e.event, e.via, e.actorId, e.confirmedByOther, e.at]),
    [["1700000000.000300", "confirmed", "reaction", "U0PRESSER1", true, CLOCK()]],
  );
});

test("a won ⛔ is recorded cancelled, and runs nothing", async () => {
  calls = [];
  const events = (await usage()).createInMemoryProposalEventLog();
  const run = await executeVerdict();
  const { execute: _none, ...declined } = won(intake);
  await run(env(), by({ ...declined, decision: "cancel" }, "button", "U0REQUESTR1"), { events, now: CLOCK });
  assert.deepEqual(events.events().map((e) => [e.event, e.via, e.confirmedByOther]), [["cancelled", "button", null]]);
  assert.equal(calls.some((c) => c.url.includes("api.github.com")), false);
});

test("a lost race records nothing", async () => {
  const events = (await usage()).createInMemoryProposalEventLog();
  const run = await executeVerdict();
  await run(env(), { ...by(won(intake), "typed", "U0PRESSER1"), outcome: "stale" }, { events, now: CLOCK });
  assert.deepEqual(events.events(), []);
});

test("a write refused because its page moved is recorded refused_stale, once for the batch", async () => {
  calls = [];
  const events = (await usage()).createInMemoryProposalEventLog();
  const run = await executeVerdict();
  const stale = (block: string) => ({
    toolName: "notion_update",
    input: {
      page_url: "https://www.notion.so/A-page-0123456789abcdef0123456789abcdef",
      replace: [{ block_id: block, last_edited_time: "2026-09-15T14:02:00.000Z", content: "the correction" }],
    },
  });
  await run(
    env({ NOTION_API_KEY: "secret_test" }),
    by(won([stale("1f2e3d4c5b6a79881f2e3d4c5b6a7988"), stale("2f2e3d4c5b6a79881f2e3d4c5b6a7988")]), "model"),
    { events, now: CLOCK },
  );
  // Nothing was written: the only Notion calls are the two stamp reads.
  assert.deepEqual(
    calls.filter((c) => c.url.startsWith("https://api.notion.com/")).map((c) => c.body),
    [null, null],
  );
  assert.deepEqual(events.events().map((e) => [e.event, e.via]), [
    ["confirmed", "model"],
    ["refused_stale", "executor"],
  ]);
});

test("what the batch leaves on the record is written before the history note, so a throw there cannot drop it", async () => {
  calls = [];
  const events = (await usage()).createInMemoryProposalEventLog();
  const run = await executeVerdict();
  const failingHistory = {
    idFromName: () => "thread-state",
    get: () => ({
      ...THREAD_STATE.get(),
      appendHistory: async () => {
        throw new Error("history write refused");
      },
    }),
  };
  const stale = {
    toolName: "notion_update",
    input: {
      page_url: "https://www.notion.so/A-page-0123456789abcdef0123456789abcdef",
      replace: [{ block_id: "1f2e3d4c5b6a79881f2e3d4c5b6a7988", last_edited_time: "2026-09-15T14:02:00.000Z", content: "x" }],
    },
  };
  await assert.rejects(
    run(
      { ...env({ NOTION_API_KEY: "secret_test" }), THREAD_STATE: failingHistory } as unknown as Env,
      by(won([stale]), "reaction", "U0PRESSER1"),
      { events, now: CLOCK },
    ),
    /history write refused/,
  );
  assert.deepEqual(events.events().map((e) => e.event), ["confirmed", "refused_stale"]);
});

test("a ✅ on a reaction or a button that files a ticket on the bot puts it on the staging turn's row", async () => {
  for (const door of ["reaction", "button"] as const) {
    calls = [];
    const turns = (await usage()).createInMemoryUsageLog();
    const events = (await usage()).createInMemoryProposalEventLog({ turns });
    await turns.record(stagingTurn());
    await events.record(await stagedFor("C1:1700000000.000200"));
    const run = await executeVerdict();
    await run(githubEnv(), by(won(intake), door, "U0PRESSER1"), { events, now: CLOCK });
    assert.equal(
      (await turns.get("C1:1700000000.000200"))?.selfFiledTicketUrl,
      "https://github.com/BilLogic/plus-uno/issues/701",
      door,
    );
  }
});

test("a typed or model ✅ leaves the ticket to the turn it ran in", async () => {
  // That turn's own row carries it (`usage/record.ts`); the staging turn's row
  // carrying it too would count one ticket twice.
  for (const door of ["typed", "model"] as const) {
    calls = [];
    const turns = (await usage()).createInMemoryUsageLog();
    const events = (await usage()).createInMemoryProposalEventLog({ turns });
    await turns.record(stagingTurn());
    await events.record(await stagedFor("C1:1700000000.000200"));
    const run = await executeVerdict();
    await run(githubEnv(), by(won(intake), door, "U0PRESSER1"), { events, now: CLOCK });
    assert.equal((await turns.get("C1:1700000000.000200"))?.selfFiledTicketUrl, null, door);
  }
});

test("if recording fails, the proposal still resolves normally", async () => {
  calls = [];
  appended = [];
  const broken: ProposalEventLog = {
    ...(await usage()).createInMemoryProposalEventLog(),
    async record() {
      throw new Error("D1 unavailable");
    },
    async noteSelfFiledTicket() {
      throw new Error("D1 unavailable");
    },
  };
  const run = await executeVerdict();
  await run(githubEnv(), by(won(intake), "reaction", "U0PRESSER1"), { events: broken, now: CLOCK });
  assert.ok(calls.some((c) => c.url === "https://api.github.com/repos/BilLogic/plus-uno/issues"), "the issue was filed");
  assert.ok(posts().some((p) => String(p.text).includes("issues/701")), "and the thread was told");
  assert.equal(appended.length, 1, "and the outcome was remembered");
});

function stagingTurn() {
  return {
    turnId: "C1:1700000000.000200",
    build: "r-test",
    requesterId: "U0REQUESTR1",
    surface: "channel" as const,
    inThread: true,
    channelId: "C1",
    askTs: "1700000000.000200",
    askedAt: 1_700_000_000_200,
    firstAnswerAt: 1_700_000_000_900,
    latencyMs: 700,
    tier: "default",
    routeReason: "default",
    provider: null,
    model: null,
    fallbackUsed: false,
    tokensIn: 0,
    tokensOut: 0,
    tokensThinking: 0,
    tokensCached: 0,
    costUsd: 0,
    toolsCalled: [],
    sourcesCited: [],
    disposition: "staged",
    proposalId: "1700000000.000300",
    stopUsed: false,
    selfFiledTicketUrl: null,
    testTraffic: false,
    conversationType: "channel" as const,
    requestText: null,
    subType: null,
    painCategory: null,
    classifiedAt: null,
  };
}

async function stagedFor(turnId: string) {
  const verdict = won(intake);
  return { ...(await usage()).stagedEvent({ proposal: verdict.proposal!, at: 0, via: "turn" as const, channelStored: true }), turnId };
}

// ── The self-serve record, after the person has been told ───────────────────

test("a budget stop in the task-completion write still posts the result and the history note", async () => {
  calls = [];
  appended = [];
  executionCalls = [];
  const { D1QueryBudgetError } = await import("../src/net.js");
  const writes: string[] = [];
  const USAGE_DB = {
    prepare: () => ({
      bind: () => ({
        run: async () => ({}),
        all: async () => ({ results: [] }),
        first: async () => {
          writes.push(`task_completed after ${posts().filter((p) => p.channel === "D0REQUESTER").length} result post(s)`);
          throw new D1QueryBudgetError(40);
        },
      }),
    }),
  };
  const run = await executeVerdict();
  await run(
    { ...env(), USAGE_DB } as unknown as Env,
    won([
      { toolName: "dm_relay", input: { recipient: "U0COCO0001", text: "one" } },
      { toolName: "dm_relay", input: { recipient: "U0COCO0002", text: "two" } },
    ]),
  );
  const result = posts().filter((p) => p.channel === "D0REQUESTER");
  assert.equal(result.length, 1, "the batch result was posted");
  assert.equal(result[0]!.thread_ts, "1700000000.000100");
  assert.ok(appended.some((a) => a.ref.channel === "D0REQUESTER"), "the history note was written");
  assert.deepEqual(writes, ["task_completed after 1 result post(s)"], "the write was tried, last");
  assert.ok(executionCalls.includes("end 1700000000.000300"));
});

// Body content the bot writes into Notion opens with whom it was written for,
// so a reader knows the words are the bot's and whom to ask about them.

const NOTION_ENV = { NOTION_API_KEY: "secret_test", NOTION_ROADMAP_DB_ID: "rdrdrdrdrdrdrdrdrdrdrdrdrdrdrdrd" };
const notionWrites = () =>
  calls
    .filter((c) => c.url.startsWith("https://api.notion.com/") && c.body !== null)
    .map((c) => ({ url: c.url, body: c.body! }));
/** The text of the first block in a list of Notion blocks. */
const firstText = (blocks: unknown): string => {
  const block = (blocks as Array<Record<string, unknown> & { type: string }>)[0]!;
  const runs = (block[block.type] as { rich_text?: Array<{ text?: { content?: string } }> }).rich_text ?? [];
  return runs.map((r) => r.text?.content ?? "").join("");
};

test("an approved Notion create opens its page with the requester's attribution line", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(NOTION_ENV),
    won([{ toolName: "notion_create", input: { surface: "intake", title: "Fix the tutor table", summary: "The table overflows." } }]),
  );
  const create = notionWrites().find((w) => w.url === "https://api.notion.com/v1/pages");
  assert.ok(create, "the page was created");
  assert.equal(firstText(create.body.children), "Written by le goat on behalf of Bill Guo");
});

test("an approved Notion append opens the appended blocks with the attribution line", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(NOTION_ENV),
    won([{ toolName: "notion_update", input: { page_url: SHARED_PAGE, append: { text: "Design review moved to Friday." } } }]),
  );
  const append = notionWrites().find((w) => w.url.endsWith("/children"));
  assert.ok(append, "the blocks were appended");
  assert.equal(firstText(append.body.children), "Written by le goat on behalf of Bill Guo");
  assert.equal(firstText((append.body.children as unknown[]).slice(1)), "Design review moved to Friday.");
});

test("a Worker-staged Notion create, with no requester of record, names whoever approved it", async () => {
  calls = [];
  const run = await executeVerdict();
  const staged = won([{ toolName: "notion_create", input: { surface: "prd", title: "A drafted card", summary: "From a to-do." } }]);
  const unowned: GateVerdict = {
    ...staged,
    proposal: { ...staged.proposal!, requesterUserId: "" },
    execute: { ...staged.execute!, requesterUserId: "" },
  };
  await run(env(NOTION_ENV), by(unowned, "button", "U0REQUESTR1"));
  const create = notionWrites().find((w) => w.url === "https://api.notion.com/v1/pages");
  assert.ok(create, "the page was created");
  assert.equal(firstText(create.body.children), "Written by le goat on behalf of Bill Guo");
});

test("a property-only Notion update writes no attribution: there is no body to attribute", async () => {
  calls = [];
  const run = await executeVerdict();
  await run(
    env(NOTION_ENV),
    won([{ toolName: "notion_update", input: { page_url: SHARED_PAGE, properties: { Priority: "High" } } }]),
  );
  const writes = notionWrites();
  assert.equal(writes.length, 1, JSON.stringify(writes));
  assert.deepEqual(Object.keys(writes[0]!.body), ["properties"]);
});
