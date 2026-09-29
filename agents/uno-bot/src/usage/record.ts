// What a finished turn becomes on the usage record (ADR-030) — the rules, in
// one place.
//
// Turn hands over plain facts (who, where, when, what ran, how it ended) and
// this file decides the columns that take a rule: the ask time, the latency,
// the cost, the sources an answer cited, the ticket the bot filed on itself and
// whether the turn was test traffic. Pure, so each rule is a table test.

import type { ModelTier } from "../agent/routing";
import type { TurnDisposition } from "../turn/turn";
import { painCategoryOf, type SubType } from "./categories";
import { estimateCostUsd, type TokenSpend } from "./prices";
import type { TurnRecord } from "./store";

/** The repo whose issues are tickets the bot files about itself: its purpose
 *  in `GITHUB_REPOS` is "uno-bot and the harness". */
export const SELF_REPO = "BilLogic/plus-uno";

/**
 * Where a turn came from, as far as test traffic cares.
 *
 * `slack` is a person in Slack. `debug` is anything reached through a
 * `/debug/*` or `/health/*` route — which is where the eval transport lives —
 * and is test traffic by definition.
 */
export type TurnOrigin = "slack" | "debug";

/** What the model run reported, when one ran — `agent/loop.ts` `TurnSpend`,
 *  as this module reads it. */
export interface RecordedSpend {
  provider: string;
  model: string;
  fallback: boolean;
  usage: TokenSpend;
}

/** One executed operation, as the executor reports it (`gate/run-batch.ts`). */
export interface ExecutedOperation {
  toolName: string;
  ok: boolean;
  /** The executor's own JSON result. */
  result: string;
}

export interface TurnRecordFacts {
  build: string;
  origin: TurnOrigin;
  /** `TEST_CHANNEL_IDS`, parsed. */
  testChannelIds: readonly string[];
  requesterId: string;
  surface: "assistant" | "channel";
  inThread: boolean;
  channel: string;
  /** The asker's message ts. */
  askTs: string;
  /** What the person asked, as typed — read for the greeting rule, and kept
   *  (as `requestText`) for a real channel ask only, until it is classified. */
  question: string;
  /** The clock when the turn began, epoch ms — the ask time when `askTs` is
   *  not a Slack ts (an eval conversation's synthetic one). */
  startedAt: number;
  firstAnswerAt: number | null;
  tier: ModelTier;
  routeReason: string;
  spend?: RecordedSpend;
  toolsCalled: readonly string[];
  /** What the person was finally shown, for the sources it links. */
  posted?: string;
  disposition: TurnDisposition;
  /** The ts of the card the turn staged. */
  proposalId?: string;
  /** What a ✅ taken during this turn ran. */
  executed?: readonly ExecutedOperation[];
}

/** A Slack message ts: seconds, a dot, a sequence. */
const SLACK_TS = /^\d{9,}\.\d+$/;

/** When the ask was made, epoch ms. */
export function askedAtOf(askTs: string, startedAt: number): number {
  return SLACK_TS.test(askTs) ? Math.round(Number(askTs) * 1000) : startedAt;
}

/**
 * Test traffic, by the rule #742 adopted from the metric definitions. Any one of:
 *   - a debug or health route, the eval transport included;
 *   - a channel on `TEST_CHANNEL_IDS` (#uno-bot-sandbox);
 *   - a greeting with no ask: the model only reacted, and nothing was asked.
 * Anyone's genuine ask counts, the lead's included.
 */
export function isTestTraffic(facts: {
  origin: TurnOrigin;
  channel: string;
  testChannelIds: readonly string[];
  disposition: TurnDisposition;
  question: string;
}): boolean {
  if (facts.origin === "debug") return true;
  if (facts.testChannelIds.includes(facts.channel)) return true;
  return facts.disposition === "reacted" && !facts.question.includes("?");
}

/** A link target, in Slack's `<url|label>` form or bare. */
const LINK = /https?:\/\/[^\s<>|)]+/g;

/**
 * Which kinds of source an answer linked to, in order of first appearance.
 *
 * KINDS, not links: what the grounding metric needs is whether an answer cited
 * the blueprint, a Notion page, a Figma frame — and a link from a DM answer is
 * not something this record should keep.
 */
export function sourcesCitedIn(text: string | undefined): string[] {
  const kinds: string[] = [];
  for (const match of (text ?? "").matchAll(LINK)) {
    const kind = sourceKind(match[0]);
    if (kind && !kinds.includes(kind)) kinds.push(kind);
  }
  return kinds;
}

