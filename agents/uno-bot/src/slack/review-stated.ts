// The Review pop-up's readings of the Worker's own cards, in the shared
// anatomy (`review-anatomy.ts`): the Figma tidy-up, the Dev Mode links, the
// DS precedence intake and the sweep's shared note.
//
// FACTS, NOT TEXT. Each of these cards states itself in a mrkdwn lead, which
// is right for the thread and wrong for a pop-up. So each stager also puts
// what the card is about on the staged proposal as data
// (`PendingProposal.facts`), worded by its own copy, and the readings here lay
// those out. A card staged before the facts rode the proposal has none, and
// its reading is null, so the pop-up shows the card's text as it always has.
//
// PURE: blocks out, nothing posted, nothing read.
import { clip, isLink, OPEN_ACTION_ID } from "./card-block";
import { escapeSlackText, unescapeSlackText } from "./mrkdwn";
import type { DraftAnatomy, WhereElement } from "./review-anatomy";
import type { DevLinksFacts, PrecedenceFacts, ShareNoteFacts, StatedFacts, TidyFacts } from "../thread-state/index";

type Input = Record<string, unknown>;

/** What a reading here is drawn with: the proposal's facts, when it has any. */
export interface StatedContext {
  facts?: StatedFacts;
}

/** One element of a rich text line. */
type RichElement =
  | { type: "text"; text: string; style?: { bold?: boolean; code?: boolean } }
  | { type: "link"; url: string; text: string }
  | { type: "channel"; channel_id: string };

/** Slack's cap on a text; a rich text block is held to it per element. */
const TEXT_CHARS = 3000;
/** Items a list shows before it says how many more there are. */
const MAX_ITEMS = 40;

/** A channel's id, as Slack writes one. */
const CHANNEL_ID = /^[CG][A-Z0-9]{6,}$/;

/** A mrkdwn text's entities back to the characters they stand for: rich
 *  text is read as written. The sweep's notes are escaped plain text, so the
 *  quote reads as the post does. */
const unescaped = unescapeSlackText;

const text = (t: string, style?: { bold?: boolean; code?: boolean }): RichElement => ({ type: "text", text: clip(t, TEXT_CHARS), ...(style ? { style } : {}) });
const link = (url: string, label: string): RichElement => (isLink(url) ? { type: "link", url, text: clip(label, TEXT_CHARS) } : text(label));
const section = (elements: readonly RichElement[]) => ({ type: "rich_text_section", elements: [...elements] });

/** A list under a bold label, each item a line of rich elements; past
 *  `MAX_ITEMS`, a last item says how many more. */
function richList(label: string, items: ReadonlyArray<readonly RichElement[]>): unknown {
  const shown = items.slice(0, MAX_ITEMS).map(section);
  const more = items.length - MAX_ITEMS;
  if (more > 0) shown.push(section([text(`and ${more} more`)]));
  return {
    type: "rich_text",
    elements: [section([text(label, { bold: true })]), { type: "rich_text_list", style: "bullet", elements: shown }],
  };
}

/** Plain lines under the content, as one context block. */
function notes(lines: readonly string[]): unknown[] {
  const kept = lines.map((l) => l.trim()).filter(Boolean);
  return kept.length ? [{ type: "context", elements: [{ type: "mrkdwn", text: clip(escapeSlackText(kept.join(" ")), TEXT_CHARS) }] }] : [];
}

/** A line with each backticked stretch in code style: "Code has `size`" →
 *  text, code. An unmatched backtick stays as text. */
export function codeStyled(line: string): RichElement[] {
  const parts = line.split("`");
  if (parts.length % 2 === 0) return [text(line)];
  return parts.flatMap((p, i) => (p ? [text(p, i % 2 ? { code: true } : undefined)] : []));
}

/** The facts, when they are this tool's. */
function factsOf<K extends StatedFacts["kind"]>(context: StatedContext, kind: K): Extract<StatedFacts, { kind: K }> | null {
  return context.facts?.kind === kind ? (context.facts as Extract<StatedFacts, { kind: K }>) : null;
}

/**
 * A Figma tidy-up finding: the file as the header, the finding as a card
 * (the check its title, what it found its body) with Open file, and what
 * answering does. Its own answers are the decision (`PendingProposal.choices`).
 */
export function tidyAnatomy(_input: Input, context: StatedContext): DraftAnatomy | null {
  const facts: TidyFacts | null = factsOf(context, "figma_tidy_up");
  if (!facts) return null;
  return {
    header: facts.file,
    object: { title: facts.check, body: facts.finding, open: { url: facts.fileUrl, text: "Open file" } },
    content: notes([facts.note]),
  };
}

