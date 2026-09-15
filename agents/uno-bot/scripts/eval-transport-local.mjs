// The eval runner's LOCAL turn transport: the Worker's Turn module, in-process,
// from recorded model replies (#512).
//
// The worker transport (`eval-transport.mjs`) needs a deployment and a debug
// token, so the suite could not run on a pull request at all — the first time
// anything ran it was the Monday cron, against whatever was already serving.
// This transport closes that: it calls the SAME pieces `src/eval/turn-adapter.ts`
// calls in the Worker —
//
//   `evalTurnRequest` → `runTurn` → `evalTurnResponse`
//
// with the same in-memory ThreadState seeded from the runner's history and the
// same recording Delivery. What differs is only what cannot exist here, and each
// difference is a named substitution rather than a second pipeline:
//
//   * THE MODEL IS A RECORDING. `runAgent` is the real `runLoop` behind the fake
//     ModelProvider, replaying the replies recorded for this case
//     (`docs/evals/fixtures/recordings/<case>.json`). So the loop's own rules —
//     a side-effect call staged as a proposal, `proposal_resolve` authorized
//     against the pending card, read-only calls executed and handed back — all
//     run. Only the draw is fixed.
//   * THE THINKING LEVEL IS DERIVED, NOT RECORDED. A recorded model reports no
//     dial. The level is not its to report either — it is the Gemini adapter's
//     mapping of the tier the ROUTE chose, and the route ran for real — so the
//     transport states it from that same resolution (`levelForTier`).
//   * READ-ONLY TOOLS ANSWER FROM THE RECORDING. The Worker's tool executor
//     names `Env`, Slack, Notion and Supabase. A recorded turn declares the
//     result text each lookup returned; anything it did not record answers with
//     an empty-but-honest `{ ok: true, rows: [] }`, which is the same shape a
//     real empty read produces.
//   * `reviewDraft` AND `preflight` ARE THE RECORDING'S TOO. Both are live model
//     or network calls in the Worker (`agent/draft-judge.ts` reaches Vertex,
//     `agent/preflight.ts` reaches the DS component list through `Env`). The
//     draft judge fails open by contract, so the local default — ship the draft
//     — is the behaviour the Worker takes when the judge is unreachable; the
//     gate's ask is recorded per turn when a case is about the gate.
//   * A RUN-TIME SUBJECT IS THE RECORDING'S TOO. A case declaring
//     `subject: { need }` is answered with the row its recording carries — the
//     row the worker transport's subject read returned when the case was
//     recorded — so the case replays against the board it was recorded on. A
//     recording without one skips by name, as a missing recording does.
//
// WHAT THAT MEANS FOR A SCORE. A local run measures the TURN — the dispositions,
// the gate's idempotency, the cancel bounce, the history write, the proposal
// routing the loop performs on the model's call — against a fixed draw. It does
// NOT measure the model: no local run can tell you whether Gemini would have
// called `shareout_post` today. That is the worker transport's job and the cron
// keeps doing it. The summary's `transport` field is what keeps the two
// measurements from being read as one.
//
// WHY `.test-build/`. Turn, the loop, the fake provider, the in-memory store and
// the pure half of the eval adapter are all Workers-global-free on purpose and
// `tsconfig.test.json` already compiles them for `npm test`. This transport
// imports that output rather than growing a second build, and it BUILDS FIRST
// when the output is missing or older than `src/` — a run against a stale build
// is a score for code nobody has.
//
// Env (all optional): EVAL_RECORDINGS_DIR, EVAL_TEST_BUILD (skip the freshness
// build — for a caller that just built).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The package root (agents/uno-bot), from this file. */
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_DIR = join(PKG, ".test-build");
export const RECORDINGS_DIR = resolve(PKG, "../../docs/evals/fixtures/recordings");

/** What a lookup returns when the recording did not record one: empty, and
 *  saying so. A silent "" would read to the model as a tool that answered. */
export const UNRECORDED_TOOL_RESULT = JSON.stringify({
  ok: true,
  rows: [],
  note: "no result recorded for this lookup (local eval transport)",
});

