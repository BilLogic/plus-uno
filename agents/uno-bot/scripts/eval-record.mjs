// Capture model replies from a live Worker into the local transport's
// recordings (#512).
//
// The local transport replays recorded replies through the Turn module
// (`eval-transport-local.mjs`). Three recordings were AUTHORED by hand, because
// writing this ticket needed no Vertex credential and fabricating a score is
// worse than admitting a gap. This script is the other half: given a deployed
// Worker and a debug token, it walks the fixture, POSTs each case's turns to
// /debug/eval exactly as the worker transport does, and writes what the model
// actually said into `docs/evals/fixtures/recordings/<case>.json` with
// `source: "captured"`.
//
// WHAT IT CAN AND CANNOT RECOVER. The /debug/eval response reports the turn's
// RESULT and the tool calls the model made with their arguments — it does not
// report iteration boundaries. So a captured turn is reconstructed as:
//
//   * one reply carrying every tool call the turn made, in order, and the
//     narration the turn posted as its text (a lookup turn), then
//   * one final reply carrying the answer — text, or the side-effect call the
//     proposal was staged from, or the `proposal_resolve` the decision came
//     from.
//
// That is a faithful replay of what the loop DECIDED and a lossy one of how many
// round-trips it took. Every captured file says so in its own `note`, and
// `reconstructReplies` below is the only place the reconstruction lives, so a
// future route that reports iterations can improve it in one edit.
//
// Tool RESULTS are not on the wire either (the response carries each result's
// self-description, not its body — `agent/tool-transcript.ts`). A captured
// recording therefore records the tool CALLS and leaves `toolResults` empty,
// which the transport answers with its honest empty read. A case whose behaviour
// turns on what a lookup returned needs that result written in by hand, and the
// file is the place to write it.
//
// Env:
//   WORKER_URL   the Worker origin (or UNO_BOT_WORKER_URL — scripts/worker-url.mjs)
//   DEBUG_TOKEN  the Worker's /debug/* gate token
//
// Run:  node agents/uno-bot/scripts/eval-record.mjs [--case=R3] [--case=R5] [--all] [--out=<dir>]
//
// Every call is a live billable model run, so the default is NOTHING: name the
// cases you mean, or pass `--all` and mean it. A case that declares a run-time
// subject is refused — its prompt is filled in from a board that is edited
// daily, so the recording would be a fact about one afternoon.

import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { argv, exit } from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { workerTransport } from "./eval-transport.mjs";
import { threadTurn } from "./eval-history.mjs";
import { RECORDINGS_DIR } from "./eval-transport-local.mjs";
import { workerOrigin } from "./worker-url.mjs";

const CASES_PATH = process.env.CASES_PATH ?? "docs/evals/fixtures/uno-bot-cases.json";

export function parseArgs(args) {
  const opts = { cases: [], all: false, out: RECORDINGS_DIR };
  for (const arg of args) {
    const kv = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!kv) throw new Error(`unknown argument ${arg}`);
    const [, key, value] = kv;
    if (key === "case" && value) opts.cases.push(value);
    else if (key === "all") opts.all = true;
    else if (key === "out" && value) opts.out = value;
    else throw new Error(`unknown argument ${arg} (usage: eval-record.mjs [--case=ID]… [--all] [--out=DIR])`);
  }
  return opts;
}

/**
 * The model replies a /debug/eval response implies, in the ScriptedReply shape
 * the fake provider replays — see this file's header for what is and is not
 * recoverable.
 *
 * @param {object} resp - one /debug/eval response
 * @returns {Array<object>} replies
 */
