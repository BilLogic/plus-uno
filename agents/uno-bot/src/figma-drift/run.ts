// `runDriftAsks` — the morning's `figma-drift-post` job — and
// `answerDriftAsk`, the "yes, it's up to date" reply that withdraws a card.
//
// THE MORNING. The end-of-day sweep queued each file drift it found
// (`sweep/run.ts` → `FileDriftSink`). At the next weekday morning run
// (`postableAt`):
//   • ONE INTAKE PER FILE. A file's intake is drafted in the first thread that
//     discussed it (`askGroupOf` keeps audiences apart). While that card is
//     live, the file gets no second intake.
//   • ONE ASK PER THREAD PER MORNING, naming every file the thread discussed.
//     A thread that drafts an intake gets ONE card holding one operation per
//     file it drafts, in its own slot (`DRIFT_KEY`) beside any sweep card or
//     turn card, so `drop N` leaves a file out and its confirmers cover every
//     file. A thread whose files' intakes are all drafted elsewhere gets the
//     question alone, pointing at them. The question is a notification, not a
//     write, so it is not gated; filing an intake is.
//   • A thread whose drift card is still live is not asked again until it is
//     resolved or lapses: its findings wait, so no card ever retires another.
//   • The card lives 72 h, with no re-ping; its confirmers are the owners plus
//     everyone who posted in the threads that discussed its files that morning.
// Each ask is posted where `pickDestination` puts it — its own thread, or the
// private place its evidence is in — and never in #uno-bot.
//
// THE YES. A reply in an asked thread that says its files are current
// (`upToDateAnswer`), from someone who may decide the card, withdraws it:
// retired in ThreadState so no ✅ can file it, edited to say why, and recorded
// on the usage record as cancelled by that person. It does not wait out its
// 72 h. A bare "yes" in a thread that also holds a live turn card is that
// card's; and a card that also files for files the replying thread never
// discussed stays, with a note saying which `drop N` leaves the answered ones
// out.
//
// A POSTED CARD IS STAGED OR WITHDRAWN. A file's intake mark is written before
// the post, so a retried morning never posts a second card for it; a post that
// fails clears the marks and keeps the findings, and a staging that fails
// edits the card to say so, clears the marks and keeps them too.
//
// Named dependencies; `Env` enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError, isSubrequestBudgetError } from "../net";
import { proposalOperations, proposalReplyThread, mayConfirm, type PendingProposal, type ProposalOperation } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { ChannelKind, TargetKind } from "../sweep/finding";
import { pickDestination, resolveDestination, type TeamChannels } from "../sweep/finding";
import { postableAt } from "../sweep/schedule";
import type { FigmaClient, FigmaVersionsResponse } from "../figma/client";
import { versionsFrom } from "../figma-poll";
import {
  askLine,
  cardTerms,
  DRIFT_CARD_TTL_MS,
  DRIFT_NOT_STAGED_TEXT,
  elsewhereWords,
  fileLink,
  mentionsOf,
  partlyAnsweredText,
  pillarNote,
  pingText,
  publisherLine,
  saidLines,
  upToDateAnswer,
  withdrawnElsewhereText,
  withdrawnText,
  type AskedFileWords,
} from "./copy";
import { draftIntake, fileKeyOfOperation, matchPillar, pillarCandidates } from "./draft";
import { askGroupOf, DRIFT_KEY, type FileDriftFinding, type IntakeLane } from "./finding";

/** Cards per morning; files whose card would be past it wait. */
export const MAX_CARDS_PER_MORNING = 4;
/** Intakes one card drafts; a thread's files past it wait. */
export const MAX_FILES_PER_CARD = 5;
/** Threads given the question alone per morning; the rest wait. */
export const MAX_QUESTIONS_PER_MORNING = 4;
/** How long a mark with no card holds its file for a try still posting. */
const POSTING_HOLD_MS = 60 * 60 * 1000;

