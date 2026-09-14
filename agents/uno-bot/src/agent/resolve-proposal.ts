// What happens AFTER the gate says yes: the confirmed tool, the acknowledging
// reaction, and the record of what was done.
//
// The decision half of this file is gone — the lookup, the emoji parse, the
// claim and the lost-race message are `gate/gate.ts` now, once, for all four
// doors (#500). What is left is the part that needs `Env`: a side-effect tool
// only ever runs from here, and only ever on a verdict that WON its claim.
//
// So the shape is: a door builds a signal, `resolveSignal` returns a verdict,
// the door posts `verdict.post` through its Delivery, and hands the verdict
// here. Three callers do exactly that — `slack/gate.ts` (reaction),
// `slack/interactive.ts` (button) and `turn/turn.ts` (typed emoji, and the
// model's own `proposal_resolve`).
//
// The side-effect tool table lives HERE, folded in from tools/dispatcher.ts
// (#497), because this gate is its only caller: a confirmed proposal is the one
// way a write tool ever runs. Read-only tools dispatch separately, inside the
// turn, from agent/run-agent.ts.

import type { Env, SlackContext } from "../types";
import { addReaction, postReviewRequest, warrantsReviewRequest } from "../slack/api";
import type { GateVerdict } from "../gate/index";
import { threadStateFor } from "../thread-state/production";
import { executeImplement } from "../tools/implement";
import { executeImplementDesign } from "../tools/implement-design";
import { executeNotionCreate } from "../tools/notion-create";
import { executeNotionUpdate } from "../tools/notion-update";
import { executeNotionArchive } from "../tools/notion-archive";
import { executeSendEmail } from "../tools/send-email";
import { executeShareForFeedback } from "../tools/share-for-feedback";

/**
 * Act on a verdict that won its claim: react on the person's ORIGINAL request
 * message, run the confirmed tool, and write what happened into thread
 * history.
 *
 * A verdict that did NOT win is a no-op here, so a door may hand over
 * whatever the gate returned without branching: the one thing that must never
 * happen past a lost race is execution.
 */
export async function executeVerdict(env: Env, verdict: GateVerdict): Promise<void> {
  if (verdict.outcome !== "won" || !verdict.proposal) return;
  const pending = verdict.proposal;
  const store = threadStateFor(env);

  await addReaction(
    env,
    pending.channel,
    pending.userMsgTs,
    verdict.decision === "confirm" ? "handshake" : "wave",
  );

  const run = verdict.execute;
  if (!run) {
    await store.appendHistory(
      { channel: pending.channel, thread: pending.threadTs },
      {
        role: "assistant",
        content: `(Cancelled the proposed ${pending.toolName} — nothing was done.)`,
      },
    );
    return;
  }

  const result = await executeTool(env, run.toolName, run.input, {
    channel: run.channel,
    threadTs: run.threadTs,
    userMsgTs: run.userMsgTs,
    // Carry the PRD resolved at proposal time — it's not re-extractable here.
    notionPrdId: run.notionPrdId,
    notionPrdUrl: run.notionPrdUrl,
  });
  console.log(`[gate] ${run.toolName} executed: ${result}`);
  // Record the outcome (including any resulting URL) in thread history, so
  // later turns know what was actually done — e.g. the created PRD's Notion
  // link, so "delete that PRD" works and the bot never claims it created
  // nothing when it did. No door records the executed result otherwise.
  await store.appendHistory(
    { channel: run.channel, thread: run.threadTs },
    { role: "assistant", content: outcomeNote(run.toolName, result) },
  );

  // D5: announce a successful reviewable artifact to #plus-design (right place
  // + person + time). Best-effort — never let a fan-out failure break the flow.
  if (warrantsReviewRequest(run.toolName) && isOkResult(result)) {
    try {
      await postReviewRequest(env, {
        toolName: run.toolName,
        requesterUserId: run.requesterUserId,
        originChannel: run.channel,
        artifactUrl: resultUrl(result),
      });
    } catch (err) {
      console.warn(
        `[gate] review-request fan-out failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
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

/**
 * The side-effect tool table. Each body returns a JSON string that goes
 * straight into a tool_result content block.
 *
 * Reached only past the gate — an unknown name is a caller bug, not a user
 * error, so it answers ok:false rather than throwing into the resolution path.
 */
async function executeTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  switch (name) {
    case "notion_create":
      return executeNotionCreate(env, input, slack);
    case "notion_update":
      return executeNotionUpdate(env, input, slack);
    case "notion_archive":
      return executeNotionArchive(env, input, slack);
    case "component_implement":
      return executeImplement(env, input, slack);
    case "prototype_scaffold":
      return executeImplementDesign(env, input, slack);
    case "shareout_post":
      return executeShareForFeedback(env, input, slack);
    case "email_send":
      return executeSendEmail(env, input, slack);
    default:
      return JSON.stringify({ ok: false, error: `unknown tool: ${name}` });
  }
}
