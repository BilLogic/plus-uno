// The weekly DS precedence check's three moves, on named dependencies:
//
//   • the CHECK — Friday's end-of-day run (`ds-precedence-check`,
//     src/scheduled/runs.ts): read, compare, and keep the report in KV for the
//     morning. It posts nothing. A clean week keeps nothing, and clears a
//     report no morning ever posted, so a stale list never goes out.
//   • the POST — every morning run (`ds-precedence-post`): when a report is
//     waiting, open ONE thread in #plus-universal — the list — and put the
//     card in it. The card files the weekly intake, or comments on the one
//     already open. Confirmers are the channel's members, read now, as the
//     library card reads them; the card lives six days, so it has gone before
//     the next week's thread opens. It has no `onCancel`: its one operation is
//     the intake, so a ⛔ files nothing.
//     Every morning rather than only Monday's: a morning whose reads fail keeps
//     the report, and the next one posts it.
//   • the DISPUTE — a reply in that thread starting `dispute 2` posts a
//     revised card in the same thread without them. It runs at the head of
//     the thread's queued job (slack/message-job.ts), so it is handled once
//     and two disputes run one after the other. Every weekly card carries the
//     thread's own `supersedeKey`: a revision supersedes the old card, so a
//     late ✅ on it is told it was replaced, while a turn's card in the same
//     thread and the weekly card leave each other alone. The revision keeps the
//     old card's expiry. Disputing every item withdraws the card. Only a card
//     still pending is revised: once it is decided, the intake is filed (or
//     declined), and a revision would file a second one.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   check: the index + the registry from GitHub + the library's /components
//          from Figma = 3 external; the in-flight read and the report are KV,
//          the internal bucket.
//   post:  members (at most 3 pages) + the open-intake lookup (1) + the list
//          (1) + the card (1) = 6; the staging is a Durable Object hop.
//   dispute: one post; the staging and the KV state are internal.
//
// `Env` enters in `ds-precedence/env.ts`.

import type { PendingProposal } from "../thread-state/index";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import type { FigmaComponentsResponse } from "../figma-poll";
import {
  findDisagreements,
  liveLibraryFrom,
  parseComponentIndex,
  type Disagreement,
  type PrecedenceRegistry,
} from "./compare";
import {
  disputedItems,
  precedenceCard,
  precedenceOperations,
  threadText,
  type IntakeTarget,
  type NumberedItem,
} from "./report";

/** How long the weekly card stays confirmable: gone before next week's. */
export const PRECEDENCE_CARD_TTL_MS = 6 * 24 * 60 * 60 * 1000;
/** A revision close to expiry still gets this long. */
const MIN_REVISION_TTL_MS = 60 * 60 * 1000;

/** What the check keeps for the morning. */
export interface PrecedenceReport {
  checkedAt: string;
  items: Disagreement[];
}

