// The end-of-day resolution pass: 24 h on, how did each ask end?
//
// For every real ask a day or more old that the pass has not handled, it reads
// the ask's thread with the bot token and the asker's DMs to the lead with the
// lead's own token, and writes two things (`./resolution.ts`):
//
//   - `escalated_to_lead`: the lead replied in the thread, or the asker DMed
//     the lead on the same topic, within 24 h of the ask;
//   - for an ask nothing has resolved yet, `no_escalation` when no person
//     replied in the thread and the asker did not DM the lead about it.
//
// Without the lead's token the DM half cannot be read. The pass then records
// `none` where it would have said `no_escalation`, leaves `escalated_to_lead`
// unknown unless the thread already shows the lead replying, and logs one line
// for the whole pass — it does not guess. An ask left unknown stays in the
// queue, so the next pass that can read the DMs replaces the `none`.
//
// Each ask is written as soon as it is read, so a pass the subrequest ceiling
// cuts short resumes where it stopped on the runner's retry. An ask whose
// thread cannot be read is left for the next pass, and drops out of the window
// after `PASS_LOOKBACK_MS`.
//
// Nothing read is kept: the texts are compared in memory and dropped.
//
// PURE: the reads arrive by name, so the Node suite drives the pass with fakes.

import {
  ESCALATION_WINDOW_MS,
  sameTopic,
  tsToMs,
  type PassCandidate,
  type PassOutcome,
  type ResolutionLog,
} from "./resolution";

/** How far back the pass looks for asks it has not handled. */
export const PASS_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

/** How many asks one pass reads at most; the rest wait for tomorrow. */
export const PASS_LIMIT = 40;

/** A message in the ask's thread, as the bot token reads it. */
export interface ThreadMessage {
  ts: string;
  user?: string;
  bot_id?: string;
  text?: string;
}

/** A message in the asker's DM with the lead, as the lead's token reads it. */
export interface DmMessage {
  ts: string;
  user?: string;
  text?: string;
}

export interface ResolutionPassDeps {
  log: ResolutionLog;
  now(): number;
  /** `LEAD_USER_ID`: the lead whose replies and DMs count as escalation. */
  leadUserId: string | null;
  /** The bot's own user id, so its replies are not a person's. */
  botUserId(): Promise<string | undefined>;
  /** The whole thread the ask sits in, oldest first; null when unreadable. */
  threadOf(channel: string, askTs: string): Promise<ThreadMessage[] | null>;
  /**
   * The asker's DM with the lead between two ts, on the lead's own token
   * (`createLeadDmReader`). The reader itself is null when the pass has no such
   * token; a read it answers null could not be made, and counts the same way.
   */
  leadDmsWith: LeadDmReader | null;
  /** Reads as it would, writes nothing. */
  dryRun: boolean;
}

export interface ResolutionPassSummary {
  checked: number;
  noEscalation: number;
  none: number;
  escalated: number;
  skipped: number;
  summary: string;
}

/** Epoch ms as a Slack ts. */
const msToTs = (ms: number): string => (ms / 1000).toFixed(6);

/** The asker's DMs with the lead in a window; null when they could not be read. */
export type LeadDmReader = (askerId: string, oldestTs: string, latestTs: string) => Promise<DmMessage[] | null>;

/** A Slack READ method on the lead's token: GET, query params, Slack's own JSON. */
export type SlackRead = (
  method: "users.conversations" | "conversations.history",
  params: Record<string, string>,
) => Promise<{ ok: boolean; error?: string; [key: string]: unknown }>;

/** How many pages of the lead's DM list one pass reads before giving up. */
const IM_LIST_PAGES = 5;

/**
 * Read the asker's DMs with the lead, READ-ONLY. The job must never create
 * anything in the lead's Slack — not even an empty DM, which is what
 * `conversations.open` would do for a pair that has never talked. So the DM is
 * found among the lead's existing ones (`users.conversations`, `types=im`),
 * listed once per pass and cached; an asker with no DM has no DM, and no API
 * write is made to find out.
 *
 * The method type admits the two reads and nothing else, so a write cannot be
 * wired in by accident.
 *
 * A list that cannot be read (a missing scope, an error) makes every read
 * answer null — unknown, never "no DM" — and says so once.
 *
 * @param read - One Slack read on the lead's own token
 */
