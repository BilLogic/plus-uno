// The relayed DM, rendered.
//
// A relayed DM is a Slack DM to a named person, sent on a requester's behalf
// once the card is approved (CONTEXT.md). What the recipient reads is the
// message the requester approved, between two lines the WORKER adds: who asked
// for it, and the link back to where they asked. Both are written here and not
// by the model, so a model that forgets them cannot send an anonymous DM or one
// with no way back to its context.
//
// Split out of relay-dm.ts so the shape is testable on its own, the way
// share-out-render.ts is: the executor reaches Slack, and the shape is the part
// a recipient reads.
//
// Import-free. Turn reads `relayRecipientId` to put the recipient on the card
// as a mention, and the proposal card reads it to group a multi-recipient plan
// by person, so it has to be reachable from modules that carry no `Env`.

/** What the recipient's DM is built from. */
export interface RelayedDm {
  /** The Slack user who asked for the relay. */
  requesterId: string;
  /** The approved message, verbatim. */
  text: string;
  /** The requesting message's permalink, as `chat.getPermalink` returned it —
   *  null when Slack returned none, which drops the line rather than inventing
   *  a URL. */
  permalink: string | null;
  /** The request came from the requester's own DM with the bot. */
  originIsDm: boolean;
}

/**
 * The DM text: attribution, the approved message, the link back.
 *
 * A request made in the requester's own DM with the bot still links there —
 * it is their record of what was sent — but that link opens for them alone, so
 * the line says so instead of inviting the recipient to follow it.
 */
export function renderRelayedDm(dm: RelayedDm): string {
  const lines = [`<@${dm.requesterId}> asked me to pass this on:`, "", dm.text.trim()];
  if (dm.permalink) {
    lines.push(
      "",
      dm.originIsDm
        ? `_Asked in <@${dm.requesterId}>'s DM with me — <${dm.permalink}|the request> is in their DM, so only they can open it._`
        : `_Where this came from: <${dm.permalink}|the thread>._`,
    );
  }
  return lines.join("\n");
}

/** A Slack user id — `U…` or, on Enterprise Grid, `W…`. */
const USER_ID_RE = /^[UW][A-Z0-9]{2,}$/;

/**
 * The recipient as a bare user id, from a bare id or an `<@U…>` mention — or
 * null for anything else, a name above all. A name is the model's to resolve
 * with the profile and member reads, and to ask about when it matches more than
 * one person; guessing here would put a DM in the wrong inbox.
 */
export function relayRecipientId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  const mention = raw.match(/^<@([^>|]+)(?:\|[^>]*)?>$/);
  const id = mention ? mention[1]!.trim() : raw;
  return USER_ID_RE.test(id) ? id : null;
}

/**
 * A Slack refusal, as the cause a person can act on and the next route.
 *
 * The codes are the ones `conversations.open` and `chat.postMessage` answer a
 * relay with. There is no allowlist in front of the relay — the Gate decides
 * who is appropriate — so a recipient Slack cannot DM is found here, at
 * execution, and has to be said plainly.
 */
export function relayFailure(error: string): { cause: string; next: string } {
  switch (error) {
    case "user_disabled":
    case "account_inactive":
      return {
        cause: "that account is deactivated",
        next: "pick someone else to send it to, or tell me who took over their work",
      };
    case "cannot_dm_bot":
      return {
        cause: "that's a bot user, and bots can't be DM'd",
        next: "point me at the person who owns it instead",
      };
    case "user_not_found":
    case "user_not_visible":
      return {
        cause: "Slack doesn't know that user from here",
        next: "tell me who you meant again and I'll look them up fresh",
      };
    case "channel_not_found":
      return {
        cause: "Slack wouldn't open a DM with them — usually a Slack Connect or guest account that doesn't take DMs from this app",
        next: "I can @-mention them in a thread they're in instead",
      };
    default:
      return {
        cause: `Slack answered \`${error}\``,
        next: "try again in a moment, or I can @-mention them in a thread instead",
      };
  }
}
