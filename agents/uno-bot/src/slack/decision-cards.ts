// The shared decision card: the one shape every report that asks someone to
// decide posts in. A plain parent line, then one `card` per item — a carousel
// when there are several, at most `MAX_REPORT_ITEMS` — each with Review, which
// opens that item's own proposal in the Review pop-up, and Open, its source.
//
// A REPORT SUPPLIES ITS ITEMS, ITS PARENT LINE AND ITS POST. Everything else
// is here: the clipping to Block Kit's limits, the held-back count, the
// record the store keeps (`reportRecord`), the fields each item's proposal is
// staged with (`itemProposal`), and every state a card can show — open,
// changes asked, approved and written, approved and not written, rejected,
// closed with no decision, and never staged. None of it teaches a gate of
// its own: no ✅/⛔ footer, nothing to type.
//
// THE MESSAGE IS REBUILT FROM THE STORE, never read back from Slack. Each
// decision lands on the report's record (`ThreadState.updateReport`, one
// read-modify-write) and the whole message is drawn again from it
// (`reportMessage`), so items decided one after another, or at once, each
// keep their own state. A revision replaces its item in place, under the
// same number and a new proposal (`replaceItem`).
//
// No Env, no Slack client: the store-backed helpers take the store as a port.

import { carouselOf, logoFor } from "./answer-cards-block";
import { textSections } from "./render";
import type {
  DecisionReportRecord,
  PendingProposal,
  ReportEntry,
  ReportItem,
  ReportItemState,
  ThreadState,
} from "../thread-state/index";

/** A report's cards: Slack's carousel holds 1 to 10. The rest wait for the
 *  report's next run, wherever that report keeps its queue. */
export const MAX_REPORT_ITEMS = 10;

/** Each card's Review (View once decided) action id: this, then the item's
 *  entry id — unique within the message, as Slack asks of action ids. */
export const DECISION_REVIEW_ACTION_PREFIX = "uno_decision_review:";

/** Slack's limits on a card's words (`card` block reference). */
export const CARD_TITLE_CHARS = 150;
export const CARD_BODY_CHARS = 200;

/** A plain_text object. */
export const plain = (text: string) => ({ type: "plain_text", text });

/** Text on one line, cut to `max`, its last character an ellipsis when cut. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

/** A leading emoji, as a `:shortcode:` or as the character itself. */
const LEADING_EMOJI = /^(?::[a-z0-9_+-]+:|\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u;

/**
 * Why a write did not go through, as a card's subtitle ends: the outcome's
 * first line, without the emoji it may lead with or its closing stop.
 *
 * @param message - The failed operation's own line
 */
export function failureReason(message: string): string {
  const line = (message.split("\n")[0] ?? "").trim().replace(LEADING_EMOJI, "").replace(/\.$/, "");
  return line || "the write failed";
}

/** A message: its fallback text and its blocks. */
export interface ReportMessage {
  text: string;
  blocks: unknown[];
}

/** A report ready to post: its message, the items it shows and the ones held. */
export interface DecisionReport extends ReportMessage {
  parent: string;
  shown: ReportItem[];
  held: ReportItem[];
}

/**
 * A report from all its items: the first `MAX_REPORT_ITEMS` shown, the rest
 * held for the report's next run. The parent line counts the same set — when
 * any are held it says "Showing 10 of N", N being every item passed in.
 *
 * @param allItems - Every item waiting, oldest first
 * @param parent - What the job found, in one plain sentence: no emoji, no
 *   mark, no instructions. mrkdwn.
 */
export function decisionReport(allItems: readonly ReportItem[], parent: string): DecisionReport {
  const shown = allItems.slice(0, MAX_REPORT_ITEMS);
  const held = allItems.slice(MAX_REPORT_ITEMS);
  const message = reportMessage(reportRecord("", "", { parent, shown, held }, 0));
  return { ...message, parent, shown, held };
}

/**
 * The record the store keeps for a posted report, every item open.
 *
 * @param channel - Where it posted
 * @param messageTs - The message it posted as
 * @param report - The report (`decisionReport`)
 * @param ttlMs - How long its items stay decidable
 */
export function reportRecord(
  channel: string,
  messageTs: string,
  report: Pick<DecisionReport, "parent" | "shown" | "held">,
  ttlMs: number,
): DecisionReportRecord {
  return {
    channel,
    messageTs,
    parent: report.parent,
    held: report.held.length,
    entries: report.shown.map((item) => ({ id: item.id, item, state: { kind: "open" } })),
    ttlMs,
  };
}

/** The key one item's proposal is staged under: its message and its entry id.
 *  A Slack ts holds no `#`, so it never collides with a card's own ts. */
export function itemProposalKey(messageTs: string, id: string): string {
  return `${messageTs}#${id}`;
}

/**
 * What an item's proposal is staged with, beside its own operations, words
 * and terms: its key, the message it answers, its own slot in the thread —
 * shared by its revisions, so staging one retires the one before — and the
 * item it is.
 *
 * @param messageTs - The report's message
 * @param id - The item's entry id
 */
export function itemProposal(
  messageTs: string,
  id: string,
): Pick<PendingProposal, "proposalTs" | "userMsgTs" | "supersedeKey" | "item"> {
  return {
    proposalTs: itemProposalKey(messageTs, id),
    userMsgTs: messageTs,
    supersedeKey: `report-item:${messageTs}:${baseId(id)}`,
    item: { messageTs, id },
  };
}

/** An entry id without its revision suffix. */
function baseId(id: string): string {
  return id.split("~")[0]!;
}

/** The item a press on its Review (or View) is about, or null for any other
 *  button. */
export function reviewPressOf(actionId: string, messageTs: string): { key: string; item: { messageTs: string; id: string } } | null {
  if (!actionId.startsWith(DECISION_REVIEW_ACTION_PREFIX)) return null;
  const id = actionId.slice(DECISION_REVIEW_ACTION_PREFIX.length);
  return id ? { key: itemProposalKey(messageTs, id), item: { messageTs, id } } : null;
}

// ── Drawing a report ─────────────────────────────────────────────────────────

/** A time as ET's wall clock: "11:26". */
function etClock(at: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hourCycle: "h23" }).format(new Date(at));
}

