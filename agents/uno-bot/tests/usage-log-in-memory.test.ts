// The UsageLog conformance suite, run against the in-memory adapter. The D1
// adapter runs the same suite under workerd
// (tests/workerd/usage-log.conformance.test.ts). The ResolutionLog suite rides
// along on the same pair of runs, and so does the AnswerFeedbackLog suite.
import test from "node:test";

import { createInMemoryAnswerFeedbackLog } from "../src/usage/feedback";
import { runAnswerFeedbackConformance } from "./helpers/answer-feedback-conformance";
import { createInMemoryAskCategories } from "../src/usage/category-store";
import { createInMemoryUsageLog } from "../src/usage/in-memory";
import { createInMemoryResolutionLog } from "../src/usage/resolution-in-memory";
import { runResolutionLogConformance } from "./helpers/resolution-log-conformance";
import { runCategoryConformance, runUsageLogConformance } from "./helpers/usage-log-conformance";

runUsageLogConformance("in-memory", () => createInMemoryUsageLog(), {
  it: (name, fn) => test(name, fn),
});

runCategoryConformance(
  "in-memory",
  () => {
    const log = createInMemoryUsageLog();
    return { log, store: createInMemoryAskCategories(log) };
  },
  { it: (name, fn) => test(name, fn) },
);

runResolutionLogConformance(
  "in-memory",
  () => {
    const usage = createInMemoryUsageLog();
    return { usage, resolutions: createInMemoryResolutionLog(usage) };
  },
  { it: (name, fn) => test(name, fn) },
);

runAnswerFeedbackConformance("in-memory", () => createInMemoryAnswerFeedbackLog(), {
  it: (name, fn) => test(name, fn),
});
