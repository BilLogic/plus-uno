// Google service-account auth and the Vertex generateContent call, ported from
// agents/uno-bot/src/gemini/auth.ts and client.ts (vertexBase / geminiEndpoint)
// with Node's built-in crypto. Vertex service account only: no API-key path
// (docs/adr/ADR-018).

import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const SAFETY_MS = 5 * 60_000;
const DEFAULT_MODEL = 'gemini-3.8-flash';

const base64url = (value) => Buffer.from(value).toString('base64url');

/** A key pasted into an env var may carry literal `\n` escapes. */
const normalizeKey = (pem) => String(pem).replace(/\\n/g, '\n');

/** `() => Promise<accessToken>`, cached in memory until five minutes before it expires. */
export const createTokenSource = ({ env, fetch = globalThis.fetch, now = Date.now }) => {
    let cached = null;
    return async () => {
        if (cached && now() < cached.expiresAt - SAFETY_MS) return cached.token;
        if (!env.GEMINI_SA_EMAIL || !env.GEMINI_SA_PRIVATE_KEY) {
            throw new Error('service-account auth not configured (GEMINI_SA_EMAIL / GEMINI_SA_PRIVATE_KEY)');
        }
        const iat = Math.floor(now() / 1000);
        const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const claims = base64url(JSON.stringify({
            iss: env.GEMINI_SA_EMAIL, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600,
        }));
        const signingInput = `${header}.${claims}`;
        const signature = createSign('RSA-SHA256').update(signingInput).sign(normalizeKey(env.GEMINI_SA_PRIVATE_KEY));
        const jwt = `${signingInput}.${base64url(signature)}`;

        const res = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.access_token) {
            throw new Error(`google token exchange failed (${res.status}): ${data.error ?? ''} ${data.error_description ?? ''}`.trim());
        }
        cached = { token: data.access_token, expiresAt: now() + (data.expires_in ?? 3600) * 1000 };
        return cached.token;
    };
};

/** Vertex generateContent URL: region `global` (override GEMINI_REGION), project GEMINI_PROJECT_ID. */
export const vertexEndpoint = (env) => {
    const region = env.GEMINI_REGION ?? 'global';
    const host = region === 'global' ? 'aiplatform.googleapis.com' : `${region}-aiplatform.googleapis.com`;
    const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;
    return `https://${host}/v1/projects/${env.GEMINI_PROJECT_ID ?? ''}/locations/${region}/publishers/google/models/${model}:generateContent`;
};

/** One non-streaming call. Never throws: `{ ok, status?, text? , error? }`. */
export const callVertex = async ({ env, fetch = globalThis.fetch, token, system, contents, maxOutputTokens }) => {
    try {
        const res = await fetch(vertexEndpoint(env), {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: system }] },
                generationConfig: { maxOutputTokens },
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}: ${data.error?.message ?? 'unknown'}`.slice(0, 300) };
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('');
        return { ok: true, status: res.status, text };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
};
