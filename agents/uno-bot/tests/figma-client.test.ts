// The Figma client over REST (#892), driven over a scripted transport: what
// each method sends, how a 429, a 5xx and a network failure are retried, how
// each tier is paced, and that a budget stop is never swallowed.
//
// No test sleeps. The client is handed a clock and a sleep that moves it, so
// "waited 12 s" is read off the clock at each send.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { FigmaRateLimitError, FigmaRequestError, type FigmaClient } from "../src/figma/client";
import { createFigmaRestClient, FIGMA_PER_MINUTE, UNO_SHARE_PER_MINUTE } from "../src/figma/rest";
import { figmaClientFor } from "../src/figma/production";
import { SubrequestBudgetError } from "../src/net";
import type { Env } from "../src/types";

const TOKEN = "figd_test-token";
const KEY = "zAecJNRdvJzAUOcjV32tRX";
const A = "158:21725";
const B = "200:1";
const API = "https://api.figma.com";

interface Sent {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  timeoutMs: number | undefined;
  /** The clock when it was sent. */
  at: number;
}

/**
 * A REST client whose transport answers from `replies`, in order, then `{}`.
 * Its sleep moves the clock, unless `frozen` — for calls made together, where
 * one call's sleep would otherwise move the clock under the others.
 */
function scripted(replies: Array<Response | Error> = [], opts: { frozen?: boolean } = {}) {
  const clock = { t: 0 };
  const sent: Sent[] = [];
  const sleeps: number[] = [];
  const figma = createFigmaRestClient({
    token: TOKEN,
    now: () => clock.t,
    async sleep(ms) {
      sleeps.push(ms);
      if (!opts.frozen) clock.t += ms;
    },
    async transport(url, init, timeoutMs) {
      sent.push({
        url,
        method: init.method ?? "GET",
        headers: Object.fromEntries(new Headers(init.headers).entries()),
        body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
        timeoutMs,
        at: clock.t,
      });
      const next = replies.shift() ?? json({});
      if (next instanceof Error) throw next;
      return next;
    },
  });
  return { figma, sent, sleeps, clock };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

/** Figma's 429, with the headers its rate-limits page documents. */
function tooMany(retryAfter?: string): Response {
  return json({ status: 429, err: "Rate limit exceeded" }, 429, {
    ...(retryAfter === undefined ? {} : { "retry-after": retryAfter }),
    "x-figma-plan-tier": "pro",
    "x-figma-rate-limit-type": "low",
  });
}

// ── What each method sends ───────────────────────────────────────────────────

interface Shape {
  method: keyof FigmaClient;
  call(figma: FigmaClient): Promise<unknown>;
  send: { method: string; url: string; body?: unknown };
  reply?: Response;
}

const LINK = { name: "🐐 le goat · Code: Badge", url: "https://github.com/BilLogic/plus-uno/tree/main/x", file_key: KEY, node_id: A };
const WEBHOOK = {
  event_type: "FILE_COMMENT" as const,
  context: "team" as const,
  context_id: "1279226364199713409",
  endpoint: "https://uno-bot.example/figma/webhook",
  passcode: "a-passcode",
  status: "PAUSED" as const,
};

const SHAPES: Shape[] = [
  { method: "file", call: (f) => f.file(KEY, { depth: 2 }), send: { method: "GET", url: `${API}/v1/files/${KEY}?depth=2` } },
  {
    method: "nodes",
    call: (f) => f.nodes(KEY, [A, B], { geometry: "paths" }),
    send: { method: "GET", url: `${API}/v1/files/${KEY}/nodes?ids=158%3A21725,200%3A1&geometry=paths` },
  },
  {
    method: "images",
    call: (f) => f.images(KEY, [A], { format: "png", scale: 1 }),
    send: { method: "GET", url: `${API}/v1/images/${KEY}?ids=158%3A21725&format=png&scale=1` },
  },
  { method: "components", call: (f) => f.components(KEY), send: { method: "GET", url: `${API}/v1/files/${KEY}/components` } },
  { method: "versions", call: (f) => f.versions(KEY), send: { method: "GET", url: `${API}/v1/files/${KEY}/versions` } },
  { method: "comments", call: (f) => f.comments(KEY), send: { method: "GET", url: `${API}/v1/files/${KEY}/comments` } },
  {
    method: "postComment",
    call: (f) => f.postComment(KEY, "🐐 le goat (uno-bot) · AI-generated", { node_id: A, node_offset: { x: 4, y: 8 } }),
    send: {
      method: "POST",
      url: `${API}/v1/files/${KEY}/comments`,
      body: { message: "🐐 le goat (uno-bot) · AI-generated", client_meta: { node_id: A, node_offset: { x: 4, y: 8 } } },
    },
  },
  {
    method: "replyToComment",
    call: (f) => f.replyToComment(KEY, "1234", "on it"),
    send: { method: "POST", url: `${API}/v1/files/${KEY}/comments`, body: { message: "on it", comment_id: "1234" } },
  },
  {
    method: "teamFolders",
    call: (f) => f.teamFolders("1279226364199713409"),
    send: { method: "GET", url: `${API}/v2/teams/1279226364199713409/folders` },
  },
  { method: "folderFiles", call: (f) => f.folderFiles("98765"), send: { method: "GET", url: `${API}/v2/folders/98765/files` } },
  {
    method: "devResources",
    call: (f) => f.devResources(KEY, [A]),
    send: { method: "GET", url: `${API}/v1/files/${KEY}/dev_resources?node_ids=158%3A21725` },
  },
  {
    method: "addDevResources",
    call: (f) => f.addDevResources([LINK]),
    send: { method: "POST", url: `${API}/v1/dev_resources`, body: { dev_resources: [LINK] } },
  },
  {
    method: "removeDevResource",
    call: (f) => f.removeDevResource(KEY, "dev 1"),
    send: { method: "DELETE", url: `${API}/v1/files/${KEY}/dev_resources/dev%201` },
    reply: new Response(null, { status: 204 }),
  },
  {
    method: "teamWebhooks",
    call: (f) => f.teamWebhooks("1279226364199713409"),
    send: { method: "GET", url: `${API}/v2/webhooks?context=team&context_id=1279226364199713409` },
  },
  { method: "createWebhook", call: (f) => f.createWebhook(WEBHOOK), send: { method: "POST", url: `${API}/v2/webhooks`, body: WEBHOOK } },
];

describe("what each Figma call sends", () => {
  it("covers every method the client has", () => {
    const methods = Object.keys(createFigmaRestClient({ token: TOKEN })).sort();
    assert.deepEqual([...new Set(SHAPES.map((s) => s.method))].sort(), methods);
  });

  for (const shape of SHAPES) {
    it(`${shape.method} sends ${shape.send.method} ${shape.send.url.slice(API.length)}`, async () => {
      const { figma, sent } = scripted(shape.reply ? [shape.reply] : []);
      await shape.call(figma);
      assert.equal(sent.length, 1);
      const [one] = sent;
      assert.equal(one!.method, shape.send.method);
      assert.equal(one!.url, shape.send.url);
      assert.equal(one!.headers["x-figma-token"], TOKEN);
      assert.deepEqual(one!.body, shape.send.body);
      assert.equal(one!.headers["content-type"], shape.send.body === undefined ? undefined : "application/json");
    });
  }

  it("lists a file's Dev Mode links without a filter when no node is named", async () => {
    const { figma, sent } = scripted();
    await figma.devResources(KEY);
    assert.equal(sent[0]!.url, `${API}/v1/files/${KEY}/dev_resources`);
  });

  it("posts an unpinned comment with no client_meta", async () => {
    const { figma, sent } = scripted();
    await figma.postComment(KEY, "hello");
    assert.deepEqual(sent[0]!.body, { message: "hello" });
  });

  it("encodes a pasted node id, so it cannot add a parameter of its own", async () => {
    const { figma, sent } = scripted();
    await figma.nodes(KEY, ["1:2&depth=1"]);
    assert.equal(sent[0]!.url, `${API}/v1/files/${KEY}/nodes?ids=1%3A2%26depth%3D1`);
  });

  it("bounds an attempt at 15 s, unless the caller says otherwise", async () => {
    const { figma, sent } = scripted();
    await figma.versions(KEY);
    await figma.nodes(KEY, [A], { timeoutMs: 8000 });
    assert.deepEqual(sent.map((s) => s.timeoutMs), [15000, 8000]);
  });
});

// ── A 429 ────────────────────────────────────────────────────────────────────

describe("a 429 from Figma", () => {
  it("waits out its Retry-After, then answers", async () => {
    const { figma, sent } = scripted([tooMany("7"), json({ nodes: {} })]);
    await figma.nodes(KEY, [A]);
    assert.deepEqual(sent.map((s) => s.at), [0, 7000]);
  });

  it("backs off a second when Figma gives no Retry-After", async () => {
    const { figma, sent } = scripted([tooMany(), json({ nodes: {} })]);
    await figma.nodes(KEY, [A]);
    assert.deepEqual(sent.map((s) => s.at), [0, 1000]);
  });

  it("is retried on a POST too: Figma refused before acting", async () => {
    const { figma, sent } = scripted([tooMany("2"), json({ id: "1" })]);
    await figma.postComment(KEY, "hello");
    assert.equal(sent.length, 2);
  });

  it("gives up after three, with what Figma's headers said", async () => {
    const { figma, sent } = scripted([tooMany("1"), tooMany("1"), tooMany("1")]);
    await assert.rejects(figma.nodes(KEY, [A]), (err: unknown) => {
      assert.ok(err instanceof FigmaRateLimitError);
      assert.equal(err.status, 429);
      assert.equal(err.retryAfterMs, 1000);
      assert.equal(err.planTier, "pro");
      assert.equal(err.rateLimitType, "low");
      assert.match(err.message, /^Figma nodes 429: rate limited, retry after 1s$/);
      return true;
    });
    // The second waits the Retry-After. A 429 also empties the tier, so the
    // third waits for the tier's pace — one Tier 1 call per 12 s.
    assert.deepEqual(sent.map((s) => s.at), [0, 1000, 13000]);
  });

  it("fails at once, unslept, when its Retry-After is past the call's wait", async () => {
    const { figma, sent, sleeps } = scripted([tooMany("3600")]);
    await assert.rejects(figma.nodes(KEY, [A]), (err: unknown) => err instanceof FigmaRateLimitError && err.retryAfterMs === 3_600_000);
    assert.equal(sent.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it("is sent once when the caller allows one attempt", async () => {
    const { figma, sent, sleeps } = scripted([tooMany("1")]);
    await assert.rejects(figma.images(KEY, [A], { attempts: 1 }), FigmaRateLimitError);
    assert.equal(sent.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it("pauses the tier, so the next call waits too — and leaves the other tiers alone", async () => {
    const { figma, sent } = scripted([tooMany("30")]);
    await assert.rejects(figma.nodes(KEY, [A], { attempts: 1 }), FigmaRateLimitError);
    await figma.versions(KEY);
    await figma.nodes(KEY, [A]);
    assert.deepEqual(
      sent.map((s) => [s.url.slice(API.length).split("?")[0], s.at]),
      [
        [`/v1/files/${KEY}/nodes`, 0],
        [`/v1/files/${KEY}/versions`, 0],
        [`/v1/files/${KEY}/nodes`, 30000],
      ],
    );
  });
});

// ── Other failures ───────────────────────────────────────────────────────────

describe("other Figma failures", () => {
  it("retries a 5xx on a GET, after 1 s then 2 s", async () => {
    const { figma, sent } = scripted([json({}, 502), json({}, 503), json({ versions: [] })]);
    assert.deepEqual(await figma.versions(KEY), { versions: [] });
    assert.deepEqual(sent.map((s) => s.at), [0, 1000, 3000]);
  });

  it("never retries a 5xx on a write — the comment may have landed", async () => {
    const { figma, sent } = scripted([json({ status: 500, err: "Internal error" }, 500)]);
    await assert.rejects(figma.postComment(KEY, "hello"), (err: unknown) => {
      assert.ok(err instanceof FigmaRequestError && !(err instanceof FigmaRateLimitError));
      assert.equal(err.status, 500);
      assert.equal(err.message, "Figma comment post 500: Internal error");
      return true;
    });
    assert.equal(sent.length, 1);
  });

  it("retries a network failure on a GET, and not on a write", async () => {
    const read = scripted([new TypeError("network connection lost"), json({ comments: [] })]);
    assert.deepEqual(await read.figma.comments(KEY), { comments: [] });
    assert.equal(read.sent.length, 2);

    const write = scripted([new TypeError("network connection lost")]);
    await assert.rejects(write.figma.replyToComment(KEY, "1", "hi"), (err: unknown) => {
      assert.ok(err instanceof FigmaRequestError);
      assert.equal(err.status, 0);
      assert.equal(err.message, "Figma comment reply failed: network connection lost");
      return true;
    });
    assert.equal(write.sent.length, 1);
  });

  it("throws a 403 or a 404 at once, saying what Figma said", async () => {
    const forbidden = scripted([json({ status: 403, err: "Invalid token" }, 403)]);
    await assert.rejects(forbidden.figma.nodes(KEY, [A]), { status: 403, message: "Figma nodes 403: Invalid token" });
    assert.equal(forbidden.sent.length, 1);

    const missing = scripted([json({ status: 404, error: true, message: "Not found" }, 404)]);
    await assert.rejects(missing.figma.components(KEY), { status: 404, message: "Figma components 404: Not found" });
    assert.equal(missing.sent.length, 1);
  });

  it("passes a budget stop straight through, unretried and unwrapped", async () => {
    const stop = new SubrequestBudgetError(38);
    const { figma, sent, sleeps } = scripted([stop]);
    await assert.rejects(figma.versions(KEY), (err: unknown) => err === stop);
    assert.equal(sent.length, 1);
    assert.deepEqual(sleeps, []);
  });

  it("reads a 200 carrying an err as a refusal", async () => {
    const { figma } = scripted([json({ err: "Render timeout", images: {} })]);
    await assert.rejects(figma.images(KEY, [A]), { status: 200, message: "Figma images 200: Render timeout" });
  });

  it("returns a partial Dev Mode refusal as the 200 it is", async () => {
    const created = { links_created: [{ ...LINK, id: "1" }], errors: [{ file_key: KEY, node_id: B, error: "Another dev resource for the node has the same url" }] };
    const { figma } = scripted([json(created)]);
    assert.deepEqual(await figma.addDevResources([LINK, { ...LINK, node_id: B }]), created);
  });

  it("returns nothing for a DELETE", async () => {
    const { figma } = scripted([new Response(null, { status: 204 })]);
    assert.equal(await figma.removeDevResource(KEY, "1"), undefined);
  });
});

// ── Pacing ───────────────────────────────────────────────────────────────────

describe("pacing against the shared budget", () => {
  it("takes half of Figma's limit in every tier", () => {
    for (const tier of [1, 2, 3] as const) {
      assert.equal(UNO_SHARE_PER_MINUTE[tier], Math.floor(FIGMA_PER_MINUTE[tier] / 2));
    }
  });

  it("sends five Tier 1 calls at once, and the sixth 12 s later", async () => {
    const { figma, sent } = scripted();
    for (let i = 0; i < 6; i++) await figma.nodes(KEY, [A]);
    assert.deepEqual(sent.map((s) => s.at), [0, 0, 0, 0, 0, 12000]);
  });

  it("queues calls made together behind one another", async () => {
    // All seven take their slot at t=0, before any of them awaits.
    const { figma, sent, sleeps } = scripted([], { frozen: true });
    await Promise.all(Array.from({ length: 7 }, () => figma.nodes(KEY, [A])));
    assert.equal(sent.length, 7);
    assert.deepEqual(sleeps, [12000, 24000], "five go at once, then one every 12 s");
  });

  it("paces each tier on its own budget", async () => {
    const { figma, sent } = scripted();
    for (let i = 0; i < 5; i++) await figma.nodes(KEY, [A]);
    await figma.versions(KEY);
    await figma.components(KEY);
    assert.deepEqual(sent.map((s) => s.at), [0, 0, 0, 0, 0, 0, 0]);
  });

  it("refuses a slot past the call's wait at once, and leaves the slot for the next call", async () => {
    const { figma, sent, sleeps } = scripted();
    for (let i = 0; i < 5; i++) await figma.nodes(KEY, [A]);
    await assert.rejects(figma.images(KEY, [A], { maxWaitMs: 0 }), (err: unknown) => {
      assert.ok(err instanceof FigmaRateLimitError);
      assert.equal(err.retryAfterMs, 12000);
      assert.equal(err.planTier, null, "the client refused it, not Figma");
      assert.match(err.message, /^Figma images: paced/);
      return true;
    });
    assert.equal(sent.length, 5, "the refused call was never sent");
    assert.deepEqual(sleeps, []);
    await figma.nodes(KEY, [A]);
    assert.equal(sent[5]!.at, 12000, "the next call waits one slot, not two");
  });
});

// ── One client per Env ───────────────────────────────────────────────────────

describe("the Worker's client", () => {
  it("is one client per Env, so every caller shares its buckets", () => {
    const env = { FIGMA_ACCESS_TOKEN: TOKEN } as unknown as Env;
    const client = figmaClientFor(env);
    assert.ok(client);
    assert.equal(figmaClientFor(env), client);
    assert.notEqual(figmaClientFor({ FIGMA_ACCESS_TOKEN: TOKEN } as unknown as Env), client);
  });

  it("is none without a token", () => {
    assert.equal(figmaClientFor({ FIGMA_ACCESS_TOKEN: "" } as unknown as Env), undefined);
  });
});
