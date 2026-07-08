// github_read executor — READ-ONLY. Read a repo file's contents or list a
// directory (to check what exists, e.g. a DS component folder before proposing
// component_implement). Runs inline in the agent loop (no gate).

import type { Env } from "../types";
import { githubReadPath } from "../integrations/github";

export async function executeGithubRead(env: Env, input: Record<string, unknown>): Promise<string> {
  const path = typeof input.path === "string" ? input.path.trim() : "";
  const list = input.list === true;
  const ref = typeof input.ref === "string" ? input.ref.trim() : undefined;
  if (!path) return JSON.stringify({ ok: false, error: "missing 'path'" });

  try {
    const r = await githubReadPath(env, path, list, ref);
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
