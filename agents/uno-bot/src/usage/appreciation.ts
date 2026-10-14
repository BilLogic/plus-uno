// Thanks given to the bot as a reaction, on the usage record: one row per
// person per emoji per message of the bot's, in `appreciation`
// (migrations/usage/0013_measurement.sql, ADR-030). A thanks typed as a reply
// is a flag on its turn instead (`turns.thanks`, `./record.ts` `isThanks`).
//
// Recorded from the reaction door (`gate/reaction-door.ts`) when the reacted
// message is the bot's own, the reactor is someone else, and the emoji is one
// of the thanks below. The gate's verdict emoji are never thanks: a ✅ or a 👍
// says "do it" or "that answered it", and both have records of their own.
//
// No text: the emoji's short name, who, where and when. A row joins to the
// turn whose message it is when the record already knows that message — an
// answer someone rated with its buttons (`answer_feedback`), or a card a turn
// staged (`turns.proposal_id`) — and names no turn otherwise, since finding
// one would cost a Slack read on every 🙏.
//
// A port, an in-memory adapter and a D1 adapter (`./appreciation-d1.ts`),
// held equal by one conformance suite (`tests/helpers/appreciation-conformance.ts`).
// PURE: no `Env`, no Workers global. `Env` stops in `./appreciation-env.ts`.

import { GATE_RESERVED } from "../gate/reactions";
import type { ConversationType } from "../turn/turn";

/** 🙏 ❤️ 🐐 👏 🔥 💯 🥹, by the names a reaction event sends. */
const THANKS_EMOJI: ReadonlySet<string> = new Set([
  "pray",
  "heart",
  "goat",
  "clap",
  "fire",
  "100",
  "face_holding_back_tears",
]);

/**
 * The emoji a reaction thanks with, as the short name the record keeps, or
 * null when it is not a thanks. A skin tone (`clap::skin-tone-3`) is dropped;
 * a custom emoji counts when its name has `goat` in it.
 */
export function thanksEmojiOf(name: string): string | null {
  const base = name.split("::")[0] ?? "";
  if (!base || GATE_RESERVED.has(base)) return null;
  return THANKS_EMOJI.has(base) || base.includes("goat") ? base : null;
}

/** One thanks reaction, as the door hands it over. */
export interface ThanksReaction {
  channel: string;
  /** The bot's message the reaction landed on. */
  itemTs: string;
  /** Who reacted. */
  userId: string;
  /** The short name (`thanksEmojiOf`). */
  emoji: string;
  /** When it was recorded, epoch ms. */
  at: number;
  /** What the channel id proves on its own — a `D…` is the app DM — else
   *  null. A known turn's own type wins over it. */
  conversationType: ConversationType | null;
}

/** One row of `appreciation`. Field names are camelCase here and snake_case in
 *  SQL; `./appreciation-d1.ts` is the one place they are mapped. */
export interface AppreciationRecord extends ThanksReaction {
  /** The turn whose message was thanked, when the record knows it (above). */
  turnId: string | null;
}

/**
 * Where thanks reactions are written.
 *
 * `record` keeps the FIRST write per (channel, message, person, emoji): a
 * reaction taken off and put back, or an event Slack redelivers, counts once.
 * A caller treats a throw as a lost record, never as a lost reaction.
 */
export interface AppreciationLog {
  record(reaction: ThanksReaction): Promise<void>;
  /** One row, or null. */
  get(channel: string, itemTs: string, userId: string, emoji: string): Promise<AppreciationRecord | null>;
}

/** A message the record already ties to a turn, as the in-memory adapter is
 *  told about it — the D1 adapter reads the same from its tables. */
export interface KnownMessage {
  turnId: string;
  conversationType: ConversationType | null;
}

/** The in-memory log, held equal to the D1 one by the conformance suite.
 *  `known` answers what the D1 statement reads from `answer_feedback` and
 *  `turns`. */
export function createInMemoryAppreciationLog(
  deps: { known?: (channel: string, itemTs: string) => KnownMessage | null } = {},
): AppreciationLog & { records(): AppreciationRecord[] } {
  const rows = new Map<string, AppreciationRecord>();
  const key = (channel: string, itemTs: string, userId: string, emoji: string) =>
    [channel, itemTs, userId, emoji].join("\u0000");
  return {
    async record(r) {
      const k = key(r.channel, r.itemTs, r.userId, r.emoji);
      if (rows.has(k)) return;
      const known = deps.known?.(r.channel, r.itemTs) ?? null;
      rows.set(k, {
        ...r,
        turnId: known?.turnId ?? null,
        conversationType: known?.conversationType ?? r.conversationType,
      });
    },
    async get(channel, itemTs, userId, emoji) {
      const row = rows.get(key(channel, itemTs, userId, emoji));
      return row ? { ...row } : null;
    },
    records() {
      return [...rows.values()].map((r) => ({ ...r }));
    },
  };
}
