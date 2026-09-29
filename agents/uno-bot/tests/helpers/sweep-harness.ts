// A whole sweep, in memory: a fake Slack workspace, fake linked sources, the
// real detector over recorded model replies, the in-memory sweep store, the
// real card renderer, and an in-memory ThreadState the cards are staged in.
//
// What a test sees is what a person would: the messages posted, where, and
// what they say; the cards staged and who may confirm them; the rows the store
// holds.
import { fakeProvider, type FakeProvider } from "../../src/agent/providers/fake";
import { SubrequestBudgetError } from "../../src/net";
import { proposalCardBlocks, renderProposalCard } from "../../src/slack/proposal-render";
import {
  createInMemorySweepStore,
  modelDriftDetector,
  type ChannelKind,
  type InMemorySweepStore,
  type SweepDeps,
  type SweepSlackMessage,
  type SweepSource,
} from "../../src/sweep/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../../src/thread-state/index";

export const DESIGN = "C0DESIGN";
export const UNIVERSAL = "C0UNIVERSAL";
export const UNO_BOT = "C0UNOBOT";
export const BOT = "U0BOT";

/** A Slack ts on 2026-09-`day` at hh:mm UTC (2026-09-29 is a Tuesday). */
export function ts(day: number, hh: number, mm = 0, seq = 0): string {
  return `${Date.UTC(2026, 8, day, hh, mm) / 1000}.${String(seq).padStart(6, "0")}`;
}

/** Epoch ms on 2026-09-`day` (or into October past 30) at hh:mm UTC. */
export function at(day: number, hh: number, mm = 0): number {
  return Date.UTC(2026, 8, day, hh, mm);
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
}

export interface SweepHarness {
  deps: SweepDeps;
  store: InMemorySweepStore;
  threadState: ThreadState;
  provider: FakeProvider;
  /** Detector replies not yet used. */
  replies: string[];
  /** Every card posted, with the key it was tagged with; `withdrawn` holds
   *  the text a withdrawn card was edited to. */
  posted: Array<{ channel: string; threadTs: string | null; text: string; ts: string; cardKey: string; withdrawn?: string }>;
  staged: PendingProposal[];
  /** Every Slack read, as `method channel [ts]`. */
  reads: string[];
  clock: { now: number };
  /** Replies calls left before the budget stops the job; Infinity for none. */
  budget: { replies: number };
  /** Source URLs whose read throws, as a Notion 5xx would. */
  broken: Set<string>;
  /** What the meter says is left; Infinity for no limit. */
  headroom: { subrequests: number; d1Queries: number };
  /** One-shot faults: each, when set, is thrown by the next call of its kind
   *  and cleared. */
  faults: { post?: Error; stage?: Error; addItems?: Error };
}

export function sweepHarness(opts: {
  channels: Record<string, FakeChannel>;
  sources?: SweepSource[];
  detectorReplies?: string[];
  people?: Record<string, string>;
  now: number;
  dryRun?: boolean;
  store?: InMemorySweepStore;
  threadState?: ThreadState;
  /** Messages per `conversations.history` / `.replies` page; all on one page
   *  when unset. */
  pageSize?: number;
}): SweepHarness {
  const clock = { now: opts.now };
  const store = opts.store ?? createInMemorySweepStore();
  const threadState = opts.threadState ?? createInMemoryThreadState({ now: () => clock.now });
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
  };
  const sources = new Map((opts.sources ?? []).map((s) => [s.url, s] as const));
  let nextTs = 0;

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
        return page(c.history.filter((m) => Number(m.ts) > Number(oldest)), cursor);
      },
      async replies(channel, rootTs, cursor) {
        reads.push(`replies ${channel} ${rootTs}`);
        if (budget.replies <= 0) throw new SubrequestBudgetError(38);
        budget.replies -= 1;
        const thread = opts.channels[channel]?.threads?.[rootTs];
        return thread ? page(thread, cursor) : null;
      },
    },
    sources: {
      async read(url) {
        if (broken.has(url)) throw new Error("Notion 503: service unavailable");
        return sources.get(url) ?? null;
      },
    },
    people: {
      async slackIdFor(name) {
        return opts.people?.[name] ?? null;
      },
    },
    detector: modelDriftDetector(provider),
    store: faultyStore,
    delivery: {
      render(card) {
        const rendered = renderProposalCard(card);
        return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
      },
      async post(to, card, cardKey) {
        nextTs += 1;
        const ts = `${Math.floor(clock.now / 1000)}.${String(900000 + nextTs)}`;
        posted.push({ channel: to.channel, threadTs: to.threadTs, text: card.text, ts, cardKey });
        // A stop after Slack took the post, before the job heard back.
        once("post");
        return { ok: true, ts };
      },
      async findPosted(to, cardKey) {
        const hit = posted.filter((p) => p.channel === to.channel && p.threadTs === to.threadTs && p.cardKey === cardKey).at(-1);
        return hit ? { ts: hit.ts, text: hit.text } : null;
      },
      async stage(proposal) {
        once("stage");
        staged.push(proposal);
        await threadState.putProposal(proposal);
      },
      async withdraw(channel, messageTs, text, cardKey) {
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
    config: { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: UNO_BOT, botUserId: BOT },
    meter: { subrequests: () => 0, d1Queries: () => 0, headroom: () => ({ ...headroom }) },
    now: () => clock.now,
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  return { deps, store, threadState, provider, replies, posted, staged, reads, clock, budget, headroom, faults, broken };
}

/** A human message. */
export function msg(user: string, when: string, text: string, over: Partial<SweepSlackMessage> = {}): SweepSlackMessage {
  return { ts: when, user, text, ...over };
}