/**
 * Who last published a file: the author of its newest named version, or null
 * when Figma names nobody. Autosaves are not publishes (`versionsFrom`).
 *
 * @param result - The file's `/versions` body
 */
export function publisherOf(result: FigmaVersionsResponse): { handle: string; at: string } | null {
  const [newest] = versionsFrom(result);
  return newest && newest.user !== "Unknown" ? { handle: newest.user, at: newest.createdAt } : null;
}

/** Where one file's intake is drafted, while its card may be live. */
export interface IntakeMark {
  channel: string;
  /** The card's thread root; null only for a mark written before its post
   *  at a place's top. */
  threadTs: string | null;
  /** The card's ts; null between the mark and the post. */
  cardTs: string | null;
  markedAt: number;
}

/** One asked file, as a thread's ask record holds it. */
export interface AskedFile {
  /** Where the card drafting the file's intake lives. */
  cardChannel: string;
  cardThread: string | null;
  /** Who in this thread may answer: its owner and everyone who posted. */
  people: string[];
  kind: TargetKind;
  askedAt: number;
}

/** Everything a thread has been asked, by file key. */
export type AskRecord = Record<string, AskedFile>;

/** The queue and the marks, behind one port. */
export interface DriftStore {
  pending(): Promise<FileDriftFinding[]>;
  remove(ids: string[]): Promise<void>;
  intakeMark(group: string): Promise<IntakeMark | null>;
  /** Kept for the card's lifetime. */
  setIntakeMark(group: string, mark: IntakeMark): Promise<void>;
  clearIntakeMark(group: string): Promise<void>;
  asked(channel: string, threadTs: string): Promise<AskRecord>;
  saveAsked(channel: string, threadTs: string, record: AskRecord): Promise<void>;
}

/** A place a message goes: a thread, or a place's top. */
export interface AskPlace {
  channel: string;
  threadTs: string | null;
}

export interface DriftPostDeps {
  store: DriftStore;
  slack: {
    /** Post a card or a question, tagged as the sweep's so a reply under it
     *  is read by the sweep thread's rule. */
    post(to: AskPlace, message: { text: string; blocks?: unknown[]; card: boolean }): Promise<{ ok: boolean; ts?: string }>;
    permalink(channel: string, ts: string): Promise<string | null>;
    /** Retire a posted card and edit it to `text`, with its buttons gone. */
    withdraw(channel: string, ts: string, text: string): Promise<void>;
    /** Mark the thread as entered through a proactive post, when the bot had
     *  no history there (`sweep/thread-mark.ts`). */
    markThread(channel: string, threadTs: string): Promise<void>;
  };
  render(card: ProposalCard): { text: string; blocks: unknown[] };
  /** Stage the card and record it on the usage record (`stageSweepCard`). */
  stage(proposal: PendingProposal, channelKind: ChannelKind): Promise<void>;
  /** Whether a posted card is still live in ThreadState. */
  cardLive(proposalTs: string): Promise<boolean>;
  /** Whether a thread already holds a live drift card. */
  threadBusy(channel: string, threadTs: string): Promise<boolean>;
  /** The Figma client, for who last published a file (`publisherOf`). Without
   *  one, no card names a publisher. */
  figma?: Pick<FigmaClient, "versions">;
  /** The Roadmap's Product Pillar options, or null when unread. */
  pillarOptions(): Promise<string[] | null>;
  config: TeamChannels & { unoBot?: string };
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  dryRun?: boolean;
}

/** One ask posted — or, on a dry run, planned. */
export interface DriftAskReport {
  channel: string;
  threadTs: string | null;
  role: "card" | "question";
  /** The files it names, by file key. */
  files: string[];
  /** The message text; withheld for a private place on a dry run. */
  text: string;
  ts?: string;
}

export interface DriftPostReport {
  kind: "figma-drift-post";
  key: string;
  outcome: "handled";
  note: string | null;
  asks: DriftAskReport[];
  summary: string;
}

