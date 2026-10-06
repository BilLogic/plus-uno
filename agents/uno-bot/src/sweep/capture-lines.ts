// What a sweep card says about the Capture items beyond thread drift: an
// undocumented answer it adds (C3), a decision a running note or a card
// recorded (C4), and a page nobody linked that a search found.
//
// `./cards.ts` asks here first and keeps its own wording for a plain thread
// drift on a linked page, so the two kinds read the same way on one card.
// Every Notion-sourced string is escaped (`escapeSlackText`) before it is set
// in a link label or a quote.
//
// PURE: no `Env`, no Slack call.

import { escapeSlackText } from "../slack/mrkdwn";
import type { PendingFinding } from "./store";

const QUOTE_CHARS = 200;

/** What a search-found page's line says, so a confirmer can reject it. */
export const FOUND_BY_SEARCH = "found by search — reply `drop N` if it's the wrong page";

/**
 * What an added answer writes: its line, under a new heading when it opens a
 * section.
 *
 * @param item - The finding
 */
export function addedContent(item: Pick<PendingFinding, "add" | "replacement">): string {
  const heading = item.add?.newSection?.trim();
  return heading ? `## ${heading}\n${item.replacement}` : item.replacement;
}

/**
 * The card's lead sentence, after the sweep's mark, when its items are not
 * all thread drift; null to keep the drift wording.
 *
 * @param items - The card's findings
 */
export function captureLead(items: readonly PendingFinding[]): string | null {
  const n = items.length;
  const records = items.filter((f) => f.evidence.record).length;
  const adds = items.filter((f) => f.add).length;
  if (records === n) {
    return `running notes and card comments recorded ${n === 1 ? "a decision" : `${n} decisions`} that a page still states the old way.`;
  }
  if (adds === n) return `this thread answered ${n === 1 ? "something" : `${n} things`} that no page has written down yet.`;
  if (adds) return `this thread settled or answered ${n} things a page doesn't say yet.`;
  return null;
}

/** The clause every sweep card's confirm line ends with: the deployment's
 *  standing confirmers (`STANDING_CONFIRMER_IDS`) may resolve it too. Plain
 *  words, never a mention, so a card pings nobody it does not name. */
export const STANDING_TOO = " The team's standing confirmers can too.";

/** Who may confirm, when the card holds only notes and cards — there is no
 *  thread whose posters count. Null keeps the thread wording. */
export function captureConfirmers(items: readonly PendingFinding[]): string | null {
  return items.every((f) => f.evidence.record)
    ? `The owners named above and the note takers can confirm.${STANDING_TOO}`
    : null;
}

/**
 * One item's lines, or null to keep the drift wording (a thread drift on a
 * page the thread linked).
 *
 * @param item - The finding
 * @param i - Its 0-based place on the card
 * @param change - What its replace changes, before → after, as the card shows it
 */
export function captureItemLines(
  item: PendingFinding,
  i: number,
  change: { before: string; after: string },
): string[] | null {
  const { target, evidence } = item;
  if (!item.add && !evidence.record && target.foundBy !== "search") return null;
  // Slack's own `<url|label>`, as the drift lines link: a `]` in a title
  // cannot break it, and the escaped label pings nobody.
  const page = `<${target.url}|${escapeSlackText(flat(target.title) || "untitled")}>`;
  const searched = target.foundBy === "search" ? ` _(${FOUND_BY_SEARCH})_` : "";
  const where = evidence.permalinks[0] ? ` ([where](${evidence.permalinks[0]}))` : "";

  if (item.add) {
    const place = item.add.section
      ? `add under ${page} › *${escapeSlackText(flat(item.add.section))}*`
      : `add a new section *${escapeSlackText(flat(item.add.newSection ?? ""))}* to ${page}`;
    return [
      `${i + 1}. <@${item.owner}> · ${place}${searched}`,
      `   - thread answered: “${quote(item.threadSays)}”${where}`,
      `   - adds: “${escapeSlackText(flat(item.replacement))}”`,
    ];
  }

  const record = evidence.record;
  const said = record
    ? `   - ${record.kind} says: “${quote(item.threadSays)}” (<${recordLink(record.url, record.entryIds[0])}|${record.kind}>)`
    : `   - thread says: “${quote(item.threadSays)}”${where}`;
  return [
    `${i + 1}. <@${item.owner}> · ${page}${searched}`,
    `   - page says: “${quote(item.sourceSays)}”`,
    said,
    `   - change: “${escapeSlackText(change.before)}” → “${escapeSlackText(change.after)}”`,
  ];
}

/** A note's link to the block that records it; a card comment's, to the card. */
function recordLink(url: string, entryId: string | undefined): string {
  if (!entryId || entryId.startsWith("comment:")) return url;
  return `${url.split("#")[0]}#${entryId.replace(/-/g, "")}`;
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function quote(text: string): string {
  const line = flat(text);
  return escapeSlackText(line.length > QUOTE_CHARS ? `${line.slice(0, QUOTE_CHARS - 1)}…` : line);
}
