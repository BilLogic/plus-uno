// The sweep records conformance suite against the in-memory store. The same
// cases run against D1 under workerd (tests/workerd/sweep-records.conformance.test.ts).
import { it } from "node:test";

import { createInMemorySweepStore } from "../src/sweep/index";
import { runSweepRecordsConformance } from "./helpers/sweep-records-conformance";

runSweepRecordsConformance("in-memory", createInMemorySweepStore, { it: (name, fn) => it(name, fn) });
