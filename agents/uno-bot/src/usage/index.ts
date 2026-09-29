// The usage module's front door: the record, the port, the adapters that need
// no `Env`, the rules that fill a record, and the price table.
//
// `./production.ts` is deliberately NOT re-exported — it is where `Env` becomes
// a UsageLog, the same boundary `thread-state/index.ts` keeps for its Durable
// Object adapter. A caller with an `Env` imports it by path.
export * from "./store";
export * from "./record";
export * from "./prices";
export * from "./categories";
export * from "./category-store";
export * from "./classify-run";
export { createInMemoryUsageLog, type InMemoryUsageLog } from "./in-memory";
export { createD1UsageLog, type UsageDatabase } from "./d1";
// How each ask was resolved: a second port over the same rows. Its `Env`
// wiring, `./resolution-env.ts`, stays out of the front door like `./production.ts`.
export * from "./resolution";
export { createInMemoryResolutionLog } from "./resolution-in-memory";
export { createD1ResolutionLog, type ResolutionDatabase } from "./resolution-d1";
export { decideAsk, runResolutionPass, type ResolutionPassDeps } from "./resolution-pass";
