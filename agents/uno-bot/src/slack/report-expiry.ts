// Expiry redraws run outside ThreadState, so Slack cannot call the owning
// Durable Object back through its own input gate. Failed edits stay pending.
import type { ThreadState } from "../thread-state/index";
import { reportMessage, type ReportMessage } from "./decision-cards";

export async function redrawExpiredReport(messageTs: string, deps: {
  store: Pick<ThreadState, "prepareReportExpiry" | "acknowledgeReportExpiry">;
  edit(channel: string, ts: string, message: ReportMessage): Promise<void>;
}): Promise<void> {
  const edit = await deps.store.prepareReportExpiry(messageTs);
  if (!edit) return;
  await deps.edit(edit.report.channel, messageTs, reportMessage(edit.report));
  await deps.store.acknowledgeReportExpiry(messageTs, edit.revision);
}
