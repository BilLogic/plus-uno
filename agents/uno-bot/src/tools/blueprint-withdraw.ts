// blueprint_withdraw executor — a proposal removal card's one operation, past
// a ✅ from the person who drew the proposal: its cells and then its path
// deleted through the delete RPCs under uno-bot's own identity, and its record
// marked withdrawn. What it decides is `blueprint-upkeep/proposal-cleanup.ts`;
// this file binds `Env`, and the press's shared steps — its refusals before
// any call, the thread told — are `./blueprint-press.ts`.

import type { Env, SlackContext } from "../types";
import { rethrowIfBudget } from "../net";
import { blueprintRpcFor } from "../blueprint-write/index";
import { readWithdrawal, withdrawalRefusal, withdrawalWriteCalls, withdrawProposal } from "../blueprint-upkeep/proposal-cleanup";
import { createD1ProposalRecords } from "../blueprint-upkeep/proposal-records-d1";
import { pressRefusalOn, threadTeller } from "./blueprint-press";

const cells = (n: number) => `${n} ${n === 1 ? "cell" : "cells"}`;

/** ✅ on a proposal removal card, on `Env`. */
export async function executeBlueprintWithdraw(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const w = readWithdrawal(input);
  if ("error" in w) return JSON.stringify({ ok: false, error: w.error });

  const tell = threadTeller(env, slack, "removal result");

  // The record as it stands now, not as it stood when the card went up.
  const records = env.USAGE_DB ? createD1ProposalRecords({ db: env.USAGE_DB }) : null;
  const refusal = withdrawalRefusal(w, records ? await records.standing(w.proposalTs) : null);
  if (refusal) {
    const text = `Nothing was removed: ${refusal}.`;
    await tell(text);
    return JSON.stringify({ ok: false, error: text });
  }

  const pressRefusal = pressRefusalOn(env, () => withdrawalWriteCalls(w), {
    needs: "removing this proposal needs",
    nothing: "nothing was removed",
  });
  if (pressRefusal) {
    await tell(`The proposal was not removed: ${pressRefusal}.`);
    return JSON.stringify({ ok: false, error: pressRefusal });
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
