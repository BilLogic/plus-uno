// Durable Object: per-workspace store for
//   (a) conversation history per Slack thread
//   (b) pending tool-call proposals awaiting ✅ confirmation
//   (c) processed Slack event_id dedup (defeats Slack retry double-delivery)
//
// Single instance per workspace (selected via env.THREAD_STATE.idFromName("uno-bot")).
// Routes inside fetch():
//   GET    /history?channel=…&thread=…                          -> HistoryTurn[]
//   POST   /history    body { channel, thread_ts, turn }        -> { ok: true, length }
//   POST   /proposals  body { ts, payload }                     -> { ok: true }
//   GET    /proposals?ts=…                                      -> payload | 404
//   DELETE /proposals?ts=…                                      -> { ok: true }
//   POST   /events/check-and-record body { event_id }           -> { ok: true, seen: boolean }
//
// Storage keys: `hist:{channel}:{thread}`, `prop:{ts}`, `event:{event_id}`.

import type { Env } from "./types";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface HistoryRecord {
  turns: HistoryTurn[];
  updatedAt: number;
}

interface ProposalRecord {
  payload: unknown;
  createdAt: number;
}

interface EventRecord {
  seenAt: number;
  /** "running" = agent turn in flight (lease); "done" = handled. Absent on legacy records = done. */
  status?: "running" | "done";
}

// dial raised 2026-07-09 — team prefers thorough over fast (user decision)
const MAX_HISTORY_TURNS = 50;
const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;        // 7 days
// 60 min — was 15, but the gate waits on a HUMAN: live 2026-07-10 a designer's
// delayed ✅ landed on an expired card and nothing happened. An hour tolerates
// meetings/stepping away; the gate (not the clock) is still the safety.
const PROPOSAL_TTL_MS = 60 * 60 * 1000;
// 24h — was 10 min ("covers Slack's retry window"), but agent runs can now
// legally exceed 10 minutes (streaming + MCP; live 2026-07-10 run: 11 min),
// after which the duplicate app_mention/message copy passed dedup and re-ran
// the ENTIRE agent turn. One tiny record per user message — keep them a day.
const EVENT_DEDUP_TTL_MS = 24 * 60 * 60 * 1000;
// How long a "running" lease is trusted before it's presumed dead and the turn
// is reclaimed. Longest healthy run observed live is ~11 min; a legit run past
// this window would get double-run, so keep comfortable headroom above real runs.
const RUN_LEASE_MS = 20 * 60 * 1000;

export class ThreadState implements DurableObject {
  private storage: DurableObjectStorage;