// ── The recording format ─────────────────────────────────────────────────────
//
// One file per case, `<case-id>.json`, holding the MODEL REPLIES that case's
// turns were answered with — nothing about scores, and nothing the runner could
// read as an expectation. Deliberately the smallest thing that reproduces a
// turn:
//
//   {
//     "case": "R3",
//     "source": "authored" | "captured",
//     "recordedAt": "2026-09-14",
//     "note": "why these replies are what they are",
//     "subject": { "name": "…", "scenario": "…" },   // optional — see below
//     "turns": [
//       {
//         "prompt": "…",                     // the fixture's prompt, verbatim
//         "replies": [                       // one entry per model round-trip
//           { "text": "…", "toolCalls": [{ "name": "shareout_post", "args": {} }] }
//         ],
//         "toolResults": [{ "tool": "search_blueprint", "text": "{…}" }],
//         "references": ["uno-publish/method"],
//         "gateAsk": null
//       }
//     ]
//   }
//
// `source` is load-bearing and is never inferred: `authored` means a person
// wrote the replies from what the case expects, `captured` means
// `scripts/eval-record.mjs` read them off a real `/debug/eval` response. An
// authored recording proves the TURN routes a reply correctly; it proves nothing
// about the model, and the field is what stops a green local run being quoted as
// if it did.
//
// `prompt` is matched against the fixture, so a case whose wording changes fails
// loudly here instead of replaying the old draw against the new question.
//
// `subject` is the ROW a run-time case (#415) was answered about — what the
// worker transport's subject read returned on the day this was captured. It
// sits at the TOP LEVEL, once per case, because that is where the runner asks:
// `run-evals.mjs` resolves `subject: { need }` once before turn 1, so that the
// three samples of one case ask the same question. A per-turn copy would offer
// a second answer for a question asked once.
//
// It is what lets a `need` case replay at all: the runner substitutes the
// subject into the prompt BEFORE turn 1, so the prompt a recorded turn carries
// is the FILLED-IN one, and only the row it was filled in from reproduces it.
// Hence the row travels with the recording rather than being looked up by
// condition — three cases declare `scenario-any`, and a condition-keyed lookup
// would hand two of them another case's afternoon.

const SOURCES = new Set(["authored", "captured"]);

/** Parse and validate one recording. Throws on a shape the transport cannot
 *  replay — a recordings directory is repo data, and a typo in it must not
 *  degrade into a mysterious empty reply. */
export function parseRecording(json, { file = "(inline)" } = {}) {
  const at = (what) => `${file}: ${what}`;
  if (!json || typeof json !== "object") throw new Error(at("not an object"));
  if (!json.case || typeof json.case !== "string") throw new Error(at("no 'case' id"));
  if (!SOURCES.has(json.source)) {
    throw new Error(at(`'source' must be one of ${[...SOURCES].join(", ")} (got ${JSON.stringify(json.source)})`));
  }
  if (!Array.isArray(json.turns) || json.turns.length === 0) throw new Error(at("no 'turns'"));
  if (json.subject !== undefined && json.subject !== null) {
    // A row, the way the subject route answers with one. An array or a string
    // here would substitute as `[object Object]` into a prompt and read as a
    // model that lost the plot, so it is refused where it can still be named.
    if (typeof json.subject !== "object" || Array.isArray(json.subject)) {
      throw new Error(at("'subject' is not a row object"));
    }
  }
  const turns = json.turns.map((t, i) => {
    const where = at(`turn ${i + 1}`);
    if (typeof t?.prompt !== "string" || !t.prompt.trim()) throw new Error(`${where}: no 'prompt'`);
    if (!Array.isArray(t.replies)) throw new Error(`${where}: no 'replies' array`);
    for (const r of t.replies) {
      if (!r || typeof r !== "object") throw new Error(`${where}: a reply is not an object`);
      if (r.toolCalls !== undefined && !Array.isArray(r.toolCalls)) {
        throw new Error(`${where}: 'toolCalls' is not an array`);
      }
    }
    return {
      prompt: t.prompt,
      replies: t.replies,
      toolResults: Array.isArray(t.toolResults) ? t.toolResults : [],
      references: Array.isArray(t.references) ? t.references : [],
      gateAsk: typeof t.gateAsk === "string" ? t.gateAsk : null,
    };
  });
  return {
    case: json.case,
    source: json.source,
    note: json.note ?? "",
    subject: json.subject ?? null,
    turns,
  };
}

