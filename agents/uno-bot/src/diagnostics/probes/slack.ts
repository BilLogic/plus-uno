// Slack-surface probes: what the live install grants for search, what
// chat.startStream accepts, and whether an App Home view validates.
import { publishHomeViewForDebug } from "../../slack/home";
import { getSlackAccessTokenFor } from "../../oauth/slack";
import { countedFetch } from "../../net";
import { BUILD } from "../../version";
import type { Env } from "../../types";
import type { ProbeRun } from "../probe";

// What the LIVE INSTALL actually grants for search — the three questions the
// assistant.search.context plan could not answer from the manifest (a manifest
// lists what was requested, not what the installed tokens carry). Reports
// scopes and Slack's own error strings; never a token, never message content.
// `?q=` overrides the throwaway probe query. Token-gated: it makes live calls.
export const slackSearchProbe: ProbeRun = async (env, url) => ({
  body: await probeSlackSearch(env, url.searchParams.get("q") ?? "design"),
});

// Live probe of chat.startStream, which answered `invalid_arguments` and named
// no field through r34–r40. Two candidate explanations, neither retired: the
// answer path sent no recipient ids at all until #572 (that much is a plain
// code reading, and the argument contract above `startStream` in slack/api.ts
// says the call needs them), and the DO script-version staleness described
// below made some "streaming still fails" readings stale code. This probe is
// how either gets settled instead of argued — it omits each argument
// independently, and it answers from the Worker.
//
// A route, not a log line: the agent path runs inside a Durable Object, and a
// DO keeps the script version it was instantiated with until evicted — so
// several "streaming still fails" readings were actually stale code running.
// This runs in the Worker, so what deploys is what answers.
//
// ?channel= (required) ?thread_ts= ?user= ?team= — each argument independently
// omittable, so the failing one can be bisected; ?text= streams that text
// raw and closes (the markup probe). Returns Slack's raw responses.
// Token-gated: it posts a real (empty) stream to the channel on success.
export const slackStreamProbe: ProbeRun = async (env, url) => {
  const channel = url.searchParams.get("channel");
  if (!channel) return { body: { ok: false, error: "channel required" }, status: 400 };
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
    return { body: { stopped: stopTs, slack: await r.json() } };
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
  const call = (method: string, body: Record<string, unknown>) =>
    countedFetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
  const res = await call("chat.startStream", payload);
  const slack = (await res.json()) as { ok?: boolean; ts?: string };
  // ?text= — the markup probe (docs/connectors/slack.md § Streamed text):
  // append this text AS GIVEN, bypassing the markup pass on purpose, then
  // close the stream. Whether the rendered message is blank is what it asks,
  // so the answer is in the channel, not in this response.
  const text = url.searchParams.get("text");
  if (text && slack.ok && slack.ts) {
    const append = await call("chat.appendStream", { channel, ts: slack.ts, markdown_text: text });
    const stop = await call("chat.stopStream", { channel, ts: slack.ts });
    return { body: { sent: payload, status: res.status, slack, append: await append.json(), stop: await stop.json() } };
  }
  return { body: { sent: payload, status: res.status, slack } };
};

// Publish the App Home view and return Slack's raw verdict.
//
// The Home tab is the one surface with NO failure signal: views.publish is
// fired from an event handler, nothing reads its response, and a block Slack
// rejects simply leaves the previous view in place. Every Home change until
// now was verified by opening the app and squinting. The Stop button is the
// first ACTION element up there, so "did the block validate" became a
// question worth being able to ask.
//
// ?user= (required) — views.publish is per-user. Token-gated: it writes a real
// view to that person's Home tab, which is the same thing opening the tab
// does, so the blast radius is a refresh.
export const homeProbe: ProbeRun = async (env, url) => {
  const user = url.searchParams.get("user");
  if (!user) return { body: { ok: false, error: "user required" }, status: 400 };
  // Slack's raw verdict — an object (`{ok, error?, …}`), typed `unknown` by the
  // Web-API wrapper, so the envelope can be merged around it.
  const verdict = (await publishHomeViewForDebug(env, user)) as Record<string, unknown>;
  return { body: verdict };
};

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
