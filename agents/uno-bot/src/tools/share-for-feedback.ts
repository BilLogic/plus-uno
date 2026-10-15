// share_for_feedback executor (D5 shareout — distinct from marketplace registration).
// Wire name: the tool is registered and proposed as `shareout_post`.
// Posts a "sharing this for feedback" message to #plus-design-feedback, or in
// the asking conversation when the asker keeps it there (`place: "here"`) or
// that channel isn't configured, or in a channel the asker names
// (`place: "channel"`): what's being shared, a link
// back, a feedback prompt, and @-mentioned reviewers. This is the uno-publish
// shareout ritual — NOT marketplace registration (manual today; see #173).
// Side effect: it pings people, so it routes through the confirmation gate.
//
// A share-out asked for in a test channel (`TEST_CHANNEL_IDS`) is test traffic,
// by the usage record's rule: it posts in that channel's thread, never in the
// team channel (`teamPostChannel`) or a channel the asker named.
//
// A NAMED CHANNEL IS CHECKED, in code, before a card is staged (preflight) and
// again at ✅ (this executor), by one decision, `decideShareoutPlace`:
//   • the asker is in the channel, so nobody pings a channel they are not in;
//   • the bot can post there. The bot holds `chat:write.public`, so a public
//     channel needs no invite; a private one needs the bot in it, and Slack
//     shows the bot no private channel it is not in, so that one reads as
//     "add me to it".
// What it reads, and the cost: a channel by id is one `conversations.info`; a
// `#name` is looked for among the bot's own channels (`users.conversations`,
// two pages at most), then among the public ones (`conversations.list`, four
// at most) — why, at `shareoutReadsFor`; the asker's membership is one page of
// `conversations.members` (three at most, via `slack/channel-members.ts`). So
// 2 subrequests usually and 9 at worst, read once per turn — the preflight and
// the card share them — and again at ✅. A turn whose budget no longer covers
// the worst case refuses instead of reading (`ShareoutReads.affordable`).

import type { Env } from "../types";
import type { SlackContext } from "../types";
import { botConversations, conversationsInfo, conversationsList, postMessage, type SlackChannelPage, type SlackConversation } from "../slack/api";
import { channelMembers, MEMBER_PAGES } from "../slack/channel-members";
import { budgetHeadroom } from "../net";
import { DM_CONVERSATION } from "../thread-state/index";
import { isTestOrigin, teamPostChannel, testChannelIdsOf } from "../usage/record";
import { channelRefText, fieldsFromInput, renderShareout, shareoutChannelRef, type ShareoutChannelRef } from "./share-out-render";

/** Where a share-out posts: the channel, the thread when it stays in the asking
 *  one, and how the result and the card name the place. */
export interface ShareoutPlace {
  channel: string;
  threadTs?: string;
  where: string;
}

/**
 * Where a share-out posts: #plus-design-feedback, top level — unless the asker
 * kept it in the conversation (`place: "here"`), it was asked for in a test
 * channel, or that channel is not set, when it stays where it was asked: the
 * asking thread, or the DM. A channel the asker named is
 * `decideShareoutPlace`'s, which reads Slack.
 *
 * The card names the place from this same decision (`turn/env-deps.ts`
 * `cardReadsFor` § `shareoutWhere`), so a ✅ posts where the card said.
 *
 * @param env - `PLUS_DESIGN_FEEDBACK_CHANNEL_ID` and `TEST_CHANNEL_IDS`
 * @param slack - Where it was asked
 * @param place - The tool's `place` input: `"here"` keeps it in the
 *                conversation; anything else means the feedback channel
 */
export function shareoutPlace(
  env: Pick<Env, "PLUS_DESIGN_FEEDBACK_CHANNEL_ID" | "TEST_CHANNEL_IDS">,
  slack: Pick<SlackContext, "channel" | "threadTs" | "replyTs">,
  place?: unknown,
): ShareoutPlace {
  const feedback = place === "here" ? undefined : env.PLUS_DESIGN_FEEDBACK_CHANNEL_ID?.trim();
  const target = feedback ? teamPostChannel({ origin: "slack", channel: slack.channel, testChannelIds: testChannelIdsOf(env) }, feedback) : null;
  if (target && target === feedback) return { channel: target, where: "#plus-design-feedback" };
  // A threadless DM's conversation key is not a ts Slack accepts: reply under
  // the real one when there is one, and top level otherwise.
  const thread = slack.replyTs ?? (slack.threadTs && slack.threadTs !== DM_CONVERSATION ? slack.threadTs : undefined);
  return {
    channel: slack.channel,
    ...(thread ? { threadTs: thread } : {}),
    where: slack.channel.startsWith("D") ? "this DM" : "this thread",
  };
}

