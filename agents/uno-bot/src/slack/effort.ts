// What "grind" and "chill" MEAN — one definition each, shared by every surface
// that can reach them.
//
// Grind is reachable two ways on purpose, not by accident: `/grind` from a
// composer, and the "Think harder about this" shortcut from a message's context
// menu. They are not duplicates — slash commands do not work in threads, so
// neither surface can reach the other's. But they must not DRIFT: two copies of
// "think harder" wording would diverge the first time one is edited, and the
// two surfaces would quietly start asking for different things.
//
// So the instruction and the tier live here once, and both surfaces import them.
// Chill has only the command surface today; it is defined the same way so the
// second surface costs nothing when it arrives.

import type { ModelTier } from "../agent/tiers";

export interface EffortMode {
  tier: ModelTier;
  /** Appended to the user's question. Says what to DO differently, not just
   *  "try harder" — the tier already changes the model; this changes the work. */
  instruction: string;
}

export const GRIND: EffortMode = {
  tier: "grind",
  instruction:
    "Assume the previous answer was thin. Check the claims against the sources rather than restating them, " +
    "and say explicitly where you now disagree with what was said before. " +
    "If it turns out the earlier answer was right, say that too — a second look that invents a disagreement is worse than no second look.",
};

export const CHILL: EffortMode = {
  tier: "chill",
  instruction:
    "Keep this short. Answer directly in a sentence or two, skip the caveats and the structure, " +
    "and do not go looking things up unless the question cannot be answered without it.",
};

/** Slash commands that set an effort mode rather than invoking a skill. */
export const EFFORT_COMMANDS: Record<string, EffortMode> = {
  "/grind": GRIND,
  "/chill": CHILL,
};