/** What a dry run's report shows of an ask in a private place. */
export const WITHHELD_ASK_TEXT = "(withheld: this ask is for a private channel or a group DM)";

/** One thread's plan for the morning. */
interface ThreadPlan {
  key: string;
  /** Its findings, one per file, oldest drift first. */
  findings: FileDriftFinding[];
  /** The groups whose intake this thread's card drafts. */
  drafts: string[];
}

/** Where a file's intake is drafted this morning. */
type Home = { kind: "live"; mark: IntakeMark } | { kind: "new"; thread: string };

/**
 * One morning's asks.
 *
 * @param job - The `figma-drift-post` job
 * @param deps - Everything it touches, by name
 * @throws A budget stop before a card that could not finish — the runner
 *   retries the job on a fresh budget, and the marks keep it from asking twice
 */
export async function runDriftAsks(job: { key: string }, deps: DriftPostDeps): Promise<DriftPostReport> {
  const now = deps.now();
  const notes: string[] = [];
  const asks: DriftAskReport[] = [];
  const queued = await deps.store.pending();
  const due = queued.filter((f) => postableAt(f.detectedAt) <= now);

  // A thread already asked about a file is not asked again; one whose drift
  // card is still live waits for it.
  const fresh: FileDriftFinding[] = [];
  const already: string[] = [];
  const busy = new Set<string>();
  for (const [key, list] of groupBy(due, threadKey)) {
    const { channel, threadTs } = list[0]!.evidence;
    if (channel === deps.config.unoBot) {
      already.push(...list.map((f) => f.id));
      continue;
    }
    const record = await deps.store.asked(channel, threadTs ?? "");
    const open = list.filter((f) => {
      if (!record[f.fileKey]) return true;
      already.push(f.id);
      return false;
    });
    if (open.length && !deps.dryRun && threadTs && (await deps.threadBusy(channel, threadTs))) busy.add(key);
    else fresh.push(...open);
  }
  if (already.length && !deps.dryRun) await deps.store.remove(already);
  if (busy.size) notes.push(`${busy.size} thread(s) wait for their live drift card`);

  // One finding per file per thread.
  const threads = new Map<string, ThreadPlan>();
  for (const [key, list] of groupBy(fresh, threadKey)) {
    const findings = [...groupBy(list, (f) => f.fileKey).values()]
      .map((same) => same.sort((a, b) => a.driftAt - b.driftAt)[0]!)
      .sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id));
    threads.set(key, { key, findings, drafts: [] });
  }

  // Where each file's intake is drafted: its live card, or its first thread.
  const homes = new Map<string, Home>();
  const waiting = new Set<string>();
  const byGroup = groupBy([...threads.values()].flatMap((t) => t.findings), askGroupOf);
  for (const [group, list] of [...byGroup].sort((a, b) => earliest(a[1]) - earliest(b[1]))) {
    const mark = deps.dryRun ? null : await deps.store.intakeMark(group);
    if (mark?.cardTs && mark.markedAt + DRIFT_CARD_TTL_MS > now && (await deps.cardLive(mark.cardTs))) {
      homes.set(group, { kind: "live", mark });
      continue;
    }
    if (mark && !mark.cardTs && mark.markedAt + POSTING_HOLD_MS > now) {
      notes.push(`${group}: a card is still being posted — held`);
      waiting.add(group);
      continue;
    }
    // Lapsed, answered, withdrawn — or a try that stopped before its post
    // an hour ago: the file may be asked afresh.
    if (mark) await deps.store.clearIntakeMark(group);
    homes.set(group, { kind: "new", thread: threadKey(list.sort((a, b) => a.driftAt - b.driftAt)[0]!) });
  }

  // Cards first: each thread that drafts an intake, oldest drift first, up to
  // the caps. A file whose card does not fit waits, everywhere it was asked.
  const drafting = [...threads.values()]
    .map((t) => ({
      t,
      mine: t.findings.map(askGroupOf).filter((g) => homes.get(g)?.kind === "new" && (homes.get(g) as { thread: string }).thread === t.key),
    }))
    .filter((x) => x.mine.length)
    .sort((a, b) => earliest(a.t.findings) - earliest(b.t.findings));
  drafting.forEach(({ t, mine }, i) => {
    const kept = i < MAX_CARDS_PER_MORNING ? mine.slice(0, MAX_FILES_PER_CARD) : [];
    for (const g of mine) if (!kept.includes(g)) waiting.add(g);
    t.drafts = kept;
  });
  if (waiting.size) notes.push(`${waiting.size} file(s) wait for tomorrow's asks`);
  for (const t of threads.values()) t.findings = t.findings.filter((f) => !waiting.has(askGroupOf(f)));

  const cardLinks = new Map<string, string | null>();
  const cardPlaces = new Map<string, { channel: string; thread: string | null }>();
  const asked: string[] = [];
  const cardThreads = [...threads.values()].filter((t) => t.drafts.length).sort((a, b) => earliest(a.findings) - earliest(b.findings));
  const carded: ThreadPlan[] = [];
  for (const t of cardThreads) {
    if (await askWithCard(deps, t, byGroup, homes, cardLinks, cardPlaces, asks, notes)) carded.push(t);
  }
  // Recorded once every card is up, so a file drafted on a later card is on
  // this thread's record too. A file whose card did not go up stays queued.
  for (const t of carded) {
    const placed = t.findings.filter((f) => deps.dryRun || placeFor(askGroupOf(f), homes, cardPlaces));
    if (!deps.dryRun) await recordAsked(deps, placed, (f) => placeFor(askGroupOf(f), homes, cardPlaces));
    asked.push(...placed.map((f) => f.id));
  }
  let questions = 0;
  const questionThreads = [...threads.values()]
    .filter((t) => !t.drafts.length && t.findings.length)
    .sort((a, b) => earliest(a.findings) - earliest(b.findings));
  for (const t of questionThreads) {
    if (questions >= MAX_QUESTIONS_PER_MORNING) {
      notes.push(`${questionThreads.length - questions} thread(s) wait for tomorrow's question`);
      break;
    }
    questions += 1;
    asked.push(...(await askQuestion(deps, t, homes, cardLinks, cardPlaces, asks)));
  }
  if (asked.length && !deps.dryRun) await deps.store.remove(asked);

  const note = notes.length ? notes.join("; ") : null;
  const cards = asks.filter((a) => a.role === "card").length;
  const verb = deps.dryRun ? "would ask" : "asked";
  const summary = asks.length
    ? `${verb} ${asks.length} thread(s), ${cards} with drafted intakes${note ? ` — ${note}` : ""}`
    : `no file drift due this morning${note ? ` — ${note}` : ""}`;
  return { kind: "figma-drift-post", key: job.key, outcome: "handled", note, asks, summary };
}

