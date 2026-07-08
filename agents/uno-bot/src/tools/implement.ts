// Dispatch the existing figma-implement.yml workflow.
//
// Payload contract verified against .github/workflows/figma-implement.yml:
//   { component, notion_prd_id?, notion_prd_url?, thread_ts, channel, message_ts }
// The workflow uses message_ts for its own :gear: / :white_check_mark: reactions
// on the user's original message — we pass userMsgTs there.

import type { Env } from "../types";
import { repositoryDispatch } from "./github-dispatch";
import type { SlackContext } from "./dispatcher";
import { extractNotionPrdFromText } from "../slack/notion-prd";

export async function executeImplement(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const component = typeof input.component === "string" ? input.component : "";
  const notes = typeof input.notes === "string" ? input.notes : undefined;
  const inputPrdUrl = typeof input.notion_prd_url === "string" ? input.notion_prd_url.trim() : "";
  if (!component) {
    return JSON.stringify({ ok: false, error: "missing 'component' in input" });
  }

  // A component implement MUST be tied to a Notion PRD — the polling bot creates
  // one upstream and posts it in #uno-bot. Resolve the PRD from the thread
  // root (the poll notification) if present, else one the designer pasted. If
  // neither exists, refuse so the bot asks for it rather than implementing blind.
  const fromInput = inputPrdUrl ? extractNotionPrdFromText(inputPrdUrl) : null;
  const notionPrdId = slack.notionPrdId ?? fromInput?.id;
  const notionPrdUrl = slack.notionPrdUrl ?? fromInput?.url ?? (inputPrdUrl || undefined);
  if (!notionPrdId && !notionPrdUrl) {
    return JSON.stringify({
      ok: false,
      error: "no Notion PRD found for this component change. Component implements require their PRD (the polling bot creates it). Use the PRD-notification thread, or ask the designer to paste the PRD link, before implementing.",
    });
  }

  const result = await repositoryDispatch(env, "implement-figma-changes", {
    component,
    notes,
    thread_ts: slack.threadTs,
    channel: slack.channel,
    message_ts: slack.userMsgTs,
    // The PRD (required) — from the polling-bot notification in the thread root,
    // or pasted by the designer. The workflow fetches its content and feeds it
    // to Claude during code generation — same behavior v1 had via Pipedream.
    notion_prd_id: notionPrdId,
    notion_prd_url: notionPrdUrl,
  });

  if (!result.ok) {
    return JSON.stringify({
      ok: false,
      status: "dispatch_failed",
      detail: `GitHub returned ${result.status}`,
    });
  }
  return JSON.stringify({
    ok: true,
    status: "dispatched",
    message: `figma-implement.yml triggered for ${component}. The workflow will post the draft PR link in this thread when ready.`,
  });
}
