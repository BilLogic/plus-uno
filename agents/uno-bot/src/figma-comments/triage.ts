// Figma comment triage: a question nobody answered, raised once after two
// workdays. The rule — what is watched, when it is raised, where it goes and
// whom it names — is the figma-comments scheduled action's
// (`agents/uno-bot/scheduled-actions/figma-comments/ACTION.md`); this file is
// its code.
//
// PURE: every dependency arrives through `TriagePorts`.

import { rethrowIfBudget } from "../net";
import { workerCardEvent, type ProposalEvent } from "../usage/proposal-events";
import type { FigmaClient, FigmaComment } from "../figma/client";
import { slackPersonOfFigma, type FigmaPeople } from "../usage/roles";
import { asksUno, isOwnComment } from "../figma-ask/trigger";
import { etDayOf, etHourOn } from "../sweep/schedule";
import { escapeSlackText } from "../slack/mrkdwn";
import { resolveDestination, routeFinding, teamNamed, type Addressee, type ChannelIds } from "../destination/index";
import { escapeRegExp } from "../tools/slack-people";
import { commentUrl } from "./draft";
import { itemProposalKey } from "../slack/decision-cards";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import type { FileOwner } from "./queue";
import type { CommentThread } from "./threads";
import type { Section } from "./sections";
import { cardTtlMs } from "../card-expiry";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole ET workdays a question waits before it is raised. */
export const TRIAGE_WORKDAYS = 2;
/** External subrequests a file's re-read may take: the client tries a call up to three times. */
export const REREAD_COST = 3;
/** Subrequests a DM costs: opening the conversation, and the post. */
export const DM_COST = 2;

/** A post's answer: its ts, or Slack's error code when it was refused. */
export type Posted = { ok: true; ts: string } | { ok: false; error?: string };

/** One open question, as the night read it. */
export interface WatchedQuestion {
  /** The root comment: the thread's identity. */
  commentId: string;
  nodeId: string;
  /** Who asked: their Figma handle. */
  by: string;
  createdAt: string;
  section: Section;
  page: string;
  /** The Slack ids an earlier morning's DM reached for it: never DMed again. */
  dmed?: string[];
  /** Whether an earlier morning's channel card posted: never posted again. */
  carded?: boolean;
}

/** A file's open questions, and what the ladder reads about it. */
export interface WatchedFile {
  fileKey: string;
  title: string;
  url: string;
  /** The Product Pillar values of the cards its title names; empty for none. */
  pillars: string[];
  owner: FileOwner | null;
  questions: WatchedQuestion[];
}

/** What the triage reaches its records and Slack through. */
export interface TriagePorts {
  watch: {
    list(): Promise<WatchedFile[]>;
    read(fileKey: string): Promise<WatchedFile | null>;
    write(file: WatchedFile): Promise<void>;
    remove(fileKey: string): Promise<void>;
  };
  raised: {
    has(commentId: string): Promise<boolean>;
    add(commentId: string): Promise<void>;
  };
  /** The Figma file's team, as `FIGMA_TEAM_IDS` names it; null when unknown. */
  fileTeam(fileKey: string): Promise<string | null>;
  /** The Team Members Figma map: Figma user id → Slack id. */
  people(): Promise<FigmaPeople>;
  /** The ladder's channel ids. */
  channels: ChannelIds;
  /** DM a person; whether it posted. */
  dm(slackId: string, text: string): Promise<boolean>;
  /** Put a channel card on the usage record (`workerCardEvent`). Best-effort:
   *  a failed write never unsends the card. */
  recordCard(event: ProposalEvent): Promise<void>;
}

/**
 * Whether a thread the night read is an open question: its root read whole,
 * unresolved, not uno-bot's, not an @uno ask, asking something, and with no
 * reply from anyone but its asker.
 *
 * @param t - A thread under Specs or For Review
 */