/** Every recording in a directory, by case id. A missing directory is no
 *  recordings, not an error: a checkout that has none should skip, not crash. */
export function loadRecordings(dir = RECORDINGS_DIR) {
  const byCase = new Map();
  if (!existsSync(dir)) return byCase;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json")) continue;
    const file = join(dir, name);
    const rec = parseRecording(JSON.parse(readFileSync(file, "utf8")), { file: name });
    if (byCase.has(rec.case)) throw new Error(`${name}: case ${rec.case} is recorded twice`);
    byCase.set(rec.case, rec);
  }
  return byCase;
}

/**
 * Which recorded turn answers this request.
 *
 * Keyed on the prompt AND the turn's place in its case, read off the history the
 * runner handed over — never on call order. R5 asks the SAME thing at turn 1 and
 * turn 3 (that is the case: the second ask must bounce off the cancel), and a
 * 3-sample case runs turn 1 three times, so a per-call cursor would answer the
 * second sample's first turn with the first sample's second reply.
 */
export function turnIndexOf(history) {
  return (Array.isArray(history) ? history : []).filter((h) => h?.role === "assistant").length;
}

// ── The Node build the transport runs on ─────────────────────────────────────

/** Newest mtime under a directory tree, for `.ts` sources. */
function newestSource(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestSource(path));
    else if (entry.name.endsWith(".ts")) newest = Math.max(newest, statSync(path).mtimeMs);
  }
  return newest;
}

/**
 * Compile `tsconfig.test.json` when `.test-build/` is missing or older than
 * `src/`.
 *
 * MTIMES, and the comparison is deliberately one-sided: the newest source
 * against the OLDEST emitted file the transport imports. A build that is newer
 * than every source is fresh; anything else is rebuilt. The alternative — always
 * building — costs ~8s on every local run, and the alternative to checking at
 * all is scoring code nobody has.
 */
export function ensureTestBuild({ pkg = PKG, log = console.log } = {}) {
  const entry = join(pkg, ".test-build", "src", "turn", "turn.js");
  const sources = Math.max(newestSource(join(pkg, "src")), statSync(join(pkg, "tsconfig.test.json")).mtimeMs);
  if (existsSync(entry) && statSync(entry).mtimeMs >= sources) return { built: false };
  log("[evals] compiling tsconfig.test.json — .test-build is missing or older than src/");
  const tsc = join(pkg, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(tsc)) {
    throw new Error(`typescript is not installed in ${pkg} — run npm ci there before --transport=local`);
  }
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json"], { cwd: pkg, stdio: "inherit" });
  return { built: true };
}

/** The compiled pieces, imported as CommonJS namespaces.
 *
 *  `default`, not named imports: `tsconfig.test.json` emits CJS (the package is
 *  not `type: module`) and `src/turn/index.ts` re-exports with `__exportStar`,
 *  which Node's named-export detection cannot see through. The default IS
 *  `module.exports`. */
async function loadModules(buildDir = BUILD_DIR) {
  const load = async (rel) => (await import(pathToFileURL(join(buildDir, rel)).href)).default;
  const [turn, evalCase, threadState, loop, fake, conversation, geminiTiers] = await Promise.all([
    load("src/turn/index.js"),
    load("src/eval/turn-case.js"),
    load("src/thread-state/index.js"),
    load("src/agent/loop.js"),
    load("src/agent/providers/fake.js"),
    load("src/agent/provider-conversation.js"),
    load("src/agent/gemini-tiers.js"),
  ]);
  return { turn, evalCase, threadState, loop, fake, conversation, geminiTiers };
}

