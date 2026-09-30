// What may leave a group DM once a sweep card there has been ✅'d: a second,
// separate card that offers a reworded note.
//
// Anything found in a group DM stays in it. The fix card's ✅ applies the fix
// and nothing more. When that batch has written at least one page, the Worker
// stages a SHARE CARD in the same group DM. It shows the note's exact text and
// names the team channel it would go to — the rung the finding would take with
// its evidence set aside (`shareDestination`): #plus-universal for the design
// system, #plus-design otherwise, never #uno-bot. Its ✅ posts exactly that
// text there (`sweep_share_post`, a `worker` tool); its ⛔ drops it. It has the
// fix card's confirmers, 72 h, and its own slot in the thread
// (`SWEEP_SHARE_KEY`), so it never replaces the fix card or a turn's card.
//
// The note names each page the batch brought up to date and says a group
// conversation settled it: no quote of the conversation or of the change, no
// name or mention, no link back into the group DM.
//
// Only the fix card the morning staged carries the pages (`sweepShare`). A
// revision or a re-staged fix card carries none, so it never offers a share:
// the offer is always about the card people were shown. A private channel's
// card has none either — what is found there stays there.
//
// PURE of `Env`: Slack, ThreadState and the usage record arrive by name
// (`stageSweepShare`); `./env.ts` binds them.

import type { OperationOutcome } from "../gate/index";
import { rethrowIfBudget } from "../net";
import type { PendingProposal, ProposalOperation, SweepShare, ThreadState } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { recordProposalEvents, stagedEvent, storesChannel, supersededEvents, type ProposalEventLog } from "../usage/index";
import { SHARE_CHANNEL_NAMES, SWEEP_CARD_MARK, SWEEP_CARD_TTL_MS } from "./cards";

/** The share card's own slot in its thread (`proposalSlot`). */
export const SWEEP_SHARE_KEY = "sweep-share";

/** The one tool a share card runs. */
export const SWEEP_SHARE_TOOL = "sweep_share_post";

/** One note, and the team channel it goes to, by role. */
export interface SweepShareNote {
  to: SweepShare["pages"][number]["to"];
  text: string;
}

/** The Worker's ids for the two team channels, and #uno-bot's. */
export interface ShareChannels {
  plusDesign?: string;
  plusUniversal?: string;
  unoBot?: string;
}

/**
 * The notes a group DM's fix batch earns: one per team channel, naming the
 * pages whose write came back ok. Nothing applied, nothing to share. Plain
 * text, the same on the card and in the channel.
 *
 * @param share - The fix card's `sweepShare`
 * @param outcomes - What its batch ran
 */
export function sweepShareNotes(share: SweepShare, outcomes: readonly OperationOutcome[]): SweepShareNote[] {
  const applied = new Set(
    outcomes
      .filter((o) => o.ok && o.toolName === "notion_update" && typeof o.input?.page_url === "string")
      .map((o) => o.input!.page_url as string),
  );
  const notes: SweepShareNote[] = [];
  for (const to of ["plus-design", "plus-universal"] as const) {
    const pages = share.pages.filter((p) => p.to === to && applied.has(p.url));
    if (!pages.length) continue;
    const text =
      pages.length === 1
        ? `:mag: ${SWEEP_CARD_MARK}: a group conversation settled something the Notion page “${plain(pages[0]!.title)}” still said the old way, and the page is now up to date: ${pages[0]!.url}`
        : `:mag: ${SWEEP_CARD_MARK}: a group conversation settled things these Notion pages still said the old way, and they are now up to date:\n${pages.map((p) => `• ${plain(p.title)}: ${p.url}`).join("\n")}`;
    notes.push({ to, text });
  }
  return notes;
}

/** The share card for a fix batch, as data and operations, or null when
 *  there is nothing to offer: no share, nothing applied, or no channel. */
