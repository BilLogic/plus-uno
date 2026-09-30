// The sweep on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • Slack reads: `conversations.info` for the channel's kind, and
//     `conversations.history` / `.replies` with the bot token; for a private
//     place, `conversations.members` when a Contributor is about to be named
//     owner there; and `users.conversations` (`types=mpim`) for the group DMs
//     uno-bot is in. The private allowlist is `SLACK_SEARCH_PRIVATE_ALLOWLIST`.
//   • Source reads: Notion through `readNotionPage`, which keeps each block's
//     id and `last_edited_time` for the replace; GitHub, Figma and canvases
//     through `source_read`'s own executor, as read-only context.
//   • People: a Contributor's name through the Slack directory lookup the
//     relayed DM uses — one exact match or nobody.
//   • The detectors: `selectProvider(env)`, the Worker's one ModelProvider —
//     drift, and the Capture two beside it (`./capture-detector.ts`).
//   • Search: `notionSearch` for a page a thread, note or card names without
//     linking, then GitHub code search in the default repo (`./search.ts`).
//     Slack search is not used: its bot mode needs a triggering event's action
//     token, and a scheduled run has none (ADR-031 keeps the rest out).
//   • Notes and cards: `queryEditedSince` on `NOTION_RUNNING_NOTES_DB_ID` and
//     `NOTION_ROADMAP_DB_ID`, and `listPageComments` for a card (`./records.ts`).
//   • The store: the records in the usage database (`USAGE_DB`), the queue in
//     HARNESS_KV, one key per channel under `sweep:findings:`. Each channel's
//     job writes only its own key, so two end-of-day jobs a few seconds apart
//     never overwrite each other's findings through KV's eventual consistency.
//     A finding older than 30 days is dropped as the queue is read. A card's
//     snapshot waits under `sweep:card:` from before its post until it is
//     staged or released.
//   • Delivery: `chat.postMessage` in the destination, the card rendered by the
//     proposal renderer and tagged with its key in message metadata, and
//     `ThreadState.putProposal`. A card is found again by that tag
//     (`include_all_metadata`), and withdrawn with `chat.update`.
//   • A group DM's share: once its fix card's ✅ has written a page, a
//     separate share card posted and staged in the same thread
//     (`offerSweepShareFor`); its own ✅ runs `sweep_share_post`.
//
// THE BUDGET, AT EVERY READ. A read that ran into the lookup ceiling may come
// back short rather than throw — a paging loop that stopped, an executor that
// caught the stop and reported "couldn't read". Swept on, a short read would
// advance the cursor past a thread that was never really read. So each read
// here is measured by the meter's own trip counter, and one that tripped is
// thrown as the budget stop the job saves and defers on.

import type { Env } from "../types";
import { LOOKUP_CEILING } from "../agent/loop-policy";
import { selectProvider } from "../agent/run-agent";
import {
  budgetHeadroom,
  charge,
  d1QueriesUsed,
  SubrequestBudgetError,
  subrequestBudgetTrips,
  subrequestsUsed,
} from "../net";
import {
  canonicalNotionUrl,
  listPageComments,
  notionSearch,
  parseNotionPageId,
  queryEditedSince,
  readNotionPage,
  stripBlockPrefix,
} from "../integrations/notion";
import { githubSearchCode, resolveRepoFor } from "../integrations/github";
import {
  botConversations,
  conversationsHistorySince,
  conversationsInfo,
  conversationsMembers,
  conversationsReplies,
  getBotIdentity,
  getPermalink,
  postMessage,
  updateMessage,
  type SlackMessageMetadata,
} from "../slack/api";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import { parseSlackCanvasId } from "../slack/canvas-reference";
import { threadStateFor } from "../thread-state/production";
import { proposalEventLogFor } from "../usage/production";
import { executeReadSource } from "../tools/read-source";
import { findSlackUsers, slackDirectoryFor } from "../tools/slack-people";
import type { ScheduledJob } from "../scheduled/runs";
import type { OperationOutcome } from "../gate/index";
import type { PendingProposal } from "../thread-state/index";
import { modelDriftDetector } from "./detector";
import { modelCaptureDetector } from "./capture-detector";
import type { SweepNotion } from "./records";
import type { SearchHit, SourceSearch } from "./search";
import { markSweepThread } from "./thread-mark";
import { createD1SweepRecords } from "./d1";
import { recordSweepResolution, recordSweepRestage, recordSweepRevision } from "./outcomes";
import { classifyLink, type ChannelKind, type SweepSource, type TargetKind } from "./finding";
import { SWEEP_CARD_EVENT, sweepPostMetadata, WITHDRAWN_SWEEP_CARD_EVENT } from "./cards";
import { stageSweepShare } from "./share";
import { FIND_POSTED_PAGES, runSweepJob, stageSweepCard, sweepCardState, type CardTag, type SweepDeps, type SweepJobReport } from "./run";
import { mergeFindings, type CardSnapshot, type FindingQueue, type PendingFinding, type SweepStore } from "./store";

