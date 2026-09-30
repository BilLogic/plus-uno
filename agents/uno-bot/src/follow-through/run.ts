// Card follow-ups, end to end: scenarios F3 to F5 of the Follow through job.
//
// Each is a `commitments` row of its own kind (`../commitments/store.ts`), so
// it shares a promise's life: detected at the end of the day, nudged at the
// next weekday morning run (10 am ET), one follow-up at most, then `lapsed`,
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
//   `cardFollowUpDue` — the morning, for one due row. It looks for the
//   evidence first: a Roadmap card matching the to-do, a Contributor now set,
//   a card that moved or was commented on. Found, the row is `auto_done` and
//   nothing is sent. Otherwise the question goes up, mentioning only the
//   owner, and the one follow-up is armed a week out — so a card never gets
//   two messages in one week.
//
//   `answerCardFollowUp` — a reaction on a follow-up: F3's ✅ stages the drafted
//   card as a proposal card (its own ✅ files it) and 🙅 drops the to-do; F5's
//   🙌 and 🙅 from the owner list the card's live Design Status options, the
//   likely ones first, and ⏳ leaves the card be.
//
//   `handleCardReply` — a reply in a thread marked when an F4 question or an
//   F5 list went up (an unmarked thread costs no D1 read): under F4's
//   question, one naming exactly one person ("@Maya", or "me") stages the
//   Contributor change, and the row settles once the card shows it; under
//   F5's list, the owner's pick — a number or a name typed whole — stages the
//   Design Status change, and anything else gets the list again once and then
//   is the thread's own. `handleCardReplySafely` never throws.
//
// WHERE IT POSTS: `pickDestination`, as every proactive job. A thread's to-do
// is answered in that thread (a private channel's stays there); a card has no
// thread, so its follow-up goes to #plus-universal when its Product Pillar is
// Universal and #plus-design otherwise. Never #uno-bot, never a Notion
// comment, never the lead by default.
//
// PROPOSAL CARDS are staged the sweep's way (`stageSweepCard`, via the `stage`
// port): in the follow-up's thread, in a slot of their own per follow-up
// (`"follow-through:<row id>"`, so two drafts in one thread stand side by
// side), for 72 hours, confirmable by the owners and whoever answered. Every write waits
// for that ✅, and every select value in it is exact-matched against the
// Roadmap's own options (hard rule 4): a pillar only when the database has
// it, a status only when it is one of the board's.
//
// Every dependency is injected (tests/card-follow-through.test.ts). `Env`
// enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import { pickDestination, resolveDestination, routeOwner, type ChannelKind, type SweepMessage, type SweepThread } from "../sweep/finding";
import { escapeSlackText } from "../slack/mrkdwn";
import type { ProposalCard } from "../turn/index";
import type { PendingProposal, ProposalOperation } from "../thread-state/index";
import { reminderBlocks } from "../commitments/copy";
import { addWorkingDays, commitmentDueAt, endOfEtDay, etDayOf, TEXT_KEEP_MS } from "../commitments/due";
import type { CommitmentAction } from "../commitments/run";
import { cardTodoId, LIVE_STATES, type CommitmentRecord, type CommitmentStore, type CommitmentText } from "../commitments/store";
import {
  cardAcknowledgement,
  cardAnswer,
  cardFollowUpText,
  CARD_LEGENDS,
  draftTitle,
  staleText,
  statusChoiceText,
  statusRetryText,
  todoOfferText,
  unownedText,
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
/** How long a proposal card a follow-up stages stays confirmable. */
export const FOLLOW_THROUGH_CARD_TTL_MS = 72 * 60 * 60 * 1000;
/** The thread slot those cards hold (`PendingProposal.supersedeKey`), one per
 *  follow-up: `follow-through:<row id>`. */
export const FOLLOW_THROUGH_KEY = "follow-through";
/** How long an F4 question's thread takes replies: past its follow-up. */
export const OWNER_REPLY_TTL_MS = 21 * 24 * 60 * 60 * 1000;

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

export interface ScanDeps {
  reads: Pick<CardReads, "activeCards" | "lastCommentAt" | "botUserId">;
  people: Pick<CardPeople, "slackIdForNotionUser" | "slackIdForName">;
  store: CommitmentStore;
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
  ensureHeadroom(deps, { subrequests: 3, d1Queries: 1 });
  const { cards, truncated } = await deps.reads.activeCards();
  if (truncated) notes.push("the active cards did not fit one read; the rest wait for a later night");
  const bot = await deps.reads.botUserId();
  const maybe = cards
    .map((card) => ({ card, maybe: maybeCondition(card, now) }))
    .filter((c): c is { card: ActiveCard; maybe: CardCondition } => c.maybe !== null)
    // A card uno-bot's own integration made has no person to ask.
    .filter((c) => !(bot && c.card.creatorId === bot));
  // What every candidate last had, in one read, so a card asked about and
  // still untouched never takes a place in the night's count.
  const latest = maybe.length ? await deps.store.latestForCards(maybe.map((c) => c.card.pageId)) : {};
  const candidates = maybe
    .filter(({ card, maybe }) => {
      const last = latest[card.pageId] ?? null;
      return last?.id !== cardFollowUpId(card.pageId, maybe, card.lastEditedAt) && mayFollowUpCard(last, now);
    })
    .sort((a, b) => a.card.lastEditedAt - b.card.lastEditedAt || a.card.pageId.localeCompare(b.card.pageId));
  for (const { card, maybe } of candidates) {
    if (rows.length >= MAX_NEW_PER_NIGHT) {
      notes.push(`more than ${MAX_NEW_PER_NIGHT} cards due; the rest wait a night`);
      break;
    }
    ensureHeadroom(deps, CARD_SCAN_COST);
    const id = cardFollowUpId(card.pageId, maybe, card.lastEditedAt);
    const condition = maybe === "stale" ? cardCondition(card, await deps.reads.lastCommentAt(card.pageId), now) : maybe;
    if (!condition) continue;
    const place = cardPlace(card, deps.config);
    if (!place) {
      notes.push(`${card.pageId}: its channel is not configured`);
      continue;
    }
    const people = await ownersOf(card, condition, deps.people);
    if (!people.length) {
      // Never a default to the lead: nobody to ask is no message.
      notes.push(`${card.pageId}: no ${condition === "unowned" ? "creator" : "Contributor"} found in Slack`);
      continue;
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
      runDate: dateOf(now),
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
      cardId: card.pageId,
    };
    rows.push(row);
    if (deps.dryRun) continue;
    // The wording first: a stop between the two leaves wording with no row,
    // which expires, never a row with no wording, which would lapse unasked.
    await deps.store.saveText(
      id,
      { what: card.title, bodies: {}, mentions: people.slice(1), card: { title: card.title, url: card.url, status: card.designStatus } },
      now + TEXT_KEEP_MS,
    );
    await deps.store.addCommitments([row]);
  }
  return report();
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

export interface TodoDeps {
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
      runDate: dateOf(now),
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
  deps: Pick<TodoDeps, "store" | "now" | "dryRun"> & { config: FollowThroughConfig },
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
      runDate: dateOf(now),
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
  deps: Pick<TodoDeps, "detector" | "store" | "now" | "dryRun"> & {
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
  reads: Pick<CardReads, "card" | "lastCommentAt" | "titlesMatching">;
  slack: {
    permalink(channel: string, ts: string): Promise<string | null>;
    post(to: { channel: string; threadTs: string | null }, message: FollowUpMessage): Promise<{ ok: boolean; ts?: string }>;
  };
  store: CommitmentStore;
  markThread(channel: string, thread: string): Promise<void>;
  /** Mark a thread whose replies may answer a follow-up, for `ttlMs`. */
  markReplyThread(channel: string, thread: string, ttlMs: number): Promise<void>;
  config: FollowThroughConfig;
  dryRun?: boolean;
}

/** The morning's handler for card rows, handed to the commitment job. */
export interface CardFollowUps {
  due(c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction>;
}

/**
 * The morning's card handler over these dependencies. Its per-channel count
 * lives as long as the handler — one morning job.
 */
export function cardFollowUps(deps: DueDeps): CardFollowUps {
  const posted = new Map<string, number>();
  return { due: (c, now, runDate) => cardFollowUpDue(c, deps, now, runDate, posted) };
}

/**
 * One due card row: settle it on its evidence, or ask.
 *
 * @param c - The row
 * @param deps - Its reads, Slack, store and config
 * @param now - Now, epoch ms
 * @param runDate - The morning's date
 * @param posted - Card follow-ups posted per channel this morning
 */
export async function cardFollowUpDue(
  c: CommitmentRecord,
  deps: DueDeps,
  now: number,
  runDate: string,
  posted: Map<string, number> = new Map(),
): Promise<CommitmentAction> {
  const kind = c.kind as CardKind;
  const settle = async (patch: Parameters<CommitmentStore["update"]>[1]): Promise<void> => {
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, ...patch });
  };
  if (c.nudges >= 2) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "lapsed", note: "its question and follow-up are spent" };
  }
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

  const first = c.nudges === 0;
  const topLevel = !c.threadTs;
  // A card's question and a note's offer open a thread at the channel's top,
  // at most a few a morning; the rest wait a morning, which is no hold.
  if (first && topLevel && (posted.get(c.channel) ?? 0) >= MAX_CARD_POSTS_PER_CHANNEL) {
    await settle({});
    return { id: c.id, action: "held", note: "the channel's card follow-ups for this morning are posted; tomorrow" };
  }
  const people = [c.promiserId, ...(text.mentions ?? [])];
  const body = first ? await firstText(deps, c, text, people) : cardFollowUpText(kind, people);
  const action = first ? "nudged" : "followed-up";
  if (deps.dryRun) return { id: c.id, action, text: body };

  const to = { channel: c.channel, threadTs: topLevel ? c.nudgeTs : c.threadTs };
  const sent = await deps.slack.post(to, { text: body, blocks: reminderBlocks(body, CARD_LEGENDS[kind]) });
  if (!sent.ok || !sent.ts) return holdCard(deps, c, now, runDate, "Slack refused the post");
  if (first && topLevel) posted.set(c.channel, (posted.get(c.channel) ?? 0) + 1);
  await settle({
    state: "nudged",
    nudges: c.nudges + 1,
    holds: 0,
    remindedOn: runDate,
    dueAt: endOfEtDay(addWorkingDays(etDayOf(now), CARD_REARM_WORKING_DAYS)),
    ...(first ? { nudgeTs: sent.ts } : { followupTs: sent.ts }),
  });
  await deps.store.saveText(c.id, { ...text, bodies: { ...text.bodies, [sent.ts]: body } }, now + TEXT_KEEP_MS);
  await deps.markThread(c.channel, to.threadTs ?? sent.ts);
  // Replies under F4's question may name its owner.
  if (first && c.kind === "card_unowned") await deps.markReplyThread(c.channel, sent.ts, OWNER_REPLY_TTL_MS);
  return { id: c.id, action, text: body, ts: sent.ts };
}

