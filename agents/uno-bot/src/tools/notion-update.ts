// notion_update executor — change properties and/or append narrative on an
// existing Notion card. Side effect → routed through the ✅ gate. Property writes
// are limited to a known set (see notionUpdate) so we never guess a property's
// type or trip the silent select auto-create; unknown props are reported back.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { notionUpdate, parseNotionPageId, type PrdSection } from "../integrations/notion";

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
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

  if ((!properties || !Object.keys(properties).length) && !append) {
    return JSON.stringify({ ok: false, error: "nothing to update — provide 'properties' and/or 'append'" });
  }

  try {
    const r = await notionUpdate(env, pageId, { properties, append });
    const parts: string[] = [];
    if (r.updated.length) parts.push(`set ${r.updated.join(", ")}`);
    if (r.appended) parts.push(`appended ${r.appended} block(s)`);
    const skippedNote = r.skipped.length ? ` — couldn't set: ${r.skipped.join("; ")}` : "";

    // Nothing landed (every requested property was skipped): report a FAILURE,
    // never a quiet "no changes" — so the bot doesn't claim a move it didn't make
    // (live 2026-07-13: "Dev_Status" was skipped and the run read as done).
    if (!r.updated.length && !r.appended) {
      await postMessage(env, {
        channel: slack.channel,
        thread_ts: slack.threadTs,
        text: `:warning: I couldn't change the Notion page${skippedNote || " — nothing to update"}.`,
      });
      return JSON.stringify({ ok: false, status: "no_changes", ...r });
    }

    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:pencil2: Updated the Notion page — ${parts.join("; ")}${skippedNote}.`,
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
