// Dispatch the marketplace-add workflow (currently a stub — real workflow
// is a v2.x deliverable; the stub logs the payload + replies in-thread).

import type { Env } from "../types";
import { repositoryDispatch } from "./github-dispatch";
import type { SlackContext } from "./dispatcher";

export async function executeMarketplaceAdd(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const metadata = (input.metadata ?? null) as Record<string, unknown> | null;
  if (!metadata) {
    return JSON.stringify({ ok: false, error: "missing 'metadata' in input" });
  }

  const result = await repositoryDispatch(env, "marketplace-add", {
    metadata,
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
    message:
      "marketplace-add workflow triggered. The workflow will post the draft PR link in this thread when ready.",
  });
}
