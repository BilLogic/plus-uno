// Install before net.ts captures fetch. This test process reaches only the
// Slack HTTP seam, with a test token; no call falls through to the network.
//
// It refuses what Slack's `chat.update` refuses on length: a `text` past 4,000
// characters is `msg_too_long` (Slack's method reference, read 2026-10-17;
// live on Worker r671 the same day, on a decided PRD card whose post had gone
// up with that text). `chat.postMessage` truncates a long text instead, which
// is how a card can post and then fail its first edit.
export const expiryEdits: Record<string, unknown>[] = [];
/** chat.update's `text` ceiling, as Slack refuses it. Written out here rather
 *  than read from `api.ts`'s `UPDATE_TEXT_CHARS` on purpose: the stub models
 *  Slack, so a wrong constant in the Worker fails a test instead of agreeing
 *  with itself. */
export const UPDATE_TEXT_LIMIT = 4000;
let response: { ok: boolean; error?: string } = { ok: true };
export function expiryFetchResponse(value: typeof response): void {
  response = value;
}
globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
  if (String(url) !== "https://slack.com/api/chat.update") throw new Error(`Unexpected test request: ${String(url)}`);
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  expiryEdits.push(body);
  if (String(body.text ?? "").length > UPDATE_TEXT_LIMIT) return new Response(JSON.stringify({ ok: false, error: "msg_too_long" }));
  return new Response(JSON.stringify(response));
}) as typeof fetch;
