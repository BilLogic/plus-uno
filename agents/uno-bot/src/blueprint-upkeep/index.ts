// Blueprint upkeep: the service-change gate, a revision drafted from shipped
// work, and its card on the morning sweep. `Env` enters in `./env.ts`.

export {
  confidentMatch,
  confidentMatches,
  isConfidentRow,
  MATCH_SCORE_FLOOR,
  serviceChangeGate,
  type GateDeps,
  type GateResult,
  type ScenarioMatch,
  type ServiceChangeGate,
  type ServiceChangeInput,
} from "./gate";
export { draftRevision, readDraft, type Draft, type DraftedChange, type DraftInput, type PathToday } from "./draft";
export { revisionItem, revisionText, type RevisionSource } from "./card";
export {
  CARDS_PER_MATCH_JOB,
  DEPLOYED,
  DRAFT_COST,
  DRAFT_JOBS,
  draftMatched,
  handOverRevisions,
  MATCH_COST,
  MATCH_JOBS,
  matchShipped,
  PATHS_PER_DRAFT_JOB,
  postOverflow,
  REVISION_CARD_TTL_MS,
  revisionSection,
  runShippedRevisions,
  stagedRevision,
  UPKEEP_SECTION,
  weighedKey,
  type HandOverDeps,
  type MatchedPath,
  type OverflowDeps,
  type RevisionHanded,
  type RevisionThread,
  type RevisionThreadCard,
  type RevisionThreads,
  type SectionDeps,
  type ShippedCard,
  type ShippedDeps,
  type ShippedReport,
  type UpkeepState,
  type WaitingRevision,
  type WeighedMarks,
} from "./job";
export { redraftRevision, type RedraftDeps, type RevisionReply } from "./revise";
