// The one gate for token-gated probes.
//
// Requires `DEBUG_TOKEN` to be configured AND matched by the `x-debug-token`
// header via a constant-time compare — an unconfigured token means the routes
// are simply closed (404), never open-by-default. Applied ONCE, by the module's
// router: it used to be the first line of every probe body, which is a rule
// thirteen call sites had to keep rather than a property of the module.
//
// Typed against the token alone, not `Env`, so this file stays free of Workers
// types and the Node test suite can exercise it directly.

/** Just the field this gate reads. `Env` satisfies it. */
export interface DebugTokenEnv {
  readonly DEBUG_TOKEN?: string | undefined;
}

/**
 * True when the request carries the configured debug token.
 *
 * @param request - The inbound request
 * @param env - Anything carrying `DEBUG_TOKEN`
 */
export function debugAuthorized(request: Request, env: DebugTokenEnv): boolean {
  const expected = env.DEBUG_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get("x-debug-token") ?? "";
  return timingSafeEqualStr(provided, expected);
}

/**
 * Constant-time string compare.
 *
 * @param a - One side
 * @param b - The other
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare over a fixed width so length itself doesn't leak via timing.
  let diff = ab.length ^ bb.length;
  const width = Math.max(ab.length, bb.length);
  for (let i = 0; i < width; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}
