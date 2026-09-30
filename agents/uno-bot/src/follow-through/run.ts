// Card follow-ups, end to end: scenarios F3 to F5 of the Follow through job.
//
// Each is a `commitments` row of its own kind (`../commitments/store.ts`), so
// it shares a promise's life: detected at the end of the day, nudged at the
// next weekday morning run (10 am ET), one follow-up at most, then `lapsed`,
// and at most `MAX_REMINDERS_PER_PERSON` reminders a person a morning, counted
// across promises and cards alike. The commitment job schedules them and
// hands each to this module (`CardFollowUps`).
//
// FIVE ENTRY POINTS:
//
//   `runCardFollowThroughScan` — the end-of-day `card-follow-through` job. It
//   reads the Roadmap's active cards in one query and keeps a row for each
//   that is F4's (no Contributor, a week untouched) or F5's (three weeks
//   untouched and uncommented) — at most `MAX_NEW_PER_NIGHT` a night, and never
//   a card that had a message in the past week (`mayFollowUpCard`).
//
//   `cardTodoThreadHook` — the sweep's per-thread hook, beside commitment
//   reminders': a thread's to-do to make a card becomes an F3 row, due two
//   working days on. `recordNoteCardTodos` keeps a running note's to-dos the
//   same way, for the note reader to hand them to.
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
//   `handleCardReply` — a reply under a follow-up: under F4's question, one
//   naming someone ("@Maya") stages the Contributor change; under F5's list,
//   the owner's pick — a number or a name typed whole — stages the Design
//   Status change, and anything else gets the list again and stages nothing.
//
// WHERE IT POSTS: `pickDestination`, as every proactive job. A thread's to-do
// is answered in that thread (a private channel's stays there); a card has no
// thread, so its follow-up goes to #plus-universal when its Product Pillar is
// Universal and #plus-design otherwise. Never #uno-bot, never a Notion
// comment, never the lead by default.
//
// PROPOSAL CARDS are staged the sweep's way (`stageSweepCard`, via the `stage`
// port): in the follow-up's thread, in their own `"follow-through"` slot, for
// 72 hours, confirmable by the owners and whoever answered. Every write waits
// for that ✅, and every select value in it is exact-matched against the
// Roadmap's own options (hard rule 4): a pillar only when the database has
// it, a status only when it is one of the board's.
//
// Every dependency is injected (tests/card-follow-through.test.ts). `Env`
// enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import type { ScheduledJob } from "../scheduled/runs";
import { pickDestination, resolveDestination, routeOwner, type SweepThread } from "../sweep/finding";
import { escapeSlackText } from "../slack/mrkdwn";
import type { ProposalCard } from "../turn/index";
import type { PendingProposal, ProposalOperation } from "../thread-state/index";
import { reminderBlocks } from "../commitments/copy";
import { addWorkingDays, commitmentDueAt, endOfEtDay, etDayOf } from "../commitments/due";
import { TEXT_KEEP_MS, type CommitmentAction } from "../commitments/run";
import { LIVE_STATES, type CommitmentRecord, type CommitmentStore, type CommitmentText } from "../commitments/store";
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
/** The thread slot those cards hold (`PendingProposal.supersedeKey`). */
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
  threadTs: string;
  confirmers: string[];
}

export interface FollowUpMessage {
  text: string;
  blocks: unknown[];
}

// ── End of day: the Roadmap scan (F4, F5) ───────────────────────────────────

