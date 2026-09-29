// The morning's proposal cards: which findings share a card, what the card
// runs, who may confirm it, and what it says.
//
// ONE CARD PER SOURCE THREAD PER DAY, holding every fix found in that thread,
// at most `MAX_ITEMS_PER_CARD` in-place replacements each; more fixes mean more
// cards in the same thread, each in its own `slot` so neither retires the other
// (`PendingProposal.slot`). Slots continue from the cards the thread already
// has, so a new day's card never retires a card still live from an earlier
// one. A card's key is its content — the post date, the destination and its
// first fix's block — so a retried morning never mistakes an unposted chunk
// for one already posted. A fix is one `notion_update` operation with one
// `replace`, stamped with the `last_edited_time` the sweep read (ADR-029): the
// integration refuses it, unwritten, when the block has moved since.
//
// CONFIRMERS are the card's owners plus everyone who posted in the thread, and
// the card lives 72 hours, with no re-ping when it lapses. Each item names its
// owner, who is @-mentioned; nobody else is.
//
// PURE: no `Env`, no Slack call. The card is data (`ProposalCard`); Slack
// renders it (`slack/proposal-render.ts`).

import type { ProposalOperation } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { pickDestination, type Destination } from "./finding";
import type { PendingFinding } from "./store";

/** How long a sweep card stays confirmable. */
export const SWEEP_CARD_TTL_MS = 72 * 60 * 60 * 1000;

/** In-place replacements one card may hold. */
export const MAX_ITEMS_PER_CARD = 10;

const QUOTE_CHARS = 200;

/** One card, planned. */
export interface SweepCardPlan {
  /** `<post date>:<destination>:<first block id>` — the card's identity in
   *  `sweep_items`, which is what makes a retried post add nothing. */
  key: string;
  destination: Destination;
  /** Its slot in its thread, after every card the thread already has. */
  slot: number;
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
 * The cards for a morning's findings. Only writable findings with a block to
 * replace are carded; the rest were never queued.
 *
 * @param findings - The findings due this morning
 * @param postDate - The morning's date, `YYYY-MM-DD`
 * @param slotsTaken - How many cards a destination already holds (`destinationKey`)
 */
export function planSweepCards(
  findings: readonly PendingFinding[],
  postDate: string,
  slotsTaken: (where: string) => number = () => 0,
): SweepCardPlan[] {
  const groups = new Map<string, { destination: Destination; runDate: string; items: PendingFinding[] }>();
  for (const f of findings) {
    if (!f.target.writable || !f.blockId || !f.lastEditedTime) continue;
    const destination = pickDestination(f);
    const where = destinationKey(destination);
    const key = `${where}|${f.runDate}`;
    const group = groups.get(key) ?? { destination, runDate: f.runDate, items: [] };
    group.items.push(f);
    groups.set(key, group);
  }

  const plans: SweepCardPlan[] = [];
  // Slots are numbered per thread across the whole morning, so two days'
  // findings waiting for the same thread never share one.
  const slots = new Map<string, number>();
  for (const group of [...groups.values()].sort((a, b) => a.runDate.localeCompare(b.runDate))) {
    const items = [...group.items].sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
    const where = destinationKey(group.destination);
    for (let i = 0; i < items.length; i += MAX_ITEMS_PER_CARD) {
      const chunk = items.slice(i, i + MAX_ITEMS_PER_CARD);
      const slot = slots.get(where) ?? slotsTaken(where);
      slots.set(where, slot + 1);
      const owners = chunk.map((f) => f.owner);
      const participants = chunk.flatMap((f) => f.participants);
      plans.push({
        key: `${postDate}:${where}:${chunk[0]!.blockId}`,
        destination: group.destination,
        slot,
        items: chunk,
        operations: chunk.map(itemOperation),
        confirmers: [...new Set([...owners, ...participants].filter(Boolean))],
      });
    }
  }
  return plans;
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
    `:mag: **End-of-day sweep** — this thread settled ${n === 1 ? "something" : `${n} things`} a linked page still says the old way.`,
    "",
  ];
  plan.items.forEach((item, i) => {
    const evidence = item.evidence.permalinks[0] ? ` ([where](${item.evidence.permalinks[0]}))` : "";
    lines.push(
      `${i + 1}. <@${item.owner}> · [${item.target.title}](${item.target.url})`,
      `   - page says: “${quote(item.sourceSays)}”`,
      `   - thread says: “${quote(item.threadSays)}”${evidence}`,
      `   - fix: “${quote(item.replacement)}”`,
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

function quote(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > QUOTE_CHARS ? `${flat.slice(0, QUOTE_CHARS - 1)}…` : flat;
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
