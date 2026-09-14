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
    return { status: 200, json: async () => response };
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
