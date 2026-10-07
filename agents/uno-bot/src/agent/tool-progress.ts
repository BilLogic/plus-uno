// What the loop says about a lookup while it runs — the event the checklist is
// drawn from.
//
// WHY A HOOK OF ITS OWN. The loop already reported tool calls twice, for the
// eval transcript: `onToolCall` before dispatch and `onToolResult` after. Both
// were built for an artifact a person reads weeks later, so the result digest
// carries no arguments and, by design, no content (`tool-transcript.ts` says
// why). A task card needs exactly what that digest refuses — what the call
// searched for, what came back, the links it read — and it needs to know WHEN
// a call starts, which neither hook says. Widening the digest would have put
// content into the eval artifact; a second event keeps the two promises apart.
//
// THE PHASES. Every call a batch of lookups holds is `announced` before any of
// them runs, so a person sees the whole batch queued. Lookups run one at a
// time, and each goes `started` → `finished` as it does. A call the budget
// refuses is `refused` instead, so an announced card never silently vanishes.
// Nothing else: a gated write is staged on the proposal card, never run here,
// and a call deferred behind a pending proposal or a preflight correction was
// never announced, because it never reached the lookup path.
//
// WHO GETS ONE. The loop reports every call it runs through the lookup path;
// which of them become cards is the tool table's answer (`taskCardFor`), read
// by Turn, so the loop does not learn a presentation rule.
//
// WHAT A FINISHED EVENT CARRIES. What the call's readout made of its result
// (`task-card-readout.ts`) — the count and the links — never the raw text. The
// readout runs here, on the WHOLE result, because a result cut short first is
// JSON no longer: a large read would parse as nothing and land as a bare card.
// Which of the links a thread may see is still Slack's to decide.
//
// A PURE module: no Env, no Slack shape. What a card LOOKS like is the Slack
// adapter's (`slack/delivery-adapter.ts`).

import { readoutFor, type TaskCardSource } from "./task-card-readout";

/** Where one call is in its life. */
export type ToolProgressPhase = "announced" | "started" | "finished" | "refused";

interface ToolProgressBase {
  /**
   * The call's position among every lookup this turn ran, from 1.
   *
   * The card's identity across its phases, and unique across the turn: a
   * provider's own call ids are not (a provider may number from scratch each
   * reply), and two cards sharing an id would overwrite each other.
   */
  readonly seq: number;
  /** The tool's registered name. */
  readonly name: string;
  /** The arguments the model sent, as it sent them. */
  readonly args: Record<string, unknown>;
}

/** One moment in one lookup's life. */
export type ToolProgressEvent =
  | (ToolProgressBase & { readonly phase: "announced" | "started" })
  | (ToolProgressBase & {
      readonly phase: "finished";
      /** What came back, as a glance — "4 pages" — when the readout could say. */
      readonly output?: string;
      /** The links the result names, with what the tool knew of who may see
       *  them. Absent when it named none. */
      readonly sources?: readonly TaskCardSource[];
      /** The tool's own error, when its result says it failed — the same field
       *  the eval transcript reads, so a card and the artifact never disagree
       *  about whether a lookup failed. */
      readonly error?: string;
    })
  | (ToolProgressBase & {
      readonly phase: "refused";
      /** Why it never ran — the refusal the model was handed. */
      readonly reason: string;
    });

/**
 * The `finished` event for a call, its readout taken from the whole result.
 *
 * @param base - The call's seq, name and arguments
 * @param result - The raw result text, uncut
 * @param error - The tool's own error, when its result says it failed
 */
export function finishedProgress(
  base: { readonly seq: number; readonly name: string; readonly args: Record<string, unknown> },
  result: string,
  error?: string,
): ToolProgressEvent {
  const readout = error ? null : readoutFor(base.name);
  const output = readout?.output(result) ?? null;
  const sources = readout?.sources(result) ?? [];
  return {
    ...base,
    phase: "finished",
    ...(output ? { output } : {}),
    ...(sources.length ? { sources } : {}),
    ...(error ? { error } : {}),
  };
}