/**
 * The thinking level the Gemini adapter would send for a tier — or null when
 * the tier's model takes no dial.
 *
 * WHY THE TRANSPORT STATES THIS AT ALL. A level is not something a model
 * reports; it is something the adapter SENDS, derived from the tier the route
 * chose (`gemini-tiers.ts`, ADR-028). The route runs for real here, so the tier
 * is a genuine Turn fact — and the level is a pure function of it. A recorded
 * model cannot attest the level, but it was never the model's to attest.
 *
 * The resolution is imported, not re-tabulated: a second copy of the table
 * would let the gate stay green through a tier change.
 *
 * The env is deliberately EMPTY. Per-tier model overrides are a deployment's
 * business (`GEMINI_CHILL_MODEL` and friends); reading the shell's would make a
 * local score depend on whatever happened to be exported.
 */
function levelForTier(geminiTiers, tier) {
  const model = geminiTiers.resolveGeminiModel(tier, {});
  return geminiTiers.geminiDials(tier, model).thinkingLevel;
}

/** The loop's subrequest meter, for a transport that spends none. */
const IDLE_BUDGET = {
  used: () => 0,
  trips: () => 0,
  withLookupLimit: (_limit, fn) => fn(),
  isBudgetError: () => false,
  breakdown: () => "local",
};

// ── The transport ────────────────────────────────────────────────────────────

/**
 * The Turn module in-process, as a turn transport.
 *
 * @param {object} [opts]
 * @param {string} [opts.recordingsDir] - where the per-case recordings live
 * @param {Map<string, object>} [opts.recordings] - pre-loaded, for tests
 * @param {string} [opts.buildDir] - the compiled Node build to import
 * @param {boolean} [opts.build] - false to trust the build as-is
 * @param {(line: string) => void} [opts.log]
 * @param {NodeJS.ProcessEnv} [opts.env] - for the subject reason
 * @returns {{name: string, pauseMs: number, runTurn: Function, unsupported: Function, fetchSubject: Function, recordedCases: string[]}}
 */
