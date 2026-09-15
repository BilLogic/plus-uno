// notion_update executor — change properties, append narrative, and/or rewrite
// a named block in place on an existing Notion card. Side effect → routed
// through the ✅ gate. A replace names one block id and the `last_edited_time`
// the read reported; the integration refuses it, unwritten, when the block has
// moved since (ADR-029). Nothing is ever deleted. Property writes
// are limited to a known set (see notionUpdate) so we never guess a property's
// type or trip the silent select auto-create; unknown props are reported back.

import type { Env } from "../types";
import type { SlackContext } from "../types";
import { postMessage } from "../slack/api";
import {
  notionUpdate,
  normalizeName,
  parseNotionPageId,
  type NotionBlockReplacement,
  type PrdSection,
} from "../integrations/notion";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Render one confirmed change for the success echo: "*Real Name* → `new value`",
// value codified. `entry` is notionUpdate's real schema name, optionally with a
// "(note)" suffix; the value comes from the requested input matched by name.
function echoUpdatedField(entry: string, properties?: Record<string, string>): string {
  const m = entry.match(/^(.*?)(?:\s+\((.*)\))?$/);
  const name = (m?.[1] ?? entry).trim();
  const note = m?.[2];
  let value = "";
  if (properties) {
    const target = normalizeName(name);
    for (const [k, v] of Object.entries(properties)) {
      if (normalizeName(k) === target) { value = v; break; }
    }
  }
  const base = value ? `*${name}* → \`${value}\`` : `*${name}*`;
  return note ? `${base} (${note})` : base;
}

function parseAppend(v: unknown): { sections?: PrdSection[]; text?: string } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const sections = Array.isArray(o.sections)
    ? o.sections
        .map((s) => {
          const so = (s ?? {}) as Record<string, unknown>;
          return { heading: asString(so.heading), body: asString(so.body) };
        })
        .filter((s) => s.heading)
    : undefined;
  const text = asString(o.text) || undefined;
  if (!sections?.length && !text) return undefined;
  return { sections, text };
}

/**
 * `replace` as the model writes it — snake_case block id and stamp, matching
 * the marker a page read handed it — into the integration's shape.
 *
 * An operation missing either half is dropped here rather than sent on: the
 * stamp is the only thing standing between a rewrite and a human's unseen
 * edit, so "no stamp" can never mean "write anyway".
 */
function parseReplace(v: unknown): NotionBlockReplacement[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const ops = v
    .map((entry) => {
      const o = (entry ?? {}) as Record<string, unknown>;
      return {
        blockId: asString(o.block_id) || asString(o.blockId),
        lastEditedTime: asString(o.last_edited_time) || asString(o.lastEditedTime),
        content: asString(o.content),
      };
    })
    .filter((o) => o.blockId && o.lastEditedTime && o.content);
  return ops.length ? ops : undefined;
}

export async function executeNotionUpdate(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const raw = asString(input.page_url);
  const pageId = raw ? parseNotionPageId(raw) : null;
  if (!pageId) {
    return JSON.stringify({ ok: false, error: "missing or unparseable 'page_url'" });
  }

  const properties =
    input.properties && typeof input.properties === "object"
      ? Object.fromEntries(
          Object.entries(input.properties as Record<string, unknown>)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, (v as string).trim()]),
        )
      : undefined;
  const append = parseAppend(input.append);
  const replace = parseReplace(input.replace);

  if ((!properties || !Object.keys(properties).length) && !append && !replace) {
    return JSON.stringify({
      ok: false,
      error:
        "nothing to update — provide 'properties', 'append' and/or 'replace' (a replace needs block_id, last_edited_time and content)",
    });
  }

  try {
    const r = await notionUpdate(env, pageId, { properties, append, replace });
    const parts: string[] = [];
    // Name each concrete change with its NEW value codified, e.g.
    // "set *Dev Status* → `Ready for Dev`" — not a bare property name (2026-07-14).
    if (r.updated.length) parts.push(`set ${r.updated.map((u) => echoUpdatedField(u, properties)).join(", ")}`);
    if (r.replaced) parts.push(`replaced ${r.replaced} block(s)`);
    if (r.appended) parts.push(`appended ${r.appended} block(s)`);
    const skippedNote = r.skipped.length ? ` — couldn't set: ${r.skipped.join("; ")}` : "";
    // A refused replace is NOT a quiet no-op: the page still says what it said,
    // and the person who asked for the correction has to hear that.
    const refusedNote = r.refused.length ? ` — refused: ${r.refused.join("; ")}` : "";

    // Nothing landed (every requested property was skipped): report a FAILURE,
    // never a quiet "no changes" — so the bot doesn't claim a move it didn't make
    // (live 2026-07-13: "Dev_Status" was skipped and the run read as done).
    if (!r.updated.length && !r.appended && !r.replaced) {
      await postMessage(env, {
        channel: slack.channel,
        thread_ts: slack.threadTs,
        text: `:warning: I couldn't change the Notion page${skippedNote}${refusedNote}${skippedNote || refusedNote ? "" : " — nothing to update"}.`,
      });
      return JSON.stringify({ ok: false, status: "no_changes", ...r });
    }

    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:pencil2: Updated the Notion page — ${parts.join("; ")}${skippedNote}${refusedNote}.`,
    });
    return JSON.stringify({ ok: true, status: "updated", ...r });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't update the Notion page — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "update_failed", detail });
  }
}
