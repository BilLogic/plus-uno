// notion_archive executor — archive (soft-delete) a card the bot created. Side
// effect → routed through the ✅ gate. archiveCard refuses anything not parented
// by an allowlisted database, so this can't nuke arbitrary Notion pages.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { archiveCard, parseNotionPageId } from "../integrations/notion";

export async function executeNotionArchive(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const raw = typeof input.page_url === "string" ? input.page_url.trim() : "";
  const pageId = raw ? parseNotionPageId(raw) : null;
  if (!pageId) {
    return JSON.stringify({ ok: false, error: "missing or unparseable 'page_url'" });
  }

  try {
    const { title } = await archiveCard(env, pageId);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:wastebasket: Archived *${title}*. (Recoverable from Notion's trash.)`,
    });
    return JSON.stringify({ ok: true, status: "archived", message: `Archived '${title}'.` });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't archive — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "archive_failed", detail });
  }
}
