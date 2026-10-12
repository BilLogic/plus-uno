// The shared decision card: the one shape every report that asks someone to
// decide posts in. A plain parent line, then one `card` per item — a carousel
// when there are several, at most `MAX_REPORT_ITEMS` — each with Review, which
// opens that item's own proposal in the Review pop-up, and Open, its source.
//
// A REPORT SUPPLIES ITS ITEMS, ITS PARENT LINE AND ITS POST. Everything else
// is here: the clipping to Block Kit's limits, the held-back count, the
// record the store keeps (`reportRecord`), the fields each item's proposal is
// staged with (`itemProposal`), and every state a card can show — open,
// changes asked, approved and written, approved and not written, rejected, noted,
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
import { escapeSlackText, toPlainText } from "./mrkdwn";
import { cardLead, renderProposalCard } from "./proposal-render";
import { textSections } from "./render";
import { itemProposalKey } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type {
  CardOwner,
  DecisionReportRecord,
  OwnerLine,
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

/** A message: its fallback text and its blocks, and the metadata it posted
 *  with when it carries any — an edit sends it again. */
export interface ReportMessage {
  text: string;
  blocks: unknown[];
  metadata?: { event_type: string; event_payload: Record<string, unknown> };
}

/** A report ready to post: its message, the items it shows and the ones held. */
export interface DecisionReport extends ReportMessage {
  parent: string;
  shown: ReportItem[];
  held: ReportItem[];
  /** Blocks below the cards, kept on the record (`DecisionReportRecord.after`). */
  after?: unknown[];
  /** The opener's bullets, kept on the record (`DecisionReportRecord.ownerLines`). */
  ownerLines?: OwnerLine[];
}

/**
 * A report from all its items: the first `MAX_REPORT_ITEMS` shown, the rest
 * held for the report's next run. The parent line counts the same set — when
 * any are held it says "Showing 10 of N", N being every item passed in.
 *
 * @param allItems - Every item waiting, oldest first
 * @param parent - What the job found, in one plain sentence: no emoji, no
 *   mark, no instructions. mrkdwn.
 * @param opts - `after`: blocks posted below the cards, such as a table;
 *   `channel`: where it posts, so a DM tags nobody; `ownerLines`: what the
 *   opener says of each owner, in place of their cards' titles
 */
export function decisionReport(
  allItems: readonly ReportItem[],
  parent: string,
  opts: { after?: unknown[]; channel?: string; ownerLines?: OwnerLine[] } = {},
): DecisionReport {
  const shown = allItems.slice(0, MAX_REPORT_ITEMS);
  const held = allItems.slice(MAX_REPORT_ITEMS);
  const extra = { ...(opts.after?.length ? { after: opts.after } : {}), ...(opts.ownerLines?.length ? { ownerLines: opts.ownerLines } : {}) };
  const message = reportMessage(reportRecord(opts.channel ?? "", "", { parent, shown, held, ...extra }, 0));
  return { ...message, parent, shown, held, ...extra };
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
  report: Pick<DecisionReport, "parent" | "shown" | "held" | "after" | "ownerLines">,
  ttlMs: number,
): DecisionReportRecord {
  return {
    channel,
    messageTs,
    parent: report.parent,
    held: report.held.length,
    entries: report.shown.map((item) => ({ id: item.id, item, state: { kind: "open" } })),
    ttlMs,
    ...(report.after?.length ? { after: report.after } : {}),
    ...(report.ownerLines?.length ? { ownerLines: report.ownerLines } : {}),
  };
}

/** The key one item's proposal is staged under (`thread-state`, where the
 *  turn reads it too). */
export { itemProposalKey };

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

/** The entry id an item's next revision takes: `c2` → `c2~1` → `c2~2`. */
export function revisionId(id: string): string {
  return `${baseId(id)}~${Number(id.split("~")[1] ?? 0) + 1}`;
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

/**
 * An open card's subtitle: whom it is for, then where it came from. The tag
 * shows whose card it is; Slack notifies nobody from a subtitle, so the
 * opener does the notifying (`headLine`). In a DM nobody is tagged, so a
 * Slack owner is left off and only a named owner shows, in plain text. A
 * name the subtitle already says ("not found in Slack: Kai") is not said
 * twice.
 */
function openSubtitle(item: ReportItem, channel: string): string | undefined {
  const dm = channel.startsWith("D");
  const who = (item.owners ?? [])
    .flatMap((o) => ("slack" in o ? (dm ? [] : [`<@${o.slack}>`]) : [escapeSlackText(o.name)]))
    .filter((w, i, all) => all.indexOf(w) === i && !(item.subtitle ?? "").includes(w))
    .join(" ");
  return [who, item.subtitle].filter(Boolean).join(" · ") || undefined;
}

/** What a card shows in each state: its subtitle and body, and its button. */
function shownAs(entry: ReportEntry, channel: string): { subtitle?: string; body: string; button: "Review" | "View" | null } {
  const { item, state } = entry;
  const by = (id: string) => `<@${id}>`;
  switch (state.kind) {
    case "open": {
      const subtitle = openSubtitle(item, channel);
      return { ...(subtitle ? { subtitle } : {}), body: item.body, button: "Review" };
    }
    case "changes-asked":
      return { subtitle: `Changes asked by ${by(state.by)}`, body: item.body, button: "Review" };
    // Decided by one of the card's own answers: "<label> · <@who>".
    case "approved":
      return state.as
        ? { subtitle: `${state.as.label} · ${by(state.by)}`, body: state.as.decided ?? `Written: ${state.done ?? item.done ?? item.body}`, button: "View" }
        : { subtitle: `Approved by ${by(state.by)} · written ${etClock(state.at)}`, body: `Written: ${state.done ?? item.done ?? item.body}`, button: "View" };
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
    case "noted":
      return { subtitle: `Noted by ${by(state.by)}`, body: `Note: ${state.note}`, button: "View" };
    case "expired":
      return { subtitle: "Closed, no decision", body: item.body, button: "View" };
    case "not-staged":
      // Nothing to review: its proposal never staged.
      return { subtitle: state.note, body: item.body, button: null };
  }
}

/** One entry's card. */
function entryCard(entry: ReportEntry, channel: string): Record<string, unknown> {
  const { item } = entry;
  const shown = shownAs(entry, channel);
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

/** A user mention, as mrkdwn writes it. */
const USER_MENTION = /<@[A-Z0-9]+>/g;
/** The run of mentions a subtitle leads with, and the `·` after it. */
const OPENING_MENTIONS = new RegExp(`^(?:${USER_MENTION.source}\\s*)+(?:·\\s*)?`);

/** Characters of an item's title on its owner's bullet. */
const BULLET_TITLE_CHARS = 60;

/** A sentence's first word lowered, to read on after "<@owner>, " — unless
 *  it is a name or an acronym ("Figma", "PRD"), kept as written. */
function readOn(sentence: string): string {
  const word = /^[A-Z][a-z]*\b/.exec(sentence)?.[0];
  if (!word || NAMES.has(word)) return sentence;
  return sentence.charAt(0).toLowerCase() + sentence.slice(1);
}

/** How the opener names an owner: tagged, by name when Slack has no such
 *  person, and not at all for a Slack person in a DM. */
function ownerWho(owner: CardOwner, dm: boolean): string | null {
  if ("slack" in owner) return dm ? null : `<@${owner.slack}>`;
  return escapeSlackText(owner.name);
}

/** Names a parent line may open on. */
const NAMES = new Set(["Figma", "Notion", "Slack", "Storybook", "Roadmap", "I"]);

/**
 * The head of the message: the parent line opened on whom the cards are for,
 * where Slack notifies (#1143). One card for one owner reads "<@owner>, the
 * parent line"; otherwise the parent line, then one bullet per owner listing
 * that owner's cards, each owner mentioned once. A report that says what it
 * has for each owner (`ownerLines`) bullets those words in their place,
 * "<@owner>, 4 files need a tidy.", and one such bullet with no parent line
 * is the opener alone. An owner with no Slack person is named in plain text.
 * A DM tags nobody.
 */
function headLine(record: Pick<DecisionReportRecord, "parent" | "held" | "entries" | "channel" | "ownerLines">): string {
  const line = parentLine(record);
  const dm = record.channel.startsWith("D");
  if (record.ownerLines?.length) {
    const said = record.ownerLines.map(({ owner, says }) => {
      const who = owner ? ownerWho(owner, dm) : null;
      return who ? `${who}, ${readOn(says)}` : says;
    });
    if (!line && said.length === 1) return said[0]!;
    return [...(line ? [line] : []), ...said.map((s) => `• ${s}`)].join("\n");
  }
  if (dm) return line;
  const byOwner = new Map<string, { who: string; titles: string[] }>();
  for (const { item } of record.entries) {
    for (const owner of item.owners ?? []) {
      const key = "slack" in owner ? `@${owner.slack}` : owner.name;
      const who = "slack" in owner ? `<@${owner.slack}>` : escapeSlackText(owner.name);
      const mine = byOwner.get(key) ?? { who, titles: [] };
      const title = escapeSlackText(clip(item.title, BULLET_TITLE_CHARS));
      if (!mine.titles.includes(title)) mine.titles.push(title);
      byOwner.set(key, mine);
    }
  }
  const owners = [...byOwner.values()];
  if (!owners.length) return line;
  if (owners.length === 1 && record.entries.length === 1) return `${owners[0]!.who}, ${readOn(line)}`;
  return [line, ...owners.map((o) => `• ${o.who} — ${o.titles.join(" + ")}`)].join("\n");
}

/**
 * A report's message as its record stands: the parent line, then each card in
 * its state, one card or a carousel, then any blocks it posted below them. A
 * report with no items is its parent line and those blocks.
 *
 * @param record - The report's record
 */
export function reportMessage(record: DecisionReportRecord): ReportMessage {
  if (record.entries.length > MAX_REPORT_ITEMS) {
    throw new Error(`a decision report holds at most ${MAX_REPORT_ITEMS} items; hold the rest back (decisionReport)`);
  }
  const head = headLine(record);
  const drawn = [
    ...textSections(head),
    ...(record.entries.length ? [carouselOf(record.entries.map((e) => entryCard(e, record.channel)))] : []),
    ...(record.after ?? []),
  ];
  // A report that posted plain stays plain: Slack refused its cards once.
  const blocks = record.plain ? plainReportBlocks(drawn) : drawn;
  // The fallback is mrkdwn and a card's words are plain text: escaped, so a
  // title holding `<!channel>` pings nobody from the notification either.
  const text = [head, ...record.entries.map((e) => `• ${escapeSlackText(clip(e.item.title, CARD_TITLE_CHARS))}: ${e.state.kind === "expired" ? "Closed, no decision. " : ""}${escapeSlackText(shownAs(e, record.channel).body)}`)].join("\n");
  return { text, blocks, ...(record.metadata ? { metadata: record.metadata } : {}) };
}

/**
 * A report's plain rung, for a workspace whose Slack refuses `card` blocks:
 * the parent line, then each card as a section of its title, subtitle and
 * body with its own Review (or View) beside it, so every item stays
 * decidable from its own button; Open is the title's link. A section
 * notifies where a card's subtitle does not, so an owner tag the opener
 * already makes is left off the subtitle: each owner is mentioned once.
 *
 * @param blocks - The report's blocks (`decisionReport`)
 */
export function plainReportBlocks(blocks: readonly unknown[]): unknown[] {
  const opener = new Set<string>();
  for (const block of blocks) {
    const b = block as Record<string, any>;
    if (b.type === "section") for (const m of String(b.text?.text ?? "").matchAll(USER_MENTION)) opener.add(m[0]);
  }
  const untagged = (subtitle: string) => {
    const lead = OPENING_MENTIONS.exec(subtitle)?.[0];
    if (!lead) return subtitle;
    const kept = [...lead.matchAll(USER_MENTION)].map((m) => m[0]).filter((m) => !opener.has(m));
    return [kept.join(" "), subtitle.slice(lead.length)].filter(Boolean).join(" · ");
  };
  return blocks.flatMap((block) => {
    const b = block as Record<string, any>;
    const cards: Record<string, any>[] = b.type === "card" ? [b] : b.type === "carousel" ? b.elements : [];
    if (!cards.length) return [block];
    return cards.map((card) => {
      const actions = (card.actions ?? []) as Record<string, any>[];
      const review = actions.find((a) => typeof a.action_id === "string");
      const open = actions.find((a) => typeof a.url === "string" && a !== review);
      const title = escapeSlackText(String(card.title?.text ?? ""));
      const lines = [
        open ? `*<${open.url}|${title}>*` : `*${title}*`,
        ...(card.subtitle?.text ? [untagged(String(card.subtitle.text))].filter(Boolean) : []),
        escapeSlackText(String(card.body?.text ?? "")),
      ];
      return { type: "section", text: { type: "mrkdwn", text: lines.join("\n") }, ...(review ? { accessory: review } : {}) };
    });
  });
}

/** One item's words — title, state and body, then its whole detail — for View once its
 *  proposal is gone; null when the record has no such entry. */
export function itemText(record: DecisionReportRecord, id: string): string | null {
  const entry = record.entries.find((e) => e.id === id);
  if (!entry) return null;
  const shown = shownAs(entry, record.channel);
  return [entry.item.title, shown.subtitle, shown.body, entry.item.detail].filter(Boolean).join("\n");
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
 * Close one item as expired, and say where it stands after: `expired` when
 * the close applied, or the decision that landed first and kept the item
 * (`changedReport`). Null when the store has no such report or item.
 *
 * @param store - The thread store
 * @param item - The item, as its proposal names it
 * @param now - The clock, for items whose time ran out
 */
export async function expireItem(
  store: ReportStore,
  item: { messageTs: string; id: string },
  now: number,
): Promise<{ state: ReportItemState["kind"]; message: ReportMessage } | null> {
  const record = await store.updateReport(item.messageTs, { id: item.id, state: { kind: "expired" } });
  const state = record?.entries.find((e) => e.id === item.id)?.state.kind;
  return record && state ? { state, message: reportMessage(await withClosed(store, record, now)) } : null;
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
  const id = revisionId(oldId);
  const record = await store.updateReport(messageTs, { id: oldId, replace: { id, item } });
  return record ? { id, message: reportMessage(record) } : null;
}

/**
 * What a revision turn does to an item of a decision report
 * (`TurnDeps.reportItems`), whichever report it is — none needs a step of
 * its own.
 *
 * `revise` readies the redraft of an item: the item as it was — its title,
 * who and where, its sources — saying what the revision now does. What Review
 * shows is the card as a turn spells it. Its `place`, called once the
 * revision is staged, puts it in the item's place under the same number
 * (`replaceItem`) and redraws the report's message. Null when the store has
 * no such report or item.
 *
 * `reopen` puts an item sent back for changes back to open, Review and all,
 * when its turn staged no revision (`settleItem`).
 *
 * @param store - The thread store
 * @param edit - Edit the report's message in place (`chat.update`)
 * @param now - The clock, for items whose time ran out
 */
export function reportItems(
  store: ReportStore,
  edit: (messageTs: string, message: ReportMessage) => Promise<void>,
  now: () => number,
) {
  const redraw = (messageTs: string, message: ReportMessage) =>
    edit(messageTs, message).catch((err: unknown) => {
      console.warn(`[decision-cards] ${messageTs} not redrawn: ${err instanceof Error ? err.message : String(err)}`);
    });
  return {
    async revise(target: { messageTs: string; id: string }, card: ProposalCard) {
      const before = (await store.getReport(target.messageTs))?.entries.find((e) => e.id === target.id)?.item;
      if (!before) return null;
      const lead = cardLead(card);
      // What it wrote before no longer describes the write.
      const { done: _done, detail: _detail, ...kept } = before;
      const item: ReportItem = { ...kept, body: (lead && toPlainText(lead).trim()) || `Revised: ${card.verb}.` };
      return {
        text: renderProposalCard(card).text,
        staged: itemProposal(target.messageTs, revisionId(target.id)),
        async place() {
          const replaced = await replaceItem(store, target.messageTs, target.id, item);
          if (replaced) await redraw(target.messageTs, replaced.message);
          else console.warn(`[decision-cards] ${target.messageTs} has no item ${target.id} to replace`);
        },
      };
    },
    async reopen(target: { messageTs: string; id: string }): Promise<void> {
      const message = await settleItem(store, target, { kind: "open" }, now());
      if (message) await redraw(target.messageTs, message);
    },
  };
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
