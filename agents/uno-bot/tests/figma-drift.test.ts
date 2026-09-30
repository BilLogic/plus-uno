// File drift, a day at a time: the end-of-day sweep finds a decision a Figma
// file (or code) may not show yet, the weekday morning run asks the thread
// "is the Figma up to date?" with a drafted intake, and a "yes" withdraws it.
//
// The night runs through the sweep harness — its fake Slack, the real
// detector over recorded replies — with the in-memory drift store as its
// sink. The morning runs `runDriftAsks` against a small Slack of its own and
// the same in-memory ThreadState and usage record the harness stages into.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import type { ScheduledJob } from "../src/scheduled/runs";
import { DRIFT_DETECTOR_SYSTEM, runSweepJob, stageSweepCard, type SweepSlackMessage, type SweepSource } from "../src/sweep/index";
import { createInMemoryDriftStore, type InMemoryDriftStore } from "../src/figma-drift/in-memory";
import {
  answerDriftAsk,
  isDriftAnswerCandidate,
  runDriftAsks,
  type DriftAnswerDeps,
  type DriftPostDeps,
} from "../src/figma-drift/run";
import { askLine, DRIFT_CARD_TTL_MS, isUpToDateReply, publisherLine, upToDateAnswer } from "../src/figma-drift/copy";
import { fileKeyOfOperation, githubInert, matchPillar, NEUTRAL_SETTLED } from "../src/figma-drift/draft";
import { DRIFT_KEY, fileKeyOf } from "../src/figma-drift/finding";
import { proposalReplyThread } from "../src/thread-state/index";
import { proposalEvent, recordProposalEvents } from "../src/usage/index";
import { at, DESIGN, msg, notionPage, sweepHarness, ts, UNO_BOT, type SweepHarness } from "./helpers/sweep-harness";

const EOD: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const MORNING = { key: "figma-drift-post" };

const FILE_KEY = "AbC123xyz";
/** A Figma file, read-only, as the sweep reads a node link. */
function figmaFile(node: string, over: Partial<SweepSource> = {}): SweepSource {
  return {
    url: `https://www.figma.com/design/${FILE_KEY}/Session-Recap?node-id=${node}`,
    kind: "figma",
    writable: false,
    title: "Session Recap",
    blocks: [],
    text: "Recap\nShare with tutor",
    pillars: [],
    contributors: [],
    ...over,
  };
}
const FIGMA_A = figmaFile("1-2");
const FIGMA_B = figmaFile("3-4");

/** One recorded read-only finding. */
function fileDrift(source: SweepSource, evidence: string[], claimedBy: string | null = null): Record<string, unknown> {
  return {
    source_url: source.url,
    block_id: null,
    source_says: "The recap screen has a Share with tutor button.",
    thread_says: "The recap drops the Share button; tutors see it automatically.",
    replacement: "",
    evidence_ts: evidence,
    claimed_by: claimedBy,
    confidence: 0.9,
  };
}
const reply = (...findings: Record<string, unknown>[]) => JSON.stringify({ findings });

/** A thread whose root links `urls`, then replies. */
function thread(root: { user: string; when: string; urls: string[] }, replies: Array<{ user: string; when: string; text?: string }>) {
  const rootMsg = msg(root.user, root.when, `Recap flow: ${root.urls.map((u) => `<${u}|link>`).join(" ")}`, {
    ...(replies.length ? { reply_count: replies.length, latest_reply: replies[replies.length - 1]!.when } : {}),
  });
  const all: SweepSlackMessage[] = [
    rootMsg,
    ...replies.map((r) => msg(r.user, r.when, r.text ?? "Agreed, drop the Share button.", { thread_ts: root.when })),
  ];
  return { root: rootMsg, messages: all };
}

