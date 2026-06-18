import type { Env } from "./types";
import { verifySlackSignature } from "./slack/verify";
import { handleSlackEnvelope, type SlackEnvelope } from "./slack/events";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("uno-bot ok", { status: 200 });
    }

    if (request.method === "POST" && url.pathname === "/slack/events") {
      return handleSlackEventsRequest(request, env, ctx);
    }

    return new Response("not found", { status: 404 });
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
