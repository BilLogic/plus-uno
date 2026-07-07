// read_source executor — READ-ONLY. Fetches the CONTENT of a link the user
// pasted so the bot answers from the actual source instead of its priors
// (fixes the "doesn't read what it's linked" cluster). Dispatches by domain:
//   notion.so  → page title + properties (incl. Owner/people) + block text
//   figma.com  → node name/type + text layers (for review/inspection)
//   github.com / raw / *.md → raw file text
//   other http(s) → fetched text with tags stripped
// Runs inline in the agent loop (no side effect, no gate).

import type { Env } from "../types";
import { parseNotionPageId, readNotionPage } from "../integrations/notion";
import { parseFigmaUrl, fetchFigmaNode } from "../integrations/figma";

const GENERIC_TIMEOUT_MS = 8000;
const GENERIC_TEXT_CAP = 8000;

function firstUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const m = input.match(/https?:\/\/[^\s<>|)"']+/i);
  return m ? m[0] : null;
}

// github.com/owner/repo/blob/branch/path -> raw.githubusercontent.com/...
function toGithubRaw(u: URL): string | null {
  if (/(^|\.)raw\.githubusercontent\.com$/i.test(u.hostname)) return u.toString();
  if (/(^|\.)github\.com$/i.test(u.hostname)) {
    const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
    if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function executeReadSource(env: Env, input: Record<string, unknown>): Promise<string> {
  const url = firstUrl(input.url) ?? firstUrl(input.text);
  if (!url) {
    return JSON.stringify({ ok: false, error: "no http(s) URL found in the input" });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return JSON.stringify({ ok: false, error: `not a valid URL: ${url}` });
  }
  const host = parsed.hostname.toLowerCase();

  try {
    // ---- Notion ----
    if (/(^|\.)notion\.so$/.test(host) || /(^|\.)notion\.site$/.test(host)) {
      const pageId = parseNotionPageId(url);
      if (!pageId) return JSON.stringify({ ok: false, error: "couldn't extract a Notion page id from that URL" });
      let page;
      try {
        page = await readNotionPage(env, pageId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Notion 404s pages that exist but aren't shared with the integration
        // (object_not_found) — by far the most common cause. Make the failure
        // actionable so the designer can self-serve the fix.
        if (/404|object_not_found/i.test(msg)) {
          return JSON.stringify({
            ok: false,
            error: `Notion page not accessible: ${msg}`,
            note:
              "Most likely this page isn't shared with the bot's Notion integration (Notion returns 404 for unshared pages). Tell the user: anyone with edit access can fix it — open the page in Notion → ••• menu → Connections → add the uno-bot integration — then ask again. Do NOT answer about this page from memory.",
          });
        }
        throw err;
      }
      return JSON.stringify({
        ok: true,
        source_type: "notion",
        url,
        title: page.title,
        properties: page.properties,
        people: page.people,
        content: page.text,
        note: "Answer from THIS page's content/properties and cite it. If asked who owns/reviews it, use the people/Owner property here — do not guess from roles or LinkedIn.",
      });
    }

    // ---- Figma ----
    if (/(^|\.)figma\.com$/.test(host)) {
      const parts = parseFigmaUrl(url);
      if (!parts) return JSON.stringify({ ok: false, error: "couldn't parse a Figma file/node from that URL (need a node-id)" });
      const node = await fetchFigmaNode(env, parts.fileKey, parts.nodeId);
      return JSON.stringify({
        ok: true,
        source_type: "figma",
        url,
        title: node.name,
        node_type: node.type,
        content: node.texts.join("\n"),
        note: "This is the frame's structure + text layers. Ground any critique/answer in it and cite the frame. It's text only — you cannot judge pixel-level visuals.",
      });
    }

    // ---- GitHub / raw / other http(s) ----
    const raw = toGithubRaw(parsed);
    const fetchUrl = raw ?? url;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERIC_TIMEOUT_MS);
    try {
      const res = await fetch(fetchUrl, { signal: controller.signal, headers: { "user-agent": "uno-bot" } });
      if (!res.ok) {
        return JSON.stringify({ ok: false, error: `fetch ${res.status} for ${fetchUrl}`, note: "Couldn't open the link — tell the user you couldn't read it; don't answer from priors." });
      }
      const ctype = res.headers.get("content-type") ?? "";
      let body = await res.text();
      if (/html/i.test(ctype) && !raw) body = stripHtml(body);
      return JSON.stringify({
        ok: true,
        source_type: raw ? "github" : "web",
        url: fetchUrl,
        content: body.slice(0, GENERIC_TEXT_CAP),
        note: "Answer from this fetched content and cite the URL. If it doesn't contain the answer, say so — don't fall back to priors silently.",
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Couldn't read the linked source. Tell the user you couldn't open it rather than answering from memory.",
    });
  }
}
