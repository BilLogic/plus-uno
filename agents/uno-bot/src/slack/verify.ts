// HMAC-SHA256 signature verification per
// https://api.slack.com/authentication/verifying-requests-from-slack
//
// Slack signs every request with v0:{timestamp}:{body} using the signing
// secret. We re-compute and constant-time compare. We also reject anything
// older than 5 minutes to defeat replay attacks.

const MAX_SKEW_SECONDS = 60 * 5;

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

export async function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string,
): Promise<VerifyResult> {
  if (!timestamp || !signature) {
    return { ok: false, reason: "missing signature headers" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "non-numeric timestamp" };
  }
  const skew = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skew > MAX_SKEW_SECONDS) {
    return { ok: false, reason: `timestamp skew ${skew}s exceeds ${MAX_SKEW_SECONDS}s` };
  }

  const basestring = `v0:${timestamp}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const macBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(basestring)),
  );
  const expected = `v0=${toHex(macBytes)}`;

  return constantTimeEqual(expected, signature)
    ? { ok: true }
    : { ok: false, reason: "signature mismatch" };
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