async function holdCard(deps: DueDeps, c: CommitmentRecord, now: number, runDate: string, note: string): Promise<CommitmentAction> {
  const holds = c.holds + 1;
  if (holds < 3) {
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, holds });
    return { id: c.id, action: "held", note: `${note}; tried again tomorrow` };
  }
  if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, state: "lapsed", holds, resolvedAt: now });
  return { id: c.id, action: "lapsed", note: `held ${holds} mornings running (${note})` };
}

async function firstText(deps: DueDeps, c: CommitmentRecord, text: CommitmentText, people: string[]): Promise<string> {
  const card = text.card ?? { title: text.what, url: "", status: null };
  switch (c.kind as CardKind) {
    case "card_todo": {
      const fromNote = !c.threadTs;
      const sourceUrl = text.sourceUrl ?? (fromNote ? null : await deps.slack.permalink(c.channel, c.messageTs));
      return todoOfferText({ people, what: text.what, sourceUrl, fromNote });
    }
    case "card_unowned":
      return unownedText({ creator: c.promiserId, card });
    case "card_stale":
      return staleText({ people, card });
  }
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

/** A reaction on a card follow-up, in the facts the envelope has. */
export interface CardReaction {
  channel: string;
  messageTs: string;
  glyph: string;
  userId: string;
}

/**
 * A reaction on a card follow-up, answered. The follow-up owns every reaction
 * on it, whether or not one changed anything: nothing on it reaches the gate.
 *
 * @param c - The follow-up's row
 * @param r - The reaction
 * @param deps - The store, the reads, the edit, the staging
 */
export async function answerCardFollowUp(c: CommitmentRecord, r: CardReaction, deps: AnswerDeps): Promise<void> {
  if (c.kind === "thread_promise" || c.kind === "card_unowned") return;
  const kind = c.kind as "card_todo" | "card_stale";
  const answer = cardAnswer(kind, r.glyph);
  if (!answer || !LIVE_STATES.includes(c.state) || r.userId === deps.config.botUserId) return;
  const text = await deps.store.text(c.id);
  const people = [c.promiserId, ...(text?.mentions ?? [])];
  // The owners answer; the draft may also be asked for by anyone who posted
  // in the to-do's thread.
  const allowed = answer === "draft" ? [...people, ...(text?.participants ?? [])] : people;
  if (!allowed.includes(r.userId)) return;
  const now = deps.now();
  const thread = { channel: r.channel, channelKind: c.channelKind, threadTs: c.threadTs || c.nudgeTs || r.messageTs };
  const confirmers = [...new Set([...people, r.userId])];

  let staged = false;
  if (answer === "draft") {
    if (!text) return;
    staged = await deps.stage({ card: await draftCard(c, text, deps), ...thread, confirmers, slot: proposalSlotFor(c) });
    if (!staged) return;
    await deps.store.update(c.id, { state: "done", resolvedAt: now });
  } else if (answer === "still_on_it") {
    // Checked again in three weeks: moved by then, it settles; if not, the one
    // follow-up asks.
    await deps.store.update(c.id, { state: "snoozed", snoozes: c.snoozes + 1, dueAt: now + STALE_AFTER_MS });
  } else if (kind === "card_stale") {
    // The owner suggests where the card goes: the board's live options, the
    // likely ones for this answer first, and the pick stages the move.
    const choice = answer === "done" ? "done" : "drop";
    const options = text?.card ? orderStatusOptions(await deps.reads.statusOptions(), choice, text.card.status) : [];
    if (text?.card && options.length) {
      await deps.post(thread, statusChoiceText({ owner: r.userId, card: text.card, options }));
      await deps.store.saveText(c.id, { ...text, choosing: { answer: choice, options, staged: false, listedAt: now, reposted: false } }, now + TEXT_KEEP_MS);
      await deps.markReplyThread(thread.channel, thread.threadTs, CHOICE_TTL_MS);
      staged = true;
    }
    await deps.store.update(c.id, { state: answer === "done" ? "done" : "dropped", resolvedAt: now });
  } else {
    await deps.store.update(c.id, { state: "dropped", resolvedAt: now });
  }
  await acknowledge(deps, c, text, r, cardAcknowledgement(answer, staged));
}

async function acknowledge(deps: Pick<AnswerDeps, "update">, c: CommitmentRecord, text: CommitmentText | null, r: { channel: string; messageTs: string }, ack: string): Promise<void> {
  const body = text?.bodies[r.messageTs];
  if (!body) {
    console.warn(`[follow-through] ${c.id}: answered, but ${r.messageTs} has no kept body to edit`);
    return;
  }
  if (!(await deps.update(r.channel, r.messageTs, { text: body, blocks: reminderBlocks(body, ack) }))) {
    console.warn(`[follow-through] ${c.id}: answered, but ${r.messageTs} could not be edited`);
  }
}

/**
 * The drafted card for a to-do, as a proposal card: one `notion_create` of a
 * Roadmap card on the PRD template, titled for the to-do and linking where it
 * was said. The `Universal` pillar is set only for a to-do from
 * #plus-universal, and only when the Roadmap offers exactly that option.
 */
export async function draftCard(c: CommitmentRecord, text: CommitmentText, deps: Pick<AnswerDeps, "reads" | "config">): Promise<ProposalCard> {
  let pillar: string | undefined;
  if (c.channel === deps.config.plusUniversal) {
    pillar = (await deps.reads.pillarOptions()).find((o) => o === "Universal");
  }
  const title = draftTitle(text.what);
  const where = text.sourceUrl ? `the running note (${text.sourceUrl})` : "a Slack thread";
  const operation: ProposalOperation = {
    toolName: "notion_create",
    input: {
      surface: "prd",
      title,
      summary: `Drafted by uno-bot from a to-do in ${where} to create this card. Fill in the PRD sections and set the Contributor before it moves on.`,
      ...(text.sourceUrl ? { source_url: text.sourceUrl } : {}),
      ...(pillar ? { properties: { product_pillar: pillar } } : {}),
    },
  };
  return {
    kind: "confirm",
    verb: "file this Roadmap card",
    lead: `:memo: Draft card for the to-do: *${escapeLead(title)}*. A ✅ from the people named above, or whoever asked for it, files it. Expires in 72 h.`,
    fields: [],
    caveats: [],
    operations: [operation],
  };
}

/** F5's status change, as a proposal card. The status is exact-matched when
 *  it runs: a value the board lacks is refused, never created. */
export function statusCard(card: { title: string; url: string }, status: string, answer: "done" | "drop"): ProposalCard {
  return {
    kind: "confirm",
    verb: `move this card to ${status}`,
    lead: `:card_index_dividers: ${answer === "done" ? "Done" : "Dropped"}: <${card.url}|${escapeLead(card.title)}> → *${escapeLead(status)}*. A ✅ applies it. Expires in 72 h.`,
    fields: [],
    caveats: [],
    operations: [{ toolName: "notion_update", input: { page_url: card.url, properties: { "Design Status": status } } }],
  };
}

/** F4's Contributor change, as a proposal card. */
export function contributorCard(card: { title: string; url: string }, slackUser: string, notionUser: string): ProposalCard {
  return {
    kind: "confirm",
    verb: "set this card's Contributor",
    lead: `:bust_in_silhouette: Contributor for <${card.url}|${escapeLead(card.title)}>: <@${slackUser}>. A ✅ applies it. Expires in 72 h.`,
    fields: [],
    caveats: [],
    operations: [{ toolName: "notion_update", input: { page_url: card.url, properties: { Contributor: notionUser } } }],
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
 * `handleCardReply`, never throwing: any failure but a budget stop is logged
 * and read as "not a follow-up reply", so the reply takes its ordinary path —
 * the engagement check included — and never a turn it would not have had.
 */
export async function handleCardReplySafely(reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  try {
    return await handleCardReply(reply, deps);
  } catch (err) {
    rethrowIfBudget(err);
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
  if (botUserId && mentioned.includes(botUserId)) return null;
  if (mentioned.length === 1) return mentioned[0]!;
  if (!mentioned.length && TAKES_IT.test(text)) return replier;
  return null;
}

/**
 * Under F4's question, a reply naming exactly one person stages the
 * Contributor change. The row stays live: it settles when the card shows a
 * Contributor, so a change nobody applies lets the follow-up ask again.
 */
async function ownerReply(c: CommitmentRecord, reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  const named = namedOwner(reply.text, reply.user, deps.config.botUserId);
  if (!named || !LIVE_STATES.includes(c.state)) return false;
  const text = await deps.store.text(c.id);
  if (!text?.card) return false;
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
 * Under F5's list, the owner's pick stages the Design Status change — only the
 * owner's reply counts, and only while the choice is open (`CHOICE_TTL_MS`).
 * A reply that is no listed option gets the options again, on one line, once;
 * after that, replies are the thread's own. The value staged is the schema's
 * own spelling, and `notion_update` exact-matches it again when it runs.
 */
async function statusReply(c: CommitmentRecord, reply: CardReply, deps: ReplyDeps): Promise<boolean> {
  const text = await deps.store.text(c.id);
  const choosing = text?.choosing;
  if (!text?.card || !choosing || choosing.staged || deps.now() > choosing.listedAt + CHOICE_TTL_MS) return false;
  const owners = [c.promiserId, ...(text.mentions ?? [])];
  if (!owners.includes(reply.user)) return false;
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
  await acknowledge(deps, c, text, { channel: reply.channel, messageTs: c.nudgeTs ?? reply.threadTs }, cardAcknowledgement("status", true));
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

function dateOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
