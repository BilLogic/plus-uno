// The shared fake Figma (#891, Seam 1) keeps the rules a job's test could
// trip over: a reply goes to a root only, a node takes 10 Dev Mode links and
// no URL twice, a team takes 20 webhooks, a passcode never reads back, and a
// comment is always the token owner's. A fake that let a job break those
// would pass a test the real Figma would fail.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { FigmaRequestError } from "../src/figma/client";
import { createInMemoryFigma } from "../src/figma/in-memory";
import { createFigmaRestClient } from "../src/figma/rest";
import { SubrequestBudgetError } from "../src/net";

const KEY = "AbC123xyz";
const FRAME = "158:21725";
const ME = { id: "1000000042", handle: "bill" };
const NOW = Date.UTC(2026, 8, 30, 14, 0);

function seeded() {
  const figma = createInMemoryFigma({ me: ME, now: () => NOW });
  figma.seedFile(KEY, {
    name: "Session Recap",
    nodes: { [FRAME]: { name: "Recap", type: "FRAME", children: [{ type: "TEXT", characters: "Share with tutor" }] } },
    versions: { versions: [{ id: "1", label: "Recap screens", description: "", created_at: "2026-09-20T10:00:00Z", user: { handle: "bea" } }] },
  });
  return figma;
}

const link = (url: string, node = FRAME) => ({ name: "🐐 le goat · Code: Recap", url, file_key: KEY, node_id: node });

