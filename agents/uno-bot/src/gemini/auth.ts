// Google service-account OAuth for Cloudflare Workers — no google-auth-library
// (Node-only). Mints an access token by signing a JWT with the service
// account's RSA key via WebCrypto and exchanging it at the token endpoint.
// Tokens live ~1h; cached in-memory per isolate with a 5-min safety margin.
//
// Two auth modes for Gemini (provider adapter, 2026-07-10; precedence flipped
// 2026-07-16 — Vertex SA is canonical and wins whenever set, see client.ts):
//   GEMINI_SA_* secrets set   → Vertex AI with this OAuth flow (production path).
//   GEMINI_API_KEY only       → Developer API, plain key header, this file unused.

import type { Env } from "../types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const SAFETY_MS = 5 * 60_000;

let cached: { token: string; expiresAt: number } | null = null;

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s/g, "");
  const raw = atob(body);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

export async function getGoogleAccessToken(env: Env): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - SAFETY_MS) return cached.token;
  if (!env.GEMINI_SA_EMAIL || !env.GEMINI_SA_PRIVATE_KEY) {
    throw new Error("service-account auth not configured (GEMINI_SA_EMAIL / GEMINI_SA_PRIVATE_KEY)");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: env.GEMINI_SA_EMAIL,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const signingInput = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(env.GEMINI_SA_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(new Uint8Array(sig))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`google token exchange failed (${res.status}): ${data.error ?? ""} ${data.error_description ?? ""}`);
  }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}
