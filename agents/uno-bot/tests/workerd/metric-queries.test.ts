// Every metric query file, run against a seeded local D1 with the real
// migrations applied, its numbers asserted on the seed.
//
// The seed is one small team over two weeks — Mon 2026-08-03 to Sun 08-16 —
// with a row for each trap a query has to step around: test traffic (a
// sandbox ask, two greetings, an eval), rows either side of the window, an
// ungraded answer, a graded row naming no turn, a re-staged card that lends
// its root's turn, a revised card, a worker card from each proactive job, and
// an empty role map. Expected numbers are worked by hand from the tables in
// the comments, so a changed definition shows up as a changed number here.
//
// The queries come from vitest.workerd.config.mts (`METRIC_QUERIES`); the
// rendering is the CLI's own (scripts/metric-query-render.mjs), inputs parsed
// from CSV the way the CLI parses them.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

import { inputRows, parseCsv, renderMetricQuery } from "../../scripts/metric-query-render.mjs";

const bindings = env as unknown as {
  USAGE_DB: D1Database;
  USAGE_MIGRATIONS: Parameters<typeof applyD1Migrations>[1];
  METRIC_QUERIES: Record<string, string>;
};

const FINAL_METRICS = "https://www.notion.so/3eab7cca498281c79119da63b2f2077f";

/** 2026-08-<day> <h>:<m> UTC, epoch ms (July for day > 31 is never used). */
const T = (day: number, h: number, m = 0) => Date.UTC(2026, 7, day, h, m);
const HOUR = 3_600_000;

// ── the seed ─────────────────────────────────────────────────────────────────
//
// Real asks in the window (test_traffic = 0):
//
// | id  | who | asked      | where | wait   | grade   | pain | sub_type          | lead | resolution     | cost | card |
// |-----|-----|------------|-------|--------|---------|------|-------------------|------|----------------|------|------|
// | t1  | A   | Mon 3 10:00| ch    | 1 m    | correct | 1    | Artifact location | 0    | reaction       | .01  |      |
// | t2  | A   | Tue 4 10:00| ch    | 10 m   | correct | 6    | Design judgment   | 1    |                | .02  |      |
// | t3  | B   | Tue 4 11:00| ch    | 25 h   | wrong   | 3    | Sync/drift        | 0    | no_escalation  | .03  |      |
// | t4  | B   | Wed 5 09:00| ch    | 2 m    |         | 6    | Design judgment   | 1    |                | null |      |
// | t6  | C   | Thu 6 12:00| DM    | 5 m    |         |      |                   | null | reaction       | .01  |      |
// | t7  | A   | Thu 6 14:00| ch    | 30 s   | partial | 7    |                   | 0    | task_completed | .05  | P1   |
// | t8  | A   | Mon 10 10:00| ch   | 45 s   |         | 7    |                   | 0    | reaction       | .01  | P7   |
// | t9  | A   | Tue 11 10:00| ch   | 4 m    | correct | 7    |                   | 0    | task_completed | .02  | P8   |
// | t10 | A   | Wed 12 10:00| ch   | 25 h   |         | 1    | Artifact location | 1    |                | .02  |      |
// | t11 | A   | Thu 13 10:00| ch   | 1 h    | correct | 6    | Design judgment   | 1    |                | .04  |      |
// | t13 | A   | Fri 14 15:00| ch   | 20 s   |         | 7    |                   | 0    | none           | .01  | P3   |
// | t14 | D   | Wed 12 11:00| ch   | —      |         | 4    | Access request    | 0    | none           | 0    |      |
//
// Every row above opened its thread (in_thread = 0), so each is an ask. Two
// more real turns are replies, and count as turns but not asks:
//   f1  A, Tue 4 10:30, a follow-up in t2's thread: 1 m, escalated, classified
//       with no Sub-type fitting (blank), $.01;
//   r1  B, Wed 12 15:00, "drop 2" on a Capture card: a sweep revision staging
//       P6r, 10 s, resolved by reaction, $.01.
// t14's event did not say its conversation type.
//
// t9 filed https://github.com/BilLogic/plus-uno/issues/901 on the bot itself.
// Outside it: t0 (B, Jul 20), t99 (A, Mon 17) and the test traffic — t5 (a
// sandbox ask that looks like a perfect answer), t12 and t15 (greetings the
// model only reacted to) and an eval turn.

