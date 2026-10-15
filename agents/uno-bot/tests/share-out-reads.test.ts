// What a share-out to a named channel reads of Slack, and what each read costs.
// The Worker runs on a fixed 50-subrequest cap, so every call here is counted.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

const calls: string[] = [];
let listPages: Array<{ channels: unknown[]; next?: string }> = [];

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  const method = url.pathname.replace("/api/", "");
  calls.push(method);
  const channel = url.searchParams.get("channel");
  if (method === "conversations.info") {
    if (channel === "C0CRIT0001") {
      return Response.json({ ok: true, channel: { id: "C0CRIT0001", name: "design-crit", is_private: false, is_member: false } });
    }
    if (channel === "C0FLAKY001") return Response.json({ ok: false, error: "ratelimited" });
    return Response.json({ ok: false, error: "channel_not_found" });
  }
  if (method === "conversations.list") {
    const page = Number(url.searchParams.get("cursor") ?? "0");
    const { channels, next } = listPages[page] ?? { channels: [] };
    return Response.json({ ok: true, channels, response_metadata: { next_cursor: next ?? "" } });
  }
  if (method === "conversations.members") return Response.json({ ok: true, members: ["U_ASKER"] });
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

const env = { SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env;
const readsFor = async () => (await import("../src/tools/share-for-feedback.js")).shareoutReadsFor(env);

describe("the Slack reads behind a share-out to a named channel", () => {
  beforeEach(() => {
    calls.length = 0;
    listPages = [];
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

  it("finds a channel by name on the first page of conversations.list", async () => {
    listPages = [{ channels: [{ id: "C0X", name: "other" }, { id: "C0CRIT0001", name: "design-crit", is_private: false }], next: "1" }];
    const reads = await readsFor();
    const found = await reads.channelByName("design-crit");
    assert.equal(typeof found === "object" && found.id, "C0CRIT0001");
    assert.deepEqual(calls, ["conversations.list"]);
  });

  it("reads at most two pages of channels, and says it could not look further", async () => {
    listPages = [
      { channels: [{ id: "C0A", name: "a" }], next: "1" },
      { channels: [{ id: "C0B", name: "b" }], next: "2" },
      { channels: [{ id: "C0CRIT0001", name: "design-crit" }] },
    ];
    const reads = await readsFor();
    assert.equal(await reads.channelByName("design-crit"), "failed");
    assert.deepEqual(calls, ["conversations.list", "conversations.list"]);
  });

  it("reads a name the whole list lacks as missing", async () => {
    listPages = [{ channels: [{ id: "C0A", name: "a" }] }];
    const reads = await readsFor();
    assert.equal(await reads.channelByName("hidden"), "missing");
  });

  it("reads each channel and member list once, however often it is asked", async () => {
    listPages = [{ channels: [{ id: "C0CRIT0001", name: "design-crit" }] }];
    const reads = await readsFor();
    await reads.channelByName("design-crit");
    await reads.channelByName("design-crit");
    await reads.channelById("C0CRIT0001");
    await reads.channelById("C0CRIT0001");
    assert.deepEqual(await reads.members("C0CRIT0001"), ["U_ASKER"]);
    await reads.members("C0CRIT0001");
    // The name's lookup answers for its id too.
    assert.deepEqual(calls, ["conversations.list", "conversations.members"]);
  });
});
