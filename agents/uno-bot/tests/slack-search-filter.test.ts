// The firewall's properties, as tests. Findings C1–C4 of the plan are all
// properties of selectHits(mode, payload) — the eval suite cannot reach them
// (an LLM judge cannot observe a hit that was never emitted), so they are
// asserted here against payloads shaped like Slack's documented response.

import { test } from "node:test";
import assert from "node:assert/strict";
import { selectHits, type SearchContextPayload } from "../src/tools/slack-search-filter";

const ALLOWED = "C07PZJD3HD5";
const allowlist = new Set([ALLOWED]);

/** A hit in the shape assistant.search.context actually returns: FLAT channel_id
 *  and channel_name, and NO privacy booleans anywhere. */
function payload(...hits: Record<string, unknown>[]): SearchContextPayload {
  return { ok: true, results: { messages: hits as never } };
}

const publicHit = {
  channel_id: "C0PUBLIC01",
  channel_name: "design",
  author_name: "Bill",
  message_ts: "1754400000.000100",
  content: "the spacing migration lands Thursday",
  permalink: "https://slack.com/archives/C0PUBLIC01/p1754400000000100",
};

const allowlistedPrivateHit = {
  ...publicHit,
  channel_id: ALLOWED,
  channel_name: "plus-design-private",
  permalink: `https://slack.com/archives/${ALLOWED}/p1754400000000100`,
};

const unlistedPrivateHit = {
  ...publicHit,
  channel_id: "C0SECRET99",
  channel_name: "hiring",
  permalink: "https://slack.com/archives/C0SECRET99/p1754400000000100",
};

// C1 — the old filter read m.channel.is_private, which this payload does not
// carry. On the private pass, a payload with no privacy flags must NOT fail
// open: the test is a positive allowlist match, so an unknown id is refused.
test("legacy-private admits only allowlisted ids, never on absent privacy flags", () => {
  const got = selectHits(
    "legacy-private",
    payload(allowlistedPrivateHit, unlistedPrivateHit),
    allowlist,
  );
  assert.equal(got.results.length, 1);
  assert.equal(got.results[0]?.channel, "#plus-design-private");
  assert.equal(got.dropped, 1);
});

test("legacy-private with an empty allowlist admits nothing", () => {
  const got = selectHits("legacy-private", payload(allowlistedPrivateHit), new Set());
  assert.deepEqual(got.results, []);
  assert.equal(got.dropped, 1);
});

// C3 — mode is exhaustive and its default is DROP. An unrecognized mode (a
// future caller, a bad refactor) must emit nothing rather than everything.
test("an unknown mode drops every hit", () => {
  const got = selectHits("nonsense" as never, payload(publicHit), allowlist);
  assert.deepEqual(got.results, []);
  assert.equal(got.dropped, 1);
});

test("public passes on the public-pinned passes, own passes everything", () => {
  for (const mode of ["legacy-public", "bot"] as const) {
    assert.equal(selectHits(mode, payload(publicHit), allowlist).results.length, 1, mode);
  }
  const own = selectHits(
    "own",
    payload(publicHit, unlistedPrivateHit, { ...publicHit, channel_id: "D0DM000001" }),
    new Set(),
  );
  assert.equal(own.results.length, 3);
  assert.equal(own.dropped, 0);
});

// A public-pinned pass still refuses a hit it cannot identify — the test is
// positive ("this id is present"), not "no reason to drop it".
test("a hit with no channel_id is dropped even on a public-pinned pass", () => {
  const got = selectHits("bot", payload({ ...publicHit, channel_id: undefined }), allowlist);
  assert.deepEqual(got.results, []);
  assert.equal(got.dropped, 1);
});

// Acceptance criterion: permalink asserted, not optional-chained away. A hit the
// model cannot cite is not emitted at all.
test("a hit with no permalink is dropped", () => {
  const got = selectHits("own", payload({ ...publicHit, permalink: undefined }), allowlist);
  assert.deepEqual(got.results, []);
  assert.equal(got.dropped, 1);
});

// C4 — context inherits nothing. Slack's context entries carry no channel_id,
// so they can never be cleared; a forged one from another channel is refused
// on the same rule.
test("context messages are dropped unless they carry the hit's own channel_id", () => {
  const got = selectHits(
    "own",
    payload({
      ...publicHit,
      context_messages: {
        before: [{ text: "no channel id — as Slack actually sends it", ts: "1.0" }],
        after: [{ channel_id: "C0SECRET99", text: "from somewhere else", ts: "2.0" }],
      },
    }),
    allowlist,
  );
  assert.equal(got.results.length, 1);
  assert.equal(got.results[0]?.context, undefined);
});

test("same-channel context survives, allowlisted-private stays hits-only", () => {
  const withContext = {
    context_messages: {
      before: [{ channel_id: publicHit.channel_id, text: "the line before", ts: "1.0" }],
    },
  };
  const kept = selectHits("legacy-public", payload({ ...publicHit, ...withContext }), allowlist);
  assert.equal(kept.results[0]?.context?.length, 1);

  // The allowlist was calibrated when only the matching line surfaced; context
  // from those channels is a widening ADR-020 never licensed.
  const priv = selectHits(
    "legacy-private",
    payload({
      ...allowlistedPrivateHit,
      context_messages: {
        before: [{ channel_id: ALLOWED, text: "surrounding private chatter", ts: "1.0" }],
      },
    }),
    allowlist,
  );
  assert.equal(priv.results.length, 1);
  assert.equal(priv.results[0]?.context, undefined);
});

test("an empty payload is empty, not a throw", () => {
  assert.deepEqual(selectHits("bot", { ok: true }, allowlist), { results: [], dropped: 0 });
});

test("the cap bounds what is emitted without inflating the withheld count", () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    ...publicHit,
    channel_id: `C0PUBLIC${String(i).padStart(2, "0")}`,
    permalink: `https://slack.com/archives/C${i}/p1`,
  }));
  const got = selectHits("bot", payload(...many), allowlist, 12);
  assert.equal(got.results.length, 12);
  assert.equal(got.dropped, 0); // capped ≠ withheld by the firewall
});
