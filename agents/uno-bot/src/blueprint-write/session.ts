// uno-bot's own session on the uno-blueprint project: the write identity.
//
// An ordinary Auth user (`SUPABASE_WRITE_EMAIL`, password in the secret
// `SUPABASE_WRITE_PASSWORD`) whose `app_metadata.role` is `rpc_writer`: its
// JWT passes the guard inside every SECURITY DEFINER authoring RPC and no
// table's write policy, and deletes under it are refused by a trigger
// (plus-uno-blueprint `20261015120000`). Never the service-role key.
//
// The password grant mints a one-hour JWT. It is held per isolate and reused
// until a minute before it lapses, so sign-in costs one subrequest an hour at
// most rather than one per approval.

import { countedFetch } from "../net";

/** The fields of `Env` the write identity reads. */
export interface WriteIdentityEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_WRITE_EMAIL?: string;
  SUPABASE_WRITE_PASSWORD?: string;
}

/** Re-sign this long before the token lapses, so no write races its expiry. */
const EXPIRY_MARGIN_MS = 60_000;
/** Each RPC is one statement on a small table; a minute is a hung socket. */
const RPC_TIMEOUT_MS = 30_000;

let held: { email: string; token: string; until: number } | null = null;

/** Drop the held token — the next write signs in again. */
export function forgetBlueprintSession(): void {
  held = null;
}

/** What is missing before the Worker can write, or null when it can. */
export function writeIdentityGap(env: WriteIdentityEnv): string | null {
  const missing = (["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_WRITE_EMAIL", "SUPABASE_WRITE_PASSWORD"] as const).filter(
    (k) => !env[k]?.trim(),
  );
  return missing.length ? `${missing.join(", ")} not set — uno-bot has no blueprint write identity` : null;
}

/** Subrequests the next write will spend on signing in: 0 with a live token. */
export function signInCalls(env: WriteIdentityEnv, now: number = Date.now()): number {
  return held && held.email === env.SUPABASE_WRITE_EMAIL && now < held.until ? 0 : 1;
}

async function token(env: Required<WriteIdentityEnv>, now: number): Promise<string> {
  if (held && held.email === env.SUPABASE_WRITE_EMAIL && now < held.until) return held.token;
  const res = await countedFetch(
    `${env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: env.SUPABASE_ANON_KEY, "content-type": "application/json" },
      body: JSON.stringify({ email: env.SUPABASE_WRITE_EMAIL, password: env.SUPABASE_WRITE_PASSWORD }),
    },
    RPC_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`uno-bot could not sign in to the blueprint (${res.status})`);
  const body = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("uno-bot's sign-in returned no token");
  held = {
    email: env.SUPABASE_WRITE_EMAIL,
    token: body.access_token,
    until: now + (body.expires_in ?? 3600) * 1000 - EXPIRY_MARGIN_MS,
  };
  return held.token;
}

/**
 * The authoring-RPC caller for uno-bot's write identity: `POST
 * /rest/v1/rpc/<fn>` under its own JWT. A non-2xx answer throws with the
 * database's message.
 *
 * @param env - The write identity's config; check `writeIdentityGap` first
 */
export function blueprintRpcFor(env: WriteIdentityEnv) {
  const config = env as Required<WriteIdentityEnv>;
  return async (fn: string, args: Record<string, unknown>): Promise<unknown> => {
    const jwt = await token(config, Date.now());
    const res = await countedFetch(
      `${config.SUPABASE_URL}/rest/v1/rpc/${fn}`,
      {
        method: "POST",
        headers: { apikey: config.SUPABASE_ANON_KEY, authorization: `Bearer ${jwt}`, "content-type": "application/json" },
        body: JSON.stringify(args),
      },
      RPC_TIMEOUT_MS,
    );
    const text = await res.text();
    if (!res.ok) {
      let reason = text;
      try {
        reason = (JSON.parse(text) as { message?: string }).message ?? text;
      } catch {
        /* the raw body is the reason */
      }
      throw new Error(`${fn} refused (${res.status}): ${reason}`);
    }
    return text ? JSON.parse(text) : null;
  };
}
