// Durable Object: per-workspace store for
//   (a) conversation history per Slack thread
//   (b) pending tool-call proposals awaiting ✅ confirmation
//   (c) processed Slack event_id dedup (defeats Slack retry double-delivery)
//   (d) latest assistant-panel context per thread (what surface the user has open)
//
// Single instance per workspace (selected via env.THREAD_STATE.idFromName("uno-bot")).
// Routes inside fetch():
//   GET    /history?channel=…&thread=…                          -> HistoryTurn[]
//   POST   /history    body { channel, thread_ts, turn }        -> { ok: true, length }
//   POST   /proposals  body { ts, payload }                     -> { ok: true }
//   GET    /proposals?ts=…                                      -> payload | 404
//   DELETE /proposals?ts=…                                      -> { ok: true }
//   POST   /assistant-context body { channel, thread, context } -> { ok: true }
//   GET    /assistant-context?channel=…&thread=…                -> { ok, context }
//   POST   /events/check-and-record body { event_id }           -> { ok: true, seen: boolean }
//
// Storage keys: `hist:{channel}:{thread}`, `prop:{ts}`, `event:{event_id}`,
// `actx:{channel}:{thread}`.

import type { Env } from "./types";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
  /** Slack ts of the message this turn was delivered as, when known.
   *
   *  The merge key for `retrieval` below. buildThreadHistory (slack/events.ts)
   *  rebuilds history from the RAW Slack thread and returns without touching
   *  this store on the common path, so a receipt recorded only here would be
   *  invisible everywhere except the fallback path. Matching on ts is what
   *  makes it reachable. */
  ts?: string;
  /** What this turn actually retrieved — the tool, the query, and the shape of
   *  what came back. Rows are deliberately NOT persisted.
   *
   *  WHY IT EXISTS: with `{role, content}` only, turn 1's claim sits in turn 2's
   *  context as authoritative prose with no counter-evidence. A user correcting
   *  the bot is then arguing against the record. The receipt gives the next turn
   *  something to check the prose against, and names the query that must not be
   *  reissued verbatim. */
  retrieval?: {
    tool: string;
    query: string;
    path?: string;
    count: number;
    scenarios: string[];
  };
}

interface HistoryRecord {
  turns: HistoryTurn[];
  updatedAt: number;
}

interface ProposalRecord {
  payload: unknown;
  createdAt: number;
}

