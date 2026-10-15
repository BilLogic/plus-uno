// blueprint_withdraw executor — a proposal removal card's one operation, past
// a ✅ from the person who drew the proposal: its cells and then its path
// deleted through the delete RPCs under uno-bot's own identity, and its record
// marked withdrawn. What it decides is `blueprint-upkeep/proposal-cleanup.ts`;
// this file binds `Env`, holds the press to its subrequest budget (ADR-022)
// and tells the thread.

import type { Env, SlackContext } from "../types";
import { budgetHeadroom, rethrowIfBudget } from "../net";
import { postMessage } from "../slack/api";
import { blueprintRpcFor, signInCalls, writeIdentityGap } from "../blueprint-write/index";
import { readWithdrawal, withdrawalRefusal, withdrawalWriteCalls, withdrawProposal } from "../blueprint-upkeep/proposal-cleanup";
import { createD1ProposalRecords } from "../blueprint-upkeep/proposal-records-d1";
import { PRESS_RESERVE } from "./blueprint-revise";

const cells = (n: number) => `${n} ${n === 1 ? "cell" : "cells"}`;

/** ✅ on a proposal removal card, on `Env`. */
export async function executeBlueprintWithdraw(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const w = readWithdrawal(input);
  if ("error" in w) return JSON.stringify({ ok: false, error: w.error });

  const tell = async (text: string) => {
    if (slack.batched) return;
    const thread = slack.replyTs ?? slack.threadTs;
    try {
      await postMessage(env, { channel: slack.channel, ...(thread ? { thread_ts: thread } : {}), text });
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[blueprint] removal result not posted: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // The record as it stands now, not as it stood when the card went up.
  const records = env.USAGE_DB ? createD1ProposalRecords({ db: env.USAGE_DB }) : null;
  const refusal = withdrawalRefusal(w, records ? await records.standing(w.proposalTs) : null);
  if (refusal) {
    const text = `Nothing was removed: ${refusal}.`;
    await tell(text);
    return JSON.stringify({ ok: false, error: text });
  }

  const gap = writeIdentityGap(env);
  if (gap) return JSON.stringify({ ok: false, error: gap });
  const cost = signInCalls(env) + withdrawalWriteCalls(w);
  const headroom = budgetHeadroom().subrequests - PRESS_RESERVE;
  if (cost > headroom) {
    return JSON.stringify({
      ok: false,
      error: `removing this proposal needs up to ${cost} blueprint calls and the press has ${Math.max(0, headroom)} left; nothing was removed`,
    });
  }

  const result = await (async () => {
    try {
      return await withdrawProposal(w, { rpc: blueprintRpcFor(env), sessionId: crypto.randomUUID() });
    } catch (err) {
      // Sign-in failing is the one throw: nothing was deleted yet.
      rethrowIfBudget(err);
      return { error: err instanceof Error ? err.message : String(err) };
    }
  })();
  if ("error" in result) return JSON.stringify({ ok: false, error: result.error });

  const missed = result.notDeleted.length ? ` Could not delete ${result.notDeleted.join("; ")}.` : "";
  if (!result.ok) {
    const text = `The proposal was not removed: ${result.reason}. Deleted ${cells(result.deletedCells)} of ${w.cellIds.length} first.${missed}`;
    await tell(text);
    return JSON.stringify({ ok: false, error: text });
  }

  try {
    await records?.withdraw(w.proposalTs, Date.now());
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[proposal-cleanup] ${w.proposalTs} removed but not marked withdrawn: ${err instanceof Error ? err.message : String(err)}`);
  }
  const text = `Removed the proposal from the blueprint as uno-bot: its ${cells(w.cellIds.length)} and its proposed path, each delete recorded in the blueprint's change log.${missed}`;
  await tell(text);
  return JSON.stringify({ ok: true, message: text, deleted_cells: result.deletedCells, deleted_path: w.pathId });
}
