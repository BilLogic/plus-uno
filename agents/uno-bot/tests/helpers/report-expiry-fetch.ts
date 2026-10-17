// Install before net.ts captures fetch. This test process reaches only the
// Slack HTTP seam, with a test token; no call falls through to the network.
//
// It refuses what Slack's `chat.update` refuses on length: a `text` past 4,000
// UTF-8 bytes is `msg_too_long`. Slack's method reference says 4,000
// characters, but it refused edits of 3,946 characters / 4,030 bytes and
// 3,962 / 4,038 live, so its count is bytes. `chat.postMessage` truncates a
// long text instead, which is how a card can post and then fail its first edit.
export const expiryEdits: Record<string, unknown>[] = [];
/** chat.update's `text` ceiling in UTF-8 bytes, as Slack refuses it. Written
 *  out here rather than read from `api.ts`'s `UPDATE_TEXT_BYTES` on purpose:
 *  the stub models Slack, so a wrong constant in the Worker fails a test
 *  instead of agreeing with itself. */
export const UPDATE_TEXT_LIMIT = 4000;
/** UTF-8 bytes, as Slack counts them. */
export const utf8Bytes = (s: string): number => new TextEncoder().encode(s).length;
let textLimit = UPDATE_TEXT_LIMIT;
/** Refuse `text` past `limit` bytes instead: a stand-in for any refusal the
 *  Worker's own cap did not foresee, which it must land the edit through. */
export function expiryTextLimit(limit: number = UPDATE_TEXT_LIMIT): void {
  textLimit = limit;
}
let response: { ok: boolean; error?: string } = { ok: true };
export function expiryFetchResponse(value: typeof response): void {
  response = value;
}
globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
  if (String(url) !== "https://slack.com/api/chat.update") throw new Error(`Unexpected test request: ${String(url)}`);
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  expiryEdits.push(body);
  if (utf8Bytes(String(body.text ?? "")) > textLimit) return new Response(JSON.stringify({ ok: false, error: "msg_too_long" }));
  return new Response(JSON.stringify(response));
}) as typeof fetch;
