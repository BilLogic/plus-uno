// The Notion reads a proposal card needs to name its target in human words.
//
// Two card bodies, both Notion clients rather than presentation: the
// `notion_update` diff (`current → new`, with people and relation ids resolved
// to real names) and the `notion_archive` target line (page title + parent
// database). They lived at the bottom of `slack/events.ts`; the Turn module
// decides WHICH card a tool gets and reaches for these as named clients on
// `TurnDeps.cards`, because a Notion read is not something Turn may do itself.

import type { Env } from "../types";
import {
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

// A one-line note for an `append` (narrative) update, so the card doesn't drop it.
function describeAppend(append: unknown): string | null {
  if (!append || typeof append !== "object") return null;
  const o = append as Record<string, unknown>;
  const headings = (Array.isArray(o.sections) ? o.sections : [])
    .map((s) => (s && typeof s === "object" ? String((s as Record<string, unknown>).heading ?? "").trim() : ""))
    .filter(Boolean);
  if (headings.length) return `• *Appending:* ${headings.map((h) => `_${h}_`).join(", ")}`;
  if (typeof o.text === "string" && o.text.trim()) return `• *Appending a note to the page.*`;
  return null;
}

/**
 * A one-line note for a `replace` (in-place rewrite), so the ✅ is never given
 * blind to the one operation that changes text a human already wrote.
 */
function describeReplace(replace: unknown): string | null {
  if (!Array.isArray(replace)) return null;
  const ops = replace.filter((o) => o && typeof o === "object") as Record<string, unknown>[];
  if (!ops.length) return null;
  const preview = ops
    .map((o) => String(o.content ?? "").trim().split("\n")[0]?.slice(0, REPLACE_PREVIEW) ?? "")
    .filter(Boolean);
  const head = `• *Rewriting ${ops.length} block(s) in place* (the rest of the page is untouched).`;
  return preview.length ? `${head}\n${preview.map((t) => `    ↳ _${t}_`).join("\n")}` : head;
}

/**
 * The DISPLAY body for a `notion_update` proposal — separate from the
 * executable tool input, which lives untouched in the store's pending state.
 * Reads the page for its title/URL/parent database and the current value of
 * each changed field, resolves people/relation new-values from ids or URLs to
 * real names, and codifies every property value in backticks.
 */
export async function buildNotionUpdateBody(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const pageUrl = typeof input.page_url === "string" ? input.page_url : "";
  const properties =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const changedFields = Object.keys(properties);
  const target = pageUrl ? await describeNotionTarget(env, pageUrl, changedFields) : null;

  const lines: string[] = [];

  // Named + linked card — `<url|Title> — in <ParentDB>`, never a bare hex URL.
  if (target) {
    lines.push(`*<${target.url}|${target.title}>* — in ${target.parent}`);
  } else if (pageUrl) {
    lines.push(`*<${pageUrl}|this Notion page>*`);
  }

  // One bullet per changed field, always — `current → new`, values backticked.
  for (const [reqName, rawVal] of Object.entries(properties)) {
    if (typeof rawVal !== "string") continue;
    const cur = target?.current?.[normalizeName(reqName)];
    const label = cur?.label ?? humanizeFieldName(reqName);
    const newDisplay = await resolveNotionValueForDisplay(env, rawVal);
    lines.push(
      cur?.value
        ? `• *${label}:* \`${cur.value}\` → \`${newDisplay}\``
        : `• *${label}:* \`${newDisplay}\``,
    );
  }

  const replaceNote = describeReplace(input.replace);
  if (replaceNote) lines.push(replaceNote);

  const appendNote = describeAppend(input.append);
  if (appendNote) lines.push(appendNote);

  return lines.join("\n");
}

/**
 * The one-line target note on a `notion_archive` card.
 *
 * Writes are no longer database-allowlisted, so the human ✅ is the backstop —
 * the card shows the CONCRETE target (page title + parent database) rather than
 * a bare id, so an approver cannot be steered into confirming a write on some
 * arbitrary page a read pulled in (review 2026-07-13). Best-effort; no target
 * resolved means no line.
 */
export async function buildNotionArchiveTargetNote(
  env: Env,
  input: Record<string, unknown>,
): Promise<string | undefined> {
  const pageUrl = typeof input.page_url === "string" ? input.page_url : "";
  const target = pageUrl ? await describeNotionTarget(env, pageUrl) : null;
  return target ? `• *Target:* ${target.title} — in ${target.parent}` : undefined;
}
