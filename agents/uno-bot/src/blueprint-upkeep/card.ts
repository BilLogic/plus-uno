// What a blueprint revision card says: six parts, two vocabularies kept apart.
//
//   1. title       — `scenario › path` and the status change
//   2. why now     — the card's RM-ID, its status, one quoted sentence, a link
//   3. today       — the path's cells as `step (lane)` rows, with a link into
//                    the blueprint app
//   4. proposed    — each row added, changed, deprecated or promoted
//   5. confidence  — the draft's confidence, and what it could not verify
//   6. the ask     — who may approve, by Slack mention, and what approving writes
//
// That text is the card's thread and notification copy, and what View shows
// once the proposal is gone. The morning card itself (`revisionItem`) is
// short, and the Review pop-up draws the revision from its facts
// (`./facts.ts`, `slack/review-blueprint.ts`), never from this text.
//
// ADR-023: the why-now line speaks the Roadmap's words (`Dev Status:
// Deployed`, an RM-ID) and every other part the blueprint's (step, lane, path,
// its statuses). Frame words render as code wherever the block takes code —
// mrkdwn and rich text — so neither vocabulary's word is read as plain
// English; a card's title and body, a header, an alert and an option's
// description are plain text, and say them plain.

import { escapeSlackText } from "../slack/mrkdwn";
import type { CardOwner, ReportItem } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { ProposalOperation } from "../thread-state/index";
import type { Draft, DraftedChange, PathToday } from "./draft";
import { countsLine, countsOf, roadmapId } from "./facts";

/** The shipped card a revision came from, as the card names it. */
export interface RevisionSource {
  pageId: string;
  url: string;
  title: string;
  /** The Roadmap card's number: RM-<number>. */
  number: number | null;
  /** The Roadmap status that made it shipped, property and value. */
  status: { property: string; value: string };
  /** One sentence quoted from the card. */
  quote: string;
}

const code = (word: string) => `\`${word.replace(/`/g, "'")}\``;
const esc = escapeSlackText;
const where = (c: Pick<DraftedChange, "step" | "lane">) => `${esc(c.step)} (${esc(c.lane)})`;

/** Part 1: `scenario › path` and the status change. Plain text. */
export function revisionTitle(today: Pick<PathToday, "scenario" | "path">): string {
  return `${today.scenario} › ${today.path}`;
}

/** The status change a revision is titled by, as plain words: `from → to`,
 *  or `cells → to` for cells with no single status before. */
function change(draft: Draft): { from: string | null; to: string } {
  const row = draft.revision.rows.find((r) => r.to !== "deprecated");
  // A promotion is titled by its rows: they are what moves on.
  if (draft.promoted && row?.from) return { from: row.from, to: row.to };
  const path = draft.revision.path;
  if (path) return { from: path.from, to: path.to };
  return { from: null, to: row?.to ?? "deprecated" };
}

function statusChange(draft: Draft): string {
  const c = change(draft);
  return `${c.from ? code(c.from) : "cells"} → ${code(c.to)}`;
}

/** Part 2, Roadmap words only. */
function whyNow(source: RevisionSource): string {
  const id = source.number !== null ? `RM-${source.number}` : esc(source.title);
  const quote = source.quote.trim() ? ` — “${esc(source.quote)}”` : "";
  return `*Why now:* ${id} reached ${code(`${source.status.property}: ${source.status.value}`)}${quote} <${source.url}|${esc(source.title)}>`;
}

function today(path: PathToday): string[] {
  const name = (list: Array<{ id: string; name: string }>, id: string) => list.find((x) => x.id === id)?.name ?? id;
  const rows = path.cells.map(
    (c) => `• ${esc(name(path.steps, c.stepId))} (${esc(name(path.lanes, c.laneId))}) — ${esc(c.content)} ${code(c.status)}`,
  );
  return [`*Today*${path.link ? ` · <${path.link}|open the path>` : ""}`, ...(rows.length ? rows : ["• (no cells on this path yet)"])];
}

