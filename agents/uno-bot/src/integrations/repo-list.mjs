// @ts-check
// The GitHub repos uno-bot may reach, and the one resolver every GitHub tool
// goes through.
//
// The list is `GITHUB_REPOS`, a JSON array in wrangler.toml's [vars], changed
// only by PR. Each entry is
//
//   { "repo": "owner/name", "purpose": "what the repo is for", "workflows": [] }
//
// — `purpose` is the short phrase the persona routes on, and `workflows` names
// the workflow files that may be dispatched there (none yet). `GITHUB_REPO` is
// the default entry: a tool call that names no repo lands there, and an unset
// list is that one repo alone, so a Worker without the var behaves as it did
// before there was one.
//
// PLAIN JAVASCRIPT, ON PURPOSE. `check:secrets` parses the committed list with
// this same function, offline, and the harness runner imports that check into
// its own process from the repo root, where no TypeScript toolchain is loaded.
// One parser for both means a list the check passes is a list the Worker
// reads; `// @ts-check` above keeps it typed for the TypeScript that imports it.
//
// Nothing here fetches or reads `Env`: the Worker's binding is
// `resolveRepoFor` in `github.ts`.

/**
 * One listed repo.
 * @typedef {object} RepoEntry
 * @property {string} repo  `owner/name`, as the list spells it
 * @property {string} purpose  what the repo is for, in one short phrase
 * @property {readonly string[]} workflows  workflow files that may be dispatched
 */

/**
 * The parsed list: every entry, and the one a call naming no repo gets.
 * @typedef {object} RepoList
 * @property {RepoEntry} defaultEntry
 * @property {readonly RepoEntry[]} entries
 */

/**
 * What a tool's `repo` input resolves to: a listed repo — with whether it is
 * the default, `GITHUB_REPO`, which is the harness repo — or a refusal whose
 * text names the list.
 * @typedef {{ ok: true, entry: RepoEntry, isDefault: boolean } | { ok: false, error: string }} RepoResolution
 */

/** A list the Worker will not read. Thrown by `parseRepoList`, never at a
 *  caller of the resolver. */
export class RepoListError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "RepoListError";
  }
}

/** `owner/name` — GitHub's own alphabet for both halves. */
const REPO_NAME = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
/** A workflow file under `.github/workflows/`, by file name only. */
const WORKFLOW_FILE = /^[A-Za-z0-9._-]+\.ya?ml$/;
/** Long enough for "the service-blueprint app and its schema"; short enough to
 *  stay a phrase. */
const PURPOSE_MAX = 80;
const ENTRY_KEYS = ["repo", "purpose", "workflows"];

/** @param {string} repo */
const keyOf = (repo) => repo.toLowerCase();

/**
 * Parse and validate the list, once.
 *
 * An unset or blank `raw` is the default repo alone, with no purpose and no
 * workflows. Anything else must be a non-empty JSON array of entries with
 * exactly the three keys, no repo twice, and the default among them — a list
 * that leaves `GITHUB_REPO` out would make every call that names no repo a
 * refusal.
 *
 * @param {string | undefined} raw  the `GITHUB_REPOS` var
 * @param {string | undefined} defaultRepo  the `GITHUB_REPO` var
 * @returns {RepoList}
 * @throws {RepoListError}
 */
