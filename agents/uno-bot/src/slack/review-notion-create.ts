// A `notion_create` draft in the Review pop-up's shared anatomy
// (`review-anatomy.ts`): a Roadmap card (`prd`, `intake`), a decision, a
// Marketplace row, or a page on any other surface.
//
// THE ZONES, for a create (`docs/plans/2026-10-15-review-modal-redesign.md`
// § 6 and § 7):
//   1. What it makes ("New PRD card", "Log a decision"), and one line naming
//      the database it lands in, linked where the Worker knows its address; a
//      decision's line names the Roadmap card it links to as well.
//   2. The card's caveats as alerts: a brief with no open questions is a
//      warning at the top, not a footnote under the body.
//   4. The Title input; the short facts (pillar, Design Status, source; a
//      decision's status and card) as `section` fields with Edit fields as
//      their accessory, so the button sits beside the selects it edits; the
//      Summary input; then the body, each section under a bold line and its
//      list-shaped lines as a rich text list. No `header` past zone 1.
// There is no object card: the page does not exist until Approve.
//
// For a reader who may not decide, the same zones with the title and summary
// shown rather than offered.
//
// PURE: blocks out, nothing posted, nothing read.
import { clip, isLink } from "./card-block";
import { acceptanceCriteriaBlocks, canonicalNotionUrl, createdDesignStatus, extractNotionIds } from "../integrations/notion";
import { markdownToNotionBlocks, type Annotations, type NotionBlock, type RichTextRun } from "../integrations/notion-blocks";
import {
  alertsFromCaveats,
  factsSection,
  labeledText,
  type DraftAlert,
  type DraftAnatomy,
  type Fact,
  type WhereElement,
} from "./review-anatomy";
import { fieldInputBlocks } from "./review-fields";
import type { DraftDetail } from "./review-draft";

type Input = Record<string, unknown>;

/** Where the Worker's Notion databases open, by the surface that writes to
 *  each. A database with no address is named, not linked. */
export interface NotionDatabaseLinks {
  roadmap?: string;
  decisions?: string;
  marketplace?: string;
}

/** Said where a Roadmap card's write sets no Design Status. */
export const DESIGN_STATUS_NOT_SET = "not set";

/** What a create's reading is drawn with: the draft's detail and the card's
 *  caveat lines (`review-draft.ts` § `caveatsOf`). */
export type NotionCreateContext = DraftDetail & { caveats: readonly string[] };

/** The no-open-questions caveat, as the card's text says it
 *  (`proposal-render.ts`). */
const NO_OPEN_QUESTIONS_LINE = /No open questions were named for this brief/;

/** The same caveat as the pop-up's alert says it, in the words of the
 *  pop-up's own decisions. */
export const NO_OPEN_QUESTIONS =
  "No open questions were named for this brief. If anything is ambiguous (states, interactions, semantics), choose Needs changes. Approving builds it as-is.";

/** Slack's cap on a rich text element's text, as the anatomy holds it. */
const TEXT_CHARS = 3000;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const obj = (v: unknown): Input => (v && typeof v === "object" && !Array.isArray(v) ? (v as Input) : {});
const squash = (name: string) => name.toLowerCase().replace(/[\s_]+/g, "");

/** A property key as a person reads it: `evidence_link` → `Evidence link`. A
 *  key the model wrote in the database's own spelling is kept as written. */
