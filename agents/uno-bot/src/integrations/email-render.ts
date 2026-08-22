// Markdown → email, as both plain text and HTML.
//
// The third and last surface in the 2026-08-22 "one dialect" change. The model
// writes standard Markdown everywhere (`AGENT.md`); Slack converts to mrkdwn
// where it needs to, Notion turns it into blocks, and email — which was
// `text/plain` with no conversion at all — shipped `**bold**` and
// `[label](url)` to external recipients verbatim. Those are the people least
// able to guess what the asterisks meant.
//
// ONE PARSER, THREE RENDERERS. This module does not parse Markdown: it renders
// the block model `notion-blocks.ts` already produces. A second parser would be
// a second set of edge cases to keep in step — the snake_case rule, the link
// scheme rule, the code-span rule — and they would drift.

import {
  markdownToNotionBlocks,
  type NotionBlock,
  type RichTextRun,
} from "./notion-blocks";

export interface RenderedEmail {
  /** text/plain part. */
  text: string;
  /** text/html part. */
  html: string;
}

function runsOf(block: NotionBlock): RichTextRun[] {
  return ((block[block.type] as { rich_text?: RichTextRun[] })?.rich_text ?? []);
}

function childrenOf(block: NotionBlock): NotionBlock[] {
  return ((block[block.type] as { children?: NotionBlock[] })?.children ?? []);
}

// ── Plain text ───────────────────────────────────────────────────────────────

/**
 * Emphasis is dropped rather than spelled out. `**bold**` exists to be seen,
 * and a plain-text reader who gets literal asterisks is exactly the reader this
 * change is for. A link keeps its URL, because that is the part that is
 * useless when lost — mail clients auto-link a bare URL, so `label (url)` stays
 * clickable in Gmail, Outlook and Apple Mail.
 */
function runsToText(runs: RichTextRun[]): string {
  return runs
    .map((r) => {
      const content = r.text.content;
      const url = r.text.link?.url;
      if (!url) return content;
      if (!content || content === url) return url;
      return `${content} (${url})`;
    })
    .join("");
}

function blockToText(block: NotionBlock, indent = ""): string[] {
  const text = runsToText(runsOf(block));
  const lines: string[] = [];
  switch (block.type) {
    case "heading_3":
      // Setext-style, the long-standing plain-text convention for a heading —
      // legible without shouting, which is what an uppercase heading does.
      lines.push(`${indent}${text}`, `${indent}${"-".repeat(Math.min(text.length, 60))}`);
      break;
    case "bulleted_list_item":
      lines.push(`${indent}• ${text}`);
      break;
    case "numbered_list_item":
      lines.push(`${indent}- ${text}`);
      break;
    case "to_do":
      lines.push(`${indent}[${(block.to_do as { checked?: boolean }).checked ? "x" : " "}] ${text}`);
      break;
    case "quote":
      for (const line of text.split("\n")) lines.push(`${indent}> ${line}`);
      break;
    case "code":
      for (const line of text.split("\n")) lines.push(`${indent}    ${line}`);
      break;
    case "divider":
      lines.push(`${indent}${"—".repeat(40)}`);
      break;
    default:
      for (const line of text.split("\n")) lines.push(`${indent}${line}`);
  }
  for (const child of childrenOf(block)) lines.push(...blockToText(child, `${indent}  `));
  return lines;
}

/** Block types that read as a list — consecutive ones stay tight, everything
 *  else gets a blank line after it. */
const TIGHT = new Set(["bulleted_list_item", "numbered_list_item", "to_do"]);

export function renderPlainText(blocks: NotionBlock[]): string {
  const out: string[] = [];
  blocks.forEach((block, i) => {
    out.push(...blockToText(block));
    const next = blocks[i + 1];
    const tightRun = next && TIGHT.has(block.type) && TIGHT.has(next.type);
    if (next && !tightRun) out.push("");
  });
  // Trim blank LINES, not whitespace — a plain `.trim()` ate the four-space
  // indent of a body whose first block is a code block, silently turning it
  // back into prose.
  return out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\s+$/, "");
}