/**
 * One thread's card: one intake per file it drafts, and the question naming
 * every file it discussed.
 *
 * @returns Whether the card went up and was staged
 */
async function askWithCard(
  deps: DriftPostDeps,
  t: ThreadPlan,
  byGroup: Map<string, FileDriftFinding[]>,
  homes: Map<string, Home>,
  cardLinks: Map<string, string | null>,
  cardPlaces: Map<string, { channel: string; thread: string | null }>,
  asks: DriftAskReport[],
  notes: string[],
): Promise<boolean> {
  const first = t.findings[0]!;
  const to = placeOf(first, deps.config);
  if (!to) {
    notes.push(`${t.key}: its place is not configured`);
    return false;
  }
  // Each file drafted here, with every thread that discussed it this morning.
  const drafted = t.drafts.map((g) => ({
    group: g,
    here: t.findings.find((f) => askGroupOf(f) === g)!,
    all: (byGroup.get(g) ?? []).sort((a, b) => a.driftAt - b.driftAt),
  }));
  const publicEvidence = drafted.flatMap((d) => d.all).filter((f) => f.evidence.channelKind === "public");
  if (!deps.dryRun) {
    // Everything the card will send, counted before any of it is: the
    // permalinks, a publisher and the pillar options per file, the post, the
    // staging, its own permalink and a withdrawal held back.
    ensureHeadroom(deps, { subrequests: publicEvidence.length + 2 * drafted.length + 4, d1Queries: 2 });
  }
  const now = deps.now();
  if (!deps.dryRun) {
    for (const d of drafted) await deps.store.setIntakeMark(d.group, { channel: to.channel, threadTs: to.threadTs, cardTs: null, markedAt: now });
  }

  const permalinks: Record<string, string> = {};
  for (const f of publicEvidence) {
    const ts = f.evidence.messageTs[0];
    if (!ts || permalinks[f.id]) continue;
    const link = await deps.slack.permalink(f.evidence.channel, ts).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (link) permalinks[f.id] = link;
  }
  let options: Promise<string[] | null> | undefined;
  const bullets: string[] = [];
  const operations: ProposalOperation[] = [];
  const lanes: IntakeLane[] = [];
  for (const [i, d] of drafted.entries()) {
    const f = d.here;
    const figmaKey = f.fileKey.startsWith("figma:") ? f.fileKey.slice("figma:".length) : null;
    const publisher =
      figmaKey && deps.figma
        ? await deps.figma
            .versions(figmaKey)
            .then(publisherOf)
            .catch((err: unknown) => {
              rethrowIfBudget(err);
              return null;
            })
        : null;
    const candidates = pillarCandidates(d.all);
    const choice =
      f.lane === "roadmap" && candidates.length
        ? matchPillar(
            candidates,
            await (options ??= deps.pillarOptions()).catch((err: unknown) => {
              rethrowIfBudget(err);
              return null;
            }),
          )
        : { pillar: null, note: null };
    const intake = draftIntake({ findings: d.all, pillar: choice.pillar, publisher, permalinks });
    operations.push(intake.operation);
    lanes.push(intake.lane);
    const pub = publisherLine(publisher);
    bullets.push(
      drafted.length > 1 ? `${i + 1}. ${fileLink(f.target)}` : "",
      ...(pub ? [`${drafted.length > 1 ? "   " : ""}${pub}`] : []),
      ...saidLines(f.threadSays, f.sourceSays, drafted.length > 1 ? "   " : ""),
      ...(choice.note ? [`${drafted.length > 1 ? "   " : ""}${pillarNote(choice.note)}`] : []),
    );
  }
  // Files this thread discussed whose intake is drafted on another card.
  const elsewhere = t.findings.filter((f) => !t.drafts.includes(askGroupOf(f)));
  for (const f of elsewhere) bullets.push(`• ${fileLink(f.target)}: ${elsewhereWords(linkFor(askGroupOf(f), cardLinks))}`);

  const files: AskedFileWords[] = [...drafted.map((d) => d.here), ...elsewhere].map((f) => f.target);
  const lead = [
    `:art: ${askLine({ mentions: mentionsOf(t.findings.map((f) => f.owner)), files })}`,
    ...bullets.filter((line) => line !== ""),
    "",
    cardTerms(lanes, drafted[0]!.here.target.kind),
  ].join("\n");
  const card: ProposalCard = {
    kind: "confirm",
    verb:
      operations.length > 1
        ? `file these ${operations.length} intakes`
        : lanes[0] === "roadmap"
          ? "file this Roadmap card"
          : "file this intake",
    lead,
    fields: [],
    caveats: [],
    operations,
  };
  const rendered = deps.render(card);
  const fileKeys = t.findings.map((f) => f.fileKey);
  const report: DriftAskReport = {
    channel: to.channel,
    threadTs: to.threadTs,
    role: "card",
    files: fileKeys,
    text: deps.dryRun && first.evidence.channelKind !== "public" ? WITHHELD_ASK_TEXT : rendered.text,
  };
  if (deps.dryRun) {
    asks.push(report);
    for (const d of drafted) cardLinks.set(d.group, null);
    return true;
  }

  const clearMarks = async () => {
    for (const d of drafted) await deps.store.clearIntakeMark(d.group);
  };
  const sent = await deps.slack.post(to, { text: rendered.text, blocks: rendered.blocks, card: true });
  if (!sent.ok || !sent.ts) {
    await clearMarks();
    notes.push(`${t.key}: the card's post failed — kept for tomorrow`);
    return false;
  }
  const root = to.threadTs ?? sent.ts;
  const confirmers = [...new Set(drafted.flatMap((d) => d.all).flatMap((f) => [f.owner, ...f.participants]).filter(Boolean))];
  const proposal: PendingProposal = {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel: to.channel,
    threadTs: root,
    replyTs: root,
    userMsgTs: root,
    proposalTs: sent.ts,
    proposalText: rendered.text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: DRIFT_CARD_TTL_MS,
    confirmers,
    // Its own slot, beside a sweep card and a turn's card (`proposalSlot`).
    supersedeKey: DRIFT_KEY,
  };
  try {
    await deps.stage(proposal, first.evidence.channelKind);
  } catch (err) {
    rethrowIfBudget(err);
    const why = err instanceof Error ? err.message : String(err);
    await deps.slack.withdraw(to.channel, sent.ts, DRIFT_NOT_STAGED_TEXT).catch(rethrowIfBudget);
    await clearMarks();
    notes.push(`${t.key}: posted but not staged (${why}) — withdrawn, kept for tomorrow`);
    return false;
  }
  for (const d of drafted) {
    await deps.store.setIntakeMark(d.group, { channel: to.channel, threadTs: root, cardTs: sent.ts, markedAt: now });
  }
  asks.push({ ...report, ts: sent.ts });
  const link = await deps.slack.permalink(to.channel, sent.ts).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  for (const d of drafted) {
    cardLinks.set(d.group, link);
    cardPlaces.set(d.group, { channel: to.channel, thread: root });
  }
  return true;
}

