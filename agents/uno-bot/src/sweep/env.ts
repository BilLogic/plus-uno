// The sweep on `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • Slack reads: `conversations.info` for the channel's kind, and
//     `conversations.history` / `.replies` with the bot token.
//   • Source reads: Notion through `readNotionPage`, which keeps each block's
//     id and `last_edited_time` for the replace; GitHub, Figma and canvases
//     through `source_read`'s own executor, as read-only context.
//   • People: a Contributor's name through the Slack directory lookup the
//     relayed DM uses — one exact match or nobody.
//   • The detector: `selectProvider(env)`, the Worker's one ModelProvider.
//   • The store: the records in the usage database (`USAGE_DB`), the queue in
//     HARNESS_KV, one key per channel under `sweep:findings:`. Each channel's
//     job writes only its own key, so two end-of-day jobs a few seconds apart
//     never overwrite each other's findings through KV's eventual consistency.
//     A finding older than 30 days is dropped as the queue is read.
//   • Delivery: `chat.postMessage` in the destination, the card rendered by the
//     proposal renderer and tagged with its key in message metadata, and
//     `ThreadState.putProposal`. A card is found again by that tag
//     (`include_all_metadata`), and withdrawn with `chat.update`.
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
import { canonicalNotionUrl, parseNotionPageId, readNotionPage, stripBlockPrefix } from "../integrations/notion";
import {
  conversationsHistorySince,
  conversationsInfo,
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
import { executeReadSource } from "../tools/read-source";
import { findSlackUsers, slackDirectoryFor } from "../tools/slack-people";
import type { ScheduledJob } from "../scheduled/runs";
import type { OperationOutcome } from "../gate/index";
import type { PendingProposal } from "../thread-state/index";
import { modelDriftDetector } from "./detector";
import { createD1SweepRecords } from "./d1";
import { recordSweepResolution, recordSweepRestage, recordSweepRevision } from "./outcomes";
import type { ChannelKind, SweepSource, TargetKind } from "./finding";
import { SWEEP_CARD_EVENT, WITHDRAWN_SWEEP_CARD_EVENT } from "./cards";
import { runSweepJob, type SweepDeps, type SweepJobReport } from "./run";
import { mergeFindings, type FindingQueue, type PendingFinding, type SweepStore } from "./store";

/** One key per channel: `sweep:findings:<channel>`. */
const QUEUE_KV_PREFIX = "sweep:findings:";
/** A finding not posted within 30 days is dropped as the queue is read — long
 *  enough for a busy thread's overflow to wait out several live cards; a fix
 *  that old whose block has moved is refused at the write anyway (ADR-029). */
const QUEUE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** The key itself outlives its newest finding by the same week. */
const QUEUE_TTL_SECONDS = QUEUE_MAX_AGE_MS / 1000;
const CONTEXT_TEXT_CAP = 4_000;
/** Pages read looking for a card by its tag. */
const FIND_PAGES = 3;

/**
 * One sweep job on `Env`.
 *
 * @param env - Worker bindings
 * @param job - A `sweep-channel` or `sweep-post` job
 * @param opts - `dryRun` reads and detects, and writes, posts and stages nothing
 */
export async function runSweepJobOnEnv(env: Env, job: ScheduledJob, opts: { dryRun: boolean }): Promise<SweepJobReport | { summary: string }> {
  if (!env.USAGE_DB || !env.HARNESS_KV) {
    // No cursor store means every run would re-read the day; nothing is safer.
    return { summary: "USAGE_DB or HARNESS_KV not bound — the sweep did nothing" };
  }
  const deps = await sweepDepsFor(env, env.USAGE_DB, env.HARNESS_KV, opts);
  return runSweepJob(job, deps);
}

async function sweepDepsFor(
  env: Env,
  db: D1Database,
  kv: KVNamespace,
  opts: { dryRun: boolean },
): Promise<SweepDeps> {
  const provider = selectProvider(env);
  const detector = modelDriftDetector(provider);
  const store: SweepStore = { ...createD1SweepRecords({ db }), ...kvQueue(kv) };
  const directory = slackDirectoryFor(env);
  const bot = await measured(() => getBotIdentity(env));
  return {
    slack: {
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
    },
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
      async post(to, card, cardKey) {
        const metadata = tagOf(cardKey);
        for (const text of card.followUp ?? []) {
          const sent = await postMessage(env, { channel: to.channel, text, metadata, ...(to.threadTs ? { thread_ts: to.threadTs } : {}) });
          // A card whose plan did not go up ahead of it is not posted at all.
          if (!sent.ok) return { ok: false };
        }
        const res = await postMessage(env, {
          channel: to.channel,
          text: card.text,
          blocks: card.blocks,
          metadata,
          ...(to.threadTs ? { thread_ts: to.threadTs } : {}),
        });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async findPosted(to, cardKey, since) {
        const isCard = (m: { metadata?: SlackMessageMetadata }) =>
          m.metadata?.event_type === SWEEP_CARD_EVENT && m.metadata.event_payload.card_key === cardKey;
        let cursor: string | undefined;
        for (let i = 0; i < FIND_PAGES; i++) {
          const res = to.threadTs
            ? await measured(() =>
                conversationsReplies(env, to.channel, to.threadTs!, 200, { includeMetadata: true, ...(cursor ? { cursor } : {}) }),
              )
            : await measured(() => conversationsHistorySince(env, to.channel, since, cursor, { includeMetadata: true }));
          if (!res.ok) return null;
          // The card is the last message with the tag: follow-ups go first.
          const hit = [...(res.messages ?? [])].filter(isCard).sort((a, b) => Number(b.ts) - Number(a.ts))[0];
          if (hit) return { ts: hit.ts, text: hit.text ?? "" };
          cursor = res.response_metadata?.next_cursor;
          if (!cursor) return null;
        }
        return null;
      },
      stage: (proposal) => threadStateFor(env).putProposal(proposal),
      async withdraw(channel, ts, text, cardKey) {
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
    },
    meter: { subrequests: subrequestsUsed, d1Queries: d1QueriesUsed, headroom: budgetHeadroom },
    now: () => Date.now(),
    dryRun: opts.dryRun,
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

/** The tag a sweep card carries in Slack's message metadata. */
function tagOf(cardKey: string): SlackMessageMetadata {
  return { event_type: SWEEP_CARD_EVENT, event_payload: { card_key: cardKey } };
}

/** A read that tripped the budget is the budget stop, whatever it returned. */
async function measured<T>(fn: () => Promise<T>): Promise<T> {
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

/** One linked source, read; null when it could not be. */
async function readSource(env: Env, url: string, kind: TargetKind): Promise<SweepSource | null> {
  if (kind === "notion") {
    const pageId = parseNotionPageId(url);
    if (!pageId) return null;
    try {
      const page = await readNotionPage(env, pageId);
      return {
        url: canonicalNotionUrl(url),
        kind,
        writable: true,
        title: page.title,
        // The block's own text, without the list or to-do mark its rendered
        // line leads with: what a replace writes back is this text.
        blocks: page.blocks.map((b) => ({ id: b.id, lastEditedTime: b.lastEditedTime, text: stripBlockPrefix(b.type, b.text) })),
        text: page.text.slice(0, CONTEXT_TEXT_CAP),
        pillars: splitList(page.properties["Product Pillar"]),
        contributors: page.people["Contributor"] ?? [],
      };
    } catch (err) {
      if (err instanceof SubrequestBudgetError) throw err;
      console.warn(`[sweep] Notion page unread: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
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
  };
}
