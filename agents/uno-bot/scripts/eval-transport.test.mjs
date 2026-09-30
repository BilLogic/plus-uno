// The Worker adapter sends what the inline POST sent (#511).
//
// THE PROPERTY THIS FILE HOLDS: moving the turn behind a seam did not change
// the request. Same route, same debug header, same body keys — a surface a case
// sets (`channel` / `requestedBy`) still reaches the route, and a trailing
// slash on the origin still does not produce `//debug/eval`. The point of the
// seam is that the cron's numbers stay comparable across it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { workerTransport, TURN_TIMEOUT_MS } from "./eval-transport.mjs";

function recordingFetch(response = { ok: true, result: { kind: "text", text: "hi" } }) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { status: 200, headers: { get: () => "application/json" }, json: async () => response, text: async () => JSON.stringify(response) };
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

test("a turn is a POST to /debug/eval with the debug token and the turn's body", async () => {
  const fetchImpl = recordingFetch();
  const t = workerTransport("https://uno-bot.example.dev/", "tok-123", { fetchImpl });
  const resp = await t.runTurn({
    prompt: "what happens in Session Cancellation?",
    history: [{ role: "user", content: "earlier" }],
    pending: null,
    surface: { channel: "D123", requestedBy: "U456" },
  });

  assert.deepEqual(resp, { ok: true, result: { kind: "text", text: "hi" } });
  const [{ url, init }] = fetchImpl.calls;
  assert.equal(url, "https://uno-bot.example.dev/debug/eval", "the trailing slash is trimmed once");
  assert.equal(init.method, "POST");
  assert.equal(init.headers["x-debug-token"], "tok-123");
  assert.equal(init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(init.body), {
    prompt: "what happens in Session Cancellation?",
    history: [{ role: "user", content: "earlier" }],
    pending: null,
    channel: "D123",
    requestedBy: "U456",
  });
  assert.ok(init.signal, "the turn is abortable — agent turns can run for minutes");
  assert.equal(TURN_TIMEOUT_MS, 8 * 60_000);
  assert.match(t.name, /^worker https:\/\/uno-bot\.example\.dev$/);
});

test("a turn with no surface sends none, leaving the route's synthetic defaults", async () => {
  const fetchImpl = recordingFetch();
  const t = workerTransport("https://uno-bot.example.dev", "tok", { fetchImpl });
  await t.runTurn({ prompt: "hi", history: [], pending: null });
  const body = JSON.parse(fetchImpl.calls[0].init.body);
  assert.deepEqual(Object.keys(body).sort(), ["history", "pending", "prompt"]);
});

test("the adapter resolves run-time subjects through the same origin and token", async () => {
  const fetchImpl = recordingFetch({ ok: true, subject: { name: "Onboarding", scenario: "Onboarding" }, build: "r512" });
  const t = workerTransport("https://uno-bot.example.dev", "tok", { fetchImpl });
  const got = await t.fetchSubject("scenario-any");
  assert.deepEqual(got, { subject: { name: "Onboarding", scenario: "Onboarding" }, build: "r512" });
  assert.equal(
    fetchImpl.calls[0].url,
    "https://uno-bot.example.dev/debug/blueprint-subject?need=scenario-any",
  );
  assert.equal(fetchImpl.calls[0].init.headers["x-debug-token"], "tok");
});

// ── A reply that is not the envelope ──────────────────────────────────────────
// Live run 36694075577: six turns came back as Cloudflare's HTML error page,
// and the runner recorded only `Unexpected token '<'` — no status, no error
// code, no time. The page is Cloudflare's, not the Worker's (the Worker answers
// its own failures in JSON), so what it says about itself is the diagnosis.

function pageFetch({ status, body, headers = {} }) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return {
      status,
      headers: { get: (name) => headers[name.toLowerCase()] ?? null },
      text: async () => body,
    };
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

const CF_1102 = `<!DOCTYPE html>
<html><head><title>Worker exceeded resource limits | uno-bot.example.dev | Cloudflare</title></head>
<body><h1><span class="cf-error-type">Error</span> <span class="cf-error-code">1102</span></h1>
<p>Ray ID: <strong class="font-semibold">8c1f2a3b4d5e6f70</strong></p></body></html>`;

test("an HTML error page comes back as a failed turn that says what the page said", async () => {
  const fetchImpl = pageFetch({ status: 503, body: CF_1102, headers: { "content-type": "text/html; charset=UTF-8", "cf-ray": "8c1f2a3b4d5e6f70-IAD" } });
  const t = workerTransport("https://uno-bot.example.dev", "tok", { fetchImpl, now: (() => { let n = 0; return () => (n += 7_000); })() });
  const resp = await t.runTurn({ prompt: "hi", history: [], pending: null });

  assert.equal(resp.ok, false);
  assert.match(resp.error, /^HTTP 503, not JSON — Cloudflare error 1102 \(Worker exceeded resource limits\)/);
  assert.deepEqual(resp.http, {
    status: 503,
    nonJson: true,
    contentType: "text/html; charset=UTF-8",
    cfError: "1102",
    title: "Worker exceeded resource limits | uno-bot.example.dev | Cloudflare",
    ray: "8c1f2a3b4d5e6f70-IAD",
    ms: 7_000,
  });
  assert.equal("ms" in resp, false, "the top-level ms is the Worker's own turn time, and no turn ran to report one");
});

test("a non-JSON reply with no Cloudflare markings still names its status and its first words", async () => {
  const fetchImpl = pageFetch({ status: 502, body: "upstream connect error or disconnect/reset before headers" });
  const resp = await workerTransport("https://uno-bot.example.dev", "tok", { fetchImpl }).runTurn({ prompt: "hi", history: [], pending: null });
  assert.equal(resp.ok, false);
  assert.match(resp.error, /^HTTP 502, not JSON: upstream connect error/);
  assert.equal(resp.http.status, 502);
  assert.equal(resp.http.nonJson, true);
  assert.equal(resp.http.cfError, undefined);
});

test("a JSON envelope on a 5xx keeps its fields and gains the status", async () => {
  const fetchImpl = pageFetch({ status: 500, body: JSON.stringify({ ok: false, error: "probe threw" }) });
  const resp = await workerTransport("https://uno-bot.example.dev", "tok", { fetchImpl }).runTurn({ prompt: "hi", history: [], pending: null });
  assert.equal(resp.ok, false);
  assert.equal(resp.error, "probe threw");
  assert.equal(resp.http.status, 500);
  assert.equal(resp.http.nonJson, undefined);
});