/** What a card shows in each state: its subtitle and body, and its button. */
function shownAs(entry: ReportEntry): { subtitle?: string; body: string; button: "Review" | "View" | null } {
  const { item, state } = entry;
  const by = (id: string) => `<@${id}>`;
  switch (state.kind) {
    case "open":
      return { ...(item.subtitle ? { subtitle: item.subtitle } : {}), body: item.body, button: "Review" };
    case "changes-asked":
      return { subtitle: `Changes asked by ${by(state.by)}`, body: item.body, button: "Review" };
    // Decided by one of the card's own answers: "<label> · <@who>".
    case "approved":
      return state.as
        ? { subtitle: `${state.as.label} · ${by(state.by)}`, body: state.as.decided ?? `Written: ${item.done ?? item.body}`, button: "View" }
        : { subtitle: `Approved by ${by(state.by)} · written ${etClock(state.at)}`, body: `Written: ${item.done ?? item.body}`, button: "View" };
    case "failed":
      return {
        subtitle: `${state.as ? `${state.as.label} · ${by(state.by)}` : `Approved by ${by(state.by)}`} · not written: ${state.reason}`,
        body: "Nothing written.",
        button: "View",
      };
    case "rejected":
      return state.as
        ? { subtitle: `${state.as.label} · ${by(state.by)}`, body: state.as.decided ?? "Nothing written.", button: "View" }
        : { subtitle: `Rejected by ${by(state.by)}`, body: state.reason ? `Nothing written. Reason: ${state.reason}` : "Nothing written.", button: "View" };
    case "expired":
      return { subtitle: "Closed, no decision", body: item.body, button: "View" };
    case "not-staged":
      // Nothing to review: its proposal never staged.
      return { subtitle: state.note, body: item.body, button: null };
  }
}

/** One entry's card. */
function entryCard(entry: ReportEntry): Record<string, unknown> {
  const { item } = entry;
  const shown = shownAs(entry);
  const logo = logoFor(item.open.url);
  return {
    type: "card",
    icon: { type: "image", image_url: logo.url, alt_text: logo.name },
    title: plain(clip(item.title, CARD_TITLE_CHARS) || "untitled"),
    ...(shown.subtitle ? { subtitle: { type: "mrkdwn", text: clip(shown.subtitle, CARD_TITLE_CHARS) } } : {}),
    body: plain(clip(shown.body, CARD_BODY_CHARS) || " "),
    actions: [
      ...(shown.button
        ? [{ type: "button", action_id: `${DECISION_REVIEW_ACTION_PREFIX}${entry.id}`, text: plain(shown.button), value: entry.id }]
        : []),
      { type: "button", text: plain(item.open.label ?? "Open"), url: item.open.url },
      ...(item.also ? [{ type: "button", text: plain(item.also.label), url: item.also.url }] : []),
    ],
  };
}

/** The parent line, with the held-back count when there is one. */
function parentLine(record: Pick<DecisionReportRecord, "parent" | "held" | "entries">): string {
  if (!record.held) return record.parent;
  const shown = record.entries.length;
  return `${record.parent} Showing ${shown} of ${shown + record.held}; the rest come in the next report.`;
}

