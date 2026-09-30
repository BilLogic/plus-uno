// The UsageLog conformance suite, run against the in-memory adapter. The D1
// adapter runs the same suite under workerd
// (tests/workerd/usage-log.conformance.test.ts). The ResolutionLog suite rides
// along on the same pair of runs.
import test from "node:test";

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