/** The night: the sweep harness with the drift store as its sink. */
function night(opts: {
  threads: ReturnType<typeof thread>[];
  sources: SweepSource[];
  replies: string[];
  channelKind?: "public" | "private";
  /** Wire the sweep's search and answer capture, as production does. */
  capture?: boolean;
}): { h: SweepHarness; drifts: InMemoryDriftStore } {
  const drifts = createInMemoryDriftStore();
  const h = sweepHarness({
    channels: {
      [DESIGN]: {
        kind: opts.channelKind ?? "public",
        history: opts.threads.map((t) => t.root),
        threads: Object.fromEntries(opts.threads.map((t) => [t.root.ts, t.messages])),
        members: ["U0STARTER", "U0ADE", "U0BEA", "U0CY"],
      },
    },
    sources: opts.sources,
    detectorReplies: opts.replies,
    now: at(29, 22),
    ...(opts.channelKind === "private" ? { privateAllowlist: [DESIGN] } : {}),
    ...(opts.capture ? { search: {}, capture: true } : {}),
  });
  h.deps.fileDrift = drifts;
  return { h, drifts };
}

interface Posted {
  channel: string;
  threadTs: string | null;
  text: string;
  ts: string;
  card: boolean;
  withdrawn?: string;
}

/** The morning: `runDriftAsks` over the night's store, ThreadState and record. */
function morning(
  h: SweepHarness,
  drifts: InMemoryDriftStore,
  opts: { options?: string[] | null; publisher?: { handle: string; at: string } | null; dryRun?: boolean } = {},
): { deps: DriftPostDeps; posted: Posted[]; marked: string[] } {
  const posted: Posted[] = [];
  const marked: string[] = [];
  let seq = 0;
  const deps: DriftPostDeps = {
    store: drifts,
    slack: {
      async post(to, message) {
        seq += 1;
        const ts = `${Math.floor(h.clock.now / 1000)}.${String(800000 + seq)}`;
        posted.push({ channel: to.channel, threadTs: to.threadTs, text: message.text, ts, card: message.card });
        return { ok: true, ts };
      },
      async permalink(channel, ts) {
        return `https://plus.slack.com/archives/${channel}/p${ts.replace(".", "")}`;
      },
      async withdraw(channel, ts, text) {
        await h.threadState.retireProposal(ts);
        const p = posted.find((m) => m.channel === channel && m.ts === ts);
        if (p) p.withdrawn = text;
      },
      async markThread(channel, threadTs) {
        marked.push(`${channel}:${threadTs}`);
      },
    },
    render(card) {
      const rendered = renderProposalCard(card);
      return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
    },
    async stage(proposal, channelKind) {
      await stageSweepCard(
        proposal,
        { threadState: h.threadState, proposalEvents: h.proposalEvents, markThread: async (c, t) => void marked.push(`${c}:${t}`) },
        h.clock.now,
        channelKind,
      );
    },
    async cardLive(ts) {
      return (await h.threadState.getProposalByTs(ts)).state === "found";
    },
    async threadBusy(channel, threadTs) {
      const cards = await h.threadState.getProposalsByChannel(channel);
      return cards.some((p) => p.supersedeKey === DRIFT_KEY && proposalReplyThread(p) === threadTs);
    },
    async publisher() {
      return opts.publisher === undefined ? { handle: "bea.designs", at: "2026-09-20T10:00:00Z" } : opts.publisher;
    },
    async pillarOptions() {
      return opts.options === undefined ? ["Tutor Experience", "Universal"] : opts.options;
    },
    config: { plusDesign: "C0PLUSDESIGN", plusUniversal: "C0UNIVERSAL", unoBot: UNO_BOT },
    now: () => h.clock.now,
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  return { deps, posted, marked };
}

/** The answer's deps over the harness's ThreadState and usage record. */
function answerDeps(h: SweepHarness, drifts: InMemoryDriftStore, posted: Posted[]): DriftAnswerDeps & { notes: string[] } {
  const notes: string[] = [];
  return {
    notes,
    asked: (channel, threadTs) => drifts.asked(channel, threadTs),
    async hasTurnCard(channel, thread) {
      const cards = await h.threadState.getProposalsByChannel(channel);
      return cards.some((p) => !p.supersedeKey && !p.sweepRun && proposalReplyThread(p) === thread);
    },
    async liveCard(channel, thread) {
      const cards = await h.threadState.getProposalsByChannel(channel);
      return cards.find((p) => p.supersedeKey === DRIFT_KEY && proposalReplyThread(p) === thread) ?? null;
    },
    async retire(ts) {
      return (await h.threadState.retireProposal(ts)).retired;
    },
    async edit(channel, ts, text) {
      const p = posted.find((m) => m.channel === channel && m.ts === ts);
      if (p) p.withdrawn = text;
    },
    async post(channel, threadTs, text) {
      notes.push(`${channel}:${threadTs} ${text}`);
    },
    async recordWithdrawn(proposal, user) {
      await recordProposalEvents(h.proposalEvents, [
        { ...proposalEvent(proposal.proposalTs, "cancelled", h.clock.now, "typed"), actorId: user },
      ]);
    },
  };
}

describe("a Figma drift at the morning run", () => {
  it("yields one intake operation on the card and one ask, posted in the source thread only", async () => {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [
      { user: "U0ADE", when: ts(29, 16) },
      { user: "U0BEA", when: ts(29, 17), text: "I'll handle the recap screen." },
    ]);
    const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)], "U0BEA"))] });

    const eod = await runSweepJob(EOD, h.deps);
    assert.equal(h.posted.length, 0, "the end of day posts nothing");
    assert.equal(eod.findings.length, 0, "a read-only finding is not a sweep card");
    assert.match(eod.note ?? "", /1 finding\(s\) on files uno-bot cannot write kept for the morning's ask/);
    assert.equal((await drifts.pending()).length, 1);

    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    const report = await runDriftAsks(MORNING, m.deps);

    assert.equal(m.posted.length, 1, "one ask");
    const [card] = m.posted;
    assert.equal(card!.channel, DESIGN);
    assert.equal(card!.threadTs, t.root.ts, "in the thread the evidence is in");
    assert.ok(m.posted.every((p) => p.channel !== UNO_BOT && p.channel !== "C0PLUSDESIGN"));
    assert.match(card!.text, /^:art: <@U0BEA> you talked about <https:\/\/www\.figma\.com\/design\/AbC123xyz\/Session-Recap\?node-id=1-2\|Session Recap> — is the Figma up to date\?/);
    assert.match(card!.text, /Last published by \*bea\.designs\* on 2026-09-20\./);
    assert.doesNotMatch(card!.text, /<@bea/, "the publisher is never @-mentioned");
    assert.match(card!.text, /reply `yes` and I'll withdraw this/);

    const staged = await h.threadState.getProposalsByChannel(DESIGN);
    assert.equal(staged.length, 1);
    const proposal = staged[0]!;
    assert.equal(proposal.operations!.length, 1, "one intake operation");
    assert.equal(proposal.operations![0]!.toolName, "notion_create");
    const input = proposal.operations![0]!.input as Record<string, unknown>;
    assert.equal(input.surface, "prd");
    assert.match(String(input.title), /^Update Session Recap in Figma: /);
    assert.equal(proposal.supersedeKey, DRIFT_KEY, "its own slot in the thread");
    assert.equal(proposal.ttlMs, DRIFT_CARD_TTL_MS);
    assert.deepEqual(proposal.confirmers, ["U0BEA", "U0STARTER", "U0ADE"], "the owner plus everyone who posted");
    assert.equal(proposal.replyTs, t.root.ts);
    assert.equal(proposal.sweepRun, undefined, "not a sweep card: it holds no sweep items");

    const events = await h.proposalEvents.eventsOf(proposal.proposalTs);
    assert.deepEqual(events.map((e) => [e.event, e.via]), [["staged", "worker"]], "staging is on the usage record");
    assert.deepEqual(await drifts.pending(), [], "an asked finding leaves the queue");
    assert.equal(report.asks.length, 1);
  });

  it("asks two threads about the same file with one intake and two asks, one per thread", async () => {
    const one = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const two = thread({ user: "U0BEA", when: ts(29, 17), urls: [FIGMA_B.url] }, [{ user: "U0CY", when: ts(29, 18) }]);
    const { h, drifts } = night({
      threads: [one, two],
      sources: [FIGMA_A, FIGMA_B],
      replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)])), reply(fileDrift(FIGMA_B, [ts(29, 18)]))],
    });
    await runSweepJob(EOD, h.deps);
    assert.equal(fileKeyOf(FIGMA_A.url, "figma"), fileKeyOf(FIGMA_B.url, "figma"), "one file, two nodes");

    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);

    assert.deepEqual(
      m.posted.map((p) => [p.channel, p.threadTs, p.card]),
      [
        [DESIGN, one.root.ts, true],
        [DESIGN, two.root.ts, false],
      ],
    );
    const staged = await h.threadState.getProposalsByChannel(DESIGN);
    assert.equal(staged.length, 1, "one intake for the file");
    assert.match(m.posted[1]!.text, /is the Figma up to date\?/);
    assert.match(m.posted[1]!.text, /I've drafted the intake <https:\/\/plus\.slack\.com\/archives\/C0DESIGN\/p\d+\|in another thread>/);
    assert.match(m.posted[1]!.text, /^:art: <@U0BEA> you talked about/, "the owner is mentioned");
    assert.doesNotMatch(m.posted[1]!.text, /<@U0CY>/, "the thread's other posters are not pinged");
    assert.deepEqual(staged[0]!.confirmers, ["U0STARTER", "U0ADE", "U0BEA", "U0CY"], "both threads' people may decide");
    assert.ok(m.marked.includes(`${DESIGN}:${two.root.ts}`), "the asked thread is marked, so its replies stay the team's");
  });

  it("does not ask a thread twice about a file, and asks a new thread alone while the card is live", async () => {
    const one = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [one], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1);

    // The next night re-reads the same thread (a reply under the card), and a
    // new thread discusses the same file.
    const later = thread({ user: "U0CY", when: ts(30, 15), urls: [FIGMA_B.url] }, [{ user: "U0BEA", when: ts(30, 16) }]);
    await drifts.add([
      { ...(await pendingOf(h, drifts, one, FIGMA_A))!, detectedAt: at(30, 22) },
      { ...(await pendingOf(h, drifts, later, FIGMA_B))!, detectedAt: at(30, 22) },
    ]);
    h.clock.now = at(31, 13);
    await runDriftAsks(MORNING, m.deps);

    assert.equal(m.posted.length, 2, "the first thread is not asked again");
    assert.equal(m.posted[1]!.threadTs, later.root.ts);
    assert.equal(m.posted[1]!.card, false, "the file's card is still live: the new thread gets the question alone");
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 1, "still one intake");
  });

  it("files a harness-intake issue for code drift, and asks whether the code is up to date", async () => {
    const code: SweepSource = {
      url: "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Button/Button.jsx#L10",
      kind: "design-system-code",
      writable: false,
      title: "Button.jsx",
      blocks: [],
      text: "export function Button({ variant = 'primary' })",
      pillars: [],
      contributors: [],
    };
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [code.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [code], replies: [reply(fileDrift(code, [ts(29, 16)], "U0ADE"))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);

    assert.match(m.posted[0]!.text, /is the code up to date\?/);
    assert.doesNotMatch(m.posted[0]!.text, /Last published by/, "no Figma publisher for code");
    assert.match(m.posted[0]!.text, /✅ files a `harness-intake` issue/);
    const [proposal] = await h.threadState.getProposalsByChannel(DESIGN);
    const op = proposal!.operations![0]!;
    assert.equal(op.toolName, "github_issue_create");
    assert.match(String(op.input.title), /^Update Button\.jsx in code: /);
    assert.match(String(op.input.body), /## Done when/);
    assert.match(String(op.input.body), /https:\/\/plus\.slack\.com\/archives\/C0DESIGN\//, "the evidence thread is linked");
  });

  it("keeps a private channel's ask in its thread, and links nothing from it into the intake", async () => {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))], channelKind: "private" });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);

    assert.deepEqual(m.posted.map((p) => [p.channel, p.threadTs]), [[DESIGN, t.root.ts]]);
    const [proposal] = await h.threadState.getProposalsByChannel(DESIGN);
    const input = proposal!.operations![0]!.input as { sections: { heading: string; body: string }[]; source_url: string };
    assert.ok(!input.sections.some((s) => s.heading === "Where it was decided"), "no link back to the private thread");
    assert.equal(input.source_url, FIGMA_A.url);
    const staged = (await h.proposalEvents.eventsOf(proposal!.proposalTs))[0]!;
    assert.equal(staged.channelId, DESIGN, "a private channel card names its channel, as a turn's does");
  });

  it("drafts on a dry run and posts, stages and removes nothing", async () => {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts, { dryRun: true });
    const report = await runDriftAsks(MORNING, m.deps);
    assert.equal(report.asks.length, 1);
    assert.match(report.summary, /would ask 1 thread/);
    assert.deepEqual(m.posted, []);
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 0);
    assert.equal((await drifts.pending()).length, 1);
  });

  it("waits for the weekday morning after the drift was found", async () => {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 12, 59);
    const m = morning(h, drifts);
    const report = await runDriftAsks(MORNING, m.deps);
    assert.deepEqual(m.posted, []);
    assert.equal(report.summary, "no file drift due this morning");
  });
});

