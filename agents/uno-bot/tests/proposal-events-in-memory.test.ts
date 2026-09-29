// The ProposalEventLog conformance suite, run against the in-memory adapter.
// The D1 adapter runs the same suite under workerd
// (tests/workerd/usage-log.conformance.test.ts).
import test from "node:test";

import { createInMemoryUsageLog } from "../src/usage/in-memory";
import { createInMemoryProposalEventLog } from "../src/usage/proposal-events-in-memory";
import { createInMemoryResolutionLog } from "../src/usage/resolution-in-memory";
import { runProposalEventConformance } from "./helpers/proposal-events-conformance";

runProposalEventConformance(
  "in-memory",
  () => {
    const turns = createInMemoryUsageLog();
    const resolutions = createInMemoryResolutionLog(turns);
    // The evidence the D1 query reads off the same rows.
    const completed = async (proposalId: string) => {
      const staging = turns.records().find((t) => t.proposalId === proposalId);
      return staging ? (await resolutions.getResolution(staging.turnId))?.resolution === "task_completed" : false;
    };
    return { events: createInMemoryProposalEventLog({ turns, completed }), turns, resolutions };
  },
  { it: (name, fn) => test(name, fn) },
);
