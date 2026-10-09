// The weekly DS precedence check's three moves, on named dependencies:
//
//   • the CHECK — Friday's end-of-day run (`ds-precedence-check`,
//     src/scheduled/runs.ts): read, compare, and keep the report in KV for the
//     morning. It posts nothing. A clean week keeps nothing, and clears a
//     report no morning ever posted, so a stale list never goes out. A
//     library that has fewer than `MIN_LIBRARY_RATIO` of the indexed
//     components is a Figma or token fault, not a library that emptied
//     overnight, and reporting every component missing would file a wrong
//     intake — that week is skipped, logged once, and changes nothing kept.
//   • the POST — every morning run (`ds-precedence-post`): when a report is
//     waiting, open ONE thread in #plus-universal (`precedenceChannel`) — the list — and put the
//     card in it. The card files the weekly intake, or comments on the one
//     already open. Confirmers are the channel's members, read now, as the
//     library card reads them; the card lives six days, so it has gone before
//     the next week's thread opens. It has no `onCancel`: its one operation is
//     the intake, so a ⛔ files nothing.
//     Every morning rather than only Monday's: a morning whose reads fail keeps
//     the report, and the next one posts it.
//   • the DROP — a reply in that thread starting `drop 2` (or `dispute 2`,
//     the verb before #886) posts a revised card in the same thread without
//     them. It runs at the head of the thread's queued job
//     (slack/message-job.ts), so it is handled once and two drops run one
//     after the other. Every weekly card holds the thread's `"ds-precedence"`
//     slot (`supersedeKey`): a revision supersedes the old card, so a late ✅
//     on it is told it was replaced, while a turn's card or a sweep card in the
//     same thread and the weekly card leave each other alone, and a turn whose
//     batch is aimed at the weekly intake itself is refused with a pointer to
//     `drop N`. The revision keeps the old card's expiry. A card re-staged
//     after a cut-off run is followed by the record (`followRestagedCard`).
//     Dropping every item withdraws the card. Only a card still pending is
//     revised; a drop that changes nothing gets one line saying why. The
//     record, the job plumbing and this function still say "dispute" — the
//     stored and internal name for a dropped item, kept so a thread recorded
//     before the rename reads the same.
//     Every list thread is recorded under its own ts (`env.ts`), before its
//     card posts, so the engagement gate and the dispute find it whichever
//     week it is and whether or not the card made it.
//
// Subrequest math (each job an alarm with a fresh 50; lookups stop at 38):
//   check: the index + the registry from GitHub + the library's /components
//          from Figma = 3 external; the in-flight read and the report are KV,
//          the internal bucket.
//   post:  members (at most 3 pages) + the open-intake lookup (1) + the list
//          (1) + the card (1) = 6, plus a reply per ~3,500 chars of items
//          when the list is too long for one post; the staging is a Durable
//          Object hop.
//   dispute: at most two posts (the revision, and a line if it fails); the
//          staging and the KV record are internal.
//
// `Env` enters in `ds-precedence/env.ts`.

import type { PendingProposal } from "../thread-state/index";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import { namesInWords } from "../slack/copy-words";
import { pickDestination, resolveDestination, type TeamChannels } from "../sweep/finding";
import type { FigmaClient } from "../figma/client";
import type { JobContext } from "../scheduled/runs";
import {
  findDisagreements,
  indexedInLibrary,
  liveLibraryFrom,
  parseComponentIndex,
  type Disagreement,
  type PrecedenceRegistry,
} from "./compare";
import {
  droppedItems,
  precedenceCard,
  precedenceCardWords,
  precedenceList,
  precedenceOperations,
  type IntakeTarget,
  type NumberedItem,
} from "./report";

/** The thread slot every weekly card holds (`PendingProposal.supersedeKey`). */
export const PRECEDENCE_KEY = "ds-precedence";

/**
 * The channel the weekly list opens in, by the rule every proactive job
 * shares (`pickDestination`): the check reads no conversation, so there is no
 * private place or thread to answer in, and its target is the Figma library —
 * a design-system target. Null when that role's channel is not configured.
 *
 * @param channels - The Worker's team channel ids
 */
