// github_read executor — READ-ONLY. Read a repo file's contents or list a
// directory (to check what exists, e.g. a DS component folder before proposing
// component_implement). Runs inline in the agent loop (no gate).

import type { Env } from "../types";
import { githubReadPath, githubSearchCode } from "../integrations/github";

export async function executeGithubRead(env: Env, input: Record<string, unknown>): Promise<string> {
  const path = typeof input.path === "string" ? input.path.trim() : "";
  const ref = typeof input.ref === "string" ? input.ref.trim() : undefined;
  const search = typeof input.search === "string" ? input.search.trim() : "";

  // Search mode (added 2026-07-10): find WHERE something lives, then read it
  // by path. Replaces the hosted GitHub MCP's code search in gemini mode.
  if (search) {
    try {
      const hits = await githubSearchCode(env, search);
      return JSON.stringify({
        ok: true,
        search,
        count: hits.length,
        hits,
        note: hits.length
          ? "Code-search hits (path + github.com link). Read the promising ones by path; link files as github.com URLs in replies."
          : "No code-search hits — the term may not appear in the repo; say so rather than guessing.",
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        note: "Code search failed — fall back to reading likely paths directly.",
      });
    }
  }

  if (!path) return JSON.stringify({ ok: false, error: "missing 'path' (or use 'search')" });

  try {
    const r = await githubReadPath(env, path, ref);
    if (r.kind === "dir") {
      return JSON.stringify({
        ok: true,
        path: r.path,
        kind: "dir",
        entries: r.entries,
        note: "Directory listing — use it to confirm what exists (e.g. a DS component folder). Cite the path.",
      });
    }
    return JSON.stringify({
      ok: true,
      path: r.path,
      kind: "file",
      content: r.text,
      truncated: r.truncated,
      note: "File contents from the repo. Ground your answer in this and cite the path.",
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Couldn't read that repo path — tell the user; don't answer from memory.",
    });
  }
}