interface TurnSeed {
  id: string;
  who: string;
  at: number;
  wait?: number | null;
  surface?: "channel" | "assistant";
  conversationType?: "channel" | "im" | null;
  inThread?: 0 | 1;
  classifiedAt?: number;
  tier?: string;
  disposition?: string;
  tools?: string[];
  cost?: number | null;
  pain?: number | null;
  subType?: string | null;
  lead?: 0 | 1 | null;
  resolution?: string | null;
  card?: string | null;
  ticket?: string | null;
  test?: 0 | 1;
}

const TURNS: TurnSeed[] = [
  { id: "C1:t0", who: "UB", at: Date.UTC(2026, 6, 20, 10), wait: 60_000, pain: 3, subType: "Sync/drift", lead: 0, resolution: "reaction", cost: 0.5 },
  { id: "C1:t1", who: "UA", at: T(3, 10), wait: 60_000, pain: 1, subType: "Artifact location", lead: 0, resolution: "reaction", cost: 0.01 },
  { id: "C1:t2", who: "UA", at: T(4, 10), wait: 600_000, pain: 6, subType: "Design judgment", lead: 1, cost: 0.02 },
  { id: "C1:t3", who: "UB", at: T(4, 11), wait: 25 * HOUR, pain: 3, subType: "Sync/drift", lead: 0, resolution: "no_escalation", cost: 0.03 },
  { id: "C1:t4", who: "UB", at: T(5, 9), wait: 120_000, pain: 6, subType: "Design judgment", lead: 1, cost: null },
  { id: "C1:t5", who: "UA", at: T(5, 10), wait: 1_000, pain: 6, subType: "Design judgment", lead: 1, cost: 5, card: "P4", ticket: "https://github.com/BilLogic/plus-uno/issues/903", test: 1 },
  { id: "D1:t6", who: "UC", at: T(6, 12), wait: 300_000, surface: "assistant", conversationType: "im", lead: null, resolution: "reaction", cost: 0.01 },
  { id: "C1:t7", who: "UA", at: T(6, 14), wait: 30_000, pain: 7, lead: 0, resolution: "task_completed", cost: 0.05, card: "P1", disposition: "staged" },
  { id: "C1:t8", who: "UA", at: T(10, 10), wait: 45_000, pain: 7, lead: 0, resolution: "reaction", cost: 0.01, card: "P7", disposition: "staged" },
  { id: "C1:t9", who: "UA", at: T(11, 10), wait: 240_000, pain: 7, lead: 0, resolution: "task_completed", cost: 0.02, card: "P8", disposition: "staged", ticket: "https://github.com/BilLogic/plus-uno/issues/901" },
  { id: "C1:t10", who: "UA", at: T(12, 10), wait: 25 * HOUR, pain: 1, subType: "Artifact location", lead: 1, cost: 0.02 },
  { id: "C1:t11", who: "UA", at: T(13, 10), wait: HOUR, pain: 6, subType: "Design judgment", lead: 1, cost: 0.04 },
  { id: "C1:t12", who: "UA", at: T(14, 9), wait: 2_000, tier: "chill", disposition: "reacted", tools: ["slack_react"], cost: 0.001, test: 1 },
  { id: "C1:t13", who: "UA", at: T(14, 15), wait: 20_000, pain: 7, lead: 0, resolution: "none", cost: 0.01, card: "P3", disposition: "staged" },
  { id: "C1:t14", who: "UD", at: T(12, 11), wait: null, pain: 4, subType: "Access request", lead: 0, resolution: "none", cost: 0, disposition: "failed", conversationType: null },
  { id: "C1:f1", who: "UA", at: T(4, 10, 30), wait: 60_000, inThread: 1, classifiedAt: T(5, 0), lead: 1, cost: 0.01 },
  { id: "C1:r1", who: "UB", at: T(12, 15), wait: 10_000, inThread: 1, pain: 7, lead: 0, resolution: "reaction", cost: 0.01, card: "P6r", disposition: "staged" },
  { id: "C1:t15", who: "UE", at: T(7, 9), wait: 3_000, disposition: "reacted", tools: ["slack_react", "source_read"], cost: 0.02, test: 1 },
  { id: "C1:1.0@1786442400000", who: "UA", at: T(7, 10), wait: 1_000, tier: "chill", disposition: "reacted", tools: [], cost: 0, test: 1 },
  { id: "C1:t99", who: "UA", at: T(17, 10), wait: 1, pain: 6, subType: "Design judgment", lead: 1, cost: 1 },
];

