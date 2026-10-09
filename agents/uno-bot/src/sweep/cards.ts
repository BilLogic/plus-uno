// The morning's sweep reports: which findings share a report, what each fix
// runs, who may decide it, and what the report says.
//
// ONE LIVE REPORT PER PLACE. A source thread (or a team channel, for the
// findings that go there) holds at most one live sweep report, of at most
// `MAX_ITEMS_PER_CARD` in-place replacements — the shared card's carousel
// (`slack/decision-cards.ts`). More fixes than that, and a new day's fixes
// for a place whose report is still live, wait in the queue until it is
// decided or lapses; nothing is dropped for want of room, and the parent line
// counts what waits. A report's key is its content — the post date, the
// destination and its first fix's block — so a retried morning never mistakes
// one report for another. A fix is one `notion_update` operation with one
// `replace`, stamped with the `last_edited_time` the sweep read (ADR-029): the
// integration refuses it, unwritten, when the block has moved since.
//
// EACH FIX IS ITS OWN PROPOSAL: its card's Review opens it alone, decided in
// the pop-up, and its card redraws in place. CONFIRMERS are the report's
// owners plus everyone who posted in the thread, and each fix lives 72 hours,
// with no re-ping when it lapses. Each card names its owner, who is
// @-mentioned; nobody else is.
//
// A GROUP DM'S FIX carries its page (`sweepShareOf`), so that once its write
// lands, a separate share card can offer a reworded note (`./share.ts`). A
// private channel's carries nothing to share.
//
// The `drop N` reading, `keptFixes` and the revision wording below belong to
// the DM capture card (`dm-watch/capture.ts`), which still stages one batch.
//
// PURE: no `Env`, no Slack call. A report is data (`ReportItem`); the shared
// builder draws it.

import { typedEmojiDecision } from "../gate/reactions";
import { escapeSlackText } from "../slack/mrkdwn";
import { clip } from "../slack/decision-cards";
import type { ProposalOperation, ReportItem, StatedCardWords, SweepShare } from "../thread-state/index";
import type { CardFixes, ProposalCard } from "../turn/index";
import { FOUND_BY_SEARCH, addedContent, saidAt, saidIn } from "./capture-lines";
import { pickDestination, shareDestination, type Destination } from "./finding";
import type { PendingFinding } from "./store";

/** How long a sweep card stays confirmable. */
export const SWEEP_CARD_TTL_MS = 72 * 60 * 60 * 1000;

/** In-place replacements one card may hold. */
export const MAX_ITEMS_PER_CARD = 10;

/** Every sweep card's lead opens with this. */
export const SWEEP_CARD_MARK = "End-of-day sweep";

/** The message-metadata type a sweep card, and each follow-up posted before
 *  it, is tagged with; the payload carries the card's key. */
export const SWEEP_CARD_EVENT = "uno_sweep_card";

/** The tag a withdrawn sweep card is retagged with (`SweepDelivery.withdraw`). */
export const WITHDRAWN_SWEEP_CARD_EVENT = "uno_sweep_card_withdrawn";

/** Unchanged text shown either side of a fix's changed span. */
const CONTEXT_CHARS = 40;

/** One card, planned. */
export interface SweepCardPlan {
  /** `<post date>:<destination>:<first block id>` — the card's identity in
   *  `sweep_items`, which is what makes a retried post add nothing. */
  key: string;
  destination: Destination;
  items: PendingFinding[];
  /** One `notion_update` per item, in item order. */
  operations: ProposalOperation[];
  /** Owners first, then the thread's other posters, each once. */
  confirmers: string[];
  /** The place's findings past the card's ten, still queued: the report's
   *  parent line counts them as held for its next run. */
  rest?: PendingFinding[];
}

