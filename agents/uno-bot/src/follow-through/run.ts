// Card follow-ups, end to end: scenarios F3 to F5 of the Follow through job.
//
// Each is a `commitments` row of its own kind (`../commitments/store.ts`), so
// it shares a promise's life: detected at the end of the day, nudged at the
// next weekday morning run (9 am ET), one follow-up at most, then `lapsed`,
// and at most `MAX_REMINDERS_PER_PERSON` reminders a person a morning, counted
// across promises and cards alike. The commitment job schedules them and
// hands each to this module (`CardFollowUps`).
//
// THE ENTRY POINTS:
//
//   `runCardFollowThroughScan` — the end-of-day `card-follow-through` job. It
//   reads the Roadmap's active cards in one query, looks up what each
//   candidate last had in one D1 read, and keeps a row for each that is F4's
//   (in WIP or Under Review with no Contributor, a week untouched) or F5's
//   (active, three weeks untouched and uncommented) — at most
//   `MAX_NEW_PER_NIGHT` a night, never a card that had a message in the past
//   week (`mayFollowUpCard`), and never one uno-bot's integration created.
//
//   `cardTodoThreadHook` — the sweep's per-thread hook, run before commitment
//   reminders': a thread's to-do to make a card becomes an F3 row, due two
//   working days on, and the promise hook passes over its message.
//   `cardTodoNoteHook` does the same for a team running note the capture
//   sweep read, after its team-note guard (`recordNoteCardTodos`).
//
//   `cardFollowUps` — the morning. `due`, for one due row, looks for the
//   evidence first: a Roadmap card matching the to-do, a Contributor now set,
//   a card that moved or was commented on. Found, the row is `auto_done` and
//   nothing is sent; declined in its last card's Review, it is answered and
//   nothing is sent. Otherwise its card is held, and `flush` posts the
//   morning's cards on the shared decision card (`slack/decision-cards.ts`):
//   one message per person and place, a carousel when there are several,
//   mentioning only the owners. The one follow-up is armed a week out — so a
//   card never gets two messages in one week. A stop before `flush` hands the
//   held rows back (`release`), so the next run posts them.
//
// WHAT REVIEW HOLDS. Each card is its own proposal, one item of its report.
// F3's is the drafted Roadmap card (`notion_create`, PRD template), decided
// Approve or Reject. F4 and F5 offer their own answers in place of those
// (`PendingProposal.choices`): F4's Assign the person asked or Leave it; F5's
// Done (the Design Status in its select, the board's next by default), Still
// on it (nothing written, checked again in three weeks, at most twice) or
// Drop it (archived). Every select value is exact-matched against the
// Roadmap's own options (hard rule 4): a pillar only when the database has
// it, a status only when it is one of the board's. No confirmer set: a card
// is the team's, so anyone may decide it, as anyone could tap its buttons.
//
// A FOLLOW-UP POSTED BEFORE THE SHARED CARD keeps its own answers until it
// closes: `answerCardFollowUp` takes a reaction or a tap on it (F3's ✅
// stages the drafted card, 🙅 drops the to-do; F5's 🙌 and 🙅 list the card's
// live Design Status options, ⏳ leaves the card be), and `handleCardReply` a
// reply in a thread marked for one — F4's owner named, or F5's pick of
// Design Status — each staging a proposal card the sweep's way in a slot of
// its own (`"follow-through:<row id>"`). A follow-up on the shared card takes
// none of them. `handleCardReplySafely` never throws.
//
// WHERE IT POSTS: `pickDestination`, as every proactive job. A thread's to-do
// is answered in that thread (a private channel's stays there); a card has no
// thread, so its follow-up goes to #plus-universal when its Product Pillar is
// Universal and #plus-design otherwise. Never #uno-bot, never a Notion
// comment, never the lead by default.
//
// Every dependency is injected (tests/card-follow-through.test.ts). `Env`
// enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import { pickDestination, resolveDestination, routeOwner, type ChannelKind, type SweepMessage, type SweepThread } from "../sweep/finding";
import { escapeSlackText } from "../slack/mrkdwn";
import type { ProposalCard } from "../turn/index";
import type { PendingProposal, ProposalOperation, ProposalSelect, ReportItem, ReviewChoice, ThreadState } from "../thread-state/index";
import { decisionReport, itemProposal, markNotStaged, MAX_REPORT_ITEMS, reportRecord, type ReportStore } from "../slack/decision-cards";
import { renderProposalCard } from "../slack/proposal-render";
import { reminderBlocks, TAP_REFUSED, type TapAnswer } from "../commitments/copy";
import { addWorkingDays, commitmentDueAt, endOfEtDay, etDayOf, maySnooze, TEXT_KEEP_MS } from "../commitments/due";
import type { CommitmentAction } from "../commitments/run";
import { cardTodoId, LIVE_STATES, type CommitmentPatch, type CommitmentRecord, type CommitmentStore, type CommitmentText } from "../commitments/store";
import {
  ANSWER_ON_CARD,
  answeredBy,
  cardAcknowledgement,
  DRAFT_NOT_POSTED,
  cardAnswer,
  draftTitle,
  FOLLOW_UP_NOT_STAGED,
  FOLLOW_UP_REVISION,
  followUpParent,
  staleChoices,
  staleItem,
  staleReviewLead,
  statusChoiceText,
  statusRetryText,
  todoItem,
  unownedChoices,
  todoReviewLead,
  unownedItem,
  unownedReviewLead,
} from "./copy";
import {
  CARD_REARM_WORKING_DAYS,
  CHOICE_TTL_MS,
  cardCondition,
  cardFollowUpId,
  isActive,
  matchesTodo,
  MAX_CARD_POSTS_PER_CHANNEL,
  mayFollowUpCard,
  maybeCondition,
  LIKELY_STATUSES,
  nextStatus,
  orderStatusOptions,
  pickStatus,
  STALE_AFTER_MS,
  todoWords,
  type ActiveCard,
  type CardCondition,
} from "./rules";
import type { CardTodoDetector } from "./todo";

/** New card follow-ups one end of day keeps; the rest wait a night. */
export const MAX_NEW_PER_NIGHT = 15;
/** What one card costs at the end of day: its comments, a creator's name, a
 *  Slack lookup, and the D1 reads and write around them. */
export const CARD_SCAN_COST = { subrequests: 4, d1Queries: 2 };
/** What the scan spends before its first card: up to three Roadmap pages,
 *  uno-bot's Notion user, the skip marks, and the one D1 read of the
 *  candidates' rows — and one subrequest kept for writing the marks back. */
export const SCAN_START_COST = { subrequests: 6, d1Queries: 1 };
/** How long a card with nobody to ask, or no channel, is passed over before
 *  the scan looks again. */
export const SKIP_RECHECK_MS = 7 * 24 * 60 * 60 * 1000;
/** How long a proposal card a follow-up stages stays confirmable. */
export const FOLLOW_THROUGH_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** The thread slot those cards hold (`PendingProposal.supersedeKey`), one per
 *  follow-up: `follow-through:<row id>`. */
export const FOLLOW_THROUGH_KEY = "follow-through";

type CardKind = "card_todo" | "card_unowned" | "card_stale";

