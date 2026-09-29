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
  posted: Array<{ channel: string; threadTs: string | null; text: string }>;
  staged: PendingProposal[];
  /** Every Slack read, as `method channel [ts]`. */
  reads: string[];
  clock: { now: number };
  /** Replies calls left before the budget stops the job; Infinity for none. */
  budget: { replies: number };
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
      return { ok: true, model: "recorded", text: replies.shift() ?? "" };
    },
  };
  const posted: SweepHarness["posted"] = [];
  const staged: PendingProposal[] = [];
  const reads: string[] = [];
  const budget = { replies: Infinity };
  const sources = new Map((opts.sources ?? []).map((s) => [s.url, s] as const));
  let nextTs = 0;

  const deps: SweepDeps = {
    slack: {
      async channelKind(channel) {
        reads.push(`info ${channel}`);
        return opts.channels[channel]?.kind ?? null;
      },
      async history(channel, oldest) {
        reads.push(`history ${channel}`);
        const c = opts.channels[channel];
        if (!c) return null;
        return { messages: c.history.filter((m) => Number(m.ts) > Number(oldest)) };
      },
      async replies(channel, rootTs) {
        reads.push(`replies ${channel} ${rootTs}`);
        if (budget.replies <= 0) throw new SubrequestBudgetError(38);
        budget.replies -= 1;
        return opts.channels[channel]?.threads?.[rootTs] ?? null;
      },
    },
    sources: {
      async read(url) {
        return sources.get(url) ?? null;
      },
    },
    people: {
      async slackIdFor(name) {
        return opts.people?.[name] ?? null;
      },
    },
    detector: modelDriftDetector(provider),
    store,
    delivery: {
      render(card) {
        const rendered = renderProposalCard(card);
        return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
      },
      async post(to, card) {
        posted.push({ channel: to.channel, threadTs: to.threadTs, text: card.text });
        nextTs += 1;
        return { ok: true, ts: `${Math.floor(clock.now / 1000)}.${String(900000 + nextTs)}` };
      },
      async stage(proposal) {
        staged.push(proposal);
        await threadState.putProposal(proposal);
      },
      async permalink(channel, messageTs) {
        return `https://plus.slack.com/archives/${channel}/p${messageTs.replace(".", "")}`;
      },
    },
    config: { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: UNO_BOT, botUserId: BOT },
    now: () => clock.now,
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  return { deps, store, threadState, provider, replies, posted, staged, reads, clock, budget };
}

/** A human message. */
export function msg(user: string, when: string, text: string, over: Partial<SweepSlackMessage> = {}): SweepSlackMessage {
  return { ts: when, user, text, ...over };
}
