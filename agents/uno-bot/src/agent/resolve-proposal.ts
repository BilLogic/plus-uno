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
// `slack/button-door.ts` (button) and `turn/turn.ts` (typed emoji, and the
// model's own `proposal_resolve`).
//
// A door that names `Env` calls this function directly; a door that takes its
// dependencies BY NAME (#592 — the reaction door is the first) takes it as one
// named entry, and the Slack envelope binds `Env` into that entry once. Either
// way this file is the only place a side-effect tool runs, and every posted
// verdict may be handed here: the `won` check below is what makes a stale or
// cancelled one cost nothing.
//
// The gated dispatch lives HERE, folded in from tools/dispatcher.ts (#497),
// because this gate is its only caller: a confirmed proposal is the one way a
// write tool ever runs. Ungated tools dispatch separately, inside the turn,
// from agent/run-agent.ts. Both are lookups against the same table now (#597)
// — this one keyed on `access === "gated"`, which is exactly the standing that
// put the proposal in front of a person in the first place.

import type { Env, SlackContext } from "../types";
import { addReaction, postMessage, postReviewRequest, warrantsReviewRequest } from "../slack/api";
import { batchOutcomeNote, batchTelemetryLine, runOperations, settleInto } from "../gate/index";
import { batchResultMessage } from "../slack/batch-result";
import type { GateVerdict } from "../gate/index";
import { proposalOperations } from "../thread-state/index";
import { threadStateFor } from "../thread-state/production";
import { isToolName } from "./tool-table";
import { TOOLS_BY_NAME } from "./tools";

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
  // Each operation is marked in the execution record Gate opened at the claim
  // as it comes back, so a run cut off part-way can be told apart from one
  // that never started — and what finished is never offered back. The mark
  // also answers whether a later look has already TAKEN this run as cut off;
  // if so the batch stops there and tells nothing (the fence,
  // `ThreadState.settleOperation`): the person already has a note and a card
  // for the rest, and a second account would contradict it.
  let fenced = false;
  const outcomes = await runOperations(
    run.operations,
    (operation) =>
      executeTool(env, operation.toolName, operation.input, {
        channel: run.channel,
        threadTs: run.threadTs,
        // The real ts to reply under, and who asked: a relayed DM names the
        // requester to its recipient and confirms in their thread.
        // Who ASKED — the requester of record — not whoever pressed ✅: anyone
        // in the thread may approve, and `email_send`'s allowlist and a relayed
        // DM's attribution are both about the person the action is for.
        ...(verdict.post?.replyTs ? { replyTs: verdict.post.replyTs } : {}),
        requestedBy: run.requesterUserId,
        // More than one operation → `batchResultMessage` below is the thread's
        // one account of the outcome.
        ...(run.operations.length > 1 ? { batched: true } : {}),
        userMsgTs: run.userMsgTs,
        // Carry the PRD resolved at proposal time — it's not re-extractable here.
        notionPrdId: run.notionPrdId,
        notionPrdUrl: run.notionPrdUrl,
      }),
    settleInto(store, pending.proposalTs, () => {
      fenced = true;
    }),
  );

  // Past the batch every operation has come back, or the fence stopped it, so
  // whatever happens next the execution record goes. A throw below — the
  // history write, the result post — is the door's to report
  // ("resolve-failed"), and a record left standing would add a cut-off note
  // five minutes later about a run that was not cut off. One note, not two.
  try {
    // Proposed, approved and executed as three separate numbers: the failure
    // this ticket exists for is exactly the case where they disagree.
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
    // Written when fenced too: it is memory rather than a post, and it is true.
    await store.appendHistory(
      { channel: run.channel, thread: run.threadTs },
      { role: "assistant", content: batchOutcomeNote(outcomes) },
    );
    if (fenced) return;

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
  } finally {
    // Told, fenced, or telling it threw: the run is over either way. Only what
    // stops this function BEFORE the batch returns — an evicted isolate, a
    // `waitUntil` past its budget — leaves the record standing, and the next
    // look at the card or its thread says so (`gate/gate.ts` `cutOffVerdict`).
    // A failed delete is a false "this was cut off" note later, so it is logged
    // where it can be seen.
    try {
      await store.endExecution(pending.proposalTs);
    } catch (err) {
      console.error(
        `[gate] execution record for ${pending.proposalTs} not cleared: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
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
 * Run the confirmed tool: one lookup in the tool table, one body.
 *
 * It was a seven-arm `switch` over tool names with a `default` that answered
 * "unknown tool" (#597) — an arm nobody held equal to the `gated` rows, so a
 * new write tool could be proposed, staged, approved and then quietly do
 * nothing. The body comes off the row now, and every `gated` row has one by
 * type.
 *
 * What remains is the gate's own invariant, checked once: only a `gated` tool
 * runs from here. A proposal naming an `ungated` read or the `control` tool is
 * a caller bug, not a user error, so it answers `ok:false` — the resolution
 * path is mid-flight and a throw here would cost the acknowledgement, the
 * history note and the rest of the batch.
 *
 * Each body returns a JSON string that goes straight into a `tool_result`
 * content block.
 */
async function executeTool(
  env: Env,
  name: string,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  if (!isToolName(name)) {
    return JSON.stringify({ ok: false, error: `unknown tool: ${name}` });
  }
  const row = TOOLS_BY_NAME[name];
  if (row.access !== "gated") {
    return JSON.stringify({
      ok: false,
      error: `'${name}' is ${row.access} and does not run from the gate`,
    });
  }
  return row.run(env, input, slack);
}