/** The Roadmap reads. */
export interface CardReads {
  /** Every card in an active Design Status, in one query. */
  activeCards(): Promise<{ cards: ActiveCard[]; truncated: boolean }>;
  /** One card as it is now, or null when it is gone. */
  card(pageId: string): Promise<ActiveCard | null>;
  /** A card's newest comment, epoch ms, or null for none. */
  lastCommentAt(pageId: string): Promise<number | null>;
  /** Titles of Roadmap cards holding any of these words. */
  titlesMatching(words: string[]): Promise<string[]>;
  /** The Roadmap's `Product Pillar` options, exactly as the database has them. */
  pillarOptions(): Promise<string[]>;
  /** The Roadmap's `Design Status` options, exactly and in the schema's order. */
  statusOptions(): Promise<string[]>;
  /** uno-bot's own Notion integration user, whose cards it never asks about. */
  botUserId(): Promise<string | null>;
}

/** Who is who, across Notion and Slack; null when not exactly one person. */
export interface CardPeople {
  slackIdForNotionUser(notionUserId: string): Promise<string | null>;
  slackIdForName(name: string): Promise<string | null>;
  notionUserForSlack(slackUserId: string): Promise<string | null>;
}

export interface FollowThroughConfig {
  plusDesign?: string;
  plusUniversal?: string;
  /** #uno-bot: never a destination. */
  unoBot?: string;
  botUserId?: string | null;
}

/** A proposal card to post in a follow-up's thread and stage. */
export interface CardProposal {
  card: ProposalCard;
  channel: string;
  channelKind: ChannelKind;
  threadTs: string;
  confirmers: string[];
  /** Its slot in the thread (`PendingProposal.supersedeKey`). */
  slot: string;
}

/** A follow-up's proposal slot. */
export function proposalSlotFor(c: Pick<CommitmentRecord, "id">): string {
  return `${FOLLOW_THROUGH_KEY}:${c.id}`;
}

export interface FollowUpMessage {
  text: string;
  blocks: unknown[];
}

// ── End of day: the Roadmap scan (F4, F5) ───────────────────────────────────

/** The scan's skip marks (`reply-mark.ts`): follow-up id → epoch ms it may be
 *  looked at again. */
export interface ScanSkips {
  read(): Promise<Record<string, number>>;
  write(marks: Record<string, number>): Promise<void>;
}

export interface ScanDeps extends Pick<JobContext, "runDate"> {
  reads: Pick<CardReads, "activeCards" | "lastCommentAt" | "botUserId">;
  people: Pick<CardPeople, "slackIdForNotionUser" | "slackIdForName">;
  store: CommitmentStore;
  skips?: ScanSkips;
  config: FollowThroughConfig;
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  dryRun?: boolean;
}

export interface ScanReport {
  kind: "card-follow-through";
  key: string;
  rows: CommitmentRecord[];
  notes: string[];
  summary: string;
}

/**
 * The end-of-day Roadmap scan.
 *
 * @param job - The `card-follow-through` job
 * @param deps - Everything it touches
 * @throws A budget stop between cards; what was kept stays kept, and the
 *   runner runs it again on a fresh budget
 */
