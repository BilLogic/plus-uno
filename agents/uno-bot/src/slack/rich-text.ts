// mrkdwn as rich text elements: what a modal's `rich_text` line is drawn
// from when it names a person, a channel or a link, so each renders as a pill
// or a link and never as `<@U…>`.

import { clip } from "./card-block";
import { unescapeSlackText } from "./mrkdwn";

/** Slack's cap on a text element of a rich text line. */
const RICH_TEXT_CHARS = 3000;

/** A mention, a channel or a link in mrkdwn, as this file and the card write them. */
const MRKDWN_TOKEN = /<@([UW][A-Z0-9]{6,})>|<#([CG][A-Z0-9]{6,})(?:\|[^>]*)?>|<(https?:\/\/[^|>\s]+)(?:\|([^>]*))?>/g;

/** mrkdwn's entities back to the characters: rich text is read as written. */

/** A line of mrkdwn as rich text elements: each `<@U…>` a user pill, each
 *  `<#C…>` a channel pill, each `<url|text>` a link, the rest its words. */
export function richElements(mrkdwn: string): unknown[] {
  const out: unknown[] = [];
  let at = 0;
  const words = (t: string) => {
    if (t) out.push({ type: "text", text: clip(unescapeSlackText(t), RICH_TEXT_CHARS) });
  };
  for (const m of mrkdwn.matchAll(MRKDWN_TOKEN)) {
    words(mrkdwn.slice(at, m.index));
    if (m[1]) out.push({ type: "user", user_id: m[1] });
    else if (m[2]) out.push({ type: "channel", channel_id: m[2] });
    else out.push({ type: "link", url: m[3]!, ...(m[4] ? { text: unescapeSlackText(m[4]) } : {}) });
    at = m.index + m[0].length;
  }
  words(mrkdwn.slice(at));
  return out;
}

