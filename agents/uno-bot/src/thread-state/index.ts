// The module's front door: the interface, its records and timings, and the
// in-memory adapter. Callers move across in #494.
//
// Import from here rather than from `./store` or `./in-memory` directly, so
// that where an adapter lives stays the module's business.
//
// THE ONE EXCEPTION is the Durable Object adapter (#493), which is imported
// from `./durable-object` directly and is deliberately NOT re-exported here.
// This file is compiled by `tsconfig.test.json` (see its `include`), which
// types only Node — and the Durable Object adapter is the one file in the
// module that necessarily names Workers types (`DurableObjectNamespace`,
// `DurableObjectStub`). Re-exporting it would drag those into every module test
// and break the compile that keeps the rest of this module runtime-free. The
// Worker, which has the Workers types, pays the import path instead.
export * from "./store";
export { createInMemoryThreadState } from "./in-memory";
