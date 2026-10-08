// Markdown → Slack mrkdwn coercion, for the paths that need mrkdwn.
//
// Since 2026-08-22 the model writes STANDARD MARKDOWN (`AGENT.md`,
// `docs/connectors/slack.md`) — the dialect it writes best, and the dialect
// Slack's own `markdown_text` field takes, which is how a streamed reply
// ships. Two paths still need mrkdwn, and both run through here:
//
//   • the blocks fallback (`section` blocks are mrkdwn-only) — delivery.ts
//   • `chat.postMessage`'s `text` field — api.ts postMessage
//
// Before that date the arrangement was inverted: the prompt mandated mrkdwn,
// this file existed to catch the model "slipping" into Markdown, and the
// streaming path — every real reply — sent that mrkdwn into a Markdown parser,
// where `*bold*` is italic and `<url|label>` is nothing. The model was being
// asked for the one dialect that rendered worst.
//
// Safe on already-correct mrkdwn (idempotent): Worker-authored messages use
// `*bold*`, `•` bullets, and `<url|label>` links, none of which these rules
// touch. Fenced code blocks are protected so JSON proposal cards / code are
// never mangled.

/**
 * Words that must reach a reader exactly as written, where even VALID markup
 * would be wrong — above all a title inside a `<url|label>`, where a `>` ends
 * the link. Slack decodes the three entities for display.
 *
 * Everything posted as text also passes `sanitizeSlackMarkup`, which leaves
 * these entities alone, so the two never double-escape.
 */
export function escapeSlackText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A name as Markdown link text: one line, no brackets to break the link. */
export function linkLabel(text: string): string {
  return text.replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Keep the `<…>` markup Slack can parse, and entity-escape every other `<`,
 * `>` and bare `&`.
 *
 * Slack treats `&`, `<` and `>` in message text as control characters
 * (docs.slack.dev, "Formatting message text" § Escaping text), and markup it
 * cannot parse does not degrade — it blanks the WHOLE text. Reproduced live
 * 2026-09-22: a relayed DM whose body quoted `<@U...>` and `<@teammate>` in a
 * code fence posted with empty text, attribution line and all, while the same
 * relay without those tokens posted in full. The 2026-09-21 GitHub failure
 * note that went out blank carried the same two tokens.
 *
 * Runs over the whole text, fences included: a code block is no shelter, the
 * repro's tokens were inside one. Idempotent: `&amp;`, `&lt;` and `&gt;` are
 * already entities and pass unchanged.
 */
export function sanitizeSlackMarkup(text: string): string {
  return text.replace(
    /(?<=^|\n)>+|<([^<>\n]*)>|[<>]|&/g,
    (match, inner: string | undefined, offset: number) => {
      // A `>` run opening a line is mrkdwn's quote marker (`>` or `>>>`).
      if (match[0] === ">" && (offset === 0 || text[offset - 1] === "\n")) return match;
      if (inner !== undefined) return keepOrEscapeToken(match, inner);
      if (match === "&") return ENTITY.test(text.slice(offset)) ? "&" : "&amp;";
      return match === "<" ? "&lt;" : "&gt;";
    },
  );
}

/**
 * The same pass over Block Kit: every `mrkdwn` text object, at any depth.
 *
 * Blocks are what a reader sees whenever a message has them — an answer's
 * sections, a proposal card — so a pass over `text` alone would guard the
 * notification copy and leave the message itself exposed. `plain_text` objects
 * are left alone: Slack parses no markup there, and so is a `markdown` block
 * (see below). Returns a copy.
 *
 * A `markdown` block carries the answer's Markdown AS WRITTEN, and Slack turns
 * it into rich text itself, so no pass belongs there. Live 2026-10-07: an
 * escaped `&lt;Button&gt;` showed as those entities, in a fence and out; a
 * raw `<Button>`, `<Card>`, bare `&` and `<` showed as written; a real `<@U…>`
 * and `<url|label>` rendered as a mention and a link; and the tokens that blank
 * an mrkdwn message — `<@teammate>`, `<#general>`, `<!foo>`, in a fence and
 * out — came back as plain text in the rich text, the message intact.
 */
export function sanitizeSlackBlocks<T>(blocks: T): T {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) out[key] = walk(value);
    if (out.type === "mrkdwn" && typeof out.text === "string") out.text = sanitizeSlackMarkup(out.text);
    return out;
  };
  return walk(blocks) as T;
}

