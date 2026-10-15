// blueprint_revise executor — a blueprint revision card's one operation, past
// a ✅ from a confirmer the card names: the revision written through the
// authoring RPCs under uno-bot's own identity, or nothing written at all. What
// it decides is `blueprint-write/write.ts`; this file binds `Env`, and the
// press's shared steps — its refusals before any call, the thread told — are
// `./blueprint-press.ts`.

import type { Env, SlackContext } from "../types";
import { countedFetch, rethrowIfBudget } from "../net";
import { cellUrl } from "../integrations/blueprint-link";
import { blueprintRpcFor, readRevision, revisionWriteCalls, writeRevision, type RevisionResult } from "../blueprint-write/index";
import { pressRefusalOn, threadTeller } from "./blueprint-press";

function failureText(label: string, result: Extract<RevisionResult, { ok: false }>): string {
  const parts = [`The revision to ${label} was not written: ${result.reason}.`];
  if (result.tookBack) parts.push(`Took back ${result.tookBack} ${result.tookBack === 1 ? "write" : "writes"}.`);
  if (result.notTakenBack.length) parts.push(`Could NOT take back: ${result.notTakenBack.join("; ")} — the blueprint still shows these.`);
  return parts.join(" ");
}

/** A path's lanes, one anon-key read — how a proposal's new path finds the
 *  lanes it copied. */
async function lanesOf(env: Env, pathId: string): Promise<Array<{ id: string; name: string }>> {
  const base = (env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  const res = await countedFetch(`${base}/rest/v1/lanes?select=id,name&path_id=eq.${encodeURIComponent(pathId)}`, {
    headers: { apikey: env.SUPABASE_ANON_KEY ?? "", authorization: `Bearer ${env.SUPABASE_ANON_KEY ?? ""}` },
  });
  if (!res.ok) throw new Error(`lanes read failed (${res.status})`);
  return (await res.json()) as Array<{ id: string; name: string }>;
}

/** ✅ on a blueprint revision card, on `Env`. */
export async function executeBlueprintRevise(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const revision = readRevision(input);
  if ("error" in revision) return JSON.stringify({ ok: false, error: revision.error });
  const tell = threadTeller(env, slack, "result");
  const refusal = pressRefusalOn(env, () => revisionWriteCalls(revision), {
    needs: "this revision needs",
    nothing: "nothing was written — split the revision",
  });
  if (refusal) {
    await tell(`The revision to ${revision.label} was not written: ${refusal}.`);
    return JSON.stringify({ ok: false, error: refusal });
  }

  const rpc = blueprintRpcFor(env);
  const sessionId = crypto.randomUUID();
  let result: RevisionResult;
  try {
    result = await writeRevision(revision, { rpc, sessionId, lanesOf: (pathId) => lanesOf(env, pathId) });
  } catch (err) {
    // Sign-in failing is the one throw: nothing was written yet.
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }

  const link = result.ok && result.cellIds[0] ? cellUrl(env.BLUEPRINT_APP_URL, result.cellIds[0]) : undefined;
  const text = result.ok && revision.variant
    ? `Drew ${result.cellIds.length} ${result.cellIds.length === 1 ? "cell" : "cells"} on a new ${revision.variant.status} path, "${revision.variant.name}", beside ${revision.label} on the blueprint as uno-bot (agent session ${sessionId}).${link ? ` ${link}` : ""}`
    : result.ok && !revision.rows.length && revision.path
    ? `Set ${revision.label} to ${revision.path.to} on the blueprint as uno-bot (agent session ${sessionId}).`
    : result.ok
    ? `Wrote ${result.cellIds.length} ${result.cellIds.length === 1 ? "cell" : "cells"}${revision.path ? ` and the path's status (${revision.path.to})` : ""} to ${revision.label} on the blueprint as uno-bot (agent session ${sessionId}).${link ? ` ${link}` : ""}`
    : failureText(revision.label, result);

  await tell(text);
  return JSON.stringify(
    result.ok
      ? {
          ok: true,
          message: text,
          session: sessionId,
          written: result.written,
          cells: result.cellIds,
          ...(result.createdPathId ? { created_path: result.createdPathId } : {}),
        }
      : { ok: false, error: text, session: sessionId, took_back: result.tookBack },
  );
}
