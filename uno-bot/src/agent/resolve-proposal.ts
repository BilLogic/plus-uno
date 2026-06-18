// Shared resolution path. Called from:
//   - slack/gate.ts (reaction path)        — narrative is undefined; we use a default
//   - slack/events.ts (text path)          — narrative comes from Claude's `message_to_user`
//
// Effects:
//   1. Post a thread reply with the narrative
//   2. React :handshake: or :wave: on the user's ORIGINAL request message
//      (the message that prompted the proposal, stored as pending.userMsgTs)
//   3. If confirm: fire the side-effect tool via executeTool
//   4. Delete the pending proposal from the DO

import type { Env } from "../types";
import { addReaction, postMessage } from "../slack/api";
import { appendHistory, deletePendingProposal, type PendingProposal } from "../thread-state-client";
import { executeTool } from "../tools/dispatcher";

export type Decision = "confirm" | "cancel";

export async function resolveProposal(
  env: Env,
  pending: PendingProposal,
  decision: Decision,
  narrative?: string,
): Promise<void> {
  const text =
    narrative ??
    (decision === "confirm" ? "Got it — kicking that off." : "Cancelled.");

  await postMessage(env, {
    channel: pending.channel,
    thread_ts: pending.threadTs,
    text,
  });

  await addReaction(
    env,
    pending.channel,
    pending.userMsgTs,
    decision === "confirm" ? "handshake" : "wave",
  );

  if (decision === "confirm") {
    const result = await executeTool(env, pending.toolName, pending.input, {
      channel: pending.channel,
      threadTs: pending.threadTs,
      userMsgTs: pending.userMsgTs,
      // Carry the PRD resolved at proposal time — it's not re-extractable here.
      notionPrdId: pending.notionPrdId,
      notionPrdUrl: pending.notionPrdUrl,
    });
    console.log(`[gate] ${pending.toolName} executed: ${result}`);
    // Record the outcome (including any resulting URL) in thread history, so
    // later turns know what was actually done — e.g. the created PRD's Notion
    // link, so "delete that PRD" works and the bot never claims it created
    // nothing when it did. Neither caller (gate.ts reaction path, events.ts text
    // path) records the executed result otherwise.
    await appendHistory(env, pending.channel, pending.threadTs, {
      role: "assistant",
      content: outcomeNote(pending.toolName, result),
    });
  } else {
    await appendHistory(env, pending.channel, pending.threadTs, {
      role: "assistant",
      content: `(Cancelled the proposed ${pending.toolName} — nothing was done.)`,
    });
  }

  await deletePendingProposal(env, pending.proposalTs);
}

/** Human-readable history note for a confirmed tool execution. Surfaces the
 *  result message + any URL so the bot remembers what it did on later turns. */
function outcomeNote(toolName: string, resultJson: string): string {
  try {
    const r = JSON.parse(resultJson) as {
      ok?: boolean; message?: string; url?: string; error?: string; detail?: string;
    };
    if (r.ok === false) {
      return `(${toolName} did NOT complete: ${r.error ?? r.detail ?? "unknown error"}. Nothing was created — do not claim success.)`;
    }
    const msg = r.message ?? `${toolName} completed.`;
    return r.url ? `${msg} Notion link: ${r.url}` : msg;
  } catch {
    return `${toolName} completed.`;
  }
}