describe("a Figma-only thread", () => {
  it("still reaches the detector and yields a drift finding, with search and answer capture wired", async () => {
    // No Notion link, no page named in words, no question answered: only the
    // Figma link makes the thread worth reading.
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [
      { user: "U0ADE", when: ts(29, 16), text: "Agreed, drop the Share button." },
    ]);
    const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)], "U0ADE"))], capture: true });
    const eod = await runSweepJob(EOD, h.deps);
    const asked = h.provider.generated as Array<{ system?: string }>;
    assert.equal(asked.filter((p) => p.system === DRIFT_DETECTOR_SYSTEM).length, 1, "the drift detector was asked, once");
    assert.equal(eod.findings.length, 0, "no Notion card");
    const [found] = await drifts.pending();
    assert.ok(found, "the file drift is queued");
    assert.equal(found.fileKey, `figma:${FILE_KEY}`);
    assert.equal(found.owner, "U0ADE");
  });
});

describe("the Product Pillar on a Roadmap intake", () => {
  const CARD = notionPage("cccccccccccccccccccccccccccccccc", { pillars: ["Tutor Experience"] });

  async function askedWith(pillars: string[], options: string[] | null) {
    const card = { ...CARD, pillars };
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [card.url, FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [card, FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts, { options });
    await runDriftAsks(MORNING, m.deps);
    const [proposal] = await h.threadState.getProposalsByChannel(DESIGN);
    return { input: proposal!.operations![0]!.input as Record<string, unknown>, text: m.posted[0]!.text };
  }

  it("is a linked card's pillar when the Roadmap offers it", async () => {
    const { input, text } = await askedWith(["Tutor Experience"], ["Tutor Experience", "Universal"]);
    assert.deepEqual(input.properties, { product_pillar: "Tutor Experience" });
    assert.doesNotMatch(text, /Product Pillar:/);
  });

  it("is left out, and noted on the card, when the value is not an option", async () => {
    const { input, text } = await askedWith(["Made Up"], ["Tutor Experience", "Universal"]);
    assert.equal(input.properties, undefined, "an unknown value is never invented");
    assert.match(text, /Product Pillar: “Made Up” is not an option on the Roadmap, so left unset/);
  });

  it("is left unset, and noted, when the Roadmap's options could not be read", async () => {
    const { input, text } = await askedWith(["Tutor Experience"], null);
    assert.equal(input.properties, undefined);
    assert.match(text, /could not be read this morning/);
  });

  it("takes the Roadmap's own spelling of a matching value", () => {
    assert.deepEqual(matchPillar(["tutor experience"], ["Tutor Experience"]), { pillar: "Tutor Experience", note: null });
    assert.deepEqual(matchPillar([], ["Universal"]), { pillar: null, note: null });
  });
});

describe("a yes in an asked thread", () => {
  async function askedCard() {
    const one = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const two = thread({ user: "U0BEA", when: ts(29, 17), urls: [FIGMA_B.url] }, [{ user: "U0CY", when: ts(29, 18) }]);
    const { h, drifts } = night({
      threads: [one, two],
      sources: [FIGMA_A, FIGMA_B],
      replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)])), reply(fileDrift(FIGMA_B, [ts(29, 18)]))],
    });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    h.clock.now = at(30, 15);
    return { h, drifts, m, one, two, card: card!, deps: answerDeps(h, drifts, m.posted) };
  }

  it("closes the question and withdraws the drafted card at once, not after 72 h", async () => {
    const { h, one, card, m, deps } = await askedCard();
    const handled = await answerDriftAsk({ channel: DESIGN, threadTs: one.root.ts, user: "U0ADE", text: "yes, it's up to date" }, deps);

    assert.equal(handled, true);
    assert.notEqual((await h.threadState.getProposalByTs(card.proposalTs)).state, "found", "retired: no ✅ can file it");
    assert.equal(m.posted[0]!.withdrawn, ":white_check_mark: Thanks, <@U0ADE>. The Figma is up to date, so I've withdrawn this intake.");
    const events = await h.proposalEvents.eventsOf(card.proposalTs);
    assert.deepEqual(events.map((e) => [e.event, e.via, e.actorId]), [
      ["staged", "worker", null],
      ["cancelled", "typed", "U0ADE"],
    ]);
    assert.deepEqual(deps.notes, [], "answered in the card's own thread: nothing more is posted");
  });

  it("withdraws the card from the other asked thread too, and says so there", async () => {
    const { h, two, card, deps } = await askedCard();
    const handled = await answerDriftAsk({ channel: DESIGN, threadTs: two.root.ts, user: "U0CY", text: "Yep" }, deps);
    assert.equal(handled, true);
    assert.notEqual((await h.threadState.getProposalByTs(card.proposalTs)).state, "found");
    assert.deepEqual(deps.notes, [`${DESIGN}:${two.root.ts} Thanks! The Figma is up to date, so I've withdrawn the intake.`]);
  });

  it("leaves the card alone for someone who may not decide it, a question, or a no", async () => {
    const { h, one, card, deps } = await askedCard();
    for (const [user, text] of [
      ["U0STRANGER", "yes"],
      ["U0ADE", "is it up to date?"],
      ["U0ADE", "no, not yet"],
    ] as const) {
      assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: one.root.ts, user, text }, deps), false, `${user}: ${text}`);
    }
    assert.equal((await h.threadState.getProposalByTs(card.proposalTs)).state, "found");
  });

  it("answers nothing in a thread that was never asked", async () => {
    const { deps } = await askedCard();
    assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: ts(29, 9), user: "U0ADE", text: "yes" }, deps), false);
  });
});