// Latest assistant-panel context (what surface the user has open) per thread.
// Written on assistant_thread_started / _context_changed, read by the next
// message. Stored opaque (the Slack AssistantContext shape) — the client types it.
interface AssistantContextRecord {
  context: unknown;
  updatedAt: number;
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

// How often the storage-GC alarm runs. Expired records are already ignored on
// read (TTL checks), but the DO is a single instance whose storage otherwise
// only grows — event: records in particular are write-once-per-message and were
// never deleted. A daily sweep keeps storage bounded (review 2026-07-12).
const GC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export class ThreadState implements DurableObject {
  private storage: DurableObjectStorage;

  constructor(state: DurableObjectState, _env: Env) {
    this.storage = state.storage;
  }

  // Ensure a GC alarm is scheduled. Cheap (one storage read) and idempotent —
  // called after every write so an idle-then-active DO always has a pending sweep.
  private async ensureGcAlarm(): Promise<void> {
    const existing = await this.storage.getAlarm();
    if (existing === null) {
      await this.storage.setAlarm(Date.now() + GC_INTERVAL_MS);
    }
  }

  // Delete expired records by their own TTL, then reschedule if anything remains.
  // Keys: event:{id} (EVENT_DEDUP_TTL_MS), hist:{…} (HISTORY_TTL_MS),
  // prop:{ts} (PROPOSAL_TTL_MS). Runs at most once a day.
  async alarm(): Promise<void> {
    const now = Date.now();
    let remaining = 0;

    const events = await this.storage.list<EventRecord>({ prefix: "event:" });
    for (const [key, rec] of events) {
      if (now - rec.seenAt > EVENT_DEDUP_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    const hist = await this.storage.list<HistoryRecord>({ prefix: "hist:" });
    for (const [key, rec] of hist) {
      if (now - rec.updatedAt > HISTORY_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    const props = await this.storage.list<ProposalRecord>({ prefix: "prop:" });
    for (const [key, rec] of props) {
      if (now - rec.createdAt > PROPOSAL_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    // Active-run pointers: one key per user, overwritten each turn, so this is
    // a bounded set rather than a leak — but a pointer older than its TTL can
    // never do anything except be ignored, so drop it rather than keep the
    // record of who talked to the bot last week.
    const runs = await this.storage.list<{ at: number }>({ prefix: "run:" });
    for (const [key, rec] of runs) {
      if (now - rec.at > CANCEL_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }
    const actx = await this.storage.list<AssistantContextRecord>({ prefix: "actx:" });
    for (const [key, rec] of actx) {
      if (now - rec.updatedAt > HISTORY_TTL_MS) await this.storage.delete(key);
      else remaining++;
    }

    if (remaining > 0) await this.storage.setAlarm(now + GC_INTERVAL_MS);
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
      if (path === "/assistant-context" && method === "POST") return this.putAssistantContext(request);
      if (path === "/assistant-context" && method === "GET")  return this.getAssistantContext(url);
      if (path === "/events/check-and-record" && method === "POST") return this.checkAndRecordEvent(request);
      if (path === "/cancel" && method === "POST")   return this.setCancel(url);
      if (path === "/cancel" && method === "GET")    return this.getCancel(url);
      if (path === "/active-run" && method === "POST") return this.setActiveRun(url);
      if (path === "/cancel/by-user" && method === "POST") return this.cancelByUser(url);
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
    await this.ensureGcAlarm();
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
    await this.ensureGcAlarm();
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

  // ----- assistant context -----

  private async putAssistantContext(request: Request): Promise<Response> {
    const body = await request.json<{ channel: string; thread: string; context: unknown }>();
    if (!body?.channel || !body?.thread) return json({ ok: false, error: "missing channel/thread" }, 400);
    await this.storage.put<AssistantContextRecord>(assistantContextKey(body.channel, body.thread), {
      context: body.context ?? {},
      updatedAt: Date.now(),
    });
    await this.ensureGcAlarm();
    return json({ ok: true });
  }

  // ----- cancel (the /stop command) -----
  //
  // A flag, not a signal: the Worker cannot interrupt a running alarm, so the
  // agent loop reads this between iterations and returns early. Cooperative, so
  // cancellation lands at a tool boundary rather than mid-write.
  //
  // Short TTL on purpose. A stale flag would abort the NEXT question the person
  // asks, which reads as the bot ignoring them — worse than a stop that missed.
  private async setCancel(url: URL): Promise<Response> {
    const key = cancelKey(url.searchParams.get("channel") ?? "", url.searchParams.get("thread") ?? "");
    await this.storage.put(key, { at: Date.now() });
    return json({ ok: true });
  }

  private async getCancel(url: URL): Promise<Response> {
    const key = cancelKey(url.searchParams.get("channel") ?? "", url.searchParams.get("thread") ?? "");
    const rec = await this.storage.get<{ at: number }>(key);
    if (!rec) return json({ ok: true, cancelled: false });
    // Consume it: one /stop cancels one turn. Leaving it set would cancel the
    // reply to whatever they ask next.
    await this.storage.delete(key);
    const fresh = Date.now() - rec.at < CANCEL_TTL_MS;
    return json({ ok: true, cancelled: fresh });
  }

  // ----- active run (the Home-tab Stop button) -----
  //
  // `/stop` and the Home-tab button each know HALF of what a cancel needs.
  // The command arrives with a channel and no reliable person; the button
  // arrives with a person and no channel at all — App Home is not anywhere.
  // This is the missing half: the last conversation each user started a turn
  // in, so the button can resolve "stop what I'm doing" without a registry
  // service, a session id, or asking them which channel they meant.
  //
  // One record per user, overwritten every turn. Not a history — the question
  // it answers is only ever about the run happening right now.
  //
  // TTL is CANCEL_TTL_MS, the same five minutes as a cancel flag, and for the
  // same reason: a stale pointer would cancel a conversation the person has
  // long since finished, which reads as the bot dropping a question.
  private async setActiveRun(url: URL): Promise<Response> {
    const user = url.searchParams.get("user") ?? "";
    const channel = url.searchParams.get("channel") ?? "";
    const thread = url.searchParams.get("thread") ?? "";
    if (!user || !channel || !thread) return json({ ok: false, error: "missing user/channel/thread" }, 400);
    await this.storage.put(activeRunKey(user), { channel, thread, at: Date.now() });
    return json({ ok: true });
  }

  // Resolve the person's active run and set its cancel flag, in ONE hop. The
  // two-call shape (look up, then cancel) would spend a second DO round trip
  // inside a Slack interaction that has 3 seconds to ack, to no benefit — the
  // caller has nothing to do with the lookup except cancel it.
  private async cancelByUser(url: URL): Promise<Response> {
    const user = url.searchParams.get("user") ?? "";
    if (!user) return json({ ok: false, error: "missing user" }, 400);
    const rec = await this.storage.get<{ channel: string; thread: string; at: number }>(activeRunKey(user));
    if (!rec || Date.now() - rec.at > CANCEL_TTL_MS) {
      return json({ ok: true, cancelled: false });
    }
    await this.storage.put(cancelKey(rec.channel, rec.thread), { at: Date.now() });
    return json({ ok: true, cancelled: true, channel: rec.channel });
  }

  private async getAssistantContext(url: URL): Promise<Response> {
    const channel = url.searchParams.get("channel");
    const thread = url.searchParams.get("thread");
    if (!channel || !thread) return json({ ok: false, error: "missing channel/thread" }, 400);
    const key = assistantContextKey(channel, thread);
    const rec = await this.storage.get<AssistantContextRecord>(key);
    if (!rec) return json({ ok: true, context: null });
    if (Date.now() - rec.updatedAt > HISTORY_TTL_MS) {
      await this.storage.delete(key);
      return json({ ok: true, context: null });
    }
    return json({ ok: true, context: rec.context });
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
    await this.ensureGcAlarm();
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

// Cancel flags expire fast on purpose: a stale one would abort the NEXT
// question, which reads as the bot ignoring you.
const CANCEL_TTL_MS = 5 * 60_000;
function cancelKey(channel: string, thread: string): string {
  return `cancel:${channel}:${thread}`;
}

// Same TTL as a cancel flag — see setActiveRun.
function activeRunKey(user: string): string {
  return `run:${user}`;
}

function assistantContextKey(channel: string, thread: string): string {
  return `actx:${channel}:${thread}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
