-- Commitment reminders learn from people's answers (src/commitments/run.ts):
-- the end-of-day detector is shown the newest commitments people marked 🙌
-- (done) and 🤔 (not a promise), so each row now says what kind of place its
-- promise was made in. A channel's examples come only from public channels and
-- that channel itself: a DM's or another private place's never reach it.
--
-- Additive: one column with a default, and one index. Every row already here
-- came from a public channel, so the default is true of all of them: the
-- sweep's allowlisted private channels reach production in the same deploy as
-- this migration, and from then on every insert names its place — 'private'
-- for a promise in a private sweep channel. Group DMs and DMs keep no
-- commitments. Applied
-- with `wrangler d1 migrations apply uno-bot-usage` — see migrations/README.md.
--
-- Still no message text or link (ADR-030): an example's short summary is read
-- from KV, where it expires with the rest of the commitment's wording.

ALTER TABLE commitments ADD COLUMN channel_kind TEXT NOT NULL DEFAULT 'public'
  CHECK (channel_kind IN ('public', 'private', 'group-dm', 'dm'));

-- The detector's examples: the newest answers of each kind.
CREATE INDEX commitments_by_answer ON commitments (state, resolved_at);

PRAGMA optimize;
