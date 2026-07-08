// Dispatch the marketplace-edit workflow (currently a stub — real workflow
// is a v2.x deliverable).

import type { Env } from "../types";
import { repositoryDispatch } from "./github-dispatch";
import type { SlackContext } from "./dispatcher";

export async function executeMarketplaceEdit(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const id = typeof input.id === "string" ? input.id : "";
  const fields = (input.fields ?? null) as Record<string, unknown> | null;
  if (!id || !fields) {
    return JSON.stringify({ ok: false, error: "missing 'id' or 'fields' in input" });
  }

  const result = await repositoryDispatch(env, "marketplace-edit", {
    id,
    fields,
    thread_ts: slack.threadTs,
    channel: slack.channel,
    message_ts: slack.userMsgTs,
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
    message: `marketplace-edit workflow triggered for prototype ${id}. The workflow will post the draft PR link in this thread when ready.`,
  });
}
