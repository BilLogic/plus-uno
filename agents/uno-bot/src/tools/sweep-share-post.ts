// sweep_share_post executor — the one operation a group DM's share card runs
// (src/sweep/share.ts). A `worker` tool: the Worker stages it, the model is
// never offered it, and it runs only past the Gate.
//
// It posts the exact text the card showed to the exact channel the card named,
// and nothing else. The channel has to be one of the two team channels a
// share may go to — #plus-design or #plus-universal, as configured — and is
// never #uno-bot, so a card however built cannot aim the note anywhere else.

import type { Env } from "../types";
import { postMessage } from "../slack/api";
import { sweepPostMetadata } from "../sweep/cards";

export async function executeSweepSharePost(env: Env, input: Record<string, unknown>): Promise<string> {
  const channel = typeof input.channel === "string" ? input.channel.trim() : "";
  const text = typeof input.text === "string" ? input.text : "";
  const allowed = [env.PLUS_DESIGN_CHANNEL_ID?.trim(), env.PLUS_UNIVERSAL_CHANNEL_ID?.trim()].filter(
    (id): id is string => !!id && id !== env.UNO_BOT_CHANNEL_ID?.trim(),
  );
  if (!channel || !allowed.includes(channel)) {
    return JSON.stringify({ ok: false, error: "a share note goes only to #plus-design or #plus-universal" });
  }
  if (!text.trim()) return JSON.stringify({ ok: false, error: "the note has no text" });
  const posted = await postMessage(env, { channel, text, metadata: sweepPostMetadata("note") });
  if (!posted.ok) {
    return JSON.stringify({ ok: false, status: "post_failed", detail: (posted as { error?: string }).error ?? "unknown" });
  }
  const name = typeof input.channel_name === "string" ? input.channel_name : "the team channel";
  return JSON.stringify({ ok: true, status: "shared", message: `Shared the note in ${name}.` });
}
