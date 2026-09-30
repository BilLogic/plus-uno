// The commitment records conformance suite against the in-memory store. The
// same cases run against D1 under workerd
// (tests/workerd/commitment-records.conformance.test.ts).
import { it } from "node:test";

import { createInMemoryCommitmentStore } from "../src/commitments/index";
import { runCommitmentRecordsConformance } from "./helpers/commitment-records-conformance";

runCommitmentRecordsConformance("in-memory", createInMemoryCommitmentStore, { it: (name, fn) => it(name, fn) });
