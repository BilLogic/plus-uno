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
import { canonicalNotionUrl, createdDesignStatus, extractNotionIds } from "../integrations/notion";
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

// ── The body: Markdown as rich text ─────────────────────────────────────────

type InlineElement =
  | { type: "text"; text: string; style?: { bold?: boolean; italic?: boolean; code?: boolean } }
  | { type: "link"; url: string; text: string };

/** `**bold**`, `` `code` ``, `_italic_` and `[label](url)`, as rich text
 *  styles and links; anything else as it is written. */
const INLINE = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(?<![\w*])[_*]([^_*\n]+)[_*](?![\w*])/g;

function inlineOf(text: string): InlineElement[] {
  const out: InlineElement[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1]) out.push({ type: "text", text: m[1], style: { bold: true } });
    else if (m[2]) out.push({ type: "text", text: m[2], style: { code: true } });
    else if (m[3] && m[4]) out.push({ type: "link", url: m[4], text: m[3] });
    else if (m[5]) out.push({ type: "text", text: m[5], style: { italic: true } });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out.filter((e) => e.text);
}

const sectionOf = (text: string) => ({ type: "rich_text_section", elements: inlineOf(clip(text, TEXT_CHARS)) });
const boldLine = (text: string) => ({ type: "rich_text_section", elements: [{ type: "text", text: clip(text, TEXT_CHARS), style: { bold: true } }] });

/** A list item: `- `, `* `, `• `, or `1. ` / `1) `. */
const ITEM = /^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/;
/** A Markdown heading or a task box, read as a plain line. */
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const TASK = /^\[[ xX]\]\s+/;

/**
 * A Markdown body as rich text elements: each run of list lines a rich text
 * list (bullet or ordered, as written), each heading a bold line, every other
 * run of lines a paragraph.
 */
export function proseElements(markdown: string): unknown[] {
  const out: unknown[] = [];
  let paragraph: string[] = [];
  let list: { style: "bullet" | "ordered"; items: string[] } | null = null;
  const flushParagraph = () => {
    if (paragraph.length) out.push(sectionOf(paragraph.join("\n")));
    paragraph = [];
  };
  const flushList = () => {
    if (list?.items.length) out.push({ type: "rich_text_list", style: list.style, elements: list.items.map(sectionOf) });
    list = null;
  };
  for (const line of markdown.split("\n")) {
    const item = ITEM.exec(line);
    const heading = HEADING.exec(line);
    if (item && item[3]!.trim()) {
      flushParagraph();
      const style = item[2] ? "ordered" : "bullet";
      if (list && list.style !== style) flushList();
      list ??= { style, items: [] };
      list.items.push(item[3]!.trim().replace(TASK, ""));
    } else if (heading) {
      flushParagraph();
      flushList();
      out.push(boldLine(heading[1]!.trim()));
    } else if (!line.trim()) {
      flushParagraph();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return out;
}

/** One body section: its heading as a bold line, its words as rich text. */
function bodyBlock(heading: string, markdown: string): unknown {
  return { type: "rich_text", elements: [...(heading ? [boldLine(heading)] : []), ...proseElements(markdown)] };
}

/** The body as the create writes it: each section, in the array's order, then
 *  the acceptance criteria. */
function bodyOf(input: Input): unknown[] {
  const sections = (Array.isArray(input.sections) ? input.sections : [])
    .map((s) => ({ heading: str(obj(s).heading), text: str(obj(s).body) }))
    .filter((s) => s.heading || s.text);
  const blocks = sections.map((s) => bodyBlock(s.heading, s.text));
  const criteria = Array.isArray(input.acceptance_criteria) ? input.acceptance_criteria.map(str).filter(Boolean) : [];
  if (criteria.length) blocks.push(bodyBlock("Acceptance criteria", criteria.map((c) => `- ${c}`).join("\n")));
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