function labelOf(key: string): string {
  if (/[A-Z ]/.test(key)) return key;
  const words = key.replace(/_/g, " ").replace(/\burl\b/gi, "link");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** What each surface makes, as zone 1's header says it. */
function headerOf(surface: string): string {
  if (surface === "prd") return "New PRD card";
  if (surface === "intake") return "New intake card";
  if (surface === "decision") return "Log a decision";
  if (surface === "marketplace") return "Publish a Marketplace row";
  return "New Notion page";
}

/** A database by name, linked where its address is known. */
function database(name: string, url: string | undefined): WhereElement {
  return url && isLink(url) ? { type: "link", url, text: name } : { type: "text", text: name, style: { bold: true } };
}

/** A Roadmap card's address, from the URL or id the decision carries. */
function cardUrl(card: string): string | undefined {
  if (isLink(card)) return card;
  const id = extractNotionIds(card)[0];
  return id ? canonicalNotionUrl(null, id) : undefined;
}

/** Zone 1's line: the database the create lands in, and a decision's card. */
function whereOf(surface: string, card: string, links: NotionDatabaseLinks): WhereElement[] {
  const text = (t: string): WhereElement => ({ type: "text", text: t });
  if (surface === "prd" || surface === "intake") {
    return [text("Creates a card on the "), database("Roadmap", links.roadmap), text(" board.")];
  }
  if (surface === "decision") {
    const linked = card ? cardUrl(card) : undefined;
    const to: WhereElement[] = !card
      ? []
      : linked
        ? [text(", linked to "), { type: "link", url: linked, text: "its Roadmap card" }]
        : [text(", linked to "), { type: "text", text: card, style: { bold: true } }];
    return [text("Creates a row in the "), database("Decisions", links.decisions), text(" database"), ...to, text(".")];
  }
  if (surface === "marketplace") {
    return [text("Creates or updates a row in the "), database("Prototype Marketplace", links.marketplace), text(" database.")];
  }
  return [text("Creates a page in Notion.")];
}

/** The card's caveats as alerts, the no-open-questions brief in the pop-up's
 *  own words. */
function alertsOf(caveats: readonly string[]): DraftAlert[] {
  return caveats.flatMap((line) =>
    NO_OPEN_QUESTIONS_LINE.test(line) ? [{ level: "warning" as const, text: NO_OPEN_QUESTIONS }] : alertsFromCaveats([line]),
  );
}

/** A link's words in a fact: the place it opens. */
function linkWords(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("slack.com")) return "Slack thread";
    if (host.endsWith("notion.so") || host.endsWith("notion.com")) return "Notion page";
    if (host.endsWith("figma.com")) return "Figma file";
    return host.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

/** A fact whose value is a link: its words, opening the address. */
function linkFact(label: string, url: string, words = linkWords(url)): Fact {
  return [label, words, url];
}

/** A create's property, by any spelling of its name (case, spaces and
 *  underscores ignored), or its bare input key. */
function propOf(input: Input, ...names: string[]): string {
  const props = obj(input.properties);
  const want = new Set(names.map(squash));
  const key = Object.keys(props).find((k) => want.has(squash(k)));
  return (key ? str(props[key]) : "") || str(input[names[0]!]);
}

/**
 * A create's short facts, in the order a person checks them: what the write
 * sets, never an input's own key, a link as its place. The source comes
 * apart, so a reading can put the summary before it.
 *
 * @param surface - The create's surface, lower case
 * @param input - The create call
 */
export function createFacts(surface: string, input: Input): { facts: Fact[]; source?: string } {
  const props = obj(input.properties);
  const shown = new Set<string>();
  const facts: Fact[] = [];
  if (surface === "prd" || surface === "intake") {
    const pillar = propOf(input, "product_pillar");
    if (pillar) facts.push(["Product Pillar", pillar]);
    // What the write sets, not what the model drafted.
    facts.push(["Design Status", createdDesignStatus(surface) ?? DESIGN_STATUS_NOT_SET]);
    ["productpillar", "designstatus"].forEach((k) => shown.add(k));
  }
  if (surface === "decision") {
    const status = propOf(input, "status");
    if (status) facts.push(["Status", status]);
    const card = propOf(input, "roadmap_card");
    const linked = card ? cardUrl(card) : undefined;
    if (card) facts.push(linked ? linkFact("Roadmap Card", linked, "Open card") : ["Roadmap Card", card]);
    ["status", "roadmapcard"].forEach((k) => shown.add(k));
  }
  for (const [key, value] of Object.entries(props)) {
    // A list (a Marketplace row's contributors) reads as one line.
    const v = Array.isArray(value) ? value.map(str).filter(Boolean).join(", ") : str(value);
    if (shown.has(squash(key)) || !v) continue;
    facts.push(isLink(v) ? linkFact(labelOf(key), v) : [labelOf(key), v]);
  }
  const source = str(input.source_url);
  return source ? { facts, source } : { facts };
}

/** The facts the anatomy draws: the source last, linked as its place. */
function factsOf(surface: string, input: Input): Fact[] {
  const { facts, source } = createFacts(surface, input);
  return source ? [...facts, isLink(source) ? linkFact("Source", source) : ["Source", source]] : facts;
}

// ── The body: the Notion write's own blocks, as rich text ───────────────────
//
// The pop-up shows what Approve writes, so it draws from the same parse:
// `markdownToNotionBlocks` reads the Markdown once, into the block tree the
// create sends, and this walks that tree into Slack rich text. A second
// Markdown reader here once drifted from the writer: it ignored indentation,
// so a numbered item's own bullets sat level with it and every number read
// "1.". Whatever depth the tree has, the pop-up draws: a child list is the next
// `rich_text_list` with one more `indent`, and its parent list picks up after
// it with an `offset`, so the numbers keep counting. The writer nests one level
// today, so the tree is at most two deep; the walk does not assume it.
//
// A section draws at most TEXT_CHARS of text, as one clip did when the pop-up
// read the Markdown itself: the writer splits a long paragraph into several
// blocks, and without a budget across them the pop-up would draw it whole.

type Style = { bold?: boolean; italic?: boolean; strike?: boolean; code?: boolean };
type InlineElement = { type: "text"; text: string; style?: Style } | { type: "link"; url: string; text: string; style?: Style };
type Section = { type: "rich_text_section"; elements: InlineElement[] };

/** The deepest `indent` Slack takes on a list. Defensive: the tree is at most
 *  two deep today, so nothing draws past 1. */
const MAX_INDENT = 8;

/** What is left of a section's TEXT_CHARS, shared by every block it draws;
 *  whether a clip already ended a run in "…", and whether text was left out
 *  past the last thing drawn. */
type Room = { left: number; clipped?: boolean; dropped?: boolean };

/** A Notion run's annotations as a Slack style, `extra` laid over them. */
function styleOf(annotations: Annotations = {}, extra: Style = {}): Style | undefined {
  const style: Style = {
    ...(annotations.bold ? { bold: true } : {}),
    ...(annotations.italic ? { italic: true } : {}),
    ...(annotations.strikethrough ? { strike: true } : {}),
    ...(annotations.code ? { code: true } : {}),
    ...extra,
  };
  return Object.keys(style).length ? style : undefined;
}

/** Notion runs as rich text elements, a link kept as a link, the text taken
 *  from the section's room. */
function inlineOf(runs: readonly RichTextRun[] = [], room: Room, extra: Style = {}): InlineElement[] {
  const out: InlineElement[] = [];
  for (const run of runs) {
    if (room.left <= 0) {
      room.dropped = true;
      break;
    }
    const text = clip(run.text.content, room.left);
    if (text !== run.text.content) room.clipped = true;
    room.left -= text.length;
    if (!text) continue;
    const style = styleOf(run.annotations, extra);
    const url = run.text.link?.url;
    out.push(url ? { type: "link", url, text, ...(style ? { style } : {}) } : { type: "text", text, ...(style ? { style } : {}) });
  }
  return out;
}

const sectionOf = (elements: InlineElement[]): Section => ({ type: "rich_text_section", elements });
const boldLine = (text: string) => ({ type: "rich_text_section", elements: [{ type: "text", text: clip(text, TEXT_CHARS), style: { bold: true } }] });

/** The list a Notion list item belongs to in Slack; a task is a bullet. */
const LIST_STYLE: Record<string, "bullet" | "ordered"> = {
  bulleted_list_item: "bullet",
  numbered_list_item: "ordered",
  to_do: "bullet",
};

type Payload = { rich_text?: RichTextRun[]; children?: NotionBlock[]; cells?: RichTextRun[][] };
const payloadOf = (block: NotionBlock) => (block[block.type] ?? {}) as Payload;

/** A table row's cells as one line, a dot between each. */
function rowOf(row: NotionBlock, room: Room, extra: Style = {}): Section {
  const cells = (payloadOf(row).cells ?? []).map((cell) => inlineOf(cell, room, extra)).filter((c) => c.length);
  return sectionOf(cells.flatMap((cell, n) => (n ? [{ type: "text", text: " · " } as InlineElement, ...cell] : cell)));
}

/**
 * Notion blocks as rich text elements: each run of list items a rich text list
 * (bullet or ordered, as Notion has it), an item's children the next list one
 * `indent` deeper, each heading a bold line, a quote a quote, code
 * preformatted, a table its header in bold over a bullet per row, and every
 * paragraph a section. A divider draws nothing.
 *
 * An item with no text is drawn empty rather than dropped, so the numbers
 * after it match the page's.
 *
 * @param blocks - What the Notion write sends
 * @param room - What is left of the section's text budget; drawing stops when
 *   it runs out
 * @param indent - How deep these blocks sit in a list
 */
function richTextOf(blocks: readonly NotionBlock[], room: Room, indent = 0): unknown[] {
  const out: unknown[] = [];
  // The open list: its style, the items since a child list last broke it, and
  // how many it drew before them, so an ordered list keeps counting.
  let list: { style: "bullet" | "ordered"; items: Section[]; before: number } | null = null;
  const flush = () => {
    if (!list?.items.length) return;
    const offset = list.style === "ordered" && list.before ? { offset: list.before } : {};
    out.push({ type: "rich_text_list", style: list.style, ...(indent ? { indent } : {}), ...offset, elements: list.items });
    list.before += list.items.length;
    list.items = [];
  };
  const close = () => {
    flush();
    list = null;
  };
  for (const block of blocks) {
    if (room.left <= 0) {
      room.dropped = true;
      break;
    }
    const { rich_text, children = [] } = payloadOf(block);
    const style = LIST_STYLE[block.type];
    if (style) {
      if (list && list.style !== style) close();
      list ??= { style, items: [], before: 0 };
      list.items.push(sectionOf(inlineOf(rich_text, room)));
      if (children.length) {
        flush();
        out.push(...richTextOf(children, room, Math.min(indent + 1, MAX_INDENT)));
      }
      continue;
    }
    close();
    if (block.type.startsWith("heading_")) {
      const line = inlineOf(rich_text, room, { bold: true });
      if (line.length) out.push(sectionOf(line));
    } else if (block.type === "quote") {
      const line = inlineOf(rich_text, room);
      if (line.length) out.push({ type: "rich_text_quote", elements: line });
    } else if (block.type === "code") {
      const line = inlineOf(rich_text, room);
      if (line.length) out.push({ type: "rich_text_preformatted", elements: line });
    } else if (block.type === "table") {
      const [header, ...rows] = children;
      if (header) out.push(rowOf(header, room, { bold: true }));
      const lines = rows.map((row) => rowOf(row, room)).filter((row) => row.elements.length);
      if (lines.length) out.push({ type: "rich_text_list", style: "bullet", elements: lines });
    } else if (rich_text) {
      const line = inlineOf(rich_text, room);
      if (line.length) out.push(sectionOf(line));
    }
  }
  close();
  return out;
}

/**
 * A Markdown body as rich text elements, read by the parse the Notion write
 * uses, so the pop-up and the page agree on every list and its depth.
 */
export function proseElements(markdown: string): unknown[] {
  return sectionText(markdownToNotionBlocks(markdown));
}

/** A section's blocks within its TEXT_CHARS, ending in "…" when any text was
 *  left out, even where the budget ran out exactly between two blocks. */
function sectionText(blocks: readonly NotionBlock[]): unknown[] {
  const room: Room = { left: TEXT_CHARS };
  const out = richTextOf(blocks, room);
  if (room.dropped && !room.clipped) out.push(sectionOf([{ type: "text", text: "…" }]));
  return out;
}

/** One body section: its heading as a bold line, then the blocks the write
 *  sends under it. A section that draws nothing (a lone divider) is no block,
 *  since Slack refuses a rich_text without elements. */
function bodyBlock(heading: string, blocks: readonly NotionBlock[]): unknown[] {
  const elements = [...(heading ? [boldLine(heading)] : []), ...sectionText(blocks)];
  return elements.length ? [{ type: "rich_text", elements }] : [];
}

/** The body as the create writes it: each section, in the array's order, then
 *  the acceptance criteria. */
function bodyOf(input: Input): unknown[] {
  const sections = (Array.isArray(input.sections) ? input.sections : [])
    .map((s) => ({ heading: str(obj(s).heading), text: str(obj(s).body) }))
    .filter((s) => s.heading || s.text);
  const blocks = sections.flatMap((s) => bodyBlock(s.heading, markdownToNotionBlocks(s.text)));
  // The criteria as the write stores them: one task each, its text read
  // inline only, so a criterion's own line breaks and dashes stay in it.
  const criteria = Array.isArray(input.acceptance_criteria) ? input.acceptance_criteria.map(str) : [];
  const tasks = acceptanceCriteriaBlocks(criteria);
  if (tasks.length) blocks.push(...bodyBlock("Acceptance criteria", tasks));
  return blocks;
}

/** What Approve does on a Marketplace row, which may already exist. */
const MARKETPLACE_APPROVE = "Creates or updates the row now and links it in the thread.";

/**
 * A `notion_create` in the anatomy: what it makes and where, the caveats as
 * alerts, then Title, the facts beside Edit fields, Summary and the body.
 *
 * @param input - The create call, saved edits applied
 * @param context - The fields in place, the Edit fields button, the database
 *   addresses and the card's caveat lines
 */
export function notionCreateAnatomy(input: Input, context: NotionCreateContext): DraftAnatomy {
  const surface = str(input.surface).toLowerCase();
  const card = propOf(input, "roadmap_card");
  const content: unknown[] = [];
  /** A text the confirmer edits in place, or the text shown. */
  const part = (path: string, label: string) => {
    const field = context.inline?.get(`0.${path}`);
    if (field) content.push(...fieldInputBlocks([field]));
    else if (str(input[path])) content.push(labeledText(label, str(input[path])));
  };

  part("title", "Title");
  const facts = factsOf(surface, input);
  if (facts.length) content.push(factsSection(facts, context.editButton));
  part("summary", "Summary");
  const body = bodyOf(input);
  if (body.length) content.push({ type: "divider" }, ...body);

  return {
    header: headerOf(surface),
    where: whereOf(surface, card, context.databases ?? {}),
    alerts: alertsOf(context.caveats),
    content,
    ...(surface === "marketplace" ? { approve: MARKETPLACE_APPROVE } : {}),
  };
}