// Cards (proposal_events):
//   P1  t7's card: staged 14:01 in a thread begun 13:00; re-staged as P1r at
//       15:30, which lends it t7's turn; P1r ✅ by someone else at 16:00, and
//       its write then refused a stale page. Filed ticket #902.
//   P7  t8's card, replaced by a revision at 11:00.
//   P8  t9's card: staged 10:01 in a thread begun 09:59, ✅ by the asker 12:00.
//       Its requester was on the role map, as a PM; the other cards' were not.
//   P3  t13's card: staged 15:02 in a thread begun 15:00, ⛔ at 16:00.
//   P4  t5's card: test traffic.
//   P2  a Reconcile card (the worker, an intake): staged 14:00, ✅ 16:00.
//   P5  a Capture card (the worker, a Notion edit): staged, then aged out.
//   P6  a Capture card revised by r1's "drop 2": P6r stages through a turn
//       (via 'turn') with P6 as its origin, and is ✅ by someone else.
//   P9  a Capture share card (the worker, sweep_share_post), ✅ — not Reconcile.
const EVENTS: Record<string, unknown>[] = [
  { proposal_id: "P1", event: "staged", at: T(6, 14, 1), via: "turn", turn_id: "C1:t7", requester_id: "UA", tools: '["notion_update"]', ttl_ms: HOUR, thread_started_at: T(6, 13), ticket_url: "https://github.com/BilLogic/plus-uno/issues/902" },
  { proposal_id: "P1", event: "superseded", at: T(6, 15, 30), via: "restage" },
  { proposal_id: "P1r", event: "staged", at: T(6, 15, 30), via: "restage", origin_proposal_id: "P1", turn_id: "C1:t7", requester_id: "UA", tools: '["notion_update"]', ttl_ms: HOUR, thread_started_at: T(6, 13) },
  { proposal_id: "P1r", event: "confirmed", at: T(6, 16), via: "reaction", actor_id: "UB", confirmed_by_other: 1 },
  { proposal_id: "P1r", event: "refused_stale", at: T(6, 16) + 5_000, via: "executor" },
  { proposal_id: "P7", event: "staged", at: T(10, 10, 1), via: "turn", turn_id: "C1:t8", requester_id: "UA", tools: '["notion_create"]', ttl_ms: HOUR, thread_started_at: T(10, 10) },
  { proposal_id: "P7", event: "superseded", at: T(10, 11), via: "revision" },
  { proposal_id: "P8", event: "staged", at: T(11, 10, 1), via: "turn", turn_id: "C1:t9", requester_id: "UA", tools: '["github_issue_create"]', ttl_ms: HOUR, thread_started_at: T(11, 9, 59), requester_role: "pm" },
  { proposal_id: "P8", event: "confirmed", at: T(11, 12), via: "button", actor_id: "UA", confirmed_by_other: 0 },
  { proposal_id: "P3", event: "staged", at: T(14, 15, 2), via: "turn", turn_id: "C1:t13", requester_id: "UA", tools: '["notion_create"]', ttl_ms: HOUR, thread_started_at: T(14, 15) },
  { proposal_id: "P3", event: "cancelled", at: T(14, 16), via: "reaction", actor_id: "UA" },
  { proposal_id: "P4", event: "staged", at: T(5, 10, 1), via: "turn", turn_id: "C1:t5", requester_id: "UA", tools: '["notion_update"]', ttl_ms: HOUR, thread_started_at: T(5, 10), test_traffic: 1 },
  { proposal_id: "P4", event: "confirmed", at: T(5, 10, 5), via: "reaction", actor_id: "UB", confirmed_by_other: 1, test_traffic: 1 },
  { proposal_id: "P2", event: "staged", at: T(10, 14), via: "worker", tools: '["github_issue_create"]', ttl_ms: 72 * HOUR },
  { proposal_id: "P2", event: "confirmed", at: T(10, 16), via: "reaction", actor_id: "UB" },
  { proposal_id: "P5", event: "staged", at: T(11, 14), via: "worker", tools: '["notion_update"]', ttl_ms: 72 * HOUR },
  { proposal_id: "P5", event: "expired", at: T(14, 14), via: "end-of-day" },
  { proposal_id: "P6", event: "staged", at: T(12, 14), via: "worker", tools: '["notion_update"]', ttl_ms: 72 * HOUR },
  { proposal_id: "P6", event: "superseded", at: T(12, 15, 1), via: "revision" },
  { proposal_id: "P6r", event: "staged", at: T(12, 15, 1), via: "turn", origin_proposal_id: "P6", turn_id: "C1:r1", requester_id: "UB", tools: '["notion_update"]', ttl_ms: 71 * HOUR, thread_started_at: T(12, 14) },
  { proposal_id: "P6r", event: "confirmed", at: T(12, 16), via: "reaction", actor_id: "UA", confirmed_by_other: 1 },
  { proposal_id: "P9", event: "staged", at: T(12, 15, 30), via: "worker", tools: '["sweep_share_post"]', ttl_ms: 72 * HOUR },
  { proposal_id: "P9", event: "confirmed", at: T(12, 17), via: "reaction", actor_id: "UA" },
];