/**
 * The question alone, in a thread whose files' intakes are drafted elsewhere.
 *
 * @returns The ids of the findings asked
 */
async function askQuestion(
  deps: DriftPostDeps,
  t: ThreadPlan,
  homes: Map<string, Home>,
  cardLinks: Map<string, string | null>,
  cardPlaces: Map<string, { channel: string; thread: string | null }>,
  asks: DriftAskReport[],
): Promise<string[]> {
  // A file whose card did not go up this morning is not pointed at.
  const findings = t.findings.filter((f) => placeFor(askGroupOf(f), homes, cardPlaces) || deps.dryRun);
  if (!findings.length) return [];
  const first = findings[0]!;
  const to = placeOf(first, deps.config);
  if (!to) return [];
  if (!deps.dryRun) ensureHeadroom(deps, { subrequests: 1 + findings.length, d1Queries: 0 });
  const links: Array<{ file: AskedFileWords; cardLink: string | null }> = [];
  for (const f of findings) {
    const group = askGroupOf(f);
    let link = linkFor(group, cardLinks);
    const home = homes.get(group);
    if (link === null && home?.kind === "live" && home.mark.cardTs && !deps.dryRun) {
      link = await deps.slack.permalink(home.mark.channel, home.mark.cardTs).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      cardLinks.set(group, link);
    }
    links.push({ file: f.target, cardLink: link });
  }
  const line = askLine({ mentions: mentionsOf(findings.map((f) => f.owner)), files: findings.map((f) => f.target) });
  const text = pingText(`:art: ${line}`, links);
  const report: DriftAskReport = {
    channel: to.channel,
    threadTs: to.threadTs,
    role: "question",
    files: findings.map((f) => f.fileKey),
    text: deps.dryRun && first.evidence.channelKind !== "public" ? WITHHELD_ASK_TEXT : text,
  };
  if (deps.dryRun) {
    asks.push(report);
    return findings.map((f) => f.id);
  }
  const sent = await deps.slack.post(to, { text, card: false });
  if (!sent.ok || !sent.ts) return [];
  if (to.threadTs) await deps.slack.markThread(to.channel, to.threadTs).catch(rethrowIfBudget);
  asks.push({ ...report, ts: sent.ts });
  await recordAsked(deps, findings, (f) => placeFor(askGroupOf(f), homes, cardPlaces));
  return findings.map((f) => f.id);
}

