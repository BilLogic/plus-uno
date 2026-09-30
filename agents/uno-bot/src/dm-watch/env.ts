// DM watch on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • The records: `dm_watch` and `dm_commitments` in the usage database.
//   • The owner's reads: their OWN token from `getSlackAccessTokenFor` — a
//     workspace fallback never counts — on `auth.test` (the granted scopes,
//     from Slack's `x-oauth-scopes` header, ADR-024) and the two read methods
//     `slackReadAs` admits. No write can be named on it.
//   • The bot's side: `conversations.open` for the owner's DM with uno-bot,
//     `chat.postMessage` there, `users.info` for a name, and
//     `conversations.replies` to read a reminder back for its answer.
//   • The detector and the judge: `selectProvider(env)`.
//   • A night's progress: HARNESS_KV, for a day.
//
// A Worker without USAGE_DB keeps no switches and runs no DM jobs.

import type { Env } from "../types";
import { selectProvider } from "../agent/run-agent";
import { budgetHeadroom, charge, countedFetch, rethrowIfBudget } from "../net";
import { getSlackAccessTokenFor } from "../oauth/slack";
import { conversationsOpen, conversationsReplies, getBotIdentity, postMessage, slackReadAs, updateMessage, usersInfo } from "../slack/api";
import type { ScheduledJob } from "../scheduled/runs";
import { measured } from "../sweep/env";
import type { SweepSlackMessage } from "../sweep/run";
import { modelCommitmentDetector, modelEvidenceJudge } from "../commitments/detector";
import { createD1DmWatchRecords } from "./d1";
import {
  answerDmReminder,
  runDmPromiseNudges,
  runDmPromiseRead,
  setDmWatch,
  type DmJobReport,
  type DmReminderReaction,
  type OwnerSlack,
  type ReadProgress,
} from "./run";
import type { DmWatchFeature, DmWatchRecords } from "./store";

const PROGRESS_TTL_S = 2 * 24 * 60 * 60;

/** The records, or null without the usage database. */
export function dmWatchRecordsFor(env: Env): DmWatchRecords | null {
  return env.USAGE_DB ? createD1DmWatchRecords({ db: env.USAGE_DB }) : null;
}

/** Everyone with a switch on, for the scheduled firing; none when unbound. */
export async function dmWatchersFor(env: Env): Promise<string[]> {
  return (await dmWatchRecordsFor(env)?.watchers()) ?? [];
}

/** Whether this person has connected a token of their own. */
async function connected(env: Env, userId: string): Promise<boolean> {
  return (await getSlackAccessTokenFor(env, userId))?.own === true;
}

/** What the Home tab shows this person: connected, and which switches are on. */
export async function dmWatchHomeStateFor(env: Env, userId: string): Promise<{ connected: boolean; on: DmWatchFeature[] }> {
  const records = dmWatchRecordsFor(env);
  const isConnected = await connected(env, userId);
  if (!records || !isConnected) return { connected: isConnected, on: [] };
  try {
    return { connected: true, on: (await records.switches(userId)).map((s) => s.feature) };
  } catch (err) {
    // The Home tab still opens — unticked — when the switches cannot be read
    // (a table not yet migrated, a D1 error).
    rethrowIfBudget(err);
    console.warn(`[dm-watch] ${userId}: switches unreadable, Home shows them off: ${err instanceof Error ? err.message : String(err)}`);
    return { connected: true, on: [] };
  }
}

/** Save a person's switches from the Home tab; answers with what is on. */
export async function setDmWatchOnEnv(env: Env, userId: string, selected: readonly DmWatchFeature[]): Promise<DmWatchFeature[]> {
  const records = dmWatchRecordsFor(env);
  if (!records) return [];
  return setDmWatch(userId, selected, { records, connected: (id) => connected(env, id), now: () => Date.now() });
}

