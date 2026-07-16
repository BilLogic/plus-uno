import type { Env } from "./types";
import { verifySlackSignature } from "./slack/verify";
import { handleSlackEnvelope, type SlackEnvelope } from "./slack/events";
import { startSlackOAuth, handleSlackOAuthCallback } from "./oauth/slack";
import { geminiConfigured, geminiGenerate } from "./gemini/client";
import { claudeVertexConfigured, claudeVertexGenerate } from "./vertex/claude";
import { MODELS } from "./agent/routing";
import { runAgent } from "./agent/run-agent";
import { preflight } from "./agent/preflight";
import type { HistoryTurn, PendingProposal } from "./thread-state-client";
import { BUILD } from "./version";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(`uno-bot ok ${BUILD}`, { status: 200 });
    }

    // Gemini credential + reachability smoke test (dual-provider phase 1).
    // Returns model, latency, auth mode, and a one-line sample — never secrets.
    // Auth-gated: it triggers a live (billable) model call, so it must not be public.
    if (request.method === "GET" && url.pathname === "/debug/gemini") {
      if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
      const mode = geminiConfigured(env);
      if (!mode) {
        return Response.json({ ok: false, error: "no Gemini credential configured (GEMINI_API_KEY or GEMINI_SA_EMAIL + GEMINI_SA_PRIVATE_KEY)" });
      }
      const result = await geminiGenerate(env, {
        prompt: "Reply with exactly: uno-bot gemini link ok",
        maxTokens: 100,
        thinkingLevel: "minimal",
      });
      return Response.json({ auth: mode, ...result, text: result.text?.slice(0, 100) });
    }

    // Claude-on-Vertex credential + reachability smoke test. Confirms the
    // service-account token reaches the Anthropic partner models before flipping
    // MODEL_PROVIDER="vertex-claude". Auth-gated: it triggers a live (billable)
    // model call, so it must not be public.
    if (request.method === "GET" && url.pathname === "/debug/vertex-claude") {
      if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
      if (!claudeVertexConfigured(env)) {
        return Response.json({ ok: false, error: "no Vertex-Claude credential (need GEMINI_SA_EMAIL + GEMINI_SA_PRIVATE_KEY + GEMINI_PROJECT_ID)" });
      }
      const model = env.CLAUDE_MODEL ?? MODELS.sonnet;
      const result = await claudeVertexGenerate(env, {
        model,
        prompt: "Reply with exactly: uno-bot vertex-claude link ok",
        maxTokens: 100,
      });
      return Response.json({ ...result, text: result.text?.slice(0, 100) });
    }

    // One HEADLESS agent turn for evals + reasoning investigation. Runs the
    // exact runAgent the Slack pipeline uses, but with a synthetic context and
    // NO delivery: replies come back as JSON, proposals come back as data
    // (nothing is staged or posted — staging/posting live a layer up in
    // events.ts), and the preflight clarify-gate verdict is included so eval
    // assertions see the same gating production applies. Multi-turn flows are
    // driven by the CALLER passing history/pending back in (the DO is never
    // touched). Auth-gated: every call is a live billable model run.
    // Driven by scripts/run-evals.mjs; scenarios in docs/evals/.
    if (request.method === "POST" && url.pathname === "/debug/eval") {
      if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
      return handleEvalTurn(request, env);
    }

    if (request.method === "POST" && url.pathname === "/slack/events") {
      return handleSlackEventsRequest(request, env, ctx);
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
  },
};

// /debug/eval body: one turn of a (possibly multi-turn) eval conversation.
interface EvalTurnBody {
  prompt?: string;
  history?: HistoryTurn[];
  /** Minimal pending-proposal shape; synthetic fields are filled in here. */
  pending?: { toolName: string; input: Record<string, unknown> } | null;
}

async function handleEvalTurn(request: Request, env: Env): Promise<Response> {
  let body: EvalTurnBody;
  try {
    body = (await request.json()) as EvalTurnBody;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return Response.json({ ok: false, error: "missing prompt" }, { status: 400 });

  const history: HistoryTurn[] = Array.isArray(body.history)
    ? body.history.filter(
        (t): t is HistoryTurn =>
          !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
      )
    : [];
  const pending: PendingProposal | null = body.pending?.toolName
    ? {
        toolName: body.pending.toolName,
        input: body.pending.input ?? {},
        channel: "C_EVAL",
        threadTs: "0",
        userMsgTs: "0",
        proposalTs: "0",
        proposalText: "(eval)",
        requesterUserId: "U_EVAL",
      }
    : null;

  const narration: string[] = [];
  const startedAt = Date.now();
  try {
    const result = await runAgent({
      env,
      userText: prompt,
      history,
      slack: { channel: "C_EVAL", threadTs: "0", userMsgTs: "0", requestedBy: "U_EVAL" },
      currentSender: { userId: "U_EVAL" },
      pending,
      onInterim: (t) => narration.push(t),
    });
    // Mirror production's clarify gate: when a proposal comes back, report what
    // preflight would have asked (events.ts applies this before staging).
    let gateAsk: string | null = null;
    if (result.kind === "proposal") {
      const gate = await preflight(result.toolName, result.input, {
        env,
        prd: null,
        implementPrdUrl: undefined,
      }).catch(() => null);
      gateAsk = gate?.ask ?? null;
    }
    return Response.json({ ok: true, build: BUILD, ms: Date.now() - startedAt, narration, gateAsk, result });
  } catch (err) {
    return Response.json({
      ok: false,
      build: BUILD,
      ms: Date.now() - startedAt,
      narration,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// Gate for /debug/* routes. Requires DEBUG_TOKEN to be configured AND matched
// by the x-debug-token header via a constant-time compare — an unconfigured
// token means the routes are simply closed (404), never open-by-default.
function debugAuthorized(request: Request, env: Env): boolean {
  const expected = env.DEBUG_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get("x-debug-token") ?? "";
  return timingSafeEqualStr(provided, expected);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare over a fixed width so length itself doesn't leak via timing.
  let diff = ab.length ^ bb.length;
  const width = Math.max(ab.length, bb.length);
  for (let i = 0; i < width; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

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