/** The operation one item runs. */
export function itemOperation(
  item: Pick<PendingFinding, "target" | "blockId" | "lastEditedTime" | "replacement" | "add">,
): ProposalOperation {
  // An undocumented answer goes in after its section's last block, on that
  // block's stamp (`./capture-lines.ts`).
  if (item.add) {
    return {
      toolName: "notion_update",
      input: {
        page_url: item.target.url,
        insert: [{ after_block_id: item.blockId, last_edited_time: item.lastEditedTime, content: addedContent(item) }],
      },
    };
  }
  return {
    toolName: "notion_update",
    input: {
      page_url: item.target.url,
      replace: [{ block_id: item.blockId, last_edited_time: item.lastEditedTime, content: item.replacement }],
    },
  };
}

/**
 * The cards for a morning's findings: one per place that has no live card, of
 * its oldest drift first. What does not fit stays queued. Only writable
 * findings with a block to replace are carded; the rest were never queued.
 *
 * @param findings - The findings due this morning
 * @param postDate - The morning's date, `YYYY-MM-DD`
 * @param busy - Whether a place (`destinationKey`) already holds a live card
 */
export function planSweepCards(
  findings: readonly PendingFinding[],
  postDate: string,
  busy: (where: string) => boolean = () => false,
): SweepCardPlan[] {
  const groups = new Map<string, { destination: Destination; items: PendingFinding[] }>();
  for (const f of findings) {
    if (!f.target.writable || !f.blockId || !f.lastEditedTime) continue;
    const destination = pickDestination(f);
    const where = destinationKey(destination);
    if (busy(where)) continue;
    const group = groups.get(where) ?? { destination, items: [] };
    group.items.push(f);
    groups.set(where, group);
  }
  return [...groups.values()]
    .map((g) => {
      const items = [...g.items].sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
      const chunk = items.slice(0, MAX_ITEMS_PER_CARD);
      const rest = items.slice(MAX_ITEMS_PER_CARD);
      const plan = cardPlan(`${postDate}:${destinationKey(g.destination)}:${chunk[0]!.blockId}`, g.destination, chunk);
      return rest.length ? { ...plan, rest } : plan;
    })
    .sort((a, b) => a.items[0]!.driftAt - b.items[0]!.driftAt || a.key.localeCompare(b.key));
}

/**
 * One card from its key, destination and items, in the order given — how the
 * morning rebuilds a card it recorded but never finished staging.
 */
export function cardPlan(key: string, destination: Destination, items: PendingFinding[]): SweepCardPlan {
  const owners = items.map((f) => f.owner);
  const participants = items.flatMap((f) => f.participants);
  return {
    key,
    destination,
    items,
    operations: items.map(itemOperation),
    confirmers: [...new Set([...owners, ...participants].filter(Boolean))],
  };
}

/**
 * A short, stable digest of a card's operations — key order and whitespace
 * in the JSON do not move it, any change of text or stamp does. It rides the
 * card's Slack tag and its snapshot, so a card is only ever staged with the
 * operations it showed.
 */
