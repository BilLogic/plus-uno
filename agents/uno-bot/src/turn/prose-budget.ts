// The prose budget — how long an answer may run above a table or cards that
// already show its rows (CONTEXT.md § result table).
//
// THE RULE. With rows beneath it, the answer is the takeaway, what stands out
// and what to act on, naming at most 3 rows; the rows are the table's. Live on
// r521, and again on r524 after a fix that counted only the table's own rows,
// a pain-points answer by scenario walked every phase and scenario above its
// table in nested bullets. On r524 the cells it linked were other calls' rows,
// not the table's, so a count of the table's rows read 3 or fewer and nothing
// fired. The defect is the walk itself, so the budget measures the prose's
// own shape:
//   • LIST ITEMS: more than 3, at any depth. Three rows that stand out fit,
//     each a bullet; a fourth is a walk.
//   • LENGTH: more than 1,000 visible characters (links count as their text),
//     the draft judge's own floor (`MIN_DRAFT_CHARS`): the length below which
//     the harness already treats an answer as short enough to ship unread.
//     A takeaway, a confidence clause and 3 linked rows come to about 700.
//   • ROWS NAMED: more than 3 of the table's rows, counted by the caller
//     (`namedRows`), which catches a walk written as sentences.
// Rows beneath are a table or cards `present` attached, or a Markdown table
// the model typed into the prose itself: live on r525 it never called
// `present`, typed its own table after a 10,198-character walk, and nothing
// armed. The typed table stays; the budget is on the prose around it.
//
// A typed table and a fenced code block are not prose: they are measured
// out, so a long table or a setup script beside a table is not a walk.
//
// NO TABLE, NO BUDGET. The defect is the rows printed twice, once in the prose
// and once in the table; an answer with no table beneath it is as long as the
// question asks. A general 3,000-character cap was weighed and dropped: it
// would have cut walkthroughs asked for at length.
//
// WHAT IS DONE. Over budget, the turn asks the one judge call it already makes
// to SHORTEN the answer to the takeaway (`turn/presentation.ts`), at any
// length the judge reads and on a longer clock (`agent/draft-judge.ts`). When
// the prose that ships is still over — the judge erred, timed out or passed it
// — `withinListBudget` is the backstop: beside a table it takes the whole walk
// out, every list and the labels that only introduced it, since the table
// carries the rows; beside cards alone it keeps the first 3 top-level items.
// Nothing that is not a list item or such a label goes.
//
// PURE: no Env, no Slack shape.

/** At most this many list items beside a table or cards. */
export const MAX_LIST_ITEMS = 3;

/** At most this many visible characters beside a table or cards: the draft
 *  judge's floor. */
export const MAX_PROSE_CHARS = 1_000;

/** A line that opens a list item: a bullet or a number. */
const LIST_ITEM = /^\s*(?:[-*+•◦▪▫‣]︎?|\d+[.)])\s+/;

/** A row of a typed Markdown table: `| a | b |`. */
const TABLE_ROW = /^\s*\|.*\|\s*$/;

/** A typed table's header rule: `| --- | :-: |`. */
const TABLE_RULE = /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/;

