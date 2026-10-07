// Which of a lookup's links may ride on its task card.
//
// A card is posted into a thread, and a link on it is a link everyone in that
// thread can follow. So a source passes only where its readers could already
// open it — tested positively, by estate, with the default being DROP:
//
//   - Notion, GitHub, Figma, and the blueprint and Storybook we host, pass.
//     Each sits behind its own sign-in, so a link shows a reader nothing their
//     own account would not, and those are the estates uno-bot cites anyway.
//   - A Slack permalink passes only when the search that found it says its
//     whole result was something the thread may see: `slack_search`'s own
//     `visibility` field, read as written. A public-only search passes. A
//     requester-own search runs only in the asker's own DM with the bot, so its
//     one reader is the person whose visibility it is. A workspace-filtered
//     search mixes public channels with allowlisted private ones and does not
//     say which hit is which, so none of its links pass. A permalink from any
//     other tool carries no visibility at all and does not pass either.
//   - A direct or group message never passes, whatever the search could see:
//     a relayed DM lives in one, and a checklist is not where it gets shown.
//   - Everything else — an arbitrary web page a `source_read` fetched — is not
//     an estate this filter can vouch for, so it stays in the answer, where the
//     model decides whether to cite it.
//
// Slack-specific on purpose, and the reason it lives here and not beside the
// readouts that produce the sources (`agent/progress-readout.ts`).

import type { ProgressSource } from "../agent/progress-readout";

/** A source as a card carries it — the link and its name, nothing about who
 *  could see it, because only visible ones get this far. */
export interface CardSource {
  text: string;
  url: string;
}

/** The hosts whose links pass, each matched as the host or a subdomain of it. */
const SHARED_HOSTS = ["notion.so", "notion.site", "github.com", "githubusercontent.com", "figma.com"];

/** Our own estates on the Netlify site, by path: other paths there are
 *  prototypes and previews, not a source an answer rests on. */
const OWN_SITE = "plus-uno.netlify.app";
const OWN_PATHS = ["/blueprint", "/storybook"];

/** The `slack_search` visibilities whose links the thread may see. */
const THREAD_VISIBLE = ["public-only", "requester-own"];

const isHost = (host: string, domain: string): boolean => host === domain || host.endsWith(`.${domain}`);

function passes(source: ProgressSource): boolean {
  let url: URL;
  try {
    url = new URL(source.url);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  if (SHARED_HOSTS.some((d) => isHost(host, d))) return true;
  if (host === OWN_SITE) return OWN_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
  if (isHost(host, "slack.com")) {
    const conversation = url.pathname.match(/^\/archives\/([A-Z0-9]+)/)?.[1] ?? "";
    // D… is a direct message; G… a group DM or a legacy private channel.
    if (!conversation.startsWith("C")) return false;
    return THREAD_VISIBLE.some((v) => source.visibility?.startsWith(v));
  }
  return false;
}

/**
 * The sources a card may carry, in the order the lookup read them.
 *
 * @param sources - What the tool's readout pulled from its result
 */
export function threadVisibleSources(sources: readonly ProgressSource[]): CardSource[] {
  return sources.filter(passes).map(({ text, url }) => ({ text, url }));
}
