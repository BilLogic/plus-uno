-- Commitment reminders learn from people's answers (src/commitments/run.ts):
-- the end-of-day detector is shown the newest commitments people marked 🙌
-- (done) and 🤔 (not a promise), so each row now says what kind of place its
-- promise was made in. A channel's examples come only from public channels and
-- that channel itself: a DM's or another private place's never reach it.
--
-- FAILS CLOSED. A row written before this migration does not say where its
-- promise was made, and the private-channel sweep may have gone live first, so
-- an old row could be a private channel's. The default is therefore 'private':
-- an unknown old row teaches only its own channel's job. The backfill below
-- marks public only the rows from channels known to be public, so those still
-- teach every channel. From this migration on, every insert names its place.
-- Group DMs and DMs keep no commitments.
--
-- Additive: one column with a default, one backfill, one index. Applied with
-- `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md.
--
-- Still no message text or link (ADR-030): an example's short summary is read
-- from KV, where it expires with the rest of the commitment's wording.

ALTER TABLE commitments ADD COLUMN channel_kind TEXT NOT NULL DEFAULT 'private'
  CHECK (channel_kind IN ('public', 'private', 'group-dm', 'dm'));

-- The public channels on SWEEP_CHANNELS in agents/uno-bot/wrangler.toml when
-- this was written: plus-design C03FC8AS69K. (plus-design-feedback
-- C074QG2V7DJ, also listed there, is private and keeps the default.)
UPDATE commitments SET channel_kind = 'public' WHERE channel_id IN ('C03FC8AS69K');

-- The detector's examples: the newest answers of each kind.
CREATE INDEX commitments_by_answer ON commitments (state, resolved_at);

PRAGMA optimize;
