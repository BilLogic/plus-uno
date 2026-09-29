// The UsageLog conformance suite, run against the in-memory adapter. The D1
// adapter runs the same suite under workerd
// (tests/workerd/usage-log.conformance.test.ts).
import test from "node:test";

import { createInMemoryAskCategories } from "../src/usage/category-store";
import { createInMemoryUsageLog } from "../src/usage/in-memory";
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