/** A file's card link, once fetched this morning; null until then. */
function linkFor(group: string, cardLinks: Map<string, string | null>): string | null {
  return cardLinks.get(group) ?? null;
}

function placeFor(
  group: string,
  homes: Map<string, Home>,
  cardPlaces: Map<string, { channel: string; thread: string | null }>,
): { channel: string; thread: string | null } | null {
  const home = homes.get(group);
  if (home?.kind === "live") return { channel: home.mark.channel, thread: home.mark.threadTs ?? home.mark.cardTs };
  return cardPlaces.get(group) ?? null;
}

/** The thread's ask record gains these files. */
async function recordAsked(
  deps: DriftPostDeps,
  findings: readonly FileDriftFinding[],
  cardOf: (f: FileDriftFinding) => { channel: string; thread: string | null } | null,
): Promise<void> {
  const first = findings[0];
  if (!first) return;
  const threadTs = first.evidence.threadTs ?? "";
  const record = await deps.store.asked(first.evidence.channel, threadTs);
  for (const f of findings) {
    const card = cardOf(f);
    if (!card) continue;
    record[f.fileKey] = {
      cardChannel: card.channel,
      cardThread: card.thread,
      people: [...new Set([f.owner, ...f.participants].filter(Boolean))],
      kind: f.target.kind,
      askedAt: deps.now(),
    };
  }
  await deps.store.saveAsked(first.evidence.channel, threadTs, record);
}

