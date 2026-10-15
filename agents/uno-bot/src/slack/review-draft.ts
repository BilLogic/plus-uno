// The Review pop-up's draft, written for the person deciding it: the key
// properties first, each by the name the database gives it, then the body as
// headings and paragraphs in the draft's own order, then the card's caveats.
//
// The card's text is a parameter list — `Surface: prd`, `Properties:`,
// `Sections:` with each section's keys in whatever order the model emitted
// them — which is right for the thread's fallback copy and wrong for a
// decision. So the pop-up reads the staged calls themselves, by field name,
// and never shows an input's own key. A tool this file has no reading for
// returns null, and the pop-up shows the card's text as before.
//
// CURRENT CONTENT, ISSUE, NEW CONTENT. A change to what a page already says
// reads in three parts, in that order: the value as it read when the card was
// staged (`PendingProposal.before`), why it changes (`PendingProposal.issue`,
// left out when the card holds no reason), and the value it will have. Keyed
// as the editable fields are, `<op>.<path>`, so a field drawn as an input
// finds its current content by the same key. A block, and a property, read
// the same three labels.
//
// PURE: blocks out, nothing posted, nothing read.
import { reviewSections, textSections } from "./render";
import { SLACK_USER_ID, escapeSlackText } from "./mrkdwn";
import { fieldInputBlocks, MAX_INPUT_CHARS, type EditableField } from "./review-fields";
import { relayRecipientId } from "../tools/relayed-dm-render";
import { MAX_FEEDBACK_QUESTIONS, shareoutChannelRef } from "../tools/share-out-render";
import { createdDesignStatus } from "../integrations/notion";
import { CARD_BODY_CHARS } from "./card-block";
import {
  alertsFromCaveats,
  labelledText,
  listBlock,
  quoteBlock,
  shareoutApprove,
  type DraftAnatomy,
  type WhereElement,
} from "./review-anatomy";
import type { ProposalOperation } from "../thread-state/index";

type Input = Record<string, unknown>;

/** Said where a Roadmap card's write sets no Design Status. */
export const DESIGN_STATUS_NOT_SET = "not set";

/** Slack's cap on a `header` block's text. */
const HEADER_CHARS = 150;

const DEFAULT_REPO = "BilLogic/plus-uno";

/** One operation as the pop-up reads it. */
interface ReadOperation {
  /** What it does and where, one line. */
  headline: string;
  /** A change to what a page already says, so a keyed value reads as Current
   *  content, Issue and New content. Anything else writes something new, and
   *  a keyed value is only where its field is drawn in place. */
  changes?: boolean;
  /** Label → value, in the order a person checks them, and the value's path
   *  in the tool input where it has one. */
  properties: Array<[string, string, string?]>;
  /** The prose it writes, in order; a heading opens a section. */
  body: Part[];
}

/** One stretch of prose. `key` is its path in the tool input; `replaces`
 *  marks text that overwrites a block a person wrote; `markdown` marks text a
 *  renderer downstream reads as Markdown, drawn through `reviewSections`. */
type Part = { heading?: string; text: string; key?: string; replaces?: boolean; markdown?: boolean };

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

/** Section bodies, read by name, in the array's order — never by key order. */
function sectionsOf(value: unknown): Array<{ heading?: string; text: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => ({ heading: str(obj(s).heading), text: str(obj(s).body) }))
    .filter((s) => s.heading || s.text)
    .map((s) => (s.heading ? s : { text: s.text }));
}

