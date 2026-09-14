// Build guard: the Worker's baked prompt, and the two artifacts assembled with
// it, against the docs they are assembled from. A harness doc edited without
// regenerating leaves the bot reciting the previous version of its own rules,
// and nothing about that is visible until someone reads an answer.
//
// It is a thin caller of `assemble()` in bundle-harness.mjs: the assembly reads
// the tree and returns the three artifacts, the committed bytes snapshotted
// before it ran, and every defect it found on the way — a doc under a section
// root with no embodiment, a `disclosure` nothing can honour, a per-file or
// assembled budget blown, the bundle cut under the cache floor, an empty glob.
// This file turns those into findings and adds one per stale artifact.
//
// WHY IT IS A MODULE AND NOT THE BUNDLER'S `--check` (#537). `--check` is the
// same assembly with the writes withheld, so the only thing it could hand the
// harness runner was an exit code — the shape every other row in
// `scripts/checks.registry.mjs` was reduced to under #509. The CLI keeps
// `--check`, because `scripts/lib/bundled-set.mjs` and
// `scripts/check-harness-budgets.mjs` spawn it for the manifest; the runner
// calls this instead, in-process, and renders one banner for it.
//
// It reads only this package's artifacts and the root docs, but it takes the
// repo root like every other check on the findings interface (#509), so the
// harness runner can import it from the root and call `run({ repoRoot })`.
//
// Run: npm run check:harness-bundle
import { byRoot, main } from "../../../scripts/lib/findings.mjs";
import { REPO_ROOT, assemble, staleArtifacts } from "./bundle-harness.mjs";

export const REMEDY =
  "  -> Nothing under agents/uno-bot/src/generated/ or harness-bundle.md is a source.\n" +
  "     Edit the doc, then run `npm run bundle:harness` and commit what it wrote.\n" +
  "     The prompt is the cached prefix of every request, so a stale bundle is the\n" +
  "     bot answering from the harness as it was, with nothing to say that it is.";

/** One assembly per repo root, shared by `run` and the green line. */
const assembly = byRoot((repoRoot) => assemble({ repoRoot }));

/**
 * @param {{repoRoot?: string}} [ctx]
 * @returns {import('../../../scripts/lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const built = assembly(repoRoot);
  // The assembly's own findings first: a bundle that could not be assembled has
  // no artifacts to be stale against, and a staleness finding raised over one
  // would report a consequence as the cause.
  return [
    ...built.findings,
    ...staleArtifacts(built).map(({ rel, expected, committed }) => ({
      file: rel,
      message:
        `is STALE — ${committed.length.toLocaleString("en-US")} committed chars against ` +
        `${expected.length.toLocaleString("en-US")} regenerated. A bundled harness doc changed and ` +
        "this artifact was not regenerated: run `npm run bundle:harness`.",
    })),
  ];
}

/** The green line, carrying what the assembly it just agreed with measured. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { manifest, disclosed } = assembly(repoRoot);
  if (!manifest) return "the bundle could not be assembled";
  const { chars, files } = manifest.assembled;
  return (
    `${chars.toLocaleString("en-US")} chars from ${files} files, ${disclosed.length} reference(s) disclosed; ` +
    "harness.ts, harness-bundle.md and references.ts are all current."
  );
}

main(import.meta.url, "check:harness-bundle", { run, summary, remedy: REMEDY });