export function reconstructReplies(resp) {
  const result = resp?.result ?? null;
  const tools = Array.isArray(resp?.tools) ? resp.tools : [];
  const narration = Array.isArray(resp?.narration) ? resp.narration : [];
  const replies = [];

  // The lookups, as one tool-calling round-trip. `proposal_resolve` and the
  // side-effect call are NOT lookups — they are how the turn ended, and they
  // belong to the final reply below.
  const lookups = tools.filter((t) => t.name !== "proposal_resolve" && !isSideEffectResult(result, t));
  if (lookups.length) {
    replies.push({
      ...(narration[0] ? { text: narration[0] } : {}),
      toolCalls: lookups.map((t) => ({ name: t.name, args: t.args ?? {} })),
    });
  }

  if (result?.kind === "proposal") {
    replies.push({
      ...(result.previewText ? { text: result.previewText } : {}),
      toolCalls: [{ name: result.toolName, args: result.input ?? {} }],
    });
  } else if (result?.kind === "resolved") {
    replies.push({
      toolCalls: [
        {
          name: "proposal_resolve",
          args: {
            decision: result.decision,
            ...(result.messageToUser ? { message_to_user: result.messageToUser } : {}),
          },
        },
      ],
    });
  } else {
    replies.push({ text: result?.text ?? "" });
  }
  return replies;
}

/** True when this tool call IS the side effect the turn was staged from, so it
 *  is not replayed twice. */
function isSideEffectResult(result, call) {
  return result?.kind === "proposal" && call.name === result.toolName;
}

/** One case, recorded. */
export async function recordCase(spec, transport) {
  const history = [];
  let pending = null;
  const turns = [];
  for (const turn of spec.turns) {
    const surface = {};
    const channel = turn.channel ?? spec.channel;
    const requestedBy = turn.requestedBy ?? spec.requestedBy;
    if (channel) surface.channel = channel;
    if (requestedBy) surface.requestedBy = requestedBy;
    const resp = await transport.runTurn({
      prompt: turn.prompt,
      history,
      pending: turn.usePendingFromPreviousTurn ? pending : null,
      surface,
    });
    if (!resp?.ok) throw new Error(`${spec.id}: turn errored — ${resp?.error ?? "no response"}`);
    turns.push({
      prompt: turn.prompt,
      replies: reconstructReplies(resp),
      toolResults: [],
      ...(resp.references?.length ? { references: resp.references } : {}),
      ...(resp.gateAsk ? { gateAsk: resp.gateAsk } : {}),
    });
    pending = threadTurn(history, turn.prompt, resp, pending);
  }
  return {
    case: spec.id,
    source: "captured",
    recordedAt: new Date().toISOString().slice(0, 10),
    note:
      `CAPTURED from ${transport.name}. Round-trip boundaries are reconstructed, not reported — ` +
      `the lookups are replayed as one reply and the answer as the next (scripts/eval-record.mjs). ` +
      `Tool RESULT bodies are not on the wire, so 'toolResults' is empty and the local transport ` +
      `answers each lookup with an honest empty read; if this case turns on what a lookup returned, write it in here.`,
    turns,
  };
}

async function main() {
  const opts = parseArgs(argv.slice(2));
  const token = process.env.DEBUG_TOKEN;
  if (!token) {
    console.error("missing env DEBUG_TOKEN");
    exit(2);
  }
  const fixture = JSON.parse(readFileSync(CASES_PATH, "utf8"));
  const wanted = opts.all
    ? fixture.cases
    : fixture.cases.filter((c) => opts.cases.includes(c.id));
  if (!wanted.length) {
    console.error(
      `nothing to record — name cases with --case=ID or pass --all (have: ${fixture.cases.map((c) => c.id).join(", ")})`,
    );
    exit(2);
  }

  const transport = workerTransport(process.env.WORKER_URL || workerOrigin(), token);
  mkdirSync(opts.out, { recursive: true });
  let written = 0;
  for (const spec of wanted) {
    if (spec.subject?.need) {
      // A run-time subject is resolved from the live board before turn 1, so the
      // prompt this recording would carry is one afternoon's row. The local
      // transport skips subject cases by name for the same reason.
      console.log(`[record] SKIP ${spec.id} — declares subject '${spec.subject.need}' (run-time, not recordable)`);
      continue;
    }
    try {
      const recording = await recordCase(spec, transport);
      const path = resolve(opts.out, `${spec.id}.json`);
      writeFileSync(path, `${JSON.stringify(recording, null, 2)}\n`);
      written++;
      console.log(`[record] ${spec.id} → ${path} (${recording.turns.length} turn(s))`);
    } catch (err) {
      console.error(`[record] FAILED ${spec.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`[record] wrote ${written} recording(s) to ${opts.out}`);
}

if (argv[1] && resolve(argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`[record] FAILED: ${err.message}`);
    exit(1);
  });
}
