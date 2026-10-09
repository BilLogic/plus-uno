// One stubbed `fetch` for tests that drive a Notion write, plus Slack's
// chat.postMessage for the line a tool posts afterwards.
//
// HOW THE FETCH IS INJECTED. `net.ts` captures the real `fetch` at module
// evaluation and routes every outbound call through it (ADR-022), so the seam
// is module LOAD order: importing this file puts the stub onto `globalThis`,
// and a test file imports the code under test lazily, inside each test, which
// is what evaluates `net.ts` against the stub. Nothing reaches a real API.
//
// It is installed ONCE, with a swappable routing table: `net.ts` binds fetch
// at its first evaluation and nothing re-evaluates it, so a second stub
// installed later would never be reached. Per-test isolation comes from
// `serve`, which swaps the routes and clears the logs.

export interface Call {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
}

export type Reply = { status?: number; body: unknown };

/** Keyed "METHOD url-fragment", e.g. "PATCH /blocks/abc". */
export type Routes = Record<string, Reply>;

let routes: Routes = {};

/** Every routed request, in order. Slack posts are kept apart, on `posted`. */
export let calls: Call[] = [];

/** The `text` of every chat.postMessage, in order. */
export let posted: string[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const method = (init?.method ?? "GET").toUpperCase();
  const body = typeof init?.body === "string" ? parseBody(init.body) : null;
  if (url.includes("slack.com/api/chat.postMessage")) {
    posted.push(typeof body?.text === "string" ? body.text : "");
    return Response.json({ ok: true, ts: "1700000000.000100" });
  }
  calls.push({ url, method, body });
  const key = Object.keys(routes).find((k) => {
    const [m, suffix] = k.split(" ");
    return m === method && url.includes(suffix!);
  });
  // An unrouted call is a FAILED test, never a default reply: "the write never
  // happened" is the assertion in half of these, and a permissive stub would
  // let a real write slip past it unnoticed.
  if (!key) throw new Error(`no stub route for ${method} ${url}`);
  const reply = routes[key]!;
  return new Response(JSON.stringify(reply.body), {
    status: reply.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

/** A JSON body as an object, or null for a form body (an OAuth token call). */
function parseBody(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Point the stub at this test's routes and forget the previous logs. */
export function serve(next: Routes): void {
  routes = next;
  calls = [];
  posted = [];
}
