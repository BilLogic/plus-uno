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
// PURE: blocks out, nothing posted, nothing read.
import { textSections } from "./render";
import { escapeSlackText } from "./mrkdwn";
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
  /** Label → value, in the order a person checks them. */
  properties: Array<[string, string]>;
  /** The prose it writes, in order; a heading opens a section. */
  body: Array<{ heading?: string; text: string }>;
}

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
  const properties: Array<[string, string]> = page ? [["Page", page]] : [];
  for (const [key, value] of Object.entries(obj(input.properties))) {
    if (str(value)) properties.push([labelOf(key), str(value)]);
  }
  const body: ReadOperation["body"] = [];
  const replace = Array.isArray(input.replace) ? input.replace : [];
  replace.forEach((entry, i) => {
    const text = str(obj(entry).content);
    if (text) body.push({ heading: replace.length > 1 ? `Rewritten block ${i + 1}` : "Rewritten block", text });
  });
  const inserts = Array.isArray(input.insert) ? input.insert : [];
  for (const entry of inserts) {
    const text = str(obj(entry).content);
    if (text) body.push({ heading: "Added after a block", text });
  }
  const append = obj(input.append);
  body.push(...sectionsOf(append.sections));
  const note = str(append.text);
  if (note) body.push({ heading: "Added to the end of the page", text: note });
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

/**
 * The draft as a person reads it, or null when any operation is a tool this
 * file has no reading for.
 *
 * @param operations - The batch as it would run, saved edits applied
 * @param caveats - The card's ⚠️ lines, kept last
 */
export function readableDraft(operations: readonly ProposalOperation[], caveats: readonly string[] = []): unknown[] | null {
  const read = operations.map((op) => READERS[op.toolName]?.(op.input) ?? null);
  if (!read.length || read.some((r) => !r)) return null;
  const blocks: unknown[] = [];
  const many = read.length > 1;
  read.forEach((op, i) => {
    if (many) {
      if (i) blocks.push({ type: "divider" });
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${i + 1}. ${escapeSlackText(op!.headline)}*` } });
    }
    blocks.push(...propertyBlocks(op!.properties));
    for (const part of op!.body) {
      if (part.heading) blocks.push(header(part.heading));
      if (part.text) blocks.push(...textSections(part.text));
    }
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

/** The key properties as `*Label:* value` lines. Short values share one
 *  section; a value with a line break gets its own, so it reads as prose. */
function propertyBlocks(properties: ReadonlyArray<[string, string]>): unknown[] {
  const blocks: unknown[] = [];
  let lines: string[] = [];
  const flush = () => {
    if (lines.length) blocks.push({ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } });
    lines = [];
  };
  for (const [label, value] of properties) {
    const line = `*${label}:* ${valueText(value)}`;
    if (value.includes("\n")) {
      flush();
      blocks.push(...textSections(`**${label}:** ${value}`));
      continue;
    }
    lines.push(line);
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