  constructor(state: DurableObjectState, _env: Env) {
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === "/history" && method === "GET")    return this.getHistory(url);
      if (path === "/history" && method === "POST")   return this.appendHistory(request);
      if (path === "/proposals" && method === "POST") return this.putProposal(request);
      if (path === "/proposals" && method === "GET")  return this.getProposal(url);
      if (path === "/proposals" && method === "DELETE") return this.deleteProposal(url);
      if (path === "/proposals/by-thread" && method === "GET") return this.getProposalByThread(url);
      if (path === "/events/check-and-record" && method === "POST") return this.checkAndRecordEvent(request);
    } catch (err) {
      console.error(`[thread-state] ${method} ${path} failed:`, err);
      return json({ ok: false, error: String(err) }, 500);
    }

    return new Response("not found", { status: 404 });
  }

  // ----- history -----

  private async getHistory(url: URL): Promise<Response> {
    const channel = url.searchParams.get("channel");
    const thread = url.searchParams.get("thread");
    if (!channel || !thread) return json({ ok: false, error: "missing channel/thread" }, 400);

    const key = historyKey(channel, thread);
    const rec = await this.storage.get<HistoryRecord>(key);
    if (!rec) return json({ ok: true, turns: [] });

    if (Date.now() - rec.updatedAt > HISTORY_TTL_MS) {
      await this.storage.delete(key);
      return json({ ok: true, turns: [] });
    }
    return json({ ok: true, turns: rec.turns });
  }

  private async appendHistory(request: Request): Promise<Response> {
    const body = await request.json<{ channel: string; thread_ts: string; turn: HistoryTurn }>();
    if (!body?.channel || !body?.thread_ts || !body?.turn) {
      return json({ ok: false, error: "missing fields" }, 400);
    }
    const key = historyKey(body.channel, body.thread_ts);
    const prev = (await this.storage.get<HistoryRecord>(key))?.turns ?? [];
    const turns = [...prev, body.turn].slice(-MAX_HISTORY_TURNS);
    await this.storage.put<HistoryRecord>(key, { turns, updatedAt: Date.now() });
    return json({ ok: true, length: turns.length });
  }

  // ----- proposals -----

  private async putProposal(request: Request): Promise<Response> {
    const body = await request.json<{ ts: string; payload: unknown }>();
    if (!body?.ts) return json({ ok: false, error: "missing ts" }, 400);
    await this.storage.put<ProposalRecord>(proposalKey(body.ts), {
      payload: body.payload,
      createdAt: Date.now(),
    });
    return json({ ok: true });
  }

  private async getProposal(url: URL): Promise<Response> {
    const ts = url.searchParams.get("ts");
    if (!ts) return json({ ok: false, error: "missing ts" }, 400);
    const rec = await this.storage.get<ProposalRecord>(proposalKey(ts));
    if (!rec) return json({ ok: false, error: "not found" }, 404);
    if (Date.now() - rec.createdAt > PROPOSAL_TTL_MS) {
      await this.storage.delete(proposalKey(ts));
      return json({ ok: false, error: "expired" }, 410);
    }
    return json({ ok: true, payload: rec.payload, createdAt: rec.createdAt });
  }

  private async deleteProposal(url: URL): Promise<Response> {
    const ts = url.searchParams.get("ts");
    if (!ts) return json({ ok: false, error: "missing ts" }, 400);
    await this.storage.delete(proposalKey(ts));
    return json({ ok: true });
  }

  // Find the freshest non-expired proposal for a (channel, thread) pair.
  // Scans all `prop:*` keys — acceptable given the small active set
  // (proposals expire after 60 min so cardinality stays low).
  private async getProposalByThread(url: URL): Promise<Response> {
    const channel = url.searchParams.get("channel");
    const thread = url.searchParams.get("thread");
    if (!channel || !thread) return json({ ok: false, error: "missing channel/thread" }, 400);

    const all = await this.storage.list<ProposalRecord>({ prefix: "prop:" });
    const now = Date.now();
    let best: { proposalTs: string; payload: unknown; createdAt: number } | null = null;

    for (const [key, rec] of all) {
      if (now - rec.createdAt > PROPOSAL_TTL_MS) continue;
      const payload = rec.payload as { channel?: string; threadTs?: string; proposalTs?: string } | null;
      if (!payload || payload.channel !== channel || payload.threadTs !== thread) continue;
      if (!best || rec.createdAt > best.createdAt) {
        const ts = key.slice("prop:".length);
        best = { proposalTs: ts, payload, createdAt: rec.createdAt };
      }
    }

    if (!best) return json({ ok: false, error: "not found" }, 404);
    return json({ ok: true, payload: best.payload, createdAt: best.createdAt });
  }

  // ----- event dedup -----

  // Slack retries event delivery on timeout or non-200, so the same event_id
  // can arrive twice. We record first-time event_ids and skip duplicates.
  // Race-window note: two concurrent requests could both see "not seen" and
  // both proceed; acceptable because the volume is low and the worst case
  // (double-process) is rare; for stricter semantics we'd need
  // state.blockConcurrencyWhile.
  //
  // Two record modes:
  //   default   — one-shot: recorded as "done" immediately (envelope dedup).
  //   mode:"run"— a LEASE: recorded as "running"; the caller marks it "done"
  //               (mark:"done") when the agent turn completes. A "running"
  //               record older than RUN_LEASE_MS means the owning invocation
  //               was hard-killed mid-run (e.g. a deploy restarted the DO —
  //               live incident 2026-07-10: test-1 run killed by the PR #48
  //               deploy, then every alarm retry skipped on the stuck marker
  //               and the thread went permanently silent). Stale leases are
  //               reclaimed: the checker gets seen:false and re-runs the turn.
  private async checkAndRecordEvent(request: Request): Promise<Response> {
    const body = await request.json<{ event_id: string; mode?: "run"; mark?: "done" }>();
    if (!body?.event_id) return json({ ok: false, error: "missing event_id" }, 400);
    const key = eventKey(body.event_id);
    const existing = await this.storage.get<EventRecord>(key);
    if (body.mark === "done") {
      await this.storage.put<EventRecord>(key, {
        seenAt: existing?.seenAt ?? Date.now(),
        status: "done",
      });
      return json({ ok: true });
    }
    if (existing && Date.now() - existing.seenAt < EVENT_DEDUP_TTL_MS) {
      const status = existing.status ?? "done"; // legacy records = one-shot
      if (status === "done") return json({ ok: true, seen: true, state: "done" });
      if (Date.now() - existing.seenAt < RUN_LEASE_MS) {
        return json({ ok: true, seen: true, state: "running" });
      }
      // Stale "running" lease → fall through and reclaim.
    }
    await this.storage.put<EventRecord>(key, {
      seenAt: Date.now(),
      status: body.mode === "run" ? "running" : "done",
    });
    return json({ ok: true, seen: false });
  }
}

function historyKey(channel: string, thread: string): string {
  return `hist:${channel}:${thread}`;
}

function proposalKey(ts: string): string {
  return `prop:${ts}`;
}

function eventKey(eventId: string): string {
  return `event:${eventId}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
