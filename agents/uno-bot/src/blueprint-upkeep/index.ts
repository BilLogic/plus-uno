// Blueprint upkeep: the service-change gate, a revision drafted from shipped
// work, its card on the morning sweep, and an idea set beside today's path at
// a conversation's milestones — the blueprint check a milestone's card offers,
// and the offer to draft the idea on the blueprint as a proposal. `Env` enters in `./env.ts`.

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
export { DRAFT_MAX_TOKENS, draftRevision, readDraft, whyNoDraft, type Draft, type DraftedChange, type DraftInput, type PathToday } from "./draft";
export { revisionBody, revisionItem, revisionSays, revisionText, type RevisionSource } from "./card";
export { firstChangedCell, proposalFacts, revisionFacts, rowsLine } from "./facts";
export { cardEvidence, MAX_PRDS, prdIdsOf, type EvidencePage } from "./evidence";
export { promotionDraft, retirementDraft, stageOf, STAGES, variantPromotionDraft, type PlannedRows, type ShipStage } from "./stages";
export { cardKey, keepProposalLinks, prdCardOf, rememberCreatedPage, type LinkDeps, type MatterPages, type ThreadCards } from "./link";
export {
  blueprintCheckRunnerKey,
  cardNow,
  JUDGEMENT_SUBREQUESTS,
  CHECK_DEADLINE_MS,
  NOTES_HEADING,
  pageUpdateWithNotes,
  prdWithNotes,
  runBlueprintCheck,
  stopRunningCheck,
  type BlueprintCheckJob,
  serviceChangeJudgement,
  type BlueprintCheckDeps,
  type CheckMatch,
  type CardNow,
  type CheckOutcome,
  type CheckResults,
  type PostedCard,
  type ResultsAction,
  type JudgementDeps,
  type ServiceChangeJudgement,
} from "./check";
export {
  comparisonText,
  handOffMilestone,
  prdMilestone,
  type Comparison,
  type Milestone,
} from "./milestone";
export {
  DRAFT_COST,
  DRAFT_JOBS,
  draftMatched,
  handOverRevisions,
  MATCH_COST,
  MATCH_JOBS,
  matchShipped,
  ownersOf,
  replanRows,
  REVISION_REDRAFT_POINTER,
  REVISION_SENT_BACK,
  revisionSection,
  runShippedRevisions,
  stagedRevision,
  UPKEEP_SECTION,
  weighedKey,
  type HandOverDeps,
  type MatchedPath,
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
export {
  draftProposal,
  drawnProposalOf,
  PROPOSAL_DRAFT_TIER,
  PROPOSAL_OFFER_SUBREQUESTS,
  PROPOSAL_SYSTEM,
  proposalOfferCard,
  proposalPathName,
  proposalSlotKey,
  readProposalDraft,
  stagedProposalOffer,
  whyNoProposal,
  type ProposalDraft,
  type ProposalDrafter,
} from "./proposal";
export { createInMemoryProposalRecords, type DrawnProposal, type ProposalRecords } from "./proposal-records";
export { redraftRevision, type RedraftDeps, type RevisionReply } from "./revise";