export interface ScanDeps {
  reads: Pick<CardReads, "activeCards" | "lastCommentAt">;
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
  ensureHeadroom(deps, { subrequests: 2, d1Queries: 1 });
  const { cards, truncated } = await deps.reads.activeCards();
  if (truncated) notes.push("the active cards did not fit one read; the rest wait for a later night");
  const candidates = cards
    .map((card) => ({ card, maybe: maybeCondition(card, now) }))
    .filter((c): c is { card: ActiveCard; maybe: CardCondition } => c.maybe !== null)
    .sort((a, b) => a.card.lastEditedAt - b.card.lastEditedAt || a.card.pageId.localeCompare(b.card.pageId));
  for (const { card, maybe } of candidates) {
    if (rows.length >= MAX_NEW_PER_NIGHT) {
      notes.push(`more than ${MAX_NEW_PER_NIGHT} cards due; the rest wait a night`);
      break;
    }
    ensureHeadroom(deps, CARD_SCAN_COST);
    const id = cardFollowUpId(card.pageId, maybe, card.lastEditedAt);
    const latest = await deps.store.latestForCard(card.pageId);
    if (latest?.id === id || !mayFollowUpCard(latest, now)) continue;
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
    await deps.store.addCommitments([row]);
    await deps.store.saveText(
      id,
      { what: card.title, bodies: {}, mentions: people.slice(1), card: { title: card.title, url: card.url, status: card.designStatus } },
      now + TEXT_KEEP_MS,
    );
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
    const id = `${thread.channel}:${todo.messageTs}:card`;
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
    texts[id] = { what: todo.what, bodies: {} };
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
  await store.addCommitments(rows);
  for (const row of rows) {
    // A row already there keeps its wording and its reminder bodies.
    if (await store.text(row.id)) continue;
    await store.saveText(row.id, texts[row.id]!, row.dueAt + TEXT_KEEP_MS);
  }
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
  // Drafting writes nothing, so anyone may ask for the draft; every other
  // answer is its owners'.
  if (answer !== "draft" && !people.includes(r.userId)) return;
  const now = deps.now();
  const thread = { channel: r.channel, threadTs: c.threadTs || c.nudgeTs || r.messageTs };
  const confirmers = [...new Set([...people, r.userId])];

  let staged = false;
  if (answer === "draft") {
    if (!text) return;
    staged = await deps.stage({ card: await draftCard(c, text, deps), ...thread, confirmers });
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
      await deps.store.saveText(c.id, { ...text, choosing: { answer: choice, options, staged: false } }, now + TEXT_KEEP_MS);
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

/**
 * A reply under a card follow-up: F4's owner, or F5's pick of Design Status.
 * False when the thread holds neither, or the reply is not one — it then
 * takes its ordinary path.
 *
 * @param reply - The reply
 * @param deps - The store, the people, the posts and the staging
 */
export async function handleCardReply(
  reply: CardReply,
  deps: Pick<AnswerDeps, "store" | "people" | "update" | "post" | "stage" | "config" | "now">,
): Promise<boolean> {
  if (reply.user === deps.config.botUserId) return false;
  const c = await deps.store.byReminderTs(reply.threadTs);
  if (!c || c.channel !== reply.channel) return false;
  if (c.kind === "card_unowned") return ownerReply(c, reply, deps);
  if (c.kind === "card_stale") return statusReply(c, reply, deps);
  return false;
}

/** Under F4's question, a reply naming someone stages the Contributor change. */
async function ownerReply(
  c: CommitmentRecord,
  reply: CardReply,
  deps: Pick<AnswerDeps, "store" | "people" | "update" | "post" | "stage" | "config" | "now">,
): Promise<boolean> {
  const named = [...reply.text.matchAll(/<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g)]
    .map((m) => m[1]!)
    .find((id) => id !== deps.config.botUserId);
  if (!named || !LIVE_STATES.includes(c.state)) return false;
  const text = await deps.store.text(c.id);
  if (!text?.card) return false;
  const thread = { channel: reply.channel, threadTs: reply.threadTs };
  const notionUser = await deps.people.notionUserForSlack(named);
  if (!notionUser) {
    await deps.post(thread, `I can't match <@${named}> to one Notion person, so the Contributor needs setting on the card itself.`);
    return true;
  }
  const staged = await deps.stage({
    card: contributorCard(text.card, named, notionUser),
    ...thread,
    confirmers: [...new Set([c.promiserId, ...(text.mentions ?? []), reply.user, named])],
  });
  if (!staged) return true;
  await deps.store.update(c.id, { state: "done", resolvedAt: deps.now() });
  await acknowledge(deps, c, text, { channel: reply.channel, messageTs: c.nudgeTs ?? reply.threadTs }, cardAcknowledgement("owner", true));
  return true;
}

/**
 * Under F5's list, the owner's pick stages the Design Status change — only the
 * owner's reply counts. A reply that is no listed option gets the options
 * again, on one line, and stages nothing. The value staged is the schema's
 * own spelling, and `notion_update` exact-matches it again when it runs.
 */
async function statusReply(
  c: CommitmentRecord,
  reply: CardReply,
  deps: Pick<AnswerDeps, "store" | "post" | "stage" | "update" | "now">,
): Promise<boolean> {
  const text = await deps.store.text(c.id);
  const choosing = text?.choosing;
  if (!text?.card || !choosing || choosing.staged) return false;
  const owners = [c.promiserId, ...(text.mentions ?? [])];
  if (!owners.includes(reply.user)) return false;
  const thread = { channel: reply.channel, threadTs: reply.threadTs };
  const status = pickStatus(reply.text, choosing.options);
  if (!status) {
    await deps.post(thread, statusRetryText(choosing.options));
    return true;
  }
  const staged = await deps.stage({
    card: statusCard(text.card, status, choosing.answer),
    ...thread,
    confirmers: [...new Set([...owners, reply.user])],
  });
  if (!staged) return true;
  await deps.store.saveText(c.id, { ...text, choosing: { ...choosing, staged: true } }, deps.now() + TEXT_KEEP_MS);
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
    supersedeKey: FOLLOW_THROUGH_KEY,
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
