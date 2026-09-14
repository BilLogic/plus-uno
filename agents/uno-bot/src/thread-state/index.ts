// The module's front door: the interface, its records and timings, and the
// in-memory adapter. The Durable Object adapter joins it in #493; callers move
// across in #494.
//
// Import from here rather than from `./store` or `./in-memory` directly, so
// that where an adapter lives stays the module's business.
export * from "./store";
export { createInMemoryThreadState } from "./in-memory";
