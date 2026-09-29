// The in-memory ResolutionLog, over the in-memory UsageLog's rows.
//
// The resolution columns live on the turn's row in D1; here they sit in a map
// beside the turns, keyed the same way. Held equal to the D1 adapter by the
// conformance suite (`tests/helpers/resolution-log-conformance.ts`).

import type { InMemoryUsageLog } from "./in-memory";
import type { AskResolution, ResolutionLog } from "./resolution";
import { channelOfTurnId } from "./resolution";

const EMPTY: AskResolution = {
  resolution: null,
  resolvedAt: null,
  escalatedToLead: null,
  resolutionCheckedAt: null,
  resolutionAttempts: 0,
  resolutionAttemptedAt: null,
};

/** What a person's signal may replace: nothing yet, or the pass's own answer. */
const personOpen = (r: AskResolution): boolean =>
  r.resolution === null || r.resolution === "none" || r.resolution === "no_escalation";

export function createInMemoryResolutionLog(turns: InMemoryUsageLog): ResolutionLog {
  const columns = new Map<string, AskResolution>();
  const columnsOf = (turnId: string): AskResolution => columns.get(turnId) ?? EMPTY;
  const resolve = (turnId: string, resolution: AskResolution["resolution"], at: number): string | null => {
    const current = columnsOf(turnId);
    if (!personOpen(current)) return null;
    columns.set(turnId, { ...current, resolution, resolvedAt: at });
    return turnId;
  };

  return {
    async recordReaction(q) {
      const turn = await turns.get(q.turnId);
      return turn && turn.requesterId === q.requesterId ? resolve(q.turnId, "reaction", q.at) : null;
    },
    async recordTaskCompleted(proposalId, at) {
      const staging = turns.records().find((t) => t.proposalId === proposalId);
      return staging ? resolve(staging.turnId, "task_completed", at) : null;
    },
    async pendingPass(q) {
      return turns
        .records()
        .filter((t) => {
          const c = columnsOf(t.turnId);
          return (
            !t.testTraffic &&
            c.resolutionCheckedAt === null &&
            t.askedAt > q.askedAfter &&
            t.askedAt <= q.askedBefore &&
            (c.resolutionAttemptedAt === null || c.resolutionAttemptedAt <= q.attemptedBefore)
          );
        })
        .sort((a, b) => a.askedAt - b.askedAt)
        .slice(0, q.limit)
        .map((t) => ({
          turnId: t.turnId,
          requesterId: t.requesterId,
          channel: channelOfTurnId(t.turnId),
          askTs: t.askTs,
          askedAt: t.askedAt,
          resolved: !personOpen(columnsOf(t.turnId)),
          attempts: columnsOf(t.turnId).resolutionAttempts,
        }));
    },
    async recordPass(turnId, outcome, at) {
      if (!(await turns.get(turnId))) return;
      const current = columnsOf(turnId);
      const replaces = personOpen(current);
      const resolvedAt = !replaces
        ? current.resolvedAt
        : outcome.resolution === null
          ? null
          : current.resolution === outcome.resolution
            ? current.resolvedAt
            : at;
      columns.set(turnId, {
        resolution: replaces ? outcome.resolution : current.resolution,
        resolvedAt,
        escalatedToLead: outcome.escalatedToLead ?? current.escalatedToLead,
        resolutionCheckedAt: outcome.settled ? at : current.resolutionCheckedAt,
        resolutionAttempts: current.resolutionAttempts + 1,
        resolutionAttemptedAt: at,
      });
    },
    async getResolution(turnId) {
      return (await turns.get(turnId)) ? { ...columnsOf(turnId) } : null;
    },
  };
}
