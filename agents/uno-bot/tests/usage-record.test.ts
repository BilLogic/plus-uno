// The rules that turn a finished turn into a usage row: ask time and latency,
// cost from the price table, cited sources, the self-filed ticket, and the
// test-traffic rule. Turn's own tests (tests/turn-usage.test.ts) assert the row
// a whole turn leaves; these pin each rule on its own.
import assert from "node:assert/strict";
import test from "node:test";

import {
  askedAtOf,
  buildTurnRecord,
  estimateCostUsd,
  isTestOrigin,
  isTestTraffic,
  isThanks,
  MAX_REQUEST_TEXT_CHARS,
  keepsRequestText,
  ratesFor,
  selfFiledTicketOf,
  sourcesCitedIn,
  teamPostChannel,
  type TurnRecordFacts,
  withAskLabel,
} from "../src/usage/index";
import { GEMINI_TIERS } from "../src/agent/gemini-tiers";
import type { TurnDisposition } from "../src/turn/index";
import { conversationTypeOf } from "../src/turn/request";
import { slackTurnRequest } from "../src/slack/turn-request";

const SEP_2026 = Date.UTC(2026, 8, 29);

const facts = (over: Partial<TurnRecordFacts> = {}): TurnRecordFacts => ({
  build: "r1",
  origin: "slack",
  testChannelIds: [],
  requesterId: "U1",
  surface: "channel",
  conversationType: "channel",
  inThread: false,
  channel: "C1",
  askTs: "1790000000.100000",
  question: "where is the onboarding PRD?",
  startedAt: 1_790_000_001_000,
  firstAnswerAt: 1_790_000_004_100,
  tier: "default",
  routeReason: "default",
  toolsCalled: [],
  referencesRead: [],
  disposition: "answered",
  ...over,
});

// ── time ─────────────────────────────────────────────────────────────────────

test("the ask time is the Slack ts, and the latency is measured from it", () => {
  const record = buildTurnRecord(facts());
  assert.equal(record.askedAt, 1_790_000_000_100);
  assert.equal(record.latencyMs, 4_000);
});

test("a ts that is not Slack's falls back to when the turn began", () => {
  assert.equal(askedAtOf("0", 42), 42);
  assert.equal(askedAtOf("eval-1", 42), 42);
});

test("an ask with no Slack ts gets a row of its own per run", () => {
  assert.equal(buildTurnRecord(facts({ askTs: "0", startedAt: 5 })).turnId, "C1:0@5");
  assert.notEqual(
    buildTurnRecord(facts({ askTs: "0", startedAt: 5 })).turnId,
    buildTurnRecord(facts({ askTs: "0", startedAt: 6 })).turnId,
  );
});

test("a turn that put nothing in front of the person has no latency", () => {
  const record = buildTurnRecord(facts({ firstAnswerAt: null, disposition: "stopped" }));
  assert.equal(record.latencyMs, null);
  assert.equal(record.stopUsed, true);
});

// ── place ────────────────────────────────────────────────────────────────────

test("the channel id is kept for channel turns and dropped for DM turns", () => {
  assert.equal(buildTurnRecord(facts()).channelId, "C1");
  assert.equal(buildTurnRecord(facts({ surface: "assistant", channel: "D9" })).channelId, null);
  assert.equal(buildTurnRecord(facts({ surface: "assistant", channel: "D9" })).turnId, "D9:1790000000.100000");
});

// ── cost ─────────────────────────────────────────────────────────────────────

test("Gemini's prompt count includes its cached tokens, and thinking is billed as output", () => {
  const usd = estimateCostUsd(
    "gemini",
    "gemini-3.8-flash",
    { inputTokens: 1_000_000, cachedInputTokens: 600_000, outputTokens: 100_000, thinkingTokens: 100_000 },
    SEP_2026,
  );
  // 400k fresh × 0.75 + 600k cached × 0.075 + 200k out × 3.75, per million.
  assert.equal(usd, 0.3 + 0.045 + 0.75);
});

