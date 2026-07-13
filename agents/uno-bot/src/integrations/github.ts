// Read from the plus-uno GitHub repo via the contents API (for github_read):
// fetch a file's decoded text, or list a directory's entries. GITHUB_TOKEN is
// already on the Worker for repository_dispatch; this reuses it read-only.
// Fail-loud (throws) so the tool can report honestly — unlike ds-components.ts,
// which fails-open because it's a preflight guard, not a user-facing read.

import type { Env } from "../types";
import { fetchWithTimeout } from "../http";

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
    const res = await fetchWithTimeout(url, {
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
  const res = await fetchWithTimeout(url, {
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
