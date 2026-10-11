// `reminder_set` — "remind me Thu to review the PRD", kept in the turn.
//
// Ungated: it writes only uno-bot's own record of the reminder, which nobody
// else sees until the morning run posts it back where it was asked, to the
// asker alone. The reading of the time and the row are the commitments
// module's (`commitments/remind.ts`); this is where the turn's facts meet it.
import type { Env, SlackContext } from "../types";
import { rethrowIfBudget } from "../net";
import { channelKindFor, setSelfReminder } from "../commitments/remind";
import { commitmentStoreFor } from "../commitments/store-env";

export async function executeReminderSet(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const store = commitmentStoreFor(env);
  if (!store) return JSON.stringify({ ok: false, error: "reminders are not available on this Worker (USAGE_DB or HARNESS_KV not bound)" });
  if (!slack.requestedBy) return JSON.stringify({ ok: false, error: "no asker on this turn to remind" });
  // An ask made outside Slack (a Figma comment) has no thread to remind in.
  if (!slack.threadTs) return JSON.stringify({ ok: false, error: "reminders are set from a Slack conversation; this ask has no thread to remind in" });
  try {
    const result = await setSelfReminder(
      { when: input.when, what: input.what },
      {
        channel: slack.channel,
        channelKind: channelKindFor(slack.channel, slack.conversationType),
        threadTs: slack.threadTs,
        messageTs: slack.userMsgTs,
        userId: slack.requestedBy,
      },
      { store, unoBot: env.UNO_BOT_CHANNEL_ID?.trim() || undefined, now: () => Date.now() },
    );
    if (result.ok) return JSON.stringify({ ...result, instruction: "Reply with exactly the confirm line and nothing else." });
    if ("ask" in result) return JSON.stringify({ ...result, instruction: "Nothing was set. Ask exactly this one question, then call reminder_set again with the answer." });
    return JSON.stringify(result);
  } catch (err) {
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
