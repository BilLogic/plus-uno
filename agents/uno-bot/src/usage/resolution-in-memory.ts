// The in-memory ResolutionLog, over the in-memory UsageLog's rows.
//
// The resolution columns live on the turn's row in D1; here they sit in a map
// beside the turns, keyed the same way. Held equal to the D1 adapter by the
// conformance suite (`tests/helpers/resolution-log-conformance.ts`).

import type { InMemoryUsageLog } from "./in-memory";
import type { AskResolution, ResolutionLog } from "./resolution";
import { channelOfTurnId } from "./resolution";

const EMPTY: AskResolution = { resolution: null, resolvedAt: null, escalatedToLead: null, resolutionCheckedAt: null };

const open = (r: AskResolution): boolean => r.resolution === null || r.resolution === "none";

export function createInMemoryResolutionLog(turns: InMemoryUsageLog): ResolutionLog {
  const columns = new Map<string, AskResolution>();
  const columnsOf = (turnId: string): AskResolution => columns.get(turnId) ?? EMPTY;
  const resolve = (turnId: string, resolution: AskResolution["resolution"], at: number): string | null => {
    const current = columnsOf(turnId);
    if (!open(current)) return null;
    columns.set(turnId, { ...current, resolution, resolvedAt: at });
    return turnId;
  };

  return {
    async recordReaction(q) {
      const latest = turns
        .records()
        .filter(
          (t) =>
            channelOfTurnId(t.turnId) === q.channel &&
            t.requesterId === q.requesterId &&
            t.askedAt >= q.fromMs &&
            t.askedAt <= q.toMs,
        )
        .sort((a, b) => b.askedAt - a.askedAt)[0];
      return latest ? resolve(latest.turnId, "reaction", q.at) : null;
    },
    async recordTaskCompleted(proposalId, at) {
      const staging = turns.records().find((t) => t.proposalId === proposalId);
      return staging ? resolve(staging.turnId, "task_completed", at) : null;
    },
    async pendingPass(q) {
      return turns
        .records()
        .filter(
          (t) =>
            !t.testTraffic &&
            columnsOf(t.turnId).resolutionCheckedAt === null &&
            t.askedAt > q.askedAfter &&
            t.askedAt <= q.askedBefore,
        )
        .sort((a, b) => a.askedAt - b.askedAt)
        .slice(0, q.limit)
        .map((t) => ({
          turnId: t.turnId,
          requesterId: t.requesterId,
          channel: channelOfTurnId(t.turnId),
          askTs: t.askTs,
          askedAt: t.askedAt,
          resolved: !open(columnsOf(t.turnId)),
        }));
    },
    async recordPass(turnId, outcome, at) {
      if (!(await turns.get(turnId))) return;
      const current = columnsOf(turnId);
      const settles = outcome.resolution !== null && open(current);
      columns.set(turnId, {
        resolution: settles ? outcome.resolution : current.resolution,
        resolvedAt: settles ? at : current.resolvedAt,
        escalatedToLead: outcome.escalatedToLead,
        resolutionCheckedAt: outcome.escalatedToLead === null ? null : at,
      });
    },
    async getResolution(turnId) {
      return (await turns.get(turnId)) ? { ...columnsOf(turnId) } : null;
    },
  };
}
