// The D1 UsageLog — production's `turns` table (migrations/usage/).
//
// Every statement is prepared with bound parameters, never assembled from
// values, and each one is charged to the meter BEFORE it is sent
// (`chargeD1Query`): one to the internal bucket under `d1`, and one against the
// per-invocation D1 query cap, which refuses the query past it the way the
// subrequest limit refuses a call.
//
// The database is taken BY NAME, typed as the two calls this file makes, so the
// Node suite compiles it without the Workers runtime; the workerd conformance
// run is what exercises it against a real (local) D1.

import { chargeD1Query } from "../net";
import { subTypeOf, type PainCategory } from "./categories";
import type { TurnRecord, UsageLog } from "./store";

/** The slice of `D1Database` this adapter uses. */
export interface UsageDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
  };
}

/** Column order for the insert; the one mapping from record to row. */
const COLUMNS = [
  "turn_id",
  "build",
  "requester_id",
  "surface",
  "in_thread",
  "channel_id",
  "ask_ts",
  "asked_at",
  "first_answer_at",
  "latency_ms",
  "tier",
  "route_reason",
  "provider",
  "model",
  "fallback_used",
  "tokens_in",
  "tokens_out",
  "tokens_thinking",
  "tokens_cached",
  "cost_usd",
  "tools_called",
  "sources_cited",
  "disposition",
  "proposal_id",
  "stop_used",
  "self_filed_ticket_url",
  "test_traffic",
  "request_text",
  "sub_type",
  "pain_category",
  "classified_at",
] as const;

type Row = Record<(typeof COLUMNS)[number], unknown>;

/** How a retried turn's upsert writes a column the classifier owns: a null
 *  leaves the stored label, and a classified row never gets its text back —
 *  the rule `./in-memory.ts` `mergeOnRetry` states for a map. */
const ON_RETRY: Partial<Record<(typeof COLUMNS)[number], string>> = {
  request_text: "CASE WHEN turns.classified_at IS NULL THEN excluded.request_text ELSE NULL END",
  sub_type: "COALESCE(excluded.sub_type, turns.sub_type)",
  pain_category: "COALESCE(excluded.pain_category, turns.pain_category)",
  classified_at: "COALESCE(excluded.classified_at, turns.classified_at)",
};

// An upsert that rewrites THIS record's columns only: a retried turn replaces
// its own values, the classifier's columns follow `ON_RETRY`, and columns a
// later migration adds for another writer survive it by being left out.
// `INSERT OR REPLACE` would delete the row first and lose them.
const UPSERT =
  `INSERT INTO turns (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")}) ` +
  `ON CONFLICT (turn_id) DO UPDATE SET ` +
  COLUMNS.filter((c) => c !== "turn_id")
    .map((c) => `${c} = ${ON_RETRY[c] ?? `excluded.${c}`}`)
    .join(", ");

const SELECT = `SELECT ${COLUMNS.join(", ")} FROM turns WHERE turn_id = ?`;

const bool = (b: boolean): number => (b ? 1 : 0);

function toRow(r: TurnRecord): unknown[] {
  const row: Row = {
    turn_id: r.turnId,
    build: r.build,
    requester_id: r.requesterId,
    surface: r.surface,
    in_thread: bool(r.inThread),
    channel_id: r.channelId,
    ask_ts: r.askTs,
    asked_at: r.askedAt,
    first_answer_at: r.firstAnswerAt,
    latency_ms: r.latencyMs,
    tier: r.tier,
    route_reason: r.routeReason,
    provider: r.provider,
    model: r.model,
    fallback_used: bool(r.fallbackUsed),
    tokens_in: r.tokensIn,
    tokens_out: r.tokensOut,
    tokens_thinking: r.tokensThinking,
    tokens_cached: r.tokensCached,
    cost_usd: r.costUsd,
    tools_called: JSON.stringify(r.toolsCalled),
    sources_cited: JSON.stringify(r.sourcesCited),
    disposition: r.disposition,
    proposal_id: r.proposalId,
    stop_used: bool(r.stopUsed),
    self_filed_ticket_url: r.selfFiledTicketUrl,
    test_traffic: bool(r.testTraffic),
    request_text: r.requestText,
    sub_type: r.subType,
    pain_category: r.painCategory,
    classified_at: r.classifiedAt,
  };
  return COLUMNS.map((c) => row[c]);
}

const str = (v: unknown): string => String(v);
const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number => Number(v);
const numOrNull = (v: unknown): number | null => (v == null ? null : Number(v));
const list = (v: unknown): string[] => {
  const parsed: unknown = JSON.parse(String(v ?? "[]"));
  return Array.isArray(parsed) ? parsed.map(String) : [];
};

function fromRow(row: Row): TurnRecord {
  return {
    turnId: str(row.turn_id),
    build: str(row.build),
    requesterId: str(row.requester_id),
    surface: row.surface === "assistant" ? "assistant" : "channel",
    inThread: num(row.in_thread) === 1,
    channelId: strOrNull(row.channel_id),
    askTs: str(row.ask_ts),
    askedAt: num(row.asked_at),
    firstAnswerAt: numOrNull(row.first_answer_at),
    latencyMs: numOrNull(row.latency_ms),
    tier: str(row.tier),
    routeReason: str(row.route_reason),
    provider: strOrNull(row.provider),
    model: strOrNull(row.model),
    fallbackUsed: num(row.fallback_used) === 1,
    tokensIn: num(row.tokens_in),
    tokensOut: num(row.tokens_out),
    tokensThinking: num(row.tokens_thinking),
    tokensCached: num(row.tokens_cached),
    costUsd: numOrNull(row.cost_usd),
    toolsCalled: list(row.tools_called),
    sourcesCited: list(row.sources_cited),
    disposition: str(row.disposition),
    proposalId: strOrNull(row.proposal_id),
    stopUsed: num(row.stop_used) === 1,
    selfFiledTicketUrl: strOrNull(row.self_filed_ticket_url),
    testTraffic: num(row.test_traffic) === 1,
    requestText: strOrNull(row.request_text),
    subType: subTypeOf(row.sub_type),
    painCategory: numOrNull(row.pain_category) as PainCategory | null,
    classifiedAt: numOrNull(row.classified_at),
  };
}

export function createD1UsageLog(deps: { db: UsageDatabase }): UsageLog {
  const { db } = deps;
  return {
    async record(turn) {
      chargeD1Query();
      await db.prepare(UPSERT).bind(...toRow(turn)).run();
    },
    async get(turnId) {
      chargeD1Query();
      const row = await db.prepare(SELECT).bind(turnId).first<Row>();
      return row ? fromRow(row) : null;
    },
  };
}
