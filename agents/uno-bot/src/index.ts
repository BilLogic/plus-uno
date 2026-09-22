// The Worker entry: verify, route, export the Durable Objects.
//
// Nothing here knows blueprint schema, embed models, Slack probing or cache
// internals. Those are Diagnostics' (src/diagnostics/) — eleven `/debug/*`
// probes plus the public `/health/blueprint` contract probe, behind one auth
// check and one report envelope. `/health` stays here: it is the uptime route,
// it reads only the build id, and monitoring watches it.
import type { Env } from "./types";
import { verifySlackSignature } from "./slack/verify";
import { handleSlackEnvelope, handOffCutOffRunsFor, type SlackEnvelope } from "./slack/events";
import { ThreadState as ThreadStateObject } from "./thread-state";
import { handleSlashCommand } from "./slack/commands";
import { parseInteraction, handleInteraction } from "./slack/interactive";
import { startSlackOAuth, handleSlackOAuthCallback } from "./oauth/slack";
import { BUILD } from "./version";
import { runFigmaPoll } from "./figma-poll";
import { runMetered } from "./net";
import * as diagnostics from "./diagnostics";

export default {
  // Cron (wrangler.toml [triggers]) — the Figma library poll: detect DS
  // publishes, file the PRD, post the "🎨 Figma Design System Updated" card to
  // #uno-bot. Scheduled invocations get their own subrequest budget and a
  // 15-minute wall clock, so the poll runs here, not in a DO alarm.
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Metered like every other invocation: the poll fans out over Figma files
    // under the same 50-subrequest cap, and would die the same silent way.
    ctx.waitUntil(
      runMetered(() => runFigmaPoll(env))
        .then((r) => console.log(`[figma-poll] ${r.summary}`))
        .catch((err) => console.error(`[figma-poll] failed: ${err instanceof Error ? err.message : String(err)}`)),
    );
  },

  // runMetered opens a fresh subrequest counter for this invocation. Cloudflare
  // caps a free-plan invocation at 50 outbound subrequests and kills it on 51,
  // so the agent's budget gate reads this counter rather than the guess table it
  // used to trust. ctx.waitUntil work continues inside the same async context,
  // so the Slack-event path is metered too.
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return runMetered(() => handleRequest(request, env, ctx));
  },
};

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  // Uptime. One line, no dependencies, no auth — README and monitoring both
  // read `uno-bot ok <BUILD>` as the running build.
  if (request.method === "GET" && url.pathname === "/health") {
    return new Response(`uno-bot ok ${BUILD}`, { status: 200 });
  }

  // Every probe. The module owns the auth gate, the report envelope and the
  // 404 for an unknown or wrong-method path.
  if (url.pathname === "/health/blueprint" || url.pathname.startsWith("/debug/")) {
    return diagnostics.handle(request, env, url);
  }

  if (request.method === "POST" && url.pathname === "/slack/events") {
    return handleSlackEventsRequest(request, env, ctx);
  }

  // Slash commands (/uno-prototype, /uno-research, …). Separate route because
  // Slack posts them form-encoded, not as an events JSON envelope.
  if (request.method === "POST" && url.pathname === "/slack/commands") {
    return handleSlackCommandRequest(request, env, ctx);
  }

  // Block Kit interactions: buttons, shortcuts, view submissions. The manifest
  // pointed these at a Netlify function that does not exist (404) — see
  // slack/interactive.ts.
  if (request.method === "POST" && url.pathname === "/slack/interactive") {
    return handleSlackInteractiveRequest(request, env, ctx);
  }

  // One-time Slack OAuth — issues the user token that slack_search needs
  // (Slack's search Web API rejects bot tokens). Reads only; writes post as
  // uno-bot via the bot token.
  if (request.method === "GET" && url.pathname === "/oauth/slack/start") {
    return startSlackOAuth(env);
  }
  if (request.method === "GET" && url.pathname === "/oauth/slack/callback") {
    return handleSlackOAuthCallback(request, env);
  }

  return new Response("not found", { status: 404 });
}

/**
 * The raw request body, once Slack's signature is checked — or the 401.
 *
 * Read raw before parsing, and read the same way for all three Slack routes:
 * the signature covers the exact bytes Slack signed, and the scheme is
 * body-agnostic, so form-encoded verifies identically to JSON.
 *
 * @param request - The inbound request
 * @param env - Carries SLACK_SIGNING_SECRET
 * @param label - Log prefix for a rejection
 */
async function verifiedBody(request: Request, env: Env, label: string): Promise<string | Response> {
  const rawBody = await request.text();
  const verification = await verifySlackSignature(
    rawBody,
    request.headers.get("x-slack-request-timestamp"),
    request.headers.get("x-slack-signature"),
    env.SLACK_SIGNING_SECRET,
  );
  if (verification.ok) return rawBody;
  console.warn(`[${label}] verification failed: ${verification.reason}`);
  return new Response("unauthorized", { status: 401 });
}

async function handleSlackEventsRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const rawBody = await verifiedBody(request, env, "slack");
  if (rawBody instanceof Response) return rawBody;

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

async function handleSlackCommandRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const rawBody = await verifiedBody(request, env, "slash");
  if (rawBody instanceof Response) return rawBody;

  // Synchronous by design: Slack times the caller out at 3s and does NOT retry
  // a slash command, so the response is built here and the run starts inside
  // ctx.waitUntil.
  return handleSlashCommand(env, new URLSearchParams(rawBody), ctx);
}

async function handleSlackInteractiveRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const rawBody = await verifiedBody(request, env, "interactive");
  if (rawBody instanceof Response) return rawBody;

  const payload = parseInteraction(rawBody);
  if (!payload) {
    // 200, not 400: Slack retries a non-2xx, and a body we cannot parse will
    // not parse on the retry either.
    console.error("[interactive] unparseable payload");
    return new Response("", { status: 200 });
  }

  return handleInteraction(env, payload, ctx);
}

/**
 * The ThreadState Durable Object, with its alarm's one Worker-side dependency
 * bound by name: a cut-off run the alarm finds is handed to the card's
 * AgentRunner, which tells the thread the way a look does
 * (`slack/cut-off-sweep.ts`). `Env` stops at the binding function.
 */
export class ThreadState extends ThreadStateObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, { handOffCutOffRuns: handOffCutOffRunsFor(env) });
  }
}
export { AgentRunner } from "./agent-runner";
