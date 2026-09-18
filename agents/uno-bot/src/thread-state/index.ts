// The module's front door: the interface, its records and timings, and the
// in-memory adapter. Callers move across in #494.
//
// Import from here rather than from `./store` or `./in-memory` directly, so
// that where an adapter lives stays the module's business.
//
// THE ONE EXCEPTION is the Durable Object adapter (#493), which is imported
// from `./durable-object` directly and is deliberately NOT re-exported here.
// It is the one file in the module that only RUNS inside workerd: it names
// `DurableObjectNamespace` and `DurableObjectStub` and its storage calls are
// the runtime's. A Node test importing this front door would get it in the
// bargain and could do nothing with it, and the conformance suite that holds
// the two adapters equal runs the in-memory one here and the Durable Object one
// under `tests/workerd/`. The Worker pays the import path instead.
//
// (Not a compile boundary, and the claim that it was — "`tsconfig.test.json`
// types only Node" — was already false when it was written: that compile has
// carried `@cloudflare/workers-types` beside the Node ones since ADR-029, and
// globs `src/**` since #595, so the adapter is on it either way.)
export * from "./store";
export { createInMemoryThreadState } from "./in-memory";
