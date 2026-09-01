// The eval corpus is not readable by the thing being evaluated.
//
// `github_read` and `source_read` are the bot's two routes into this
// repository, and this repository is PUBLIC and holds its own grader
// instructions. Nothing stopped the system under test from fetching the file
// that says what a passing answer looks like.
//
// ── Why a read guard and not a secret ─────────────────────────────────────
//
// The first attempt sealed the answer key with AES-256-GCM. It was sound
// cryptography and it did not work, for two reasons that are worth writing
// down because both are easy to repeat.
//
// The plaintext stayed in public git history — every `judgeNote` is still
// there at `02776be3^` — and `githubReadPath` takes a `ref`, so the sealed
// tip removed nothing the bot could not reach one commit earlier. Prevention
// was never achieved; it only looked achieved.
//
// And the key was written to a GitHub Actions secret, which is write-only.
// Within a day nobody could read the rubric: not the author, not a reviewer,
// not the person trying to decide whether a case asserted the right thing.
// An eval suite whose assertions cannot be read cannot be maintained, and
// this session spent three round-trips discovering that.
//
// A read guard inverts both properties. It holds at every ref, because it is
// about the fetch rather than about the file. It needs no secret, so there is
// nothing to lose. And it leaves the answer key in plain sight for the people
// who have to review it, which is the whole reason it exists.
//
// ── What it is not ────────────────────────────────────────────────────────
//
// Not a security boundary. Anyone with a browser can read this repository;
// the guard governs one client, deliberately. It is the eval equivalent of
// not handing a student the marking scheme — the point is the measurement's
// validity, not secrecy.

/** Repository paths the bot may not fetch, whatever route it takes. */
const WITHHELD = [
  // Grader instructions, seed answer keys, recorded runs that quote them.
  /(^|\/)docs\/evals\//i,
];

/**
 * True when a path or URL names part of the eval corpus.
 *
 * The pattern matches ANYWHERE in the string rather than at its start, and
 * that one choice does all the work: `docs/evals/x`, `/docs/evals/x`,
 * `./docs/evals/x`, a `github.com/o/r/blob/<sha>/docs/evals/x` URL and the
 * `raw.githubusercontent.com/o/r/<sha>/docs/evals/x` form all carry the same
 * `/docs/evals/` substring. The `blob/<sha>` case is the one that matters
 * most: it is how a HISTORICAL read is spelled, and history is where the
 * plaintext this guard protects still lives.
 *
 * Collapsing repeated slashes is the only normalisation that earns its place.
 * An earlier draft also stripped the scheme, the `owner/repo/blob/<ref>/`
 * prefix and a leading `./`; mutation-testing each one showed the result was
 * identical with them removed, so they were defence against nothing and are
 * gone. `docs//evals//x` is the sole spelling the bare pattern misses.
 */
export function isWithheldRepoPath(path: string): boolean {
  if (typeof path !== "string" || !path.trim()) return false;
  return WITHHELD.some((pattern) => pattern.test(path.replace(/\/{2,}/g, "/")));
}

/** The refusal, in the shape the bot is asked to speak: cause, then route. */
export const WITHHELD_NOTE =
  "docs/evals/ holds the grader instructions for the cases I am measured on, so I do not read it — " +
  "an answer written from the marking scheme measures nothing. Say that plainly if someone asks for " +
  "it, and point them at the file on github.com, which they can open themselves.";
