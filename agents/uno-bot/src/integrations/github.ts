// Read from the GitHub repos on the Worker's repo list via the contents API
// (for github_read): fetch a file's decoded text, or list a directory's
// entries. GITHUB_TOKEN is already on the Worker for repository_dispatch; this
// reuses it read-only. Fail-loud (throws) so the tool can report honestly —
// unlike ds-components.ts, which fails-open because it's a preflight guard,
// not a user-facing read.
//
// EVERY CALL HERE TAKES A RESOLVED REPO — a `RepoEntry` off the list, never a
// string the model wrote. `resolveRepoFor` is the one way to get one: it reads
// `GITHUB_REPOS` (parsed once per isolate, by `repo-list.mjs`) and turns a
// tool's optional `repo` input into a listed repo or a refusal naming the list.
//
// One write lives here too: creating an issue, for `github_issue_create`. It is
// a CLIENT rather than a function, so the executor takes it by name and a test
// hands it a fake (`tests/github-intake.test.ts`). Create only — nothing here
// comments on, edits, closes or relabels an issue. Beside it, the read the
// duplicate check runs first — open issues by label and keyword, for
// `github_intake_search` — a client for the same reason, and the workflow
// dispatch `github_workflow_run` sends past the Gate.

import type { Env } from "../types";
import { countedFetch } from "../net";
import {
  RepoListError,
  parseRepoList,
  resolveRepo,
  type RepoEntry,
  type RepoList,
  type RepoResolution,
} from "./repo-list.mjs";

export type { RepoEntry, RepoResolution };

/** The parsed list, kept for the isolate's life — keyed on the two vars, so a
 *  test (or a redeploy) that changes them is read afresh. */
let parsedList: { raw: string | undefined; fallback: string; list: RepoList | RepoListError } | null = null;

function repoListOf(env: Env): RepoList | RepoListError {
  const raw = env.GITHUB_REPOS;
  const fallback = env.GITHUB_REPO;
  if (!parsedList || parsedList.raw !== raw || parsedList.fallback !== fallback) {
    let list: RepoList | RepoListError;
    try {
      list = parseRepoList(raw, fallback);
    } catch (err) {
      list = err instanceof RepoListError ? err : new RepoListError(String(err));
      console.warn(`[github] repo list refused: ${list.message}`);
    }
    parsedList = { raw, fallback, list };
  }
  return parsedList.list;
}

/**
 * A tool's optional `repo` input, resolved against the Worker's repo list:
 * absent → `GITHUB_REPO`; listed → that entry; anything else → a refusal whose
 * text names the list. A list that fails to parse refuses every repo, the
 * default too — `check:secrets` fails such a list before a deploy, so this is
 * the backstop, said plainly.
 * @param env - Worker bindings (`GITHUB_REPOS`, `GITHUB_REPO`)
 * @param requested - the model's `repo` input, unvalidated
 */
export function resolveRepoFor(env: Env, requested: unknown): RepoResolution {
  const list = repoListOf(env);
  if (list instanceof RepoListError) {
    return {
      ok: false,
      error: `The Worker's GitHub repo list is misconfigured (${list.message}), so no repo is reachable until it is fixed.`,
    };
  }
  return resolveRepo(list, requested);
}

const GH_TIMEOUT_MS = 8000;
const GH_TEXT_CAP = 12000; // keep a big file from blowing the model's budget

export interface GithubReadResult {
  path: string;
  kind: "file" | "dir";
  /** File contents, decoded from base64 and capped. Present when kind==="file". */
  text?: string;
  /** Directory entry names (dirs get a trailing "/"). Present when kind==="dir". */
  entries?: string[];
  truncated?: boolean;
}

/**
 * Read a repo path. Dir vs file is auto-detected from the GitHub API response
 * shape (an array = directory listing; an object = file), so no caller flag is
 * needed. Throws on any non-2xx so github_read can surface the failure.
 */
