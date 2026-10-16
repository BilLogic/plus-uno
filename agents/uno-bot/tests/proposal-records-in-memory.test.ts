// The drawn-proposal records conformance suite against the in-memory store.
// The same cases run against D1 under workerd
// (tests/workerd/proposal-records.conformance.test.ts).
import { it } from "node:test";

import { createInMemoryProposalRecords } from "../src/blueprint-upkeep/index";
import { runProposalRecordsConformance } from "./helpers/proposal-records-conformance";

runProposalRecordsConformance("in-memory", createInMemoryProposalRecords, { it: (name, fn) => it(name, fn) });