/**
 * A report's message as its record stands: the parent line, then each card in
 * its state, one card or a carousel. A report with no items is its parent
 * line alone.
 *
 * @param record - The report's record
 */
export function reportMessage(record: DecisionReportRecord): ReportMessage {
  if (record.entries.length > MAX_REPORT_ITEMS) {
    throw new Error(`a decision report holds at most ${MAX_REPORT_ITEMS} items; hold the rest back (decisionReport)`);
  }
  const head = parentLine(record);
  const blocks = record.entries.length ? [...textSections(head), carouselOf(record.entries.map(entryCard))] : textSections(head);
  const text = [head, ...record.entries.map((e) => `• ${clip(e.item.title, CARD_TITLE_CHARS)}: ${shownAs(e).body}`)].join("\n");
  return { text, blocks };
}

/** One item's words — title, state and body, unclipped — for View once its
 *  proposal is gone; null when the record has no such entry. */
export function itemText(record: DecisionReportRecord, id: string): string | null {
  const entry = record.entries.find((e) => e.id === id);
  if (!entry) return null;
  const shown = shownAs(entry);
  return [entry.item.title, shown.subtitle, shown.body].filter(Boolean).join("\n");
}

// ── Changing a report ────────────────────────────────────────────────────────

/** The store, as a report's changes need it. */
export type ReportStore = Pick<ThreadState, "getReport" | "updateReport" | "getProposalByTs">;

/**
 * Record where one item stands, and the report's message as it now reads —
 * null when the store has no such report or item.
 *
 * @param store - The thread store
 * @param item - The item, as its proposal names it
 * @param state - Where it stands now
 * @param now - The clock, for items whose time ran out
 */
export async function settleItem(
  store: ReportStore,
  item: { messageTs: string; id: string },
  state: ReportItemState,
  now: number,
): Promise<ReportMessage | null> {
  const record = await store.updateReport(item.messageTs, { id: item.id, state });
  return record ? reportMessage(await withClosed(store, record, now)) : null;
}

/**
 * Items shown and never staged: each says so, with nothing to review. The
 * report's message as it now reads, or null when the store has no report.
 *
 * @param store - The thread store
 * @param messageTs - The report's message
 * @param ids - The items' entry ids
 * @param note - What each card says in place of who and where
 */
export async function markNotStaged(store: ReportStore, messageTs: string, ids: readonly string[], note: string): Promise<ReportMessage | null> {
  let record: DecisionReportRecord | null = null;
  for (const id of ids) record = (await store.updateReport(messageTs, { id, state: { kind: "not-staged", note } })) ?? record;
  return record ? reportMessage(record) : null;
}

/**
 * A revision in place of its item: the same card, under the same number,
 * open again under a new entry id — so a new proposal, keyed by
 * `itemProposal(messageTs, id)`. The new id and the message as it now reads,
 * or null when the store has no such report or item.
 *
 * @param store - The thread store
 * @param messageTs - The report's message
 * @param oldId - The entry being revised
 * @param item - The revision
 */
export async function replaceItem(
  store: ReportStore,
  messageTs: string,
  oldId: string,
  item: ReportItem,
): Promise<{ id: string; message: ReportMessage } | null> {
  const rev = Number(oldId.split("~")[1] ?? 0) + 1;
  const id = `${baseId(oldId)}~${rev}`;
  const record = await store.updateReport(messageTs, { id: oldId, replace: { id, item } });
  return record ? { id, message: reportMessage(record) } : null;
}

/**
 * The report's message as it reads now, with any item whose time ran out
 * shown as closed — what a press on an expired item redraws. Null when the
 * store has no report.
 */
export async function currentReport(store: ReportStore, messageTs: string, now: number): Promise<ReportMessage | null> {
  const record = await store.getReport(messageTs);
  return record ? reportMessage(await withClosed(store, record, now)) : null;
}

/**
 * The record with every undecided item whose proposal aged out marked
 * closed, and kept so. An item's proposal answers "expired" until the store
 * collects it; past that, an item still undecided once its TTL from the
 * message's own time is up is closed too.
 */
async function withClosed(store: ReportStore, record: DecisionReportRecord, now: number): Promise<DecisionReportRecord> {
  let out = record;
  const postedAt = Number(record.messageTs) * 1000;
  for (const entry of record.entries) {
    if (entry.state.kind !== "open" && entry.state.kind !== "changes-asked") continue;
    const look = await store.getProposalByTs(itemProposalKey(record.messageTs, entry.id)).catch(() => null);
    const closed = look?.state === "expired" || (look?.state === "none" && Number.isFinite(postedAt) && now - postedAt > record.ttlMs);
    if (!closed) continue;
    out = (await store.updateReport(record.messageTs, { id: entry.id, state: { kind: "expired" } })) ?? out;
  }
  return out;
}
