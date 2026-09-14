// The conformance suite, run against the in-memory adapter under `node --test`.
//
// This file is deliberately tiny: every assertion lives in the suite, which is
// written against the interface alone and handed its runner, so
// tests/workerd/thread-state.conformance.test.ts points the SAME suite at the
// Durable Object adapter under workerd without copying a case.
import test from "node:test";

import { createInMemoryThreadState } from "../src/thread-state/in-memory";
import { runThreadStateConformance } from "./helpers/thread-state-conformance";

runThreadStateConformance("in-memory", (deps) => createInMemoryThreadState(deps), {
  it: (name, fn) => test(name, fn),
});