test("Claude's cache reads arrive apart from its input count", () => {
  const usd = estimateCostUsd(
    "vertex-claude",
    "claude-sonnet-5",
    { inputTokens: 1_000_000, cachedInputTokens: 500_000, outputTokens: 100_000, thinkingTokens: 0 },
    SEP_2026,
  );
  assert.equal(usd, 2 + 0.1 + 1);
});

test("a dated rate gives way to the next one", () => {
  assert.equal(ratesFor("gemini-3.8-flash", SEP_2026)?.input, 0.75);
  assert.equal(ratesFor("gemini-3.8-flash", Date.UTC(2027, 0, 1))?.input, 1.5);
});

test("every tier's default model is priced, so no tier's turns read as unpriced", () => {
  for (const [tier, cfg] of Object.entries(GEMINI_TIERS)) {
    assert.notEqual(ratesFor(cfg.model, SEP_2026), null, `${tier}: ${cfg.model} is unpriced`);
  }
});

test("Gemini 4 Argon's launch rate gives way on 1 December 2026", () => {
  assert.deepEqual(ratesFor("gemini-4-argon", Date.UTC(2026, 10, 30)), { input: 2, output: 10, cachedInput: 0.1 });
  assert.deepEqual(ratesFor("gemini-4-argon", Date.UTC(2026, 11, 1)), { input: 4, output: 20, cachedInput: 0.2 });
});

test("a Vertex snapshot suffix is priced as its model", () => {
  assert.deepEqual(ratesFor("claude-haiku-4-5@20251001", SEP_2026), ratesFor("claude-haiku-4-5", SEP_2026));
});

test("an unpriced model costs null, never zero", () => {
  const record = buildTurnRecord(
    facts({
      spend: {
        provider: "gemini",
        model: "gemini-9-ultra",
        fallback: false,
        usage: { inputTokens: 10, outputTokens: 10, thinkingTokens: 0, cachedInputTokens: 0 },
      },
    }),
  );
  assert.equal(record.costUsd, null);
  assert.equal(record.model, "gemini-9-ultra");
});

test("a turn no model ran for cost nothing", () => {
  const record = buildTurnRecord(facts({ disposition: "resolved" }));
  assert.equal(record.costUsd, 0);
  assert.equal(record.provider, null);
  assert.equal(record.tokensIn, 0);
});

// ── sources ──────────────────────────────────────────────────────────────────

test("sources are the kinds of place an answer linked to, each once, in order", () => {
  const text =
    "See <https://plus-uno.netlify.app/blueprint/?cell=12|the cell> and " +
    "<https://www.notion.so/abc|the PRD>, plus https://www.figma.com/design/x and " +
    "<https://notion.so/def|another page>.";
  assert.deepEqual(sourcesCitedIn(text), ["blueprint", "notion", "figma"]);
});

test("an answer with no links cites nothing", () => {
  assert.deepEqual(sourcesCitedIn("No links here."), []);
  assert.deepEqual(sourcesCitedIn(undefined), []);
});

// ── the ticket the bot filed on itself ───────────────────────────────────────

test("an issue filed on the bot's own repo is the self-filed ticket", () => {
  const url = "https://github.com/BilLogic/plus-uno/issues/901";
  assert.equal(
    selfFiledTicketOf([
      {
        toolName: "github_issue_create",
        ok: true,
        // The filing tool's result shape (`tools/github-issue.ts`).
        result: JSON.stringify({ ok: true, status: "filed", issue_number: 901, issue_url: url, message: "Filed" }),
      },
    ]),
    url,
  );
});

test("an issue on another repo, a failed filing and other tools are not", () => {
  assert.equal(
    selfFiledTicketOf([
      {
        toolName: "github_issue_create",
        ok: true,
        result: JSON.stringify({ ok: true, issue_url: "https://github.com/BilLogic/plus-marketing-website/issues/3" }),
      },
      { toolName: "github_issue_create", ok: false, result: JSON.stringify({ ok: false }) },
      { toolName: "notion_create", ok: true, result: JSON.stringify({ issue_url: "https://github.com/BilLogic/plus-uno/issues/2" }) },
    ]),
    null,
  );
});

