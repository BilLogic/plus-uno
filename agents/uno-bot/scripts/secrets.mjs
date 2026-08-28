// What this Worker needs set, and why — one declaration.
//
// The list used to be a prose comment in wrangler.toml. Measured against the
// live Worker on 2026-08-28, the comment named four Gmail secrets that are not
// set and missed two that are: ANTHROPIC_API_KEY, which src/vertex/claude.ts:6
// says outright is not involved, and SUPABASE_MCP_TOKEN, which appears nowhere
// in src/. Two live credentials nobody could account for — and #288 moves this
// Worker to another Cloudflare account, where whoever does the move works from
// exactly that list.
//
// So the list lives here, `check:secrets` holds the code and wrangler.toml to
// it offline, and `npm run secrets:audit` compares it to what is actually set.
//
// This file never holds a VALUE. Cloudflare stores secrets write-only — the
// dashboard shows "Value encrypted" and `wrangler secret list` returns names —
// so no tool here can read one back, by design.

/**
 * @typedef {object} Secret
 * @property {string} name
 * @property {boolean} required  the Worker cannot do its job without it
 * @property {boolean} [forbidden] it must NOT be set on the Worker
 * @property {boolean} [multiline] the value spans lines (a PEM), so it is piped
 *   from a file rather than typed at a prompt that cannot echo it back
 * @property {string} why  what breaks, in one line, for whoever is setting it
 */

/** @type {Secret[]} */
export const SECRETS = [
  {
    name: "SLACK_SIGNING_SECRET",
    required: true,
    why: "verifies the signature on every incoming Slack request. Unset, the Worker cannot tell Slack from anyone else and rejects the lot.",
  },
  {
    name: "SLACK_BOT_TOKEN",
    required: true,
    why: "xoxb- token for chat.postMessage, reactions.add and threaded replies. Unset, the bot reads and never answers.",
  },
  {
    name: "GITHUB_TOKEN",
    required: true,
    why: "PAT with repo:dispatch + Contents:Read. Powers component_implement / prototype_scaffold, which dispatch workflows in BilLogic/plus-uno.",
  },
  {
    name: "FIGMA_ACCESS_TOKEN",
    required: true,
    why: "Figma read PAT. Two consumers: the proposal screenshot fetch in events.ts, and the library poll's component/version reads on the cron.",
  },
  {
    name: "NOTION_API_KEY",
    required: true,
    why: "Notion internal integration token — notion_create/update/archive plus every notion_search catalog read. Each database must also be shared with the integration.",
  },
  {
    name: "GEMINI_SA_EMAIL",
    required: true,
    why: "Vertex service-account client_email. Canonical model credential per ADR-018, and shared by BOTH the Gemini-Vertex and Vertex-Claude lanes — unset, the bot cannot think.",
  },
  {
    name: "GEMINI_SA_PRIVATE_KEY",
    required: true,
    multiline: true,
    why: "the matching private_key, full PEM including the BEGIN/END lines and its newlines. The half of the pair that is easiest to paste wrong.",
  },
  {
    name: "DEBUG_TOKEN",
    required: true,
    why: "gates /debug/*, sent as x-debug-token. Unset those routes 404 — which is safe, but both eval workflows drive the Worker through them and would score nothing.",
  },
  {
    name: "SLACK_MCP_CLIENT_SECRET",
    required: false,
    why: "client secret for the static Slack OAuth client whose id is SLACK_MCP_CLIENT_ID in [vars]. Unset, slack_search reports \"not configured\" and the rest of the bot is unaffected.",
  },
  {
    name: "SUPABASE_ANON_KEY",
    required: false,
    why: "read-only anon key for the uno-blueprint project. Unset, search_blueprint reports \"not configured\" and the bot falls back to cited docs rather than fabricating.",
  },
  {
    name: "GMAIL_SENDER",
    required: false,
    why: "authorized From mailbox for email_send. The whole Gmail lane is off unless all four GMAIL_* are set; send_email then fails gracefully.",
  },
  {
    name: "GMAIL_CLIENT_ID",
    required: false,
    why: "Gmail OAuth client id. See GMAIL_SENDER — all four or none.",
  },
  {
    name: "GMAIL_CLIENT_SECRET",
    required: false,
    why: "Gmail OAuth client secret. See GMAIL_SENDER — all four or none.",
  },
  {
    name: "GMAIL_REFRESH_TOKEN",
    required: false,
    why: "Gmail OAuth refresh token. See GMAIL_SENDER — all four or none.",
  },
  {
    name: "GEMINI_API_KEY",
    required: false,
    forbidden: true,
    why: "AI Studio key — must NOT be set on the Worker (ADR-018, 2026-07-16). The Vertex SA above is canonical and takes precedence whenever fully set; this key is a local-dev fallback for the Gemini lane only and cannot reach Claude at all.",
  },
];

/** @returns {string[]} declared names, in declaration order. */
export const secretNames = () => SECRETS.map((s) => s.name);

/**
 * The live Worker against the declaration.
 *
 * @param {string[]} liveNames from `wrangler secret list` — names only; Cloudflare
 *   does not return values to anyone.
 * @returns {{present: string[], missing: string[], optionalUnset: string[],
 *   undeclared: string[], forbidden: string[]}}
 */
