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
import { asksUno, isOwnComment } from "../figma-ask/trigger";
import { etDayOf, etHourOn } from "../sweep/schedule";
import { escapeSlackText } from "../slack/mrkdwn";
import { resolveDestination, routeFinding, type Addressee, type ChannelIds } from "../destination/index";
import { escapeRegExp } from "../tools/slack-people";
import { commentUrl } from "./draft";
import type { FileOwner } from "./queue";
import type { CommentThread } from "./threads";
import type { Section } from "./sections";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole ET workdays a question waits before it is raised. */
export const TRIAGE_WORKDAYS = 2;
/** External subrequests a file's re-read may take: the client tries a call up to three times. */
export const REREAD_COST = 3;
/** Subrequests a DM costs: opening the conversation, and the post. */
export const DM_COST = 2;
/** How long a channel card stays on the usage record as live before it ages out. */
export const TRIAGE_CARD_TTL_MS = 72 * 60 * 60 * 1000;

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
  /** The hand-kept Figma handle → Slack id map, its handles lower-cased. */
  handles: Record<string, string>;
  /** The ladder's channel ids. */
  channels: ChannelIds;
  /** Post a top-level message: its ts, or Slack's refusal (`not_in_channel`). */
  post(channel: string, text: string): Promise<Posted>;
  /** DM a person; whether it posted. */
  dm(slackId: string, text: string): Promise<boolean>;
  /** Put a channel card on the usage record (`workerCardEvent`). Best-effort:
   *  a failed write never unsends the card. */
  recordCard(event: ProposalEvent): Promise<void>;
}

/**
 * The hand-kept Figma handle → Slack id map, from `handle=U…` pairs,
 * comma-separated. Handles are matched in any case.
 *
 * @param raw - The setting: `Sarah K=U0123ABCD,bea=U0456EFGH`
 * @throws When an entry is not `handle=<Slack id>`, or a handle appears twice
 */
export function figmaHandlesFrom(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw?.trim()) return map;
  for (const entry of raw.split(",")) {
    const m = /^\s*([^=]*\S)\s*=\s*([UW][A-Z0-9]+)\s*$/.exec(entry);
    if (!m) throw new Error(`FIGMA_HANDLE_SLACK_IDS: "${entry.trim()}" is not handle=<Slack id>`);
    const handle = m[1]!.replace(/^@/, "").toLowerCase();
    if (map[handle]) throw new Error(`FIGMA_HANDLE_SLACK_IDS: ${m[1]} appears twice`);
    map[handle] = m[2]!;
  }
  return map;
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
  raised: number;
  notes: string[];
}

/**
 * The morning's triage: each watched question that is due, re-read, and
 * raised once through the ladder.
 *
 * @param figma - Figma's comment read
 * @param ports - The triage's records and Slack
 * @param opts - The clock, the meter, and a dry run that sends and keeps nothing
 */
export async function raiseUnanswered(
  figma: Pick<FigmaClient, "comments">,
  ports: TriagePorts,
  opts: { now: number; dryRun?: boolean; meter?: { headroom(): { subrequests: number } } },
): Promise<TriageResult> {
  const result: TriageResult = { raised: 0, notes: [] };
  const left = () => opts.meter?.headroom().subrequests ?? Number.POSITIVE_INFINITY;
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
      const named = namedIn(root.message, root.user.handle, ports.handles, comments);
      if (left() < 1 + named.mapped.length * DM_COST) {
        result.notes.push("the budget left could not raise every question, so some wait for tomorrow");
        stopped = true;
        break;
      }
      if (opts.dryRun) {
        result.raised += 1;
        continue;
      }
      const sent = await raise(file, q, root, named, ports, opts.now);
      if (sent.ok) {
        await ports.raised.add(q.commentId);
        done.add(q.commentId);
        result.raised += 1;
        continue;
      }
      progressed.set(q.commentId, sent.question);
      if (sent.notIn) {
        result.notes.push(`uno-bot is not in ${sent.notIn}, so the question ${q.commentId} on ${file.fileKey} waits for the invite`);
      } else {
        result.notes.push(`the question ${q.commentId} on ${file.fileKey} did not post, so it waits for tomorrow`);
      }
    }
    if (!opts.dryRun && (done.size || progressed.size)) {
      const rest = file.questions.filter((q) => !done.has(q.commentId)).map((q) => progressed.get(q.commentId) ?? q);
      if (rest.length) await ports.watch.write({ ...file, questions: rest });
      else await ports.watch.remove(file.fileKey);
    }
    if (stopped) break;
  }
  return result;
}