export async function githubReadPath(
  env: Env,
  target: RepoEntry,
  path: string,
  ref?: string,
): Promise<GithubReadResult> {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN)");
  }
  const clean = path.replace(/^\/+/, "").trim();
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const url = `https://api.github.com/repos/${target.repo}/contents/${clean}${qs}`;

  {
    const res = await countedFetch(url, {
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "uno-bot",
      },
    }, GH_TIMEOUT_MS);
    if (!res.ok) {
      throw new Error(`GitHub contents ${res.status} for ${clean} on ${target.repo}`);
    }
    const data = (await res.json()) as
      | { name?: string; type?: string }[]
      | { content?: string; encoding?: string };

    // A directory comes back as an array of entries.
    if (Array.isArray(data)) {
      const entries = data
        .map((e) => (e.type === "dir" ? `${e.name ?? ""}/` : e.name ?? ""))
        .filter((n) => n !== "" && n !== "/");
      return { path: clean, kind: "dir", entries };
    }

    let text = "";
    let truncated = false;
    if (data.content && data.encoding === "base64") {
      const decoded = atob(data.content.replace(/\n/g, ""));
      truncated = decoded.length > GH_TEXT_CAP;
      text = decoded.slice(0, GH_TEXT_CAP);
    }
    return { path: clean, kind: "file", text, truncated };
  }
}

export interface GithubCodeHit {
  path: string;
  url: string;
}

/** GitHub's boolean operators, which bind the Worker's qualifiers to one side
 *  only. Upper-case, as GitHub reads them. */
const OPERATOR = /^(?:AND|OR|NOT)$/;

/**
 * A model's search text as loose words: every parenthesis and double quote
 * dropped, every boolean operator dropped, whitespace collapsed — so nothing
 * in it can regroup a query around the qualifiers the Worker writes. Both
 * searches start here; each then drops the qualifiers it does not allow.
 */
export function searchWords(text: string): string[] {
  return text
    .replace(/["()]/g, " ")
    .split(/\s+/)
    .filter((w) => w !== "" && !OPERATOR.test(w));
}

/** A qualifier that names where to search — `repo:`, `org:`, `user:`, negated
 *  or not. The Worker writes the one `repo:` a search carries; another from
 *  the model would add a repo off the list to it. */
const SCOPE_QUALIFIER = /^-?(?:repo|org|user):/i;

/** The model's code-search words, with any scope qualifier dropped. Every
 *  other qualifier (`path:`, `extension:`, `language:`) narrows within the
 *  repo, so it stays. */
export function codeSearchTerms(query: string): string {
  return searchWords(query)
    .filter((w) => !SCOPE_QUALIFIER.test(w))
    .join(" ");
}

/**
 * Code search within one listed repo (GET /search/code). Restores the
 * code-search capability the hosted GitHub MCP provided, on the same PAT —
 * needed in gemini mode (no server-side MCP) and useful as a lighter path
 * everywhere. One subrequest. Throws on non-2xx.
 */
export async function githubSearchCode(env: Env, target: RepoEntry, query: string): Promise<GithubCodeHit[]> {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN)");
  }
  const q = `${codeSearchTerms(query)} repo:${target.repo}`;
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=10`;
  const res = await countedFetch(url, {
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "uno-bot",
    },
  }, GH_TIMEOUT_MS);
  if (!res.ok) throw new Error(`GitHub code search ${res.status} on ${target.repo}`);
  const data = (await res.json()) as {
    items?: Array<{ path?: string; html_url?: string }>;
  };
  return (data.items ?? [])
    .map((i) => ({ path: i.path ?? "", url: i.html_url ?? "" }))
    .filter((i) => i.path);
}

/** An issue to create: the Worker decides every field, the labels included. */
export interface NewIssue {
  title: string;
  body: string;
  labels: readonly string[];
}

export interface CreatedIssue {
  number: number;
  /** The issue's github.com page. */
  url: string;
}

/**
 * A refusal from GitHub, carrying its status — so the caller can say WHY
 * (a token without Issues write answers 403; one that cannot see the repo, 404)
 * rather than pass on a bare message.
 */
export class GithubRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GithubRequestError";
  }
}

/**
 * A refusal because the token's rate limit is spent — a 403 or 429 with
 * `x-ratelimit-remaining: 0`. Its own class so the caller says "try later"
 * rather than "the token lacks permission", which a bare 403 would read as.
 */
export class GithubRateLimitError extends GithubRequestError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "GithubRateLimitError";
  }
}

/** The one GitHub write the issue executor needs, bound to one repo. */
export interface GithubIssueClient {
  /** `owner/name` — the repo every issue lands in. */
  readonly repo: string;
  /** Create the issue. Throws `GithubRequestError` on any non-2xx. */
  createIssue(issue: NewIssue): Promise<CreatedIssue>;
}

/**
 * The issue client on one listed repo and the Worker's token
 * (POST /repos/{repo}/issues).
 *
 * The repo is a resolved entry, never the model's string: a filing cannot be
 * aimed off the list. One subrequest per issue.
 */
export function githubIssueClient(env: Env, target: RepoEntry): GithubIssueClient {
  const repo = target.repo;
  return {
    repo,
    async createIssue(issue) {
      if (!env.GITHUB_TOKEN) {
        throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN)");
      }
      const res = await countedFetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.GITHUB_TOKEN}`,
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
          "content-type": "application/json",
          "user-agent": "uno-bot",
        },
        body: JSON.stringify({ title: issue.title, body: issue.body, labels: [...issue.labels] }),
      }, GH_TIMEOUT_MS);
      if (!res.ok) {
        // The status only: a refusal's body can echo what was sent.
        console.warn(`[github] create issue on ${repo} refused: ${res.status}`);
        throw new GithubRequestError(res.status, `GitHub issues ${res.status} for ${repo}`);
      }
      const data = (await res.json().catch(() => ({}))) as { number?: unknown; html_url?: unknown };
      // A success that names no issue is not a filing anyone can follow — no
      // "#0" link in the thread.
      if (typeof data.number !== "number" || typeof data.html_url !== "string" || !data.html_url) {
        throw new GithubRequestError(
          res.status,
          `GitHub answered ${res.status} for ${repo} without the new issue's number and link`,
        );
      }
      return { number: data.number, url: data.html_url };
    },
  };
}

