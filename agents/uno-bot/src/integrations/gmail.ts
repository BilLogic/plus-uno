// Worker-safe Gmail sender (D6 connector). Sends mail as the configured sender
// using an OAuth2 refresh token (offline access). No SDK — just two fetches:
//   1. exchange the refresh token for a short-lived access token
//   2. POST a base64url-encoded RFC-2822 message to the Gmail send endpoint
//
// Config (all secrets, see wrangler.toml):
//   GMAIL_SENDER         the "From" address (must be the authorized mailbox)
//   GMAIL_CLIENT_ID      OAuth client id
//   GMAIL_CLIENT_SECRET  OAuth client secret
//   GMAIL_REFRESH_TOKEN  refresh token with https://www.googleapis.com/auth/gmail.send

import type { Env } from "../types";
import { countedFetch } from "../net";
import { markdownToEmail } from "./email-render";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const REQUEST_TIMEOUT_MS = 10000;

export interface EmailInput {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
}

export interface SentEmail {
  id: string;
  threadId?: string;
}

function assertConfigured(env: Env): void {
  const missing = (
    ["GMAIL_SENDER", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"] as const
  ).filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Gmail not configured — missing ${missing.join(", ")}`);
  }
}

async function getAccessToken(env: Env, signal: AbortSignal): Promise<string> {
  const res = await countedFetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID!,
      client_secret: env.GMAIL_CLIENT_SECRET!,
      refresh_token: env.GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    signal,
  });
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Gmail auth ${res.status}: ${data.error_description ?? data.error ?? "no access token"}`);
  }
  return data.access_token;
}

// UTF-8-safe base64 for a MIME part body.
function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// UTF-8-safe base64url for the raw MIME message (Gmail's `raw` field).
function base64UrlEncode(input: string): string {
  return base64Encode(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * A base64 part body, wrapped at 76 characters.
 *
 * This also closes a latent bug that predates the Markdown work: parts were
 * sent as `7bit` with the body inline, and RFC 5322 caps a line at 998
 * characters. A single long Markdown paragraph — routine in a PRD summary —
 * exceeds that, and a strict receiving MTA may reject or mangle the message.
 * Base64 has no long lines and carries UTF-8 exactly, so the declared encoding
 * is finally true of the bytes.
 */
function base64Part(input: string): string {
  return (base64Encode(input).match(/.{1,76}/g) ?? []).join("\r\n");
}

// RFC 2822-encode the Subject header so non-ASCII survives (=?UTF-8?B?…?=).
function encodeHeader(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${base64UrlEncode(value).replace(/-/g, "+").replace(/_/g, "/")}?=`;
}

/**
 * `multipart/alternative` — the same body as plain text and as HTML.
 *
 * The body arrives as Markdown (the one dialect the model writes, 2026-08-22).
 * Until then it was posted as `text/plain` with no conversion at all, so an
 * external recipient — an SME, a stakeholder receiving a PRD summary — got
 * literal `**bold**` and `[label](url)`. They are the readers least equipped
 * to guess what that meant.
 *
 * Both parts are sent rather than HTML alone: the client picks, plain text is
 * what a text-only reader and most accessibility tooling take, and the ordering
 * below is what the RFC requires — least-rich part FIRST, so a client that
 * understands both lands on the HTML.
 */
export function buildMime(from: string, input: EmailInput, boundary: string): string {
  const { text, html } = markdownToEmail(input.body);
  const headers = [
    `From: ${from}`,
    `To: ${input.to.join(", ")}`,
    input.cc?.length ? `Cc: ${input.cc.join(", ")}` : "",
    `Subject: ${encodeHeader(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

  const part = (contentType: string, body: string) =>
    [
      `--${boundary}`,
      `Content-Type: ${contentType}; charset="UTF-8"`,
      "Content-Transfer-Encoding: base64",
      "",
      base64Part(body),
    ].join("\r\n");

  return [
    headers.join("\r\n"),
    "",
    part("text/plain", text),
    part("text/html", html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/**
 * Send an email via Gmail. Throws on any failure (caller surfaces to Slack).
 */
export async function sendGmailMessage(env: Env, input: EmailInput): Promise<SentEmail> {
  assertConfigured(env);
  if (!input.to.length) throw new Error("no recipient address");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const accessToken = await getAccessToken(env, controller.signal);
    // A boundary must not occur inside either part. Both parts are base64,
    // whose alphabet excludes "=" and "_", so this cannot collide.
    const boundary = `==_uno_${crypto.randomUUID()}_==`;
    const raw = base64UrlEncode(buildMime(env.GMAIL_SENDER!, input, boundary));
    const res = await countedFetch(SEND_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw }),
      signal: controller.signal,
    });
    const data = (await res.json()) as { id?: string; threadId?: string; error?: { message?: string } };
    if (!res.ok || !data.id) {
      throw new Error(`Gmail send ${res.status}: ${data.error?.message ?? "send failed"}`);
    }
    return { id: data.id, threadId: data.threadId };
  } finally {
    clearTimeout(timer);
  }
}