export async function runCardFollowThroughScan(job: ScheduledJob, deps: ScanDeps): Promise<ScanReport> {
  const now = deps.now();
  const rows: CommitmentRecord[] = [];
  const notes: string[] = [];
  const report = (): ScanReport => {
    const verb = deps.dryRun ? "would keep" : "kept";
    const note = notes.length ? ` — ${notes.join("; ")}` : "";
    return { kind: "card-follow-through", key: job.key, rows, notes, summary: `${verb} ${rows.length} card follow-up(s)${note}` };
  };
  ensureHeadroom(deps, SCAN_START_COST);
  const { cards, truncated } = await deps.reads.activeCards();
  if (truncated) notes.push("the active cards did not fit one read; the rest wait for a later night");
  const bot = await deps.reads.botUserId();
  const skips = deps.skips ? await deps.skips.read() : {};
  const skipsAtStart = JSON.stringify(skips);
  const maybe = cards
    .map((card) => ({ card, maybe: maybeCondition(card, now) }))
    .filter((c): c is { card: ActiveCard; maybe: CardCondition } => c.maybe !== null)
    // A card uno-bot's own integration made has no person to ask.
    .filter((c) => !(bot && c.card.creatorId === bot))
    // Passed over lately with nothing to keep: not read again until its mark ends.
    .filter((c) => !((skips[cardFollowUpId(c.card.pageId, c.maybe, c.card.lastEditedAt)] ?? 0) > now));
  // What every candidate last had, in one read, so a card asked about and
  // still untouched never takes a place in the night's count.
  const latest = maybe.length ? await deps.store.latestForCards(maybe.map((c) => c.card.pageId)) : {};
  const candidates = maybe
    .filter(({ card, maybe }) => {
      const last = latest[card.pageId] ?? null;
      return last?.id !== cardFollowUpId(card.pageId, maybe, card.lastEditedAt) && mayFollowUpCard(last, now);
    })
    .sort((a, b) => a.card.lastEditedAt - b.card.lastEditedAt || a.card.pageId.localeCompare(b.card.pageId));
  try {
    for (const { card, maybe } of candidates) {
      if (rows.length >= MAX_NEW_PER_NIGHT) {
        notes.push(`more than ${MAX_NEW_PER_NIGHT} cards due; the rest wait a night`);
        break;
      }
      // One more kept back for writing the skip marks, should this be the last.
      ensureHeadroom(deps, { ...CARD_SCAN_COST, subrequests: CARD_SCAN_COST.subrequests + (deps.skips ? 1 : 0) });
      const kept = await scanCard(card, maybe, deps, now, notes, skips);
      if (kept) rows.push(kept);
    }
  } finally {
    // Kept on a budget stop too, so the retry passes over what this run did.
    if (deps.skips && !deps.dryRun && JSON.stringify(skips) !== skipsAtStart) {
      await deps.skips.write(skips).catch((err: unknown) => {
        rethrowIfBudget(err);
        console.error(`[follow-through] skip marks not written: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }
  return report();
}

/**
 * One candidate card: its row, kept (or rehearsed), or null when it is passed
 * over — with a skip mark saying until when.
 */
async function scanCard(
  card: ActiveCard,
  maybe: CardCondition,
  deps: ScanDeps,
  now: number,
  notes: string[],
  skips: Record<string, number>,
): Promise<CommitmentRecord | null> {
  const id = cardFollowUpId(card.pageId, maybe, card.lastEditedAt);
  let comment: number | null = null;
  if (maybe === "stale") comment = await deps.reads.lastCommentAt(card.pageId);
  const condition = maybe === "stale" ? cardCondition(card, comment, now) : maybe;
  if (!condition) {
    // A recent comment: stale again only once it is as old as the rule.
    if (comment !== null) skips[id] = comment + STALE_AFTER_MS;
    return null;
  }
  const place = cardPlace(card, deps.config);
  if (!place) {
    notes.push(`${card.pageId}: its channel is not configured`);
    skips[id] = now + SKIP_RECHECK_MS;
    return null;
  }
  const people = await ownersOf(card, condition, deps.people);
  if (!people.length) {
    // Never a default to the lead: nobody to ask is no message.
    notes.push(`${card.pageId}: no ${condition === "unowned" ? "creator" : "Contributor"} found in Slack`);
    skips[id] = now + SKIP_RECHECK_MS;
    return null;
  }
  const row: CommitmentRecord = {
    id,
    kind: condition === "unowned" ? "card_unowned" : "card_stale",
    channel: place,
    channelKind: "public",
    threadTs: "",
    messageTs: "",
    promiserId: people[0]!,
    requesterId: null,
    deadlineAt: null,
    // Due now: the next weekday morning run posts it.
    dueAt: now,
    state: "open",
    nudges: 0,
    snoozes: 0,
    confidence: 1,
    promisedAt: card.lastEditedAt,
    detectedAt: now,
    runDate: deps.runDate,
    nudgeTs: null,
    followupTs: null,
    checkedOn: null,
    holds: 0,
    remindedOn: null,
    resolvedAt: null,
    cardId: card.pageId,
  };
  if (deps.dryRun) return row;
  // The wording first: a stop between the two leaves wording with no row,
  // which expires, never a row with no wording, which would lapse unasked.
  await deps.store.saveText(
    id,
    { what: card.title, bodies: {}, mentions: people.slice(1), card: { title: card.title, url: card.url, status: card.designStatus } },
    now + TEXT_KEEP_MS,
  );
  await deps.store.addCommitments([row]);
  return row;
}

/** The channel a card's follow-up goes to: `pickDestination` with no thread,
 *  so by its pillar. */
function cardPlace(card: Pick<ActiveCard, "url" | "title" | "pillars">, config: FollowThroughConfig): string | null {
  const destination = pickDestination({
    evidence: { channel: "", channelKind: "public", threadTs: null, messageTs: [], permalinks: [] },
    target: { url: card.url, kind: "notion", writable: true, title: card.title, pillars: card.pillars },
  });
  const place = resolveDestination(destination, config);
  return place && place.channel !== config.unoBot ? place.channel : null;
}

/** F4 asks the card's creator; F5 its Contributors, in the card's order. */
async function ownersOf(card: ActiveCard, condition: CardCondition, people: ScanDeps["people"]): Promise<string[]> {
  if (condition === "unowned") {
    const creator = card.creatorId ? await people.slackIdForNotionUser(card.creatorId) : null;
    return creator ? [creator] : [];
  }
  const ids: string[] = [];
  for (const c of card.contributors) {
    const id = await people.slackIdForName(c.name);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

// ── End of day: card to-dos (F3) ─────────────────────────────────────────────

export interface TodoDeps extends Pick<JobContext, "runDate"> {
  detector: CardTodoDetector;
  store: CommitmentStore;
  config: Pick<FollowThroughConfig, "unoBot">;
  now(): number;
  dryRun?: boolean;
}

/**
 * The card to-dos one swept thread's new messages hold, kept as F3 rows due
 * at the end of the second working day after the message. The owner is the
 * assignee the thread shows, else the thread's starter (`routeOwner`).
 *
 * @param thread - As the sweep read it: human messages, root first
 * @param since - The channel's cursor
 * @param deps - The detector, the store, the clock
 */
export async function recordThreadCardTodos(thread: SweepThread, since: string, deps: TodoDeps): Promise<CommitmentRecord[]> {
  if (thread.channel === deps.config.unoBot) return [];
  if (thread.channelKind !== "public" && thread.channelKind !== "private") return [];
  const found = await deps.detector.detect({ thread, since });
  if (!found.ok) throw new Error(`the card to-do detector did not answer (${found.error})`);
  const now = deps.now();
  const participants = [...new Set(thread.messages.map((m) => m.user))];
  const starter = thread.messages.find((m) => m.ts === thread.rootTs)?.user ?? thread.messages[0]?.user ?? "";
  const rows: CommitmentRecord[] = [];
  const texts: Record<string, CommitmentText> = {};
  for (const todo of found.todos) {
    const owner = todo.assignee ?? routeOwner({ claimedBy: null, participants, contributorIds: [], starter }).owner;
    if (!owner) continue;
    const promisedAt = Math.round(Number(todo.messageTs) * 1000);
    const id = cardTodoId(thread.channel, todo.messageTs);
    rows.push({
      id,
      kind: "card_todo",
      channel: thread.channel,
      channelKind: thread.channelKind,
      threadTs: thread.rootTs,
      messageTs: todo.messageTs,
      promiserId: owner,
      requesterId: null,
      deadlineAt: null,
      dueAt: commitmentDueAt(promisedAt, null).dueAt,
      state: "open",
      nudges: 0,
      snoozes: 0,
      confidence: todo.confidence,
      promisedAt,
      detectedAt: now,
      runDate: deps.runDate,
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    });
    texts[id] = { what: todo.what, bodies: {}, participants: participants.filter((p) => p !== owner) };
  }
  if (deps.dryRun || !rows.length) return rows;
  await keepRows(deps.store, rows, texts);
  return rows;
}

/**
 * The sweep's per-thread hook for card to-dos. A budget stop throws through;
 * any other failure is logged, and the sweep goes on.
 */
export function cardTodoThreadHook(deps: TodoDeps): (thread: SweepThread, since: string) => Promise<void> {
  return async (thread, since) => {
    try {
      const rows = await recordThreadCardTodos(thread, since, deps);
      if (rows.length) console.log(`[follow-through] ${thread.channel} ${thread.rootTs}: ${rows.length} card to-do(s)`);
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[follow-through] ${thread.channel} ${thread.rootTs}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}

/** A running note's to-dos to make a card, as its reader found them. */
export interface NoteCardTodos {
  /** The note's Notion page id and link. */
  pageId: string;
  url: string;
  /** When the meeting was — the note's date or its edit — epoch ms. */
  meetingAt: number;
  /** The note's Note Takers, as Slack ids. */
  takers: string[];
  todos: Array<{ blockId: string; assignee: string | null; what: string }>;
}

/**
 * A running note's card to-dos, kept as F3 rows. A note has no thread, so each
 * goes to #plus-design; it mentions its assignee, or the note's takers when
 * nobody was named — never the lead by default. A to-do with neither is not
 * kept.
 *
 * @param note - The note and its to-dos
 * @param deps - The store, the config, the clock
 */
export async function recordNoteCardTodos(
  note: NoteCardTodos,
  deps: Pick<TodoDeps, "store" | "now" | "dryRun" | "runDate"> & { config: FollowThroughConfig },
): Promise<CommitmentRecord[]> {
  const channel = resolveDestination({ rung: "design", channel: "plus-design" }, deps.config)?.channel;
  if (!channel || channel === deps.config.unoBot) return [];
  const now = deps.now();
  const rows: CommitmentRecord[] = [];
  const texts: Record<string, CommitmentText> = {};
  for (const todo of note.todos) {
    const people = todo.assignee ? [todo.assignee] : [...new Set(note.takers.filter(Boolean))];
    if (!people.length || !todo.what.trim()) continue;
    const id = `note:${note.pageId}:${todo.blockId}`;
    rows.push({
      id,
      kind: "card_todo",
      channel,
      channelKind: "public",
      threadTs: "",
      messageTs: "",
      promiserId: people[0]!,
      requesterId: null,
      deadlineAt: null,
      dueAt: commitmentDueAt(note.meetingAt, null).dueAt,
      state: "open",
      nudges: 0,
      snoozes: 0,
      confidence: 1,
      promisedAt: note.meetingAt,
      detectedAt: now,
      runDate: deps.runDate,
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    });
    texts[id] = { what: todo.what.trim(), bodies: {}, mentions: people.slice(1), sourceUrl: note.url };
  }
  if (deps.dryRun || !rows.length) return rows;
  await keepRows(deps.store, rows, texts);
  return rows;
}

async function keepRows(store: CommitmentStore, rows: CommitmentRecord[], texts: Record<string, CommitmentText>): Promise<void> {
  // The wording first, so a stop between never leaves a row with none. A row
  // already there keeps its wording and its reminder bodies.
  for (const row of rows) {
    if (await store.text(row.id)) continue;
    await store.saveText(row.id, texts[row.id]!, row.dueAt + TEXT_KEEP_MS);
  }
  await store.addCommitments(rows);
}

/** A team running note the capture sweep read: its entries edited since the
 *  cursor, and its Note Takers as Slack ids. */
export interface ReadNote {
  pageId: string;
  url: string;
  entries: Array<{ id: string; text: string; at: number }>;
  takers: string[];
}

/**
 * The capture sweep's per-note hook for card to-dos: the note's new entries
 * shown to the card to-do detector as one thread, each to-do kept as an F3
 * row (`recordNoteCardTodos`) naming its assignee when the name matches one
 * Slack member, else the takers. Called only for a note past the capture
 * sweep's team-note guard. A budget stop throws through; any other failure is
 * logged.
 */
export function cardTodoNoteHook(
  deps: Pick<TodoDeps, "detector" | "store" | "now" | "dryRun" | "runDate"> & {
    config: FollowThroughConfig;
    people: Pick<CardPeople, "slackIdForName">;
  },
): (note: ReadNote) => Promise<void> {
  return async (note) => {
    try {
      if (!note.entries.length) return;
      const messages: SweepMessage[] = note.entries.map((e, i) => ({ ts: `${i + 1}.000000`, user: "note", text: e.text }));
      const found = await deps.detector.detect({ thread: { channel: "notes", channelKind: "public", rootTs: messages[0]!.ts, messages }, since: "0" });
      if (!found.ok) throw new Error(`the card to-do detector did not answer (${found.error})`);
      const todos: NoteCardTodos["todos"] = [];
      for (const t of found.todos) {
        const entry = note.entries[Number(t.messageTs.split(".")[0]) - 1];
        if (!entry) continue;
        const assignee = t.assigneeName ? await deps.people.slackIdForName(t.assigneeName) : null;
        todos.push({ blockId: entry.id, assignee, what: t.what });
      }
      const meetingAt = Math.min(...note.entries.map((e) => e.at).filter(Number.isFinite));
      const rows = await recordNoteCardTodos(
        { pageId: note.pageId, url: note.url, meetingAt: Number.isFinite(meetingAt) ? meetingAt : deps.now(), takers: note.takers, todos },
        deps,
      );
      if (rows.length) console.log(`[follow-through] note ${note.pageId}: ${rows.length} card to-do(s)`);
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[follow-through] note ${note.pageId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}

// ── Morning: check, then ask ─────────────────────────────────────────────────

export interface DueDeps {
  reads: Pick<CardReads, "card" | "lastCommentAt" | "titlesMatching" | "pillarOptions" | "statusOptions">;
  people: Pick<CardPeople, "notionUserForSlack">;
  slack: {
    permalink(channel: string, ts: string): Promise<string | null>;
    post(to: { channel: string; threadTs: string | null }, message: FollowUpMessage): Promise<{ ok: boolean; ts?: string }>;
    /** Edit a posted report in place (`chat.update`). */
    edit(channel: string, ts: string, message: FollowUpMessage): Promise<void>;
  };
  /** Where each report's record is kept, and where each card's decision lands. */
  reports: ReportStore & Pick<ThreadState, "putReport">;
  /** Stage one card's proposal, as a sweep card is staged; throws when it did not. */
  stage(proposal: PendingProposal, channelKind: ChannelKind): Promise<void>;
  store: CommitmentStore;
  markThread(channel: string, thread: string): Promise<void>;
  config: FollowThroughConfig;
  dryRun?: boolean;
}

/** The morning's handler for card rows, handed to the commitment job: `due`
 *  for each row, then `flush` once, which posts what `due` held back. */
export interface CardFollowUps {
  due(c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction>;
  flush(now: number, runDate: string): Promise<CommitmentAction[]>;
  /** Rows held for `flush` and not yet posted. */
  held(): number;
  /** A stop before `flush` finished: each held row's `checkedOn` goes back to
   *  what it was, so the next run posts it rather than tomorrow's. */
  release(): Promise<void>;
}

/** One follow-up held for the morning's post: its row, its card, and the
 *  proposal its Review stages, with the card's own answers. */
interface Asked {
  c: CommitmentRecord;
  text: CommitmentText;
  people: string[];
  item: ReportItem;
  card: ProposalCard;
  choices?: ReviewChoice[];
  selects?: ProposalSelect[];
}

/** Follow-ups that go up together: one person's, in one place, one morning. */
interface Group {
  to: { channel: string; threadTs: string | null };
  channelKind: ChannelKind;
  asked: Asked[];
}

/** What the morning holds between `due` and `flush`. */
interface Morning {
  groups: Map<string, Group>;
  /** Held rows by id, with the `checkedOn` each had before. */
  held: Map<string, string | null>;
}

/**
 * The morning's card handler over these dependencies. What it holds back —
 * the morning's groups and the per-channel count — lives as long as the
 * handler: one morning job.
 */
export function cardFollowUps(deps: DueDeps): CardFollowUps {
  const morning: Morning = { groups: new Map(), held: new Map() };
  return {
    due: (c, now, runDate) => cardFollowUpDue(c, deps, now, runDate, morning),
    async flush(now, runDate) {
      const actions: CommitmentAction[] = [];
      for (const [key, group] of morning.groups) {
        actions.push(...(await postGroup(deps, group, now, runDate)));
        for (const a of group.asked) morning.held.delete(a.c.id);
        morning.groups.delete(key);
      }
      return actions;
    },
    held: () => morning.held.size,
    async release() {
      for (const [id, checkedOn] of morning.held) {
        await deps.store.update(id, { checkedOn });
        morning.held.delete(id);
      }
      morning.groups.clear();
    },
  };
}

/**
 * One due card row: settle it on its evidence, or hold it for the morning's
 * post (`flush`), beside the same person's other follow-ups in the same
 * place — one message, a carousel when there are several.
 *
 * @param c - The row
 * @param deps - Its reads, Slack, store and config
 * @param now - Now, epoch ms
 * @param runDate - The morning's date
 * @param morning - The morning's posts so far, by place and person, and the
 *   rows held for them
 */
export async function cardFollowUpDue(
  c: CommitmentRecord,
  deps: DueDeps,
  now: number,
  runDate: string,
  morning: Morning = { groups: new Map(), held: new Map() },
): Promise<CommitmentAction> {
  const kind = c.kind as CardKind;
  const { groups } = morning;
  const settle = async (patch: Parameters<CommitmentStore["update"]>[1]): Promise<void> => {
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, ...patch });
  };
  if (c.channel === deps.config.unoBot) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "refused", note: "never posted in #uno-bot" };
  }
  const text = await deps.store.text(c.id);
  if (!text) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "lapsed", note: "its wording expired" };
  }

  let evidence: "done" | "not-done";
  try {
    evidence = await checkCardEvidence(deps, c, text);
  } catch (err) {
    rethrowIfBudget(err);
    return holdCard(deps, c, now, runDate, `the Roadmap could not be read (${err instanceof Error ? err.message : String(err)})`);
  }
  if (evidence === "done") {
    await settle({ state: "auto_done", resolvedAt: now });
    return { id: c.id, action: "auto_done" };
  }
  // Answered on its last card with a "no": F3's Reject and F4's Leave it
  // drop it; F5's Still on it writes nothing and checks again three weeks
  // from that card, at most `MAX_SNOOZES` times.
  const declined = await declinedOnCard(deps, c, text);
  if (declined) {
    if (kind === "card_stale" && maySnooze(c.snoozes)) {
      await settle({ state: "snoozed", snoozes: c.snoozes + 1, dueAt: declined.postedAt + STALE_AFTER_MS });
      return { id: c.id, action: "held", note: "still on it, on its card: checked again in three weeks" };
    }
    if (kind === "card_stale") {
      await settle({ state: "lapsed", resolvedAt: now });
      return { id: c.id, action: "lapsed", note: "still on it again, past its snoozes" };
    }
    await settle({ state: "dropped", resolvedAt: now });
    return { id: c.id, action: "auto_done", note: "declined on its card" };
  }
  if (c.nudges >= 2) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "lapsed", note: "its question and follow-up are spent" };
  }

  const first = c.nudges === 0;
  const to = { channel: c.channel, threadTs: c.threadTs || c.nudgeTs || null };
  const key = `${to.channel} ${to.threadTs ?? ""} ${c.promiserId}`;
  const group = groups.get(key);
  // A card's question and a note's offer open a thread at the channel's top,
  // at most a few cards a morning; the rest wait a morning, which is no hold.
  const opened = [...groups.values()]
    .filter((g) => !g.to.threadTs && g.to.channel === c.channel)
    .reduce((n, g) => n + g.asked.filter((a) => a.c.nudges === 0).length, 0);
  if (first && !to.threadTs && opened >= MAX_CARD_POSTS_PER_CHANNEL) {
    await settle({});
    return { id: c.id, action: "held", note: "the channel's card follow-ups for this morning are posted; tomorrow" };
  }
  if (group && group.asked.length >= MAX_REPORT_ITEMS) {
    await settle({});
    return { id: c.id, action: "held", note: "this morning's card for them is full; tomorrow" };
  }
  const people = [c.promiserId, ...(text.mentions ?? [])];
  const asked = await askFor(deps, c, text, people, now);
  // Nothing to put behind Review: no card, and the row is checked again.
  if (typeof asked === "string") return holdCard(deps, c, now, runDate, asked);
  const action = first ? "nudged" : "followed-up";
  if (deps.dryRun) return { id: c.id, action, text: `${asked.item.title}: ${asked.item.body}` };
  // Checked: the row does not come back this morning; `flush` posts it.
  morning.held.set(c.id, c.checkedOn);
  await settle({});
  if (group) group.asked.push(asked);
  else groups.set(key, { to, channelKind: c.channelKind, asked: [asked] });
  return { id: c.id, action, text: `${asked.item.title}: ${asked.item.body}` };
}

/**
 * Whether the row's last card — its follow-up's, else its first ask's — was
 * declined in its Review, and when that card posted. Read only for a row
 * still waiting on that card.
 */
async function declinedOnCard(deps: Pick<DueDeps, "reports">, c: CommitmentRecord, text: CommitmentText): Promise<{ postedAt: number } | null> {
  const last = c.followupTs ?? c.nudgeTs;
  if (!text.onCard || c.state !== "nudged" || !last) return null;
  const record = await deps.reports.getReport(last).catch((err: unknown) => {
    rethrowIfBudget(err);
    return null;
  });
  const entry = record?.entries.find((e) => e.id === c.id || e.id.startsWith(`${c.id}~`));
  return entry?.state.kind === "rejected" ? { postedAt: Math.round(Number(last) * 1000) } : null;
}

/** A follow-up's card, the proposal its Review holds and its own answers; or
 *  why there is nothing to put behind Review. */
async function askFor(deps: DueDeps, c: CommitmentRecord, text: CommitmentText, people: string[], now: number): Promise<Asked | string> {
  const card = text.card ?? { title: text.what, url: "", status: null };
  switch (c.kind as CardKind) {
    case "card_todo": {
      const fromNote = !c.threadTs;
      const sourceUrl =
        text.sourceUrl ?? (fromNote ? null : await deps.slack.permalink(c.channel, c.messageTs)) ?? archiveUrl(c.channel, c.messageTs || c.threadTs);
      const drafted = await draftOperation(c, text, deps);
      return {
        c,
        text,
        people,
        item: todoItem({ id: c.id, owner: c.promiserId, what: text.what, sourceUrl, fromNote }),
        card: statedCard("file this Roadmap card", todoReviewLead(String(drafted.input.title ?? text.what)), drafted),
      };
    }
    case "card_unowned": {
      const notionUser = await deps.people.notionUserForSlack(c.promiserId);
      if (!notionUser) return "the person asked has no Notion match";
      return {
        c,
        text,
        people,
        item: unownedItem({ id: c.id, creator: c.promiserId, card }),
        card: statedCard("set this card's Contributor", unownedReviewLead(card, c.promiserId), contributorOperation(card, notionUser)),
        choices: unownedChoices(c.promiserId),
      };
    }
    case "card_stale": {
      const options = await deps.reads.statusOptions();
      const to = nextStatus(options, card.status);
      if (!to) return "the Roadmap's Design Status options could not be read";
      const drop = LIKELY_STATUSES.drop.find((o) => options.includes(o)) ?? null;
      return {
        c,
        text,
        people,
        item: staleItem({ id: c.id, people, card, to }),
        card: statedCard(`move this card to ${to}`, staleReviewLead(card, to), statusOperation(card, to)),
        choices: staleChoices(now + STALE_AFTER_MS, drop),
        selects: [{ path: "properties.Design Status", label: "Design Status", source: { database: "roadmap", property: "Design Status" } }],
      };
    }
  }
}

/** A Slack message's link, when `chat.getPermalink` gave none. */
function archiveUrl(channel: string, ts: string): string {
  return `https://slack.com/archives/${channel}/p${ts.replace(".", "")}`;
}

/** A card's proposal, in its own words: no footer, since Review is the card's
 *  only instruction. */
function statedCard(verb: string, lead: string, operation: ProposalOperation): ProposalCard {
  return { kind: "stated", verb, lead, footer: "", fields: [], caveats: [], operations: [operation] };
}

/**
 * The morning's post for one group: the parent line and a card each, posted,
 * its record kept, and each card's proposal staged. A card that showed and
 * did not stage says so, and its row comes back the next morning; a post
 * Slack refused holds every row in it.
 */
async function postGroup(deps: DueDeps, group: Group, now: number, runDate: string): Promise<CommitmentAction[]> {
  const kinds = group.asked.map((a) => a.c.kind as CardKind);
  const people = [...new Set(group.asked.flatMap((a) => a.people))];
  const first = group.asked.every((a) => a.c.nudges === 0);
  const report = decisionReport(
    group.asked.map((a) => a.item),
    followUpParent(kinds, people, first),
  );
  const sent = await deps.slack.post(group.to, { text: report.text, blocks: report.blocks });
  if (!sent.ok || !sent.ts) return Promise.all(group.asked.map((a) => holdCard(deps, a.c, now, runDate, "Slack refused the post")));
  const thread = group.to.threadTs ?? sent.ts;
  const kept = await deps.reports.putReport(reportRecord(group.to.channel, sent.ts, report, FOLLOW_THROUGH_CARD_TTL_MS)).then(
    () => true,
    (err: unknown) => {
      rethrowIfBudget(err);
      console.error(`[follow-through] ${group.to.channel} ${sent.ts}: posted, but its record was not kept: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    },
  );

  const failed: Asked[] = [];
  for (const a of group.asked) {
    try {
      if (!kept) throw new Error("its report's record was not kept");
      await deps.stage(itemProposalFor(a, group, thread, sent.ts), group.channelKind);
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[follow-through] ${a.c.id}: posted, not staged: ${err instanceof Error ? err.message : String(err)}`);
      failed.push(a);
    }
  }
  if (failed.length && kept) {
    const message = await markNotStaged(deps.reports, sent.ts, failed.map((a) => a.c.id), FOLLOW_UP_NOT_STAGED).catch(() => null);
    if (message) await deps.slack.edit(group.to.channel, sent.ts, message).catch(() => {});
  }
  await deps.markThread(group.to.channel, thread);

  const actions: CommitmentAction[] = [];
  for (const a of group.asked) {
    if (failed.includes(a)) {
      actions.push(await holdCard(deps, a.c, now, runDate, "its card did not stage"));
      continue;
    }
    const firstAsk = a.c.nudges === 0;
    await deps.store.update(a.c.id, {
      checkedOn: runDate,
      state: "nudged",
      nudges: a.c.nudges + 1,
      holds: 0,
      remindedOn: runDate,
      dueAt: endOfEtDay(addWorkingDays(etDayOf(now), CARD_REARM_WORKING_DAYS)),
      ...(firstAsk ? { nudgeTs: sent.ts } : { followupTs: sent.ts }),
    });
    await deps.store.saveText(a.c.id, { ...a.text, onCard: true }, now + TEXT_KEEP_MS);
    actions.push({ id: a.c.id, action: firstAsk ? "nudged" : "followed-up", text: report.text, ts: sent.ts });
  }
  return actions;
}

/**
 * One card's proposal as ThreadState stages it: one item of its report, in
 * the follow-up's thread, for 72 hours. No confirmer set: a card is the
 * team's, so whoever knows where it stands decides it.
 */
function itemProposalFor(a: Asked, group: Group, thread: string, messageTs: string): PendingProposal {
  const card = a.card;
  const first = card.operations[0]!;
  return {
    operations: card.operations,
    toolName: first.toolName,
    input: first.input,
    channel: group.to.channel,
    threadTs: thread,
    replyTs: thread,
    ...itemProposal(messageTs, a.item.id),
    proposalText: renderProposalCard(card).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: FOLLOW_THROUGH_CARD_TTL_MS,
    stated: FOLLOW_UP_CARD_WORDS,
    refuseRevision: FOLLOW_UP_REVISION[a.c.kind as CardKind],
    ...(a.choices ? { choices: a.choices } : {}),
    ...(a.selects ? { selects: a.selects } : {}),
  };
}

/** A follow-up card's own words at the gate. */
const FOLLOW_UP_CARD_WORDS = {
  cancelled: "Rejected, nothing written",
  expired: "That card closed after 72 h with no decision, so nothing was written.",
};

async function holdCard(deps: Pick<DueDeps, "store" | "dryRun">, c: CommitmentRecord, now: number, runDate: string, note: string): Promise<CommitmentAction> {
  const holds = c.holds + 1;
  if (holds < 3) {
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, holds });
    return { id: c.id, action: "held", note: `${note}; tried again tomorrow` };
  }
  if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, state: "lapsed", holds, resolvedAt: now });
  return { id: c.id, action: "lapsed", note: `held ${holds} mornings running (${note})` };
}

/**
 * Whether the row's own evidence settles it: a Roadmap card matching the
 * to-do; a Contributor set, or the card gone or out of an active status; a
 * card edited, moved or commented on since. Throws when the Roadmap cannot be
 * read — nothing is asked on a check that never happened.
 */
async function checkCardEvidence(deps: DueDeps, c: CommitmentRecord, text: CommitmentText): Promise<"done" | "not-done"> {
  if (c.kind === "card_todo") {
    const words = todoWords(text.what);
    if (!words.length) return "not-done";
    const titles = await deps.reads.titlesMatching(words);
    return titles.some((t) => matchesTodo(text.what, t)) ? "done" : "not-done";
  }
  const card = c.cardId ? await deps.reads.card(c.cardId) : null;
  if (!card || !isActive(card)) return "done";
  if (c.kind === "card_unowned") return card.contributors.length ? "done" : "not-done";
  // Stale: moved on means another status, an edit, or a comment since.
  if (card.designStatus !== (text.card?.status ?? card.designStatus) || card.lastEditedAt > c.promisedAt) return "done";
  const comment = await deps.reads.lastCommentAt(card.pageId);
  return comment !== null && comment > Math.max(c.promisedAt, c.detectedAt - STALE_AFTER_MS) ? "done" : "not-done";
}

// ── Answers ──────────────────────────────────────────────────────────────────

export interface AnswerDeps {
  store: CommitmentStore;
  reads: Pick<CardReads, "pillarOptions" | "statusOptions">;
  people: Pick<CardPeople, "notionUserForSlack">;
  /** Replace a posted follow-up's legend in place: no new message, no ping. */
  update(channel: string, ts: string, message: FollowUpMessage): Promise<boolean>;
  /** Post a line in a follow-up's thread. */
  post(to: { channel: string; threadTs: string }, text: string): Promise<void>;
  /** Post a proposal card in a follow-up's thread and stage it. */
  stage(proposal: CardProposal): Promise<boolean>;
  /** Mark a thread whose replies may answer a follow-up, for `ttlMs`; and ask
   *  whether one is marked — the gate on any D1 read for a reply. */
  markReplyThread(channel: string, thread: string, ttlMs: number): Promise<void>;
  isReplyThread(channel: string, thread: string): Promise<boolean>;
  config: FollowThroughConfig;
  now(): number;
}

/** A reaction or a tap on a card follow-up, in the facts the envelope has. */
export interface CardReaction {
  channel: string;
  messageTs: string;
  glyph: string;
  userId: string;
  /** A tap is a deliberate answer; a reaction may only mean "seen". */
  via?: "button" | "reaction";
}

/**
 * A reaction or a tap on a card follow-up, answered. The follow-up owns every
 * one, whether or not it changed anything: nothing on it reaches the gate.
 *
 * A tap is anyone's to give: a card is the team's, not a promise one person
 * made, so whoever knows where it stands answers, and the edit names them. A
 * reaction may be a casual "seen", so it counts only from the people asked
 * (and, for a draft, anyone who posted in the to-do's thread).
 *
 * @param c - The follow-up's row
 * @param r - The reaction or tap
 * @param deps - The store, the reads, the edit, the staging
 * @returns Why it changed nothing, or that the edit missed; nothing when it landed and shows
 */
export async function answerCardFollowUp(c: CommitmentRecord, r: CardReaction, deps: AnswerDeps): Promise<TapAnswer | void> {
  if (c.kind === "thread_promise" || c.kind === "card_unowned") return { refused: TAP_REFUSED.notAnAnswer };
  if (r.userId === deps.config.botUserId) return;
  const kind = c.kind as "card_todo" | "card_stale";
  const answer = cardAnswer(kind, r.glyph);
  if (!answer) return { refused: TAP_REFUSED.notAnAnswer };
  if (!LIVE_STATES.includes(c.state)) return { refused: TAP_REFUSED.settled };
  const text = await deps.store.text(c.id);
  // On the shared card, Review is the one answer.
  if (text?.onCard) return { refused: ANSWER_ON_CARD };
  const people = [c.promiserId, ...(text?.mentions ?? [])];
  if (r.via !== "button") {
    const allowed = answer === "draft" ? [...people, ...(text?.participants ?? [])] : people;
    if (!allowed.includes(r.userId)) return { refused: TAP_REFUSED.notYours(c.promiserId) };
  }
  if (answer === "still_on_it" && !maySnooze(c.snoozes)) return { refused: TAP_REFUSED.snoozeSpent };
  const now = deps.now();
  const thread = { channel: r.channel, channelKind: c.channelKind, threadTs: c.threadTs || c.nudgeTs || r.messageTs };
  const confirmers = [...new Set([...people, r.userId])];
  if (answer === "draft" && !text) return { refused: TAP_REFUSED.gone };

  // Two answers at once both read a live row: the claim lets one through, and
  // it comes before anything is posted or staged.
  const patch: CommitmentPatch =
    answer === "still_on_it"
      ? // Checked again in three weeks: moved by then, it settles; if not, the
        // one follow-up asks. Capped like a promise's ⏳.
        { state: "snoozed", snoozes: c.snoozes + 1, dueAt: now + STALE_AFTER_MS }
      : { state: answer === "draft" || answer === "done" ? "done" : "dropped", resolvedAt: now };
  if (!(await deps.store.claim(c.id, patch))) return { refused: TAP_REFUSED.settled };

  let staged = false;
  if (answer === "draft") {
    staged = await deps.stage({ card: await draftCard(c, text!, deps), ...thread, confirmers, slot: proposalSlotFor(c) });
    if (!staged) {
      // Nothing went up: the follow-up is live again for another try.
      await deps.store.update(c.id, { state: c.state, resolvedAt: null });
      return { refused: DRAFT_NOT_POSTED };
    }
  } else if (kind === "card_stale" && answer !== "still_on_it") {
    // Whoever answered picks where the card goes: the board's live options,
    // the likely ones for this answer first, and the pick stages the move.
    const choice = answer === "done" ? "done" : "drop";
    const options = text?.card ? orderStatusOptions(await deps.reads.statusOptions(), choice, text.card.status) : [];
    if (text?.card && options.length) {
      await deps.post(thread, statusChoiceText({ owner: r.userId, card: text.card, options }));
      await deps.store.saveText(c.id, { ...text, choosing: { answer: choice, options, staged: false, listedAt: now, reposted: false, by: r.userId } }, now + TEXT_KEEP_MS);
      await deps.markReplyThread(thread.channel, thread.threadTs, CHOICE_TTL_MS);
      staged = true;
    }
  }
  const shown = await acknowledge(deps, c, text, r, `${cardAcknowledgement(answer, staged)} ${answeredBy(r.userId)}`);
  return shown ? undefined : { unedited: true };
}

/** Replace a follow-up's buttons with its answer; false when the message
 *  still shows them. */
async function acknowledge(deps: Pick<AnswerDeps, "update">, c: CommitmentRecord, text: CommitmentText | null, r: { channel: string; messageTs: string }, ack: string): Promise<boolean> {
  const body = text?.bodies[r.messageTs];
  if (!body) {
    console.warn(`[follow-through] ${c.id}: answered, but ${r.messageTs} has no kept body to edit`);
    return false;
  }
  if (!(await deps.update(r.channel, r.messageTs, { text: body, blocks: reminderBlocks(body, ack) }))) {
    console.warn(`[follow-through] ${c.id}: answered, but ${r.messageTs} could not be edited`);
    return false;
  }
  return true;
}

/**
 * The drafted card for a to-do: one `notion_create` of a Roadmap card on the
 * PRD template, titled for the to-do and linking where it was said. The
 * `Universal` pillar is set only for a to-do from #plus-universal, and only
 * when the Roadmap offers exactly that option.
 */
export async function draftOperation(
  c: Pick<CommitmentRecord, "channel">,
  text: Pick<CommitmentText, "what" | "sourceUrl">,
  deps: { reads: Pick<CardReads, "pillarOptions">; config: Pick<FollowThroughConfig, "plusUniversal"> },
): Promise<ProposalOperation> {
  let pillar: string | undefined;
  if (c.channel === deps.config.plusUniversal) {
    pillar = (await deps.reads.pillarOptions()).find((o) => o === "Universal");
  }
  const where = text.sourceUrl ? `the running note (${text.sourceUrl})` : "a Slack thread";
  return {
    toolName: "notion_create",
    input: {
      surface: "prd",
      title: draftTitle(text.what),
      summary: `Drafted by le goat from a to-do in ${where} to create this card. Fill in the PRD sections and set the Contributor before it moves on.`,
      ...(text.sourceUrl ? { source_url: text.sourceUrl } : {}),
      ...(pillar ? { properties: { product_pillar: pillar } } : {}),
    },
  };
}

/** F5's status change. The status is exact-matched when it runs: a value the
 *  board lacks is refused, never created. */
export function statusOperation(card: { url: string }, status: string): ProposalOperation {
  return { toolName: "notion_update", input: { page_url: card.url, properties: { "Design Status": status } } };
}

/** F4's Contributor change. */
export function contributorOperation(card: { url: string }, notionUser: string): ProposalOperation {
  return { toolName: "notion_update", input: { page_url: card.url, properties: { Contributor: notionUser } } };
}

/** The drafted card for a to-do, as a follow-up posted before the shared
 *  card stages it. */
export async function draftCard(c: CommitmentRecord, text: CommitmentText, deps: Pick<AnswerDeps, "reads" | "config">): Promise<ProposalCard> {
  const operation = await draftOperation(c, text, deps);
  return {
    kind: "confirm",
    verb: "file this Roadmap card",
    lead: `Draft card for the to-do: *${escapeLead(String(operation.input.title))}*. A ✅ from the people named above, or whoever asked for it, files it. Expires in 72 h.`,
    fields: [],
    caveats: [],
    operations: [operation],
  };
}

/** F5's status change, as a follow-up posted before the shared card stages it. */
export function statusCard(card: { title: string; url: string }, status: string, answer: "done" | "drop"): ProposalCard {
  return {
    kind: "confirm",
    verb: `move this card to ${status}`,
    lead: `${answer === "done" ? "Done" : "Dropped"}: <${card.url}|${escapeLead(card.title)}> → *${escapeLead(status)}*. A ✅ applies it. Expires in 72 h.`,
    fields: [],
    caveats: [],
    operations: [statusOperation(card, status)],
  };
}

/** F4's Contributor change, as a follow-up posted before the shared card
 *  stages it. */
export function contributorCard(card: { title: string; url: string }, slackUser: string, notionUser: string): ProposalCard {
  return {
    kind: "confirm",
    verb: "set this card's Contributor",
    lead: `Contributor for <${card.url}|${escapeLead(card.title)}>: <@${slackUser}>. A ✅ applies it. Expires in 72 h.`,
    fields: [],
    caveats: [],
    operations: [contributorOperation(card, notionUser)],
  };
}

/** A reply under a card follow-up. */
export interface CardReply {
  channel: string;
  threadTs: string;
  user: string;
  text: string;
}

type ReplyDeps = Pick<AnswerDeps, "store" | "people" | "update" | "post" | "stage" | "markReplyThread" | "isReplyThread" | "config" | "now">;

/**
 * A reply under a card follow-up: F4's owner, or F5's pick of Design Status.
 * False when the thread holds neither, or the reply is not one — it then
 * takes its ordinary path. A thread with no follow-up mark costs no D1 read.
 *
 * @param reply - The reply
 * @param deps - The store, the people, the posts and the staging
 */
export async function handleCardReply(reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  if (reply.user === deps.config.botUserId) return false;
  if (!(await deps.isReplyThread(reply.channel, reply.threadTs))) return false;
  const c = await deps.store.byReminderTs(reply.threadTs);
  if (!c || c.channel !== reply.channel) return false;
  if (c.kind === "card_unowned") return ownerReply(c, reply, deps);
  if (c.kind === "card_stale") return statusReply(c, reply, deps);
  return false;
}

/**
 * `handleCardReply`, never throwing: any failure, a budget stop included, is
 * logged and read as "not a follow-up reply", so the reply takes its ordinary
 * path — the engagement check included — and never a turn it would not have
 * had.
 */
export async function handleCardReplySafely(reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  try {
    return await handleCardReply(reply, deps);
  } catch (err) {
    console.error(`[follow-through] reply ${reply.channel} ${reply.threadTs} not handled: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/** A reply that takes the card itself: "me", "mine", "I'll take it". */
const TAKES_IT = /^\s*(me|mine|i['’]?ll take it|i will take it|i can take it|i['’]?ll take this|i['’]?ll do it)\s*[.!]*\s*$/i;

/**
 * Who a reply under F4's question names: its one human mention, or the
 * replier when it takes the card itself. Null for none, several, or a
 * mention of uno-bot.
 */
export function namedOwner(text: string, replier: string, botUserId: string | null | undefined): string | null {
  const mentioned = [...new Set([...text.matchAll(/<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g)].map((m) => m[1]!))];
  // With uno-bot's own id unknown, a mention might be uno-bot's: none counts.
  if (mentioned.length && (!botUserId || mentioned.includes(botUserId))) return null;
  if (mentioned.length === 1) return mentioned[0]!;
  if (!mentioned.length && TAKES_IT.test(text)) return replier;
  return null;
}

/**
 * Under F4's question, a reply from someone it asked (the card's creator)
 * naming exactly one person stages the Contributor change. The row stays
 * live: it settles when the card shows a Contributor, so a change nobody
 * applies lets the follow-up ask again.
 */
async function ownerReply(c: CommitmentRecord, reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  const named = namedOwner(reply.text, reply.user, deps.config.botUserId);
  if (!named || !LIVE_STATES.includes(c.state)) return false;
  const text = await deps.store.text(c.id);
  if (!text?.card || text.onCard) return false;
  if (![c.promiserId, ...(text.mentions ?? [])].includes(reply.user)) return false;
  const thread = { channel: reply.channel, channelKind: c.channelKind, threadTs: reply.threadTs };
  const notionUser = await deps.people.notionUserForSlack(named);
  if (!notionUser) {
    await deps.post(thread, `I can't match <@${named}> to one Notion person, so the Contributor needs setting on the card itself.`);
    return true;
  }
  const staged = await deps.stage({
    card: contributorCard(text.card, named, notionUser),
    ...thread,
    confirmers: [...new Set([c.promiserId, ...(text.mentions ?? []), reply.user, named])],
    slot: proposalSlotFor(c),
  });
  if (!staged) return true;
  await acknowledge(deps, c, text, { channel: reply.channel, messageTs: c.nudgeTs ?? reply.threadTs }, cardAcknowledgement("owner", true));
  return true;
}

/**
 * Under F5's list, a pick stages the Design Status change — only a reply from
 * an owner or from whoever answered counts, and only while the choice is open
 * (`CHOICE_TTL_MS`).
 * A reply that is no listed option gets the options again, on one line, once;
 * after that, replies are the thread's own. The value staged is the schema's
 * own spelling, and `notion_update` exact-matches it again when it runs.
 */
async function statusReply(c: CommitmentRecord, reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  const text = await deps.store.text(c.id);
  const choosing = text?.choosing;
  if (!text?.card || text.onCard || !choosing || choosing.staged || deps.now() > choosing.listedAt + CHOICE_TTL_MS) return false;
  const owners = [c.promiserId, ...(text.mentions ?? [])];
  if (!owners.includes(reply.user) && reply.user !== choosing.by) return false;
  const thread = { channel: reply.channel, channelKind: c.channelKind, threadTs: reply.threadTs };
  const status = pickStatus(reply.text, choosing.options);
  const keep = choosing.listedAt + CHOICE_TTL_MS + TEXT_KEEP_MS;
  if (!status) {
    if (choosing.reposted) return false;
    await deps.post(thread, statusRetryText(choosing.options));
    await deps.store.saveText(c.id, { ...text, choosing: { ...choosing, reposted: true } }, keep);
    return true;
  }
  const staged = await deps.stage({
    card: statusCard(text.card, status, choosing.answer),
    ...thread,
    confirmers: [...new Set([...owners, reply.user])],
    slot: proposalSlotFor(c),
  });
  if (!staged) return true;
  await deps.store.saveText(c.id, { ...text, choosing: { ...choosing, staged: true } }, keep);
  await acknowledge(deps, c, text, { channel: reply.channel, messageTs: c.nudgeTs ?? reply.threadTs }, `${cardAcknowledgement("status", true)} ${answeredBy(choosing.by ?? reply.user)}`);
  return true;
}

/**
 * A posted follow-through card as ThreadState stages it: no Turn behind it,
 * its own slot in the thread, 72 hours, and its confirmers only.
 *
 * @param p - The card and where it went
 * @param posted - Its message's ts and text
 */
export function followThroughProposal(p: CardProposal, posted: { ts: string; text: string }): PendingProposal {
  const first = p.card.operations[0]!;
  return {
    operations: p.card.operations,
    toolName: first.toolName,
    input: first.input,
    channel: p.channel,
    threadTs: p.threadTs,
    replyTs: p.threadTs,
    userMsgTs: p.threadTs,
    proposalTs: posted.ts,
    proposalText: posted.text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: FOLLOW_THROUGH_CARD_TTL_MS,
    confirmers: [...p.confirmers],
    supersedeKey: p.slot,
  };
}

// ── Shared ───────────────────────────────────────────────────────────────────

/** Notion words on a card's lead: escaped, one line. */
function escapeLead(text: string): string {
  return escapeSlackText(text.replace(/\s+/g, " ").trim()) || "untitled";
}

function ensureHeadroom(deps: Pick<ScanDeps, "meter">, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}