function sourceKind(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const on = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (on("notion.so") || on("notion.site")) return "notion";
  if (on("github.com")) return "github";
  if (on("figma.com")) return "figma";
  if (on("slack.com")) return "slack";
  if (on("plus-uno.netlify.app")) {
    if (url.pathname.startsWith("/blueprint")) return "blueprint";
    if (url.pathname.startsWith("/storybook")) return "storybook";
    return "plus-uno";
  }
  return "web";
}

/** The issue a ✅ in this turn filed on the bot's own repo, if one did. */
export function selfFiledTicketOf(executed: readonly ExecutedOperation[] | undefined): string | null {
  const issue = new RegExp(`^https://github\\.com/${SELF_REPO.replace("/", "\\/")}/issues/\\d+$`);
  for (const op of executed ?? []) {
    if (op.toolName !== "github_issue_create" || !op.ok) continue;
    try {
      // The filing tool's own result shape (`tools/github-issue.ts`).
      const { issue_url: url } = JSON.parse(op.result) as { issue_url?: unknown };
      if (typeof url === "string" && issue.test(url)) return url;
    } catch {
      // A result that is not JSON filed nothing we can link to.
    }
  }
  return null;
}

/**
 * The row's key. A Slack ask is keyed by its channel and message ts, which a
 * retried run shares — so the retry rewrites the row instead of adding one. An
 * ask with no Slack ts (every eval conversation shares one synthetic ts) is
 * keyed by when it began as well, or every eval turn would land on one row.
 */
export function turnIdOf(channel: string, askTs: string, startedAt: number): string {
  return SLACK_TS.test(askTs) ? `${channel}:${askTs}` : `${channel}:${askTs}@${startedAt}`;
}

/** The most of a channel ask the record keeps for its classifier. */
export const MAX_REQUEST_TEXT_CHARS = 2_000;

export function buildTurnRecord(facts: TurnRecordFacts): TurnRecord {
  const askedAt = askedAtOf(facts.askTs, facts.startedAt);
  const usage = facts.spend?.usage;
  const testTraffic = isTestTraffic(facts);
  const staged = facts.proposalId !== undefined;
  return {
    turnId: turnIdOf(facts.channel, facts.askTs, facts.startedAt),
    build: facts.build,
    requesterId: facts.requesterId,
    surface: facts.surface,
    inThread: facts.inThread,
    channelId: facts.surface === "channel" ? facts.channel : null,
    askTs: facts.askTs,
    askedAt,
    firstAnswerAt: facts.firstAnswerAt,
    latencyMs: facts.firstAnswerAt === null ? null : Math.max(0, facts.firstAnswerAt - askedAt),
    tier: facts.tier,
    routeReason: facts.routeReason,
    provider: facts.spend?.provider ?? null,
    model: facts.spend?.model ?? null,
    fallbackUsed: facts.spend?.fallback ?? false,
    tokensIn: usage?.inputTokens ?? 0,
    tokensOut: usage?.outputTokens ?? 0,
    tokensThinking: usage?.thinkingTokens ?? 0,
    tokensCached: usage?.cachedInputTokens ?? 0,
    // No model ran, so nothing was spent: zero is the true cost, not "unpriced".
    costUsd: facts.spend
      ? estimateCostUsd(facts.spend.provider, facts.spend.model, facts.spend.usage, askedAt)
      : 0,
    toolsCalled: [...facts.toolsCalled],
    sourcesCited: sourcesCitedIn(facts.posted),
    disposition: facts.disposition,
    proposalId: facts.proposalId ?? null,
    stopUsed: facts.disposition === "stopped",
    selfFiledTicketUrl: selfFiledTicketOf(facts.executed),
    testTraffic,
    // A DM ask is never stored as text, and test traffic is never classified,
    // so neither keeps any. A channel ask keeps its text for the end-of-day
    // classifier, which nulls it in the same write that labels it.
    requestText:
      facts.surface === "channel" && !testTraffic ? facts.question.slice(0, MAX_REQUEST_TEXT_CHARS) : null,
    subType: null,
    // Ticket kickoff needs no classifier: a real turn that staged a card is 7.
    painCategory: testTraffic ? null : painCategoryOf(null, staged),
    classifiedAt: null,
  };
}

/**
 * A record with its ask labelled — a DM turn's in-turn classification. The
 * pain_category keeps a staged turn's 7; the text stays null.
 *
 * @param record - The turn's record
 * @param subType - The classifier's exact-matched answer; null is blank
 * @param at - When it answered, epoch ms
 */
export function withAskLabel(record: TurnRecord, subType: SubType | null, at: number): TurnRecord {
  return {
    ...record,
    subType,
    painCategory: painCategoryOf(subType, record.proposalId !== null),
    classifiedAt: at,
  };
}
