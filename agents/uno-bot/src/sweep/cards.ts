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
/** A changed span longer than this is shown by its two ends. */
const SPAN_CHARS = 240;

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
 * little unchanged context. `…` marks where the shown text was cut — the card
 * shows it, the replacement never carries it (`replacementProblem`).
 *
 * @param original - The block's text as read
 * @param replacement - What the fix writes in its place
 */
export function changedSpan(original: string, replacement: string): { before: string; after: string } {
  const a = flat(original);
  const b = flat(replacement);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  const show = (text: string): string => {
    const start = Math.max(0, head - CONTEXT_CHARS);
    const end = Math.min(text.length, text.length - tail + CONTEXT_CHARS);
    let middle = text.slice(head, text.length - tail);
    if (middle.length > SPAN_CHARS) middle = `${middle.slice(0, SPAN_CHARS / 2)} … ${middle.slice(-SPAN_CHARS / 2)}`;
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

/** A reply about a card's items: one that opens by dropping or keeping, a
 *  drop / keep / change aimed at a numbered or named fix, or a fix by number. */
const ABOUT_THE_CARD = [
  /^\W*(drop|keep|skip|remove|exclude|leave out)\b/i,
  /\b(drop|keep|skip|remove|exclude|leave out|change|edit|reword|revise|rewrite)\b[^.?!\n]{0,30}?(#?\d{1,2}\b|\b(fix|fixes|item|items|first|second|third|last|all)\b)/i,
  /\b(fix|item)\s*#?\d{1,2}\b/i,
];

/**
 * Whether a reply with no @mention, in a thread where uno-bot's only posts are
 * sweep cards, is addressed to the card: a typed gate emoji, or words about its
 * items. Anything else is the thread's own conversation, and is left alone.
 */
export function engagesOnSweepCard(text: string): boolean {
  return typedEmojiDecision(text) !== null || ABOUT_THE_CARD.some((re) => re.test(text));
}

/**
 * The model-visible block for a turn in a thread whose pending card the sweep
 * staged — where a reply is most likely someone dropping an item.
 */
export function sweepCardInstruction(): string {
  return [
    "(system: SWEEP CARD — the pending card is an end-of-day sweep card: one `notion_update` per fix, each an in-place replace.",
    "A reply that drops an item (\"drop 2\", \"not the second one\") → stage the SAME batch without that operation, every other operation byte for byte. Nothing left → cancel with `proposal_resolve`.",
    "Change only what the reply asked for: the revision holds the card's own fixes, minus the dropped ones. For anything more, `read_reference` `docs/connectors/slack-sweep`.)",
  ].join("\n");
}
