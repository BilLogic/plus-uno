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
// here. Three doors do exactly that — `gate/reaction-door.ts` (reaction),
// `slack/interactive.ts` (button) and `turn/turn.ts` (typed emoji, and the
// model's own `proposal_resolve`).
//
// A door that names `Env` calls this function directly; a door that takes its
// dependencies BY NAME (#592 — the reaction door is the first) takes it as one
// named entry, and the Slack envelope binds `Env` into that entry once. Either
// way this file is the only place a side-effect tool runs, and every posted
// verdict may be handed here: the `won` check below is what makes a stale or
// cancelled one cost nothing.
//
// The side-effect tool table lives HERE, folded in from tools/dispatcher.ts
// (#497), because this gate is its only caller: a confirmed proposal is the one
// way a write tool ever runs. Read-only tools dispatch separately, inside the
// turn, from agent/run-agent.ts.

import type { Env, SlackContext } from "../types";
import { addReaction, postMessage, postReviewRequest, warrantsReviewRequest } from "../slack/api";
import {
  batchOutcomeNote,
  batchResultMessage,
  batchTelemetryLine,
  runOperations,
} from "../gate/index";
import type { GateVerdict } from "../gate/index";
import { proposalOperations } from "../thread-state/index";
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

  const proposed = proposalOperations(pending).length;
  const run = verdict.execute;
  if (!run) {
    console.log(
      batchTelemetryLine({ proposalTs: pending.proposalTs, proposed, approved: 0, outcomes: [] }),
    );
    await store.appendHistory(
      { channel: pending.channel, thread: pending.threadTs },
      {
        role: "assistant",
        content: `(Cancelled the proposed ${pending.toolName} — nothing was done.)`,
      },
    );
    return;
  }

  // One ✅ approved the whole batch, so the whole batch runs — in order, past a
  // failure, with an answer for each. `runOperations` owns that discipline; what
  // this file adds is the only thing it cannot have: `Env`, and the side-effect
  // tool table below.
  const outcomes = await runOperations(run.operations, (operation) =>
    executeTool(env, operation.toolName, operation.input, {
      channel: run.channel,
      threadTs: run.threadTs,
      userMsgTs: run.userMsgTs,
      // Carry the PRD resolved at proposal time — it's not re-extractable here.
      notionPrdId: run.notionPrdId,
      notionPrdUrl: run.notionPrdUrl,
    }),
  );

  // Proposed, approved and executed as three separate numbers: the failure this
  // ticket exists for is exactly the case where they disagree.
  console.log(
    batchTelemetryLine({
      proposalTs: pending.proposalTs,
      proposed,
      approved: run.operations.length,
      outcomes,
    }),
  );

  // Record the outcome (including any resulting URL) in thread history, so
  // later turns know what was actually done — e.g. the created PRD's Notion
  // link, so "delete that PRD" works and the bot never claims it created
  // nothing when it did. ONE note for the batch, naming every operation.
  await store.appendHistory(
    { channel: run.channel, thread: run.threadTs },
    { role: "assistant", content: batchOutcomeNote(outcomes) },
  );

  // Say what ran. A batch's partial result is invisible otherwise: the person
  // approved four things and the thread would show one tool's reply.
  const resultMessage = batchResultMessage(outcomes);
  if (resultMessage) {
    // Under the verdict's own reply target, which the gate already worked out
    // — the REAL message ts the card was posted with, never the conversation
    // key (see `PendingProposal.replyTs` for the DM that swallowed a write).
    await postMessage(env, {
      channel: run.channel,
      text: resultMessage,
      ...(verdict.post?.replyTs ? { thread_ts: verdict.post.replyTs } : {}),
    });
  }

  // D5: announce a successful reviewable artifact to #plus-design (right place
  // + person + time). Best-effort — never let a fan-out failure break the flow.
  for (const outcome of outcomes) {
    if (!warrantsReviewRequest(outcome.toolName) || !outcome.ok) continue;
    try {
      await postReviewRequest(env, {
        toolName: outcome.toolName,
        requesterUserId: run.requesterUserId,
        originChannel: run.channel,
        artifactUrl: resultUrl(outcome.result),
      });
    } catch (err) {
      console.warn(
        `[gate] review-request fan-out failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
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