function notionCreate(input: Input): ReadOperation {
  const surface = str(input.surface).toLowerCase();
  const props = obj(input.properties);
  const prop = (...names: string[]) => {
    const want = new Set(names.map(squash));
    const key = Object.keys(props).find((k) => want.has(squash(k)));
    return key ? str(props[key]) : "";
  };
  const shown = new Set<string>();
  const properties: ReadOperation["properties"] = [["Title", str(input.title), "title"]];
  if (surface === "prd" || surface === "intake") {
    const pillar = prop("product_pillar") || str(input.product_pillar);
    if (pillar) properties.push(["Product Pillar", pillar]);
    // What the write sets, not what the model drafted: a drafted Design
    // Status is not a property the create writes.
    properties.push(["Design Status", createdDesignStatus(surface) ?? DESIGN_STATUS_NOT_SET]);
    ["productpillar", "designstatus"].forEach((k) => shown.add(k));
  }
  if (surface === "decision") {
    const status = prop("status") || str(input.status);
    if (status) properties.push(["Status", status]);
    const card = prop("roadmap_card") || str(input.roadmap_card);
    if (card) properties.push(["Roadmap Card", card]);
    ["status", "roadmapcard"].forEach((k) => shown.add(k));
  }
  for (const [key, value] of Object.entries(props)) {
    // A list (a Marketplace row's contributors) reads as one line.
    const shownValue = Array.isArray(value) ? value.map(str).filter(Boolean).join(", ") : str(value);
    if (shown.has(squash(key)) || !shownValue) continue;
    properties.push([labelOf(key), shownValue]);
  }
  const summary = str(input.summary);
  if (summary) properties.push(["Summary", summary, "summary"]);
  const source = str(input.source_url);
  if (source) properties.push(["Source", source]);

  const body = sectionsOf(input.sections);
  const criteria = Array.isArray(input.acceptance_criteria) ? input.acceptance_criteria.map(str).filter(Boolean) : [];
  if (criteria.length) body.push({ heading: "Acceptance criteria", text: criteria.map((c) => `- ${c}`).join("\n") });

  const headline =
    surface === "prd"
      ? "New PRD card on the Roadmap"
      : surface === "intake"
        ? "New intake card on the Roadmap"
        : surface === "decision"
          ? "New decision in the Decisions database"
          : surface === "marketplace"
            ? "Prototype Marketplace row (updated if it already exists)"
            : "New Notion page";
  return { headline, properties, body };
}

function notionUpdate(input: Input): ReadOperation {
  const page = str(input.page_url);
  const properties: ReadOperation["properties"] = page ? [["Page", page]] : [];
  for (const [key, value] of Object.entries(obj(input.properties))) {
    if (str(value)) properties.push([labelOf(key), str(value), `properties.${key}`]);
  }
  const body: ReadOperation["body"] = [];
  const replace = Array.isArray(input.replace) ? input.replace : [];
  replace.forEach((entry, i) => {
    const text = str(obj(entry).content);
    const heading = replace.length > 1 ? `Rewritten block ${i + 1}` : "Rewritten block";
    if (text) body.push({ heading, text, key: `replace.${i}.content`, replaces: true });
  });
  const inserts = Array.isArray(input.insert) ? input.insert : [];
  for (const entry of inserts) {
    const text = str(obj(entry).content);
    if (text) body.push({ heading: "Added after a block", text });
  }
  const append = obj(input.append);
  // By index, so each section keeps the path its field is keyed on.
  (Array.isArray(append.sections) ? append.sections : []).forEach((s, i) => {
    const heading = str(obj(s).heading);
    const text = str(obj(s).body);
    if (heading || text) body.push({ ...(heading ? { heading } : {}), text, key: `append.sections.${i}.body` });
  });
  const note = str(append.text);
  if (note) body.push({ heading: "Added to the end of the page", text: note, key: "append.text" });
  return { headline: "Changes to a Notion page", changes: true, properties, body };
}

function githubIssue(input: Input): ReadOperation {
  const repo = str(input.repo) || DEFAULT_REPO;
  return {
    headline: `New GitHub issue on ${repo}`,
    properties: [
      ["Title", str(input.title), "title"],
      ["Repository", repo],
    ],
    // Markdown GitHub renders itself, so the pop-up tidies it the same way.
    body: str(input.body) ? [{ text: str(input.body), key: "body", markdown: true }] : [],
  };
}

function dmRelay(input: Input): ReadOperation {
  const id = relayRecipientId(input.recipient);
  return {
    headline: "Direct message",
    // A mention, so Slack shows the person's name; never a raw id.
    properties: [["To", id ? `<@${id}>` : str(input.recipient)]],
    body: str(input.text) ? [{ text: str(input.text), key: "text" }] : [],
  };
}

const READERS: Record<string, (input: Input) => ReadOperation> = {
  notion_create: notionCreate,
  notion_update: notionUpdate,
  github_issue_create: githubIssue,
  dm_relay: dmRelay,
};

/** Whether every operation of the batch has a reading here. */
export function isReadable(operations: readonly ProposalOperation[]): boolean {
  return operations.length > 0 && operations.every((op) => !!READERS[op.toolName]);
}