const KIND_WORD = { added: "Added", changed: "Changed", deprecated: "Deprecated", promoted: "Promoted" } as const;

function proposed(draft: Draft): string[] {
  const path = draft.revision.path;
  return [
    "*Proposed*",
    ...(draft.note ? [draft.note] : []),
    ...(draft.retires && path ? [`• The path: ${code(path.from)} → ${code(path.to)}`] : []),
    ...draft.changes.map((c) =>
      c.kind === "changed"
        ? `• ${KIND_WORD[c.kind]} ${where(c)}: ${esc(c.before ?? "")} → ${esc(c.content)}`
        : `• ${KIND_WORD[c.kind]} ${where(c)}: ${esc(c.content)}`,
    ),
  ];
}

function confidence(draft: Draft): string[] {
  return [
    `*Confidence:* ${draft.confidence.toFixed(1)}${draft.tierNote ? ` · ${draft.tierNote}` : ""}`,
    ...(draft.gaps.length ? [`*Could not verify:* ${draft.gaps.map(esc).join("; ")}`] : []),
  ];
}

/** The people who may approve, as Slack mentions: `<@A> or <@B>`. */
function approvers(confirmers: readonly string[]): string {
  const who = confirmers.map((c) => `<@${c}>`);
  return who.length <= 1 ? (who[0] ?? "nobody") : `${who.slice(0, -1).join(", ")} or ${who[who.length - 1]}`;
}

function ask(draft: Draft, confirmers: readonly string[]): string {
  const path = draft.revision.path;
  const who = `Only ${approvers(confirmers)} can approve; Reject writes nothing.`;
  if (!draft.revision.rows.length && path) {
    return `*The ask:* Approve sets this path to ${code(path.to)} on the blueprint, as uno-bot; no cell is written. ${who}`;
  }
  const to = draft.revision.rows.some((r) => r.to !== "deprecated") ? statusOf(draft) : null;
  const what = to ? `writes these cells to the blueprint as ${code(to)}` : "writes these cells to the blueprint";
  return `*The ask:* Approve ${what}, as uno-bot, all or nothing. ${who}`;
}

function statusOf(draft: Draft): string {
  return draft.revision.rows.find((r) => r.to !== "deprecated")!.to;
}

/**
 * The whole revision, mrkdwn: the six parts in order.
 *
 * @param source - The shipped card
 * @param path - Today's path
 * @param draft - The drafted revision
 * @param confirmers - Who may approve it: the card's owner and the lead
 */
export function revisionText(source: RevisionSource, path: PathToday, draft: Draft, confirmers: readonly string[]): string {
  return [
    `*${esc(revisionTitle(path))}* · ${statusChange(draft)}`,
    whyNow(source),
    ...today(path),
    ...proposed(draft),
    ...confidence(draft),
    ask(draft, confirmers),
  ].join("\n");
}

/** The item id a revision card takes in its report: one per card and path. */
export function revisionItemId(source: Pick<RevisionSource, "pageId">, path: Pick<PathToday, "pathId">): string {
  return `rev-${source.pageId}-${path.pathId}`;
}

/** Whether the shipping moment is the design hand-off rather than the deploy. */
const handedOff = (source: Pick<RevisionSource, "status">) => source.status.property === "Design Status";

/** The moment, as the card says it: "deployed", "handed off". */
function moment(source: Pick<RevisionSource, "status">): string {
  return handedOff(source) ? "handed off" : "deployed";
}

/** What changes and how much, plain, for a card's body: "2 added, 1
 *  changed, 1 deprecated · 2 questions." A retirement says so. */
export function revisionBody(draft: Draft): string {
  const counts = countsOf(draft.changes);
  const what = draft.retires
    ? `Retires the path and its ${counts.deprecated} ${counts.deprecated === 1 ? "row" : "rows"}`
    : countsLine(counts) || "The path's status only";
  const asks = draft.gaps.length ? ` · ${draft.gaps.length} ${draft.gaps.length === 1 ? "question" : "questions"}` : "";
  return `${what}${asks}.`;
}

