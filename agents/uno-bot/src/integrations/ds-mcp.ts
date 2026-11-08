// The hosted design-system MCP, asked first: `ds_find` for a task in words,
// `ds_get` for a name. It serves the released design system, the one the
// production Storybook shows, so Slack answers what designers see. The facts
// baked into the Worker (`ds-facts.ts`) are the fallback, and this client
// never throws: every failure comes back as a reason the caller falls back on.
//
// ONE SUBREQUEST PER QUESTION. The function is stateless (`sessionIdGenerator:
// undefined`), so a `tools/call` POST is answered on its own with no
// `initialize` round trip first — measured against
// `netlify/functions/ds-mcp/handler.mjs`. The one condition is the Accept
// header: the SDK's transport answers 406 unless it lists both
// `application/json` and `text/event-stream`, and with `enableJsonResponse` the
// answer is plain JSON either way.
//
// It takes its POST BY NAME, the `countedFetch` signature, so the tests drive
// it over a fake MCP; `canSpend` lets the binding skip the call when the turn
// has no subrequest left, so a spent budget falls back without a trip.
//
// PURE but for the injected POST.

/** The hosted door on the production site, which deploys only on a release. */
export const DS_MCP_URL = "https://plus-uno.netlify.app/mcp/ds";

/** The read timeout every repo read in this Worker uses (`GH_TIMEOUT_MS`); a miss falls back at no further cost. */
export const DS_MCP_TIMEOUT_MS = 8000;

export type DsSection = "props" | "usage" | "examples" | "a11y" | "figma";
export const DS_SECTIONS: readonly DsSection[] = ["props", "usage", "examples", "a11y", "figma"];

export type DsMcpPost = (url: string, init: RequestInit, timeoutMs?: number) => Promise<Response>;

/** Why the hosted answer was not used. */
export type DsMcpMiss = "no-key" | "budget" | "timeout" | "http" | "error";

export type DsMcpResult = { ok: true; text: string } | { ok: false; reason: DsMcpMiss; detail: string };

export interface DsMcpClient {
  /** `ds_find`: ranked matches for a task in words, a name or an alias. */
  find(query: string): Promise<DsMcpResult>;
  /** `ds_get`: the full record of one name, or one section of it. */
  get(name: string, section?: DsSection): Promise<DsMcpResult>;
}

export interface DsMcpDeps {
  /** The `DS_MCP_KEY` Worker secret; unset or blank sends nothing. */
  key: string | undefined;
  post: DsMcpPost;
  url?: string;
  timeoutMs?: number;
  /** False when the turn has no subrequest to spend; absent, always true. */
  canSpend?: () => boolean;
}

const miss = (reason: DsMcpMiss, detail: string): DsMcpResult => ({ ok: false, reason, detail });

export function dsMcpClient(deps: DsMcpDeps): DsMcpClient {
  const url = deps.url ?? DS_MCP_URL;
  const timeoutMs = deps.timeoutMs ?? DS_MCP_TIMEOUT_MS;

  async function call(name: string, args: Record<string, unknown>): Promise<DsMcpResult> {
    const key = deps.key?.trim();
    if (!key) return miss("no-key", "DS_MCP_KEY is not set");
    if (deps.canSpend && !deps.canSpend()) return miss("budget", "no subrequest left this turn");
    let res: Response;
    try {
      res = await deps.post(
        url,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
          },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
        },
        timeoutMs,
      );
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "TimeoutError" || e?.name === "AbortError") return miss("timeout", `no answer in ${timeoutMs} ms`);
      return miss("error", e?.message ?? String(err));
    }
    if (!res.ok) return miss("http", `HTTP ${res.status}`);
    let body: { error?: { message?: string }; result?: { isError?: boolean; content?: Array<{ type?: string; text?: string }> } };
    try {
      body = await res.json();
    } catch {
      return miss("error", "the answer was not JSON");
    }
    if (body?.error) return miss("error", body.error.message ?? "JSON-RPC error");
    const text = (body?.result?.content ?? [])
      .filter((c) => c?.type === "text" && typeof c.text === "string")
      .map((c) => c.text)
      .join("\n");
    if (body?.result?.isError) return miss("error", text || "tool error");
    if (!text) return miss("error", "the answer had no text");
    return { ok: true, text };
  }

  return {
    find: (query) => call("ds_find", { query }),
    get: (name, section) => call("ds_get", { names: [name], ...(section ? { section } : {}) }),
  };
}