export function sweepShareOffer(
  share: SweepShare | undefined,
  outcomes: readonly OperationOutcome[],
  channels: ShareChannels,
): { card: ProposalCard; operations: ProposalOperation[] } | null {
  if (!share) return null;
  const idOf = (to: SweepShareNote["to"]): string | undefined => {
    const id = (to === "plus-universal" ? channels.plusUniversal : channels.plusDesign)?.trim();
    return id && id !== channels.unoBot?.trim() ? id : undefined;
  };
  const notes = sweepShareNotes(share, outcomes).flatMap((n) => {
    const channel = idOf(n.to);
    return channel ? [{ ...n, channel }] : [];
  });
  if (!notes.length) return null;
  const operations: ProposalOperation[] = notes.map((n) => ({
    toolName: SWEEP_SHARE_TOOL,
    input: { channel: n.channel, channel_name: SHARE_CHANNEL_NAMES[n.to], text: n.text },
  }));
  const where = notes.map((n) => SHARE_CHANNEL_NAMES[n.to]).join(" and ");
  const lines = [
    `:mag: **${SWEEP_CARD_MARK}** — share what this conversation settled?`,
    "",
    `Nothing from here has left this group DM. ✅ posts exactly ${notes.length === 1 ? "this note" : "these notes"} in ${where}; ⛔ drops ${notes.length === 1 ? "it" : "them"}.`,
  ];
  for (const n of notes) {
    lines.push("", `In ${SHARE_CHANNEL_NAMES[n.to]}:`, ...n.text.split("\n").map((l) => `> ${l}`));
  }
  lines.push(
    "",
    "The people who could confirm the fix can confirm this. " +
      `Expires in ${SWEEP_CARD_TTL_MS / 3_600_000} h, with no reminder.`,
  );
  return {
    card: { kind: "confirm", verb: `post this note in ${where}`, lead: lines.join("\n"), fields: [], caveats: [], operations },
    operations,
  };
}

/**
 * Offer the share after a group DM's fix batch: post the share card in the
 * same thread, stage it, and put it on the usage record as a Worker-staged
 * card whose group-DM channel is not named. Best-effort — a failure is
 * logged and the fix stands — except a budget stop, which is thrown.
 *
 * @param fix - The confirmed fix card
 * @param outcomes - What its batch ran
 * @param deps - The channels, the post, ThreadState and the usage record
 * @returns The staged share card, or null when nothing was offered
 */
export async function stageSweepShare(
  fix: PendingProposal,
  outcomes: readonly OperationOutcome[],
  deps: {
    channels: ShareChannels;
    post(to: { channel: string; threadTs: string }, card: ProposalCard): Promise<{ ok: boolean; ts?: string; text?: string }>;
    threadState: Pick<ThreadState, "putProposal">;
    proposalEvents: ProposalEventLog;
    now(): number;
  },
): Promise<PendingProposal | null> {
  const offer = sweepShareOffer(fix.sweepShare, outcomes, deps.channels);
  if (!offer) return null;
  const root = fix.replyTs ?? fix.threadTs;
  try {
    const sent = await deps.post({ channel: fix.channel, threadTs: root }, offer.card);
    if (!sent.ok || !sent.ts) {
      console.warn(`[sweep] share card for ${fix.proposalTs} not posted`);
      return null;
    }
    const first = offer.operations[0]!;
    const proposal: PendingProposal = {
      operations: offer.operations,
      toolName: first.toolName,
      input: first.input,
      channel: fix.channel,
      threadTs: fix.threadTs,
      replyTs: root,
      userMsgTs: root,
      proposalTs: sent.ts,
      proposalText: sent.text ?? offer.card.lead ?? "",
      requesterUserId: "",
      ttlMs: SWEEP_CARD_TTL_MS,
      confirmers: [...(fix.confirmers ?? [])],
      supersedeKey: SWEEP_SHARE_KEY,
    };
    const { retired } = await deps.threadState.putProposal(proposal);
    const now = deps.now();
    // A group DM is never named on the record (`storesChannel`).
    await recordProposalEvents(deps.proposalEvents, [
      ...supersededEvents(retired, now, "worker"),
      stagedEvent({ proposal, at: now, via: "worker", channelStored: storesChannel("channel", "mpim") }),
    ]);
    return proposal;
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[sweep] share card for ${fix.proposalTs} not staged: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** A page title as it appears in a note: one line, trimmed. */
function plain(title: string): string {
  return title.replace(/\s+/g, " ").trim() || "untitled";
}