/** Where a finding's ask goes (`pickDestination`), never #uno-bot. */
function placeOf(f: FileDriftFinding, config: DriftPostDeps["config"]): AskPlace | null {
  const to = resolveDestination(pickDestination(f), config);
  if (!to || to.channel === config.unoBot) return null;
  return to;
}

// ── The yes ──────────────────────────────────────────────────────────────────

/** A thread reply, as the answer reads it. */
export interface DriftReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
}

export interface DriftAnswerDeps {
  asked(channel: string, threadTs: string): Promise<AskRecord>;
  /** The live drift card in a thread — a revision of it included. */
  liveCard(channel: string, thread: string): Promise<PendingProposal | null>;
  /** Who may decide any card with a confirmer set, beside its own — Gate's
   *  `standingConfirmers`. */
  standingConfirmers?: readonly string[];
  /** Whether the thread also holds a live turn card (no slot key). */
  hasTurnCard(channel: string, thread: string): Promise<boolean>;
  /** Take the card out of reach; false when it was no longer live. */
  retire(proposalTs: string): Promise<boolean>;
  /** Edit the card to `text`, its buttons gone. */
  edit(channel: string, ts: string, text: string): Promise<void>;
  /** Say something in the thread the yes came from. */
  post(channel: string, threadTs: string, text: string): Promise<void>;
  /** The card's cancelled row on the usage record, by this person. */
  recordWithdrawn(proposal: PendingProposal, user: string): Promise<void>;
}

/**
 * Whether a message could be a yes to a drift ask — no reads, so the message
 * job can ask it of every thread reply.
 *
 * @param event - The message
 */
export function isDriftAnswerCandidate(event: {
  thread_ts?: string;
  bot_id?: string;
  user?: string;
  subtype?: string;
  text?: string;
}): boolean {
  if (!event.thread_ts || event.bot_id || !event.user || event.subtype) return false;
  return upToDateAnswer(event.text ?? "") !== null;
}