export function localTransport({
  recordingsDir = process.env.EVAL_RECORDINGS_DIR || RECORDINGS_DIR,
  recordings,
  buildDir = BUILD_DIR,
  build = !process.env.EVAL_TEST_BUILD,
  log = console.log,
  env = process.env,
} = {}) {
  const byCase = recordings ?? loadRecordings(recordingsDir);
  if (build) ensureTestBuild({ log });
  let modules = null;

  /** Every recorded turn, keyed by `prompt` + turn index — see `turnIndexOf`. */
  const byPrompt = new Map();
  for (const rec of byCase.values()) {
    rec.turns.forEach((t, i) => byPrompt.set(`${i} ${t.prompt}`, { rec, turn: t, index: i }));
  }

  return {
    name: "local",
    // The 10s pause between cases sits out a per-minute MODEL quota. Nothing
    // here reaches a model, so it would only make the CI job two minutes long.
    pauseMs: 0,
    recordedCases: [...byCase.keys()],

    /**
     * A case this transport cannot measure, and why — a SKIP, counted apart,
     * never a pass and never a failure.
     *
     * An unrecorded case is exactly that: nothing here can answer its turns, and
     * running it would score the fake provider's out-of-script filler. The
     * alternative of failing it would turn a cheap PR gate into 34 red blockers
     * that mean "no recording", which is the fastest possible way to have the
     * gate switched off.
     */
    unsupported(c) {
      const rec = byCase.get(c.id);
      if (!rec) return `no recording for ${c.id} (add docs/evals/fixtures/recordings/${c.id}.json — scripts/eval-record.mjs)`;
      if (rec.turns.length < c.turns.length) {
        return `recording for ${c.id} covers ${rec.turns.length} of ${c.turns.length} turns`;
      }
      return null;
    },

    /**
     * One turn, through `runTurn`, on the recorded replies.
     *
     * Errors come back as `{ ok: false, error }` rather than thrown: that is the
     * response shape the runner's retry and its `turn errored:` failure both
     * read, and a transport that throws would crash the walk instead of failing
     * one case.
     */
    async runTurn({ prompt, history, pending, surface = {} }) {
      const startedAt = Date.now();
      try {
        modules ??= await loadModules(buildDir);
        const { turn, evalCase, threadState: store, loop, fake, conversation, geminiTiers } = modules;

        const index = turnIndexOf(history);
        const recorded = byPrompt.get(`${index} ${prompt}`);
        if (!recorded) {
          // A prompt with no recorded turn at this position: either the case is
          // unrecorded (the runner skipped it and never got here) or the
          // fixture's wording moved under a recording. Named, not replayed with
          // whatever else was recorded.
          return {
            ok: false,
            build: "local",
            ms: Date.now() - startedAt,
            error: `no recorded turn ${index + 1} for this prompt — the fixture and the recording disagree: ${JSON.stringify(prompt.slice(0, 120))}`,
          };
        }
        const { turn: script } = recorded;

        const built = evalCase.evalTurnRequest({ prompt, history, pending, ...surface });
        if (!built.ok) {
          return { ok: false, build: "local", ms: Date.now() - startedAt, error: built.error };
        }
        const request = built.request;

        // ── the two recording deps the Worker adapter also uses ──────────────
        const delivery = turn.recordingDelivery();
        const threadState = store.createInMemoryThreadState();
        const ref = { channel: request.channel, thread: request.conversationTs };
        for (const h of request.history) await threadState.appendHistory(ref, h);
        if (request.pending) await threadState.putProposal(request.pending);

        const report = { resolutions: [], gateAsk: null, tools: [], calls: delivery.calls, dials: null };
        let agentResult;

        const provider = fake.fakeProvider({ replies: script.replies, model: "recorded" });
        const lookups = [...script.toolResults];
        const executed = [];

        const outcome = await turn.runTurn(request, {
          threadState,
          delivery,

          async runAgent(req) {
            const result = await loop.runLoop({
              provider,
              deps: {
                async executeReadOnlyTool(name) {
                  executed.push(name);
                  const i = lookups.findIndex((r) => r.tool === name);
                  if (i === -1) return UNRECORDED_TOOL_RESULT;
                  return lookups.splice(i, 1)[0].text ?? UNRECORDED_TOOL_RESULT;
                },
                threadState: { async consumeCancel() { return false; } },
                budget: IDLE_BUDGET,
              },
              tier: req.tier,
              routeReason: req.routeReason,
              conversation: conversation.buildProviderConversation(
                req.history,
                req.userText,
                req.images ?? [],
                req.historicalImages,
              ),
              // The real system prompt is the harness bundle, assembled from
              // `Env`; a recorded model does not read it. Named so a transcript
              // never reads as if the bundle had been measured.
              system: [{ text: "(local transport — recorded model, no harness bundle)", stable: true }],
              tools: [],
              pending: req.pending,
              currentSenderId: req.currentSender.userId,
              // A headless run has no Slack conversation to type `/stop` into,
              // which is what the Worker passes too.
              cancelKey: null,
              ...(req.onInterim ? { onInterim: req.onInterim } : {}),
              onDials: (d) => {
                const { detail, ...named } = d;
                // The recorded model reports an empty `detail` — the fake
                // provider has no dial of its own — so the level is filled in
                // from the tier the route chose (see `levelForTier`). `model`
                // stays whatever the provider said, which here is "recorded":
                // the tier and its level are Turn facts, the answer under them
                // is not, and no transcript may read as a Gemini measurement.
                // A provider that DOES report its own level still wins — its
                // `detail` is spread last.
                const level = levelForTier(geminiTiers, named.tier);
                report.dials = { ...named, ...(level ? { level } : {}), ...detail };
              },
              onToolCall: (c) => report.tools.push(c),
            });
            agentResult = result;
            return { result, tools: executed.slice(), references: script.references.slice() };
          },

          // Fails open BY CONTRACT in the Worker too (`agent/draft-judge.ts`):
          // on any error the original draft ships. Unreachable here is that
          // error, so the draft ships — and a local run therefore does not
          // measure the judge's rewrite.
          async reviewDraft({ draft }) {
            return { text: draft, verdict: "skipped (no judge in the local transport)" };
          },

          async preflight() {
            report.gateAsk = script.gateAsk;
            return script.gateAsk ? { ask: script.gateAsk } : null;
          },

          // Recorded, never executed — the Worker adapter's rule, for the same
          // reason: a suite that files a Notion card per sample is a suite
          // nobody runs twice.
          async applyVerdict(verdict) {
            if (!verdict.execute) return;
            report.resolutions.push({
              toolName: verdict.execute.toolName,
              decision: verdict.decision ?? "confirm",
            });
          },

          cards: {
            async notionUpdateBody() {
              return "• (local transport — no Notion read)";
            },
            async notionArchiveTargetNote() {
              return undefined;
            },
            async implementDesignCard(_input, _userId, previewText) {
              return { text: `(local transport — no Figma render) ${previewText ?? ""}`.trim() };
            },
          },

          async readAntecedent() {
            return [];
          },

          describeAssistantContext: () => null,
        });

        return evalCase.evalTurnResponse({
          ...report,
          outcome,
          ...(agentResult ? { agentResult } : {}),
          // No subrequests were spent, and saying "0" is the truth here — the
          // meter is the Worker's instrument, not the turn's.
          meter: { subrequests: 0, hosts: "local", internal: 0, trips: 0 },
          // Not a Worker build — there is no Worker. What answered was a
          // recording, and whether it was authored or captured is the single
          // most important thing a results file read later must not lose.
          build: `local (${recorded.rec.source} recording)`,
          ms: Date.now() - startedAt,
        });
      } catch (err) {
        return {
          ok: false,
          build: "local",
          ms: Date.now() - startedAt,
          error: err instanceof Error ? `${err.message}` : String(err),
        };
      }
    },

    /**
     * Run-time subjects (#415), from the recording.
     *
     * The LIVE read is the Worker's: `selectSubject`'s ports are built from the
     * Supabase client in `integrations/blueprint.ts`, which names `Env`.
     * Rebuilding those reads here would be a second blueprint client — the
     * exact duplication the eval adapter was written to delete. So the row is
     * one a recording CARRIES, captured off that read when the case was
     * recorded, and the case replays against the same row it was recorded on.
     *
     * Three answers, in the worker transport's own shape so the runner reads
     * them the same way:
     *   - the recording carries a subject → that row;
     *   - the recording carries none      → a SKIP naming the field;
     *   - no recording at all             → a SKIP naming the transport, which
     *     is what a case reaches when someone calls this directly; the runner
     *     has already skipped an unrecorded case at `unsupported`.
     *
     * @param {string} need - the condition the case declares
     * @param {{id?: string}} [spec] - the case being asked about; the subject
     *   read is once per case (`run-evals.mjs`), so the case is what identifies
     *   which recording answers.
     */
    async fetchSubject(need, spec) {
      const rec = spec?.id ? byCase.get(spec.id) : null;
      if (rec?.subject) return { subject: rec.subject, build: `local (${rec.source} recording)` };
      if (rec) {
        return {
          subject: null,
          reason: `the recording for ${rec.case} carries no 'subject' for '${need}' — re-record it with scripts/eval-record.mjs, or run this case with --transport=worker`,
          build: `local (${rec.source} recording)`,
        };
      }
      const creds = Boolean(env.SUPABASE_URL && (env.SUPABASE_ANON_KEY || env.SUPABASE_KEY));
      return {
        subject: null,
        reason:
          `the local transport reaches no blueprint${creds ? " (a credential is set, but the subject read is the Worker's — integrations/blueprint.ts names Env)" : ""}` +
          ` — record '${need}' cases with scripts/eval-record.mjs, or run them with --transport=worker`,
        build: "local",
      };
    },
  };
}
