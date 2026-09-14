// The conformance suite, run against the in-memory adapter under `node --test`.
//
// This file is deliberately three lines: every assertion lives in the suite,
// which is written against the interface alone, so #493 can point the same
// suite at the Durable Object adapter under workerd without copying a case.
import { createInMemoryThreadState } from "../src/thread-state/in-memory";
import { runThreadStateConformance } from "./helpers/thread-state-conformance";

runThreadStateConformance("in-memory", (deps) => createInMemoryThreadState(deps));
