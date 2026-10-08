// The small words the Worker's own posts share, so every Figma message says a
// list, a date and a time window the same way (#886 § Localization notes:
// "Sep 29" dates, literal verbs). Pure: strings in, strings out.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** #886's ceiling for one post: a longer list goes in the thread. */
export const ONE_POST_CHARS = 1500;
/** What a thread reply carrying a long list is packed to. Its own ceiling:
 *  these posts are not answers, so `MAX_POST_CHARS` (the `markdown` block's
 *  size) does not govern them. */
export const THREAD_REPLY_CHARS = 3500;

/**
 * Lines as messages: as many to a message as fit in `max`, in order, none
 * split. A line longer than `max` is a message of its own.
 *
 * @param lines - The lines, in the order to post them
 * @param max - The most characters one message holds
 */
export function packLines(lines: readonly string[], max = THREAD_REPLY_CHARS): string[] {
  const messages: string[] = [];
  let current = "";
  for (const line of lines) {
    if (current && current.length + 1 + line.length > max) {
      messages.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) messages.push(current);
  return messages;
}

/**
 * The largest n in [lo, hi] that `fits`, where fitting only gets harder as n
 * grows; `lo` when none does. Each try builds a whole message, so a binary
 * search keeps a long list from being rebuilt once per name.
 *
 * @param lo - The least n worth trying
 * @param hi - The most
 * @param fits - Whether n fits
 */
export function largestFitting(lo: number, hi: number, fits: (n: number) => boolean): number {
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/**
 * Names as a sentence lists them: "Button", "Button and Badge",
 * "Button, Badge and Card".
 *
 * @param names - The names, in the order to say them
 */
export function namesInWords(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * A date as "Sep 29" — short, and read the same way in the US and the EU.
 *
 * @param isoDate - `YYYY-MM-DD`, or a full ISO timestamp (its date is used)
 */
export function shortDate(isoDate: string): string {
  const [, , month, day] = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate) ?? [];
  const m = Number(month);
  if (!m || m > 12 || !day) return isoDate;
  return `${MONTHS[m - 1]} ${Number(day)}`;
}

/**
 * How long a card stays open, as its last line says it: "72 h" up to three
 * days, then whole days ("6 days"), the way #886's cards word it.
 *
 * @param hours - The time left, in hours
 */
export function windowInWords(hours: number): string {
  if (hours > 72) {
    const days = Math.round(hours / 24);
    return `${days} days`;
  }
  return `${Math.max(1, Math.round(hours))} h`;
}