export function operationsDigest(operations: readonly ProposalOperation[]): string {
  const text = stable(operations);
  // cyrb53: not a cryptographic hash — it detects a changed batch, and
  // nothing here trusts it against an adversary.
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v !== null && typeof v === "object") {
    return `{${Object.entries(v as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${JSON.stringify(k)}:${stable(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/** Slack's names for the two team channels a group DM's share goes to. */
export const SHARE_CHANNEL_NAMES: Record<SweepShare["pages"][number]["to"], string> = {
  "plus-universal": "#plus-universal",
  "plus-design": "#plus-design",
};

/**
 * The share a group-DM card carries, or undefined for a card from anywhere
 * else: each page its fixes touch, once, in item order, with the team channel
 * a note about it goes to (`shareDestination`).
 *
 * @param items - The card's findings
 */
export function sweepShareOf(items: readonly PendingFinding[]): SweepShare | undefined {
  if (!items.length || !items.every((f) => f.evidence.channelKind === "group-dm")) return undefined;
  const pages: SweepShare["pages"] = [];
  for (const f of items) {
    if (pages.some((p) => p.url === f.target.url)) continue;
    pages.push({ url: f.target.url, title: f.target.title, to: shareDestination(f.target).channel });
  }
  return { pages };
}

/** One key per place a card can land: a thread, or a team channel. */
export function destinationKey(d: Destination): string {
  return d.rung === "private" || d.rung === "thread" ? `${d.channel}:${d.threadTs ?? ""}` : d.channel;
}

/** Whether a destination is the thread its items came from. */
function inThread(d: Destination): boolean {
  return d.rung === "thread" || (d.rung === "private" && d.threadTs !== null);
}

/**
 * The report's parent line: what the morning found, in one plain sentence —
 * no mark, no instructions; the cards' buttons are the instructions. One item
 * names its page; several are counted. mrkdwn: a page title is escaped.
 *
 * @param items - Every item waiting for the place, shown or held
 * @param destination - Where the report posts
 */
export function sweepParent(items: readonly PendingFinding[], destination: Destination): string {
  const n = items.length;
  const pageOf = (f: PendingFinding) => `*${escapeSlackText(flat(f.target.title) || "untitled")}*`;
  if (n === 1) {
    const f = items[0]!;
    const who = capitalised(saidIn(f, inThread(destination)));
    return f.add ? `${who} answered something that ${pageOf(f)} doesn't say yet.` : `${who} settled something that ${pageOf(f)} still states the old way.`;
  }
  if (items.every((f) => f.add)) return `${n} answers are on no page yet.`;
  const pages = new Set(items.map((f) => f.target.url)).size;
  return pages === 1 ? `${pageOf(items[0]!)} still states ${n} things its thread changed.` : `${pages} pages still state what their threads changed.`;
}

/** Characters of each quote on a card: the two halves of a body, with their
 *  words around them, fit its 200. */
const QUOTE_CHARS = 84;
/** An added answer's one quote, in the same 200. */
const ADD_QUOTE_CHARS = 160;

/**
 * One fix as its card in the report: the page names it, its owner and where
 * it was said under that, and what the page says beside what was decided.
 * Its id is its block, unique on a card (`itemRecord`). Open goes to the page.
 *
 * @param f - The finding
 * @param destination - Where the report posts
 */
export function sweepItem(f: PendingFinding, destination: Destination): ReportItem {
  const where = [`<@${f.owner}>`, `from ${saidIn(f, inThread(destination))}`, ...(f.target.foundBy === "search" ? [FOUND_BY_SEARCH] : [])];
  return {
    // Carded findings always name a block (`planSweepCards`).
    id: f.blockId!,
    title: flat(f.target.title) || "untitled",
    subtitle: where.join(" · "),
    // Each half clipped on its own, so the decision always shows; View and
    // Review show both whole.
    body: f.add
      ? `No page says this yet · decision says “${clip(f.threadSays, ADD_QUOTE_CHARS)}”`
      : `Page says “${clip(f.sourceSays, QUOTE_CHARS)}” · decision says “${clip(f.threadSays, QUOTE_CHARS)}”`,
    // Once written, the card says what the page now holds.
    done: flat(f.replacement),
    detail: sweepItemText(f),
    open: { label: "Open page", url: f.target.url },
  };
}

/**
 * One fix's whole change, as its Review pop-up shows it: the page and its
 * owner, the block's words now and what they become — or where an answer
 * goes and what it adds — and where it was said. Shown whole, however long: a
 * person decides exactly what will be written. mrkdwn: Notion's and Slack's
 * words are escaped, so a block holding `<!channel>` pings nobody.
 *
 * @param f - The finding
 */