// ── test traffic ─────────────────────────────────────────────────────────────

test("test traffic: a debug route, a sandbox channel, a bare greeting — and nothing else", () => {
  const base = { origin: "slack" as const, channel: "C1", testChannelIds: ["C_SANDBOX"], disposition: "answered" as TurnDisposition, question: "where is it?" };
  assert.equal(isTestTraffic(base), false);
  assert.equal(isTestTraffic({ ...base, origin: "debug" }), true);
  assert.equal(isTestTraffic({ ...base, channel: "C_SANDBOX" }), true);
  assert.equal(isTestTraffic({ ...base, disposition: "reacted", question: "thanks!" }), true);
  // A reaction to a real question is still a real ask.
  assert.equal(isTestTraffic({ ...base, disposition: "reacted", question: "is this right?" }), false);
});

test("a test origin: the rule's debug route and sandbox channel, with no turn to read", () => {
  const base = { origin: "slack" as const, channel: "C1", testChannelIds: ["C_SANDBOX"] };
  assert.equal(isTestOrigin(base), false);
  assert.equal(isTestOrigin({ ...base, origin: "debug" }), true);
  assert.equal(isTestOrigin({ ...base, channel: "C_SANDBOX" }), true);
  // The greeting clause is a turn's, not a place's: the same rule, its first two clauses.
  for (const over of [{}, { origin: "debug" as const }, { channel: "C_SANDBOX" }]) {
    const at = { ...base, ...over };
    assert.equal(isTestOrigin(at), isTestTraffic({ ...at, disposition: "answered", question: "where is it?" }));
  }
});

test("a team-channel post test traffic set off stays in the test channel", () => {
  const sandbox = ["C_SANDBOX", "C_SANDBOX_2"];
  // Real traffic posts where it was aimed.
  assert.equal(teamPostChannel({ origin: "slack", channel: "C1", testChannelIds: sandbox }, "C_TEAM"), "C_TEAM");
  // A test channel's post stays in that test channel, whichever it is.
  assert.equal(teamPostChannel({ origin: "slack", channel: "C_SANDBOX_2", testChannelIds: sandbox }, "C_TEAM"), "C_SANDBOX_2");
  // A debug route has no channel: the first test channel takes it.
  assert.equal(teamPostChannel({ origin: "debug", channel: "", testChannelIds: sandbox }, "C_TEAM"), "C_SANDBOX");
  // With no test channel set, a debug route's post goes nowhere.
  assert.equal(teamPostChannel({ origin: "debug", channel: "", testChannelIds: [] }, "C_TEAM"), null);
});

// ── unprompted thanks ────────────────────────────────────────────────────────

test("a thanks is any of the words, the shortcode or the glyph, alone or in a sentence", () => {
  for (const text of [
    "thanks!",
    "Thank you so much",
    "thx",
    "ty",
    "TYSM <@U0BOT>",
    "really appreciate it",
    "you're the goat",
    ":goat:",
    "🐐",
    "🙏",
    ":pray: that's it",
    "perfect, thanks — one more: where is the PRD?",
  ]) {
    assert.equal(isThanks(text), true, text);
  }
});

test("a word that only contains a thanks word is not one", () => {
  for (const text of ["", "type the title", "goats are not on the roadmap", "thankless job", "I appreciate the context, but", "pretty sure", "goatee"]) {
    assert.equal(isThanks(text), false, text);
  }
});

test("thanks is set on a person's turn, never on the debug route or in the sandbox", () => {
  const thanks = facts({ question: "thanks!", disposition: "reacted" });
  const row = buildTurnRecord(thanks);
  assert.equal(row.thanks, true);
  // A thanks-only message is still a greeting by the test-traffic rule; the
  // flag is what counts it.
  assert.equal(row.testTraffic, true);
  assert.equal(buildTurnRecord({ ...thanks, origin: "figma" }).thanks, true);
  assert.equal(buildTurnRecord({ ...thanks, origin: "debug" }).thanks, false);
  assert.equal(buildTurnRecord({ ...thanks, testChannelIds: ["C1"] }).thanks, false);
  assert.equal(buildTurnRecord(facts()).thanks, false);
});

