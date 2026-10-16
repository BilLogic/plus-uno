// A batch — one card running several operations in order — read into the
// Review pop-up's shared anatomy (`review-anatomy.ts`).
//
// THE HEADER SAYS WHAT THE BATCH DOES, in a person's words: "Send 2 DMs" for
// two DMs, "Send a DM and file an issue" for a batch of two kinds, and "Run 3
// operations, in order" only where a tool has no words here. Under it, each
// operation is a bold numbered label over its own content: a DM's label names
// its recipient as a user pill ("1 · To @Bryan") over its Message input; any
// other tool's names its headline over the blocks its reading draws
// (`review-draft.ts` § `operationParts`). A batch of DMs also has the where
// line, every recipient in order.
//
// A batch with a tool neither this file nor `review-draft.ts` can read returns
// null, and the pop-up draws the card's text, as before.
//
// PURE: blocks out, nothing posted, nothing read.
import { fieldInputBlocks } from "./review-fields";
import { relayRecipientId } from "../tools/relayed-dm-render";
import { alertsFromCaveats, labelledText, whereMrkdwn, type DraftAnatomy, type WhereElement } from "./review-anatomy";
import { caveatsOf, operationParts, type DraftDetail } from "./review-draft";
import { shareNoteChannel, shareNoteFacts, shareNoteLines, shareNoteQuote, shareNoteText } from "./review-stated";
import type { ProposalOperation } from "../thread-state/index";

type Input = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** What one kind of operation is called in a header: once, and n times. */
interface Verb {
  /** Groups operations under one phrase: a tool, or a tool and its surface. */
  key: string;
  one: string;
  many: (n: number) => string;
}

/** The phrase for each tool a header can name; a tool with none makes the
 *  header "Run N operations, in order". */
const VERBS: Readonly<Record<string, (input: Input) => Verb>> = {
  dm_relay: () => ({ key: "dm", one: "send a DM", many: (n) => `send ${n} DMs` }),
  github_issue_create: () => ({ key: "issue", one: "file an issue", many: (n) => `file ${n} issues` }),
  github_issue_update: () => ({ key: "issue-update", one: "update an issue", many: (n) => `update ${n} issues` }),
  notion_update: () => ({ key: "page-update", one: "update a Notion page", many: (n) => `update ${n} Notion pages` }),
  notion_create: (input) => {
    const surface = str(input.surface).toLowerCase();
    if (surface === "prd" || surface === "intake") return { key: "roadmap", one: "add a Roadmap card", many: (n) => `add ${n} Roadmap cards` };
    if (surface === "decision") return { key: "decision", one: "log a decision", many: (n) => `log ${n} decisions` };
    return { key: "page", one: "create a Notion page", many: (n) => `create ${n} Notion pages` };
  },
};

