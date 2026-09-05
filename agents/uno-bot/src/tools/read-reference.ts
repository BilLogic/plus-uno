// read_reference — the Worker's Tier 2 (#423).
//
// A document the bot was not handed, at zero network cost. The bundler routes
// every doc that declares `disclosure: reference` into src/generated/
// references.ts, a name → text map baked beside the prompt from the same
// assembly, so serving one is a property lookup: no subrequest, nothing to
// fail on a cold start, nothing to go stale between deploys independently of
// the prompt. The name is the path with the shape words removed —
// `skills/uno-maintain/references/method.md` is `uno-maintain/method` — and
// the bundler header is where that rule lives.
//
// PURE BY DESIGN: the map is a parameter with the baked one as its default, so
// the unit suite asserts the contract on a map of its own and the tracer on
// the real one, and the runtime never differs from what was tested.
//
// WHAT HAPPENS AFTER A READ is decided elsewhere, on purpose. The text rides
// the turn's provider contents while the turn runs (the loop appends every
// function response verbatim), and reaches a later turn only as the one-line
// stub below, carried by the history receipt — see provider-conversation.ts,
// which is the boundary where turn N's record becomes turn N+1's context.

import { REFERENCES } from "../generated/references";

/** The reference map's shape: name → document body, frontmatter stripped. */
export type ReferenceMap = Record<string, string>;

/**
 * Serve one document by name. Returns the tool's JSON payload as a string,
 * like every other read-only tool in loop-shared.ts.
 *
 * On a miss the payload carries `known` — every name the map holds, sorted —
 * because the model that asked for `uno-maintain/methods` needs the right
 * spelling more than it needs an apology, and a second call with a name off
 * this list is one lookup.
 */
export function readReference(input: Record<string, unknown>, map: ReferenceMap = REFERENCES): string {
  const known = Object.keys(map).sort();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return JSON.stringify({ ok: false, error: "missing reference name", known });
  }
  const text = Object.prototype.hasOwnProperty.call(map, name) ? map[name] : undefined;
  if (text === undefined) {
    return JSON.stringify({ ok: false, error: `unknown reference '${name}'`, known });
  }
  return JSON.stringify({ ok: true, name, chars: text.length, text });
}

/**
 * What a read becomes once its turn is over: one line naming the reference, in
 * place of its text. The next turn learns the method was consulted — so a
 * correction turn can judge the prior reply as grounded, and any turn can
 * re-read in one call — at ~50 chars instead of ~10k riding every iteration
 * of every later turn. Tool results are outside the Gemini lane's explicit
 * cache, which is what makes the difference paid, not notional.
 */
export function referenceStub(name: string): string {
  return `[reference ${name} was read this turn]`;
}