export function createLeadDmReader(read: SlackRead): LeadDmReader {
  let ims: Promise<Map<string, string> | null> | undefined;

  const listIms = async (): Promise<Map<string, string> | null> => {
    const byUser = new Map<string, string>();
    let cursor = "";
    for (let page = 0; page < IM_LIST_PAGES; page++) {
      const res = await read("users.conversations", {
        types: "im",
        exclude_archived: "true",
        limit: "200",
        ...(cursor ? { cursor } : {}),
      });
      if (!res.ok) {
        console.log(`[resolution] the lead's DM list is unreadable (${res.error ?? "error"}): DM half recorded unknown`);
        return null;
      }
      for (const c of (res.channels as { id?: string; user?: string }[] | undefined) ?? []) {
        if (c.id && c.user) byUser.set(c.user, c.id);
      }
      cursor = (res.response_metadata as { next_cursor?: string } | undefined)?.next_cursor ?? "";
      if (!cursor) break;
    }
    return byUser;
  };

  return async (askerId, oldestTs, latestTs) => {
    ims ??= listIms();
    const byUser = await ims;
    if (!byUser) return null;
    const channel = byUser.get(askerId);
    if (!channel) return [];
    const history = await read("conversations.history", {
      channel,
      oldest: oldestTs,
      latest: latestTs,
      inclusive: "false",
      limit: "200",
    });
    return history.ok && Array.isArray(history.messages) ? (history.messages as DmMessage[]) : null;
  };
}

/**
 * Decide one ask.
 *
 * @param ask - The ask
 * @param thread - Its thread, oldest first
 * @param dms - The asker's DMs to the lead in the window, or null with no token
 * @param ids - The bot and the lead
 */
export function decideAsk(
  ask: PassCandidate,
  thread: readonly ThreadMessage[],
  dms: readonly DmMessage[] | null,
  ids: { bot: string | undefined; lead: string | null },
): PassOutcome {
  const until = ask.askedAt + ESCALATION_WINDOW_MS;
  const askText = thread.find((m) => m.ts === ask.askTs)?.text ?? "";
  const replies = thread.filter((m) => {
    const at = tsToMs(m.ts);
    return at > ask.askedAt && at <= until;
  });
  const people = replies.filter((m) => m.user && !m.bot_id && m.user !== ids.bot && m.user !== ask.requesterId);
  const leadReplied = ids.lead !== null && people.some((m) => m.user === ids.lead);
  const personReplied = people.length > 0;

  const threadTss = [...new Set([ask.askTs, thread[0]?.ts].filter((t): t is string => Boolean(t)))];
  const dmedLead =
    dms === null
      ? null
      : dms.some((m) => m.user === ask.requesterId && sameTopic(askText, m.text ?? "", threadTss));

  const escalatedToLead = leadReplied || dmedLead === true ? true : dmedLead === null ? null : false;

  let resolution: PassOutcome["resolution"] = null;
  if (!ask.resolved && !personReplied && dmedLead !== true) {
    resolution = dmedLead === null ? "none" : "no_escalation";
  }
  return { resolution, escalatedToLead };
}

/**
 * Run the pass over every pending ask.
 *
 * @param deps - The log, the reads and the clock
 */
export async function runResolutionPass(deps: ResolutionPassDeps): Promise<ResolutionPassSummary> {
  const now = deps.now();
  const pending = await deps.log.pendingPass({
    askedAfter: now - PASS_LOOKBACK_MS,
    askedBefore: now - ESCALATION_WINDOW_MS,
    limit: PASS_LIMIT,
  });
  const counts = { checked: 0, noEscalation: 0, none: 0, escalated: 0, skipped: 0 };
  if (pending.length === 0) return { ...counts, summary: "no asks to check" };

  const lead = deps.leadUserId;
  const dmReader = lead ? deps.leadDmsWith : null;
  if (!dmReader) {
    console.log(
      `[resolution] ${lead ? "no connected Slack token for the lead" : "no LEAD_USER_ID"}: ` +
        `the DM half is unread, so asks it would settle are recorded "none"`,
    );
  }
  const bot = await deps.botUserId();

  for (const ask of pending) {
    const thread = await deps.threadOf(ask.channel, ask.askTs);
    if (!thread) {
      counts.skipped++;
      continue;
    }
    // The lead asking is not the lead being escalated to, and a DM to oneself is no DM.
    const dms =
      dmReader && ask.requesterId !== lead
        ? await dmReader(ask.requesterId, ask.askTs, msToTs(ask.askedAt + ESCALATION_WINDOW_MS))
        : dmReader
          ? []
          : null;
    const outcome = decideAsk(ask, thread, dms, { bot, lead });
    if (!deps.dryRun) await deps.log.recordPass(ask.turnId, outcome, now);
    counts.checked++;
    if (outcome.resolution === "no_escalation") counts.noEscalation++;
    if (outcome.resolution === "none") counts.none++;
    if (outcome.escalatedToLead) counts.escalated++;
  }

  const summary =
    `${counts.checked} ask(s) checked: ${counts.noEscalation} no_escalation, ${counts.none} none, ` +
    `${counts.escalated} escalated to the lead, ${counts.skipped} unreadable${deps.dryRun ? " (dry run, nothing written)" : ""}`;
  return { ...counts, summary };
}