export function classify(liveNames) {
  const live = new Set(liveNames);
  const byName = new Map(SECRETS.map((s) => [s.name, s]));

  const present = [];
  const missing = [];
  const optionalUnset = [];
  const forbidden = [];

  for (const s of SECRETS) {
    if (s.forbidden) {
      // Set-when-it-must-not-be is the finding. Absent is the pass, and it is
      // not "optionally unset" — nobody should ever be prompted for it.
      if (live.has(s.name)) forbidden.push(s.name);
      continue;
    }
    if (live.has(s.name)) present.push(s.name);
    else if (s.required) missing.push(s.name);
    else optionalUnset.push(s.name);
  }

  // Anything set that this repo cannot explain. Not a style nit: an undeclared
  // credential still grants whatever it grants, still needs rotating, and gets
  // copied to the new account by anyone working from the list (#288).
  const undeclared = liveNames.filter((n) => !byName.has(n)).sort();

  return { present, missing, optionalUnset, undeclared, forbidden };
}

/**
 * The names out of `wrangler secret list`.
 *
 * Wrangler prints a version banner above the payload, so the JSON does not
 * start at byte zero. It throws rather than returning [] on anything it cannot
 * read: an empty list means "this Worker has no secrets", and letting a failed
 * command say that would tell whoever is running the setter to re-enter all
 * fifteen — or tell the audit a Worker it never reached is clean.
 *
 * @param {string} stdout
 * @returns {string[]}
 */
export function parseSecretList(stdout) {
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  let parsed;
  if (start !== -1 && end > start) {
    try {
      parsed = JSON.parse(stdout.slice(start, end + 1));
    } catch {
      parsed = undefined;
    }
  }
  if (!Array.isArray(parsed) || parsed.some((e) => typeof e?.name !== "string")) {
    throw new Error(
      `could not parse the secret list from wrangler. Raw output:\n${stdout.trim() || "(empty)"}`,
    );
  }
  return parsed.map((e) => e.name);
}

/**
 * Names assigned in wrangler.toml's `[vars]` table.
 *
 * `[vars]` is committed. A secret that lands there is a secret published to
 * GitHub, so `check:secrets` refuses any overlap with the declaration above.
 *
 * @param {string} toml
 * @returns {string[]}
 */
export function varsInWrangler(toml) {
  const names = [];
  let inVars = false;
  for (const line of toml.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[")) {
      // Any new table ends [vars]. Scanning on would attribute a later
      // section's keys to it — noise. Stopping early is the dangerous
      // direction: a real secret in [vars] would go unnoticed forever.
      inVars = trimmed === "[vars]";
      continue;
    }
    if (!inVars || trimmed.startsWith("#") || !trimmed) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(trimmed);
    if (m) names.push(m[1]);
  }
  return names;
}

/**
 * Member names of `interface Env` in src/types.ts.
 *
 * A secret the interface does not declare is a secret the Worker cannot read:
 * it would sit on the deployment costing nothing but a rotation obligation.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function envInterfaceNames(source) {
  const start = source.indexOf("export interface Env {");
  if (start === -1) return [];
  const end = source.indexOf("\n}", start);
  const body = source.slice(start, end === -1 ? undefined : end);
  const names = [];
  for (const line of body.split("\n").slice(1)) {
    const m = /^\s{2}([A-Za-z_][A-Za-z0-9_]*)\??\s*:/.exec(line);
    if (m) names.push(m[1]);
  }
  return names;
}

const BLOCK_START = "# Secrets are set via `npm run secrets:set` (or `wrangler secret put`).";
const BLOCK_END = "# END GENERATED SECRETS";

/**
 * The wrangler.toml comment block, generated from the declaration.
 *
 * It stays in the file because that is where someone reading the config looks
 * for it. It is generated because the hand-maintained version drifted from the
 * live Worker in both directions.
 *
 * @returns {string}
 */
export function expectedBlock() {
  const lines = [
    BLOCK_START,
    "# GENERATED from scripts/secrets.mjs — edit there, then `npm run check:secrets -- --fix`.",
    "#",
  ];
  const wrap = (text, indent) => {
    const out = [];
    let line = "";
    for (const word of text.split(" ")) {
      if (line && `${line} ${word}`.length > 74 - indent.length) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) out.push(line);
    return out;
  };
  for (const s of SECRETS) {
    const tag = s.forbidden ? " [DO NOT SET]" : s.required ? "" : " [optional]";
    lines.push(`#   ${s.name}${tag}`);
    for (const l of wrap(s.why, "#       ")) lines.push(`#       ${l}`);
  }
  lines.push(BLOCK_END);
  return lines.join("\n");
}

/**
 * The block as it currently stands in wrangler.toml.
 *
 * @param {string} toml
 * @returns {string|null} null when there is no block at all — which is a
 *   different problem from a stale one, and gets a different message.
 */
export function readExpectedBlock(toml) {
  const start = toml.indexOf(BLOCK_START);
  if (start === -1) return null;
  const end = toml.indexOf(BLOCK_END, start);
  if (end === -1) return null;
  return toml.slice(start, end + BLOCK_END.length);
}