/** What the draft is drawn with beyond the batch itself. */
export interface DraftDetail {
  /** Each value as the page read when the card was staged, by `<op>.<path>`. */
  before?: Readonly<Record<string, string>>;
  /** The fields drawn as inputs in place, by key, each holding its value now. */
  inline?: ReadonlyMap<string, EditableField>;
  /** The reader may decide: a value too long for an input says why it is not
   *  one. */
  editing?: boolean;
  /** Why the change is proposed, mrkdwn; shown once, at the first change. */
  issue?: string;
}

/** What one change is drawn with: the draft's detail, and whether the Issue
 *  goes here. */
type ChangeDetail = DraftDetail & { issueHere?: boolean };

/** Said where a replaced block's text was not read when the card was staged. */
export const BEFORE_NOT_CAPTURED = "This block's current text wasn't captured when the change was staged.";

/** A property's current value, where it was not read when the card was staged. */
const VALUE_NOT_CAPTURED = "_wasn't captured when the change was staged_";

/** The three parts' labels. */
const CURRENT = "Current content";
const ISSUE = "Issue";
const NEW = "New content";

/** Slack's cap on a section's text. */
const SECTION_CHARS = 3000;

/** Said where a value is too long to be an input. */
export const TOO_LONG_TO_EDIT =
  "This text is over the 3,000 characters a pop-up field holds, so it can't be edited here. Choose Needs changes to ask for a different wording.";

/**
 * The draft as a person reads it, or null when any operation is a tool this
 * file has no reading for.
 *
 * @param operations - The batch as it would run, saved edits applied
 * @param caveats - The card's ⚠️ lines, kept last
 * @param detail - Before values, and the fields drawn as inputs in place
 */