// ── HTML ─────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function runsToHtml(runs: RichTextRun[]): string {
  return runs
    .map((r) => {
      let html = escapeHtml(r.text.content).replace(/\n/g, "<br>");
      const a = r.annotations ?? {};
      // Innermost first, so the nesting mirrors the source: `**bold _and
      // italic_**` becomes <strong><em>…</em></strong>, not the reverse.
      if (a.code) html = `<code>${html}</code>`;
      if (a.italic) html = `<em>${html}</em>`;
      if (a.strikethrough) html = `<del>${html}</del>`;
      if (a.bold) html = `<strong>${html}</strong>`;
      const url = r.text.link?.url;
      if (url) html = `<a href="${escapeHtml(url)}">${html}</a>`;
      return html;
    })
    .join("");
}

function listItemHtml(block: NotionBlock): string {
  const inner = runsToHtml(runsOf(block));
  const children = childrenOf(block);
  if (!children.length) return `<li>${inner}</li>`;
  // One level of nesting, matching what the parser produces.
  return `<li>${inner}${groupedHtml(children)}</li>`;
}

/**
 * Consecutive list items become one `<ul>`/`<ol>`, which is why this is not a
 * simple map: the block model is flat, and a list that emitted one `<ul>` per
 * item would render with a gap between every bullet in most mail clients.
 */
function groupedHtml(blocks: NotionBlock[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i]!;
    if (block.type === "bulleted_list_item" || block.type === "to_do") {
      const items: string[] = [];
      while (i < blocks.length && (blocks[i]!.type === "bulleted_list_item" || blocks[i]!.type === "to_do")) {
        const b = blocks[i]!;
        if (b.type === "to_do") {
          // A real <input type=checkbox> is stripped or inert in most mail
          // clients; the glyph carries the same information and always renders.
          const mark = (b.to_do as { checked?: boolean }).checked ? "&#9745;" : "&#9744;";
          items.push(`<li>${mark} ${runsToHtml(runsOf(b))}</li>`);
        } else {
          items.push(listItemHtml(b));
        }
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (block.type === "numbered_list_item") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i]!.type === "numbered_list_item") {
        items.push(listItemHtml(blocks[i]!));
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    out.push(singleHtml(block));
    i++;
  }
  return out.join("");
}

function singleHtml(block: NotionBlock): string {
  const inner = runsToHtml(runsOf(block));
  switch (block.type) {
    case "heading_3":
      return `<h3>${inner}</h3>`;
    case "quote":
      return `<blockquote style="margin:0 0 1em;padding-left:12px;border-left:3px solid #ddd;color:#555">${inner}</blockquote>`;
    case "code":
      return `<pre style="background:#f6f6f6;padding:10px;border-radius:4px;overflow-x:auto"><code>${escapeHtml(
        runsOf(block).map((r) => r.text.content).join(""),
      )}</code></pre>`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid #ddd;margin:1.5em 0">`;
    default:
      return `<p>${inner}</p>`;
  }
}

export function renderHtml(blocks: NotionBlock[]): string {
  // Inline styles only, on a plain system font stack: mail clients strip
  // <style> blocks and support no external CSS, so anything structural has to
  // ride on the element itself.
  return [
    '<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#222">',
    groupedHtml(blocks),
    "</body></html>",
  ].join("");
}

/** A Markdown body → the two MIME parts an email carries. */
export function markdownToEmail(markdown: string): RenderedEmail {
  const blocks = markdownToNotionBlocks(markdown);
  if (!blocks.length) {
    const bare = markdown.trim();
    return { text: bare, html: renderHtml([]) };
  }
  return { text: renderPlainText(blocks), html: renderHtml(blocks) };
}
