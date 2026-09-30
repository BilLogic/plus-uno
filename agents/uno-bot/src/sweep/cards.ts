// The morning's proposal cards: which findings share a card, what the card
// runs, who may confirm it, and what it says.
//
// ONE LIVE CARD PER PLACE. A source thread (or a team channel, for the
// findings that go there) holds at most one live sweep card, of at most
// `MAX_ITEMS_PER_CARD` in-place replacements. More fixes than that, and a new
// day's fixes for a place whose card is still live, wait in the queue until
// that card is resolved or lapses; nothing is dropped for want of room. A
// sweep card lives beside a turn's card in the same thread without either
// retiring the other (`proposalSlot`). A card's key is its content — the post
// date, the destination and its first fix's block — so a retried morning never
// mistakes one card for another. A fix is one `notion_update` operation with
// one `replace`, stamped with the `last_edited_time` the sweep read (ADR-029):
// the integration refuses it, unwritten, when the block has moved since.
//
// CONFIRMERS are the card's owners plus everyone who posted in the thread, and
// the card lives 72 hours, with no re-ping when it lapses. Each item names its
// owner, who is @-mentioned; nobody else is.
//
// PURE: no `Env`, no Slack call. The card is data (`ProposalCard`); Slack
// renders it (`slack/proposal-render.ts`).

import { typedEmojiDecision } from "../gate/reactions";
import type { ProposalOperation } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { pickDestination, type Destination } from "./finding";
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

const QUOTE_CHARS = 200;
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
}

/** The operation one item runs. */
export function itemOperation(item: Pick<PendingFinding, "target" | "blockId" | "lastEditedTime" | "replacement">): ProposalOperation {
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
      return cardPlan(`${postDate}:${destinationKey(g.destination)}:${chunk[0]!.blockId}`, g.destination, chunk);
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

/** One key per place a card can land: a thread, or a team channel. */
export function destinationKey(d: Destination): string {
  return d.rung === "private" || d.rung === "thread" ? `${d.channel}:${d.threadTs ?? ""}` : d.channel;
}

/**
 * The card as data: a lead listing each fix beside its owner, then the batch.
 *
 * @param plan - The planned card
 */
export function sweepCard(plan: SweepCardPlan): ProposalCard {
  const n = plan.items.length;
  const lines = [
    `:mag: **${SWEEP_CARD_MARK}** — this thread settled ${n === 1 ? "something" : `${n} things`} a linked page still says the old way.`,
    "",
  ];
  plan.items.forEach((item, i) => {
    const evidence = item.evidence.permalinks[0] ? ` ([where](${item.evidence.permalinks[0]}))` : "";
    const { before, after } = changedSpan(item.original, item.replacement);
    lines.push(
      `${i + 1}. <@${item.owner}> · [${item.target.title}](${item.target.url})`,
      `   - page says: “${quote(item.sourceSays)}”`,
      `   - thread says: “${quote(item.threadSays)}”${evidence}`,
      `   - change: “${before}” → “${after}”`,
    );
  });
  lines.push(
    "",
    `One ✅ applies ${n === 1 ? "it" : `all ${n}`}; reply \`drop 2\` to leave one out. ` +
      "The owners named above and anyone who posted in this thread can confirm. " +
      `Expires in ${SWEEP_CARD_TTL_MS / 3_600_000} h, with no reminder.`,
  );
  return {
    kind: "confirm",
    verb: n === 1 ? "apply this Notion fix" : `apply these ${n} Notion fixes`,
    lead: lines.join("\n"),
    fields: [],
    caveats: [],
    operations: plan.operations,
  };
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

function quote(text: string): string {
  const f = flat(text);
  return f.length > QUOTE_CHARS ? `${f.slice(0, QUOTE_CHARS - 1)}…` : f;
}

/** The blocks a batch replaces in place — what says a later card revises a
 *  sweep card rather than asking for something else. */
export function replacedBlocks(operations: readonly Pick<ProposalOperation, "toolName" | "input">[]): Set<string> {
  const blocks = new Set<string>();
  for (const op of operations) {
    if (op.toolName !== "notion_update" || !Array.isArray(op.input.replace)) continue;
    for (const entry of op.input.replace as Record<string, unknown>[]) {
      const id = entry?.block_id ?? entry?.blockId;
      if (typeof id === "string" && id) blocks.add(id);
    }
  }
  return blocks;
}

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

/**
 * A sweep card's revision as a sweep card still: the sweep's mark leads it and
 * it carries the sweep's tag, so a reply under it is read by the same rule as
 * one under the card it replaced (`engagesOnSweepCard`). Its role is
 * `revision`, which the search for the card's own message passes over.
 */
export function asSweepRevision(card: ProposalCard): ProposalCard {
  return {
    ...card,
    lead: `:mag: **${SWEEP_CARD_MARK}** — revised${card.lead ? `: ${card.lead}` : "."}`,
    tag: { eventType: SWEEP_CARD_EVENT, payload: { role: "revision" } },
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
 * The model-visible block for a turn in a thread whose pending card the sweep
 * staged — where a reply is most likely someone dropping an item.
 */
export function sweepCardInstruction(): string {
  return [
    "(system: SWEEP CARD — the pending card is an end-of-day sweep card: one `notion_update` per fix, each an in-place replace.",
    "A reply that drops an item in words (\"not the second one\"; a bare \"drop 2\" is applied before you see it) → stage the SAME batch without that operation, every other operation byte for byte. Nothing left → cancel with `proposal_resolve`.",
    "Change only what the reply asked for: the revision holds the card's own fixes, minus the dropped ones. For anything more, `read_reference` `docs/connectors/slack-sweep`.)",
  ].join("\n");
}
