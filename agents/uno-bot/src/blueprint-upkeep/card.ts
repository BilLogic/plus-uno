// What a blueprint revision card says: six parts, two vocabularies kept apart.
//
//   1. title       — `scenario › path` and the status change
//   2. why now     — the card's RM-ID, its status, one quoted sentence, a link
//   3. today       — the path's cells as `step (lane)` rows, with a link into
//                    the blueprint app
//   4. proposed    — each row added, changed or deprecated
//   5. confidence  — the draft's confidence, and what it could not verify
//   6. the ask     — who may approve, and what approving writes
//
// ADR-023: the why-now line speaks the Roadmap's words (`Dev Status:
// Deployed`, an RM-ID) and every other part the blueprint's (step, lane, path,
// its statuses). Frame words render as code, so neither vocabulary's word is
// read as plain English.

import { escapeSlackText } from "../slack/mrkdwn";
import type { ReportItem } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { ProposalOperation } from "../thread-state/index";
import type { Draft, DraftedChange, PathToday } from "./draft";

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

function statusChange(draft: Draft): string {
  const path = draft.revision.path;
  if (path) return `${code(path.from)} → ${code(path.to)}`;
  const to = draft.revision.rows.find((r) => r.to !== "deprecated")?.to ?? "deprecated";
  return `rows → ${code(to)}`;
}

/** Part 2, Roadmap words only. */
function whyNow(source: RevisionSource): string {
  const id = source.number !== null ? `RM-${source.number}` : esc(source.title);
  return `*Why now:* ${id} reached ${code(`${source.status.property}: ${source.status.value}`)} — “${esc(source.quote)}” <${source.url}|${esc(source.title)}>`;
}

function today(path: PathToday): string[] {
  const name = (list: Array<{ id: string; name: string }>, id: string) => list.find((x) => x.id === id)?.name ?? id;
  const rows = path.cells.map(
    (c) => `• ${esc(name(path.steps, c.stepId))} (${esc(name(path.lanes, c.laneId))}) — ${esc(c.content)} ${code(c.status)}`,
  );
  return [`*Today*${path.link ? ` · <${path.link}|open the path>` : ""}`, ...(rows.length ? rows : ["• (no cells on this path yet)"])];
}

const KIND_WORD = { added: "Added", changed: "Changed", deprecated: "Deprecated" } as const;

function proposed(draft: Draft): string[] {
  return [
    "*Proposed*",
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

function ask(draft: Draft): string {
  const to = draft.revision.rows.some((r) => r.to !== "deprecated") ? statusOf(draft) : null;
  const what = to ? `writes these rows to the blueprint as ${code(to)}` : "writes these rows to the blueprint";
  return `*The ask:* Approve ${what}, as uno-bot, all or nothing. Only the card's owner or Bill can approve; Reject writes nothing.`;
}

function statusOf(draft: Draft): string {
  return draft.revision.rows.find((r) => r.to !== "deprecated")!.to;
}

/**
 * The whole card, mrkdwn: the six parts in order.
 *
 * @param source - The shipped card
 * @param path - Today's path
 * @param draft - The drafted revision
 */
export function revisionText(source: RevisionSource, path: PathToday, draft: Draft): string {
  return [
    `*${esc(revisionTitle(path))}* · ${statusChange(draft)}`,
    whyNow(source),
    ...today(path),
    ...proposed(draft),
    ...confidence(draft),
    ask(draft),
  ].join("\n");
}

/** The item id a revision card takes in its report. */
export function revisionItemId(source: Pick<RevisionSource, "pageId">): string {
  return `rev-${source.pageId}`;
}

/**
 * The revision as one card of the morning message.
 *
 * @param source - The shipped card
 * @param path - Today's path
 * @param draft - The drafted revision
 * @param owner - The card owner's Slack id, when known
 */
export function revisionItem(source: RevisionSource, path: PathToday, draft: Draft, owner: string | null): ReportItem {
  const counts = (["added", "changed", "deprecated"] as const)
    .map((k) => [k, draft.changes.filter((c) => c.kind === k).length] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}`);
  return {
    id: revisionItemId(source),
    title: `${revisionTitle(path)} · ${draft.revision.path ? `${draft.revision.path.from} → ${draft.revision.path.to}` : "rows"}`,
    subtitle: `${source.number !== null ? `RM-${source.number}` : esc(source.title)} · ${code(`${source.status.property}: ${source.status.value}`)}`,
    ...(owner ? { owners: [{ slack: owner }] } : {}),
    body: `${counts.join(" · ")} · confidence ${draft.confidence.toFixed(1)}${draft.gaps.length ? ` · ${draft.gaps.length} to verify` : ""}`,
    open: { label: "Blueprint", url: path.link ?? source.url },
    also: { label: "Roadmap card", url: source.url },
    done: `written to the blueprint as uno-bot.`,
    detail: revisionText(source, path, draft),
  };
}

/** The card the Gate stages: stated, the whole text as its lead. */
export function revisionProposalCard(source: RevisionSource, path: PathToday, draft: Draft, operation: ProposalOperation): ProposalCard {
  return {
    kind: "stated",
    verb: "write this revision to the blueprint",
    lead: revisionText(source, path, draft),
    footer: "",
    fields: [],
    caveats: [],
    operations: [operation],
  };
}

/** The opener's words for a section's cards. */
export function revisionParent(count: number): string {
  return count === 1
    ? "Shipped work changed the service: one blueprint revision to approve."
    : `Shipped work changed the service: ${count} blueprint revisions to approve.`;
}
