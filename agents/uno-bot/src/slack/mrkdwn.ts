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
      if (inner !== undefined) {
        const safe = validMarkup(inner);
        return safe === null ? escapeBare(match) : `<${safe}>`;
      }
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
 * are left alone: Slack parses no markup there. Returns a copy.
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
