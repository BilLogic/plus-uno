// The usage record: one durable row per uno-bot turn, behind one port.
//
// WHAT IT IS FOR. The metrics #742 publishes are recomputed from it with
// checked-in queries, and operations (cost, latency, stop usage) read it too. The
// `[uno-bot] request done` log line it replaces as evidence lives in Workers
// Logs, which sample and expire. What the database is for, what it never
// stores, and why it is D1 rather than Analytics Engine: ADR-030.
//
// THE SAME SHAPE AS ThreadState. A port (`UsageLog`), an in-memory adapter the
// Node suite drives Turn against, a D1 adapter production writes through, and
// one conformance suite that holds the two equal
// (`tests/helpers/usage-log-conformance.ts`, run under `node --test` and again
// under workerd against a local D1).
//
// PURE: no `Env`, no Workers global. `Env` stops in `./production.ts` (and, for
// the resolution columns, `./resolution-env.ts`).

/** One turn, as the `turns` table holds it. Field names are camelCase here and
 *  snake_case in SQL; `./d1.ts` is the one place they are mapped. */
export interface TurnRecord {
  // ── identity and place ──
  /** `<channel>:<the asker's message ts>` — stable across a retried alarm, so
   *  a turn that runs twice still leaves one row. An ask with no Slack ts (an
   *  eval conversation) adds `@<when it began>` (`./record.ts` `turnIdOf`). */
  turnId: string;
  /** The deployed build stamp (`version.ts`). */
  build: string;
  /** Slack user id of the asker. */
  requesterId: string;
  /** The code's surface: `assistant` is the app DM, `channel` everything else. */
  surface: "assistant" | "channel";
  /** True when the ask arrived inside an existing thread. */
  inThread: boolean;
  /** The channel id, for channel turns only — null for DM turns. */
  channelId: string | null;

  // ── timing ──
  /** The asker's message ts, as Slack spells it. */
  askTs: string;
  /** When the ask was made, epoch ms. */
  askedAt: number;
  /** When the first answer, card or note reached the person, epoch ms; null
   *  when the turn put nothing in front of them. */
  firstAnswerAt: number | null;
  /** `firstAnswerAt - askedAt`, or null with it. */
  latencyMs: number | null;

  // ── model ──
  tier: string;
  routeReason: string;
  /** The adapter that answered; null when no model ran (a typed ✅, say). */
  provider: string | null;
  model: string | null;
  fallbackUsed: boolean;
  tokensIn: number;
  tokensOut: number;
  tokensThinking: number;
  tokensCached: number;
  /** Estimated from the checked-in price table (`./prices.ts`); null when the
   *  model is not on it, so an unpriced turn is findable rather than free. */
  costUsd: number | null;

  // ── behaviour ──
  /** Ungated tools the loop ran, in call order. */
  toolsCalled: string[];
  /** Which kinds of source the answer linked to (`./record.ts` `sourcesCitedIn`). */
  sourcesCited: string[];
  /** How the turn ended — `TurnDisposition` in `turn/turn.ts`. */
  disposition: string;

  // ── proposal ──
  /** The ts of the card this turn staged; later proposal events key on it. */
  proposalId: string | null;

  // ── other ──
  stopUsed: boolean;
  /** A GitHub issue this turn filed on the bot's own repo. */
  selfFiledTicketUrl: string | null;
  /** Evals, debug probes, the sandbox channel, bare greetings (`./record.ts`). */
  testTraffic: boolean;
}

/**
 * Where a finished turn is written.
 *
 * `record` is an UPSERT on `turnId`: a turn retried by the runner rewrites its
 * own row rather than adding a second. A caller must treat a throw as a lost
 * record, never as a lost turn — Turn logs and swallows it.
 */
export interface UsageLog {
  record(turn: TurnRecord): Promise<void>;
  /** The row for one turn, or null. */
  get(turnId: string): Promise<TurnRecord | null>;
}
