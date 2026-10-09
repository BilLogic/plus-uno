// A whole sweep, in memory: a fake Slack workspace, fake linked sources, the
// real detector over recorded model replies, the in-memory sweep store, the
// real card renderer, and an in-memory ThreadState the cards are staged in.
//
// What a test sees is what a person would: the messages posted, where, and
// what they say; the cards staged and who may confirm them; the rows the store
// holds.
import { fakeProvider, type FakeProvider } from "../../src/agent/providers/fake";
import { SubrequestBudgetError } from "../../src/net";
import { ownBlocksOf, proposalCardBlocks, renderProposalCard } from "../../src/slack/proposal-render";
import {
  createInMemorySweepStore,
  modelDriftDetector,
  stageSweepCard,
  sweepCardState,
  type ChannelKind,
  type InMemorySweepStore,
  type SweepDeps,
  type SweepSlackMessage,
  type SweepSource,
} from "../../src/sweep/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../../src/thread-state/index";
import { modelCaptureDetector } from "../../src/sweep/capture-detector";
import type { EditedRecordRow, RecordComment } from "../../src/sweep/records";
import type { SearchHit } from "../../src/sweep/search";
import { createInMemoryProposalEventLog, type InMemoryProposalEventLog } from "../../src/usage/index";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../../src/usage/index";
import type { InMemoryFigma } from "../../src/figma/in-memory";
import type { TeamRoles } from "../../src/usage/roles";
import { modelDecisionDetector } from "../../src/figma-comments/detector";
import type { DecisionThread, QueuedFile, SweepFigmaComments } from "../../src/figma-comments/queue";

export const DESIGN = "C0DESIGN";
export const UNIVERSAL = "C0UNIVERSAL";
export const UNO_BOT = "C0UNOBOT";
export const BOT = "U0BOT";
export const NOTES_DB = "3ee43141b0ce4517badccb52a7b97bdb";
export const ROADMAP_DB = "2fc012411bb54770af51d5a050bddb75";

/** A Slack ts on 2026-09-`day` at hh:mm UTC (2026-09-29 is a Tuesday). */
export function ts(day: number, hh: number, mm = 0, seq = 0): string {
  return `${Date.UTC(2026, 8, day, hh, mm) / 1000}.${String(seq).padStart(6, "0")}`;
}

/** Epoch ms on 2026-09-`day` (or into October past 30) at hh:mm UTC. */
export function at(day: number, hh: number, mm = 0): number {
  return Date.UTC(2026, 8, day, hh, mm);
}

