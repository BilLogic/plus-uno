// GET /debug/mcp — per-server hosted-MCP health probe.
//
// The Anthropic connector reports a failed MCP attachment with a single opaque
// "Connection error while communicating with MCP server" that never names the
// culprit — and with four servers attached, one bad token kills every request
// (run-agent.ts falls back to REST, but MCP stays silently dark). This endpoint
// runs the same initialize handshake the connector runs, against each configured
// server with its real credential, so a failing server is identified in one call.
//
// Output is safe to expose: server names, HTTP status, latency, and a short
// error snippet — never tokens. Also used as the ongoing monitoring hook
// (curl it, or point an uptime checker at it).

import type { Env } from "../types";
import { buildMcp } from "../agent/mcp";

const HANDSHAKE_TIMEOUT_MS = 10_000;

interface ProbeResult {
  server: string;
  ok: boolean;
  status?: number;
  ms: number;
  detail?: string;
}

async function probeServer(name: string, url: string, token: string): Promise<ProbeResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HANDSHAKE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
        "MCP-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "uno-bot-health", version: "1.0" },
        },
      }),
    });
    const text = await res.text();
    // A successful initialize returns 200 with a JSON-RPC result (possibly SSE-framed).
    const ok = res.ok && !text.includes('"error"');
    return {
      server: name,
      ok,
      status: res.status,
      ms: Date.now() - started,
      // Snippet only — enough to read an auth error, never long enough to leak.
      detail: ok ? undefined : text.slice(0, 300),
    };
  } catch (err) {
    return {
      server: name,
      ok: false,
      ms: Date.now() - started,
      detail: err instanceof Error ? (err.name === "AbortError" ? "timeout" : err.message) : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleMcpHealth(env: Env): Promise<Response> {
  const { servers } = await buildMcp(env);
  if (servers.length === 0) {
    return Response.json({ ok: false, servers: [], note: "no MCP servers configured/authorized" });
  }
  const results = await Promise.all(
    servers.map((s) =>
      probeServer(String(s.name), String(s.url), String(s.authorization_token ?? "")),
    ),
  );
  return Response.json({ ok: results.every((r) => r.ok), servers: results });
}
