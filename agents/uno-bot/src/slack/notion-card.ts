// The Notion reads a proposal card needs to name its target in human words.
//
// Two card parts, both Notion CLIENTS rather than presentation: the
// `notion_update` diff (`current → new`, with people and relation ids resolved
// to real names) and the `notion_archive` target (page title + parent
// database). They lived at the bottom of `slack/events.ts`; the Turn module
// decides WHICH card a tool gets and reaches for these as named clients on
// `TurnDeps.cards`, because a Notion read is not something Turn may do itself.
//
// EACH HANDS BACK A STRUCTURE, not a line (#623). They used to return Slack
// mrkdwn — `*<url|Title>* — in <DB>`, backticked values, `↳` continuations —
// which Turn spliced into the card's text; the whole card is data now, so what
// these return is a `CardRevision` and a `CardTarget` and the words are
// `slack/proposal-render.ts`'s. The one thing still named here is a property's
// LABEL, which is the page's own field name as the read reported it (or, with
// no read, the request key made readable) — a name, not a rendering.

import type { CardRevision, CardTarget } from "../turn/index";
import type { Env } from "../types";
import {
  canonicalNotionUrl,
  describeNotionTarget,
  normalizeName,
  parseNotionPageId,
  fetchPageTitles,
} from "../integrations/notion";

function humanizeFieldName(key: string): string {
  return key.replace(/[_\s]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// People/relation writes arrive as a Notion id or URL — resolve to a real name
// so the card never shows a bare `notion.so/e5cb…`. Plain values (a select name,
// a date) carry no 32-hex id and pass straight through. Best-effort.
async function resolveNotionValueForDisplay(env: Env, raw: string): Promise<string> {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const id = parseNotionPageId(part);
    if (id) {
      const titles = await fetchPageTitles(env, [id]).catch(() => []);
      if (titles.length) { out.push(...titles); continue; }
    }
    out.push(part);
  }
  return out.join(", ") || raw.trim();
}

/** How much of a replacement's first line the card echoes. */
const REPLACE_PREVIEW = 100;

/** What an `append` (narrative) update adds, so the card doesn't drop it: the
 *  sections it writes, or — with none — a bare note on the page. */
function appendOf(append: unknown): { headings: string[] } | undefined {
  if (!append || typeof append !== "object") return undefined;
  const o = append as Record<string, unknown>;
  const headings = (Array.isArray(o.sections) ? o.sections : [])
    .map((s) => (s && typeof s === "object" ? String((s as Record<string, unknown>).heading ?? "").trim() : ""))
    .filter(Boolean);
  if (headings.length) return { headings };
  if (typeof o.text === "string" && o.text.trim()) return { headings: [] };
  return undefined;
}

/**
 * The `replace` (in-place rewrite), so the ✅ is never given blind to the one
 * operation that changes text a human already wrote.
 */
function rewriteOf(replace: unknown): { blocks: number; previews: string[] } | undefined {
  if (!Array.isArray(replace)) return undefined;
  const ops = replace.filter((o) => o && typeof o === "object") as Record<string, unknown>[];
  if (!ops.length) return undefined;
  const previews = ops
    .map((o) => String(o.content ?? "").trim().split("\n")[0]?.slice(0, REPLACE_PREVIEW) ?? "")
    .filter(Boolean);
  return { blocks: ops.length, previews };
}

/**
 * A `notion_update` as the revision it is — separate from the executable tool
 * input, which lives untouched in the store's pending state.
 *
 * Reads the page for its title/URL/parent database and the current value of
 * each changed field, and resolves people/relation new-values from ids or URLs
 * to real names. What it does NOT do is decide how any of that reads.
 */
export async function buildNotionRevision(
  env: Env,
  input: Record<string, unknown>,
): Promise<CardRevision> {
  const pageUrl = typeof input.page_url === "string" ? input.page_url : "";
  const properties =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const changedFields = Object.keys(properties);
  const target = pageUrl ? await describeNotionTarget(env, pageUrl, changedFields) : null;

  const revision: CardRevision = { properties: [] };
  // The page, named where the read could name it. A `title` we could not
  // resolve leaves the link to name itself — never a bare hex URL on the card.
  if (target) {
    revision.page = { url: target.url, title: target.title, parent: target.parent };
  } else if (pageUrl) {
    revision.page = { url: canonicalNotionUrl(pageUrl) };
  }

  // One entry per changed field, always — what it says now, what it will say.
  for (const [reqName, rawVal] of Object.entries(properties)) {
    if (typeof rawVal !== "string") continue;
    const cur = target?.current?.[normalizeName(reqName)];
    revision.properties.push({
      label: cur?.label ?? humanizeFieldName(reqName),
      ...(cur?.value ? { from: cur.value } : {}),
      to: await resolveNotionValueForDisplay(env, rawVal),
    });
  }

  const rewrite = rewriteOf(input.replace);
  if (rewrite) revision.rewrite = rewrite;
  const append = appendOf(input.append);
  if (append) revision.append = append;
  return revision;
}

/**
 * The target a `notion_archive` card names.
 *
 * Writes are no longer database-allowlisted, so the human ✅ is the backstop —
 * the card shows the CONCRETE target (page title + parent database) rather than
 * a bare id, so an approver cannot be steered into confirming a write on some
 * arbitrary page a read pulled in (review 2026-07-13). Best-effort; no target
 * resolved means no line on the card.
 */
export async function buildNotionTarget(
  env: Env,
  input: Record<string, unknown>,
): Promise<CardTarget | undefined> {
  const pageUrl = typeof input.page_url === "string" ? input.page_url : "";
  const target = pageUrl ? await describeNotionTarget(env, pageUrl) : null;
  return target ? { title: target.title, parent: target.parent, url: target.url } : undefined;
}
