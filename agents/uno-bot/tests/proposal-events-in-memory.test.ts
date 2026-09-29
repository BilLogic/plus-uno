// The ProposalEventLog conformance suite, run against the in-memory adapter.
// The D1 adapter runs the same suite under workerd
// (tests/workerd/usage-log.conformance.test.ts).
import test from "node:test";

import { createInMemoryUsageLog } from "../src/usage/in-memory";
import { createInMemoryProposalEventLog } from "../src/usage/proposal-events-in-memory";
import { runProposalEventConformance } from "./helpers/proposal-events-conformance";

runProposalEventConformance(
  "in-memory",
  () => {
    const turns = createInMemoryUsageLog();
    return { events: createInMemoryProposalEventLog({ turns }), turns };
  },
  { it: (name, fn) => test(name, fn) },
);
