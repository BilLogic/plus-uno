// github_read executor — READ-ONLY. Read a file's contents or list a directory
// (to check what exists, e.g. a DS component folder), or search the code, in any repo on the Worker's repo
// list. Runs inline in the agent loop (no gate).
//
// The model may name a `repo`; it reaches GitHub only as the entry the resolver
// hands back, so a repo off the list is refused here, naming the list, and
// never fetched.
//
// IT TAKES NAMED DEPENDENCIES — the resolver and the reader — so `readGithub`
// is driven in `tests/github-read.test.ts` with fakes, and `Env` enters only in
// `executeGithubRead`, the binding at the foot of this file.

import type { Env } from "../types";
import {
  githubReadPath,
  githubSearchCode,
  resolveRepoFor,
  type GithubCodeHit,
  type GithubReadResult,
  type RepoEntry,
  type RepoResolution,
} from "../integrations/github";
import { isWithheldRepoPath, WITHHELD_NOTE } from "../integrations/repo-read-guard";

export interface GithubReadDeps {
  /** The model's `repo` input, resolved against the repo list. */
  resolveRepo(requested: unknown): RepoResolution;
  readPath(target: RepoEntry, path: string, ref?: string): Promise<GithubReadResult>;
  searchCode(target: RepoEntry, query: string): Promise<GithubCodeHit[]>;
}

export async function readGithub(input: Record<string, unknown>, deps: GithubReadDeps): Promise<string> {
  const path = typeof input.path === "string" ? input.path.trim() : "";
  const ref = typeof input.ref === "string" ? input.ref.trim() : undefined;
  const search = typeof input.search === "string" ? input.search.trim() : "";

  const target = deps.resolveRepo(input.repo);
  if (!target.ok) {
    return JSON.stringify({
      ok: false,
      error: target.error,
      note: "Say which repos you can reach, from the error, and ask which one they meant.",
    });
  }
  const repo = target.entry.repo;
  // The eval corpus is the harness repo's — the default — and nobody else's.
  const withheldHere = (p: string) => target.isDefault && isWithheldRepoPath(p);

  // Search mode (added 2026-07-10): find WHERE something lives, then read it
  // by path. Replaces the hosted GitHub MCP's code search in gemini mode.
  if (search) {
    try {
      const allHits = await deps.searchCode(target.entry, search);
      // The eval corpus is filtered out of results too, not just out of
      // direct reads: a search that returns the path is half the answer.
      const hits = allHits.filter((hit) => !withheldHere(hit?.path ?? ""));
      const withheld = allHits.length - hits.length;
      return JSON.stringify({
        ok: true,
        repo,
        search,
        count: hits.length,
        hits,
        ...(withheld > 0 ? { withheld, withheld_note: WITHHELD_NOTE } : {}),
        note: hits.length
          ? "Code-search hits (path + github.com link). Read the promising ones by path; link files as github.com URLs in replies."
          : "No code-search hits — the term may not appear in the repo; say so rather than guessing.",
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        repo,
        error: err instanceof Error ? err.message : String(err),
        note: "Code search failed — fall back to reading likely paths directly.",
      });
    }
  }

  if (!path) return JSON.stringify({ ok: false, error: "missing 'path' (or use 'search')" });
  if (withheldHere(path)) {
    return JSON.stringify({ ok: false, error: `${path} is withheld`, note: WITHHELD_NOTE });
  }

  try {
    const r = await deps.readPath(target.entry, path, ref);
    if (r.kind === "dir") {
      return JSON.stringify({
        ok: true,
        repo,
        path: r.path,
        url: githubLink(repo, "tree", r.path, ref),
        kind: "dir",
        entries: r.entries,
        note: "Directory listing — use it to confirm what exists (e.g. a DS component folder). Link it at its `url`.",
      });
    }
    return JSON.stringify({
      ok: true,
      repo,
      path: r.path,
      url: githubLink(repo, "blob", r.path, ref),
      kind: "file",
      content: r.text,
      truncated: r.truncated,
      note: "File contents from the repo. Ground your answer in this and link it at its `url`.",
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      repo,
      error: err instanceof Error ? err.message : String(err),
      note: "Couldn't read that repo path — tell the user; don't answer from memory.",
    });
  }
}

/**
 * The github.com page of what a path read read: `blob` for a file, `tree` for
 * a directory. A read that named no ref read the default branch, which `HEAD`
 * names on github.com whatever that branch is called.
 */
function githubLink(repo: string, kind: "blob" | "tree", path: string, ref?: string): string {
  return `https://github.com/${repo}/${kind}/${encodeURIComponent(ref || "HEAD")}/${encodeURI(path)}`;
}

/**
 * The binding: `Env` turned into the resolver and the reader.
 * @param env - Worker bindings
 * @param input - Tool args from the model — `path`, `ref`, `search`, `repo`
 */
export async function executeGithubRead(env: Env, input: Record<string, unknown>): Promise<string> {
  return readGithub(input, {
    resolveRepo: (requested) => resolveRepoFor(env, requested),
    readPath: (target, path, ref) => githubReadPath(env, target, path, ref),
    searchCode: (target, query) => githubSearchCode(env, target, query),
  });
}