export function sweepItemText(f: PendingFinding): string {
  const at = saidAt(f);
  const quoted = `“${escapeSlackText(flat(f.threadSays))}”`;
  const why = `Why: ${capitalised(saidIn(f, true))} said ${quoted}${at ? ` · <${at}|see it>` : ""}`;
  const page = `*${escapeSlackText(flat(f.target.title) || "untitled")}* · owner <@${f.owner}>`;
  if (f.add) {
    const place = f.add.section ? `Goes under: ${escapeSlackText(flat(f.add.section))}` : `Opens a new section: ${escapeSlackText(flat(f.add.newSection ?? ""))}`;
    return [page, place, `Adds: ${escapeSlackText(f.replacement)}`, why].join("\n");
  }
  return [page, `Page says now: ${escapeSlackText(f.original)}`, `Will say: ${escapeSlackText(f.replacement)}`, why].join("\n");
}

/** What a sweep fix says at the gate (`PendingProposal.stated`). */
export function sweepItemWords(): StatedCardWords {
  return {
    cancelled: "Rejected, nothing written",
    expired: "That fix closed after 72 h with no decision, so nothing was written.",
  };
}

/**
 * Whether a revision of one sweep fix keeps to that fix's own edit: in-place
 * replaces of its own blocks, on its page, each on the stamp the sweep read —
 * so it may narrow or reword the line and nothing else. Never true of a fix
 * that adds an answer: the model has no `insert` to restage it with.
 *
 * @param operations - The revision's batch
 * @param fix - The fix it revises
 */
export function keepsToFix(
  operations: readonly Pick<ProposalOperation, "toolName" | "input">[],
  fix: readonly Pick<ProposalOperation, "toolName" | "input">[],
): boolean {
  const own = new Map<string, unknown>();
  const pages = new Set<unknown>();
  for (const op of fix) {
    pages.add(op.input.page_url);
    for (const entry of (Array.isArray(op.input.replace) ? op.input.replace : []) as Record<string, unknown>[]) {
      own.set(String(entry.block_id ?? entry.blockId), entry.last_edited_time ?? entry.lastEditedTime);
    }
  }
  return (
    operations.length > 0 &&
    operations.every((op) => {
      const replace = op.input.replace;
      return (
        op.toolName === "notion_update" &&
        pages.has(op.input.page_url) &&
        !op.input.insert &&
        Array.isArray(replace) &&
        replace.length > 0 &&
        (replace as Record<string, unknown>[]).every((e) => {
          const block = String(e.block_id ?? e.blockId);
          return own.has(block) && own.get(block) === (e.last_edited_time ?? e.lastEditedTime);
        })
      );
    })
  );
}

/** What a reply in a sweep report's thread that would change a fix is told:
 *  a fix is revised from its own Review. */
export const FIX_REVIEW_INSTEAD = "To change a fix, press Review on its card and choose Needs changes.";

/** What a revision of a sweep fix that adds an answer is told. */
export const FIX_INSERT_REFUSAL =
  "This fix adds a new line, which a revision can't restage exactly, so it stays as drafted. Reject it in Review with what it should say instead.";

/** What a revision reaching past its sweep fix's own line is told. */
export const FIX_SCOPE_REFUSAL =
  "That would change more than this fix's own line, so it stays as drafted. Say what the line should read instead.";

function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * What a fix changes, for the card: the span between the longest common
 * prefix and suffix of the block's text and its replacement, each side with a
 * little unchanged context. The changed span is shown whole, however long: a
 * person confirms exactly what will be written. `…` marks only where the
 * UNCHANGED context was cut — the replacement never carries it
 * (`replacementProblem`). A card too long for one Slack message holds fewer
 * fixes rather than elide one (`runSweepJob`).
 *
 * @param original - The block's text as read
 * @param replacement - What the fix writes in its place
 */