// Capture's items (sweep_items): f1 fixed a day after its drift, f2 refused
// stale, f3 found and not yet carded; f5 before the window.
const SWEEP_ITEMS: Record<string, unknown>[] = [
  { item_id: "k1#b1", finding_id: "f1", run_date: "2026-08-10", status: "confirmed", posted_at: T(11, 14), drift_at: T(10, 9), detected_at: T(10, 22), resolved_at: T(11, 9) },
  { item_id: "k1#b2", finding_id: "f2", run_date: "2026-08-10", status: "refused_stale", posted_at: T(11, 14), drift_at: T(10, 9), detected_at: T(10, 22), resolved_at: T(11, 15) },
  { item_id: "k2#b3", finding_id: "f3", run_date: "2026-08-11", status: "proposed", posted_at: null, drift_at: T(11, 9), detected_at: T(11, 22), resolved_at: null },
  { item_id: "k0#b5", finding_id: "f5", run_date: "2026-07-30", status: "confirmed", posted_at: T(3, 14), drift_at: T(3, 9), detected_at: T(3, 9), resolved_at: T(3, 15) },
];

// Follow through's commitments: kept (2 days), found done (1 day), lapsed,
// "not a promise"; K5 after the window.
const COMMITMENTS: Record<string, unknown>[] = [
  { commitment_id: "C1:k1", run_date: "2026-08-05", state: "done", nudges: 1, promised_at: T(4, 10), resolved_at: T(6, 10) },
  { commitment_id: "C1:k2", run_date: "2026-08-06", state: "auto_done", nudges: 0, promised_at: T(5, 10), resolved_at: T(6, 10) },
  { commitment_id: "C1:k3", run_date: "2026-08-07", state: "lapsed", nudges: 2, promised_at: T(6, 10), resolved_at: T(12, 14) },
  { commitment_id: "C1:k4", run_date: "2026-08-10", state: "not_promise", nudges: 1, promised_at: T(7, 10), resolved_at: T(11, 14) },
  { commitment_id: "C1:k5", run_date: "2026-08-18", state: "done", nudges: 1, promised_at: T(17, 10), resolved_at: T(18, 10) },
];

const GRADED_CSV = `turn_id,grade,grader,note
C1:t1,correct,bill,
C1:t2,correct,bill,
C1:t3,wrong,bill,"cited the old page, not the new one"
C1:t7,partial,bill,
C1:t9,correct,bill,
C1:t11,correct,bill,
C1:t5,correct,bill,test traffic: never counted
C1:t99,correct,bill,after the window
nope:1,correct,bill,a typo: names no turn
`;

// Waits of 10 m, 20 m, 29 m, 2 h and 30 h, and one thread nobody answered.
const CORPUS_CSV = `thread_id,asked_at,first_reply_at,lead_replied_first
a,2025-02-03T10:00:00Z,2025-02-03T10:10:00Z,1
b,2025-02-03T11:00:00Z,2025-02-03T11:20:00Z,1
c,2025-02-04T10:00:00Z,2025-02-04T10:29:00Z,1
d,2025-02-04T12:00:00Z,2025-02-04T14:00:00Z,0
e,2025-02-05T10:00:00Z,2025-02-06T16:00:00Z,1
f,2025-02-05T11:00:00Z,,0
`;