const CODE: SweepSource = {
  url: "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Button/Button.jsx",
  kind: "design-system-code",
  writable: false,
  title: "Button.jsx",
  blocks: [],
  text: "export function Button({ variant = 'primary' })",
  pillars: [],
  contributors: [],
};

describe("two files discussed in one thread", () => {
  async function twoFiles() {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url, CODE.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({
      threads: [t],
      sources: [FIGMA_A, CODE],
      replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)], "U0ADE"), fileDrift(CODE, [ts(29, 16)], "U0ADE"))],
    });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);
    return { h, drifts, m, t };
  }

  it("make one card with one operation per file, and one ask naming both", async () => {
    const { h, m, t } = await twoFiles();
    assert.equal(m.posted.length, 1, "one ask for the thread");
    assert.equal(m.posted[0]!.threadTs, t.root.ts);
    assert.match(m.posted[0]!.text, /you talked about <[^>]+\|Session Recap> and <[^>]+\|Button\.jsx> — are they up to date\?/);
    assert.match(m.posted[0]!.text, /reply `drop 2` to leave one out/);
    const cards = await h.threadState.getProposalsByChannel(DESIGN);
    assert.equal(cards.length, 1, "one card, so neither retires the other");
    assert.deepEqual(cards[0]!.operations!.map((op) => op.toolName), ["notion_create", "github_issue_create"]);
    assert.deepEqual(cards[0]!.operations!.map(fileKeyOfOperation), [`figma:${FILE_KEY}`, fileKeyOf(CODE.url, CODE.kind)]);
    assert.deepEqual(cards[0]!.confirmers, ["U0ADE", "U0STARTER"]);
  });

  it("wait while the thread's card is live, rather than stage a second card over it", async () => {
    const { h, drifts, m, t } = await twoFiles();
    const other = figmaFile("9-9", { url: "https://www.figma.com/design/ZzOther9/Onboarding?node-id=9-9", title: "Onboarding" });
    // The same thread, the next day, on another file.
    const again = thread({ user: "U0STARTER", when: t.root.ts, urls: [other.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const found = await pendingOf(h, drifts, again, other);
    assert.ok(found);
    await drifts.add([{ ...found, detectedAt: at(30, 22) }]);
    h.clock.now = at(31, 13);
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1, "nothing new in a thread whose card is live");
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 1);
    assert.equal((await drifts.pending()).length, 1, "the new file waits in the queue");
  });

  it("stays on a yes from a thread that discussed only one of its files, and says which to drop", async () => {
    const { h, drifts, m } = await twoFiles();
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    // A second thread asked about the code file alone.
    const second = ts(29, 19);
    await drifts.saveAsked(DESIGN, second, {
      [fileKeyOf(CODE.url, CODE.kind)]: { cardChannel: DESIGN, cardThread: card!.replyTs!, people: ["U0CY"], kind: CODE.kind, askedAt: at(30, 13) },
    });
    const deps = answerDeps(h, drifts, m.posted);
    assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: second, user: "U0CY", text: "yes" }, deps), true);
    assert.equal((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found", "the card stays");
    assert.match(deps.notes[0]!, /Reply `drop 2` under it/);
  });
});