/** "a, b and c". */
function andList(items: readonly string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)!}`;
}

/**
 * The batch's header: each kind of operation it runs, counted, in the order
 * the batch first runs it — or, with a tool that has no words here, its size.
 *
 * @param operations - The batch the card runs
 */
export function batchHeader(operations: readonly ProposalOperation[]): string {
  const groups = new Map<string, { verb: Verb; n: number }>();
  for (const op of operations) {
    const verb = VERBS[op.toolName]?.(op.input);
    if (!verb) return `Run ${operations.length} operations, in order`;
    const group = groups.get(verb.key);
    if (group) group.n++;
    else groups.set(verb.key, { verb, n: 1 });
  }
  const phrase = andList([...groups.values()].map(({ verb, n }) => (n === 1 ? verb.one : verb.many(n))));
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** The sweep's shared note: a card of one is read on its own
 *  (`review-stated.ts`), a card of several here. */
const SHARE_NOTE_TOOL = "sweep_share_post";

/**
 * A card of several shared notes, one per team channel: what it does, every
 * channel as a pill on the where line, then each note quoted exactly as it
 * posts under a numbered label naming its channel. Null when the card carries
 * no facts, or a note is empty, so the pop-up shows the card's text as before.
 *
 * @param operations - The card's `sweep_share_post` operations
 * @param detail - The proposal's facts
 */
export function shareNotesAnatomy(operations: readonly ProposalOperation[], detail: DraftDetail = {}): DraftAnatomy | null {
  const facts = shareNoteFacts(detail);
  const texts = operations.map((op) => shareNoteText(op.input));
  if (!facts || texts.some((t) => !t)) return null;
  const channels = operations.map((op) => shareNoteChannel(op.input));
  const content: unknown[] = [];
  operations.forEach((_op, i) => content.push(opLabel(i + 1, [{ type: "text", text: "In ", style: { bold: true } }, channels[i]!]), shareNoteQuote(texts[i]!)));
  const n = operations.length;
  return {
    header: facts.header,
    where: [
      { type: "text", text: `Posts ${n === 2 ? "these two notes" : `these ${n} notes`} in ` },
      ...channels.flatMap((c, i): WhereElement[] => [...(i === 0 ? [] : [{ type: "text" as const, text: i === n - 1 ? " and " : ", " }]), c]),
      { type: "text", text: `. Nothing else leaves ${facts.from}.` },
    ],
    content: [...content, ...shareNoteLines(facts)],
    approve: n === 2 ? "Posts exactly these two notes." : `Posts exactly these ${n} notes.`,
    destination: `post in ${andList(channels.map(whereMrkdwn))}`,
  };
}

/** A DM's recipient, as a where-line element: a user pill where the input
 *  holds an id, the name as written where it does not. */
function recipientElement(input: Input): WhereElement {
  const id = relayRecipientId(input.recipient);
  return id ? { type: "user", user_id: id } : { type: "text", text: str(input.recipient) || "someone" };
}


/** One operation's bold numbered label: "1 · To @Bryan", or "2 · New GitHub
 *  issue on …". */
function opLabel(n: number, rest: readonly WhereElement[]): unknown {
  return {
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "text", text: `${n} · `, style: { bold: true } }, ...rest.map((e) => ({ ...e }))] }],
  };
}

/**
 * The batch in the shared anatomy, or null when it is one operation, or holds
 * a tool no reading here draws.
 *
 * @param operations - The batch as it would run, saved edits applied
 * @param cardText - The card's text, without its footer: its caveats
 * @param detail - The fields drawn as inputs in place, and whether the reader
 *   may decide
 */
export function batchAnatomy(operations: readonly ProposalOperation[], cardText: string, detail: DraftDetail = {}): DraftAnatomy | null {
  if (operations.length < 2) return null;
  if (operations.every((op) => op.toolName === SHARE_NOTE_TOOL)) return shareNotesAnatomy(operations, detail);
  const parts = operationParts(operations, detail);
  if (!parts) return null;
  const dms = operations.every((op) => op.toolName === "dm_relay");
  const content: unknown[] = [];
  operations.forEach((op, i) => {
    if (op.toolName !== "dm_relay") {
      content.push(opLabel(i + 1, [{ type: "text", text: parts[i]!.headline, style: { bold: true } }]), ...parts[i]!.blocks);
      return;
    }
    // A DM: who it goes to in the label, so its blocks need no To line.
    content.push(opLabel(i + 1, [{ type: "text", text: "To ", style: { bold: true } }, recipientElement(op.input)]));
    const field = detail.inline?.get(`${i}.text`);
    const text = str(op.input.text);
    if (field) content.push(...fieldInputBlocks([field]));
    else if (text) content.push(labelledText("Message", text));
  });
  const recipients = dms ? operations.map((op) => recipientElement(op.input)) : [];
  const where: WhereElement[] = recipients.length
    ? [
        { type: "text", text: "Sends as uno, naming who asked, to " },
        ...recipients.flatMap((r, i): WhereElement[] => [
          ...(i === 0 ? [] : [{ type: "text" as const, text: i === recipients.length - 1 ? " and " : ", " }]),
          r,
        ]),
        { type: "text", text: ", in this order." },
      ]
    : [];
  return {
    header: batchHeader(operations),
    ...(where.length ? { where } : {}),
    alerts: alertsFromCaveats(caveatsOf(cardText)),
    content,
    ...(recipients.length ? { destination: `send to ${andList(recipients.map(whereMrkdwn))}` } : {}),
  };
}
