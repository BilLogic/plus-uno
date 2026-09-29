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
  isTestTraffic,
  ratesFor,
  selfFiledTicketOf,
  sourcesCitedIn,
  type TurnRecordFacts,
} from "../src/usage/index";
import type { TurnDisposition } from "../src/turn/index";

const SEP_2026 = Date.UTC(2026, 8, 29);

const facts = (over: Partial<TurnRecordFacts> = {}): TurnRecordFacts => ({
  build: "r1",
  origin: "slack",
  testChannelIds: [],
  requesterId: "U1",
  surface: "channel",
  inThread: false,
  channel: "C1",
  askTs: "1790000000.100000",
  question: "where is the onboarding PRD?",
  startedAt: 1_790_000_001_000,
  firstAnswerAt: 1_790_000_004_100,
  tier: "default",
  routeReason: "default",
  toolsCalled: [],
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
