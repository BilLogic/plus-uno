// Where the deployed Worker lives — one definition, so moving it is one edit.
//
// The host was written out in five places: two eval workflows, the deploy's
// health check, and two script doc-comments. Moving the Worker to another
// Cloudflare account (#288) therefore meant finding all of them under time
// pressure, with the bot down, and a miss is silent — an eval run that scores
// the OLD deployment reports a clean pass against the wrong Worker, which is
// the class of failure #249 already cost this repo once.
//
// So: the default lives here, and every consumer either imports it or reads
// UNO_BOT_WORKER_URL. `scripts/check-worker-host.mjs` holds it to that.
//
// NOT the Slack OAuth redirect URI. That one stays a literal in wrangler.toml
// because Slack matches it against what is registered on the app, so it has to
// change in lockstep with Slack's own config and cannot be derived here.

/** The production Worker's origin. No trailing slash. */
export const DEFAULT_WORKER_ORIGIN = "https://uno-bot.plus-uno.workers.dev";

/**
 * The Worker origin for this process.
 *
 * `UNO_BOT_WORKER_URL` overrides it — a repo variable in CI, an env var
 * locally, and the switch that makes #288's cutover a setting rather than a
 * commit. A trailing slash is tolerated because a copy-pasted dashboard URL
 * has one, and `${origin}/health` would otherwise ask for `//health`.
 *
 * @param {Record<string, string|undefined>} [env]
 * @returns {string} origin, no trailing slash
 */
export function workerOrigin(env = process.env) {
  const raw = env.UNO_BOT_WORKER_URL?.trim();
  if (!raw) return DEFAULT_WORKER_ORIGIN;

  // Rejected here, loudly, rather than concatenated onto. The value people have
  // in hand at cutover is whatever the Cloudflare dashboard showed them, which
  // may well carry a path: `${origin}/health` then polls `/health/health`, the
  // 404 reads as "unreachable" to the deploy check, and the run fails two and a
  // half minutes later saying the worker never served the build — a sentence
  // that points at the deploy instead of at the setting.
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `UNO_BOT_WORKER_URL must be an absolute origin like https://uno-bot.example.workers.dev, got ${JSON.stringify(raw)}`,
    );
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`UNO_BOT_WORKER_URL must be http(s), got ${JSON.stringify(raw)}`);
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(
      `UNO_BOT_WORKER_URL is an origin, not a URL with a path — drop everything after the host: got ${JSON.stringify(raw)}`,
    );
  }
  return url.origin;
}

/**
 * A path on the Worker.
 *
 * @param {string} path e.g. "/health"
 * @param {Record<string, string|undefined>} [env]
 */
export function workerUrl(path, env = process.env) {
  return `${workerOrigin(env)}${path.startsWith("/") ? path : `/${path}`}`;
}
