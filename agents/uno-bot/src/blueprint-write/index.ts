// The gated blueprint writer: a staged blueprint revision, written through the
// authoring RPCs under uno-bot's own identity once a confirmer the card names
// presses ✅ (docs/adr/034-the-worker-writes-the-blueprint-behind-the-gate.md).
//
// A job stages a revision with `revisionCard`; the Gate resolves it; the
// `blueprint_revise` tool (`tools/blueprint-revise.ts`) writes it.

export { ENTITY_STATUSES, readRevision, type BlueprintRevision, type EntityStatus, type RevisionRow } from "./revision";
export { authoringCall, authoringCallCost, revisionWriteCalls, writeRevision, type RevisionResult, type WriterDeps } from "./write";
export { blueprintRpcFor, forgetBlueprintSession, signInCalls, writeIdentityGap, type WriteIdentityEnv } from "./session";
export { revisionCard } from "./stage";