export function readableDraft(
  operations: readonly ProposalOperation[],
  caveats: readonly string[] = [],
  detail: DraftDetail = {},
): unknown[] | null {
  const parts = operationParts(operations, detail);
  if (!parts) return null;
  const blocks: unknown[] = [];
  const many = parts.length > 1;
  parts.forEach((op, i) => {
    if (many) {
      if (i) blocks.push({ type: "divider" });
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${i + 1}. ${escapeSlackText(op.headline)}*` } });
    }
    blocks.push(...op.blocks);
  });
  if (caveats.length) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: caveats.join("\n") }] });
  return blocks;
}

/**
 * Each operation of the batch read on its own: its headline, and its
 * properties and body as blocks, keyed by its place in the batch so a field in
 * place finds its input. Null when any operation is a tool this file has no
 * reading for. What `readableDraft` numbers, and what a batch in the shared
 * anatomy (`review-batch.ts`) labels.
 *
 * @param operations - The batch as it would run, saved edits applied
 * @param detail - Before values, and the fields drawn as inputs in place
 */
export function operationParts(
  operations: readonly ProposalOperation[],
  detail: DraftDetail = {},
): Array<{ headline: string; blocks: unknown[] }> | null {
  const read = operations.map((op) => READERS[op.toolName]?.(op.input) ?? null);
  if (!read.length || read.some((r) => !r)) return null;
  const issueAt = detail.issue ? firstChange(read as ReadOperation[]) : undefined;
  return read.map((op, i) => {
    const blocks: unknown[] = [];
    const keyOf = (path?: string) => (path ? `${i}.${path}` : undefined);
    const at = (key?: string) => ({ ...detail, issueHere: key !== undefined && key === issueAt });
    const properties = op!.properties.map(([label, value, path]): [string, string, string?] => [label, value, keyOf(path)]);
    blocks.push(...(op!.changes ? propertyBlocks(properties, detail, issueAt) : newPropertyBlocks(properties, detail)));
    for (const part of op!.body) blocks.push(...partBlocks({ ...part, key: keyOf(part.key) }, at(keyOf(part.key))));
    return { headline: op!.headline, blocks };
  });
}

/** The headline the pop-up opens with: the one operation's, or the batch's size. */
export function draftHeadline(operations: readonly ProposalOperation[]): string | null {
  if (operations.length > 1) return `${operations.length} operations, run in order`;
  const op = operations[0];
  const reader = op ? READERS[op.toolName] : undefined;
  return reader ? reader(op!.input).headline : null;
}

/**
 * The key the Issue is shown at: the batch's first changed block, or where no
 * block changes, its first changed property. One reason per card, said once.
 */
function firstChange(read: readonly ReadOperation[]): string | undefined {
  const keyed = (i: number, path?: string) => (path ? `${i}.${path}` : undefined);
  for (const [i, op] of read.entries()) {
    const part = op.body.find((p) => p.key && p.replaces);
    if (part) return keyed(i, part.key);
  }
  for (const [i, op] of read.entries()) {
    const prop = op.changes ? op.properties.find(([, , path]) => path) : undefined;
    if (prop) return keyed(i, prop[2]);
  }
  return undefined;
}

/** One stretch of prose: its heading, then, where it changes what the page
 *  already says, Current content, Issue and New content, the new content an
 *  input when its field is in place. */
function partBlocks(part: Part, detail: ChangeDetail): unknown[] {
  const blocks: unknown[] = [];
  if (part.heading) blocks.push(header(part.heading));
  const was = part.key ? detail.before?.[part.key] : undefined;
  const field = part.key ? detail.inline?.get(part.key) : undefined;
  const change = was !== undefined || !!part.replaces;
  if (change) {
    blocks.push(bold(CURRENT));
    if (was === undefined) blocks.push(context(BEFORE_NOT_CAPTURED));
    else blocks.push(...(was.trim() ? textSections(was) : [context("Empty.")]));
    if (detail.issueHere && detail.issue) blocks.push(bold(ISSUE), section(detail.issue));
  }
  // Under its heading the input needs no name of its own beyond what it is.
  if (field) return [...blocks, inputOf(field, change ? NEW : part.heading ? "Text" : field.label)];
  if (change) blocks.push(bold(NEW));
  if (part.text) blocks.push(...(part.markdown ? reviewSections : textSections)(part.text));
  if (detail.editing && part.key && part.text.length > MAX_INPUT_CHARS) blocks.push(context(TOO_LONG_TO_EDIT));
  return blocks;
}

/** A field drawn in place, required as its field is: the change's own text,
 *  so Slack holds it to a value and draws no "(optional)" beside it. */
function inputOf(field: EditableField, label: string): unknown {
  return fieldInputBlocks([{ ...field, label }])[0];
}

function section(text: string): unknown {
  const clipped = text.length > SECTION_CHARS ? `${text.slice(0, SECTION_CHARS - 1)}…` : text;
  return { type: "section", text: { type: "mrkdwn", text: clipped } };
}

function bold(text: string): unknown {
  return { type: "section", text: { type: "mrkdwn", text: `*${text}*` } };
}

function context(text: string): unknown {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

/** The key properties as `*Label:* value` lines. Short values share one
 *  section; a value with a line break gets its own, so it reads as prose. A
 *  value a change replaces — one with a path — reads in three parts under its
 *  label, Current content, Issue and New content, saying so where its current
 *  value was not captured; a field in place is the New content input. */
function propertyBlocks(
  properties: ReadonlyArray<[string, string, string?]>,
  detail: DraftDetail = {},
  issueAt?: string,
): unknown[] {
  const blocks: unknown[] = [];
  let lines: string[] = [];
  const flush = () => {
    if (lines.length) blocks.push({ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } });
    lines = [];
  };
  for (const [label, value, key] of properties) {
    if (key === undefined) {
      if (value.includes("\n")) {
        flush();
        blocks.push(...textSections(`**${label}:** ${value}`));
      } else lines.push(`*${label}:* ${valueText(value)}`);
      continue;
    }
    const was = detail.before?.[key];
    const field = detail.inline?.get(key);
    flush();
    lines.push(`*${label}*`, `*${CURRENT}:* ${was === undefined ? VALUE_NOT_CAPTURED : was ? valueText(was) : "_empty_"}`);
    if (key === issueAt && detail.issue) lines.push(`*${ISSUE}:* ${detail.issue}`);
    if (field) {
      flush();
      blocks.push(inputOf(field, NEW));
      continue;
    }
    if (value.includes("\n")) {
      flush();
      blocks.push(...textSections(`**${NEW}:** ${value}`));
      continue;
    }
    lines.push(`*${NEW}:* ${valueText(value)}`);
    flush();
  }
  flush();
  return blocks;
}

/** The key properties of a write that makes something new: `*Label:* value`
 *  lines as `propertyBlocks` draws an unkeyed one, and a field in place an
 *  input under its own label. */
function newPropertyBlocks(properties: ReadonlyArray<[string, string, string?]>, detail: DraftDetail): unknown[] {
  const blocks: unknown[] = [];
  let run: Array<[string, string]> = [];
  for (const [label, value, key] of properties) {
    const field = key === undefined ? undefined : detail.inline?.get(key);
    if (!field) {
      run.push([label, value]);
      continue;
    }
    blocks.push(...propertyBlocks(run), inputOf(field, label));
    run = [];
  }
  return [...blocks, ...propertyBlocks(run)];
}

/** A property's value as mrkdwn: a mention or a link kept live, anything else
 *  escaped so it shows exactly as written. */
function valueText(value: string): string {
  if (/^<@[A-Z0-9]+>$/.test(value)) return value;
  if (/^https?:\/\/[^\s|<>]+$/.test(value)) return `<${value}>`;
  return escapeSlackText(value);
}

function header(text: string): unknown {
  const clipped = text.length > HEADER_CHARS ? `${text.slice(0, HEADER_CHARS - 1)}…` : text;
  return { type: "header", text: { type: "plain_text", text: clipped } };
}

/**
 * The card's caveats, read off its text: each `:warning:` line other than the
 * `About to` heading, with the line that continues a bundle caveat, and a
 * private repo's visibility line. What the pop-up keeps at the end of the
 * draft.
 */
export function caveatsOf(cardText: string): string[] {
  const out: string[] = [];
  const lines = cardText.split("\n");
  lines.forEach((line, i) => {
    if (/^:warning: About to /.test(line)) return;
    if (line.startsWith(":warning:") || /^\*[^*]+\* is private — /.test(line)) {
      out.push(line);
      const next = lines[i + 1] ?? "";
      if (next.startsWith("Approving posts it")) out.push(next);
    }
  });
  return out;
}

// ── Drafts in the shared anatomy (`review-anatomy.ts`) ──────────────────────

/** What a reading in the shared anatomy is drawn with: the card's text, for
 *  the place it names and its caveats, and the draft's detail. */
type AnatomyContext = DraftDetail & { cardText: string };

/** Readings in the shared anatomy, by tool. A tool with none is drawn by its
 *  `READERS` reading, or from the card's text. */
const ANATOMY_READERS: Record<string, (input: Input, context: AnatomyContext) => DraftAnatomy> = {
  shareout_post: shareoutAnatomy,
};

/**
 * The draft read into the shared anatomy's zones, or null when the batch is
 * not one operation of a tool that has a reading in it.
 *
 * @param operations - The batch as it would run, saved edits applied
 * @param cardText - The card's text, without its footer
 * @param detail - The fields drawn as inputs in place, and whether the reader
 *   may decide
 */
export function anatomyOf(operations: readonly ProposalOperation[], cardText: string, detail: DraftDetail = {}): DraftAnatomy | null {
  const op = operations.length === 1 ? operations[0] : undefined;
  const reader = op ? ANATOMY_READERS[op.toolName] : undefined;
  return reader ? reader(op!.input, { ...detail, cardText }) : null;
}

/** Where a share-out's card says it posts: its heading's place, which the
 *  executor's own decision named when the card was staged. */
const SHAREOUT_HEADING = /^:warning: About to \*share this for feedback in (.+)\*:$/m;

/** The place a share-out posts, as one where-line element: a channel by id
 *  where the card names one, its words otherwise ("this thread"). */
function shareoutPlaceElement(input: Input, cardText: string): WhereElement {
  const where = SHAREOUT_HEADING.exec(cardText)?.[1]?.trim();
  const linked = where ? /^<#([CG][A-Z0-9]+)(?:\|[^>]*)?>$/.exec(where) : null;
  if (linked) return { type: "channel", channel_id: linked[1]! };
  if (where) return { type: "text", text: where };
  // A card staged without the heading: what its input asked for.
  const ref = str(input.place) === "channel" ? shareoutChannelRef(input.channel) : null;
  if (ref && "id" in ref) return { type: "channel", channel_id: ref.id };
  return { type: "text", text: str(input.place) === "here" ? "this conversation" : "#plus-design-feedback" };
}

/** "Posts in #channel and pings @A, @B and @C." — each person a user element
 *  where the input holds their id, their name as written where it does not. */
function shareoutWhere(input: Input, cardText: string): WhereElement[] {
  const reviewers = (Array.isArray(input.reviewers) ? input.reviewers : []).map(str).filter(Boolean);
  const out: WhereElement[] = [{ type: "text", text: "Posts in " }, shareoutPlaceElement(input, cardText)];
  reviewers.forEach((r, i) => {
    const join = i === 0 ? " and pings " : i === reviewers.length - 1 ? " and " : ", ";
    out.push({ type: "text", text: join }, SLACK_USER_ID.test(r) ? { type: "user", user_id: r } : { type: "text", text: r });
  });
  out.push({ type: "text", text: "." });
  return out;
}

/** A where-line place as mrkdwn: a channel as its link, words escaped. */
function placeMrkdwn(place: WhereElement): string {
  return place.type === "channel" ? `<#${place.channel_id}>` : place.type === "text" ? escapeSlackText(place.text) : "";
}

const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The card's subtitle: the artifact (when the project is the title), the
 *  round as "Round 1", and the fidelity in words. */
function shareoutSubtitle(input: Input, titled: boolean): string {
  const round = typeof input.round === "number" ? input.round : Number(str(input.round)) || undefined;
  const fidelity = str(input.fidelity);
  return [titled ? capital(str(input.artifact)) : "", round ? `Round ${round}` : "", fidelity ? `${capital(fidelity)} fidelity` : ""]
    .filter(Boolean)
    .join(" · ");
}

/** The Open button's words: the artifact's last word ("Open prototype"), or
 *  "Open link". */
function openWords(artifact: string): string {
  const noun = artifact.split(/\s+/).at(-1) ?? "";
  return noun && noun.length <= 20 ? `Open ${noun}` : "Open link";
}

/** Said under a share-out's inputs: what is locked, and how to change it. */
export const SHAREOUT_LOCKED =
  "Where it posts, who it pings, the fidelity and the round are fixed on this card. To change them, choose Needs changes.";

/**
 * A share-out in the anatomy: "Share for feedback", where it posts and who it
 * pings, the bundle caveat as an alert, the project as a card, then its words.
 * For a confirmer the words are the prefilled inputs `review-fields.ts`
 * offers (what this is, each question, not looking for, the deadline), with a
 * line saying the rest is locked; for anyone else they are shown, read-only.
 */
function shareoutAnatomy(input: Input, detail: AnatomyContext): DraftAnatomy {
  const project = str(input.project);
  const artifact = str(input.artifact);
  const link = str(input.link);
  const subtitle = shareoutSubtitle(input, Boolean(project));
  const field = (path: string) => detail.inline?.get(`0.${path}`);
  const editing = detail.editing === true;
  // Read-only, a summary short enough is the card's body (§ 2); otherwise it
  // is its own block, or its input.
  const summary = str(input.summary);
  const summaryInCard = !field("summary") && summary.length > 0 && summary.length <= CARD_BODY_CHARS;

  const content: unknown[] = [];
  /** One of the share-out's words: its input in place, or the text shown. */
  const part = (path: string, label: string, value: string) => {
    const inline = field(path);
    if (inline) content.push(...fieldInputBlocks([inline]));
    else if (value) {
      content.push(labelledText(label, value));
      if (editing && value.length > MAX_INPUT_CHARS) content.push(context(TOO_LONG_TO_EDIT));
    }
  };

  if (!summaryInCard) part("summary", "What this is", summary);
  const changed = str(input.what_changed);
  if (changed) content.push(quoteBlock("What changed since last round", changed));
  const questions = (Array.isArray(input.feedback_wanted) ? input.feedback_wanted : []).map(str).slice(0, MAX_FEEDBACK_QUESTIONS);
  const shown: string[] = [];
  questions.forEach((q, i) => {
    const inline = field(`feedback_wanted.${i}`);
    if (inline) content.push(...fieldInputBlocks([inline]));
    else if (q) shown.push(q);
  });
  if (shown.length) content.push(listBlock("Feedback wanted", shown));
  part("not_looking_for", "Not looking for", str(input.not_looking_for));
  part("deadline", "Deadline", str(input.deadline));
  if (editing) content.push(context(SHAREOUT_LOCKED));

  return {
    header: "Share for feedback",
    where: shareoutWhere(input, detail.cardText),
    alerts: alertsFromCaveats(caveatsOf(detail.cardText)),
    object: {
      title: project || capital(artifact) || "Share-out",
      ...(subtitle ? { subtitle } : {}),
      ...(summaryInCard ? { body: summary } : {}),
      ...(/^https?:\/\//.test(link) ? { open: { url: link, text: openWords(artifact) } } : {}),
    },
    content,
    approve: shareoutApprove(input),
    destination: `post in ${placeMrkdwn(shareoutPlaceElement(input, detail.cardText))}`,
  };
}