/**
 * Dev Mode links: the header names the component, the where line says what
 * Approve adds and in which file, and the links are a list of link elements —
 * on a batch, one item per component with its links.
 */
export function devLinksAnatomy(_input: Input, context: StatedContext): DraftAnatomy | null {
  const facts: DevLinksFacts | null = factsOf(context, "figma_dev_links");
  if (!facts) return null;
  const where: WhereElement[] = [
    { type: "text", text: `${facts.change} in ` },
    isLink(facts.figmaUrl) ? { type: "link", url: facts.figmaUrl, text: "Figma" } : { type: "text", text: "Figma" },
    { type: "text", text: facts.comment ? `, ${facts.comment}.` : "." },
  ];
  const items: RichElement[][] = facts.batch
    ? facts.components.map((c) => {
        const line: RichElement[] = [text(c.component, { bold: true })];
        for (const l of c.links) line.push(text(" · "), link(l.url, l.label));
        if (c.also) line.push(text(` · ${c.also}`));
        return line;
      })
    : facts.components.flatMap((c) => c.links.map((l) => [link(l.url, l.label)]));
  return {
    header: facts.header,
    where,
    content: [...(items.length ? [richList("Links", items)] : []), ...notes(facts.notes)],
    approve: facts.comment ? "Adds the links and the comment in Figma." : "Adds the links in Figma.",
  };
}

/** Said by Needs changes on a DS precedence card, which writes the note on
 *  the intake rather than redrafting. */
export const PRECEDENCE_REVISE = "Your note goes on the intake: the library is right, or it is deliberate.";

/**
 * One component of the DS precedence check: the finding as the header, the
 * week's intake as the where line, what differs as a list with each prop in
 * code style, and the component's code and library as Code and Figma.
 */
export function precedenceAnatomy(_input: Input, context: StatedContext): DraftAnatomy | null {
  const facts: PrecedenceFacts | null = factsOf(context, "ds_precedence_intake");
  if (!facts) return null;
  const buttons = [
    ["code", "Code", facts.codeUrl],
    ["figma", "Figma", facts.figmaUrl],
  ]
    .filter(([, , url]) => isLink(url!))
    .map(([id, label, url]) => ({ type: "button", action_id: `${OPEN_ACTION_ID}_${id}`, text: { type: "plain_text", text: label }, url }));
  return {
    header: facts.finding,
    where: [
      { type: "text", text: "Adds to the DS precedence intake for the week of " },
      { type: "text", text: facts.week, style: { bold: true } },
      { type: "text", text: ", filing the intake if this is the week's first." },
    ],
    content: [
      ...(facts.differences.length ? [richList("What differs", facts.differences.map(codeStyled))] : []),
      ...(buttons.length ? [{ type: "actions", elements: buttons }] : []),
    ],
    revise: PRECEDENCE_REVISE,
  };
}

/** A shared note's text, as the sweep staged it; "" when it has none. */
export function shareNoteText(input: Input): string {
  return typeof input.text === "string" ? input.text.trim() : "";
}

/** Where a shared note posts, as one where-line element: the channel as a
 *  pill, or its name where the input holds no id. */
export function shareNoteChannel(input: Input): WhereElement {
  const channel = typeof input.channel === "string" ? input.channel.trim() : "";
  const name = typeof input.channel_name === "string" && input.channel_name.trim() ? input.channel_name.trim() : "a team channel";
  return CHANNEL_ID.test(channel) ? { type: "channel", channel_id: channel } : { type: "text", text: name };
}

/** A shared note quoted exactly as it posts. */
export function shareNoteQuote(note: string): unknown {
  return { type: "rich_text", elements: [{ type: "rich_text_quote", elements: [text(unescaped(note))] }] };
}

/** The facts' plain lines under the notes. */
export function shareNoteLines(facts: ShareNoteFacts): unknown[] {
  return notes(facts.notes);
}

/** A shared note's facts, when the proposal carries them. */
export function shareNoteFacts(context: StatedContext): ShareNoteFacts | null {
  return factsOf(context, "sweep_share_post");
}

/**
 * A note the sweep posts verbatim: where it posts, with the channel as a
 * pill and what does not leave, then the note itself as a quote. A card of
 * several notes is a batch (`review-batch.ts` § `shareNotesAnatomy`).
 */
export function shareNoteAnatomy(input: Input, context: StatedContext): DraftAnatomy | null {
  const facts = shareNoteFacts(context);
  const note = shareNoteText(input);
  if (!facts || !note) return null;
  return {
    header: facts.header,
    where: [
      { type: "text", text: "Posts this note in " },
      shareNoteChannel(input),
      { type: "text", text: `. Nothing else leaves ${facts.from}.` },
    ],
    content: [shareNoteQuote(note), ...shareNoteLines(facts)],
  };
}
