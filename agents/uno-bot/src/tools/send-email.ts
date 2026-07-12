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

function csv(v: string | undefined): string[] {
  return (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Authorization beyond the requester-identity gate: an optional allowlist of
// Slack users who may trigger outward email, and an optional allowlist of
// recipient domains. Unset lists mean "no restriction" (legacy behavior) so
// this is safe to enable incrementally. Returns an error string, or null if OK.
function checkEmailAuthorization(env: Env, requestedBy: string | undefined, recipients: string[]): string | null {
  const users = csv(env.EMAIL_AUTHORIZED_USERS);
  if (users.length && !(requestedBy && users.includes(requestedBy.toLowerCase()))) {
    return "outward email isn't enabled for you — ask an admin to add you to the email allowlist, or send it yourself.";
  }
  const domains = csv(env.EMAIL_ALLOWED_DOMAINS);
  if (domains.length) {
    const offending = recipients.filter((addr) => {
      const at = addr.lastIndexOf("@");
      const domain = at >= 0 ? addr.slice(at + 1).toLowerCase() : "";
      return !domains.some((d) => domain === d || domain.endsWith("." + d));
    });
    if (offending.length) {
      return `these recipients are outside the approved domains (${domains.join(", ")}): ${offending.join(", ")}`;
    }
  }
  return null;
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

  const authError = checkEmailAuthorization(env, slack.requestedBy, [...to, ...cc]);
  if (authError) {
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:no_entry: Didn't send — ${authError}`,
    });
    return JSON.stringify({ ok: false, status: "not_authorized", error: authError });
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
