// github_intake_search executor — READ-ONLY. The duplicate check before a
// GitHub intake: open issues on the Worker's repo carrying the intake label,
// by keyword. Runs inline in the agent loop (no gate).
//
// Its own tool rather than a third mode of `github_read`: `github_read` reads
// the repo's FILES (a path, or where a term lives in the code), and this reads
// its ISSUES — a different resource, a different endpoint, and a result the
// model acts on differently (name the match, offer the choice). One tool, one
// thing, so the tool table's row says what it is.
//
// The model sends keywords and nothing else. The repo, the open state and the
// label are the Worker's: the client writes the first two, this file the third,
// and `intakeSearchTerms` drops any qualifier, boolean operator or grouping
// from the keywords, so a search cannot be aimed at another repo, a closed
// issue or another label.
//
// IT TAKES ITS SEARCH BY NAME — `findOpenIntakes` is driven in
// `tests/github-intake-search.test.ts` with a fake, and `Env` enters only in
// `executeGithubIntakeSearch`, the binding at the foot of this file.

import type { Env } from "../types";
import {
  GithubRateLimitError,
  githubIssueSearch,
  type GithubIssueSearch,
} from "../integrations/github";
import { INTAKE_LABELS } from "./github-issue-render";

/** The label every intake carries, bot-filed or sweep-found — the one the
 *  triage queue is. The search reads it from the same constant the create
 *  applies, so the two cannot drift. */
const INTAKE_LABEL = INTAKE_LABELS[0];

/** Enough words to find a match; more and GitHub's AND of every term finds
 *  nothing. The schema asks for two to six. */
const MAX_TERMS = 6;

/** A search qualifier — `repo:`, `is:`, `-label:` — but not a URL's scheme,
 *  and not a word that merely ends in a colon (`TypeError:`). */
const QUALIFIER = /^-?[a-z_]+:(?!\/\/)./;

/** GitHub's boolean operators, which under advanced search bind the Worker's
 *  qualifiers to one side only. Upper-case, as GitHub reads them. */
const OPERATOR = /^(?:AND|OR|NOT)$/;

export interface IntakeSearchDeps {
  github: GithubIssueSearch;
}

/**
 * The model's keywords as words only: every qualifier, boolean operator,
 * parenthesis and double quote dropped, whitespace collapsed, at most
 * `MAX_TERMS` words — so nothing in them can regroup the query around the
 * repo, state and label the Worker wrote.
 */
export function intakeSearchTerms(keywords: string): string {
  return keywords
    .replace(/["()]/g, " ")
    .split(/\s+/)
    .filter((w) => w !== "" && !QUALIFIER.test(w) && !OPERATOR.test(w))
    .slice(0, MAX_TERMS)
    .join(" ");
}

/**
 * Search the open intakes, and say what the model does next.
 *
 * Never throws: a failed search is `ok:false` with a note that the filing can
 * go ahead — the check keeps the tracker tidy, it does not hold a request.
 */
export async function findOpenIntakes(
  input: Record<string, unknown>,
  deps: IntakeSearchDeps,
): Promise<string> {
  const terms = intakeSearchTerms(typeof input.keywords === "string" ? input.keywords : "");
  if (!terms) {
    return JSON.stringify({
      ok: false,
      error: "missing 'keywords' — two to six words that name the problem",
    });
  }

  const repo = deps.github.repo;
  try {
    const matches = await deps.github.searchOpenIssues(INTAKE_LABEL, terms);
    return JSON.stringify({
      ok: true,
      repo,
      keywords: terms,
      count: matches.length,
      matches,
      note: matches.length
        ? "Open intakes that may already cover this. Before staging github_issue_create, name the closest " +
          "by title and link, and ask: link that issue instead, or file a new one anyway? Stage the card " +
          "only if they choose to file anyway. Not a match on a closer read → say so and stage it."
        : "No open intake matches these words. Stage github_issue_create; if the words were narrow, one " +
          "retry with other words first is fine.",
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      repo,
      error: err instanceof Error ? err.message : String(err),
      note:
        (err instanceof GithubRateLimitError
          ? "Couldn't check for a duplicate: GitHub's search rate limit is spent for now. "
          : "Couldn't check for a duplicate. ") +
        "Say so in one clause and stage github_issue_create anyway — " +
        "triage catches a duplicate the check missed.",
    });
  }
}

/**
 * The binding: `Env` turned into the named search.
 * @param env - Worker bindings
 * @param input - Tool args from the model — `keywords`
 */
export async function executeGithubIntakeSearch(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  return findOpenIntakes(input, { github: githubIssueSearch(env) });
}
