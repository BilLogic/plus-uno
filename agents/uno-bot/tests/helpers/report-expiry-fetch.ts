// Install before net.ts captures fetch. This test process reaches only the
// Slack HTTP seam, with a test token; no call falls through to the network.
export const expiryEdits: Record<string, unknown>[] = [];
let response: { ok: boolean; error?: string } = { ok: true };
export function expiryFetchResponse(value: typeof response): void {
  response = value;
}
globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
  if (String(url) !== "https://slack.com/api/chat.update") throw new Error(`Unexpected test request: ${String(url)}`);
  expiryEdits.push(JSON.parse(String(init?.body)));
  return new Response(JSON.stringify(response));
}) as typeof fetch;
