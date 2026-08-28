// The two things that talk to Cloudflare about secrets, and the check that has
// to happen before either does.
//
// Kept apart from secrets.mjs so that file stays pure and testable. Nothing
// here reads a value back — Cloudflare will not return one. `wrangler secret
// list` answers with names, the dashboard says "Value encrypted", and that is
// the whole story: a secret that is set can be replaced or deleted, never read.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSecretList } from "./secrets.mjs";

/**
 * Every wrangler call runs here, never in the caller's cwd.
 *
 * wrangler reads wrangler.toml from its working directory. Run from anywhere
 * else it has no Worker name and — the part that matters while credentials are
 * being typed — no `account_id`, which is pinned in that file precisely because
 * two Cloudflare accounts are visible to the team's logins. Inheriting cwd made
 * `node agents/uno-bot/scripts/audit-secrets.mjs` from the repo root fail with
 * "Required Worker name missing", and would have made a write ambiguous about
 * which account it landed in.
 */
const BOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Wrangler's floor. Checked before anything else asks for typing. */
export const MIN_NODE_MAJOR = 22;

/**
 * Refuse early rather than at the end.
 *
 * `wrangler` exits immediately on Node < 22. Discovering that AFTER someone has
 * typed eight secrets at a prompt they cannot see is the failure worth
 * preventing, so this runs before the first question rather than at the first
 * write.
 *
 * @param {string} [version] process.version, injectable for the test
 * @returns {string|null} the remedy to print, or null when the version is fine
 */
export function nodeTooOld(version = process.version) {
  const major = Number(/^v(\d+)/.exec(version)?.[1]);
  if (Number.isFinite(major) && major < MIN_NODE_MAJOR) {
    return (
      `wrangler needs Node >= ${MIN_NODE_MAJOR}; this is ${version}.\n` +
      "  -> nvm use 22   (the deploy workflow pins 22 for the same reason)"
    );
  }
  return null;
}

/**
 * The names currently set on the Worker.
 *
 * @param {(cmd: string, args: string[]) => {status: number|null, stdout: string, stderr: string}} [run]
 * @returns {string[]}
 */
export function liveSecretNames(run = defaultRun) {
  const r = run("npx", ["wrangler", "secret", "list"]);
  if (r.status !== 0) {
    throw new Error(
      `\`wrangler secret list\` failed (exit ${r.status}).\n${(r.stderr || r.stdout || "").trim()}`,
    );
  }
  return parseSecretList(r.stdout);
}

/**
 * Write one secret, taking the value on stdin.
 *
 * The value goes to the child process directly. It is never an argv entry —
 * argv is visible to `ps` for every user on the machine and lands in shell
 * history — and it is never written to a file.
 *
 * @param {string} name
 * @param {string} value
 * @param {(cmd: string, args: string[], input: string) => {status: number|null, stdout: string, stderr: string}} [run]
 */
export function putSecret(name, value, run = defaultRunWithInput) {
  const r = run("npx", ["wrangler", "secret", "put", name], value);
  if (r.status !== 0) {
    // Deliberately does NOT include stdout/stderr interpolated with the value.
    // Wrangler does not echo it, and neither does this.
    throw new Error(`setting ${name} failed (exit ${r.status}). ${(r.stderr || "").trim()}`);
  }
}

const defaultRun = (cmd, args) =>
  spawnSync(cmd, args, { encoding: "utf8", cwd: BOT_DIR, maxBuffer: 1 << 24 });

const defaultRunWithInput = (cmd, args, input) =>
  spawnSync(cmd, args, { encoding: "utf8", cwd: BOT_DIR, input, maxBuffer: 1 << 24 });
