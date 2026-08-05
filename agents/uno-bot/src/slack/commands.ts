// Slash-command entry point: /uno-prototype, /uno-research, … (one per skill).
//
// SHAPE — why a slash command becomes an ordinary thread
// -----------------------------------------------------
// uno-bot is thread-native: history, the emoji proposal gate, and the resolution
// path all key off a channel + thread_ts. A slash command has neither until we
// make one. So the command posts a visible framing message into the channel and
// enqueues a synthetic `message` job threaded under it. Everything downstream —
// history, gates, proposals, the visible-failure backstops — runs unchanged,
// because from the runner's side this IS a message.
//
// TIMING — Slack gives us 3 seconds
// --------------------------------
// Slack shows the caller a timeout error if the HTTP response takes longer than
// 3s, and (unlike the Events API) does not retry. So the response is returned
// immediately and the post + enqueue happen in ctx.waitUntil. That ordering also
// means a failure after the ack can no longer reach the caller through the HTTP
// response — it goes back via response_url instead, which stays valid for 30
// minutes. Without that, a failed enqueue would be a silent no-op, the exact
// "acknowledged then nothing" failure this codebase fights everywhere else.

import type { Env } from "../types";
import { countedFetch } from "../net";
import { postMessage } from "./api";
import { enqueueAgentJob } from "./events";
import { SLASH_COMMANDS } from "../generated/slack-commands";
import type { SlackMessageEvent } from "./types";

interface SlashCommandPayload {
  command: string;
  text: string;
  userId: string;
  channelId: string;
  channelName: string;
  responseUrl: string;
}

function parsePayload(form: URLSearchParams): SlashCommandPayload | null {
  const command = form.get("command");
  const userId = form.get("user_id");
  const channelId = form.get("channel_id");
  if (!command || !userId || !channelId) return null;
  return {
    command,
    text: (form.get("text") ?? "").trim(),
    userId,
    channelId,
    channelName: form.get("channel_name") ?? "",
    responseUrl: form.get("response_url") ?? "",
  };
}

/** Ephemeral reply — visible only to the caller, never posted to the channel. */
function ephemeral(text: string): Response {
  return Response.json({ response_type: "ephemeral", text });
}

export function handleSlashCommand(
  env: Env,
  form: URLSearchParams,
  ctx: ExecutionContext,
): Response {
  const payload = parsePayload(form);
  if (!payload) {
    console.error("[slash] malformed payload — missing command/user_id/channel_id");
    return ephemeral(":warning: Slack sent a command I couldn't read. Try again?");
  }

  const target = SLASH_COMMANDS[payload.command];
  if (!target) {
    // Reachable whenever the app manifest declares a command the deployed Worker
    // doesn't know — i.e. the manifest was updated ahead of a deploy.
    console.error(`[slash] unknown command: ${payload.command}`);
    return ephemeral(
      `:warning: \`${payload.command}\` isn't wired up on my side yet. ` +
        `Known: ${Object.keys(SLASH_COMMANDS).map((c) => `\`${c}\``).join(" · ")}`,
    );
  }

  // No arguments is a question, not a run. Answering it costs nothing and
  // starting a thread to ask would litter the channel.
  if (!payload.text) {
    const hint = target.usageHint ? ` ${target.usageHint}` : " <what you want>";
    return ephemeral(`Usage: \`${payload.command}${hint}\``);
  }

  ctx.waitUntil(startRun(env, payload, target.skill));

  // The framing message lands a beat later; this is what the caller sees now.
  return ephemeral(`On it — starting *${target.skill}* in <#${payload.channelId}>. Watch the thread.`);
}

async function startRun(
  env: Env,
  payload: SlashCommandPayload,
  skill: string,
): Promise<void> {
  try {
    // The framing message is the thread root, and it is deliberately public:
    // the command was invoked in a channel, so the team can see what was asked
    // and follow the answer. It also quotes the request, so the thread reads
    // correctly for anyone arriving later without the ephemeral context.
    const posted = await postMessage(env, {
      channel: payload.channelId,
      text: `<@${payload.userId}> ran \`${payload.command}\`\n>>> ${payload.text}`,
    });

    const rootTs = posted?.ts;
    if (!rootTs) {
      throw new Error("chat.postMessage returned no ts — cannot thread the run");
    }

    // Synthetic message event. `user` is the human who typed the command (the
    // agent addresses them, and gate.ts's self-confirm guard compares against
    // the BOT id, so a human id is correct here). ts === thread_ts puts the run
    // in its own thread rooted at the framing message.
    const event: SlackMessageEvent = {
      type: "message",
      channel: payload.channelId,
      user: payload.userId,
      text: `Use the ${skill} skill.\n\n${payload.text}`,
      ts: rootTs,
      thread_ts: rootTs,
    };

    await enqueueAgentJob(env, { kind: "message", event }, `${payload.channelId}:${rootTs}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[slash] ${payload.command} failed to start: ${detail}`);
    await replyPrivately(
      payload.responseUrl,
      `:warning: I couldn't start \`${payload.command}\` — nothing is running. ` +
        `Try again, and if it repeats flag it in #uno-bot.`,
    );
  }
}

/**
 * Post back to the caller after the HTTP response is already gone. response_url
 * accepts up to 5 delayed responses within 30 minutes and does not need a token.
 */
async function replyPrivately(responseUrl: string, text: string): Promise<void> {
  if (!responseUrl) return;
  try {
    await countedFetch(responseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ response_type: "ephemeral", text }),
    });
  } catch (err) {
    console.error(`[slash] response_url delivery failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
