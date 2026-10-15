// What a share-out to a named channel reads of Slack, and what each read costs.
// The Worker runs on a fixed 50-subrequest cap, so every call here is counted,
// and every name lookup is held to the bound SHAREOUT_CHANNEL_CHECK_COST
// reserves for it.
//
// The fake Slack pages lazily, as the real one does: a page can hold far fewer
// channels than the limit asked for — none at all — and still carry a cursor.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

type Page = { channels: unknown[]; next?: string } | { status: number; body: unknown };

const calls: string[] = [];
const params: URLSearchParams[] = [];
const warnings: string[] = [];
/** The bot's own channels (users.conversations), page by page. */
let botPages: Page[] = [];
/** The public channels (conversations.list), page by page. */
let listPages: Page[] = [];

function pageOf(pages: Page[], cursor: string | null): Response {
  const page = pages[Number(cursor ?? "0")] ?? { channels: [] };
  if ("status" in page) return Response.json(page.body, { status: page.status });
  return Response.json({ ok: true, channels: page.channels, response_metadata: { next_cursor: page.next ?? "" } });
}

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  const method = url.pathname.replace("/api/", "");
  calls.push(method);
  params.push(url.searchParams);
  const channel = url.searchParams.get("channel");
  if (method === "conversations.info") {
    if (channel === "C0CRIT0001") {
      return Response.json({ ok: true, channel: { id: "C0CRIT0001", name: "design-crit", is_private: false, is_member: false } });
    }
    if (channel === "C0FLAKY001") return Response.json({ ok: false, error: "ratelimited" });
    return Response.json({ ok: false, error: "channel_not_found" });
  }
  if (method === "users.conversations") return pageOf(botPages, url.searchParams.get("cursor"));
  if (method === "conversations.list") return pageOf(listPages, url.searchParams.get("cursor"));
  if (method === "conversations.members") return Response.json({ ok: true, members: ["U_ASKER"] });
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