/** An open issue a search found — enough to name it and link it. */
export interface OpenIssue {
  number: number;
  title: string;
  /** The issue's github.com page. */
  url: string;
  /** When it last changed, as GitHub stamps it; "" when GitHub gave none. */
  updated: string;
}

/** The read the duplicate check needs, on whichever listed repo it is handed. */
export interface GithubIssueSearch {
  /** Open issues on `target` carrying `label` that match `terms`, best match
   *  first. Throws `GithubRequestError` on any non-2xx. */
  searchOpenIssues(target: RepoEntry, label: string, terms: string): Promise<OpenIssue[]>;
}

const ISSUE_SEARCH_LIMIT = 5;

/**
 * Issue search on the Worker's token (GET /search/issues), for
 * `github_intake_search`.
 *
 * The `repo:` (from the resolved entry), `is:issue` and `is:open` are written
 * here, never taken from the caller's words, so a search reads open issues on
 * one listed repo and nothing else. One subrequest per search.
 */
export function githubIssueSearch(env: Env): GithubIssueSearch {
  return {
    async searchOpenIssues(target, label, terms) {
      const repo = target.repo;
      if (!env.GITHUB_TOKEN) {
        throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN)");
      }
      const q = `repo:${repo} is:issue is:open label:${label} ${terms}`;
      // The search mode is named rather than left to GitHub's default, which is
      // moving to advanced search. Under it a bare OR or a parenthesis in the
      // terms would split them from the qualifiers above, so the caller hands
      // words only (`intakeSearchTerms`).
      const url =
        `https://api.github.com/search/issues?q=${encodeURIComponent(q)}` +
        `&advanced_search=true&per_page=${ISSUE_SEARCH_LIMIT}`;
      const res = await countedFetch(url, {
        headers: {
          authorization: `Bearer ${env.GITHUB_TOKEN}`,
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
          "user-agent": "uno-bot",
        },
      }, GH_TIMEOUT_MS);
      if (!res.ok) {
        // The status only, as the create logs it.
        console.warn(`[github] issue search on ${repo} refused: ${res.status}`);
        if (
          (res.status === 403 || res.status === 429) &&
          res.headers.get("x-ratelimit-remaining") === "0"
        ) {
          throw new GithubRateLimitError(res.status, `GitHub issue search rate-limited (${res.status}) for ${repo}`);
        }
        throw new GithubRequestError(res.status, `GitHub issue search ${res.status} for ${repo}`);
      }
      const data = (await res.json().catch(() => ({}))) as {
        items?: Array<{ number?: unknown; title?: unknown; html_url?: unknown; updated_at?: unknown }>;
      };
      // A hit with no number, title or link is not one the reply can name.
      return (data.items ?? []).flatMap((i) =>
        typeof i.number === "number" &&
        typeof i.title === "string" &&
        typeof i.html_url === "string" &&
        i.html_url
          ? [{
              number: i.number,
              title: i.title,
              url: i.html_url,
              updated: typeof i.updated_at === "string" ? i.updated_at : "",
            }]
          : [],
      );
    },
  };
}

