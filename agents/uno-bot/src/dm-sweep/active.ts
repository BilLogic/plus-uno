// Which 1:1 DMs uno-bot answered in lately: read off the usage record, not
// asked of Slack.
//
// Every turn in a person's DM with uno-bot is a `turns` row whose surface is
// `assistant` and whose `turn_id` leads with the DM's own id (`<D…>:<ask ts>`,
// `usage/record.ts` § `turnIdOf`), beside the `requester_id` who asked. One
// read therefore names every DM worth sweeping and its person, however many
// DMs uno-bot has — and lists nothing Slack would need `im:read` to list. A
// DM nobody asked anything in since has nothing uno-bot answered, so nothing
// the DM sweep looks for. Test traffic (the eval route, the test channels) is
// left out.
//
// PURE of `Env`: the database is handed in, typed as the one call made here,
// and the statement is charged to the meter before it is sent
// (`chargeD1Query`).

import { chargeD1Query } from "../net";
import type { ActiveDm } from "../sweep/run";

/** The most DMs one night sweeps; the rest, oldest ask first, wait a night. */
export const MAX_DMS_PER_NIGHT = 60;

const ACTIVE_DMS =
  `SELECT substr(turn_id, 1, instr(turn_id, ':') - 1) AS channel, requester_id AS person, MAX(asked_at) AS last ` +
  `FROM turns WHERE surface = 'assistant' AND test_traffic = 0 AND asked_at >= ? AND turn_id LIKE 'D%' ` +
  `GROUP BY channel, person ORDER BY last, channel LIMIT ?`;

/** The one D1 call this makes. */
export interface ActiveDmDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }> };
  };
}

/**
 * The DMs asked in since `since`, each once with its person, the ones asked
 * in longest ago first.
 *
 * @param db - The usage database
 * @param since - Epoch ms
 */
export async function activeDms(db: ActiveDmDatabase, since: number): Promise<ActiveDm[]> {
  chargeD1Query();
  const { results } = await db.prepare(ACTIVE_DMS).bind(since, MAX_DMS_PER_NIGHT).all<{ channel: unknown; person: unknown }>();
  const out: ActiveDm[] = [];
  for (const r of results) {
    const channel = String(r.channel ?? "");
    const person = String(r.person ?? "");
    if (channel.startsWith("D") && person && !out.some((d) => d.channel === channel)) out.push({ channel, person });
  }
  return out;
}
