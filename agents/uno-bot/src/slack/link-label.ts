// A link button's label: one that leaves Slack ends with " ↗", so a person
// knows the press opens a browser tab; one into Slack (a DM, a channel, a
// thread) opens in place and gets no mark. Every card that carries a `url`
// button labels it through here.

/** What a label that leaves Slack ends with. */
export const EXTERNAL_MARK = " ↗";

/** Whether a link opens outside Slack. A URL that does not parse is taken to. */
export function leavesSlack(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !(host === "slack.com" || host.endsWith(".slack.com"));
  } catch {
    return true;
  }
}

/**
 * A link button's label, marked when the link leaves Slack, never twice.
 *
 * @param label - The words on the button ("Open card", "Figma")
 * @param url - Where it goes
 */
export function linkLabel(label: string, url: string): string {
  const bare = label.replace(/\s*↗$/, "");
  return leavesSlack(url) ? `${bare}${EXTERNAL_MARK}` : bare;
}