/** The owner's own-token reads, or null without a token of their own. */
function ownerSlackFor(env: Env): (userId: string) => Promise<OwnerSlack | null> {
  return async (userId) => {
    const credential = await getSlackAccessTokenFor(env, userId);
    if (!credential?.own) return null;
    const token = credential.token;
    return {
      async identity() {
        try {
          const res = await countedFetch("https://slack.com/api/auth.test", {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
          });
          const body = (await res.json()) as { ok?: boolean; url?: string; user_id?: string };
          if (!body.ok || !body.url || !body.user_id) return null;
          // Slack reports the token's REAL granted scopes here, comma-joined.
          const scopes = (res.headers.get("x-oauth-scopes") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
          return { scopes, url: body.url, userId: body.user_id };
        } catch (err) {
          rethrowIfBudget(err);
          return null;
        }
      },
      async ims() {
        const res = (await slackReadAs(token, "users.conversations", { types: "im", exclude_archived: "true", limit: "200" })) as {
          ok: boolean;
          channels?: { id?: string; user?: string }[];
          response_metadata?: { next_cursor?: string };
        };
        if (!res.ok) return null;
        const channels = (res.channels ?? []).flatMap((c) => (c.id && c.user ? [{ id: c.id, user: c.user }] : []));
        return { channels, complete: !res.response_metadata?.next_cursor };
      },
      async history(channel, range) {
        const res = (await slackReadAs(token, "conversations.history", {
          channel,
          limit: String(range.limit),
          ...(range.oldest ? { oldest: range.oldest } : {}),
          ...(range.latest ? { latest: range.latest } : {}),
          ...(range.inclusive ? { inclusive: "true" } : {}),
        })) as { ok: boolean; messages?: SweepSlackMessage[]; has_more?: boolean };
        if (!res.ok || !Array.isArray(res.messages)) return null;
        return { messages: res.messages, hasMore: res.has_more === true };
      },
    };
  };
}

function progressIn(kv: KVNamespace): ReadProgress {
  return {
    async get(key) {
      charge(1, "kv");
      return (await kv.get<{ latest: string; next: number }>(key, "json")) ?? null;
    },
    async set(key, value) {
      charge(1, "kv");
      await kv.put(key, JSON.stringify(value), { expirationTtl: PROGRESS_TTL_S });
    },
    async clear(key) {
      charge(1, "kv");
      await kv.delete(key);
    },
  };
}

/** The end-of-day `dm-promise-read` job on `Env`. */
export async function runDmPromiseReadOnEnv(env: Env, job: ScheduledJob, opts: { dryRun: boolean }): Promise<DmJobReport | { summary: string }> {
  const records = dmWatchRecordsFor(env);
  if (!records || !env.HARNESS_KV) return { summary: "USAGE_DB or HARNESS_KV not bound — no DM watch" };
  const detector = modelCommitmentDetector(selectProvider(env));
  const bot = await measured(() => getBotIdentity(env));
  return runDmPromiseRead(job, {
    records,
    ownerSlack: ownerSlackFor(env),
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    botUserId: bot?.userId ?? null,
    progress: progressIn(env.HARNESS_KV),
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  });
}

/** The morning `dm-promise-nudge` job on `Env`. */
export async function runDmPromiseNudgesOnEnv(env: Env, job: ScheduledJob, opts: { dryRun: boolean }): Promise<DmJobReport | { summary: string }> {
  const records = dmWatchRecordsFor(env);
  if (!records) return { summary: "USAGE_DB not bound — no DM watch" };
  const provider = selectProvider(env);
  const detector = modelCommitmentDetector(provider);
  const judge = modelEvidenceJudge(provider);
  const bot = await measured(() => getBotIdentity(env));
  return runDmPromiseNudges(job, {
    records,
    ownerSlack: ownerSlackFor(env),
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    judge: { judge: (input) => measured(() => judge.judge(input)) },
    botUserId: bot?.userId ?? null,
    bot: {
      dmChannel: (userId) => conversationsOpen(env, userId),
      async post(channel, message) {
        const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async userName(userId) {
        const res = await usersInfo(env, userId);
        const u = res.ok ? res.user : undefined;
        return u?.profile?.display_name || u?.real_name || u?.name || null;
      },
    },
    meter: { headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  });
}

/** The reaction door's look at DM reminders, or undefined when unbound. */
export function dmReminderDoorFor(env: Env): ((r: DmReminderReaction) => Promise<boolean>) | undefined {
  const records = dmWatchRecordsFor(env);
  if (!records) return undefined;
  return (r) =>
    answerDmReminder(r, {
      records,
      async reminderBody(channel, ts) {
        const res = await conversationsReplies(env, channel, ts, 1);
        const m = res.ok ? res.messages?.find((x) => x.ts === ts) : undefined;
        return m?.text || null;
      },
      async update(channel, ts, message) {
        return (await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks })).ok;
      },
      botUserId: async () => (await getBotIdentity(env))?.userId,
      now: () => Date.now(),
    });
}
