// delete_prd executor — archives (soft-deletes) a PRD card the bot created on
// the Roadmap board, then confirms in the thread. Archiving is recoverable from
// Notion's trash, and archiveRoadmapCard refuses anything that isn't a Roadmap
// card, so this can't nuke arbitrary Notion pages.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { archiveRoadmapCard, parseNotionPageId } from "../integrations/notion";

export async function executeDeletePrd(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const raw = typeof input.notion_url === "string" ? input.notion_url.trim() : "";
  const pageId = raw ? parseNotionPageId(raw) : null;
  if (!pageId) {
    return JSON.stringify({ ok: false, error: "missing or unparseable 'notion_url' for the PRD to delete" });
  }

  try {
    const { title } = await archiveRoadmapCard(env, pageId);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:wastebasket: Archived PRD card *${title}* from the Roadmap board. (Recoverable from Notion's trash.)`,
    });
    return JSON.stringify({ ok: true, status: "archived", message: `Archived '${title}'.` });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't delete the PRD — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "archive_failed", detail });
  }
}
