import type { Env } from "./types";
import { verifySlackSignature } from "./slack/verify";
import { handleSlackEnvelope, type SlackEnvelope } from "./slack/events";
import { startNotionOAuth, handleNotionOAuthCallback } from "./oauth/notion";
import { startSlackOAuth, handleSlackOAuthCallback } from "./oauth/slack";
import { handleMcpHealth, runScheduledMcpHealthCheck } from "./debug/mcp-health";
import { postMessage } from "./slack/api";
import { BUILD } from "./version";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(`uno-bot ok ${BUILD}`, { status: 200 });
    }

    // Per-server hosted-MCP handshake probe — identifies WHICH server is failing
    // when the Anthropic connector reports its unnamed "Connection error". Safe
    // output (names/status/latency only), doubles as the uptime-monitoring hook.
    if (request.method === "GET" && url.pathname === "/debug/mcp") {
      return handleMcpHealth(env);
    }

    if (request.method === "POST" && url.pathname === "/slack/events") {
      return handleSlackEventsRequest(request, env, ctx);
    }

    // One-time Notion OAuth (hosted-MCP READ path). Visit /oauth/notion/start
    // once as an admin/service Notion account to authorize; Notion redirects to
    // /oauth/notion/callback, which exchanges the code and stores the token.
    if (request.method === "GET" && url.pathname === "/oauth/notion/start") {
      return startNotionOAuth(env);
    }
    if (request.method === "GET" && url.pathname === "/oauth/notion/callback") {
      return handleNotionOAuthCallback(request, env);
    }

    // One-time Slack OAuth (hosted-MCP read + write path).
    if (request.method === "GET" && url.pathname === "/oauth/slack/start") {
      return startSlackOAuth(env);
    }
    if (request.method === "GET" && url.pathname === "/oauth/slack/callback") {
      return handleSlackOAuthCallback(request, env);
    }

    return new Response("not found", { status: 404 });
  },

  // Cron (wrangler.toml [triggers]): MCP health watchdog. Probes every attached
  // server and posts a throttled alert to #uno-bot when one is down, so outages
  // like the Slack-toggle incident (2026-07-09) surface in minutes, not on the
  // next confused user.
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runScheduledMcpHealthCheck(env, (e, args) =>
        postMessage(e, { channel: args.channel, text: args.text }),
      ).catch((err) => {
        console.error(`[mcp-health] scheduled check failed: ${err instanceof Error ? err.message : String(err)}`);
      }),
    );
  },
};

async function handleSlackEventsRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  // Body must be read raw before parsing, because signature verification
  // checks the exact bytes Slack signed.
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");

  const verification = await verifySlackSignature(
    rawBody,
    timestamp,
    signature,
    env.SLACK_SIGNING_SECRET,
  );
  if (!verification.ok) {
    console.warn(`[slack] verification failed: ${verification.reason}`);
    return new Response("unauthorized", { status: 401 });
  }

  let envelope: SlackEnvelope;
  try {
    envelope = JSON.parse(rawBody) as SlackEnvelope;
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // url_verification must respond synchronously with the challenge value
  // (Slack uses it during Event Subscriptions setup).
  if (envelope.type === "url_verification") {
    return handleSlackEnvelope(env, envelope);
  }

  // For real events: ack within 3s, do the work asynchronously.
  ctx.waitUntil(handleSlackEnvelope(env, envelope).catch((err) => {
    console.error(`[slack] handler error: ${err instanceof Error ? err.message : String(err)}`);
  }));
  return new Response("ok", { status: 200 });
}

export { ThreadState } from "./thread-state";
export { AgentRunner } from "./agent-runner";