/** One `<…>` token: the valid markup it holds, normalised,
 *  or the whole token entity-escaped when Slack could not parse it.
 *
 * @param token - The token, brackets included
 * @param inner - What sits between the brackets
 */
function keepOrEscapeToken(token: string, inner: string): string {
  const safe = validMarkup(inner);
  return safe === null ? escapeBare(token) : `<${safe}>`;
}

/**
 * Text for a field Slack shows as PLAIN TEXT — a checklist's heading, a task
 * card's title, `details` and `output`, a source's name — written as the words
 * a reader would have seen in a message.
 *
 * Plain text is not parsed: Slack shows `<@U…>` and `&amp;` exactly as sent,
 * so `sanitizeSlackMarkup` — which keeps valid markup and escapes the rest —
 * is the wrong pass there (live 2026-10-07: a heading read `*Sent using*
 * <@U0ASFR2RJ9W>`, a source `Employment &amp; Access`). Instead:
 *
 *   • `<@U…|name>` → `@name`, a bare `<@U…>` → `@someone`; `<#C…|name>` →
 *     `#name`, a bare `<#C…>` → `#channel`; `<!here>` → `@here`;
 *     `<url|label>` → `label`, a bare `<url>` → the url; anything else in
 *     angle brackets → what is inside them;
 *   • the `*`, `_`, `~` and backtick emphasis markers go — a marker between
 *     two word characters (`slack_search`) is part of the word and stays;
 *   • `&amp;`, `&lt;` and `&gt;` decode to their characters, in one pass, so
 *     `&amp;lt;` reads `&lt;` rather than `<`.
 *
 * WHY THIS IS SAFE where the escaper was needed: markup Slack cannot parse
 * blanks a whole message (docs/connectors/slack.md § Streamed text, and
 * `sanitizeSlackMarkup` above), and this pass removes every `<…>` before
 * anything is sent — the angle markup becomes words, and the only `<` or `>`
 * left is one an entity decoded to, into a field Slack does not parse.
 *
 * Not idempotent — a decoded `&amp;amp;` decodes again — so it runs once, on
 * text as it arrives, never on a card already passed. Cut AFTER it: the limit
 * is on what is shown.
 */
