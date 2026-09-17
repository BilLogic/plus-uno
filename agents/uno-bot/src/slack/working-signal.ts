// What the working signal leaves behind in the logs.
//
// The thinking indicator was raised and lowered by fire-and-forget calls whose
// result nobody read, so the two ways it gets stuck were the same silence: a
// clear Slack REFUSED (bad thread, expired scope) and a clear that was never
// sent at all, because the invocation died on Cloudflare's 50-subrequest cap or
// was hard-killed mid-turn. Those need opposite fixes, and the artefact has now
// been diagnosed three times off screenshots because nothing in the logs could
// tell them apart.
//
// So the clear reports itself EVERY time, carrying the turn's external
// subrequest spend. Absence of the line is then evidence in its own right —
// the invocation never reached delivery — while a present line names Slack's
// own verdict. That is the whole instrument: one line, and the fact that it is
// there.
//
// PURE by design — no `Env`, no Slack client, no `net.ts` — so the formatter is
// compiled and asserted by `tsconfig.test.json` while the adapter that calls it
// (`slack-delivery.ts`) stays out of reach of the Node test build.

import { SUBREQUEST_CAP } from "../agent/loop-policy";

/** Which half of the pairing spoke: the set that raises the indicator, or the
 *  clear that takes it down. Named in the line because a set that never landed
 *  and a clear that never landed look identical afterwards. */
export type WorkingSignalPhase = "set" | "clear";

/** What a status call came back as. */
export type WorkingSignalOutcome =
  | { kind: "ok" }
  /** Slack answered, and said no. `error` is its own code. */
  | { kind: "declined"; error: string }
  /** The call never left the Worker: the subrequest budget stopped it. This is
   *  NOT a Slack failure and must never be logged as one — the fix for it is a
   *  cheaper turn, not a Slack scope. */
  | { kind: "budget-stop" };

/** What `assistant.threads.setStatus` answered, as its callers need it: Slack's
 *  own `ok`, and the code behind a refusal. */
export interface StatusResult {
  ok: boolean;
  error?: string;
}

/** Slack's answer as an outcome. A refusal with no code still names something
 *  rather than logging an empty `error=`. */
export function outcomeOf(result: StatusResult): WorkingSignalOutcome {
  if (result.ok) return { kind: "ok" };
  return { kind: "declined", error: result.error || "unknown" };
}

/**
 * The one line a set or a clear leaves behind.
 *
 * `spent` is the turn's EXTERNAL subrequest count at the moment the call was
 * made, against the free plan's cap. It is on every line, including the happy
 * one, because the number is only useful as a series: a clear logged at 48/50
 * says the next turn of the same shape will die before it gets here, which is
 * exactly the reading no screenshot could give.
 *
 * @param phase - Which half of the pairing spoke
 * @param outcome - What came back
 * @param spent - External subrequests spent this invocation so far
 */
export function workingSignalLine(
  phase: WorkingSignalPhase,
  outcome: WorkingSignalOutcome,
  spent: number,
): string {
  const budget = `spent=${spent}/${SUBREQUEST_CAP}`;
  switch (outcome.kind) {
    case "ok":
      return `[working] ${phase} ok ${budget}`;
    case "declined":
      return `[working] ${phase} declined by Slack: error=${outcome.error} ${budget}`;
    case "budget-stop":
      return `[working] ${phase} never sent — subrequest budget stopped it ${budget}`;
  }
}