/** A channel as the bot sees it. `kind: "dm"` is a DM or group DM, which is
 *  not a place to share out to. */
export interface ShareoutChannel {
  id: string;
  name: string;
  kind: "channel" | "dm";
  isPrivate: boolean;
  isArchived: boolean;
  botIsMember: boolean;
}

/** A lookup's answer: the channel; `"missing"` when Slack shows the bot none
 *  by that id or name; `"unfinished"` when a name was not on the pages read
 *  but the lists ran on past them; `"failed"` when Slack could not be read —
 *  an error or a rate limit. */
export type ChannelLookup = ShareoutChannel | "missing" | "unfinished" | "failed";

/** What a share-out to a named channel reads of Slack. */
export interface ShareoutReads {
  /** Whether the turn's subrequest budget still covers checking `ref`: free
   *  when it was read already, a whole check otherwise. */
  affordable(ref: ShareoutChannelRef): boolean;
  channelById(id: string): Promise<ChannelLookup>;
  channelByName(name: string): Promise<ChannelLookup>;
  /** The channel's member ids, or null when Slack would not say. */
  members(channel: string): Promise<readonly string[] | null>;
}

/** Pages of the bot's own channels a `#name` is looked for in. */
const BOT_CHANNEL_PAGES = 2;
/** Pages of public channels a `#name` is looked for in after them. */
const PUBLIC_CHANNEL_PAGES = 4;
/** Channels asked for per page: Slack documents the limit as under 1000. */
const CHANNEL_PAGE_LIMIT = 999;

/** The most subrequests one named-channel decision spends: the pages of both
 *  channel lists and the pages of members. */
export const SHAREOUT_CHANNEL_CHECK_COST = BOT_CHANNEL_PAGES + PUBLIC_CHANNEL_PAGES + MEMBER_PAGES;

function channelOf(c: SlackConversation): ShareoutChannel | null {
  if (!c.id) return null;
  return {
    id: c.id,
    name: c.name ?? "",
    kind: c.is_im || c.is_mpim ? "dm" : "channel",
    isPrivate: c.is_private === true,
    isArchived: c.is_archived === true,
    botIsMember: c.is_member === true,
  };
}

/**
 * The Slack reads, on the bot token, each made once for the life of this
 * object: a turn builds one and its preflight and card read share it; the
 * executor builds its own at ✅. A channel found by name answers for its id
 * too. Any error reads as `"failed"`, which refuses — a check that could not
 * run never lets a post through.
 *
 * @param env - Worker bindings
 */
export function shareoutReadsFor(env: Env): ShareoutReads {
  const byId = new Map<string, Promise<ChannelLookup>>();
  const byName = new Map<string, Promise<ChannelLookup>>();
  const members = new Map<string, Promise<readonly string[] | null>>();
  const once = <T>(memo: Map<string, Promise<T>>, key: string, read: () => Promise<T>): Promise<T> => {
    let pending = memo.get(key);
    if (!pending) memo.set(key, (pending = read()));
    return pending;
  };

  return {
    // A channel already read this turn costs nothing more to read again; any
    // other one is a whole check.
    affordable: (ref) =>
      ("id" in ref ? byId.has(ref.id) : byName.has(ref.name)) || budgetHeadroom().subrequests >= SHAREOUT_CHANNEL_CHECK_COST,
    channelById: (id) =>
      once(byId, id, async () => {
        const res = await conversationsInfo(env, id).catch(() => null);
        if (!res) return "failed";
        if (!res.ok) return (res as { error?: string }).error === "channel_not_found" ? "missing" : "failed";
        return (res.channel && channelOf(res.channel)) ?? "missing";
      }),
    // A `#name` has no lookup of its own in Slack, so it is found in a list —
    // and Slack fills a list's pages lazily: it filters after it pages, so a
    // page can hold far fewer channels than asked for, even none, and still
    // carry a cursor. A bounded walk of the workspace's whole
    // `conversations.list` runs out of pages before it reaches channels that
    // exist (live 2026-10-15: every `#uno-bot-sandbox` ask failed while its
    // link worked). So the name is looked for in the two lists it can be in,
    // smallest first:
    //   1. the bot's own channels (`users.conversations`), public and private:
    //      a short list, and the only one a private channel it can post in is
    //      on;
    //   2. the public channels (`conversations.list`), which
    //      `chat:write.public` posts in without the bot in them. Public only:
    //      Slack lists the bot no private channel it is not in, so private
    //      pages would spend the bound on nothing.
    // Both lists read to their end without the name is "missing"; a list cut
    // off by its bound is "unfinished"; an error or a rate limit is "failed".
    channelByName: (name) =>
      once(byName, name, async () => {
        const own = await channelInList(name, BOT_CHANNEL_PAGES, (cursor) =>
          botConversations(env, "public_channel,private_channel", cursor, CHANNEL_PAGE_LIMIT),
        );
        if (own === "failed") return own;
        // Every channel on the bot's own list is one it is in, whatever
        // `is_member` says or leaves out.
        const found =
          typeof own === "object"
            ? { ...own, botIsMember: true }
            : await channelInList(name, PUBLIC_CHANNEL_PAGES, (cursor) => conversationsList(env, "public_channel", cursor, CHANNEL_PAGE_LIMIT));
        if (typeof found === "object") {
          byId.set(found.id, Promise.resolve(found));
          return found;
        }
        if (found === "failed") return found;
        // Missing only when both lists were read to their end.
        return found === "missing" && own === "missing" ? "missing" : "unfinished";
      }),
    members: (channel) => once(members, channel, () => channelMembers(env, channel).catch(() => null)),
  };
}