/** One key per channel: `sweep:findings:<channel>`. */
const QUEUE_KV_PREFIX = "sweep:findings:";
/** One key per card still to stage: `sweep:card:<card key>`. */
const CARD_KV_PREFIX = "sweep:card:";
/** A finding not posted within 30 days is dropped as the queue is read — long
 *  enough for a busy thread's overflow to wait out several live cards; a fix
 *  that old whose block has moved is refused at the write anyway (ADR-029). */
const QUEUE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** The key itself outlives its newest finding by the same week. */
const QUEUE_TTL_SECONDS = QUEUE_MAX_AGE_MS / 1000;
const CONTEXT_TEXT_CAP = 4_000;
/** Pages of 200 read for a member list or the bot's group DMs. */
const LIST_PAGES = 5;
/** Search hits weighed per query: the top one is all the sweep keeps. */
const SEARCH_HITS = 5;
/** Notes or cards read per job: one query page. */
const RECORDS_PER_JOB = 25;


/**
 * One sweep job on `Env`.
 *
 * @param env - Worker bindings
 * @param job - A `sweep-channel` or `sweep-post` job
 * @param opts - `dryRun` reads and detects, and writes, posts and stages nothing
 * @param extra - The per-thread hook other jobs read the sweep's threads with
 */
export async function runSweepJobOnEnv(
  env: Env,
  job: ScheduledJob,
  opts: { dryRun: boolean },
  extra: Pick<SweepDeps, "onThread"> = {},
): Promise<SweepJobReport | { summary: string }> {
  if (!env.USAGE_DB || !env.HARNESS_KV) {
    // No cursor store means every run would re-read the day; nothing is safer.
    return { summary: "USAGE_DB or HARNESS_KV not bound — the sweep did nothing" };
  }
  const deps = await sweepDepsFor(env, env.USAGE_DB, env.HARNESS_KV, opts);
  return runSweepJob(job, { ...deps, ...extra });
}

/**
 * The sweep's Slack reads on `Env`, each measured — also what commitment
 * reminders read a promise's thread with.
 *
 * @param env - Worker bindings
 */
export function sweepSlackFor(env: Env): SweepDeps["slack"] {
  return {
    async channelKind(channel) {
      const res = await measured(() => conversationsInfo(env, channel));
      if (!res.ok || !res.channel) return null;
      return kindOf(res.channel);
    },
    async history(channel, oldest, cursor) {
      const res = await measured(() => conversationsHistorySince(env, channel, oldest, cursor));
      if (!res.ok) return null;
      const next = res.response_metadata?.next_cursor;
      return { messages: res.messages ?? [], ...(next ? { nextCursor: next } : {}) };
    },
    async replies(channel, rootTs, cursor) {
      const res = await measured(() => conversationsReplies(env, channel, rootTs, 200, cursor ? { cursor } : {}));
      if (!res.ok) return null;
      const next = res.response_metadata?.next_cursor;
      return { messages: res.messages ?? [], ...(next ? { nextCursor: next } : {}) };
    },
    async members(channel) {
      const ids: string[] = [];
      let cursor: string | undefined;
      for (let i = 0; i < LIST_PAGES; i++) {
        const res = await measured(() => conversationsMembers(env, channel, 200, cursor));
        if (!res.ok) return null;
        ids.push(...(res.members ?? []));
        cursor = res.response_metadata?.next_cursor;
        if (!cursor) return ids;
      }
      // Cut off: the list is partial, and a partial list names no one outside it.
      return ids;
    },
    async groupDms() {
      const ids: string[] = [];
      let cursor: string | undefined;
      for (let i = 0; i < LIST_PAGES; i++) {
        const res = await measured(() => botConversations(env, "mpim", cursor));
        if (!res.ok) return null;
        ids.push(...(res.channels ?? []).map((c) => c.id ?? "").filter(Boolean));
        cursor = res.response_metadata?.next_cursor;
        if (!cursor) break;
      }
      return ids;
    },
  };
}