export function precedenceChannel(channels: TeamChannels): string | null {
  const destination = pickDestination({
    evidence: { channel: "", channelKind: "public", threadTs: null, messageTs: [], permalinks: [] },
    target: { url: "", kind: "figma-library", writable: false, title: "", pillars: [] },
  });
  return resolveDestination(destination, channels)?.channel ?? null;
}

/** How long the weekly card stays confirmable: gone before next week's. */
export const PRECEDENCE_CARD_TTL_MS = 6 * 24 * 60 * 60 * 1000;
/** The share of indexed components the library must have for the check to
 *  believe it (`indexedInLibrary`). */
const MIN_LIBRARY_RATIO = 0.5;
/** A revision close to expiry still gets this long. */
const MIN_REVISION_TTL_MS = 60 * 60 * 1000;

/** What the check keeps for the morning. */
export interface PrecedenceReport {
  checkedAt: string;
  /** The check run's date, `YYYY-MM-DD` — the week the list is labelled with.
   *  Absent from a report kept before it was recorded; `checkedAt`'s date
   *  stands in. */
  weekOf?: string;
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
  /** Item numbers dropped by a reply (stored under the old verb's name). */
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

export interface CheckDeps extends Pick<JobContext, "runDate"> {
  github: {
    /** design-system/agent-views/components/index.md */
    indexMarkdown(): Promise<string>;
    /** design-system/figma/component-registry.json */
    registry(): Promise<PrecedenceRegistry>;
  };
  /** The Figma client: the library file's components. */
  figma: Pick<FigmaClient, "components">;
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
    deps.figma.components(deps.fileKey),
  ]);
  const index = parseComponentIndex(markdown);
  if (!index.length) throw new Error("the component index listed no components — refusing to report every one missing");
  const library = liveLibraryFrom(components);
  const present = indexedInLibrary(index, registry, library);
  if (present < index.length * MIN_LIBRARY_RATIO) {
    // An empty or near-empty answer is a Figma or permissions fault, not a
    // library that lost most of its components overnight: reporting every
    // component missing would file a wrong intake. The week is skipped, and
    // a report still waiting for its morning is left as it is.
    console.error(
      `[ds-precedence] the library has ${present} of ${index.length} indexed components — week skipped`,
    );
    return { found: 0, summary: `library near-empty (${present} of ${index.length} indexed) — week skipped` };
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
    await deps.report.write(items.length ? { checkedAt: new Date(deps.now()).toISOString(), weekOf: deps.runDate, items } : null);
  }
  return {
    found: items.length,
    summary: items.length ? `${items.length} disagreement(s) kept for the morning` : "code and the library agree",
  };
}

export interface PostDeps {
  report: Store<PrecedenceReport | null>;
  /** Record a posted list thread under its own ts, for as long as its card
   *  and its replies matter (`env.ts`). */
  recordThread(thread: PostedThread): Promise<void>;
  /** The channel's member ids, or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** The open weekly intake, or null when none is open. */
  openIntake(): Promise<{ number: number; url: string } | null>;
  /** Post in the channel — top level, or in a thread. */
  post(message: { text: string; blocks?: unknown[]; thread_ts?: string }): Promise<{ ok: boolean; ts?: string }>;
  stage(proposal: PendingProposal): Promise<void>;
  channel: string;
  /** Where the precedence rule is written, as the list links it. */
  ruleUrl: string;
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
    supersedeKey: PRECEDENCE_KEY,
    // Its own words at the gate, for the whole six days from the first post —
    // a revision keeps that expiry, so its own shorter ttl would misstate it.
    stated: precedenceCardWords(PRECEDENCE_CARD_TTL_MS / 3_600_000),
    refuseRevision:
      "This is the weekly DS precedence card, and it changes only one way: reply `drop N` (or `drop 1, 3`) " +
      "to leave an item out, and I'll post the revised card.",
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

  const weekOf = report.weekOf ?? report.checkedAt.slice(0, 10);
  const items: NumberedItem[] = report.items.map((item, i) => ({ ...item, n: i + 1 }));
  const target: IntakeTarget = open ? { kind: "update", issue: open.number, url: open.url } : { kind: "create" };
  const operations = precedenceOperations(items, target, weekOf);
  const card = renderProposalCard(precedenceCard(items, [], target, operations, PRECEDENCE_CARD_TTL_MS / 3_600_000));
  if (opts.dryRun) return { posted: false, summary: `would post ${items.length} item(s) and a card` };