export function parseRepoList(raw, defaultRepo) {
  const fallback = typeof defaultRepo === "string" ? defaultRepo.trim() : "";
  if (!REPO_NAME.test(fallback)) {
    throw new RepoListError(`GITHUB_REPO must be owner/name; got ${JSON.stringify(defaultRepo ?? null)}`);
  }
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    const only = { repo: fallback, purpose: "", workflows: [] };
    return { defaultEntry: only, entries: [only] };
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch (err) {
    throw new RepoListError(`GITHUB_REPOS is not JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new RepoListError("GITHUB_REPOS must be a non-empty JSON array of { repo, purpose, workflows }");
  }

  /** @type {RepoEntry[]} */
  const entries = [];
  const seen = new Set();
  parsed.forEach((item, i) => {
    const at = `GITHUB_REPOS[${i}]`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new RepoListError(`${at} must be an object`);
    }
    const keys = Object.keys(item);
    const unknown = keys.filter((k) => !ENTRY_KEYS.includes(k));
    if (unknown.length) throw new RepoListError(`${at} has unknown keys: ${unknown.join(", ")}`);
    const missing = ENTRY_KEYS.filter((k) => !keys.includes(k));
    if (missing.length) throw new RepoListError(`${at} is missing: ${missing.join(", ")}`);

    const { repo, purpose, workflows } = /** @type {Record<string, unknown>} */ (item);
    if (typeof repo !== "string" || !REPO_NAME.test(repo)) {
      throw new RepoListError(`${at}.repo must be owner/name; got ${JSON.stringify(repo)}`);
    }
    if (seen.has(keyOf(repo))) throw new RepoListError(`${at}.repo lists ${repo} a second time`);
    seen.add(keyOf(repo));
    if (typeof purpose !== "string" || !purpose.trim() || purpose.length > PURPOSE_MAX) {
      throw new RepoListError(`${at}.purpose must be a phrase of 1–${PURPOSE_MAX} characters`);
    }
    if (!Array.isArray(workflows) || workflows.some((w) => typeof w !== "string" || !WORKFLOW_FILE.test(w))) {
      throw new RepoListError(`${at}.workflows must be an array of workflow file names (name.yml)`);
    }
    if (new Set(workflows).size !== workflows.length) {
      throw new RepoListError(`${at}.workflows names a workflow twice`);
    }
    entries.push({ repo, purpose: purpose.trim(), workflows: [...workflows] });
  });

  const defaultEntry = entries.find((e) => keyOf(e.repo) === keyOf(fallback));
  if (!defaultEntry) {
    throw new RepoListError(`GITHUB_REPOS does not list GITHUB_REPO (${fallback}), the default repo`);
  }
  return { defaultEntry, entries };
}

/**
 * The list as a reader should see it: each repo, its purpose, the default
 * marked.
 * @param {RepoList} list
 * @returns {string}
 */
export function describeRepoList(list) {
  return list.entries
    .map((e) => {
      const tags = [e === list.defaultEntry ? "default" : "", e.purpose].filter(Boolean);
      return tags.length ? `${e.repo} (${tags.join(", ")})` : e.repo;
    })
    .join("; ");
}

/**
 * Turn a tool's optional `repo` input into a listed repo, or a refusal.
 *
 * Absent or blank is the default. A listed `owner/name` matches whatever its
 * case, and a bare `name` matches when exactly one listed repo carries it. The
 * entry returned is the list's own, so what reaches GitHub is the list's
 * spelling, never the model's.
 *
 * @param {RepoList} list
 * @param {unknown} requested
 * @returns {RepoResolution}
 */
export function resolveRepo(list, requested) {
  /** @param {RepoEntry} entry @returns {RepoResolution} */
  const found = (entry) => ({ ok: true, entry, isDefault: entry === list.defaultEntry });
  if (requested === undefined || requested === null) return found(list.defaultEntry);
  if (typeof requested !== "string") {
    return { ok: false, error: `'repo' must be a repo name. Repos I can reach: ${describeRepoList(list)}.` };
  }
  const asked = requested.trim();
  if (!asked) return found(list.defaultEntry);

  const wanted = keyOf(asked);
  const exact = list.entries.find((e) => keyOf(e.repo) === wanted);
  if (exact) return found(exact);
  if (!asked.includes("/")) {
    const byName = list.entries.filter((e) => keyOf(e.repo.split("/")[1] ?? "") === wanted);
    if (byName.length === 1 && byName[0]) return found(byName[0]);
  }
  return {
    ok: false,
    error: `${asked} is not on the bot's repo list, so I can't reach it. Repos I can reach: ${describeRepoList(list)}.`,
  };
}