/**
 * The revision as one card of the morning message (§ A1): `scenario › path`
 * as its title; the RM-ID, the moment and the status written in its
 * subtitle, after its owners' tags; what changes in its body; View slice
 * and the RM-ID as its buttons.
 *
 * @param source - The shipped card
 * @param path - Today's path
 * @param draft - The drafted revision
 * @param people - The Roadmap card's Contributors and who may approve
 * @param view - Where View slice opens; today's path when absent
 */
export function revisionItem(
  source: RevisionSource,
  path: PathToday,
  draft: Draft,
  people: { owners: readonly CardOwner[]; confirmers: readonly string[] },
  view?: string,
): ReportItem {
  const c = change(draft);
  const status = c.from ? `${code(c.from)} → ${code(c.to)}` : code(c.to);
  const rm = roadmapId(source);
  return {
    id: revisionItemId(source, path),
    title: revisionTitle(path),
    subtitle: `${source.number !== null ? code(rm) : esc(rm)} ${moment(source)} · ${status}`,
    ...(people.owners.length ? { owners: [...people.owners] } : {}),
    body: revisionBody(draft),
    open: { label: "View slice", url: view ?? path.link ?? source.url },
    also: { label: source.number !== null ? rm : "Roadmap card", url: source.url },
    done: draft.retires ? `${path.path} set to deprecated.` : `${countsLine(countsOf(draft.changes)) || "the path's status"}.`,
    detail: revisionText(source, path, draft, people.confirmers),
  };
}

/** The card the Gate stages: stated, the whole text as its lead. */
export function revisionProposalCard(
  source: RevisionSource,
  path: PathToday,
  draft: Draft,
  confirmers: readonly string[],
  operation: ProposalOperation,
): ProposalCard {
  return {
    kind: "stated",
    verb: "write this revision to the blueprint",
    lead: revisionText(source, path, draft, confirmers),
    footer: "",
    fields: [],
    caveats: [],
    operations: [operation],
  };
}

/**
 * What the opener says of a person's revision cards, where Slack notifies:
 * "`RM-2567` is deployed: 1 blueprint `path` to revise." Several cards name
 * each RM-ID once; a mix of moments reads "shipped".
 *
 * @param sources - Each card's shipped Roadmap card, one per path
 */
export function revisionSays(sources: ReadonlyArray<Pick<RevisionSource, "pageId" | "number" | "title" | "status">>): string {
  const cards = [...new Map(sources.map((s) => [s.pageId, s])).values()];
  const ids = cards.map((s) => (s.number !== null ? code(roadmapId(s)) : esc(s.title)));
  const named = ids.length <= 1 ? (ids[0] ?? "Shipped work") : `${ids.slice(0, -1).join(", ")} and ${ids.at(-1)!}`;
  const moments = new Set(cards.map(moment));
  const verb = moments.size > 1 ? "shipped" : `${cards.length > 1 ? "are" : "is"} ${[...moments][0] ?? "deployed"}`;
  const n = sources.length;
  return `${named} ${verb}: ${n} blueprint ${code("path")}${n === 1 ? "" : "s"} to revise.`;
}

/** One card's gaps, as the thread's ask names them. */
export interface GapAsk {
  label: string;
  gaps: string[];
  /** Who is asked: the Roadmap card's first Contributor in Slack, else the lead. */
  who: string | null;
}

/**
 * The thread's ask about what the drafts could not verify: one line per card
 * with gaps, naming its path and tagging the person who can answer it. Null
 * when no card has any.
 *
 * @param asks - Each card's gaps
 */
export function gapAskText(asks: readonly GapAsk[]): string | null {
  const lines = asks
    .filter((a) => a.gaps.length)
    .map(
      (a) =>
        `${a.who ? `<@${a.who}> ` : ""}On *${esc(a.label)}*, I couldn't verify: ${a.gaps.map(esc).join("; ")}. Answer in Needs changes on its Review, or reply here naming the path, and I'll redraft it.`,
    );
  return lines.length ? lines.join("\n") : null;
}