  const words = precedenceList(items, weekOf, deps.ruleUrl);
  // The table, and the plain list if Slack refuses it — each with the items it
  // had no room for, which go in the thread.
  let overflow = words.table.overflow;
  let list = await deps.post({ text: words.table.text, blocks: words.table.blocks });
  if (!list.ok || !list.ts) {
    console.warn("[ds-precedence] the list table was refused — posting the plain list");
    overflow = words.overflow;
    list = await deps.post({ text: words.text });
  }
  if (!list.ok || !list.ts) {
    console.error("[ds-precedence] the list did not post — report kept for tomorrow");
    return { posted: false, summary: "list post failed; kept" };
  }
  // The list is up: posting it again tomorrow would make two threads, so the
  // report is handed off whatever happens to the card.
  await deps.report.write(null);
  const base: PostedThread = {
    channel: deps.channel,
    ts: list.ts,
    cardTs: "",
    weekOf,
    items,
    disputed: [],
    target,
    confirmers: [...members],
    expiresAt: deps.now() + PRECEDENCE_CARD_TTL_MS,
  };
  // Recorded before the card: a list thread is one whether or not its card
  // makes it, so its replies are never all turns.
  await deps.recordThread(base);
  // The items the list post had no room for, before the card, so the card
  // stays the last thing in the thread.
  for (const text of overflow) {
    const spilled = await deps.post({ text, thread_ts: list.ts });
    if (!spilled.ok) console.error("[ds-precedence] part of the list did not post in the thread");
  }
  const sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text), thread_ts: list.ts });
  if (!sent.ok || !sent.ts) {
    console.error("[ds-precedence] the list posted and the card did not");
    return { posted: true, summary: `posted ${items.length} item(s); the card failed` };
  }
  try {
    await deps.stage(stagedCard(base, sent.ts, card, operations, PRECEDENCE_CARD_TTL_MS));
  } catch (err) {
    console.error(`[ds-precedence] card posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
    return { posted: true, summary: `posted ${items.length} item(s); the card did not stage` };
  }
  await deps.recordThread({ ...base, cardTs: sent.ts });
  return { posted: true, summary: `posted ${items.length} item(s) and a card` };
}

export interface DisputeDeps {
  /** The record of the thread the reply is in, or null when it is no list thread. */
  thread: Store<PostedThread | null>;
  post(message: { text: string; blocks?: unknown[]; thread_ts?: string }): Promise<{ ok: boolean; ts?: string }>;
  /** Stage a card anew: on the usage record as staged. */
  stage(proposal: PendingProposal): Promise<void>;
  /** Put a retired card back in place; its staged row stands. */
  restore(proposal: PendingProposal): Promise<void>;
  /** Retire a card so no ✅ runs it. */
  retire(proposalTs: string): Promise<void>;
  /** Put cards a dispute took out of reach on the usage record as superseded. */
  superseded(proposalTs: readonly string[]): Promise<void>;
  /** The card as staged while it is still pending; null once decided, expired or replaced. */
  card(proposalTs: string): Promise<PendingProposal | null>;
  now(): number;
}

/** A reply, as the dispute reads it. */
export interface ThreadReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
}

const listed = (ns: readonly number[]) =>
  ns.length === 1 ? `Item ${ns[0]} is` : `Items ${namesInWords(ns.map(String))} are`;

/**
 * A reply starting `drop N` (or the older `dispute N`) in a list thread:
 * revise its card without the items. Answers whether it handled the reply —
 * false (not a list thread, or not a drop) leaves it to the ordinary path.
 *
 * In a list thread every drop is answered: a revised card, a withdrawn one,
 * or one line saying why nothing changed — an item not on the list, one
 * already dropped, or a card already decided or expired.
 *
 * The old card is retired BEFORE the revised one posts, as a turn's revision
 * does, so a ✅ racing the drop cannot run the list the person just pushed
 * back on; a revision that fails to post restores it. Anything that fails
 * after the revised card posts restores the old card too and says so in one
 * line, so the record and the live card never disagree.
 *
 * @param deps - The thread record, the posts, the staging and the card lookup
 * @param reply - The reply
 */
export async function disputePrecedenceItems(deps: DisputeDeps, reply: ThreadReply): Promise<boolean> {
  const numbers = droppedItems(reply.text);
  if (!numbers.length) return false;
  const thread = await deps.thread.read();
  if (!thread || thread.channel !== reply.channel || thread.ts !== reply.threadTs) return false;
  const say = async (text: string) => {
    await deps.post({ text, thread_ts: thread.ts });
    return true;
  };

  const old = thread.cardTs && deps.now() < thread.expiresAt ? await deps.card(thread.cardTs) : null;
  if (!old) return say("The card has already been decided or has expired, so there is nothing to revise.");
  const notListed = numbers.filter((n) => !thread.items.some((i) => i.n === n));
  const dropped = numbers.filter((n) => thread.disputed.includes(n));
  const fresh = numbers.filter((n) => !notListed.includes(n) && !dropped.includes(n));
  if (!fresh.length) {
    return say(
      [notListed.length ? `${listed(notListed)} not on this week's list.` : "", dropped.length ? `${listed(dropped)} already dropped.` : ""]
        .filter(Boolean)
        .join(" "),
    );
  }

  const disputed = [...thread.disputed, ...fresh].sort((a, b) => a - b);
  const remaining = thread.items.filter((i) => !disputed.includes(i.n));
  const ttlMs = Math.max(thread.expiresAt - deps.now(), MIN_REVISION_TTL_MS);
  const restore = () => deps.restore({ ...old, ttlMs });

  await deps.retire(old.proposalTs);
  if (!remaining.length) {
    await deps.superseded([old.proposalTs]);
    await deps.thread.write({ ...thread, disputed, cardTs: "" });
    return say(`Every item is dropped, so the card is withdrawn and nothing is filed this week (dropped by <@${reply.user}>).`);
  }

  const operations = precedenceOperations(remaining, thread.target, thread.weekOf);
  const card = renderProposalCard(precedenceCard(remaining, disputed, thread.target, operations, ttlMs / 3_600_000));
  const sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text), thread_ts: thread.ts });
  if (!sent.ok || !sent.ts) {
    console.error("[ds-precedence] the revised card did not post; the old card is restored");
    await restore();
    return true;
  }
  try {
    await deps.stage(stagedCard(thread, sent.ts, card, operations, ttlMs));
    await deps.thread.write({ ...thread, disputed, cardTs: sent.ts });
  } catch (err) {
    console.error(`[ds-precedence] revision posted but not recorded: ${err instanceof Error ? err.message : String(err)}`);
    // The old card shares the revision's key, so restoring it retires the
    // revision if it was staged; the record still names the old card.
    const restored = await restore().then(
      () => true,
      () => false,
    );
    await deps.retire(sent.ts).catch(() => {});
    await say(
      restored
        ? "That revised card didn't go through, so the card before it still stands. Try the `drop` again."
        : "That revised card didn't go through, and the card before it couldn't be put back, so neither is live and nothing will be filed from this thread. Ask me to file the intake if it's still wanted.",
    ).catch(() => {});
    return true;
  }
  // Superseded on the record only once the revision is in place: a card
  // restored after a failure was never out of reach for long.
  await deps.superseded([old.proposalTs]);
  return true;
}

/**
 * A weekly card re-staged after a cut-off run (`turn/turn.ts`
 * `restageExecution`) is the thread's live card now: the record follows it, so
 * a later `drop` finds it. A card the record does not name moves nothing.
 *
 * @param thread - The record of the thread the card was in
 * @param from - The card re-staged
 * @param to - The fresh card
 */
export async function followRestagedCard(
  thread: Store<PostedThread | null>,
  from: Pick<PendingProposal, "proposalTs">,
  to: Pick<PendingProposal, "proposalTs">,
): Promise<void> {
  const record = await thread.read();
  if (!record || record.cardTs !== from.proposalTs) return;
  await thread.write({ ...record, cardTs: to.proposalTs });
}