export function isOpenQuestion(t: Pick<CommentThread, "root" | "rootRead" | "replies">): boolean {
  const { root } = t;
  if (!t.rootRead || root.resolved_at || isOwnComment(root.message) || asksUno(root.message)) return false;
  if (!root.message.includes("?")) return false;
  return !t.replies.some((r) => answers(r, root));
}

/** Whether a reply answers its root: someone other than the asker wrote it. */
function answers(reply: FigmaComment, root: FigmaComment): boolean {
  return reply.user.id !== root.user.id;
}

/**
 * When a question asked at `asked` is due: the same time of day once
 * `TRIAGE_WORKDAYS` whole ET workdays have passed after its own day — a
 * weekend day never counts, and a question asked at the weekend counts from
 * Monday.
 *
 * @param asked - Epoch ms
 */
export function dueAt(asked: number): number {
  let day = etDayOf(asked);
  let counted = 0;
  while (counted < TRIAGE_WORKDAYS + 1) {
    day += DAY_MS;
    if (isWorkday(day)) counted += 1;
  }
  // The next workday after the two, from its ET midnight: its morning run raises it.
  return etHourOn(day, 0);
}

function isWorkday(day: number): boolean {
  const weekday = new Date(day).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

/**
 * Keep a file's open questions for the morning that raises them, beside any
 * already kept. A question raised before is never kept again.
 *
 * @param ports - The triage's records
 * @param file - The file, its ladder facts and tonight's open questions
 */
export async function keepOpenQuestions(ports: TriagePorts, file: WatchedFile): Promise<void> {
  const fresh: WatchedQuestion[] = [];
  for (const q of file.questions) if (!(await ports.raised.has(q.commentId))) fresh.push(q);
  if (!fresh.length) return;
  const older = await ports.watch.read(file.fileKey);
  const kept = new Map((older?.questions ?? []).map((q) => [q.commentId, q]));
  // Tonight's read replaces what a question says, never whom a morning already reached.
  const merged = fresh.map((q) => {
    const was = kept.get(q.commentId);
    return was ? { ...q, ...(was.dmed ? { dmed: was.dmed } : {}), ...(was.carded ? { carded: true } : {}) } : q;
  });
  const ids = new Set(fresh.map((q) => q.commentId));
  await ports.watch.write({ ...file, questions: [...(older?.questions ?? []).filter((q) => !ids.has(q.commentId)), ...merged] });
}

/** What a morning's triage did. */
export interface TriageResult {
  /** Questions raised this morning, or — their channel line handed to the
   *  sweep's post — on their way to it. */
  raised: number;
  notes: string[];
}

/** One question's line on its place's morning message. */
export interface HandedQuestion {
  fileKey: string;
  commentId: string;
  /** The line, whole: whom it is for, the question and its link. */
  line: string;
  /** Whether every DM it owes has gone: then the line going up raises it. */
  dmedAll: boolean;
}

/** What the triage leaves for a place's morning message. */
export interface QuestionsHanded {
  questions: HandedQuestion[];
}

/** The section's name on the sweep's morning post. */
export const QUESTIONS_SECTION = "figma-questions";

/**
 * The morning's triage: each watched question that is due, re-read, its DMs
 * sent, and its channel line handed to the sweep's message for the place the
 * ladder names (`questionsSection`), so the channel gets one message a
 * morning. A question is raised once every DM it owes has gone and its line,
 * if it owes one, is up.
 *
 * @param figma - Figma's comment read
 * @param ports - The triage's records and Slack
 * @param opts - The clock, the meter, the morning's hand-off and date, and a
 *   dry run that sends and keeps nothing
 */
export async function handOverUnanswered(
  figma: Pick<FigmaClient, "comments">,
  ports: TriagePorts,
  opts: { now: number; date: string; handOff?: SectionHandOff<QuestionsHanded>; dryRun?: boolean; meter?: { headroom(): { subrequests: number } } },
): Promise<TriageResult> {
  const result: TriageResult = { raised: 0, notes: [] };
  const left = () => opts.meter?.headroom().subrequests ?? Number.POSITIVE_INFINITY;
  const byPlace = new Map<string, HandedQuestion[]>();
  let people: FigmaPeople | null = null;
  for (const file of await ports.watch.list()) {
    const due = file.questions.filter((q) => dueAt(Date.parse(q.createdAt)) <= opts.now);
    if (!due.length) continue;
    if (left() < REREAD_COST + 1) {
      result.notes.push("the budget left could not re-read every file, so some questions wait for tomorrow");
      break;
    }
    let comments: FigmaComment[];
    try {
      comments = (await figma.comments(file.fileKey)).comments ?? [];
    } catch (err) {
      rethrowIfBudget(err);
      result.notes.push(`${file.fileKey}'s comments could not be read (${err instanceof Error ? err.message : String(err)}), so its questions wait`);
      continue;
    }
    const done = new Set<string>();
    const progressed = new Map<string, WatchedQuestion>();
    let stopped = false;
    for (const q of due) {
      const root = comments.find((c) => c.id === q.commentId && !c.parent_id);
      const answered = !root || !!root.resolved_at || comments.some((c) => c.parent_id === q.commentId && answers(c, root));
      if (answered || (await ports.raised.has(q.commentId))) {
        done.add(q.commentId);
        continue;
      }
      people ??= await ports.people();
      const named = namedIn(root.message, root.user.handle, people, comments);
      if (left() < named.mapped.length * DM_COST) {
        result.notes.push("the budget left could not raise every question, so some wait for tomorrow");
        stopped = true;
        break;
      }
      if (opts.dryRun) {
        result.raised += 1;
        continue;
      }
      const sent = await send(file, q, root, named, ports);
      if (sent.raised) {
        await ports.raised.add(q.commentId);
        done.add(q.commentId);
        result.raised += 1;
        continue;
      }
      progressed.set(q.commentId, sent.question);
      if (sent.line && opts.handOff) {
        byPlace.set(sent.line.channel, [...(byPlace.get(sent.line.channel) ?? []), sent.line.question]);
        result.raised += 1;
      } else if (sent.line) {
        result.notes.push(`the question ${q.commentId} on ${file.fileKey} has no morning message to go on, so it waits`);
      } else if (sent.unplaced) {
        result.notes.push(`the channel the posting ladder names for ${file.fileKey} is not configured, so the question ${q.commentId} waits`);
      } else {
        result.notes.push(`the question ${q.commentId} on ${file.fileKey} did not reach everyone it is for, so the rest wait for tomorrow`);
      }
    }
    if (!opts.dryRun && (done.size || progressed.size)) {
      const rest = file.questions.filter((q) => !done.has(q.commentId)).map((q) => progressed.get(q.commentId) ?? q);
      if (rest.length) await ports.watch.write({ ...file, questions: rest });
      else await ports.watch.remove(file.fileKey);
    }
    if (stopped) break;
  }
  if (opts.handOff) for (const [channel, questions] of byPlace) await opts.handOff.put(opts.date, { channel, threadTs: null }, { questions });
  return result;
}

/**
 * The unanswered questions as a section of the sweep's morning message: a
 * line each, with no card. Once the message is up, each line goes on the
 * usage record as a Worker-staged card, and its question is marked carded —
 * and raised, when every DM it owed has gone. A message that does not go up
 * leaves each question watched, so the next morning hands it over again.
 *
 * @param ports - The triage's records and the usage record
 * @param handOff - The morning run's hand-off
 * @param date - The morning's date
 * @param now - The clock
 */
export function questionsSection(ports: TriagePorts, handOff: SectionHandOff<QuestionsHanded>, date: string, now: () => number): SweepSection {
  return handedSection<QuestionsHanded>({
    source: QUESTIONS_SECTION,
    date,
    handOff,
    cardsOf(value) {
      return {
        cards: [],
        lines: value.questions.map((q) => q.line),
        // Each line's usage row, and its question's record.
        cost: () => ({ subrequests: 0, d1Queries: value.questions.length }),
        says: () => "",
      };
    },
    async posted(value, place, _shown, report, progress) {
      for (const q of value.questions) {
        if (progress.done.has(q.commentId)) continue;
        await ports
          .recordCard(workerCardEvent({ proposalId: itemProposalKey(report.ts, `question-${q.commentId}`), channelId: place.channel, at: now(), ttlMs: cardTtlMs(now()) }))
          .catch((err: unknown) => {
            rethrowIfBudget(err);
            console.error(`[figma-triage] ${q.commentId} went up but is not on the usage record: ${err instanceof Error ? err.message : String(err)}`);
          });
        const file = await ports.watch.read(q.fileKey);
        if (q.dmedAll) {
          await ports.raised.add(q.commentId);
          if (file) {
            const rest = file.questions.filter((w) => w.commentId !== q.commentId);
            if (rest.length) await ports.watch.write({ ...file, questions: rest });
            else await ports.watch.remove(file.fileKey);
          }
        } else if (file) {
          await ports.watch.write({ ...file, questions: file.questions.map((w) => (w.commentId === q.commentId ? { ...w, carded: true } : w)) });
        }
        await progress.mark(q.commentId, true);
      }
    },
    async notPosted(_value, _place, why) {
      // Every question is still watched, its line not marked: the next morning hands it over again.
      console.error(`[figma-triage] the morning message did not carry the questions (${why}) — kept for tomorrow`);
    },
  });
}

/** The people a question @-names: those the Team Members map has, by Slack id, and those it does not, by handle. */
interface Named {
  mapped: Array<{ handle: string; slack: string }>;
  unmapped: string[];
}

/**
 * The people a comment @-names. A commenter's handle on the file is matched
 * whole, longest first, so `@Sarah K` is one person, and reaches Slack through
 * that commenter's Figma user id in the Team Members map; any other `@word`
 * is a person by that word, unmapped. A handle two commenters' ids share maps
 * to nobody. Never uno-bot, never the asker.
 *
 * @param message - The question
 * @param asker - Its asker's handle
 * @param people - The Team Members Figma map: Figma user id → Slack id
 * @param comments - The file's comments, each carrying its author's id and handle
 */
export function namedIn(message: string, asker: string, people: FigmaPeople, comments: readonly FigmaComment[]): Named {
  const ids = new Map<string, string | null>();
  for (const { user } of comments) {
    const key = user.handle.toLowerCase();
    const id = ids.get(key);
    ids.set(key, id === undefined || id === user.id ? user.id : null);
  }
  const known = [...ids.keys()].sort((a, b) => b.length - a.length);
  const out: Named = { mapped: [], unmapped: [] };
  const seen = new Set<string>([asker.toLowerCase()]);
  const add = (handle: string) => {
    const key = handle.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const slack = slackPersonOfFigma(ids.get(key), people);
    if (slack) out.mapped.push({ handle, slack });
    else out.unmapped.push(handle);
  };
  let rest = message;
  for (const handle of known) {
    const pattern = new RegExp(`(?<![\\w.@])@(${escapeRegExp(handle)})(?![\\w-])`, "giu");
    rest = rest.replace(pattern, (_all, spelled: string) => {
      add(spelled);
      return " ";
    });
  }
  for (const m of rest.matchAll(/(?<![\w.@])@([\p{L}\p{N}_][\p{L}\p{N}_.-]*)/gu)) {
    const handle = m[1]!.replace(/[.-]+$/, "");
    if (!asksUno(`@${handle}`)) add(handle);
  }
  return out;
}

/** Send what one question owes this morning: a DM to each mapped person no
 *  earlier morning reached, and — unless everyone named is mapped, or its line
 *  went up before — its channel line, for the place the ladder names. Raised
 *  at once when it owes no line and every DM has gone; otherwise the question
 *  with whom it reached, to keep watching, and its line to hand over. */
async function send(
  file: WatchedFile,
  q: WatchedQuestion,
  root: FigmaComment,
  named: Named,
  ports: TriagePorts,
): Promise<{ raised: true } | { raised: false; question: WatchedQuestion; line?: { channel: string; question: HandedQuestion }; unplaced?: true }> {
  const link = commentUrl(file.fileKey, q.nodeId, q.commentId);
  const dmed = new Set(q.dmed ?? []);
  for (const person of named.mapped) {
    if (dmed.has(person.slack)) continue;
    if (await ports.dm(person.slack, questionDm(file, q, root.message, link))) dmed.add(person.slack);
  }
  // A person whose DM failed stays owed it: the next morning tries them alone.
  const allDmed = named.mapped.every((p) => dmed.has(p.slack));
  const question: WatchedQuestion = { ...q, ...(dmed.size ? { dmed: [...dmed] } : {}) };
  const cardDue = !(named.mapped.length && !named.unmapped.length) && !q.carded;
  if (!cardDue) return allDmed ? { raised: true } : { raised: false, question };

  // The file's team is read only when no card pillar has a channel: then it decides.
  const team = file.pillars.some((p) => teamNamed(p)) ? null : await ports.fileTeam(file.fileKey);
  const { destination, addressee } = routeFinding({
    evidence: null,
    card: file.pillars.length ? { pillars: file.pillars, designOwner: file.owner && "slack" in file.owner ? file.owner.slack : null } : null,
    figmaFile: { team, creatorHandle: file.owner && "figma" in file.owner ? file.owner.figma : null },
  });
  const where = resolveDestination(destination, ports.channels);
  if (!where) return { raised: false, question, unplaced: true };
  return {
    raised: false,
    question,
    line: {
      channel: where.channel,
      question: { fileKey: file.fileKey, commentId: q.commentId, line: questionCard(file, q, root.message, link, addressee, named.unmapped), dmedAll: allDmed },
    },
  };
}

/** The channel card: whom it is for, the file, the question, its asker and place, anyone unmapped, and the link. */
export function questionCard(
  file: Pick<WatchedFile, "title" | "url">,
  q: Pick<WatchedQuestion, "by" | "section" | "page">,
  message: string,
  link: string,
  addressee: Addressee | null,
  unmapped: readonly string[],
): string {
  const to = addressee ? ("slack" in addressee ? `<@${addressee.slack}>, a` : `${escapeSlackText(addressee.figma)}, a`) : "A";
  const names = unmapped.length ? ` It names ${listOf(unmapped.map(escapeSlackText))}, who ${unmapped.length === 1 ? "isn't" : "aren't"} matched to a Slack account yet.` : "";
  return `${to} question in ${fileLink(file)} has waited two workdays with no answer: “${quote(message)}” — ${escapeSlackText(q.by)}, ${place(q)}.${names} <${link}|Open comment>`;
}

/** The DM to a person the question names. */
export function questionDm(file: Pick<WatchedFile, "title" | "url">, q: Pick<WatchedQuestion, "by" | "section" | "page">, message: string, link: string): string {
  return `${escapeSlackText(q.by)} asked you a question in ${fileLink(file)} two workdays ago, and nobody has answered: “${quote(message)}” — ${place(q)}. <${link}|Open comment>`;
}

function fileLink(file: Pick<WatchedFile, "title" | "url">): string {
  return `<${file.url}|${escapeSlackText(file.title)}>`;
}

function place(q: Pick<WatchedQuestion, "section" | "page">): string {
  return `${q.section} › ${escapeSlackText(q.page)}`;
}

/** The question on one short line. */
function quote(message: string): string {
  const line = message.replace(/\s+/g, " ").trim();
  return escapeSlackText(line.length > 200 ? `${line.slice(0, 199)}…` : line);
}

function listOf(items: readonly string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
