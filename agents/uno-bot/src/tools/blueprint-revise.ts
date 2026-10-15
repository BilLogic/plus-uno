// blueprint_revise executor — a blueprint revision card's one operation, past
// a ✅ from a confirmer the card names: the revision written through the
// authoring RPCs under uno-bot's own identity, or nothing written at all. What
// it decides is `blueprint-write/write.ts`; this file binds `Env`, holds the
// press to its subrequest budget (ADR-022) and tells the thread.

import type { Env, SlackContext } from "../types";
import { budgetHeadroom, rethrowIfBudget } from "../net";
import { postMessage } from "../slack/api";
import { cellUrl } from "../integrations/blueprint-link";
import {
  blueprintRpcFor,
  readRevision,
  revisionWriteCalls,
  signInCalls,
  writeIdentityGap,
  writeRevision,
  type RevisionResult,
} from "../blueprint-write/index";

/**
 * External subrequests the press keeps for itself once the write is done: the
 * thread's reply, and what the Gate does after the batch (the result post on a
 * batch, the proposal events). A write that would eat into them is refused
 * before its first call rather than cut off half-written.
 */
export const PRESS_RESERVE = 4;

function failureText(label: string, result: Extract<RevisionResult, { ok: false }>): string {
  const parts = [`The revision to ${label} was not written: ${result.reason}.`];
  if (result.tookBack) parts.push(`Took back ${result.tookBack} ${result.tookBack === 1 ? "write" : "writes"}.`);
  if (result.leftDeprecated.length) {
    parts.push(
      `${result.leftDeprecated.length} new cell(s) are left as deprecated, because uno-bot may not delete — a person deletes them: ${result.leftDeprecated.join(", ")}.`,
    );
  }
  if (result.notTakenBack.length) parts.push(`Could NOT take back: ${result.notTakenBack.join("; ")} — the blueprint still shows these.`);
  return parts.join(" ");
}

/** ✅ on a blueprint revision card, on `Env`. */
export async function executeBlueprintRevise(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const revision = readRevision(input);
  if ("error" in revision) return JSON.stringify({ ok: false, error: revision.error });
  const gap = writeIdentityGap(env);
  if (gap) return JSON.stringify({ ok: false, error: gap });

  const cost = signInCalls(env) + revisionWriteCalls(revision);
  const headroom = budgetHeadroom().subrequests - PRESS_RESERVE;
  if (cost > headroom) {
    return JSON.stringify({
      ok: false,
      error: `this revision needs up to ${cost} blueprint calls and the press has ${Math.max(0, headroom)} left; nothing was written — split the revision`,
    });
  }

  const rpc = blueprintRpcFor(env);
  const sessionId = crypto.randomUUID();
  let result: RevisionResult;
  try {
    result = await writeRevision(revision, { rpc, sessionId });
  } catch (err) {
    // Sign-in failing is the one throw: nothing was written yet.
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  const link = result.ok && result.cellIds[0] ? cellUrl(env.BLUEPRINT_APP_URL, result.cellIds[0]) : undefined;
  const text = result.ok
    ? `Wrote ${result.cellIds.length} ${result.cellIds.length === 1 ? "row" : "rows"}${revision.path ? ` and the path's status (${revision.path.to})` : ""} to ${revision.label} on the blueprint as uno-bot (agent session ${sessionId}).${link ? ` ${link}` : ""}`
    : failureText(revision.label, result);

  if (!slack.batched) {
    const thread = slack.replyTs ?? slack.threadTs;
    try {
      await postMessage(env, { channel: slack.channel, ...(thread ? { thread_ts: thread } : {}), text });
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[blueprint] result not posted: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return JSON.stringify(
    result.ok
      ? { ok: true, message: text, session: sessionId, written: result.written }
      : { ok: false, error: text, session: sessionId, took_back: result.tookBack, left_deprecated: result.leftDeprecated },
  );
}