/** Epoch ms as its UTC date, `YYYY-MM-DD` — a run's date, for a test whose
 *  run is the day its clock reads. */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function notionPage(id: string, over: Partial<SweepSource> = {}): SweepSource {
  return {
    url: `https://www.notion.so/${id}`,
    kind: "notion",
    writable: true,
    title: `Page ${id.slice(0, 4)}`,
    blocks: [
      { id: `${id}-b1`, lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Launch date: October 15" },
      { id: `${id}-b2`, lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Owner: design team" },
    ],
    text: "Launch date: October 15\nOwner: design team",
    pillars: [],
    contributors: [],
    // A top-level workspace page: no database's row.
    parentDatabaseId: null,
    parentType: "workspace",
    ...over,
  };
}

/** One recorded detector finding, in the reply's own shape. */
export function drift(o: {
  source: SweepSource;
  block?: string;
  evidence: string[];
  claimedBy?: string | null;
  replacement?: string;
  confidence?: number;
}): Record<string, unknown> {
  return {
    source_url: o.source.url,
    block_id: o.block ?? o.source.blocks[0]?.id ?? null,
    source_says: "Launch is October 15.",
    thread_says: "Launch moved to November 1.",
    replacement: o.replacement ?? "Launch date: November 1",
    evidence_ts: o.evidence,
    claimed_by: o.claimedBy ?? null,
    confidence: o.confidence ?? 0.9,
  };
}

export function reply(...findings: Record<string, unknown>[]): string {
  return JSON.stringify({ findings });
}

export interface FakeChannel {
  kind: ChannelKind;
  /** Top-level messages, as history returns them. */
  history: SweepSlackMessage[];
  /** Thread messages by root ts, root first. */
  threads?: Record<string, SweepSlackMessage[]>;
  /** Its members, as `conversations.members` lists them; absent, the read fails. */
  members?: string[];
  /** Its history read throws, as a failure no budget explains would. */
  fails?: boolean;
}

export interface SweepHarness {
  deps: SweepDeps;
  store: InMemorySweepStore;
  threadState: ThreadState;
  /** The usage record's proposal events, which staging writes to. */
  proposalEvents: InMemoryProposalEventLog;
  provider: FakeProvider;
  /** Detector replies not yet used. */
  replies: string[];
  /** Every card posted, with the key it was tagged with; `withdrawn` holds
   *  the text a withdrawn card was edited to. */
  posted: Array<{
    channel: string;
    threadTs: string | null;
    text: string;
    /** The blocks the card was posted with. */
    blocks: unknown[];
    ts: string;
    cardKey: string;
    digest: string;
    withdrawn?: string;
  }>;
  staged: PendingProposal[];
  /** Every Slack read, as `method channel [ts]`. */
  reads: string[];
  clock: { now: number };
  /** Replies calls left before the budget stops the job; Infinity for none. */
  budget: { replies: number };
  /** Source URLs whose read throws, as a Notion 5xx would. */
  broken: Set<string>;
  /** Source URLs whose read Notion answers with a 429. */
  rateLimited: Set<string>;
  /** What the meter says is left; Infinity for no limit. */
  headroom: { subrequests: number; d1Queries: number };
  /** One-shot faults: each, when set, is thrown by the next call of its kind
   *  and cleared. */
  faults: { post?: Error; stage?: Error; afterStage?: Error; addItems?: Error; markPosted?: Error };
  /** Threads marked as entered through a sweep card, as `channel:thread`. */
  marked: Set<string>;
  /** Morning searches for a posted card left that answer "unknown", as a
   *  failed Slack read would. */
  unknownSearches: { left: number };
  /** Every source read, by URL, in order. */
  sourceReads: string[];
  /** Every search, as `notion <query>` or `github <query>`. */
  searches: string[];
  /** The Figma comment jobs' own records, when `figma` is wired. */
  figma: FigmaRecords;
}

/** What the Figma comment jobs keep, in memory. */
export interface FigmaRecords {
  queue: Map<string, QueuedFile>;
  carded: Set<string>;
  misc: { files: string[]; at: number } | null;
  threads: Map<string, DecisionThread>;
  /** Every message the post sent to #plus-design, in order; `edited` holds a later edit. */
  messages: Array<{ ts: string; text: string; threadTs: string | null; blocks?: unknown[]; edited?: string }>;
  /** Every KV note prefix listed, in order. */
  listed: string[];
}

export function sweepHarness(opts: {
  channels: Record<string, FakeChannel>;
  sources?: SweepSource[];
  detectorReplies?: string[];
  people?: Record<string, string>;
  now: number;
  /** The date of the run the jobs were queued under; unset, the clock's UTC
   *  date whenever it is read. */
  runDate?: string;
  dryRun?: boolean;
  store?: InMemorySweepStore;
  threadState?: ThreadState;
  /** Messages per `conversations.history` / `.replies` page; all on one page
   *  when unset. */
  pageSize?: number;
  /** `SLACK_SEARCH_PRIVATE_ALLOWLIST`: the private channels the sweep may read. */
  privateAllowlist?: string[];
  /** The group DMs uno-bot is in, as the bot's own conversation list names
   *  them; null when that list cannot be read. Unset, none. */
  groupDms?: string[] | null;
  /** Search results by query; a query not listed finds nothing. Unset, the
   *  sweep has no search wired. */
  search?: Record<string, SearchHit[]>;
  /** Wire the Capture detectors (answers, notes and cards) over the same
   *  recorded replies as the drift detector, in call order. */
  capture?: boolean;
  /** The running-notes and Roadmap rows edited since any cursor, and each
   *  card's comments by page id. Unset, those reads are not wired. */
  notion?: {
    notes?: EditedRecordRow[];
    cards?: EditedRecordRow[];
    comments?: Record<string, RecordComment[]>;
    /** Rows per query page; 25 unless set. */
    pageSize?: number;
  };
  /** The Figma comment jobs: the shared fake Figma, the route's KV notes, the
   *  Roadmap's cards by number, and #plus-design's members (null when they
   *  cannot be read). The detector answers from the same recorded replies.
   *  Unset, those jobs skip. */
  figma?: {
    client: InMemoryFigma;
    notes?: Array<{ key: string; at: string | null }>;
    cards?: Record<number, { url: string; title: string }>;
    miscTeamId?: string;
    members?: string[] | null;
    /** The team's roles by Slack id: who is a designer. None unless set. */
    roles?: TeamRoles;
  };
}): SweepHarness {
  const clock = { now: opts.now };
  const store = opts.store ?? createInMemorySweepStore();
  const threadState = opts.threadState ?? createInMemoryThreadState({ now: () => clock.now });
  const proposalEvents = createInMemoryProposalEventLog();
  // Recorded replies, in order; a test may add the next night's before running it.
  const replies = [...(opts.detectorReplies ?? [])];
  const base = fakeProvider();
  const provider: FakeProvider = {
    ...base,
    async generate(prompt) {
      (base.generated as unknown[]).push(prompt);
      const next = replies.shift() ?? "";
      // A recorded reply of `FAIL: <message>` is the model call failing.
      if (next.startsWith("FAIL: ")) return { ok: false, model: "recorded", message: next.slice(6) };
      return { ok: true, model: "recorded", text: next };
    },
  };
  const posted: SweepHarness["posted"] = [];
  const staged: PendingProposal[] = [];
  const reads: string[] = [];
  const budget = { replies: Infinity };
  const headroom = { subrequests: Infinity, d1Queries: Infinity };
  const broken = new Set<string>();
  const rateLimited = new Set<string>();
  const marked = new Set<string>();
  const unknownSearches = { left: 0 };
  const faults: SweepHarness["faults"] = {};
  const pageSize = opts.pageSize ?? Infinity;
  const page = <T>(list: T[], cursor: string | undefined): { messages: T[]; nextCursor?: string } => {
    const from = Number(cursor ?? 0);
    const to = from + pageSize;
    return { messages: list.slice(from, to), ...(to < list.length ? { nextCursor: String(to) } : {}) };
  };
  const once = (kind: keyof SweepHarness["faults"]): void => {
    const err = faults[kind];
    if (err) {
      delete faults[kind];
      throw err;
    }
  };
  const records = store;
  const faultyStore: InMemorySweepStore = {
    ...records,
    async addItems(items) {
      once("addItems");
      return records.addItems(items);
    },
    async markPosted(cardKey, proposalTs, at) {
      once("markPosted");
      return records.markPosted(cardKey, proposalTs, at);
    },
  };
  const sources = new Map((opts.sources ?? []).map((s) => [s.url, s] as const));
  const sourceReads: string[] = [];
  const searches: string[] = [];
  let nextTs = 0;
  const figmaRecords: FigmaRecords = { queue: new Map(), carded: new Set(), misc: null, threads: new Map(), messages: [], listed: [] };
  const figmaComments: SweepFigmaComments | undefined = opts.figma
    ? {
        figma: opts.figma.client,
        notes: {
          async list(prefix) {
            figmaRecords.listed.push(prefix);
            return (opts.figma!.notes ?? []).filter((n) => n.key.startsWith(prefix));
          },
        },
        async card(number) {
          return opts.figma!.cards?.[number] ?? null;
        },
        roles: async () => opts.figma!.roles ?? {},
        detector: modelDecisionDetector(provider),
        ...(opts.figma.miscTeamId ? { miscTeamId: opts.figma.miscTeamId } : {}),
        queue: {
          list: async () => [...figmaRecords.queue.values()].map((f) => structuredClone(f)),
          read: async (fileKey) => structuredClone(figmaRecords.queue.get(fileKey) ?? null),
          write: async (file) => void figmaRecords.queue.set(file.fileKey, structuredClone(file)),
          remove: async (fileKey) => void figmaRecords.queue.delete(fileKey),
        },
        carded: {
          has: async (id) => figmaRecords.carded.has(id),
          add: async (ids) => ids.forEach((id) => figmaRecords.carded.add(id)),
        },
        misc: {
          read: async () => structuredClone(figmaRecords.misc),
          write: async (value) => void (figmaRecords.misc = structuredClone(value)),
        },
        slack: {
          channel: DESIGN,
          async post(message) {
            once("post");
            nextTs += 1;
            const ts = `${Math.floor(clock.now / 1000)}.${String(800000 + nextTs)}`;
            figmaRecords.messages.push({ ts, text: message.text, threadTs: message.thread_ts ?? null, ...(message.blocks ? { blocks: message.blocks } : {}) });
            return { ok: true, ts };
          },
          async edit(ts, message) {
            const m = figmaRecords.messages.find((x) => x.ts === ts);
            if (m) m.edited = message.text;
          },
          members: async () => (opts.figma!.members === undefined ? [] : opts.figma!.members),
          async stage(proposal) {
            once("stage");
            staged.push(proposal);
            const { retired } = await threadState.putProposal(proposal);
            await recordProposalEvents(proposalEvents, [
              ...supersededEvents(retired, clock.now, "worker"),
              stagedEvent({ proposal, at: clock.now, via: "worker", channelStored: true }),
            ]);
          },
        },
        threads: {
          read: async (ts) => structuredClone(figmaRecords.threads.get(ts) ?? null),
          write: async (thread) => void figmaRecords.threads.set(thread.ts, structuredClone(thread)),
        },
      }
    : undefined;

  const deps: SweepDeps = {
    slack: {
      async channelKind(channel) {
        reads.push(`info ${channel}`);
        return opts.channels[channel]?.kind ?? null;
      },
      async history(channel, oldest, cursor) {
        reads.push(`history ${channel}`);
        const c = opts.channels[channel];
        if (!c) return null;
        if (c.fails) throw new Error(`history of ${channel} blew up`);
        return page(c.history.filter((m) => Number(m.ts) > Number(oldest)), cursor);
      },
      async replies(channel, rootTs, cursor) {
        reads.push(`replies ${channel} ${rootTs}`);
        if (budget.replies <= 0) throw new SubrequestBudgetError(38);
        budget.replies -= 1;
        const thread = opts.channels[channel]?.threads?.[rootTs];
        return thread ? page(thread, cursor) : null;
      },
      async members(channel) {
        reads.push(`members ${channel}`);
        return opts.channels[channel]?.members ?? null;
      },
      async groupDms() {
        reads.push("group-dms");
        return opts.groupDms === undefined ? [] : opts.groupDms;
      },
    },
    sources: {
      async read(url) {
        sourceReads.push(url);
        // What a complete read throws when the page's blocks page fails.
        if (broken.has(url)) throw new Error("Notion 503 service_unavailable: slow down");
        if (rateLimited.has(url)) throw new Error("Notion 429 rate_limited: slow down");
        return sources.get(url) ?? null;
      },
    },
    people: {
      async slackIdFor(name) {
        return opts.people?.[name] ?? null;
      },
    },
    detector: modelDriftDetector(provider),
    ...(opts.capture ? { capture: modelCaptureDetector(provider) } : {}),
    ...(opts.search
      ? {
          search: {
            async notion(query: string) {
              searches.push(`notion ${query}`);
              return (opts.search![query] ?? []).filter((h) => h.kind === "notion");
            },
            async github(query: string) {
              searches.push(`github ${query}`);
              return (opts.search![query] ?? []).filter((h) => h.kind !== "notion");
            },
          },
        }
      : {}),
    ...(opts.notion
      ? {
          notion: {
            // Notion's own shape: rows at or after the cursor, oldest edit
            // first, one page at a time, `next` naming where the next starts.
            async edited(databaseId: string, since: string, after?: string) {
              const all = (databaseId === NOTES_DB ? (opts.notion!.notes ?? []) : (opts.notion!.cards ?? []))
                .filter((r) => r.lastEditedTime >= since)
                .sort((a, b) => a.lastEditedTime.localeCompare(b.lastEditedTime));
              const size = opts.notion!.pageSize ?? 25;
              const from = after ? Number(after) : 0;
              const more = from + size < all.length;
              return { rows: all.slice(from, from + size), more, next: more ? String(from + size) : null };
            },
            async comments(pageId: string) {
              return opts.notion!.comments?.[pageId] ?? [];
            },
          },
        }
      : {}),
    ...(figmaComments ? { figmaComments } : {}),
    store: faultyStore,
    delivery: {
      render(card) {
        const rendered = renderProposalCard(card);
        return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
      },
      async post(to, card, tag) {
        nextTs += 1;
        const ts = `${Math.floor(clock.now / 1000)}.${String(900000 + nextTs)}`;
        posted.push({ channel: to.channel, threadTs: to.threadTs, text: card.text, blocks: card.blocks, ts, cardKey: tag.cardKey, digest: tag.digest });
        // A stop after Slack took the post, before the job heard back.
        once("post");
        const own = ownBlocksOf(card);
        return { ok: true, ts, ...(own ? { blocks: own } : {}) };
      },
      async findPosted(to, cardKey) {
        if (unknownSearches.left > 0) {
          unknownSearches.left -= 1;
          return { state: "unknown", why: "Slack said ratelimited" };
        }
        const hit = posted.find((p) => p.channel === to.channel && p.threadTs === to.threadTs && p.cardKey === cardKey);
        return hit ? { state: "found", ts: hit.ts, text: hit.text, digest: hit.digest } : { state: "absent" };
      },
      async stage(proposal, channelKind) {
        once("stage");
        staged.push(proposal);
        // The production staging: the card, and its rows on the usage record.
        await stageSweepCard(
          proposal,
          { threadState, proposalEvents, markThread: async (channel, thread) => void marked.add(`${channel}:${thread}`) },
          clock.now,
          channelKind,
        );
        // A stop after the card is in ThreadState, before the job heard back.
        once("afterStage");
      },
      async cardState(proposalTs) {
        return sweepCardState(proposalTs, { threadState, proposalEvents });
      },
      async liveCards(channel) {
        return (await threadState.getProposalsByChannel(channel)).filter((p) => !!p.sweepRun);
      },
      async withdraw(channel, messageTs, text, cardKey) {
        await threadState.retireProposal(messageTs);
        const card = posted.find((p) => p.channel === channel && p.ts === messageTs);
        if (card) {
          card.withdrawn = text;
          // Retagged, as the real edit does: a search by its key passes it over.
          card.cardKey = `withdrawn:${cardKey}`;
        }
      },
      async permalink(channel, messageTs) {
        return `https://plus.slack.com/archives/${channel}/p${messageTs.replace(".", "")}`;
      },
    },
    config: {
      plusDesign: DESIGN,
      plusUniversal: UNIVERSAL,
      unoBot: UNO_BOT,
      botUserId: BOT,
      runningNotesDb: NOTES_DB,
      roadmapDb: ROADMAP_DB,
      teamSurfaceDbs: [ROADMAP_DB],
      ...(opts.privateAllowlist ? { privateAllowlist: opts.privateAllowlist } : {}),
    },
    meter: { subrequests: () => 0, d1Queries: () => 0, headroom: () => ({ ...headroom }) },
    now: () => clock.now,
    get runDate() {
      return opts.runDate ?? utcDay(clock.now);
    },
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  return {
    deps,
    store,
    threadState,
    proposalEvents,
    provider,
    replies,
    posted,
    staged,
    reads,
    clock,
    budget,
    headroom,
    faults,
    broken,
    rateLimited,
    marked,
    unknownSearches,
    sourceReads,
    searches,
    figma: figmaRecords,
  };
}

/** A human message. */
export function msg(user: string, when: string, text: string, over: Partial<SweepSlackMessage> = {}): SweepSlackMessage {
  return { ts: when, user, text, ...over };
}
