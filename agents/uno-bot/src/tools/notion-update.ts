// notion_update executor — change properties, append narrative, and/or rewrite
// a named block in place on an existing Notion card. Side effect → routed
// through the ✅ gate. A replace names one block id and the `last_edited_time`
// the read reported; the integration refuses it, unwritten, when the block has
// moved since (ADR-029). Nothing is ever deleted. Property writes
// are limited to a known set (see notionUpdate) so we never guess a property's
// type or trip the silent select auto-create; unknown props are reported back.
// An append opens with the attribution line naming the requester; a replace,
// an insert and a property change carry none (`docs/connectors/notion.md`).

import type { Env } from "../types";
import type { SlackContext } from "../types";
import { postMessage } from "../slack/api";
import {
  notionUpdate,
  normalizeName,
  parseNotionPageId,
  type NotionBlockInsertion,
  type NotionBlockReplacement,
  type PrdSection,
} from "../integrations/notion";
import { requesterName } from "./requester-name";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Render one confirmed change for the success echo: "Real Name is now new value",
// in plain words. `entry` is notionUpdate's real schema name, optionally with a
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
  const base = value ? `${name} is now ${value}` : `${name} is set`;
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

/**
 * `insert` as the Worker stages it for the sweep — the block to follow and its
 * stamp, snake_case like `replace` — into the integration's shape. An entry
 * missing either half is dropped, for the same reason a replace is.
 */
function parseInsert(v: unknown): NotionBlockInsertion[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const ops = v
    .map((entry) => {
      const o = (entry ?? {}) as Record<string, unknown>;
      return {
        afterBlockId: asString(o.after_block_id) || asString(o.afterBlockId),
        lastEditedTime: asString(o.last_edited_time) || asString(o.lastEditedTime),
        content: asString(o.content),
      };
    })
    .filter((o) => o.afterBlockId && o.lastEditedTime && o.content);
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
  const insert = parseInsert(input.insert);

  if ((!properties || !Object.keys(properties).length) && !append && !replace && !insert) {
    return JSON.stringify({
      ok: false,
      error:
        "nothing to update — provide 'properties', 'append' and/or 'replace' (a replace needs block_id, last_edited_time and content)",
    });
  }

  try {
    // The name is read only when there is body content to attribute.
    const onBehalfOf = append ? await requesterName(env, slack) : undefined;
    const r = await notionUpdate(env, pageId, { properties, append, replace, insert, onBehalfOf });
    // Name each property change with its NEW value, e.g. "Dev Status is now
    // Ready for Dev" — not a bare property name (2026-07-14). Body edits go
    // unnamed: the confirmation is one plain sentence, never a block count.
    const set = r.updated.map((u) => echoUpdatedField(u, properties));
    const skippedNote = r.skipped.length ? ` — couldn't set: ${r.skipped.join("; ")}` : "";
    // A refused replace is NOT a quiet no-op: the page still says what it said,
    // and the person who asked for the correction has to hear that.
    const refusedNote = r.refused.length ? ` — refused: ${r.refused.join("; ")}` : "";

    // Nothing landed (every requested property was skipped): report a FAILURE,
    // never a quiet "no changes" — so the bot doesn't claim a move it didn't make
    // (live 2026-07-13: "Dev_Status" was skipped and the run read as done).
    if (!r.updated.length && !r.appended && !r.replaced && !r.inserted) {
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
      text: `Updated the Notion page${set.length ? `: ${set.join(", ")}` : ""}${skippedNote}${refusedNote}.`,
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