describe("what a GitHub issue carries from a private place", () => {
  it("files neither the thread's words nor a link from a private channel", async () => {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [CODE.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [CODE], replies: [reply(fileDrift(CODE, [ts(29, 16)], "U0ADE"))], channelKind: "private" });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    await runDriftAsks(MORNING, morning(h, drifts).deps);
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    const input = card!.operations![0]!.input as { title: string; body: string };
    assert.equal(input.title, "Update Button.jsx in code");
    assert.ok(input.body.includes(NEUTRAL_SETTLED));
    assert.doesNotMatch(input.body, /Share button|Share with tutor/, "no thread or file paraphrase");
    assert.doesNotMatch(input.body, /slack\.com/, "no link back to the channel");
    assert.ok(input.body.includes(CODE.url), "the file itself is named");
  });

  it("sets any @handle in a public thread's paraphrase in code, so the issue pings nobody", async () => {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [CODE.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const mention = { ...fileDrift(CODE, [ts(29, 16)], "U0ADE"), thread_says: "@octocat owns the Button change now." };
    const { h, drifts } = night({ threads: [t], sources: [CODE], replies: [reply(mention)] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    await runDriftAsks(MORNING, morning(h, drifts).deps);
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    const input = card!.operations![0]!.input as { title: string; body: string };
    assert.doesNotMatch(input.body, /(^|[^`])@octocat/);
    assert.match(input.body, /`@octocat` owns the Button change now\./);
    assert.match(input.title, /`@octocat`/);
    assert.equal(githubInert("mail me at bill@plus.org, or ping @bea-d"), "mail me at bill@plus.org, or ping `@bea-d`");
  });
});

describe("a yes that cannot be read", () => {
  it("answers false, without throwing, when the ask record cannot be read", async () => {
    const deps: DriftAnswerDeps = {
      asked: async () => {
        throw new Error("KV down");
      },
      liveCard: async () => null,
      hasTurnCard: async () => false,
      retire: async () => true,
      edit: async () => {},
      post: async () => {},
      recordWithdrawn: async () => {},
    };
    assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: "1.0", user: "U0ADE", text: "yes" }, deps), false);
  });

  it("still records the withdrawal when the edit fails after the card was retired", async () => {
    const one = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [one], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    h.clock.now = at(30, 15);
    const deps = answerDeps(h, drifts, m.posted);
    deps.edit = async () => {
      throw new Error("chat.update 500");
    };
    assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: one.root.ts, user: "U0ADE", text: "yes" }, deps), true);
    assert.notEqual((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found");
    const events = await h.proposalEvents.eventsOf(card!.proposalTs);
    assert.deepEqual(events.map((e) => e.event), ["staged", "cancelled"]);
  });

  it("leaves a bare yes to a live turn card in the same thread, but takes an explicit one", async () => {
    const one = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [one], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)]))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    await runDriftAsks(MORNING, m.deps);
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    // Someone asked uno-bot for something in the thread: a turn's card.
    await h.threadState.putProposal({
      ...card!,
      proposalTs: ts(30, 15),
      supersedeKey: undefined,
      confirmers: undefined,
      operations: [{ toolName: "github_issue_create", input: { title: "x", body: "y" } }],
    });
    const deps = answerDeps(h, drifts, m.posted);
    assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: one.root.ts, user: "U0ADE", text: "yes" }, deps), false);
    assert.equal((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found");
    assert.equal(await answerDriftAsk({ channel: DESIGN, threadTs: one.root.ts, user: "U0ADE", text: "the Figma is up to date" }, deps), true);
    assert.notEqual((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found");
  });
});

describe("the ask's words", () => {
  it("names the file by its title, linked, and escapes it", () => {
    assert.equal(
      askLine({ mentions: ["U0BEA"], files: [{ title: "Recap <!channel>", url: "https://www.figma.com/design/K/x", kind: "figma" }] }),
      "<@U0BEA> you talked about <https://www.figma.com/design/K/x|Recap &lt;!channel&gt;> — is the Figma up to date?",
    );
    assert.equal(
      askLine({ mentions: ["U0BEA"], files: [{ title: "Button.jsx", url: "https://github.com/o/r/blob/main/b.jsx", kind: "design-system-code" }] }),
      "<@U0BEA> you talked about <https://github.com/o/r/blob/main/b.jsx|Button.jsx> — is the code up to date?",
    );
    assert.equal(
      askLine({
        mentions: ["U0BEA"],
        files: [
          { title: "Recap", url: "https://www.figma.com/design/K/x", kind: "figma" },
          { title: "Button.jsx", url: "https://github.com/o/r/blob/main/b.jsx", kind: "design-system-code" },
        ],
      }),
      "<@U0BEA> you talked about <https://www.figma.com/design/K/x|Recap> and <https://github.com/o/r/blob/main/b.jsx|Button.jsx> — are they up to date?",
    );
  });

  it("shows the publisher's handle in bold, escaped, never as a mention", () => {
    assert.equal(publisherLine({ handle: "<@U0EVIL>", at: "2026-09-20T10:00:00Z" }), "Last published by *&lt;@U0EVIL&gt;* on 2026-09-20.");
    assert.equal(publisherLine(null), null);
  });

  it("reads a bare affirmative or an explicit 'the file is current' as the answer", () => {
    const bare = ["yes", "Yes!", "yep", "yes it is", "yes, up to date", "it's up to date", "It’s up to date.", "already updated", "already updated :white_check_mark:", "<@U0BOT> yes"];
    for (const text of bare) assert.equal(upToDateAnswer(text), "bare", text);
    for (const text of ["the Figma is up to date", "Figma's updated", "yep, the file is current", "code is up to date now"]) {
      assert.equal(upToDateAnswer(text), "explicit", text);
    }
  });

  it("reads an approval, a plan or a question as the thread's own conversation", () => {
    const not = [
      "yes please file it",
      "yes, go ahead",
      "yeah we should update the figma",
      "correct, ship it Friday",
      "all good, merging now",
      "yes let's do option B",
      "yes, file the Roadmap card",
      "please update it",
      "no",
      "not yet",
      "isn't up to date",
      "is it up to date?",
      "lunch?",
      "I'll update it tomorrow",
      "correct",
      "yes but the spacing still needs work",
    ];
    for (const text of not) assert.equal(upToDateAnswer(text), null, text);
    assert.equal(isUpToDateReply("yes"), true);
    assert.equal(isDriftAnswerCandidate({ thread_ts: "1.0", user: "U0ADE", text: "yes" }), true);
    assert.equal(isDriftAnswerCandidate({ user: "U0ADE", text: "yes" }), false, "a top-level message answers nothing");
    assert.equal(isDriftAnswerCandidate({ thread_ts: "1.0", bot_id: "B1", user: "U0BOT", text: "yes" }), false);
  });
});

/** The queued finding a night would find again in a thread, rebuilt. */
async function pendingOf(h: SweepHarness, _drifts: InMemoryDriftStore, t: ReturnType<typeof thread>, source: SweepSource) {
  const probe = createInMemoryDriftStore();
  const again = sweepHarness({
    channels: { [DESIGN]: { kind: "public", history: [t.root], threads: { [t.root.ts]: t.messages } } },
    sources: [source],
    detectorReplies: [reply(fileDrift(source, [t.messages[1]!.ts]))],
    now: h.clock.now,
  });
  again.deps.fileDrift = probe;
  await runSweepJob(EOD, again.deps);
  return (await probe.pending())[0];
}