/** The people a question @-names: those the map has, by Slack id, and those it does not, by handle. */
interface Named {
  mapped: Array<{ handle: string; slack: string }>;
  unmapped: string[];
}

/**
 * The people a comment @-names. A handle the map has, or a commenter's on the
 * file, is matched whole, longest first, so `@Sarah K` is one person; any
 * other `@word` is a person by that word. Never uno-bot, never the asker.
 *
 * @param message - The question
 * @param asker - Its asker's handle
 * @param handles - The Figma handle → Slack id map, lower-cased
 * @param comments - The file's comments, whose authors are known handles
 */
export function namedIn(message: string, asker: string, handles: Record<string, string>, comments: readonly FigmaComment[]): Named {
  const known = [...new Set([...Object.keys(handles), ...comments.map((c) => c.user.handle.toLowerCase())])].sort((a, b) => b.length - a.length);
  const out: Named = { mapped: [], unmapped: [] };
  const seen = new Set<string>([asker.toLowerCase()]);
  const add = (handle: string) => {
    const key = handle.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const slack = handles[key];
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

/** Send one question: a DM to each mapped person no earlier morning reached,
 *  and the channel card — unless everyone named is mapped, or it posted before.
 *  Raised (`ok`) once every one of those is reached; otherwise the question
 *  with whom it reached, to keep watching, and the channel that refused the
 *  card because uno-bot is not in it. */
async function raise(
  file: WatchedFile,
  q: WatchedQuestion,
  root: FigmaComment,
  named: Named,
  ports: TriagePorts,
  now: number,
): Promise<{ ok: true } | { ok: false; question: WatchedQuestion; notIn?: string }> {
  const link = commentUrl(file.fileKey, q.nodeId, q.commentId);
  const dmed = new Set(q.dmed ?? []);
  let sent = false;
  for (const person of named.mapped) {
    if (dmed.has(person.slack)) continue;
    if (await ports.dm(person.slack, questionDm(file, q, root.message, link))) {
      dmed.add(person.slack);
      sent = true;
    }
  }
  const reached = (carded: boolean): WatchedQuestion => ({ ...q, ...(dmed.size ? { dmed: [...dmed] } : {}), ...(carded ? { carded: true } : {}) });
  const cardDue = !(named.mapped.length && !named.unmapped.length) && !q.carded;
  if (!cardDue) return sent || q.carded || dmed.size ? { ok: true } : { ok: false, question: reached(!!q.carded) };

  const team = file.pillars.length ? null : await ports.fileTeam(file.fileKey);
  const { destination, addressee } = routeFinding({
    evidence: null,
    card: file.pillars.length ? { pillars: file.pillars, designOwner: file.owner && "slack" in file.owner ? file.owner.slack : null } : null,
    figmaFile: { team, creatorHandle: file.owner && "figma" in file.owner ? file.owner.figma : null },
  });
  const where = resolveDestination(destination, ports.channels);
  if (!where) return { ok: false, question: reached(false) };
  const card = await ports.post(where.channel, questionCard(file, q, root.message, link, addressee, named.unmapped));
  if (card.ok) {
    await ports
      .recordCard(workerCardEvent({ proposalId: card.ts, channelId: where.channel, at: now, ttlMs: TRIAGE_CARD_TTL_MS }))
      .catch((err: unknown) => {
        rethrowIfBudget(err);
        console.error(`[figma-triage] ${card.ts} posted but is not on the usage record: ${err instanceof Error ? err.message : String(err)}`);
      });
    return { ok: true };
  }
  return { ok: false, question: reached(false), ...(card.error === "not_in_channel" ? { notIn: where.channel } : {}) };
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
