import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSearchResponse,
  buildUnavailableResponse,
  connectOffer,
  connectNoteForResults,
  connectNoteForUnavailable,
} from "../src/tools/slack-search-response";

const base = {
  query: "migration deadline",
  visibility: "workspace-filtered (public + team-allowlisted private)",
  searchedSurfaces: "public_channel,private_channel",
  results: [{ text: "a hit" }],
  dropped: 6,
  inOwnDm: false,
};

// ── S2: the live surface-gate failure (judged eval, r47, 2026-08-06) ─────────
// In a public channel the bot said "there were 6 matches in private spaces that
// were withheld". The count is the disclosure — it confirms private material
// exists on a named topic to everyone in the room.

test("withheld count is NEVER sent outside the requester's own DM", () => {
  const body = buildSearchResponse(base);
  assert.equal("withheld_private_matches" in body, false);
});

test("withheld count IS sent in the requester's own DM", () => {
  const body = buildSearchResponse({ ...base, inOwnDm: true });
  assert.equal(body.withheld_private_matches, 6);
});

test("zero withheld hits sends no count even in a DM — nothing to disclose", () => {
  const body = buildSearchResponse({ ...base, inOwnDm: true, dropped: 0 });
  assert.equal("withheld_private_matches" in body, false);
});

// ── S1: absence must be scoped to what was searched ──────────────────────────

test("an empty result carries the absence-scope instruction", () => {
  const body = buildSearchResponse({ ...base, results: [] });
  assert.ok(typeof body.absence_scope === "string");
  assert.match(String(body.absence_scope), /public_channel/);
  assert.match(String(body.absence_scope), /not an absence in Slack/i);
});

test("a non-empty result carries no absence instruction", () => {
  const body = buildSearchResponse(base);
  assert.equal("absence_scope" in body, false);
});

test("absence scope and withheld count coexist in a DM", () => {
  // Zero surfaced hits but six withheld is exactly when the model is most
  // likely to overclaim absence, so both signals must be present together.
  const body = buildSearchResponse({ ...base, results: [], inOwnDm: true });
  assert.equal(body.withheld_private_matches, 6);
  assert.ok(typeof body.absence_scope === "string");
});

// ── unchanged contract ───────────────────────────────────────────────────────

test("searched_surfaces and visibility always ride along", () => {
  const body = buildSearchResponse(base);
  assert.equal(body.ok, true);
  assert.equal(body.searched_surfaces, "public_channel,private_channel");
  assert.equal(body.visibility, base.visibility);
  assert.deepEqual(body.results, base.results);
});

test("the connect nudge is passed through when present", () => {
  const body = buildSearchResponse({ ...base, inOwnDm: true, connectNote: "connect at https://x" });
  assert.match(String(body.note), /connect at/);
  assert.equal("note" in buildSearchResponse(base), false);
});

// ── S3 regression: absence guidance must not crowd out the connect nudge ─────
// Adding absence_scope alone fixed S1 and broke S3 in the same run — the model
// scoped the absence and dropped the connect link. Both obligations now travel
// in one instruction.

test("an empty result in an unconsented DM carries BOTH the scope and the link", () => {
  const body = buildSearchResponse({
    ...base,
    results: [],
    inOwnDm: true,
    connectNote: "connect at https://uno-bot.example/oauth/slack/start",
  });
  const scope = String(body.absence_scope);
  assert.match(scope, /not an absence in Slack/i);
  assert.match(scope, /NOT searched/);
  assert.match(scope, /oauth\/slack\/start/);
  // and still available on its own for the non-empty case
  assert.match(String(body.note), /oauth\/slack\/start/);
});

test("an empty result with no connect note keeps the scope instruction clean", () => {
  const body = buildSearchResponse({ ...base, results: [], inOwnDm: true });
  const scope = String(body.absence_scope);
  assert.match(scope, /not an absence in Slack/i);
  assert.doesNotMatch(scope, /connect/i);
});

// ── S3, second half: the nudge must exist on the paths where NOTHING ran ─────
// S3 read 0/3 against r254, every reply saying workspace search "isn't
// available on this turn" — the tool's own words, from the branch ABOVE the
// credential loop. The connect link was built inside that loop, so the one turn
// where the requester most needs it (their own DM, nothing stored, no
// action_token) was the one turn it could not exist. The model was not
// withholding the offer; it was never handed one.

test("an unavailable search still carries the connect offer", () => {
  const body = buildUnavailableResponse({
    error: "workspace search unavailable (no search credential stored) — use thread/channel reads instead",
    connectNote: connectNoteForUnavailable("https://uno-bot.example/oauth/slack/start"),
  });
  assert.equal(body.ok, false);
  assert.match(String(body.error), /no search credential stored/);
  assert.match(String(body.note), /oauth\/slack\/start/);
});

test("an unavailable search says plainly that it is not an empty result", () => {
  // Otherwise the S1 failure rides in on the S3 fix: "these results do not
  // cover DMs" beside an error invites the model to report a search that never
  // ran as a search that found nothing.
  const note = connectNoteForUnavailable("https://x/oauth/slack/start");
  assert.match(note, /NOT an empty result/);
  assert.doesNotMatch(note, /these results/);
});

test("with no connect URL the unavailable result carries no note at all", () => {
  // The leg that stays diagnosable: a transcript showing this error and NO note
  // says the Worker has no SLACK_OAUTH_REDIRECT_URI — not that the model
  // dropped a link it was given.
  const body = buildUnavailableResponse({ error: "workspace search unavailable" });
  assert.equal("note" in body, false);
});

test("the offer sentence is the same wherever it is made", () => {
  const url = "https://uno-bot.example/oauth/slack/start";
  const offer = connectOffer(url);
  assert.ok(connectNoteForResults(url).includes(offer));
  assert.ok(connectNoteForUnavailable(url).includes(offer));
  assert.match(connectNoteForResults(url), /do not cover DMs/);
});
