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

export async function probeAllMcp(env: Env): Promise<{ ok: boolean; servers: ProbeResult[] }> {
  const { servers } = await buildMcp(env);
  if (servers.length === 0) return { ok: false, servers: [] };
  const results = await Promise.all(
    servers.map((s) =>
      probeServer(String(s.name), String(s.url), String(s.authorization_token ?? "")),
    ),
  );
  return { ok: results.every((r) => r.ok), servers: results };
}

export async function handleMcpHealth(env: Env): Promise<Response> {
  const report = await probeAllMcp(env);
  if (report.servers.length === 0) {
    return Response.json({ ...report, note: "no MCP servers configured/authorized" });
  }
  return Response.json(report);
}

// Cron entry point: probe every server on a schedule and post a plain-language
// alert to #uno-bot when one is down — closing the loop the /debug/mcp endpoint
// opened ("make sure all MCPs keep working", 2026-07-10). Alerts are throttled
// to one per hour via HARNESS_KV so a long outage doesn't spam the channel.
const ALERT_THROTTLE_MS = 60 * 60 * 1000;
const ALERT_KV_KEY = "mcp_health_alert_at";
const UNO_BOT_CHANNEL = "C0ARJ2A3A69";

export async function runScheduledMcpHealthCheck(
  env: Env,
  postMessage: (env: Env, args: { channel: string; text: string }) => Promise<unknown>,
): Promise<void> {
  const report = await probeAllMcp(env);
  const down = report.servers.filter((r) => !r.ok);
  if (down.length === 0) return;

  if (env.HARNESS_KV) {
    const last = await env.HARNESS_KV.get(ALERT_KV_KEY);
    if (last && Date.now() - Number(last) < ALERT_THROTTLE_MS) {
      console.warn(`[mcp-health] still down (${down.map((d) => d.server).join(", ")}) — alert throttled`);
      return;
    }
    await env.HARNESS_KV.put(ALERT_KV_KEY, String(Date.now()));
  }

  const lines = down
    .map((d) => `• *${d.server}* — ${d.status ? `HTTP ${d.status}` : "no response"}${d.detail ? `: ${d.detail.slice(0, 150)}` : ""}`)
    .join("\n");
  await postMessage(env, {
    channel: UNO_BOT_CHANNEL,
    text: `:rotating_light: uno-bot lost its connection to ${down.length === 1 ? "a data source" : `${down.length} data sources`}:\n${lines}\nAnswers fall back to slower paths until this recovers — details at /debug/mcp.`,
  }).catch?.(() => {});
}
