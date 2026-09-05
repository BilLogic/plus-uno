// Run-time SUBJECTS for the eval fixture (#415) — the runner's half.
//
// A case may declare `subject: { need: "<condition>" }`. Before its first turn
// the runner asks the Worker's token-gated `/debug/blueprint-subject` route for
// a row from the LIVE board satisfying that condition, and substitutes
// `{{subject.<field>}}` wherever the case spells one.
//
// WHY THE WORKER PICKS. The runner has no Supabase credential and must not gain
// one: the Worker holds them, and the whole point of the debug routes is that
// the eval reaches the database only through the same client the bot uses. So
// the condition travels out and a row comes back.
//
// WHY A CONDITION AND NOT A ROW. Every blueprint case written before this named
// its subject, and a name is a fact about the board on the day it was written.
// A rename turned such a case red with nothing wrong — the same defect the
// parent spec exists to fix, one layer up.
//
// Extracted from run-evals.mjs, like eval-history.mjs and eval-scoring.mjs
// beside it, so substitution and the SKIP path can be tested without a live
// Worker, a judge credential or a database.

/**
 * Which `{{subject.…}}` fields each condition promises.
 *
 * CANONICAL COPY: src/integrations/blueprint-subject.ts (`NEED_FIELDS`), where
 * the selection that populates them lives. This is a plain-JS mirror because
 * the runner cannot import a Worker module; `scripts/eval-subjects.test.mjs`
 * reads the TypeScript source and fails when the two lists drift, so the mirror
 * cannot rot the way a hand-kept copy normally does.
 */
export const NEED_FIELDS = {
  "phase-any": ["name", "phase"],
  "scenario-any": ["name", "scenario", "phase"],
  "scenario-with-future-paths": ["name", "scenario", "phase", "path", "status"],
  "touchpoint-any": ["name", "touchpoint", "kind"],
  "corpus-term": ["name", "term", "matched", "shown"],
  "absent-detail": ["name", "cell", "detail", "scenario", "phase"],
};

export const SUBJECT_NEEDS = Object.keys(NEED_FIELDS);

/** `{{subject.field}}`, tolerating inner spaces. Global, so it is re-created
 *  per use rather than shared — a global regex carries `lastIndex`. */
const PLACEHOLDER = () => /\{\{\s*subject\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

/** Every distinct field a case (or any value) asks a subject for. */
export function placeholdersIn(value) {
  const found = new Set();
  const walk = (v) => {
    if (typeof v === "string") {
      for (const m of v.matchAll(PLACEHOLDER())) found.add(m[1]);
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (v && typeof v === "object") {
      Object.values(v).forEach(walk);
    }
  };
  walk(value);
  return [...found];
}

/**
 * Substitute a subject into every string in `value`, recursively.
 *
 * DELIBERATELY WHOLESALE. The keys that matter today are `prompt`, `textRegex`,
 * the `expectToolCalled` args and `judgeNote` — but naming them would mean a
 * new assertion key silently opting out of substitution and reading as a
 * literal `{{subject.scenario}}` against the bot's reply. Every string leaf is
 * substituted; a case with no placeholder is returned unchanged.
 *
 * A field the subject does not carry is LEFT IN PLACE, not blanked. An unfilled
 * placeholder is a visible fixture bug; an empty string is a prompt that reads
 * fine and asserts nothing.
 */
export function substitute(value, subject) {
  if (typeof value === "string") {
    return value.replace(PLACEHOLDER(), (whole, field) => {
      const v = subject?.[field];
      return v === undefined || v === null ? whole : String(v);
    });
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, subject));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substitute(v, subject)]));
  }
  return value;
}

/**
 * Apply a subject to a case.
 *
 * @returns `{ spec, missing }` — the substituted case, and the fields it asked
 *   for that the subject does not carry. A non-empty `missing` is a FAILURE at
 *   the call site, not a skip: the condition was satisfiable and the route
 *   answered, so an unfilled placeholder means the fixture and the route
 *   disagree about what the condition promises.
 */
export function applySubject(spec, subject) {
  const missing = placeholdersIn(spec).filter(
    (f) => subject?.[f] === undefined || subject?.[f] === null,
  );
  return { spec: substitute(spec, subject), missing };
}

/** The route URL for one condition. */
export function subjectUrl(workerUrl, need) {
  return `${String(workerUrl).replace(/\/+$/, "")}/debug/blueprint-subject?need=${encodeURIComponent(need)}`;
}

/**
 * Ask the Worker for a subject.
 *
 * Three outcomes, kept apart on purpose:
 *   - `{ subject }`            — a row satisfying the condition;
 *   - `{ subject: null, reason }` — nothing satisfies it (a SKIP);
 *   - `{ error }`              — the route or the read failed (a FAILURE).
 *
 * The last two look identical from Slack and must not look identical here: "no
 * scenario carries future state" is a fact about the roadmap, and "the outline
 * read 400'd" is a broken blueprint. Collapsing them is the silent-empty-read
 * failure reproduced inside the instrument built to catch it.
 *
 * @param {string} need
 * @param {{workerUrl: string, token: string, fetchImpl?: typeof fetch}} opts
 */
export async function fetchSubject(need, { workerUrl, token, fetchImpl = fetch }) {
  let res;
  try {
    res = await fetchImpl(subjectUrl(workerUrl, need), { headers: { "x-debug-token": token } });
  } catch (err) {
    return { error: `subject route unreachable: ${String(err?.message ?? err)}` };
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    return { error: `subject route returned non-JSON (${res.status})` };
  }
  if (!body?.ok) {
    const known = Array.isArray(body?.needs) ? ` (known: ${body.needs.join(", ")})` : "";
    return { error: `${body?.error ?? `subject route ${res.status}`}${known}`, build: body?.build };
  }
  if (!body.subject) {
    return { subject: null, reason: body.reason ?? "the route named no reason", build: body.build };
  }
  return { subject: body.subject, build: body.build };
}

/** The one-line reason a skipped case carries into the log and the summary. */
export function skipReason(need, reason) {
  return `no subject satisfies ${need}${reason ? ` — ${reason}` : ""}`;
}
