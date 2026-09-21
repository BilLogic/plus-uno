// Read from the plus-uno GitHub repo via the contents API (for github_read):
// fetch a file's decoded text, or list a directory's entries. GITHUB_TOKEN is
// already on the Worker for repository_dispatch; this reuses it read-only.
// Fail-loud (throws) so the tool can report honestly — unlike ds-components.ts,
// which fails-open because it's a preflight guard, not a user-facing read.
//
// One write lives here too: creating an issue, for `github_issue_create`. It is
// a CLIENT rather than a function, so the executor takes it by name and a test
// hands it a fake (`tests/github-intake.test.ts`). Create only — nothing here
// comments on, edits, closes or relabels an issue. Beside it, the read the
// duplicate check runs first — open issues by label and keyword, for
// `github_intake_search` — a client for the same reason.

import type { Env } from "../types";
import { countedFetch } from "../net";

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
  path: string,
  ref?: string,
): Promise<GithubReadResult> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN/GITHUB_REPO)");
  }
  const clean = path.replace(/^\/+/, "").trim();
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${clean}${qs}`;

  {
    const res = await countedFetch(url, {
      headers: {
        authorization: `Bearer ${env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "uno-bot",
      },
    }, GH_TIMEOUT_MS);
    if (!res.ok) {
      throw new Error(`GitHub contents ${res.status} for ${clean}`);
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

/**
 * Code search within the configured repo (GET /search/code). Restores the
 * code-search capability the hosted GitHub MCP provided, on the same PAT —
 * needed in gemini mode (no server-side MCP) and useful as a lighter path
 * everywhere. One subrequest. Throws on non-2xx.
 */
export async function githubSearchCode(env: Env, query: string): Promise<GithubCodeHit[]> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN/GITHUB_REPO)");
  }
  const q = `${query} repo:${env.GITHUB_REPO}`;
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=10`;
  const res = await countedFetch(url, {
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "uno-bot",
    },
  }, GH_TIMEOUT_MS);
  if (!res.ok) throw new Error(`GitHub code search ${res.status}`);
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
 * The issue client on the Worker's own repo and token (POST /repos/{repo}/issues).
 *
 * The repo is `GITHUB_REPO`, never an argument: the model cannot aim a filing
 * anywhere else. One subrequest per issue.
 */
export function githubIssueClient(env: Env): GithubIssueClient {
  const repo = env.GITHUB_REPO;
  return {
    repo,
    async createIssue(issue) {
      if (!env.GITHUB_TOKEN || !repo) {
        throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN/GITHUB_REPO)");
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

/** The read the duplicate check needs, bound to the same one repo. */
export interface GithubIssueSearch {
  /** `owner/name` — the repo every search reads. */
  readonly repo: string;
  /** Open issues carrying `label` that match `terms`, best match first.
   *  Throws `GithubRequestError` on any non-2xx. */
  searchOpenIssues(label: string, terms: string): Promise<OpenIssue[]>;
}

const ISSUE_SEARCH_LIMIT = 5;

/**
 * Issue search on the Worker's own repo and token (GET /search/issues), for
 * `github_intake_search`.
 *
 * The repo, `is:issue` and `is:open` are written here, never taken from the
 * caller, so a search reads open issues on `GITHUB_REPO` and nothing else. One
 * subrequest per search.
 */
export function githubIssueSearch(env: Env): GithubIssueSearch {
  const repo = env.GITHUB_REPO;
  return {
    repo,
    async searchOpenIssues(label, terms) {
      if (!env.GITHUB_TOKEN || !repo) {
        throw new Error("GitHub not configured on the Worker (GITHUB_TOKEN/GITHUB_REPO)");
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
