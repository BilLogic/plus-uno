// The module's front door: the turn, its request and outcome, the Delivery
// port and the recording adapter.
//
// Import from here rather than from `./turn` or `./delivery` directly, so that
// where a piece lives stays the module's business.
//
// THE ONE EXCEPTION is the Slack Delivery adapter (`slack/slack-delivery.ts`),
// which is deliberately NOT re-exported: this file is compiled by
// `tsconfig.test.json` (see its `include`), which types only Node, and that
// adapter necessarily names `Env` and the Slack client. Re-exporting it would
// drag Workers types into every module test and break the compile that keeps
// this module runtime-free — the same boundary `thread-state/index.ts` keeps,
// for the same reason. The Worker has the Workers types and pays the import
// path instead.
export * from "./turn";
export * from "./delivery";
