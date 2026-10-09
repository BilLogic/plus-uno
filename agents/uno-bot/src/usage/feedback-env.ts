// Where `Env` becomes the feedback log (`./feedback.ts`). Beside
// `./production.ts` rather than in it, as `./resolution-env.ts` is: a caller
// with an `Env` imports it by path, and `./index.ts` does not re-export it.

import type { Env } from "../types";
import { createD1AnswerFeedbackLog } from "./feedback-d1";
import type { AnswerFeedbackLog } from "./feedback";

/** A log that keeps nothing — the Worker without `USAGE_DB`. `./production.ts` says so once. */
const NO_FEEDBACK_LOG: AnswerFeedbackLog = {
  async record() {},
  async get() {
    return null;
  },
};

export function answerFeedbackLogFor(env: Pick<Env, "USAGE_DB">): AnswerFeedbackLog {
  return env.USAGE_DB ? createD1AnswerFeedbackLog({ db: env.USAGE_DB }) : NO_FEEDBACK_LOG;
}
