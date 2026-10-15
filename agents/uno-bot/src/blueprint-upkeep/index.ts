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
export { cardEvidence, MAX_PRDS, prdIdsOf, type EvidencePage } from "./evidence";
export { promotionDraft, stageOf, STAGES, type PlannedRows, type ShipStage } from "./stages";
export {
  DRAFT_COST,
  DRAFT_JOBS,
  draftMatched,
  handOverRevisions,
  MATCH_COST,
  MATCH_JOBS,
  matchShipped,
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
