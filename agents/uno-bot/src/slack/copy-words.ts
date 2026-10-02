// The small words the Worker's own posts share, so every Figma message says a
// list, a date and a time window the same way (#886 § Localization notes:
// "Sep 29" dates, literal verbs). Pure: strings in, strings out.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

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
