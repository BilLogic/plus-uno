// slack_user_profile + slack_channel_members executors — READ-ONLY, bot token.
// Built 2026-07-10 to close the gemini-mode gap: these reads used to come from
// the hosted Slack MCP (unavailable without server-side MCP). Run inline in the
// agent loop (no gate).
//
// `slack_user_profile` answers two questions: who is this id (one users.info),
// and who goes by this name (the directory, `findSlackUsers`). The second is
// what a relayed DM stands on — "send this to Coco" names a person, a DM needs
// an id, and a name that matches two people has to come back as two people so
// the requester is asked rather than guessed for. The directory arrives BY
// NAME, so the lookup is driven in `tests/slack-people.test.ts` with a fake;
// `Env` enters only at the bindings.

import type { Env } from "../types";
import { usersInfo, usersList, conversationsMembers, type SlackUserInfo } from "../slack/api";

export async function executeSlackUserProfile(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const raw = typeof input.user_id === "string" ? input.user_id.trim() : "";
  // Accept both bare ids and <@U…> mention syntax.
  const userId = raw.replace(/^<@/, "").replace(/[|>].*$/, "");
  if (!userId) {
    const name = typeof input.name === "string" ? input.name : "";
    if (name.trim()) return findSlackUsers(slackDirectoryFor(env), name);
    return JSON.stringify({ ok: false, error: "missing 'user_id' (or a 'name' to look up)" });
  }

  const res = await usersInfo(env, userId);
  if (!res.ok || !res.user) {
    return JSON.stringify({
      ok: false,
      error: (res as { error?: string }).error ?? "user lookup failed",
      note: "Couldn't read that profile — say so; don't guess who someone is.",
    });
  }
  const u = res.user;
  return JSON.stringify({
    ok: true,
    user: {
      id: u.id,
      name: u.profile?.display_name || u.real_name || u.name,
      real_name: u.real_name,
      title: u.profile?.title,
      email: u.profile?.email,
      status: u.profile?.status_text,
      tz: u.tz,
      is_bot: u.is_bot === true,
      deleted: u.deleted === true,
    },
    note: "Profile from Slack. @-mention as <@id> when referring to them in a reply.",
  });
}

/** One page of the workspace directory, and where the next one starts. */
export interface SlackDirectory {
  listUsers(cursor?: string): Promise<{ ok: boolean; error?: string; members?: SlackUserInfo[]; next_cursor?: string }>;
}

/** The production directory: users.list, with `Env` bound, behind the
 *  isolate's page cache. */
export function slackDirectoryFor(env: Env): SlackDirectory {
  return cachingDirectory(
    {
      async listUsers(cursor) {
        const res = await usersList(env, cursor);
        if (!res.ok) return { ok: false, error: (res as { error?: string }).error ?? "users.list failed" };
        const next = res.response_metadata?.next_cursor;
        return { ok: true, members: res.members ?? [], ...(next ? { next_cursor: next } : {}) };
      },
    },
    { cache: ISOLATE_DIRECTORY_PAGES },
  );
}

type DirectoryPage = Awaited<ReturnType<SlackDirectory["listUsers"]>>;

/** How long a directory page is reused. users.list is a Tier 2 method (about
 *  20 calls a minute), and a relay to two people is two lookups in one turn —
 *  a few minutes is fresh enough for who works here. */
export const DIRECTORY_TTL_MS = 5 * 60_000;

/** The isolate's pages, by cursor. Per isolate and short-lived on purpose: a
 *  new teammate is found within minutes, and nothing here outlives a deploy. */
const ISOLATE_DIRECTORY_PAGES = new Map<string, { at: number; page: DirectoryPage }>();

/**
 * A directory that reuses each page for `ttlMs`. Only a page Slack answered
 * is kept: a refusal is asked again next time rather than remembered.
 */
export function cachingDirectory(
  inner: SlackDirectory,
  opts: { cache: Map<string, { at: number; page: DirectoryPage }>; now?: () => number; ttlMs?: number },
): SlackDirectory {
  const now = opts.now ?? Date.now;
  const ttlMs = opts.ttlMs ?? DIRECTORY_TTL_MS;
  return {
    async listUsers(cursor) {
      const key = cursor ?? "";
      const hit = opts.cache.get(key);
      if (hit && now() - hit.at < ttlMs) return hit.page;
      const page = await inner.listUsers(cursor);
      if (page.ok) opts.cache.set(key, { at: now(), page });
      return page;
    },
  };
}

