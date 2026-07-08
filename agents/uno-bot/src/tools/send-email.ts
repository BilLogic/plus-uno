// send_email executor (D6 connector). Sends an email via Gmail after the
// confirmation gate, then documents the outcome back in the thread (message id
// + recipients) so the bot never claims it sent something it didn't.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { sendGmailMessage } from "../integrations/gmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asAddressList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  if (typeof v === "string") return v.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function executeSendEmail(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const to = asAddressList(input.to);
  const cc = asAddressList(input.cc);
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const body = typeof input.body === "string" ? input.body : "";

  const badAddrs = [...to, ...cc].filter((a) => !EMAIL_RE.test(a));
  if (!to.length) return JSON.stringify({ ok: false, error: "no valid recipient in 'to'" });
  if (!subject) return JSON.stringify({ ok: false, error: "missing 'subject'" });
  if (!body.trim()) return JSON.stringify({ ok: false, error: "missing 'body'" });
  if (badAddrs.length) {
    return JSON.stringify({ ok: false, error: `invalid email address(es): ${badAddrs.join(", ")}` });
  }

  try {
    const sent = await sendGmailMessage(env, { to, subject, body, cc: cc.length ? cc : undefined });
    const recipients = [...to, ...cc].join(", ");
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:email: Sent — *${subject}* to ${recipients}.`,
    });
    return JSON.stringify({
      ok: true,
      status: "sent",
      message_id: sent.id,
      to,
      cc,
      message: `Email '${subject}' sent to ${recipients}.`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't send that email — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "gmail_failed", detail });
  }
}
