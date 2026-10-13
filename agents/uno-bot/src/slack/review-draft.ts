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
import { reviewSections } from "./render";
import { escapeSlackText } from "./mrkdwn";
import { fieldInputBlocks, MAX_INPUT_CHARS, type EditableField } from "./review-fields";
import { relayRecipientId } from "../tools/relayed-dm-render";
import { createdDesignStatus } from "../integrations/notion";
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
  /** Label → value, in the order a person checks them, and the value's path
   *  in the tool input where it has one. */
  properties: Array<[string, string, string?]>;
  /** The prose it writes, in order; a heading opens a section. */
  body: Part[];
}

/** One stretch of prose. `key` is its path in the tool input; `replaces`
 *  marks text that overwrites a block a person wrote. */
type Part = { heading?: string; text: string; key?: string; replaces?: boolean };

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
  const properties: Array<[string, string]> = [["Title", str(input.title)]];
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
    if (shown.has(squash(key)) || !str(value)) continue;
    properties.push([labelOf(key), str(value)]);
  }
  const summary = str(input.summary);
  if (summary) properties.push(["Summary", summary]);
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
  return { headline: "Changes to a Notion page", properties, body };
}

function githubIssue(input: Input): ReadOperation {
  const repo = str(input.repo) || DEFAULT_REPO;
  return {
    headline: `New GitHub issue on ${repo}`,
    properties: [
      ["Title", str(input.title)],
      ["Repository", repo],
    ],
    body: str(input.body) ? [{ text: str(input.body) }] : [],
  };
}

function email(input: Input): ReadOperation {
  const list = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean).join(", ") : str(v));
  const properties: Array<[string, string]> = [["To", list(input.to)]];
  if (list(input.cc)) properties.push(["Cc", list(input.cc)]);
  properties.push(["Subject", str(input.subject)]);
  return { headline: "Email", properties, body: str(input.body) ? [{ text: str(input.body) }] : [] };
}

function dmRelay(input: Input): ReadOperation {
  const id = relayRecipientId(input.recipient);
  return {
    headline: "Direct message",
    // A mention, so Slack shows the person's name; never a raw id.
    properties: [["To", id ? `<@${id}>` : str(input.recipient)]],
    body: str(input.text) ? [{ text: str(input.text) }] : [],
  };
}

const READERS: Record<string, (input: Input) => ReadOperation> = {
  notion_create: notionCreate,
  notion_update: notionUpdate,
  github_issue_create: githubIssue,
  email_send: email,
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
  const read = operations.map((op) => READERS[op.toolName]?.(op.input) ?? null);
  if (!read.length || read.some((r) => !r)) return null;
  const issueAt = detail.issue ? firstChange(read as ReadOperation[]) : undefined;
  const blocks: unknown[] = [];
  const many = read.length > 1;
  read.forEach((op, i) => {
    if (many) {
      if (i) blocks.push({ type: "divider" });
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${i + 1}. ${escapeSlackText(op!.headline)}*` } });
    }
    const keyOf = (path?: string) => (path ? `${i}.${path}` : undefined);
    const at = (key?: string) => ({ ...detail, issueHere: key !== undefined && key === issueAt });
    blocks.push(...propertyBlocks(op!.properties.map(([label, value, path]) => [label, value, keyOf(path)]), detail, issueAt));
    for (const part of op!.body) blocks.push(...partBlocks({ ...part, key: keyOf(part.key) }, at(keyOf(part.key))));
  });
  if (caveats.length) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: caveats.join("\n") }] });
  return blocks;
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
    const prop = op.properties.find(([, , path]) => path);
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
    else blocks.push(...(was.trim() ? reviewSections(was) : [context("Empty.")]));
    if (detail.issueHere && detail.issue) blocks.push(bold(ISSUE), section(detail.issue));
  }
  // Under its heading the input needs no name of its own beyond what it is.
  if (field) return [...blocks, inputOf(field, change ? NEW : part.heading ? "Text" : field.label)];
  if (change) blocks.push(bold(NEW));
  if (part.text) blocks.push(...reviewSections(part.text));
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
        blocks.push(...reviewSections(`**${label}:** ${value}`));
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
      blocks.push(...reviewSections(`**${NEW}:** ${value}`));
      continue;
    }
    lines.push(`*${NEW}:* ${valueText(value)}`);
    flush();
  }
  flush();
  return blocks;
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