// GitHub's own export shape (`gh issue list --json url,closedAt`).
const CLOSURES = [
  { url: "https://github.com/BilLogic/plus-uno/issues/901", closedAt: "2026-08-13T10:00:00Z" },
  { url: "https://github.com/BilLogic/plus-uno/issues/902", closedAt: null },
  { url: "https://github.com/BilLogic/plus-uno/issues/904", closedAt: "2026-08-01T10:00:00Z" },
];

async function insert(table: string, row: Record<string, unknown>) {
  const columns = Object.keys(row);
  await bindings.USAGE_DB.prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
  )
    .bind(...columns.map((c) => row[c] ?? null))
    .run();
}

async function seed() {
  for (const t of TURNS) {
    const answered = t.wait !== null && t.wait !== undefined;
    const surface = t.surface ?? "channel";
    await insert("turns", {
      turn_id: t.id,
      build: "test",
      requester_id: t.who,
      surface,
      in_thread: t.inThread ?? 0,
      channel_id: surface === "channel" ? "C1" : null,
      conversation_type: t.conversationType === undefined ? "channel" : t.conversationType,
      ask_ts: String(t.at / 1000),
      asked_at: t.at,
      first_answer_at: answered ? t.at + (t.wait as number) : null,
      latency_ms: answered ? t.wait : null,
      tier: t.tier ?? "default",
      route_reason: t.tier === "chill" ? "explicit-command" : "default-tier",
      disposition: t.disposition ?? "answered",
      tools_called: JSON.stringify(t.tools ?? []),
      cost_usd: t.cost === undefined ? 0 : t.cost,
      proposal_id: t.card ?? null,
      self_filed_ticket_url: t.ticket ?? null,
      test_traffic: t.test ?? 0,
      pain_category: t.pain ?? null,
      sub_type: t.subType ?? null,
      classified_at: t.classifiedAt ?? (t.pain === undefined || t.pain === null ? null : t.at + 12 * HOUR),
      escalated_to_lead: t.lead === undefined ? null : t.lead,
      resolution: t.resolution ?? null,
    });
  }
  for (const e of EVENTS) await insert("proposal_events", { test_traffic: 0, ...e });
  for (const s of SWEEP_ITEMS) {
    await insert("sweep_items", {
      destination: "C1:1.1",
      channel_id: "C1",
      thread_ts: "1.1",
      block_id: String(s.item_id).split("#")[1],
      owner_id: "UA",
      card_key: String(s.item_id).split("#")[0],
      ...s,
    });
  }
  for (const c of COMMITMENTS) {
    await insert("commitments", {
      kind: "thread_promise",
      channel_id: "C1",
      thread_ts: "1.1",
      message_ts: "1.2",
      promiser_id: "UA",
      due_at: (c.promised_at as number) + 48 * HOUR,
      confidence: 0.9,
      detected_at: c.promised_at,
      ...c,
    });
  }
}

const INPUTS = {
  graded_answers: inputRows("graded_answers", parseCsv(GRADED_CSV)),
  corpus_threads: inputRows("corpus_threads", parseCsv(CORPUS_CSV)),
  ticket_closures: inputRows("ticket_closures", CLOSURES),
};

/** A query file's rows over the seed's two weeks. */
async function run(name: string, window = true): Promise<Record<string, unknown>[]> {
  const sql = bindings.METRIC_QUERIES[name];
  if (!sql) throw new Error(`no query file queries/usage/${name}.sql`);
  const rendered = renderMetricQuery(sql, window ? { from: "2026-08-03", to: "2026-08-17", inputs: INPUTS } : { inputs: INPUTS });
  return (await bindings.USAGE_DB.prepare(rendered).all<Record<string, unknown>>()).results;
}

beforeAll(async () => {
  await applyD1Migrations(bindings.USAGE_DB, bindings.USAGE_MIGRATIONS);
  await seed();
});

/** The metric files, and the one that is not a metric. */
const NOT_METRICS = ["categories-spot-check"];
const CASES = new Set<string>();
const metric = (name: string, fn: () => Promise<void>) => {
  CASES.add(name);
  it(name, fn);
};