/** The one GitHub write the workflow executor needs, bound to one repo. */
export interface GithubWorkflowClient {
  /** `owner/name` — the repo every run starts on. */
  readonly repo: string;
  /** The repo's default branch, where a run with no ref goes. Throws
   *  `GithubRequestError` on any non-2xx. */
  defaultBranch(): Promise<string>;
  /** Start `workflow` (a file under `.github/workflows/`) at `ref` with
   *  `inputs`. Throws `GithubRequestError` on any non-2xx. */
  dispatchWorkflow(workflow: string, ref: string, inputs: Readonly<Record<string, string>>): Promise<void>;
}

/** Default branches by repo, kept for the isolate's life: a repo's default
 *  branch changes about never, and every run with no ref would read it. */
const defaultBranches = new Map<string, string>();

/**
 * The workflow client on one listed repo and the Worker's token
 * (GET /repos/{repo} for the default branch, once per isolate;
 * POST /repos/{repo}/actions/workflows/{file}/dispatches for the run).
 *
 * The repo is a resolved entry, never the model's string, and WHICH workflows
 * may run is the executor's check against that entry's `workflows` — this
 * client dispatches what it is handed. One subrequest per run, plus one the
 * first time a repo's default branch is needed.
 */
export function githubWorkflowClient(env: Env, target: RepoEntry): GithubWorkflowClient {
  const repo = target.repo;
  const headers = (): Record<string, string> => {
    if (!env.GITHUB_TOKEN) throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN)");
    return {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "uno-bot",
    };
  };
  return {
    repo,
    async defaultBranch() {
      const known = defaultBranches.get(repo.toLowerCase());
      if (known) return known;
      const res = await countedFetch(`https://api.github.com/repos/${repo}`, { headers: headers() }, GH_TIMEOUT_MS);
      if (!res.ok) {
        console.warn(`[github] repo read on ${repo} refused: ${res.status}`);
        throw new GithubRequestError(res.status, `GitHub repo ${res.status} for ${repo}`);
      }
      const data = (await res.json().catch(() => ({}))) as { default_branch?: unknown };
      if (typeof data.default_branch !== "string" || !data.default_branch) {
        throw new GithubRequestError(res.status, `GitHub answered ${res.status} for ${repo} without its default branch`);
      }
      defaultBranches.set(repo.toLowerCase(), data.default_branch);
      return data.default_branch;
    },
    async dispatchWorkflow(workflow, ref, inputs) {
      const res = await countedFetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
        {
          method: "POST",
          headers: { ...headers(), "content-type": "application/json" },
          body: JSON.stringify({ ref, inputs: { ...inputs } }),
        },
        GH_TIMEOUT_MS,
      );
      if (!res.ok) {
        // The status only, as the create logs it.
        console.warn(`[github] dispatch ${workflow} on ${repo} refused: ${res.status}`);
        throw new GithubRequestError(res.status, `GitHub workflow dispatch ${res.status} for ${workflow} on ${repo}`);
      }
    },
  };
}