/**
 * A yes in an asked thread: withdraw each live card it answers whole, and
 * say which `drop N` leaves the answered files off a card it answers in part.
 *
 * NEVER THROWS BUT FOR A BUDGET STOP: a failed read answers false, so the
 * reply takes the ordinary engagement rule rather than a turn it would never
 * have had. A card already retired when a later step fails is still edited
 * and recorded, each step on its own.
 *
 * @param reply - The reply
 * @param deps - The reads and the withdrawal
 * @returns Whether a card was withdrawn or answered — the reply then runs no turn
 */
export async function answerDriftAsk(reply: DriftReply, deps: DriftAnswerDeps): Promise<boolean> {
  const answer = upToDateAnswer(reply.text);
  if (!answer) return false;
  let record: AskRecord;
  try {
    record = await deps.asked(reply.channel, reply.threadTs);
    if (!Object.keys(record).length) return false;
    // A bare "yes" under a live turn card is that card's answer.
    if (answer === "bare" && (await deps.hasTurnCard(reply.channel, reply.threadTs))) return false;
  } catch (err) {
    return swallowed(err, "read");
  }

  const cards = groupBy(
    Object.entries(record).filter(([, f]) => f.cardThread),
    ([, f]) => `${f.cardChannel}:${f.cardThread}`,
  );
  let handled = false;
  for (const entries of cards.values()) {
    const [, file] = entries[0]!;
    let card: PendingProposal | null;
    try {
      card = await deps.liveCard(file.cardChannel, file.cardThread!);
    } catch (err) {
      swallowed(err, "card lookup");
      continue;
    }
    if (!card) continue;
    const people = new Set(entries.flatMap(([, f]) => f.people));
    if (!people.has(reply.user) && !(card.confirmers && mayConfirm(card, reply.user, deps.standingConfirmers))) continue;

    // Which of the card's files this thread was asked about.
    const onCard = proposalOperations(card).map(fileKeyOfOperation);
    const answered = new Set(entries.map(([key]) => key));
    const kinds = entries.map(([, f]) => f.kind);
    if (onCard.some((key) => !key || !answered.has(key))) {
      const numbers = onCard.flatMap((key, i) => (key && answered.has(key) ? [i + 1] : []));
      if (!numbers.length) continue;
      await step(() => deps.post(reply.channel, reply.threadTs, partlyAnsweredText(numbers)), "note");
      handled = true;
      continue;
    }

    let retired = false;
    try {
      retired = await deps.retire(card.proposalTs);
    } catch (err) {
      swallowed(err, "retire");
      continue;
    }
    if (!retired) continue;
    handled = true;
    await step(() => deps.edit(card.channel, card.proposalTs, withdrawnText(reply.user, kinds)), "edit");
    await step(() => deps.recordWithdrawn(card, reply.user), "record");
    if (card.channel !== reply.channel || proposalReplyThread(card) !== reply.threadTs) {
      await step(() => deps.post(reply.channel, reply.threadTs, withdrawnElsewhereText(kinds)), "note");
    }
  }
  return handled;
}

/** One best-effort step of a withdrawal: logged, never thrown, but a budget stop. */
async function step(fn: () => Promise<void>, what: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    swallowed(err, what);
  }
}

function swallowed(err: unknown, what: string): false {
  if (isSubrequestBudgetError(err)) throw err;
  console.error(`[figma-drift] yes: ${what} failed: ${err instanceof Error ? err.message : String(err)}`);
  return false;
}

// ── Shared ───────────────────────────────────────────────────────────────────

function threadKey(f: FileDriftFinding): string {
  return `${f.evidence.channel}:${f.evidence.threadTs ?? ""}`;
}

function earliest(findings: readonly FileDriftFinding[]): number {
  return Math.min(...findings.map((f) => f.driftAt));
}

function groupBy<T>(list: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of list) out.set(keyOf(item), [...(out.get(keyOf(item)) ?? []), item]);
  return out;
}

/** Stop, as the budget does, unless what is left covers the step. */
function ensureHeadroom(deps: DriftPostDeps, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}
