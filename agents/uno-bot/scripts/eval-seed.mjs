// A case's SEED — a live GitHub issue the case assumes exists — checked before
// a live run, loudly.
//
// G3 and I3 test the duplicate path, so each needs an open intake on the
// tracker for `github_intake_search` to find. Nothing in the fixture can
// create one (a suite that files an issue per sample is a suite nobody runs
// three times), so the case names an existing issue as `seed`, and this checks
// it is still open and still carries the label the search reads. A seed that
// closed turns the case into a no-match case that fails for a reason the
// transcript never states — which is what live run 36672820165 looked like.
//
// Warns and never fails: the seed is a fact about the tracker, not about the
// bot, and a red gate for a closed issue is a gate that gets switched off.
// Only the worker transport runs it — the local one replays recordings, and
// reaches no tracker.

/**
 * The shape problems of one `seed`, as sentences — empty when well formed.
 * @param {unknown} seed
 * @param {string} at - the case id, for the message
 */
export function problemsWithSeed(seed, at) {
  if (!seed || typeof seed !== "object" || Array.isArray(seed)) return [`${at} 'seed' is not an object`];
  const problems = [];
  if (typeof seed.repo !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(seed.repo)) problems.push(`${at} 'seed.repo' is not owner/name`);
  if (!Number.isInteger(seed.issue) || seed.issue < 1) problems.push(`${at} 'seed.issue' is not an issue number`);
  if (typeof seed.label !== "string" || !seed.label.trim()) problems.push(`${at} 'seed.label' is missing`);
  return problems;
}

/**
 * One warning per case whose seed is missing, closed or unlabelled.
 *
 * @param {Array<{id: string, seed?: {repo: string, issue: number, label: string}}>} cases
 * @param {(repo: string, issue: number) => Promise<{state: string, labels: string[]} | null>} readIssue
 *   null when the issue could not be read at all
 * @returns {Promise<string[]>}
 */
export async function seedWarnings(cases, readIssue) {
  const warnings = [];
  for (const c of cases) {
    if (!c.seed) continue;
    const { repo, issue, label } = c.seed;
    const where = `${repo}#${issue}`;
    let read = null;
    try {
      read = await readIssue(repo, issue);
    } catch {
      read = null;
    }
    const why = !read
      ? "could not be read"
      : read.state !== "open"
        ? `is ${read.state}`
        : !read.labels.includes(label)
          ? `no longer carries '${label}'`
          : null;
    if (why) {
      warnings.push(
        `SEED MISSING — ${c.id} assumes ${where} is open and labelled '${label}', and it ${why}: ` +
          `the case will run as a no-match case. Point its prompt and seed at another open '${label}' issue.`,
      );
    }
  }
  return warnings;
}

/** The seed read, over GitHub's REST API — a token when the environment has
 *  one, anonymous otherwise (the seeds are on public repos). */
export async function readGithubIssue(repo, issue, { token = process.env.GITHUB_TOKEN } = {}) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${issue}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "uno-bot-evals",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return {
    state: String(body.state ?? ""),
    labels: (body.labels ?? []).map((l) => (typeof l === "string" ? l : String(l?.name ?? ""))),
  };
}