describe("metric queries on the seed", () => {
  // ── headline ──

  metric("responsiveness", async () => {
    // correct: t1 1 m, t9 4 m, t2 10 m, t11 1 h — the median is the 2nd of 4,
    // the p90 the 4th. Ungraded: r1 10 s, t13 20 s, t8 45 s, f1 1 m, t4 2 m,
    // t6 5 m, t10 25 h — the 4th and the 7th of 7. t3 (graded wrong) is in
    // neither; t5 (test) and t99 (after) nowhere.
    expect(await run("responsiveness")).toEqual([
      { cohort: "correct", answers: 4, median_ms: 240_000, p90_ms: HOUR, next_day_share: 0 },
      { cohort: "ungraded", answers: 7, median_ms: 60_000, p90_ms: 25 * HOUR, next_day_share: 0.1429 },
    ]);
  });

  metric("where-lead-time-goes", async () => {
    // Asks reaching the lead: t2, t4, t10, t11 — three of them judgment (6).
    // Turns add f1, classified blank, which lowers the share over all but not
    // the share over the classified. t6 is not settled: lead_unknown.
    expect(await run("where-lead-time-goes")).toEqual([
      { unit: "ask", escalated: 4, judgment: 3, classified: 4, blank: 0, not_yet: 0, judgment_share: 0.75, classified_share: 0.75, lead_unknown: 1 },
      { unit: "turn", escalated: 5, judgment: 3, classified: 4, blank: 1, not_yet: 0, judgment_share: 0.6, classified_share: 0.75, lead_unknown: 1 },
    ]);
  });

  metric("load-on-lead", async () => {
    // Four asks reached the lead over ten weekdays. f1, a follow-up in t2's
    // thread, is a fifth turn but not a fifth ask.
    expect(await run("load-on-lead")).toEqual([
      { unit: "ask", reaching_lead: 4, workdays: 10, per_workday: 0.4, lead_unknown: 1 },
      { unit: "turn", reaching_lead: 5, workdays: 10, per_workday: 0.5, lead_unknown: 1 },
    ]);
  });

  // ── supporting ──

  metric("self-serve-rate", async () => {
    // Asks. Self-served: resolved and not escalated — t1, t8 (reaction), t7,
    // t9 (task), t3 (no escalation). t13 and t14 read `none`; t6 is not
    // settled. The sweep revision r1 is a reply, so no ask row holds it.
    const row = (scope: string, n: number, self: number, settled: number, reaction: number, task: number, noEsc: number, escalated: number) => ({
      scope,
      n,
      self_served: self,
      rate: Math.round((self / n) * 10_000) / 10_000,
      settled,
      settled_rate: settled ? Math.round((self / settled) * 10_000) / 10_000 : null,
      by_reaction: reaction,
      by_task_completed: task,
      by_no_escalation: noEsc,
      escalated,
      pending: n - settled,
    });
    const asks = [
      row("all", 12, 5, 11, 2, 2, 1, 4),
      row("1", 2, 1, 2, 1, 0, 0, 1),
      row("3", 1, 1, 1, 0, 0, 1, 0),
      row("4", 1, 0, 1, 0, 0, 0, 0),
      row("6", 3, 0, 3, 0, 0, 0, 3),
      row("7", 4, 3, 4, 1, 2, 0, 0),
      row("unclassified", 1, 0, 0, 0, 0, 0, 0),
    ];
    // Turns add f1 (escalated, blank) and r1 (a sweep revision, self-served
    // by reaction) — r1 in its own row, never under 7.
    const turns = [
      row("all", 14, 6, 13, 3, 2, 1, 5),
      row("1", 2, 1, 2, 1, 0, 0, 1),
      row("3", 1, 1, 1, 0, 0, 1, 0),
      row("4", 1, 0, 1, 0, 0, 0, 0),
      row("6", 3, 0, 3, 0, 0, 0, 3),
      row("7", 4, 3, 4, 1, 2, 0, 0),
      row("sweep-revision", 1, 1, 1, 1, 0, 0, 0),
      row("unclassified", 2, 0, 1, 0, 0, 0, 1),
    ];
    expect(await run("self-serve-rate")).toEqual([
      ...asks.map((r) => ({ unit: "ask", ...r })),
      ...turns.map((r) => ({ unit: "turn", ...r })),
    ]);
  });

  metric("return-rate", async () => {
    // Week of 08-03: A, B, C ask six times (f1 is a seventh turn); B asked in
    // July, so returns. Week of 08-10: A asks five times (heavy) and returns;
    // D is new; B only replied (r1), so is no asker; t14's type is unknown.
    expect(await run("return-rate")).toEqual([
      { week_of: "2026-08-03", askers: 3, returning_askers: 1, asks: 6, asks_per_asker: 2, heavy_users: 0, dm_asks: 1, channel_asks: 5, unknown_asks: 0, turns: 7 },
      { week_of: "2026-08-10", askers: 2, returning_askers: 1, asks: 6, asks_per_asker: 3, heavy_users: 1, dm_asks: 0, channel_asks: 5, unknown_asks: 1, turns: 7 },
    ]);
  });

  metric("answer-accuracy", async () => {
    // Graded in the window: t1 t2 t9 t11 correct, t7 partial, t3 wrong. The
    // row naming no turn is counted apart, so a typo in the CSV shows.
    expect(await run("answer-accuracy")).toEqual([
      { graded: 6, correct: 4, partial: 1, wrong: 1, accuracy: 0.6667, unmatched_grades: 1 },
    ]);
  });

  metric("ticket-kickoff", async () => {
    // Tickets: P1, P8, P3 (P7 was revised; P1r is P1 re-staged; P2, P5, P6
    // and P9 nobody asked for; P4 is test traffic). P6r — a sweep-card
    // revision staged through a turn — is not a ticket: counting it would make
    // four. To staging: 61 m, 2 m, 2 m. To ✅:
    // P1 via its re-stage, 3 h; P8, 2 h 1 m. P8's requester is a PM; P1's
    // and P3's are not on the map, so read unknown.
    expect(await run("ticket-kickoff")).toEqual([
      { requester_role: "all", tickets: 3, confirmed: 2, confirmed_by_other: 1, other_share: 0.5, median_to_staging_ms: 120_000, median_to_confirm_ms: 7_260_000 },
      { requester_role: "pm", tickets: 1, confirmed: 1, confirmed_by_other: 0, other_share: 0, median_to_staging_ms: 120_000, median_to_confirm_ms: 7_260_000 },
      { requester_role: "unknown", tickets: 2, confirmed: 1, confirmed_by_other: 1, other_share: 1, median_to_staging_ms: 120_000, median_to_confirm_ms: 10_800_000 },
    ]);
  });

  metric("cost-per-correct-answer", async () => {
    // $0.24 over the window's real turns (t4 unpriced). Answers are the
    // `answered` turns: t1 t2 f1 t3 t4 t6 t10 t11 — not the cards (t7 t8 t9
    // t13 r1) or the failure (t14). Graded among them: t1 t2 t11 correct, t3
    // wrong (t7 and t9 are graded but are cards). 8 × 3/4 = 6 correct, $0.04
    // each; counting every answered turn would divide by 13 × 4/6.
    expect(await run("cost-per-correct-answer")).toEqual([
      { period: "window", spend_usd: 0.24, unpriced_turns: 1, answered: 8, graded: 4, correct: 3, cost_per_correct_usd: 0.04 },
      { period: "2026-08", spend_usd: 0.24, unpriced_turns: 1, answered: 8, graded: null, correct: null, cost_per_correct_usd: null },
    ]);
  });

  metric("repeats-reaching-lead", async () => {
    // Escalated and classified: t2 (first judgment ask), t4 and t11 (after
    // t2), t10 (after t1's Artifact location) — three repeats.
    // f1 is escalated but has no Sub-type, so the turn row matches the ask's.
    expect(await run("repeats-reaching-lead")).toEqual([
      { unit: "ask", escalated_classified: 4, repeats: 3, repeat_share: 0.75, lead_unknown: 1 },
      { unit: "turn", escalated_classified: 4, repeats: 3, repeat_share: 0.75, lead_unknown: 1 },
    ]);
  });

  // ── objectives ──

  metric("gated-writes", async () => {
    // Cards: P1 P7 P8 P3 P2 P5 P6 P6r P9 (P1r is P1 again). ✅: P1 (through
    // P1r), P8, P2, P6r, P9. Replaced: P7 and P6, by revisions. Batches that
    // ran: t7 and t9 — joined through their staged rows with the re-stage
    // left out, or t7 would count twice — both behind a ✅.
    expect(await run("gated-writes")).toEqual([
      {
        cards_staged: 9,
        confirmed: 5,
        cancelled: 1,
        expired_at_least: 1,
        superseded: 2,
        refused_stale_cards: 1,
        refused_stale_sweep_items: 1,
        batches_ran: 2,
        batches_ran_with_confirm: 2,
        gated_share: 1,
        graded_writes: 2,
        wrong_writes: 0,
      },
    ]);
  });

  metric("cheap-path", async () => {
    // Greetings the model only reacted to: t12 at chill with no read, t15 at
    // default after a source_read. The eval turn is not a greeting.
    expect(await run("cheap-path")).toEqual([
      { greetings: 2, cheap: 1, cheap_share: 0.5, greetings_cost_usd: 0.021, cheap_cost_usd: 0.001 },
    ]);
  });

  metric("self-maintenance", async () => {
    expect(await run("self-maintenance")).toEqual([
      // f1 f2 f3; f1 and f2 carded; f1 fixed a day after its drift.
      { job: "Capture", found: 3, proposed: 2, accepted: 1, median_fix_ms: 24 * HOUR, done: null, auto_done: null, dropped: null, not_promise: null, lapsed: null, live: null },
      // P2 only: staged 14:00, ✅ 16:00. The share card P9 and the Notion
      // cards P5 and P6 are Capture's. What Reconcile found is not recorded.
      { job: "Reconcile", found: null, proposed: 1, accepted: 1, median_fix_ms: 2 * HOUR, done: null, auto_done: null, dropped: null, not_promise: null, lapsed: null, live: null },
      // k1–k4: three nudged; k1 kept in 2 days. k2, found done by the check,
      // is counted apart and not timed.
      { job: "Follow through", found: 4, proposed: 3, accepted: 1, median_fix_ms: 48 * HOUR, done: 1, auto_done: 1, dropped: 0, not_promise: 1, lapsed: 1, live: 0 },
    ]);
  });

  metric("self-improvement-loop", async () => {
    // #901 from t9's turn, closed two days later; #902 from P1's ✅, open.
    // #903 is test traffic.
    expect(await run("self-improvement-loop")).toEqual([
      { tickets_filed: 2, closed: 1, closed_share: 0.5, median_close_ms: 48 * HOUR, not_in_export: 0 },
    ]);
  });

  metric("responsiveness-baseline", async () => {
    // The corpus side, on the same definitions: median the 3rd of 5 (29 m),
    // p90 the 5th (30 h).
    expect(await run("responsiveness-baseline", false)).toEqual([
      { threads: 6, replied: 5, median_ms: 29 * 60_000, p90_ms: 30 * HOUR, next_day_share: 0.2, lead_first_share: 0.8 },
    ]);
  });
});