const env = { SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env;
const load = () => import("../src/tools/share-for-feedback.js");
const readsFor = async () => (await load()).shareoutReadsFor(env);
/** The calls so far stay inside what the budget guard reserves for a name. */
const withinBudget = async () => {
  const { SHAREOUT_CHANNEL_CHECK_COST } = await load();
  const { MEMBER_PAGES } = await import("../src/slack/channel-members.js");
  assert.ok(calls.length <= SHAREOUT_CHANNEL_CHECK_COST - MEMBER_PAGES, `${calls.length} calls: ${calls.join(", ")}`);
};
const RATELIMITED: Page = { status: 429, body: { ok: false, error: "ratelimited" } };
const empty = (next: string): Page => ({ channels: [], next });
const endless = (): Page[] => Array.from({ length: 20 }, (_, i) => empty(String(i + 1)));

describe("the Slack reads behind a share-out to a named channel", () => {
  const warn = console.warn;
  beforeEach(() => {
    calls.length = 0;
    params.length = 0;
    warnings.length = 0;
    botPages = [];
    listPages = [];
    console.warn = (...args: unknown[]) => void warnings.push(args.map(String).join(" "));
  });
  afterEach(() => {
    console.warn = warn;
  });

  it("reads a channel by id in one conversations.info", async () => {
    const reads = await readsFor();
    assert.deepEqual(await reads.channelById("C0CRIT0001"), {
      id: "C0CRIT0001",
      name: "design-crit",
      kind: "channel",
      isPrivate: false,
      isArchived: false,
      botIsMember: false,
    });
    assert.deepEqual(calls, ["conversations.info"]);
  });

  it("reads a channel Slack does not show the bot as missing, and a failed read as failed", async () => {
    const reads = await readsFor();
    assert.equal(await reads.channelById("G0HIDDEN01"), "missing");
    assert.equal(await reads.channelById("C0FLAKY001"), "failed");
  });

  it("finds a channel the bot is in among its own channels, in one read", async () => {
    botPages = [{ channels: [{ id: "C0X", name: "other" }, { id: "C0SANDBOX1", name: "uno-bot-sandbox", is_private: false }], next: "1" }];
    const reads = await readsFor();
    assert.deepEqual(await reads.channelByName("uno-bot-sandbox"), {
      id: "C0SANDBOX1",
      name: "uno-bot-sandbox",
      kind: "channel",
      isPrivate: false,
      isArchived: false,
      botIsMember: true,
    });
    assert.deepEqual(calls, ["users.conversations"]);
    assert.equal(params[0]!.get("types"), "public_channel,private_channel");
    assert.equal(params[0]!.get("exclude_archived"), "true");
    await withinBudget();
  });

  it("follows the bot's own channels past an empty page that still has a cursor", async () => {
    botPages = [empty("1"), { channels: [{ id: "G0SECRET01", name: "secret-room", is_private: true }] }];
    const reads = await readsFor();
    const found = await reads.channelByName("secret-room");
    assert.equal(typeof found === "object" && found.id, "G0SECRET01");
    assert.deepEqual(calls, ["users.conversations", "users.conversations"]);
    await withinBudget();
  });

  it("finds a public channel the bot is not in among the public channels, past short and empty pages", async () => {
    botPages = [{ channels: [{ id: "C0X", name: "other" }] }];
    listPages = [empty("1"), { channels: [{ id: "C0A", name: "a" }], next: "2" }, { channels: [{ id: "C0CRIT0001", name: "design-crit" }] }];
    const reads = await readsFor();
    assert.deepEqual(await reads.channelByName("design-crit"), {
      id: "C0CRIT0001",
      name: "design-crit",
      kind: "channel",
      isPrivate: false,
      isArchived: false,
      botIsMember: false,
    });
    assert.deepEqual(calls, ["users.conversations", "conversations.list", "conversations.list", "conversations.list"]);
    // Public channels only: Slack shows the bot no private channel it is not in.
    for (const p of params.slice(1)) assert.equal(p.get("types"), "public_channel");
    await withinBudget();
  });

  it("reads a name both whole lists lack as missing, and logs nothing", async () => {
    botPages = [{ channels: [{ id: "C0X", name: "other" }] }];
    listPages = [empty("1"), { channels: [{ id: "C0A", name: "a" }] }];
    const reads = await readsFor();
    assert.equal(await reads.channelByName("no-such-channel-xyz"), "missing");
    assert.deepEqual(calls, ["users.conversations", "conversations.list", "conversations.list"]);
    assert.deepEqual(warnings, []);
    await withinBudget();
  });

  it("stops at its page bound on the public channels, and says the list ran on", async () => {
    botPages = [{ channels: [{ id: "C0X", name: "other" }] }];
    listPages = endless();
    const reads = await readsFor();
    assert.equal(await reads.channelByName("design-crit"), "unfinished");
    assert.ok(calls.filter((c) => c === "conversations.list").length > 1);
    await withinBudget();
  });

  it("says the lists ran on when the bot's own channels ran past their bound", async () => {
    botPages = endless();
    listPages = [{ channels: [{ id: "C0A", name: "a" }] }];
    const reads = await readsFor();
    assert.equal(await reads.channelByName("secret-room"), "unfinished");
    await withinBudget();
  });

  it("reads a rate limit as failed, and says why in the log", async () => {
    botPages = [RATELIMITED];
    const reads = await readsFor();
    assert.equal(await reads.channelByName("design-crit"), "failed");
    assert.deepEqual(calls, ["users.conversations"]);
    assert.ok(warnings.some((w) => /#design-crit/.test(w) && /ratelimited/.test(w)), warnings.join("\n"));
    await withinBudget();
  });

  it("reads a Slack error on the public list as failed, and says which in the log", async () => {
    botPages = [{ channels: [] }];
    listPages = [empty("1"), { status: 200, body: { ok: false, error: "missing_scope" } }];
    const reads = await readsFor();
    assert.equal(await reads.channelByName("design-crit"), "failed");
    assert.ok(warnings.some((w) => /#design-crit/.test(w) && /missing_scope/.test(w)), warnings.join("\n"));
    await withinBudget();
  });

  it("reads each channel and member list once, however often it is asked", async () => {
    botPages = [{ channels: [{ id: "C0CRIT0001", name: "design-crit" }] }];
    const reads = await readsFor();
    await reads.channelByName("design-crit");
    await reads.channelByName("design-crit");
    await reads.channelById("C0CRIT0001");
    await reads.channelById("C0CRIT0001");
    assert.deepEqual(await reads.members("C0CRIT0001"), ["U_ASKER"]);
    await reads.members("C0CRIT0001");
    // The name's lookup answers for its id too.
    assert.deepEqual(calls, ["users.conversations", "conversations.members"]);
  });
});
