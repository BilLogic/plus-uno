// CommonMark → Slack mrkdwn coercion. The model is told to emit Slack mrkdwn
// (docs/conventions/slack.md), but under load it slips back into GitHub-flavored
// Markdown — `## headings`, `**bold**`, and `| tables |`, none of which Slack
// renders. Rather than trust the prompt, we sanitize at the single egress point
// (slack/api.ts postMessage), so every outgoing message is valid mrkdwn.
//
// Safe on already-correct mrkdwn (idempotent): Worker-authored messages use
// `*bold*`, `•` bullets, and `<url|label>` links, none of which these rules
// touch. Fenced code blocks are protected so JSON proposal cards / code are
// never mangled.

/** Split on ```fenced``` blocks; transform only the non-fenced segments. */
export function toSlackMrkdwn(input: string): string {
  if (!input) return input;
  const parts = input.split(/(```[\s\S]*?```)/g);
  return parts.map((seg, i) => (i % 2 === 1 ? seg : transformSegment(seg))).join("");
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
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, "<$2|$1>"); // [label](url) → <url|label>
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