describe("every metric query file", () => {
  const files = () => Object.keys(bindings.METRIC_QUERIES).filter((n) => !NOT_METRICS.includes(n));

  it("has a case on the seed above", () => {
    expect(files().sort()).toEqual([...CASES].sort());
  });

  it("opens with its definition, its window and a link to Final — metrics", () => {
    for (const name of files()) {
      const sql = bindings.METRIC_QUERIES[name]!;
      const header = sql.slice(0, sql.indexOf("WITH"));
      expect(header, name).toMatch(/Definition:/);
      expect(header, name).toMatch(/Window:/);
      expect(header, name).toContain(FINAL_METRICS);
    }
  });

  it("excludes test traffic wherever it reads the bot's own rows", () => {
    for (const name of files().filter((n) => n !== "responsiveness-baseline")) {
      expect(bindings.METRIC_QUERIES[name], name).toMatch(/test_traffic = 0|test_traffic = 1/);
    }
  });

  it("runs on its own dates, unrendered, when it reads nothing from outside", async () => {
    for (const name of files()) {
      const sql = bindings.METRIC_QUERIES[name]!;
      if (sql.includes("-- @input")) continue;
      await expect(bindings.USAGE_DB.prepare(sql).all(), name).resolves.toBeTruthy();
    }
  });

  it("fails loudly, unrendered, when it reads an input", async () => {
    await expect(bindings.USAGE_DB.prepare(bindings.METRIC_QUERIES.responsiveness!).all()).rejects.toThrow(
      /no such table: graded_answers/,
    );
  });
});