// ── corpus categories ────────────────────────────────────────────────────────

test("a real channel ask keeps its text, capped; a DM ask and test traffic keep none", () => {
  assert.equal(buildTurnRecord(facts()).requestText, "where is the onboarding PRD?");
  assert.equal(
    buildTurnRecord(facts({ question: "x".repeat(MAX_REQUEST_TEXT_CHARS + 50) })).requestText?.length,
    MAX_REQUEST_TEXT_CHARS,
  );
  assert.equal(buildTurnRecord(facts({ conversationType: "group" })).requestText, "where is the onboarding PRD?");
  assert.equal(
    buildTurnRecord(facts({ surface: "assistant", conversationType: "im", channel: "D9" })).requestText,
    null,
  );
  assert.equal(buildTurnRecord(facts({ origin: "debug" })).requestText, null);
  assert.equal(buildTurnRecord(facts({ testChannelIds: ["C1"] })).requestText, null);
});

test("a group DM's text is never stored, and its row names it for what it is", () => {
  const record = buildTurnRecord(facts({ conversationType: "mpim", channel: "G9" }));
  assert.equal(record.requestText, null);
  assert.equal(record.surface, "channel", "delivered like a channel");
  assert.equal(record.conversationType, "mpim");
  assert.equal(record.channelId, null, "a group DM's id is not kept");
});

test("an ask of unknown conversation type keeps no text — unknown is private", () => {
  const { conversationType: _omit, ...unknown } = facts();
  const record = buildTurnRecord(unknown);
  assert.equal(record.requestText, null);
  assert.equal(record.conversationType, null);
  assert.equal(keepsRequestText(undefined), false);
  assert.deepEqual(
    (["channel", "group", "mpim", "im"] as const).map((t) => keepsRequestText(t)),
    [true, true, false, false],
  );
});

test("a real turn that staged a card is pain_category 7 before any classifier runs", () => {
  assert.equal(buildTurnRecord(facts({ proposalId: "1.2", disposition: "staged" })).painCategory, 7);
  assert.equal(buildTurnRecord(facts()).painCategory, null);
  assert.equal(buildTurnRecord(facts({ proposalId: "1.2", origin: "debug" })).painCategory, null);
});

test("an in-turn label sets the Sub-type, its pain_category and when, and keeps a staged 7", () => {
  const labeled = withAskLabel(
    buildTurnRecord(facts({ surface: "assistant", conversationType: "im", channel: "D9" })),
    "Sync/drift",
    99,
  );
  assert.deepEqual(
    [labeled.subType, labeled.painCategory, labeled.classifiedAt, labeled.requestText],
    ["Sync/drift", 3, 99, null],
  );
  const staged = buildTurnRecord(facts({ surface: "assistant", channel: "D9", proposalId: "1.2" }));
  assert.equal(withAskLabel(staged, null, 99).painCategory, 7);
});

// ── whose conversation ───────────────────────────────────────────────────────

test("the conversation type is the event's channel_type, else what the id proves, else unknown", () => {
  assert.equal(conversationTypeOf("C1", "channel"), "channel");
  assert.equal(conversationTypeOf("G1", "group"), "group");
  assert.equal(conversationTypeOf("C9", "mpim"), "mpim");
  assert.equal(conversationTypeOf("D1", undefined), "im");
  assert.equal(conversationTypeOf("D1", "app_home"), "im");
  // An app_mention carries no channel_type: a C… id may be a channel or not.
  assert.equal(conversationTypeOf("C1", undefined), undefined);
  assert.equal(conversationTypeOf("C1", "something-new"), undefined);
});

test("a Slack group-DM message reaches the turn as a group DM", () => {
  const request = slackTurnRequest(
    { type: "message", channel: "C0MPIM", channel_type: "mpim", user: "U1", ts: "1.2", text: "hi" },
    { conversationTs: "1.2", text: "hi", history: [], pending: null, prd: null },
  );
  assert.equal(request.surface, "channel");
  assert.equal(request.conversationType, "mpim");
});
