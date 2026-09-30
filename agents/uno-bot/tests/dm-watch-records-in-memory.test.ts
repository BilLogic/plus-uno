// The DM watch records conformance suite against the in-memory store. The same
// cases run against D1 under workerd (tests/workerd/dm-watch-records.conformance.test.ts).
import { it } from "node:test";

import { createInMemoryDmWatchRecords } from "../src/dm-watch/index";
import { runDmWatchRecordsConformance } from "./helpers/dm-watch-records-conformance";

runDmWatchRecordsConformance("in-memory", createInMemoryDmWatchRecords, { it: (name, fn) => it(name, fn) });