export function changedSpan(original: string, replacement: string): { before: string; after: string } {
  // Compared as written, whitespace included: a changed space or line is a
  // change the card has to show.
  const a = original;
  const b = replacement;
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  const show = (text: string): string => {
    const start = Math.max(0, head - CONTEXT_CHARS);
    const end = Math.min(text.length, text.length - tail + CONTEXT_CHARS);
    const middle = text.slice(head, text.length - tail);
    return `${start > 0 ? "…" : ""}${text.slice(start, head)}${middle}${text.slice(text.length - tail, end)}${end < text.length ? "…" : ""}`;
  };
  return { before: show(a), after: show(b) };
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** The blocks a batch replaces in place — what says a later card revises a
 *  sweep card rather than asking for something else. */
export function replacedBlocks(operations: readonly Pick<ProposalOperation, "toolName" | "input">[]): Set<string> {
  const blocks = new Set<string>();
  for (const op of operations) {
    if (op.toolName !== "notion_update") continue;
    for (const entry of (Array.isArray(op.input.replace) ? op.input.replace : []) as Record<string, unknown>[]) {
      const id = entry?.block_id ?? entry?.blockId;
      if (typeof id === "string" && id) blocks.add(id);
    }
    // An added answer is keyed by the block it goes in after.
    for (const entry of (Array.isArray(op.input.insert) ? op.input.insert : []) as Record<string, unknown>[]) {
      const id = entry?.after_block_id ?? entry?.afterBlockId;
      if (typeof id === "string" && id) blocks.add(id);
    }
  }
  return blocks;
}

/** Whether a card's operations add an answer (`insert`) — a card only
 *  `drop N` revises, since `notion_update` offers the model no `insert` to
 *  restage it with. */
export function holdsInsert(operations: readonly Pick<ProposalOperation, "toolName" | "input">[]): boolean {
  return operations.some((op) => op.toolName === "notion_update" && Array.isArray(op.input.insert) && op.input.insert.length > 0);
}

/** What a worded revision of a card holding an added answer is told. */
export const INSERT_CARD_REFUSAL =
  ":warning: This sweep card adds text after a block, which a reply in words can't restage exactly, so the card stays as it is. " +
  "Reply `drop N` to leave a fix out, or ⛔ the card and ask me.";

/** Whether a bot post is part of a sweep card: tagged as one, or — read
 *  without its metadata — opening as one does. */
export function isSweepCardPost(post: { text?: string; metadata?: { event_type?: string } }): boolean {
  const tag = post.metadata?.event_type;
  return tag === SWEEP_CARD_EVENT || tag === WITHDRAWN_SWEEP_CARD_EVENT || (post.text ?? "").includes(SWEEP_CARD_MARK);
}

/** "drop 2", "remove 1, 3 and 4", "keep 1 and 3", "keep only 2" — the whole
 *  reply, fix numbers only. A sentence that happens to hold a verb and a
 *  number ("change 2 buttons to secondary", "remove 2 of the variants") is
 *  the thread's own conversation. */
const PICK = /^\s*(drop|remove|keep(?: only)?)\s+((?:#?\d{1,2})(?:\s*(?:,|and|&)\s*#?\d{1,2})*)\s*\.?\s*$/i;

/**
 * Whether a reply with no @mention, in a thread where uno-bot's only posts are
 * sweep cards, is addressed to the card by what it says: a typed gate emoji, or
 * a whole-message pick of its fixes by number. Anything else is the thread's
 * own conversation, and is left alone.
 */
export function engagesOnSweepCard(text: string): boolean {
  return typedEmojiDecision(text) !== null || PICK.test(text.trim());
}

/** The tag a sweep report's own message carries: its key and its
 *  operations' digest, which a retry finds it by. Sent again on every edit. */
export function sweepReportMetadata(tag: { cardKey: string; digest: string }): { event_type: string; event_payload: Record<string, string> } {
  return { event_type: SWEEP_CARD_EVENT, event_payload: { card_key: tag.cardKey, digest: tag.digest, role: "card" } };
}

/** The sweep's tag on a post that answers a sweep card — its batch result,
 *  a note — as the port carries it (`ProposalCard.tag`). */
export function sweepTag(role: "revision" | "result" | "note"): { eventType: string; payload: Record<string, string> } {
  return { eventType: SWEEP_CARD_EVENT, payload: { role } };
}

/** The same tag as Slack message metadata. */
export function sweepPostMetadata(role: "revision" | "result" | "note"): {
  event_type: string;
  event_payload: Record<string, string>;
} {
  return { event_type: SWEEP_CARD_EVENT, event_payload: { role } };
}

/**
 * A sweep card's revision as a sweep card still: the sweep's mark leads it and
 * it carries the sweep's tag, so a reply under it is read by the same rule as
 * one under the card it replaced (`engagesOnSweepCard`). Its role is
 * `revision`, which the search for the card's own message passes over.
 */
export function asSweepRevision(card: ProposalCard): ProposalCard {
  return {
    ...card,
    lead: `**${SWEEP_CARD_MARK}** — revised${card.lead ? `: ${card.lead}` : "."}`,
    tag: sweepTag("revision"),
  };
}

/**
 * Which of a sweep card's fixes a "drop N" / "keep N" reply leaves, by index
 * — read structurally, so the revision is the card's own operations minus
 * the dropped ones, never a batch the model rewrote. Null for any other reply
 * and for a number the card does not have: those go to the model.
 *
 * @param text - The reply
 * @param count - How many fixes the card holds
 * @returns The 0-based indexes kept, in card order (empty: all dropped)
 */
export function sweepCardPick(text: string, count: number): number[] | null {
  const m = PICK.exec(text.trim());
  if (!m) return null;
  const numbers = [...m[2]!.matchAll(/\d{1,2}/g)].map((d) => Number(d[0]));
  if (numbers.some((n) => n < 1 || n > count)) return null;
  const named = new Set(numbers.map((n) => n - 1));
  const keep = m[1]!.toLowerCase().startsWith("keep");
  return Array.from({ length: count }, (_, i) => i).filter((i) => named.has(i) === keep);
}

/**
 * The fixes a `drop N` revision shows: the kept ones, renumbered from 1 so the
 * next `drop N` names the card that reads N, under a head and a confirm line
 * whose counts are the revision's own. The confirmers' sentence is the card's,
 * since the same people may confirm; the revision keeps its card's deadline,
 * so the "expires in" hours are not repeated.
 *
 * @param fixes - The card's fixes, as staged with it
 * @param kept - The 0-based indexes kept (`sweepCardPick`), in card order
 */
export function keptFixes(fixes: CardFixes, kept: readonly number[]): CardFixes {
  const n = kept.length;
  const items = kept.map((at, i) => {
    const fix = fixes.items[at]!;
    return { ...fix, detail: fix.detail.replace(/^\d+\. /, `${i + 1}. `) };
  });
  const applies = `One ✅ applies ${n === 1 ? "it" : `all ${n}`}${n === 1 ? "." : "; reply `drop 2` to leave one out."}`;
  const tail = fixes.tail
    .replace(/One ✅ applies (?:it|all \d+); reply `drop 2` to leave one out\./, applies)
    .replace(/Expires in \d+ h, with no reminder\./, "Expires when the card it revises would have, with no reminder.");
  return { head: `**${SWEEP_CARD_MARK}** — revised: ${n === 1 ? "one fix" : `${n} fixes`} left.`, items, tail };
}

/**
 * The model-visible block for a turn in a thread whose pending card the sweep
 * staged — where a reply is most likely someone dropping an item.
 */
export function sweepCardInstruction(): string {
  return [
    "(system: SWEEP CARD — the pending card is an end-of-day sweep card: one `notion_update` per fix, each an in-place replace, or an `insert` that adds an answer after a block. A card holding an `insert` is revised only by `drop N`: do not restage it, tell them to reply `drop N`.",
    "A reply that drops an item in words (\"not the second one\"; a bare \"drop 2\" is applied before you see it) → stage the SAME batch without that operation, every other operation byte for byte. Nothing left → cancel with `proposal_resolve`.",
    "Change only what the reply asked for: the revision holds the card's own fixes, minus the dropped ones. For anything more, `read_reference` `docs/connectors/slack-sweep`.)",
  ].join("\n");
}