/** The posted thread, as a dispute finds it again. */
export interface PostedThread {
  channel: string;
  /** The list's ts — the thread. */
  ts: string;
  /** The live card's ts. */
  cardTs: string;
  weekOf: string;
  items: NumberedItem[];
  disputed: number[];
  target: IntakeTarget;
  confirmers: string[];
  /** When the first card expires; a revision keeps it. */
  expiresAt: number;
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

export interface CheckDeps {
  github: {
    /** design-system/agent-views/components/index.md */
    indexMarkdown(): Promise<string>;
    /** design-system/figma/component-registry.json */
    registry(): Promise<PrecedenceRegistry>;
  };
  figma: { components(): Promise<FigmaComponentsResponse> };
  report: Store<PrecedenceReport | null>;
  /** Components a library publish is still carrying. */
  inFlight(registry: PrecedenceRegistry): Promise<Set<string>>;
  fileKey: string;
  repo: string;
  now(): number;
}

export interface CheckResult {
  found: number;
  summary: string;
}

/**
 * The end-of-day check.
 *
 * @param deps - The reads and the report store
 * @param opts - `dryRun` compares and writes nothing
 */
export async function runPrecedenceCheck(deps: CheckDeps, opts: { dryRun?: boolean } = {}): Promise<CheckResult> {
  const [markdown, registry, components] = await Promise.all([
    deps.github.indexMarkdown(),
    deps.github.registry(),
    deps.figma.components(),
  ]);
  const index = parseComponentIndex(markdown);
  if (!index.length) throw new Error("the component index listed no components — refusing to report every one missing");
  const library = liveLibraryFrom(components);
  if (library.sets.length < index.length / 2) {
    // An empty or near-empty answer is a Figma or permissions fault, not a
    // library that lost most of its components overnight: reporting every
    // component missing would file a wrong intake. The week is skipped.
    console.error(
      `[ds-precedence] the library answered ${library.sets.length} set(s) for ${index.length} indexed components — week skipped`,
    );
    if (!opts.dryRun) await deps.report.write(null);
    return { found: 0, summary: `library near-empty (${library.sets.length} sets) — week skipped` };
  }
  const items = findDisagreements({
    index,
    registry,
    library,
    fileKey: deps.fileKey,
    repo: deps.repo,
    inFlight: await deps.inFlight(registry),
  });
  if (!opts.dryRun) {
    await deps.report.write(items.length ? { checkedAt: new Date(deps.now()).toISOString(), items } : null);
  }
  return {
    found: items.length,
    summary: items.length ? `${items.length} disagreement(s) kept for the morning` : "code and the library agree",
  };
}

export interface PostDeps {
  report: Store<PrecedenceReport | null>;
  thread: Store<PostedThread | null>;
  /** The channel's member ids, or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** The open weekly intake, or null when none is open. */
  openIntake(): Promise<{ number: number; url: string } | null>;
  /** Post in the channel — top level, or in a thread. */
  post(message: { text: string; blocks?: unknown[]; thread_ts?: string }): Promise<{ ok: boolean; ts?: string }>;
  stage(proposal: PendingProposal): Promise<void>;
  channel: string;
  now(): number;
}

export interface PostResult {
  posted: boolean;
  summary: string;
}

function stagedCard(
  thread: Omit<PostedThread, "cardTs">,
  cardTs: string,
  card: { text: string },
  operations: NonNullable<PendingProposal["operations"]>,
  ttlMs: number,
): PendingProposal {
  return {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel: thread.channel,
    threadTs: thread.ts,
    replyTs: thread.ts,
    userMsgTs: thread.ts,
    proposalTs: cardTs,
    proposalText: card.text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs,
    confirmers: [...thread.confirmers],
    // Keyed apart from the thread: a turn's card in this thread neither
    // replaces the weekly card nor is replaced by it; its revisions share it.
    supersedeKey: `ds-precedence:${thread.ts}`,
  };
}

/**
 * The morning post: the waiting report, if any, as one thread and one card.
 *
 * @param deps - Reads, the posts and the staging
 * @param opts - `dryRun` reads and drafts, and posts, stages and writes nothing
 */
export async function postPrecedenceReport(deps: PostDeps, opts: { dryRun?: boolean } = {}): Promise<PostResult> {
  const report = await deps.report.read();
  if (!report?.items.length) return { posted: false, summary: "no disagreements waiting" };

  const [members, open] = await Promise.all([deps.members(), deps.openIntake().catch(() => undefined)]);
  if (!members || open === undefined) {
    // A card nobody could confirm, or one that files a second intake beside
    // an open one, is worse than a day's wait.
    const missing = [!members ? "the channel's members" : "", open === undefined ? "the open intake" : ""].filter(Boolean);
    console.error(`[ds-precedence] could not read ${missing.join(" or ")} — report kept for tomorrow`);
    return { posted: false, summary: `kept: ${missing.join(", ")} unread` };
  }

  const weekOf = report.checkedAt.slice(0, 10);
  const items: NumberedItem[] = report.items.map((item, i) => ({ ...item, n: i + 1 }));
  const target: IntakeTarget = open ? { kind: "update", issue: open.number, url: open.url } : { kind: "create" };
  const operations = precedenceOperations(items, target, weekOf);
  const card = renderProposalCard(precedenceCard(items, [], target, operations, PRECEDENCE_CARD_TTL_MS / 3_600_000));
  if (opts.dryRun) return { posted: false, summary: `would post ${items.length} item(s) and a card` };

  const list = await deps.post({ text: threadText(items, weekOf) });
  if (!list.ok || !list.ts) {
    console.error("[ds-precedence] the list did not post — report kept for tomorrow");
    return { posted: false, summary: "list post failed; kept" };
  }
  // The list is up: posting it again tomorrow would make two threads, so the
  // report is handed off whatever happens to the card.
  await deps.report.write(null);
  const base = {
    channel: deps.channel,
    ts: list.ts,
    weekOf,
    items,
    disputed: [],
    target,
    confirmers: [...members],
    expiresAt: deps.now() + PRECEDENCE_CARD_TTL_MS,
  };
  const sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text), thread_ts: list.ts });
  if (!sent.ok || !sent.ts) {
    console.error("[ds-precedence] the list posted and the card did not");
    return { posted: true, summary: `posted ${items.length} item(s); the card failed` };
  }
  try {
    await deps.stage(stagedCard(base, sent.ts, card, operations, PRECEDENCE_CARD_TTL_MS));
  } catch (err) {
    console.error(`[ds-precedence] card posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
  }
  await deps.thread.write({ ...base, cardTs: sent.ts });
  return { posted: true, summary: `posted ${items.length} item(s) and a card` };
}

export interface DisputeDeps {
  thread: Store<PostedThread | null>;
  post(message: { text: string; blocks?: unknown[]; thread_ts?: string }): Promise<{ ok: boolean; ts?: string }>;
  stage(proposal: PendingProposal): Promise<void>;
  /** Retire a card so no ✅ runs it. */
  retire(proposalTs: string): Promise<void>;
  /** Whether the card is still pending — not decided, expired or replaced. */
  pending(proposalTs: string): Promise<boolean>;
  now(): number;
}

/** A reply, as the dispute reads it. */
export interface ThreadReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
}

/**
 * The items a reply newly disputes in the live weekly thread — empty when it
 * is not a dispute, not in that thread, after the card expired, or names only
 * items that are not on the list or already dropped. Both the dispute and the
 * @mention guard ask this, so a reply one of them declines the other does too
 * and the agent answers it.
 *
 * @param thread - The posted thread, or null
 * @param reply - The reply
 * @param now - The time
 */
export function freshDisputes(thread: PostedThread | null, reply: Omit<ThreadReply, "user">, now: number): number[] {
  const numbers = disputedItems(reply.text);
  if (!numbers.length || !thread || thread.channel !== reply.channel || thread.ts !== reply.threadTs) return [];
  if (now >= thread.expiresAt) return [];
  return numbers.filter((n) => thread.items.some((i) => i.n === n) && !thread.disputed.includes(n));
}

/**
 * A reply in the weekly thread that disputes items: revise the card without
 * them. Answers whether it handled the reply — false leaves it to the agent.
 *
 * @param deps - The thread state, the post and the staging
 * @param reply - The reply
 */
export async function disputePrecedenceItems(deps: DisputeDeps, reply: ThreadReply): Promise<boolean> {
  if (!disputedItems(reply.text).length) return false;
  const thread = await deps.thread.read();
  const fresh = freshDisputes(thread, reply, deps.now());
  if (!thread || !fresh.length || !(await deps.pending(thread.cardTs))) return false;

  const disputed = [...thread.disputed, ...fresh].sort((a, b) => a - b);
  const remaining = thread.items.filter((i) => !disputed.includes(i.n));
  if (!remaining.length) {
    await deps.retire(thread.cardTs);
    await deps.post({
      text: `Every item is disputed, so the card is withdrawn and nothing is filed this week (disputed by <@${reply.user}>).`,
      thread_ts: thread.ts,
    });
    await deps.thread.write({ ...thread, disputed });
    return true;
  }

  const operations = precedenceOperations(remaining, thread.target, thread.weekOf);
  const ttlMs = Math.max(thread.expiresAt - deps.now(), MIN_REVISION_TTL_MS);
  const card = renderProposalCard(precedenceCard(remaining, disputed, thread.target, operations, ttlMs / 3_600_000));
  const sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text), thread_ts: thread.ts });
  if (!sent.ok || !sent.ts) {
    console.error("[ds-precedence] the revised card did not post; the old card stands");
    return true;
  }
  await deps.stage(stagedCard(thread, sent.ts, card, operations, ttlMs));
  await deps.thread.write({ ...thread, disputed, cardTs: sent.ts });
  return true;
}