describe("the shared fake Figma", () => {
  it("has every method the REST client has", () => {
    const inspectors = new Set(["seedFile", "seedTeam", "seedFolder", "seedWebhookRequests", "calls", "writes", "failNext"]);
    const methods = Object.keys(createInMemoryFigma()).filter((m) => !inspectors.has(m)).sort();
    assert.deepEqual(methods, Object.keys(createFigmaRestClient({ token: "x" })).sort());
  });

  it("answers reads from what was seeded, and null for a node the file does not hold", async () => {
    const figma = seeded();
    assert.equal((await figma.file(KEY)).name, "Session Recap");
    const nodes = await figma.nodes(KEY, [FRAME, "9:9"]);
    assert.equal(nodes.nodes?.[FRAME]?.document?.name, "Recap");
    assert.equal(nodes.nodes?.["9:9"], null);
    const images = await figma.images(KEY, [FRAME, "9:9"]);
    assert.match(images.images?.[FRAME] ?? "", /^https:\/\//);
    assert.equal(images.images?.["9:9"], null);
    assert.equal((await figma.versions(KEY)).versions?.[0]?.user?.handle, "bea");
    assert.deepEqual(await figma.components(KEY), { meta: { components: [] } });
  });

  it("changes only the fields a second seed names", async () => {
    const figma = seeded();
    figma.seedFile(KEY, { versions: { versions: [] } });
    assert.deepEqual(await figma.versions(KEY), { versions: [] });
    assert.equal((await figma.nodes(KEY, [FRAME])).nodes?.[FRAME]?.document?.name, "Recap");
  });

  it("404s a file, team or folder nobody seeded", async () => {
    const figma = seeded();
    await assert.rejects(figma.nodes("Unknown", [FRAME]), { status: 404 });
    await assert.rejects(figma.comments("Unknown"), { status: 404 });
    await assert.rejects(figma.teamFolders("1"), { status: 404 });
    await assert.rejects(figma.folderFiles("1"), { status: 404 });
  });

  it("lists seeded team folders and folder files", async () => {
    const figma = seeded();
    figma.seedTeam("1279226364199713409", [{ id: "10", name: "📐 Specs", parent_folder_id: null }]);
    figma.seedFolder("10", [{ key: KEY, name: "Card 412 · Session Recap", last_modified: "2026-09-29T12:00:00Z" }]);
    assert.deepEqual((await figma.teamFolders("1279226364199713409")).folders.map((f) => f.name), ["📐 Specs"]);
    assert.deepEqual((await figma.folderFiles("10")).files.map((f) => f.key), [KEY]);
  });
});

describe("comments in the fake", () => {
  it("posts as the token's owner, pinned where asked, and replies to a root", async () => {
    const figma = seeded();
    const root = await figma.postComment(KEY, "🐐 le goat (uno-bot) · AI-generated", { node_id: FRAME, node_offset: { x: 0, y: 0 } });
    assert.deepEqual(root.user, ME);
    assert.equal(root.client_meta?.node_id, FRAME);
    assert.equal(root.created_at, new Date(NOW).toISOString());
    const reply = await figma.replyToComment(KEY, root.id, "on it");
    assert.equal(reply.parent_id, root.id);
    assert.equal(reply.client_meta, null, "a reply inherits its root's pin");
    assert.deepEqual((await figma.comments(KEY)).comments.map((c) => c.message), ["🐐 le goat (uno-bot) · AI-generated", "on it"]);
  });

  it("refuses a reply to a reply, as Figma does, and a reply to nothing", async () => {
    const figma = seeded();
    const root = await figma.postComment(KEY, "root");
    const reply = await figma.replyToComment(KEY, root.id, "first");
    await assert.rejects(figma.replyToComment(KEY, reply.id, "nested"), { status: 400 });
    await assert.rejects(figma.replyToComment(KEY, "no-such-comment", "hi"), { status: 404 });
  });
});

describe("Dev Mode links in the fake", () => {
  it("takes ten on a node, and refuses the eleventh and a repeated URL on a 200", async () => {
    const figma = seeded();
    const ten = Array.from({ length: 10 }, (_, i) => link(`https://example.com/${i}`));
    assert.equal((await figma.addDevResources(ten)).links_created.length, 10);
    const more = await figma.addDevResources([link("https://example.com/eleventh"), link("https://example.com/0", "1:1")]);
    assert.deepEqual(more.links_created.map((l) => l.node_id), ["1:1"], "another node is fine");
    assert.deepEqual(more.errors.map((e) => e.error), ["The node already has the maximum of 10 dev resources"]);

    const again = await figma.addDevResources([link("https://example.com/0", "1:1")]);
    assert.deepEqual(again.errors.map((e) => e.error), ["Another dev resource for the node has the same url"]);
  });

  it("lists by node, and removes one", async () => {
    const figma = seeded();
    const { links_created: [first] } = await figma.addDevResources([link("https://example.com/a"), link("https://example.com/b", "1:1")]);
    assert.deepEqual((await figma.devResources(KEY, ["1:1"])).dev_resources.map((r) => r.url), ["https://example.com/b"]);
    await figma.removeDevResource(KEY, first!.id);
    assert.deepEqual((await figma.devResources(KEY)).dev_resources.map((r) => r.url), ["https://example.com/b"]);
    await assert.rejects(figma.removeDevResource(KEY, first!.id), { status: 404 });
  });
});

describe("webhooks in the fake", () => {
  const hook = (n: number) => ({
    event_type: "FILE_COMMENT" as const,
    context: "team" as const,
    context_id: "1279226364199713409",
    endpoint: `https://uno-bot.example/figma/${n}`,
    passcode: "never-read-back",
  });

  it("takes twenty on a team, and refuses the twenty-first", async () => {
    const figma = seeded();
    for (let i = 0; i < 20; i++) await figma.createWebhook(hook(i));
    await assert.rejects(figma.createWebhook(hook(20)), { status: 400 });
    assert.equal((await figma.teamWebhooks("1279226364199713409")).webhooks.length, 20);
  });

  it("never reads a passcode back", async () => {
    const figma = seeded();
    assert.equal((await figma.createWebhook(hook(0))).passcode, "");
    assert.deepEqual((await figma.teamWebhooks("1279226364199713409")).webhooks.map((w) => w.passcode), [""]);
  });

  it("answers a webhook's deliveries as seeded, none for a new one, and 404 for an unknown one", async () => {
    const figma = seeded();
    const made = await figma.createWebhook(hook(0));
    assert.deepEqual((await figma.webhookRequests(made.id)).requests, []);
    const ping = {
      webhook_id: made.id,
      request_info: { sent_at: "2026-10-05T14:00:00Z", payload: { event_type: "PING" } },
      response_info: { status: 200 },
    };
    figma.seedWebhookRequests(made.id, [ping]);
    assert.deepEqual((await figma.webhookRequests(made.id)).requests, [ping]);
    await assert.rejects(figma.webhookRequests("no-such-webhook"), { status: 404 });
  });
});

describe("what the fake reports", () => {
  it("records every call, and only the writes that landed", async () => {
    const figma = seeded();
    await figma.comments(KEY);
    const root = await figma.postComment(KEY, "root");
    await assert.rejects(figma.replyToComment(KEY, "no-such-comment", "hi"), FigmaRequestError);
    await figma.replyToComment(KEY, root.id, "reply");
    assert.deepEqual(figma.calls().map((c) => c.method), ["comments", "postComment", "replyToComment", "replyToComment"]);
    assert.deepEqual(figma.writes(), [
      { method: "postComment", args: [KEY, "root", undefined, undefined] },
      { method: "replyToComment", args: [KEY, root.id, "reply", undefined] },
    ]);
  });

  it("throws a queued failure once, then answers again", async () => {
    const figma = seeded();
    const stop = new SubrequestBudgetError(38);
    figma.failNext("versions", stop);
    await assert.rejects(figma.versions(KEY), (err: unknown) => err === stop);
    assert.equal((await figma.versions(KEY)).versions?.length, 1);
  });

  it("hands out copies, so a test cannot reach into it through a value it kept", async () => {
    const figma = seeded();
    const versions = await figma.versions(KEY);
    versions.versions!.length = 0;
    assert.equal((await figma.versions(KEY)).versions?.length, 1);
  });
});