export function toPlainText(text: string): string {
  return text
    .replace(/<([^<>\n]*)>/g, (_match, inner: string) => plainMarkup(inner))
    .replace(/[*_~`]+/g, (run: string, offset: number, all: string) =>
      /\w/.test(all[offset - 1] ?? "") && /\w/.test(all[offset + run.length] ?? "") ? run : "",
    )
    .replace(/&(amp|lt|gt);/g, (_match, name: string) => (name === "amp" ? "&" : name === "lt" ? "<" : ">"));
}

/** One `<…>` as the words it shows. */
function plainMarkup(inner: string): string {
  const bar = inner.indexOf("|");
  const target = bar < 0 ? inner : inner.slice(0, bar);
  const label = bar < 0 ? "" : inner.slice(bar + 1).trim();
  if (target.startsWith("@")) return `@${label.replace(/^@/, "") || "someone"}`;
  if (target.startsWith("#")) return `#${label.replace(/^#/, "") || "channel"}`;
  if (target.startsWith("!")) {
    if (label) return label;
    const special = /^!(here|channel|everyone)$/.exec(target);
    return special ? `@${special[1]}` : "";
  }
  if (label) return label;
  return target.replace(/^mailto:/, "");
}

/**
 * Where a stream's markup pass stands between two appends: the tail it has not
 * sent yet, and whether the text sent so far ends a line.
 */
export interface StreamMarkupState {
  /** Raw text held back because the next chunk could still change its reading. */
  held: string;
  /** True when the text sent so far is empty or ends with a newline. */
  lineStart: boolean;
}

export const STREAM_MARKUP_START: StreamMarkupState = { held: "", lineStart: true };

/**
 * `sanitizeSlackMarkup` for a streamed message, one append at a time.
 *
 * A stream arrives in pieces, and markup does not respect the cut: `<@team`
 * in one append and `mate>` in the next are one token, and passing each
 * piece on its own would escape a valid `<@U…>` split the same way. So the
 * tail that the next piece could still complete is held back — an unclosed
 * `<…` on the last line, a partial entity (`&`, `&am`, `&lt`), a `>` run
 * opening the last line — and goes out with the next piece, or escaped on
 * `final`, which the stream's close passes.
 *
 * The pieces this returns, joined, equal `sanitizeSlackMarkup` of the joined
 * input, wherever the cuts fall.
 */
export function sanitizeStreamChunk(
  state: StreamMarkupState,
  chunk: string,
  final = false,
): { text: string; state: StreamMarkupState } {
  const input = state.held + chunk;
  const cut = final ? input.length : holdFrom(input);
  const emit = input.slice(0, cut);
  // `sanitizeSlackMarkup` reads a `>` at offset 0 as a quote marker. A lead
  // character tells it whether this piece really starts a line: a newline if
  // it does, a letter if it continues one. Neither is touched by the pass.
  const text = sanitizeSlackMarkup((state.lineStart ? "\n" : "x") + emit).slice(1);
  return {
    text,
    state: { held: input.slice(cut), lineStart: emit ? emit.endsWith("\n") : state.lineStart },
  };
}

/** Where the tail the next piece could still complete begins. */
function holdFrom(input: string): number {
  const lt = input.lastIndexOf("<");
  if (lt >= 0 && !/[>\n]/.test(input.slice(lt))) return lt;
  const amp = input.match(/&(?:a|am|amp|l|lt|g|gt)?$/);
  if (amp) return input.length - amp[0].length;
  const quote = input.match(/(?:^|\n)(>+)$/);
  if (quote) return input.length - quote[1]!.length;
  return input.length;
}

/**
 * A Slack user id: `U…` or `W…` and at least six more capitals and digits. The
 * one pattern for "is this a person Slack can mention" — `<@U...>` and
 * `<@teammate>` are exactly the tokens that blanked a message.
 */
export const SLACK_USER_ID = /^[UW][A-Z0-9]{6,}$/;

/** The only entities Slack decodes — and so the only ones a pass may keep. */
const ENTITY = /^&(?:amp|lt|gt);/;

/** `<`, `>` and bare `&` as entities, leaving existing entities alone. */
function escapeBare(text: string): string {
  return text
    .replace(/&(?!(?:amp|lt|gt);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The inside of a `<…>` Slack can parse, with its label made safe — or null. */
function validMarkup(inner: string): string | null {
  const bar = inner.indexOf("|");
  const target = bar < 0 ? inner : inner.slice(0, bar);
  const label = bar < 0 ? null : inner.slice(bar + 1);
  const ok =
    (target.startsWith("@") && SLACK_USER_ID.test(target.slice(1))) ||
    // Channels, private channels and DMs: the Worker links `<#D…>` itself.
    /^#[CGD][A-Z0-9]+$/.test(target) ||
    /^!(?:here|channel|everyone)$/.test(target) ||
    /^!subteam\^[A-Z0-9]+$/.test(target) ||
    /^!date\^\d+\^[^\s|]+(?:\^\S+)?$/.test(target) ||
    /^https?:\/\/[^\s|]+$/.test(target) ||
    /^mailto:[^\s|@]+@[^\s|]+$/.test(target);
  if (!ok) return null;
  return label === null ? target : `${target}|${escapeBare(label)}`;
}

/** Split on ```fenced``` blocks; transform only the non-fenced segments. */
export function toSlackMrkdwn(input: string): string {
  if (!input) return input;
  const parts = input.split(/(```[\s\S]*?```)/g);
  return parts
    .map((seg, i) => (i % 2 === 1 ? stripFenceLanguage(seg) : transformSegment(seg)))
    .join("");
}

// NOTE — tables and headings are NOT stripped before the Markdown path.
//
// Two exported helpers lived here earlier on 2026-08-22, `stripMarkdownTables`
// and `headingsToBold`, both called from `renderDeliveredBody` on every path.
// Both were built on a misread: a probe message was sent through Slack and the
// STORED TEXT read back, which showed the table gone and the heading reduced to
// a bare line. The rendered message showed neither — Slack keeps a table as a
// real table and a heading as heading styling; only the plain-text fallback
// drops them.
//
// So both were deleted rather than kept "just in case": each was actively
// destroying a construct Slack renders well. Tables still degrade to bullets on
// the mrkdwn paths via `convertTables` below, because a `section` block really
// cannot hold one — that is a fallback, not a policy.
//
// The lesson, since it cost two wrong findings in one afternoon: **the stored
// text of a Slack message is not what a reader sees.** Verify rendering by
// looking at it.

/**
 * ```` ```js ```` → ```` ``` ````. Slack's mrkdwn code blocks take no info
 * string, so a language tag renders as a literal first line inside the block.
 * Only the opening fence of a multi-line block is touched — an inline
 * ```` ```x``` ```` has no newline and is left alone.
 */
function stripFenceLanguage(fenced: string): string {
  return fenced.replace(/^```[ \t]*[A-Za-z0-9_+#-]*[ \t]*(?=\n)/, "```");
}

function transformSegment(seg: string): string {
  seg = convertTables(seg); // block-level, before line rewrites
  seg = seg
    .split("\n")
    .map(convertLine)
    .join("\n");
  // Inline: bold + markdown links. (Single `*x*` is left alone — Slack reads it
  // as bold, which is the sane default when the model meant emphasis.)
  return seg
    .replace(/\*\*([^\n*]+?)\*\*/g, "*$1*") // **bold** → *bold*
    .replace(/__([^\n_]+?)__/g, "*$1*") // __bold__ → *bold*
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, "<$2|$1>") // [label](url) → <url|label>
    // A link wrapped in a code span renders as raw text, not a link (live
    // 2026-07-10, gemini round: `<url|label>` reached users verbatim). Unwrap.
    .replace(/`(<https?:\/\/[^`\n]+>)`/g, "$1")
    // Citation-marker noise the harness bans but models still emit (live
    // 2026-07-10, gemini stress round): numeric grounding indices like
    // " [11]" / " [1, 22]" (Gemini's internal chunk ids — meaningless to
    // readers) and repo-path brackets like " [docs/connectors/notion.md]".
    // Note: markdown [label](url) links were already converted above, so
    // these patterns can't touch real links.
    .replace(/ ?\[\d+(?:,\s*\d+)*\]/g, "")
    .replace(/ ?\[(?:docs|skills|agents|design-system)\/[^\]\n]*\]/g, "")
    // Bare harness-file citations ("[method.md]", "[bot.md]") and bracketed
    // row-UUID citations ("[a0000000-…]", "[id1, id2]") — both reached
    // designers in the 2026-07-11 test round despite the prompt ban.
    .replace(/ ?\[[a-z0-9_-]+\.md\]/gi, "")
    .replace(/ ?\[\s*[0-9a-f]{8}[0-9a-f-]{10,}(?:\s*,\s*[0-9a-f-]{8,})*\s*\]/gi, "")
    // The models CONSTRUCT GitHub links from pattern and invent the org (live
    // 2026-07-10, twice: "plus-team/plus-uno" and "plus-uno/plus-uno"). The
    // repo has exactly one home — rewrite known-wrong orgs deterministically.
    .replace(/github\.com\/(?:plus-team|plus-uno)\/plus-uno/g, "github.com/BilLogic/plus-uno");
}

function convertLine(line: string): string {
  // ATX headings (## Title) → a bold label line.
  const h = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (h) return `*${h[2]!.trim()}*`;
  // Unordered list markers (-, *, +) → Slack's literal bullet. Requires a space
  // after the marker, so a `*Bold label*` line (no space) is never matched.
  const ul = line.match(/^(\s*)[-*+]\s+(.*)$/);
  if (ul) return `${ul[1]}• ${ul[2]}`;
  return line; // ordered lists ("1. x") read fine in Slack as-is
}

/** A markdown table (header row + |---| separator + rows) → `• a — b — c` lines. */
function convertTables(seg: string): string {
  const lines = seg.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i]!;
    const next = i + 1 < lines.length ? lines[i + 1]! : "";
    if (cur.includes("|") && isSeparatorRow(next)) {
      i += 2; // skip the header + separator rows
      while (i < lines.length && lines[i]!.includes("|") && lines[i]!.trim() !== "") {
        const cells = splitRow(lines[i]!).filter((c) => c !== "");
        if (cells.length) out.push(`• ${cells.join(" — ")}`);
        i++;
      }
      continue;
    }
    out.push(cur);
    i++;
  }
  return out.join("\n");
}

// A table separator row is all dashes/colons/pipes/spaces AND contains a pipe
// (so a plain `---` horizontal divider is NOT treated as a table).
function isSeparatorRow(line: string): boolean {
  const t = line.trim();
  return t.includes("-") && t.includes("|") && /^[\s|:-]+$/.test(t);
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}
