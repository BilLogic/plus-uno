// Shared resolution path. Called from:
//   - slack/gate.ts (reaction path)        — narrative is undefined; we use a default
//   - slack/events.ts (text path)          — narrative comes from Claude's `message_to_user`
//
// Effects:
//   0. CLAIM the proposal — the delete doubles as the lock, so exactly one
//      resolver proceeds past this line
//   1. Post a thread reply with the narrative
//   2. React :handshake: or :wave: on the user's ORIGINAL request message
//      (the message that prompted the proposal, stored as pending.userMsgTs)
//   3. If confirm: fire the side-effect tool via executeTool

import type { Env } from "../types";
import { addReaction, postMessage, postReviewRequest, warrantsReviewRequest } from "../slack/api";
import { appendHistory, claimPendingProposal, type PendingProposal } from "../thread-state-client";
import { executeTool } from "../tools/dispatcher";

export type Decision = "confirm" | "cancel";

/** Resolves the proposal. Returns true if THIS call won the claim and acted;
 *  false if another resolver (reaction, button, typed emoji, model) got there
 *  first — in which case nothing was posted and the caller should stay quiet. */
export async function resolveProposal(
  env: Env,
  pending: PendingProposal,
  decision: Decision,
  narrative?: string,
): Promise<boolean> {
  // Claim first — before the narrative, before the reaction, and long before
  // executeTool. A user who reacts ✅ and then, unsure it registered, also
  // types "go ahead" runs two handlers that each loaded this same record.
  // Whoever loses here must not post, must not react, and above all must not
  // execute. Losing is not an error — the winner is handling it — so return
  // quietly rather than telling the user twice about one action.
  if (!(await claimPendingProposal(env, pending.proposalTs))) {
    console.log(
      `[gate] ${pending.toolName} at ${pending.proposalTs} was already claimed — standing down`,
    );
    return false;
  }

  const text =
    narrative ??
    (decision === "confirm" ? "Got it — kicking that off." : "Cancelled.");

  // replyTs, NOT threadTs — see PendingProposal. threadTs is the history key
  // and is the literal string "dm" in a DM, which Slack rejects.
  const posted = await postMessage(env, {
    channel: pending.channel,
    thread_ts: pending.replyTs ?? pending.threadTs,
    text,
  });
  // A resolution that cannot speak is the failure this whole path guards
  // against, so it is never silent in the logs even when it is silent in Slack.
  if (!posted.ok) {
    console.error(
      `[gate] narrative post FAILED for ${pending.toolName} in ${pending.channel} ` +
        `(thread=${pending.replyTs ?? pending.threadTs}): ${(posted as { error?: string }).error ?? "unknown"}`,
    );
  }

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

    // D5: announce a successful reviewable artifact to #plus-design (right place
    // + person + time). Best-effort — never let a fan-out failure break the flow.
    if (warrantsReviewRequest(pending.toolName) && isOkResult(result)) {
      try {
        await postReviewRequest(env, {
          toolName: pending.toolName,
          requesterUserId: pending.requesterUserId,
          originChannel: pending.channel,
          artifactUrl: resultUrl(result),
        });
      } catch (err) {
        console.warn(`[gate] review-request fan-out failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else {
    await appendHistory(env, pending.channel, pending.threadTs, {
      role: "assistant",
      content: `(Cancelled the proposed ${pending.toolName} — nothing was done.)`,
    });
  }
  // No delete here any more: the claim above already removed the record, which
  // is what made it a claim.
  return true;
}

/** True unless the executor explicitly reported ok:false. */
function isOkResult(resultJson: string): boolean {
  try {
    return (JSON.parse(resultJson) as { ok?: boolean }).ok !== false;
  } catch {
    return false;
  }
}

/** Pull an artifact URL (PR/Notion link) out of a tool result, if present. */
function resultUrl(resultJson: string): string | undefined {
  try {
    const r = JSON.parse(resultJson) as { url?: string; pr_url?: string };
    return r.url ?? r.pr_url ?? undefined;
  } catch {
    return undefined;
  }
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
