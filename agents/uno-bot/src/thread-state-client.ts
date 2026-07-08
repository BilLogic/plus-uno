// Typed client for the ThreadState Durable Object. The rest of the Worker
// uses these helpers — it never builds DO URLs by hand.

import type { Env } from "./types";
import type { HistoryTurn } from "./thread-state";

export type { HistoryTurn };

export interface PendingProposal {
  toolName: string;
  input: Record<string, unknown>;
  toolUseId: string;
  /** Anthropic.ContentBlock[] serialized as JSON. Reserved for a future resume path. */
  assistantContent: unknown[];
  channel: string;
  threadTs: string;
  userMsgTs: string;
  proposalTs: string;
  proposalText: string;
  /** Slack user ID of the person who triggered the proposal. Only this user
   *  can confirm (via ✅ or text). Enforced both at the Worker boundary and
   *  via system-prompt instructions to Claude. */
  requesterUserId: string;
  /** Notion PRD resolved at proposal time (from the thread root). Carried here
   *  so it survives the proposal→confirm round-trip and reaches the executor —
   *  resolveProposal otherwise rebuilds the slack context without it. */
  notionPrdId?: string;
  notionPrdUrl?: string;
}

const DO_INSTANCE_NAME = "uno-bot";

function stub(env: Env): DurableObjectStub {
  const id = env.THREAD_STATE.idFromName(DO_INSTANCE_NAME);
  return env.THREAD_STATE.get(id);
}

async function call(env: Env, path: string, init?: RequestInit): Promise<Response> {
  return stub(env).fetch(`https://do${path}`, init);
}

// ----- history -----

export async function loadHistory(
  env: Env,
  channel: string,
  thread_ts: string,
): Promise<HistoryTurn[]> {
  const res = await call(env, `/history?channel=${encodeURIComponent(channel)}&thread=${encodeURIComponent(thread_ts)}`);
  if (!res.ok) return [];
  const body = (await res.json()) as { turns?: HistoryTurn[] };
  return body.turns ?? [];
}

export async function appendHistory(
  env: Env,
  channel: string,
  thread_ts: string,
  turn: HistoryTurn,
): Promise<void> {
  await call(env, "/history", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel, thread_ts, turn }),
  });
}

// ----- proposals -----

export async function savePendingProposal(env: Env, p: PendingProposal): Promise<void> {
  await call(env, "/proposals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ts: p.proposalTs, payload: p }),
  });
}

export async function loadPendingProposal(env: Env, ts: string): Promise<PendingProposal | null> {
  const res = await call(env, `/proposals?ts=${encodeURIComponent(ts)}`);
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) return null;
  const body = (await res.json()) as { ok: boolean; payload?: PendingProposal };
  return body.payload ?? null;
}

export async function loadPendingProposalByThread(
  env: Env,
  channel: string,
  threadTs: string,
): Promise<PendingProposal | null> {
  const q = `channel=${encodeURIComponent(channel)}&thread=${encodeURIComponent(threadTs)}`;
  const res = await call(env, `/proposals/by-thread?${q}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = (await res.json()) as { ok: boolean; payload?: PendingProposal };
  return body.payload ?? null;
}

export async function deletePendingProposal(env: Env, ts: string): Promise<void> {
  await call(env, `/proposals?ts=${encodeURIComponent(ts)}`, { method: "DELETE" });
}

// ----- event dedup -----

// Returns true if the event was already processed within the dedup TTL.
// Caller should skip handling when true. On any network/DO failure we
// return false so the event still has a chance to be handled — double-processing
// is worse-case acceptable; missing a real event is not.
export async function isDuplicateEvent(env: Env, event_id: string): Promise<boolean> {
  try {
    const res = await call(env, "/events/check-and-record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event_id }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { seen?: boolean };
    return body.seen === true;
  } catch {
    return false;
  }
}