/**
 * The channel called `name` in a list read page by page, `pages` at most.
 *
 * A Slack refusal is already in the log: `slackGet` warns with Slack's error
 * (`ratelimited` on a 429, `missing_scope`, a non-JSON status). The one thing
 * it does not report is a throw — the turn's subrequest budget stopping the
 * call — so that is warned here, once, rather than read as a silent "failed".
 */
async function channelInList(name: string, pages: number, read: (cursor?: string) => Promise<SlackChannelPage>): Promise<ChannelLookup> {
  let cursor: string | undefined;
  for (let page = 0; page < pages; page++) {
    const res = await read(cursor).catch((err: unknown) => {
      console.warn(`[shareout] looking up #${name} stopped: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    });
    if (!res?.ok) return "failed";
    const hit = (res.channels ?? []).find((c) => c.name === name);
    const found = hit ? channelOf(hit) : null;
    if (found) return found;
    cursor = res.response_metadata?.next_cursor || undefined;
    if (!cursor) return "missing";
  }
  return "unfinished";
}

/** What a share-out is decided to do: post in `place`, or refuse in words the
 *  asker reads. */
export type ShareoutDecision = { ok: true; place: ShareoutPlace } | { ok: false; refusal: string };

const OFFER = "I can share it in #plus-design-feedback or here instead — which would you like?";
const refuse = (why: string): ShareoutDecision => ({ ok: false, refusal: `${why} ${OFFER}` });

/**
 * Where a share-out posts, with a named channel checked: the one decision the
 * preflight, the card and the executor all read.
 *
 * `place: "channel"` posts top level in the channel named by `channel` — an
 * id, a mention, a link or a `#name` — once the asker is in it and the bot can
 * post there. An ask from a test channel still stays in its own thread, and a
 * named #plus-design-feedback is the feedback channel. Every other place is
 * `shareoutPlace`'s and reads nothing.
 *
 * @param env - `PLUS_DESIGN_FEEDBACK_CHANNEL_ID` and `TEST_CHANNEL_IDS`
 * @param slack - Where it was asked, and who asked
 * @param input - The tool's input: `place`, and `channel` for a named one
 * @param reads - Slack, as the bot sees it
 */
export async function decideShareoutPlace(
  env: Pick<Env, "PLUS_DESIGN_FEEDBACK_CHANNEL_ID" | "TEST_CHANNEL_IDS">,
  slack: Pick<SlackContext, "channel" | "threadTs" | "replyTs" | "requestedBy">,
  input: Record<string, unknown>,
  reads: ShareoutReads,
): Promise<ShareoutDecision> {
  if (input.place !== "channel") return { ok: true, place: shareoutPlace(env, slack, input.place) };
  if (isTestOrigin({ origin: "slack", channel: slack.channel, testChannelIds: testChannelIdsOf(env) })) {
    return { ok: true, place: shareoutPlace(env, slack, "here") };
  }

  const ref = shareoutChannelRef(input.channel);
  if (!ref) return refuse("Which channel should it go in?");
  const feedback = env.PLUS_DESIGN_FEEDBACK_CHANNEL_ID?.trim();
  if ("id" in ref ? ref.id === feedback : ref.name === "plus-design-feedback") {
    return { ok: true, place: shareoutPlace(env, slack, "feedback_channel") };
  }

  const asked = channelRefText(ref);
  // A DM id is refused unread: the bot holds no `im:read` to look one up.
  if ("id" in ref && ref.id.startsWith("D")) return refuse(`${asked} is a DM, not a channel.`);
  if (!reads.affordable(ref)) return refuse(`I've used this turn's Slack lookups before I could check ${asked} — ask me again.`);
  const found = "id" in ref ? await reads.channelById(ref.id) : await reads.channelByName(ref.name);
  if (found === "failed") return refuse(`I couldn't look up ${asked} — paste its link and I'll try again.`);
  if (found === "unfinished") return refuse(`I couldn't find ${asked} in the channels I read — paste its link and I'll check it.`);
  if (found === "missing") {
    return refuse("id" in ref ? `I can't post in ${asked} — add me to it first.` : `I can't find ${asked}. If it's private, add me to it first.`);
  }
  const named = found.name ? `#${found.name}` : asked;
  if (found.kind === "dm") return refuse(`${asked} is a DM, not a channel.`);
  if (found.isArchived) return refuse(`${named} is archived.`);
  // `chat:write.public` covers a public channel; a private one needs the bot in it.
  if (found.isPrivate && !found.botIsMember) return refuse(`I can't post in ${named} — add me to it first.`);

  if (!slack.requestedBy) return refuse(`I couldn't tell who's asking, so I can't check you're in ${named}.`);
  const members = await reads.members(found.id);
  if (!members) return refuse(`I couldn't check you're in ${named}.`);
  if (!members.includes(slack.requestedBy)) return refuse(`You're not in ${named}, so I won't post there for you.`);

  return { ok: true, place: { channel: found.id, where: found.name ? `<#${found.id}|${found.name}>` : `<#${found.id}>` } };
}

/**
 * Where a share-out's card says it posts, from the same decision. A refused
 * named channel is named as asked: the preflight has already refused it before
 * any card, and the executor refuses it again at ✅, so the card never names
 * one place while the ✅ posts to another.
 */
export async function shareoutWhereFor(
  env: Pick<Env, "PLUS_DESIGN_FEEDBACK_CHANNEL_ID" | "TEST_CHANNEL_IDS">,
  at: { channel: string; requestedBy?: string },
  input: Record<string, unknown>,
  reads: ShareoutReads,
): Promise<string> {
  const decided = await decideShareoutPlace(env, at, input, reads);
  if (decided.ok) return decided.place.where;
  const ref = shareoutChannelRef(input.channel);
  return ref ? channelRefText(ref) : "a channel";
}

export async function executeShareForFeedback(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
  reads: ShareoutReads = shareoutReadsFor(env),
): Promise<string> {
  const fields = fieldsFromInput(input);
  if (!fields.summary) {
    return JSON.stringify({ ok: false, error: "missing 'summary' of what's being shared" });
  }

  // Checked again at ✅: membership or the bot's access may have changed
  // since the card was staged.
  const decided = await decideShareoutPlace(env, slack, input, reads);
  if (!decided.ok) return JSON.stringify({ ok: false, status: "refused", error: decided.refusal });
  const place = decided.place;
  const requester = slack.requestedBy ? `<@${slack.requestedBy}>` : "A designer";

  // The Flow 3 template, per docs/connectors/slack/shapes.md § Share-out post. The
  // shape lives in share-out-render.ts so it can be asserted — it drifted from
  // the doc for months precisely because nothing compared the two.
  const body = renderShareout(fields, requester);

  try {
    const posted = await postMessage(env, {
      channel: place.channel,
      // In #plus-design-feedback or a named channel this is a top-level post;
      // anywhere else it stays in the asking conversation.
      thread_ts: place.threadTs,
      text: body,
    });
    if (!posted.ok) {
      return JSON.stringify({ ok: false, status: "post_failed", detail: (posted as { error?: string }).error ?? "unknown" });
    }
    return JSON.stringify({
      ok: true,
      status: "shared",
      posted_to: place.where,
      message: `Shared for feedback in ${place.where}.`,
    });
  } catch (err) {
    return JSON.stringify({ ok: false, status: "post_failed", detail: err instanceof Error ? err.message : String(err) });
  }
}
