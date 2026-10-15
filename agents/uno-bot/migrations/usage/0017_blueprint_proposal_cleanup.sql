-- Drawn blueprint proposals' clean-up (src/blueprint-upkeep/proposal-cleanup.ts):
-- when a proposal was offered for removal, and when it was withdrawn.
--
-- Additive: two nullable columns on `blueprint_proposals`
-- (0016); nothing else is touched. The daily check's read is served by 0016's
-- `blueprint_proposals_unlinked` index. Applied with `wrangler d1 migrations apply
-- uno-bot-usage` — see migrations/README.md — BEFORE the Worker that writes
-- them is deployed.
--
-- `offered_at`: epoch ms the daily check offered the requester the proposal's
-- removal, in its thread — once, so it is never offered again. Cleared only
-- when the offer did not go up. `withdrawn_at`: epoch ms its cells and path
-- were deleted from the blueprint, on the requester's ✅; the row stays, so
-- neither the thread nor the check sees it again. Times only (ADR-030).
--
-- The commitments conformance suite drops both columns before it replays
-- from 0006, as it does 0015's.

ALTER TABLE blueprint_proposals ADD COLUMN offered_at INTEGER;
ALTER TABLE blueprint_proposals ADD COLUMN withdrawn_at INTEGER;

PRAGMA optimize;