async function sweepDepsFor(
  env: Env,
  db: D1Database,
  kv: KVNamespace,
  opts: { dryRun: boolean },
): Promise<SweepDeps> {
  const provider = selectProvider(env);
  const detector = modelDriftDetector(provider);
  const capture = modelCaptureDetector(provider);
  const store: SweepStore = { ...createD1SweepRecords({ db }), ...kvQueue(kv) };
  const directory = slackDirectoryFor(env);
  const bot = await measured(() => getBotIdentity(env));
  return {
    slack: sweepSlackFor(env),
    sources: { read: (url, kind) => measured(() => readSource(env, url, kind)) },
    people: {
      async slackIdFor(name) {
        const raw = await measured(() => findSlackUsers(directory, name));
        try {
          const r = JSON.parse(raw) as { ok?: boolean; matches?: { id?: string }[] };
          return r.ok && r.matches?.length === 1 ? (r.matches[0]!.id ?? null) : null;
        } catch {
          return null;
        }
      },
    },
    detector: { detect: (input) => measured(() => detector.detect(input)) },
    capture: {
      answers: (input) => measured(() => capture.answers(input)),
      record: (input) => measured(() => capture.record(input)),
    },
    search: sweepSearchFor(env),
    notion: sweepNotionFor(env),
    store,
    delivery: {
      render(card) {
        const rendered = renderProposalCard(card);
        return {
          text: rendered.text,
          blocks: rendered.blocks ?? proposalCardBlocks(rendered.text),
          ...(rendered.followUp?.length ? { followUp: rendered.followUp } : {}),
        };
      },
      async post(to, card, tag) {
        for (const text of card.followUp ?? []) {
          const sent = await postMessage(env, {
            channel: to.channel,
            text,
            metadata: tagOf(tag, "plan"),
            ...(to.threadTs ? { thread_ts: to.threadTs } : {}),
          });
          // A card whose plan did not go up ahead of it is not posted at all.
          if (!sent.ok) return { ok: false };
        }
        const res = await postMessage(env, {
          channel: to.channel,
          text: card.text,
          blocks: card.blocks,
          metadata: tagOf(tag, "card"),
          ...(to.threadTs ? { thread_ts: to.threadTs } : {}),
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async findPosted(to, cardKey, since) {
        // The card's own message: its tag's type, key and role — never merely
        // the latest tagged message, which may be a follow-up or another card.
        const isCard = (m: { metadata?: SlackMessageMetadata }) =>
          m.metadata?.event_type === SWEEP_CARD_EVENT &&
          m.metadata.event_payload.card_key === cardKey &&
          m.metadata.event_payload.role === "card";
        let cursor: string | undefined;
        for (let i = 0; i < FIND_POSTED_PAGES; i++) {
          const res = to.threadTs
            ? await measured(() =>
                conversationsReplies(env, to.channel, to.threadTs!, 200, { includeMetadata: true, ...(cursor ? { cursor } : {}) }),
              )
            : await measured(() => conversationsHistorySince(env, to.channel, since, cursor, { includeMetadata: true }));
          if (!res.ok) return { state: "unknown", why: `Slack said ${res.error ?? "no"}` };
          const hit = (res.messages ?? []).find(isCard);
          if (hit) {
            const digest = hit.metadata?.event_payload.digest;
            return { state: "found", ts: hit.ts, text: hit.text ?? "", digest: typeof digest === "string" ? digest : "" };
          }
          cursor = res.response_metadata?.next_cursor;
          if (!cursor) return { state: "absent" };
        }
        return { state: "unknown", why: `more than ${FIND_POSTED_PAGES} pages to search` };
      },
      async stage(proposal, channelKind) {
        await stageSweepCard(
          proposal,
          {
            threadState: threadStateFor(env),
            proposalEvents: proposalEventLogFor(env),
            markThread: (channel, thread) => markSweepThread(kv, channel, thread),
          },
          Date.now(),
          channelKind,
        );
      },
      async cardState(proposalTs) {
        return sweepCardState(proposalTs, { threadState: threadStateFor(env), proposalEvents: proposalEventLogFor(env) });
      },
      async liveCards(channel) {
        return (await threadStateFor(env).getProposalsByChannel(channel)).filter((p) => !!p.sweepRun);
      },
      async withdraw(channel, ts, text, cardKey) {
        // Out of reach first: a card that says it didn't go through can't be ✅'d.
        await threadStateFor(env).retireProposal(ts);
        await updateMessage(env, {
          channel,
          ts,
          text,
          metadata: { event_type: WITHDRAWN_SWEEP_CARD_EVENT, event_payload: { card_key: cardKey } },
        });
      },
      permalink: (channel, ts) => getPermalink(env, channel, ts),
    },
    config: {
      plusDesign: env.PLUS_DESIGN_CHANNEL_ID?.trim() || undefined,
      plusUniversal: env.PLUS_UNIVERSAL_CHANNEL_ID?.trim() || undefined,
      unoBot: env.UNO_BOT_CHANNEL_ID?.trim() || undefined,
      figmaLibraryKey: env.FIGMA_FILE_KEY?.trim() || undefined,
      botUserId: bot?.userId ?? null,
      runningNotesDb: env.NOTION_RUNNING_NOTES_DB_ID?.trim() || undefined,
      roadmapDb: env.NOTION_ROADMAP_DB_ID?.trim() || undefined,
      // Where a search hit may come from: the specs and the answers the team
      // keeps (`./surfaces.ts`).
      teamSurfaceDbs: [
        env.NOTION_ROADMAP_DB_ID,
        env.NOTION_HELP_TUTORS_DB_ID,
        env.NOTION_HELP_TEACHERS_DB_ID,
        env.NOTION_DECISIONS_DB_ID,
        env.NOTION_MARKETPLACE_DB_ID,
      ].flatMap((id) => (id?.trim() ? [id.trim()] : [])),
      privateAllowlist: (env.SLACK_SEARCH_PRIVATE_ALLOWLIST ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    },
    meter: { subrequests: subrequestsUsed, d1Queries: d1QueriesUsed, headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
  };
}

/** The sweep's searches on `Env`, each measured: Notion, then GitHub code in
 *  the default repo when the Worker has a token for it. */
function sweepSearchFor(env: Env): SourceSearch {
  const repo = env.GITHUB_TOKEN ? resolveRepoFor(env, undefined) : null;
  return {
    async notion(query) {
      const hits = await measured(() => notionSearch(env, query, SEARCH_HITS));
      return hits.map((h): SearchHit => ({ url: h.url, title: h.title, kind: "notion", parentDatabaseId: h.parentDatabaseId }));
    },
    ...(repo?.ok
      ? {
          async github(query: string) {
            const hits = await measured(() => githubSearchCode(env, repo.entry, query));
            return hits.slice(0, SEARCH_HITS).flatMap((h): SearchHit[] => {
              const kind = classifyLink(h.url);
              return kind ? [{ url: h.url, title: h.path, kind }] : [];
            });
          },
        }
      : {}),
  };
}

/** The notes and cards reads on `Env`, each measured. */
function sweepNotionFor(env: Env): SweepNotion {
  return {
    edited: (databaseId, since, after) =>
      measured(() => queryEditedSince(env, databaseId, since, RECORDS_PER_JOB, after)),
    comments: (pageId) => measured(() => listPageComments(env, pageId)),
  };
}

/**
 * Record what a ✅ or ⛔ did to a sweep card's items (`recordSweepResolution`).
 * Best-effort: a failed record is logged and never reaches the person.
 *
 * @param env - Carries USAGE_DB
 * @param proposal - The resolved card
 * @param outcomes - What its batch ran; undefined for a ⛔
 */
export async function recordSweepResolutionFor(
  env: Env,
  proposal: PendingProposal,
  outcomes: readonly OperationOutcome[] | undefined,
): Promise<void> {
  if (!proposal.sweepRun || !env.USAGE_DB) return;
  try {
    await recordSweepResolution(createD1SweepRecords({ db: env.USAGE_DB }), proposal, outcomes, Date.now());
  } catch (err) {
    console.error(`[sweep] outcome of ${proposal.proposalTs} not recorded: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Offer a group DM's share once its fix card's ✅ has run (`stageSweepShare`):
 * a separate card in the same thread showing the note and naming its team
 * channel, staged for the fix card's confirmers. Nothing for a card from
 * anywhere else, a revision, or a batch that wrote nothing.
 *
 * @param env - Carries the team channels' ids
 * @param proposal - The confirmed fix card
 * @param outcomes - What its batch ran
 */
export async function offerSweepShareFor(
  env: Env,
  proposal: PendingProposal,
  outcomes: readonly OperationOutcome[],
): Promise<void> {
  if (!proposal.sweepShare) return;
  await stageSweepShare(proposal, outcomes, {
    channels: {
      plusDesign: env.PLUS_DESIGN_CHANNEL_ID,
      plusUniversal: env.PLUS_UNIVERSAL_CHANNEL_ID,
      unoBot: env.UNO_BOT_CHANNEL_ID,
    },
    async post(to, card) {
      const rendered = renderProposalCard(card);
      const res = await postMessage(env, {
        channel: to.channel,
        thread_ts: to.threadTs,
        text: rendered.text,
        blocks: rendered.blocks ?? proposalCardBlocks(rendered.text),
        metadata: sweepPostMetadata("note"),
      });
      return res.ok && res.ts ? { ok: true, ts: res.ts, text: rendered.text } : { ok: false };
    },
    threadState: threadStateFor(env),
    proposalEvents: proposalEventLogFor(env),
    now: () => Date.now(),
  });
}

/**
 * Record a revision of a sweep card (`recordSweepRevision`). Best-effort.
 *
 * @param env - Carries USAGE_DB
 * @param replaced - The card the turn revised, when there was one
 * @param revision - The card the turn staged, when it staged one
 */
export async function recordSweepRevisionFor(
  env: Env,
  replaced: PendingProposal | null,
  revision: PendingProposal | undefined,
): Promise<void> {
  if (!replaced?.sweepRun || !revision || !env.USAGE_DB) return;
  try {
    await recordSweepRevision(createD1SweepRecords({ db: env.USAGE_DB }), replaced, revision, Date.now());
  } catch (err) {
    console.error(`[sweep] revision of ${replaced.proposalTs} not recorded: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Move a cut-off sweep card's items to the card re-staged in its place
 * (`recordSweepRestage`). Best-effort.
 *
 * @param env - Carries USAGE_DB
 * @param from - The card whose run was cut off
 * @param to - The fresh card
 */
export async function recordSweepRestageFor(env: Env, from: PendingProposal, to: PendingProposal): Promise<void> {
  if (!from.sweepRun || !env.USAGE_DB) return;
  try {
    await recordSweepRestage(createD1SweepRecords({ db: env.USAGE_DB }), from, to, Date.now());
  } catch (err) {
    console.error(`[sweep] re-stage of ${from.proposalTs} not recorded: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** The tag a sweep card's messages carry in Slack's message metadata: its
 *  key, its operations' digest, and which message this is. */
function tagOf(tag: CardTag, role: "card" | "plan"): SlackMessageMetadata {
  return { event_type: SWEEP_CARD_EVENT, event_payload: { card_key: tag.cardKey, digest: tag.digest, role } };
}

/** A read that tripped the budget is the budget stop, whatever it returned. */
export async function measured<T>(fn: () => Promise<T>): Promise<T> {
  const before = subrequestBudgetTrips();
  const result = await fn();
  if (subrequestBudgetTrips() > before) throw new SubrequestBudgetError(LOOKUP_CEILING);
  return result;
}

function kindOf(channel: { is_private?: boolean; is_im?: boolean; is_mpim?: boolean }): ChannelKind {
  if (channel.is_im) return "dm";
  if (channel.is_mpim) return "group-dm";
  return channel.is_private ? "private" : "public";
}

/**
 * One linked source, read; null when the link names nothing readable. A
 * Notion read that fails — a 429, a 5xx, a page not shared — throws: the job
 * holds the thread rather than read "no findings" off a page it never saw.
 */
export async function readSource(env: Env, url: string, kind: TargetKind): Promise<SweepSource | null> {
  if (kind === "notion") {
    const pageId = parseNotionPageId(url);
    if (!pageId) return null;
    // Whole or not at all: a failed blocks page throws, and the thread holds.
    const page = await readNotionPage(env, pageId, { complete: true });
    return {
      url: canonicalNotionUrl(url),
      kind,
      writable: true,
      title: page.title,
      // The block's own text, without the list or to-do mark its rendered
      // line leads with: what a replace writes back is this text.
      blocks: page.blocks.map((b) => ({
        id: b.id,
        lastEditedTime: b.lastEditedTime,
        text: stripBlockPrefix(b.type, b.text),
        type: b.type,
        plain: b.plain,
        links: b.links,
        byBot: b.byBot,
      })),
      text: page.text.slice(0, CONTEXT_TEXT_CAP),
      pillars: splitList(page.properties["Product Pillar"]),
      contributors: page.people["Contributor"] ?? [],
      parentDatabaseId: page.parentDatabaseId,
      properties: page.properties,
      truncated: page.truncated,
    };
  }
  const canvas = kind === "canvas" ? parseSlackCanvasId(url) : null;
  const raw = await executeReadSource(env, { url }, canvas ? { sharedCanvasIds: [canvas] } : undefined);
  try {
    const r = JSON.parse(raw) as { ok?: boolean; title?: string; content?: string };
    if (!r.ok) return null;
    return {
      url,
      kind,
      writable: false,
      title: r.title ?? url,
      blocks: [],
      text: String(r.content ?? "").slice(0, CONTEXT_TEXT_CAP),
      pillars: [],
      contributors: [],
    };
  } catch {
    return null;
  }
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** The queue in KV. Reads and writes are charged to the internal bucket. */
function kvQueue(kv: KVNamespace): FindingQueue {
  const fresh = (findings: PendingFinding[]) => findings.filter((f) => Date.now() - f.detectedAt <= QUEUE_MAX_AGE_MS);
  const read = async (channel: string): Promise<PendingFinding[]> => {
    charge(1, "kv");
    return fresh((await kv.get<PendingFinding[]>(`${QUEUE_KV_PREFIX}${channel}`, "json")) ?? []);
  };
  const write = async (channel: string, findings: PendingFinding[]): Promise<void> => {
    charge(1, "kv");
    const key = `${QUEUE_KV_PREFIX}${channel}`;
    if (findings.length) await kv.put(key, JSON.stringify(findings), { expirationTtl: QUEUE_TTL_SECONDS });
    else await kv.delete(key);
  };
  const byChannel = <T>(items: T[], channelOf: (item: T) => string): Map<string, T[]> => {
    const out = new Map<string, T[]>();
    for (const item of items) out.set(channelOf(item), [...(out.get(channelOf(item)) ?? []), item]);
    return out;
  };
  return {
    async pendingFindings() {
      charge(1, "kv");
      const listed = await kv.list({ prefix: QUEUE_KV_PREFIX });
      const all: PendingFinding[] = [];
      for (const { name } of listed.keys) all.push(...(await read(name.slice(QUEUE_KV_PREFIX.length))));
      return all;
    },
    async addFindings(added) {
      for (const [channel, findings] of byChannel(added, (f) => f.evidence.channel)) {
        await write(channel, mergeFindings(await read(channel), findings));
      }
    },
    async removeFindings(ids) {
      // A finding's id leads with its channel (`PendingFinding.id`).
      for (const [channel, gone] of byChannel(ids, (id) => id.slice(0, id.indexOf(":")))) {
        const drop = new Set(gone);
        await write(channel, (await read(channel)).filter((f) => !drop.has(f.id)));
      }
    },
    async saveCard(snapshot) {
      charge(1, "kv");
      await kv.put(`${CARD_KV_PREFIX}${snapshot.key}`, JSON.stringify(snapshot), { expirationTtl: QUEUE_TTL_SECONDS });
    },
    async cardSnapshot(cardKey) {
      charge(1, "kv");
      return (await kv.get<CardSnapshot>(`${CARD_KV_PREFIX}${cardKey}`, "json")) ?? null;
    },
    async dropCard(cardKey) {
      charge(1, "kv");
      await kv.delete(`${CARD_KV_PREFIX}${cardKey}`);
    },
  };
}
