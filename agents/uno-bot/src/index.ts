import type { Env } from "./types";
import { verifySlackSignature } from "./slack/verify";
import { handleSlackEnvelope, type SlackEnvelope } from "./slack/events";
import { handleSlashCommand } from "./slack/commands";
import { parseInteraction, handleInteraction } from "./slack/interactive";
import { publishHomeViewForDebug } from "./slack/home";
import { startSlackOAuth, handleSlackOAuthCallback, getSlackAccessTokenFor } from "./oauth/slack";
import { geminiConfigured, geminiGenerate } from "./gemini/client";
import { claudeVertexConfigured, claudeVertexGenerate } from "./vertex/claude";
import { MODELS } from "./agent/routing";
import { runAgent } from "./agent/run-agent";
import { preflight } from "./agent/preflight";
import type { HistoryTurn, PendingProposal } from "./thread-state-client";
import { BUILD } from "./version";
import { runFigmaPoll } from "./figma-poll";
import { buildSystemBlocks } from "./agent/skills";
import { ensureHarnessCache } from "./gemini/cache";
import { countedFetch, runMetered, subrequestsUsed, meterBreakdown, subrequestBudgetTrips, internalSubrequestsUsed } from "./net";

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
    // ?model= probes a SPECIFIC model — the only way to answer "is this model
    // available to this project?" before wiring a tier to it. A preview model
    // can be listed in the docs and absent from a given Vertex project, and the
    // failure would otherwise surface as a 400 on someone's first /grind.
    const probeModel = url.searchParams.get("model") ?? undefined;
    const result = await geminiGenerate(env, {
      prompt: "Reply with exactly: uno-bot gemini link ok",
      maxTokens: 100,
      // ?level= too: gemini-3.1-pro rejects MINIMAL outright, so a probe with a
      // hardcoded level cannot tell "model absent" from "level unsupported".
      thinkingLevel: (url.searchParams.get("level") ?? "minimal") as
        | "minimal" | "low" | "medium" | "high",
      ...(probeModel ? { model: probeModel } : {}),
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
    const model = env.CLAUDE_MODEL ?? MODELS.default;
    const result = await claudeVertexGenerate(env, {
      model,
      prompt: "Reply with exactly: uno-bot vertex-claude link ok",
      maxTokens: 100,
    });
    return Response.json({ ...result, text: result.text?.slice(0, 100) });
  }

  // Is the Gemini lane's system prompt actually being cached? Reports the
  // cachedContents resource (or the exact reason there isn't one) plus the size
  // of the harness it would hold. Cheap: no model call, and the create is
  // memoised for the hour either way. Auth-gated like every /debug route.
  if (request.method === "GET" && url.pathname === "/debug/gemini-cache") {
    if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
    const model = env.GEMINI_MODEL ?? "gemini-3.6-flash";
    const blocks = await buildSystemBlocks(env, null, null);
    const stable = (blocks as Array<{ text?: string }>)[0]?.text ?? "";
    const result = await ensureHarnessCache(env, model, stable);
    return Response.json({
      ok: true,
      build: BUILD,
      model,
      region: env.GEMINI_REGION ?? "global",
      harness_chars: stable.length,
      cached: result.name !== null,
      cache_name: result.name,
      cache_tokens: result.tokens,
      reason: result.reason,
    });
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

  // What the LIVE INSTALL actually grants for search — the three questions the
  // assistant.search.context plan could not answer from the manifest (a manifest
  // lists what was requested, not what the installed tokens carry). Reports
  // scopes and Slack's own error strings; never a token, never message content.
  // `?q=` overrides the throwaway probe query. Auth-gated: it makes live calls.
  if (request.method === "GET" && url.pathname === "/debug/slack-search") {
    if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
    return Response.json(await probeSlackSearch(env, url.searchParams.get("q") ?? "design"));
  }

  // Live probe of chat.startStream, which has rejected every argument shape we
  // have tried with `invalid_arguments` and names no field (r34–r40).
  //
  // A route, not a log line: the agent path runs inside a Durable Object, and a
  // DO keeps the script version it was instantiated with until evicted — so
  // several "streaming still fails" readings were actually stale code running.
  // This runs in the Worker, so what deploys is what answers.
  //
  // ?channel= (required) ?thread_ts= ?user= ?team= — each argument independently
  // omittable, so the failing one can be bisected. Returns Slack's raw response.
  // Auth-gated: it posts a real (empty) stream to the channel on success.
  if (request.method === "GET" && url.pathname === "/debug/slack-stream") {
    if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
    const channel = url.searchParams.get("channel");
    if (!channel) return Response.json({ ok: false, error: "channel required" }, { status: 400 });
    // ?stop=<ts> closes a stream this probe opened. A started-and-never-stopped
    // stream spins in the client forever, so the probe has to be able to tidy up
    // after itself.
    const stopTs = url.searchParams.get("stop");
    if (stopTs) {
      const r = await countedFetch("https://slack.com/api/chat.stopStream", {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel, ts: stopTs }),
      });
      return Response.json({ stopped: stopTs, slack: await r.json() });
    }
    const payload: Record<string, unknown> = { channel };
    for (const [param, field] of [
      ["thread_ts", "thread_ts"],
      ["user", "recipient_user_id"],
      ["team", "recipient_team_id"],
    ] as const) {
      const v = url.searchParams.get(param);
      if (v) payload[field] = v;
    }
    // ?broadcast=1 — does a stream accept reply_broadcast? A threaded reply is
    // invisible in the Messages tab until you click "N replies"; broadcasting
    // puts it in the main timeline too.
    if (url.searchParams.get("broadcast")) payload.reply_broadcast = true;
    const res = await countedFetch("https://slack.com/api/chat.startStream", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    return Response.json({ sent: payload, status: res.status, slack: await res.json() });
  }

  // Publish the App Home view and return Slack's raw verdict.
  //
  // The Home tab is the one surface with NO failure signal: views.publish is
  // fired from an event handler, nothing reads its response, and a block Slack
  // rejects simply leaves the previous view in place. Every Home change until
  // now was verified by opening the app and squinting. The Stop button is the
  // first ACTION element up there, so "did the block validate" became a
  // question worth being able to ask.
  //
  // ?user= (required) — views.publish is per-user. Auth-gated: it writes a real
  // view to that person's Home tab, which is the same thing opening the tab
  // does, so the blast radius is a refresh.
  if (request.method === "GET" && url.pathname === "/debug/home") {
    if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
    const user = url.searchParams.get("user");
    if (!user) return Response.json({ ok: false, error: "user required" }, { status: 400 });
    return Response.json(await publishHomeViewForDebug(env, user));
  }

  // What the blueprint deployment actually supports — the question the code
  // could not answer about itself. searchBlueprint degrades semantic -> rpc ->
  // table fan-out silently, so "is semantic even deployed?" was unanswerable
  // without reading production logs and hoping a search happened.
  //
  // Reports, per capability: reachable, and readable-by-anon. Auth-gated; all
  // reads, no writes.
  if (request.method === "GET" && url.pathname === "/debug/blueprint") {
    if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return Response.json({ ok: false, error: "SUPABASE_URL / SUPABASE_ANON_KEY not configured" });
    }
    const base = env.SUPABASE_URL.replace(/\/+$/, "");
    const h = { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };
    const probe = async (label: string, path: string, init?: RequestInit) => {
      try {
        const r = await countedFetch(`${base}${path}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } });
        const body = await r.text();
        return { [label]: { status: r.status, ok: r.ok, sample: body.slice(0, 160) } };
      } catch (err) {
        return { [label]: { error: err instanceof Error ? err.message : String(err) } };
      }
    };
    const out: Record<string, unknown> = { build: BUILD, semantic_flag: env.SEMANTIC_SEARCH ?? "on" };
    Object.assign(out, await probe("rpc_search_blueprint", "/rest/v1/rpc/search_blueprint", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: "tutor" }),
    }));
    Object.assign(out, await probe("rpc_match_corpus_chunks", "/rest/v1/rpc/match_corpus_chunks", {
      method: "POST",
      headers: { "content-type": "application/json", "content-profile": "semantic_search" },
      // Deliberately malformed embedding: a 404/PGRST202 means the function is
      // ABSENT, any other error means it exists and rejected the argument —
      // which is the distinction being probed, with no embedding call spent.
      body: JSON.stringify({ query_embedding: [0], match_count: 1, filter_source: "blueprint" }),
    }));
    for (const t of ["cells", "cell_triggers", "findings", "slices"]) {
      Object.assign(out, await probe(`table_${t}`, `/rest/v1/${t}?select=id&limit=1`));
    }
    return Response.json(out);
  }

  // Manual firing of the Figma library poll (same code path as the cron).
  // `?dry_run=1` diffs and reports without writing KV / Notion / Slack.
  // Auth-gated: a live run posts to Slack and files a PRD.
  if (request.method === "GET" && url.pathname === "/debug/figma-poll") {
    if (!debugAuthorized(request, env)) return new Response("not found", { status: 404 });
    const dryRun = url.searchParams.get("dry_run") === "1";
    try {
      const result = await runFigmaPoll(env, { dryRun });
      return Response.json({ ok: true, build: BUILD, dryRun, ...result });
    } catch (err) {
      return Response.json({ ok: false, build: BUILD, dryRun, error: err instanceof Error ? err.message : String(err) });
    }
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

// /debug/eval body: one turn of a (possibly multi-turn) eval conversation.
interface EvalTurnBody {
  prompt?: string;
  history?: HistoryTurn[];
  /** Minimal pending-proposal shape; synthetic fields are filled in here. */
  pending?: { toolName: string; input: Record<string, unknown> } | null;
  /** Surface the turn arrives on. Defaults to the synthetic channel C_EVAL —
   *  which never starts with "D", so own-visibility search is unreachable and
   *  any assertion about the ADR-020 surface gate would pass for the wrong
   *  reason. A case that means to exercise the gate sets these explicitly. */
  channel?: string;
  requestedBy?: string;
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

  // Slack ids only — the eval route must not become a way to name arbitrary
  // surfaces. Anything malformed falls back to the synthetic defaults.
  const channel = /^[CDG][A-Z0-9]{2,20}$/.test(body.channel ?? "") ? body.channel! : "C_EVAL";
  const requestedBy = /^[UW][A-Z0-9]{2,20}$/.test(body.requestedBy ?? "")
    ? body.requestedBy!
    : "U_EVAL";

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
        channel,
        threadTs: "0",
        userMsgTs: "0",
        proposalTs: "0",
        proposalText: "(eval)",
        requesterUserId: requestedBy,
      }
    : null;

  const narration: string[] = [];
  const startedAt = Date.now();
  try {
    const result = await runAgent({
      env,
      userText: prompt,
      history,
      slack: { channel, threadTs: "0", userMsgTs: "0", requestedBy },
      currentSender: { userId: requestedBy },
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
    // subrequests: the measured spend for this invocation. Surfaced so an eval
    // run can see how close a turn came to the 50-call cap instead of finding
    // out by way of a silent death in production.
    return Response.json({
      ok: true, build: BUILD, ms: Date.now() - startedAt,
      subrequests: subrequestsUsed(), subrequest_hosts: meterBreakdown(),
      internal_subrequests: internalSubrequestsUsed(),
      budget_trips: subrequestBudgetTrips(),
      narration, gateAsk, result,
    });
  } catch (err) {
    return Response.json({
      ok: false,
      build: BUILD,
      ms: Date.now() - startedAt,
      narration,
      subrequests: subrequestsUsed(), subrequest_hosts: meterBreakdown(),
      internal_subrequests: internalSubrequestsUsed(),
      budget_trips: subrequestBudgetTrips(),
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

async function handleSlackCommandRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  // Same raw-bytes rule as /slack/events — the signature covers the exact body,
  // and the scheme is body-agnostic, so form-encoded verifies identically.
  const rawBody = await request.text();
  const verification = await verifySlackSignature(
    rawBody,
    request.headers.get("x-slack-request-timestamp"),
    request.headers.get("x-slack-signature"),
    env.SLACK_SIGNING_SECRET,
  );
  if (!verification.ok) {
    console.warn(`[slash] verification failed: ${verification.reason}`);
    return new Response("unauthorized", { status: 401 });
  }

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
  const rawBody = await request.text();
  const verification = await verifySlackSignature(
    rawBody,
    request.headers.get("x-slack-request-timestamp"),
    request.headers.get("x-slack-signature"),
    env.SLACK_SIGNING_SECRET,
  );
  if (!verification.ok) {
    console.warn(`[interactive] verification failed: ${verification.reason}`);
    return new Response("unauthorized", { status: 401 });
  }

  const payload = parseInteraction(rawBody);
  if (!payload) {
    // 200, not 400: Slack retries a non-2xx, and a body we cannot parse will
    // not parse on the retry either.
    console.error("[interactive] unparseable payload");
    return new Response("", { status: 200 });
  }

  return handleInteraction(env, payload, ctx);
}

// ── Live-install search probe (/debug/slack-search) ───────────────────────────
// Answers, against the real install rather than the manifest:
//   • which scopes each installed token actually carries (auth.test's
//     x-oauth-scopes response header — the manifest only records what was asked)
//   • whether assistant.search.context is permitted for this app at all
//     (distribution gate: prohibited for unlisted distributed apps — it answers
//     with an error string, not a 404)
//   • what a bot-token call without an action_token returns, which is how we
//     recognize the action_token requirement in the wild
// Tokens are never echoed. Message content is never echoed — only counts.
async function probeToken(
  token: string,
  label: string,
  channelTypes: string,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { credential: label };
  try {
    const auth = await countedFetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/x-www-form-urlencoded; charset=utf-8",
      },
    });
    const authBody = (await auth.json()) as { ok?: boolean; error?: string; user_id?: string };
    out.auth_ok = authBody.ok === true;
    out.auth_error = authBody.error;
    out.identity = authBody.user_id;
    // Slack reports the token's REAL granted scopes here, comma-joined.
    out.scopes = auth.headers.get("x-oauth-scopes")?.split(",") ?? null;
  } catch (err) {
    out.auth_exception = err instanceof Error ? err.message : String(err);
  }
  try {
    const res = await countedFetch("https://slack.com/api/assistant.search.context", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: new URLSearchParams({
        query: "probe",
        limit: "1",
        channel_types: channelTypes,
        content_types: "messages",
        disable_semantic_search: "true",
      }).toString(),
    });
    const body = (await res.json()) as {
      ok?: boolean;
      error?: string;
      needed?: string;
      results?: { messages?: unknown[] };
    };
    out.search_ok = body.ok === true;
    out.search_error = body.error;
    out.search_needed_scope = body.needed;
    out.search_hits = body.results?.messages?.length ?? 0;
  } catch (err) {
    out.search_exception = err instanceof Error ? err.message : String(err);
  }
  return out;
}

async function probeSlackSearch(env: Env, query: string): Promise<Record<string, unknown>> {
  const probes: Record<string, unknown>[] = [];
  if (env.SLACK_BOT_TOKEN) {
    probes.push(await probeToken(env.SLACK_BOT_TOKEN, "bot (SLACK_BOT_TOKEN)", "public_channel"));
  }
  const legacy = await getSlackAccessTokenFor(env).catch(() => null);
  if (legacy) {
    probes.push(await probeToken(legacy.token, "stored user/legacy token", "public_channel"));
    probes.push(
      await probeToken(legacy.token, "stored user/legacy token (private)", "private_channel"),
    );
  }
  return {
    ok: true,
    build: BUILD,
    query,
    note: "search_error 'not_allowed_token_type' or an app-permission error means the method is closed to this app; 'missing_scope' names what to re-consent for. A bot probe erroring on the missing action_token is the expected shape, not a failure.",
    oauth_configured: !!legacy,
    probes,
  };
}

export { ThreadState } from "./thread-state";
export { AgentRunner } from "./agent-runner";
