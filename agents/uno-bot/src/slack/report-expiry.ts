// Expiry redraws run outside ThreadState, so Slack cannot call the owning
// Durable Object back through its own input gate. A failed edit stays pending
// and the alarm hands it over again, unless Slack's refusal is one no retry
// can change: then the redraw ends there.
import type { ThreadState } from "../thread-state/index";
import { reportMessage, type ReportMessage } from "./decision-cards";

/** Slack errors that say the message can never take the edit. */
const PERMANENT_SLACK_ERRORS = new Set([
  "message_not_found", "channel_not_found", "cant_update_message", "not_in_channel",
  "is_archived", "invalid_auth", "account_inactive",
]);

export async function redrawExpiredReport(messageTs: string, deps: {
  store: Pick<ThreadState, "prepareReportExpiry" | "acknowledgeReportExpiry">;
  edit(channel: string, ts: string, message: ReportMessage): Promise<void>;
}): Promise<void> {
  const edit = await deps.store.prepareReportExpiry(messageTs);
  if (!edit) return;
  try {
    await deps.edit(edit.report.channel, messageTs, reportMessage(edit.report));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    if (!PERMANENT_SLACK_ERRORS.has(reason)) throw err;
    console.error(`[slack] report expiry for ${messageTs} ended: ${reason}`);
  }
  await deps.store.acknowledgeReportExpiry(messageTs, edit.revision);
}