/** A code fence. */
const FENCE = /^\s*```/;

/** A horizontal rule: `---`, `***`, `___`. */
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

const indentOf = (line: string): number => /^\s*/.exec(line)![0].length;

/** Link wrapping taken off: Slack's `<url|title>` and markdown's
 *  `[title](url)` keep the title and lose the address. */
const visible = (s: string): string =>
  s.replace(/<[^|>\s]+\|([^>]*)>/g, "$1").replace(/\[([^\]]*)\]\([^)\s]*\)/g, "$1");

/** Which lines are not prose: a fenced code block's, fences included, and a
 *  typed table's — two or more `|` rows, one of them its header rule. */
function notProse(lines: readonly string[]): boolean[] {
  const out = lines.map(() => false);
  let fenced = false;
  for (const [i, line] of lines.entries()) {
    if (FENCE.test(line)) {
      out[i] = true;
      fenced = !fenced;
    } else if (fenced) out[i] = true;
  }
  for (let i = 0; i < lines.length; i++) {
    if (out[i] || !TABLE_ROW.test(lines[i]!)) continue;
    let end = i;
    while (end < lines.length && !out[end] && TABLE_ROW.test(lines[end]!)) end++;
    if (end - i >= 2 && lines.slice(i, end).some((l) => TABLE_RULE.test(l))) for (let j = i; j < end; j++) out[j] = true;
    i = end - 1;
  }
  return out;
}

/** What the prose measures against the budget. */
export interface ProseMeasure {
  /** List items, at any depth. */
  items: number;
  /** Visible characters of prose. */
  chars: number;
  /** A Markdown table is typed into the answer. */
  typedTable: boolean;
}

/**
 * How the prose measures against the budget: a typed table and a code block
 * are not prose, and count toward neither.
 *
 * @param prose - The answer
 */
export function measureProse(prose: string): ProseMeasure {
  const lines = prose.split("\n");
  const skip = notProse(lines);
  const kept = lines.filter((_, i) => !skip[i]);
  return {
    items: kept.filter((line) => LIST_ITEM.test(line)).length,
    chars: visible(kept.join("\n")).trim().length,
    typedTable: lines.some((line, i) => skip[i] && TABLE_RULE.test(line)),
  };
}

/**
 * Whether the prose is over the budget: with rows beneath it (a table or cards
 * attached, or a typed table), more than 3 list items, more than 1,000
 * characters or more than 3 of the table's rows named. With no rows beneath
 * it, never.
 *
 * @param measure - The prose's measure
 * @param rowsBeneath - A table or cards ride beneath the answer
 * @param named - How many of the table's rows the prose names
 * @param maxNamed - At most this many may be named
 */
export function overBudget(measure: ProseMeasure, rowsBeneath: boolean, named: number, maxNamed: number): boolean {
  if (!rowsBeneath && !measure.typedTable) return false;
  return measure.items > MAX_LIST_ITEMS || measure.chars > MAX_PROSE_CHARS || named > maxNamed;
}

/** A line that introduces what follows it: a heading, a line ending in ':',
 *  or a short label with no closing full stop ("**By scenario**", "Phase:
 *  Onboarding"). */
const isLabel = (line: string): boolean => {
  const t = line.trim();
  if (!t || LIST_ITEM.test(line) || RULE.test(line)) return false;
  const bare = t.replace(/[*_]+$/, "");
  return /^#{1,6}\s/.test(t) || bare.endsWith(":") || (t.length <= 60 && !/[.!?]$/.test(bare));
};

/** What `withinListBudget` left of the prose, and how many items it took. */
export interface ItemsRemoved {
  text: string;
  removed: number;
}

/**
 * The prose with its list items past the first `maxItems` taken out: the
 * backstop for a reply still over the budget when it ships.
 *
 * BESIDE A TABLE, `maxItems` is 0 and the whole walk goes: the table carries
 * the rows. Live on r526 a keep of "the first 3" kept 3 nesting levels of one
 * phase, a fragment that read as arbitrary. BESIDE CARDS ONLY, the first 3
 * top-level items stay, each with everything nested in it.
 *
 * A list item goes with the lines indented beneath it, unless one of them is a
 * line `keep` holds (the confidence clause). A paragraph, a line that is not a
 * list item, a typed table and the clause always stay. A label that only
 * introduced what went — "Phase: Onboarding", "**Also:**", "Here is the
 * breakdown:", a heading — goes with it; a heading over a paragraph that stays
 * keeps its place. A rule left with nothing after it or beside another goes.
 * With nothing to take out, the prose stands as written; it is never swapped
 * for a takeaway.
 *
 * @param prose - The answer as it would post
 * @param keep - A line that never goes
 * @param maxItems - Top-level list items that stay: 0 beside a table
 */
export function withinListBudget(prose: string, keep: (line: string) => boolean, maxItems: number): ItemsRemoved {
  const lines = prose.split("\n");
  const skip = notProse(lines);
  const gone = new Set<number>();
  let seen = 0;
  let removed = 0;
  for (let i = 0; i < lines.length; i++) {
    if (skip[i] || !LIST_ITEM.test(lines[i]!)) continue;
    let end = i + 1;
    while (end < lines.length && lines[end]!.trim() && indentOf(lines[end]!) > indentOf(lines[i]!)) end++;
    // One top-level item, whatever is nested in it.
    if (seen++ >= maxItems && !lines.slice(i, end).some(keep)) {
      for (let j = i; j < end; j++) gone.add(j);
      removed++;
    }
    i = end - 1;
  }
  if (!removed) return { text: prose, removed: 0 };

  // Bottom-up, so a label over labels that went is decided after them.
  for (let i = lines.length - 1; i >= 0; i--) {
    if (gone.has(i) || skip[i] || !isLabel(lines[i]!) || keep(lines[i]!)) continue;
    if (introducesOnlyGone(lines, i, gone, skip, keep)) gone.add(i);
  }

  const kept = lines.filter((_, i) => !gone.has(i));
  // A rule goes when nothing but blanks and rules follow it, or another rule
  // is next: the sections it divided are gone.
  const out: string[] = [];
  for (const [i, line] of kept.entries()) {
    if (RULE.test(line)) {
      const next = kept.slice(i + 1).find((l) => l.trim());
      if (next === undefined || RULE.test(next)) continue;
    }
    if (!line.trim() && (!out.length || !out[out.length - 1]!.trim())) continue;
    out.push(line);
  }
  while (out.length && !out[out.length - 1]!.trim()) out.pop();
  return { text: out.join("\n"), removed };
}

/**
 * Whether the label at `at` introduced only what went: everything after it, up
 * to the first line that stays and is not a list item, went, and something
 * did. A list item that stays means it still introduces a list. A heading
 * whose own section goes on into a paragraph keeps its place over it; a
 * paragraph past a label that went, or the confidence clause, is not its
 * section's.
 */
function introducesOnlyGone(
  lines: readonly string[],
  at: number,
  gone: ReadonlySet<number>,
  skip: readonly boolean[],
  keep: (line: string) => boolean,
): boolean {
  const heading = /^\s*#{1,6}\s/.test(lines[at]!);
  let any = false;
  let ownSection = true;
  for (let j = at + 1; j < lines.length; j++) {
    const line = lines[j]!;
    if (!line.trim()) continue;
    if (gone.has(j)) {
      any = true;
      if (isLabel(line)) ownSection = false;
      continue;
    }
    if (!skip[j] && (LIST_ITEM.test(line) || indentOf(line) > 0)) return false;
    const paragraph = !skip[j] && !isLabel(line) && !RULE.test(line) && !keep(line);
    if (heading && ownSection && paragraph) return false;
    return any;
  }
  return any;
}
