// Blueprint upkeep: the service-change gate, a revision drafted from shipped
// work, and its card on the morning sweep. `Env` enters in `./env.ts`.

export {
  confidentMatch,
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
  DEPLOYED,
  handOverRevisions,
  MAX_CARDS_PER_RUN,
  REVISION_CARD_TTL_MS,
  revisionSection,
  runShippedRevisions,
  stagedRevision,
  UPKEEP_SECTION,
  type HandOverDeps,
  type RevisionHanded,
  type SectionDeps,
  type ShippedCard,
  type ShippedDeps,
  type ShippedReport,
  type UpkeepState,
  type WaitingRevision,
} from "./job";