/** Pages read before the search says it was partial: 1,000 people at 200 a
 *  page, well past this workspace, and a bound on the subrequests one name
 *  can spend. */
const MAX_PAGES = 5;
/** More matches than this is a name too loose to ask about one by one. */
const MAX_MATCHES = 10;

/**
 * Everyone active whose name, display name or handle has a word starting with
 * `name` — case and accents aside, so "jose" finds José and "Coco" finds a
 * display name as well as a surname. The start of a word only: a letter run
 * inside one ("ryem") is not a person.
 *
 * Deactivated accounts, bots and Slackbot are never matches: none of them can
 * be sent a relayed DM, and a near miss offered as the person is how a DM
 * lands in the wrong inbox.
 */
export async function findSlackUsers(directory: SlackDirectory, name: string): Promise<string> {
  const wanted = fold(name.trim());
  if (!wanted) return JSON.stringify({ ok: false, error: "missing 'name'" });
  const startsAWord = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(wanted)}`, "u");

  const matches: SlackUserInfo[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const page = await directory.listUsers(cursor);
    if (!page.ok) {
      return JSON.stringify({
        ok: false,
        error: `couldn't read the Slack directory (${page.error ?? "unknown"})`,
        note: "Say you couldn't look the name up, and ask for their @-mention instead — never guess who they meant.",
      });
    }
    pages++;
    for (const user of page.members ?? []) {
      if (user.deleted || user.is_bot || user.id === "USLACKBOT") continue;
      const names = [user.profile?.display_name, user.real_name, user.name]
        .filter((n): n is string => Boolean(n))
        .map(fold);
      if (names.some((n) => startsAWord.test(n))) matches.push(user);
    }
    cursor = page.next_cursor;
  } while (cursor && pages < MAX_PAGES);
  const complete = !cursor;

  const shown = matches.slice(0, MAX_MATCHES).map((u) => ({
    id: u.id,
    mention: `<@${u.id}>`,
    name: u.profile?.display_name || u.real_name || u.name,
    real_name: u.real_name,
    title: u.profile?.title,
    // A guest is a valid recipient; saying so lets the requester check it's
    // the person they meant, not a same-named guest.
    ...(u.is_ultra_restricted
      ? { guest: "single-channel" }
      : u.is_restricted
        ? { guest: "multi-channel" }
        : {}),
  }));
  const partial = complete ? "" : " This searched part of the workspace, not all of it — say so if you found no one.";
  const note =
    matches.length === 0
      ? `No active teammate goes by "${name.trim()}" in Slack. Say so and ask for their @-mention or full name — never guess, and never send to a near miss.`
      : matches.length === 1
        ? "One match. Name them as <@id> so the requester can check it's the right person before anything is sent."
        : `${matches.length} people match. Ask which one they mean, naming each as <@id> with their title, and stage nothing until they answer.`;
  return JSON.stringify({ ok: true, matches: shown, complete, note: note + partial });
}

/** Lower case, accents off: "José" and "jose" are one name. */
function fold(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function executeSlackChannelMembers(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const raw = typeof input.channel_id === "string" ? input.channel_id.trim() : "";
  const channel = raw.replace(/^<#/, "").replace(/[|>].*$/, "");
  if (!channel) return JSON.stringify({ ok: false, error: "missing 'channel_id'" });

  const res = await conversationsMembers(env, channel, 100);
  if (!res.ok || !res.members) {
    return JSON.stringify({
      ok: false,
      error: (res as { error?: string }).error ?? "member lookup failed",
      note: "Couldn't list that channel's members (the bot may not be in it) — say so plainly.",
    });
  }
  return JSON.stringify({
    ok: true,
    channel,
    count: res.members.length,
    member_ids: res.members,
    has_more: Boolean(res.response_metadata?.next_cursor),
    note: "Member ids only (first 100). Mention people as <@id> — Slack renders the name. For someone's role/title, look up their id with slack_user_profile; don't fetch every profile.",
  });
}
