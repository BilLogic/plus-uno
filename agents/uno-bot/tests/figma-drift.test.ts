// File drift, a day at a time: the end-of-day sweep finds a decision a Figma
// file (or code) may not show yet, and the weekday morning run — once it has
// looked at the file — posts the thread a report on the shared decision card:
// a parent line, then one card per file with its drafted intake, decided in
// Review alone. The file catching up withdraws its card (#897); nothing typed
// in the thread decides one.
//
// The night runs through the sweep harness — its fake Slack, the real
// detector over recorded replies — with the in-memory drift store as its
// sink. The morning runs `runDriftAsks` against a small Slack of its own and
// the same in-memory ThreadState and usage record the harness stages into.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import { DRIFT_DETECTOR_SYSTEM, runSweepJob, stageSweepCard, type SweepSlackMessage, type SweepSource } from "../src/sweep/index";
import { createInMemoryDriftStore, type InMemoryDriftStore } from "../src/figma-drift/in-memory";
import { FigmaRequestError } from "../src/figma/client";
import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import { SubrequestBudgetError } from "../src/net";
import {
  MAX_LOOKS_PER_MORNING,
  MAX_RECHECKS_PER_RUN,
  recheckLiveAsks,
  recheckOnUpdate,
  runDriftAsks,
  type DriftPostDeps,
  type DriftRecheckDeps,
} from "../src/figma-drift/run";
import { DRIFT_CARD_TTL_MS, DRIFT_NO_REVISION, driftCardWords } from "../src/figma-drift/copy";
import { FRAME_MATCH_SYSTEM, frameMatchPrompt, modelFrameJudge, parseFrameMatch } from "../src/figma-drift/judge";
import { fakeProvider, type FakeProvider } from "../src/agent/providers/fake";
import type { FigmaNode } from "../src/integrations/figma-reading";
import { githubInert, matchPillar, NEUTRAL_SETTLED } from "../src/figma-drift/draft";
import { fileKeyOf } from "../src/figma-drift/finding";
import { itemProposalKey, settleItem, type ReportMessage } from "../src/slack/decision-cards";
import { resolveSignal } from "../src/gate/index";
import { renderGateNote } from "../src/slack/gate-note";
import { proposalEvent, recordProposalEvents } from "../src/usage/index";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { at, DESIGN, msg, notionPage, sweepHarness, ts, UNO_BOT, type SweepHarness } from "./helpers/sweep-harness";

type Card = {
  type: string;
  title?: { text: string };
  subtitle?: { text: string };
  body?: { text: string };
  actions?: Array<{ text: { text: string }; action_id?: string; url?: string }>;
};

/** The cards a message shows, a lone card or a carousel's. */
function cardsOf(blocks: unknown[] | undefined): Card[] {
  return ((blocks ?? []) as Array<Card & { elements?: Card[] }>).flatMap((b) =>
    b.type === "carousel" ? b.elements! : b.type === "card" ? [b] : [],
  );
}

/** A card's button labels. */
const labels = (card: Card) => card.actions!.map((a) => a.text.text);

/** Words a drift message no longer teaches: a gate footer, or a typed answer. */
const GATE_WORDS = /:white_check_mark:|:no_entry:|✅|⛔|`skip`|\bskip\b|\bdrop \d|reply "?yes|still current\?/i;

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
  blocks?: unknown[];
  /** The message as its last edit left it. */
  edited?: ReportMessage;
}

/** A frame whose text layers are `texts`. */
function frame(texts: readonly string[]): FigmaNode {
  return { name: "Recap", type: "FRAME", children: texts.map((characters, i) => ({ name: `Text ${i}`, type: "TEXT", characters })) };
}

/** What the morning's fake Figma file holds. */
interface FileOpts {
  /** The newest named version's author and time; null names no publisher. */
  publisher?: { handle: string; at: string } | null;
  /** An autosave after the publish: the file's last change. */
  changedAt?: string;
  /** Node 1-2's text layers now (FIGMA_A's frame); node 3-4 keeps the old ones. */
  frameA?: string[];
}

/** Seed the morning's Figma file. */
function seedFigmaFile(figma: InMemoryFigma, opts: FileOpts): void {
  // The file's newest named version is the publisher's; `publisher: null` is
  // a file Figma names no publisher for.
  const publisher = opts.publisher === undefined ? { handle: "bea.designs", at: "2026-09-20T10:00:00Z" } : opts.publisher;
  figma.seedFile(FILE_KEY, {
    versions: {
      versions: [
        ...(opts.changedAt ? [{ id: "2210000000000000010", label: null, description: null, created_at: opts.changedAt, user: { handle: "bea.designs" } }] : []),
        ...(publisher
          ? [{ id: "2210000000000000009", label: "Recap screens", description: "", created_at: publisher.at, user: { handle: publisher.handle } }]
          : []),
      ],
    },
    nodes: { "1:2": frame(opts.frameA ?? ["Recap", "Share with tutor"]), "3:4": frame(["Recap", "Share with tutor"]) },
  });
}

/** The judge's replies, recorded: `shows` is a confident yes. */
const SHOWS = JSON.stringify({ shows: true, confidence: 0.92 });
const NOT_SHOWN = JSON.stringify({ shows: false, confidence: 0.9 });

/** The morning: `runDriftAsks` over the night's store, ThreadState and record. */
function morning(
  h: SweepHarness,
  drifts: InMemoryDriftStore,
  opts: FileOpts & { options?: string[] | null; dryRun?: boolean; judge?: string[] } = {},
): { deps: DriftPostDeps; posted: Posted[]; marked: string[]; figma: InMemoryFigma; provider: FakeProvider } {
  const posted: Posted[] = [];
  const marked: string[] = [];
  let seq = 0;
  const figma = createInMemoryFigma();
  seedFigmaFile(figma, opts);
  const provider = fakeProvider({ generateReplies: opts.judge ?? [] });
  const deps: DriftPostDeps = {
    store: drifts,
    slack: {
      async post(to, message) {
        seq += 1;
        const ts = `${Math.floor(h.clock.now / 1000)}.${String(800000 + seq)}`;
        posted.push({ channel: to.channel, threadTs: to.threadTs, text: message.text, ts, card: message.card, ...(message.blocks ? { blocks: message.blocks } : {}) });
        return { ok: true, ts };
      },
      async permalink(channel, ts) {
        return `https://plus.slack.com/archives/${channel}/p${ts.replace(".", "")}`;
      },
      async edit(channel, ts, message) {
        const p = posted.find((m) => m.channel === channel && m.ts === ts);
        if (p) p.edited = message;
      },
      async markThread(channel, threadTs) {
        marked.push(`${channel}:${threadTs}`);
      },
    },
    reports: h.threadState,
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
    figma,
    judge: modelFrameJudge(provider),
    async pillarOptions() {
      return opts.options === undefined ? ["Tutor Experience", "Universal"] : opts.options;
    },
    config: { plusDesign: "C0PLUSDESIGN", plusUniversal: "C0UNIVERSAL", unoBot: UNO_BOT },
    now: () => h.clock.now,
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  return { deps, posted, marked, figma, provider };
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

    assert.equal(m.posted.length, 1, "one report");
    const [card] = m.posted;
    assert.equal(card!.channel, DESIGN);
    assert.equal(card!.threadTs, t.root.ts, "in the thread the evidence is in");
    assert.ok(m.posted.every((p) => p.channel !== UNO_BOT && p.channel !== "C0PLUSDESIGN"));
    assert.equal(messageBlocksRefusal(card!.blocks!), null, "Slack takes it");
    assert.equal(
      card!.text.split("\n")[0],
      "This thread settled a decision that its Figma file has not caught up with.",
      "the parent line: one plain sentence",
    );
    const [one] = cardsOf(card!.blocks);
    assert.equal(cardsOf(card!.blocks).length, 1, "one card for the one file");
    assert.equal(one!.title!.text, "Session Recap");
    assert.equal(one!.subtitle!.text, "<@U0BEA> · last changed Sep 20", "the owner, and the file's last change");
    assert.equal(
      one!.body!.text,
      'Thread settled "The recap drops the Share button; tutors see it automatically" on Sep 29 · the file has not changed since Sep 20.',
    );
    assert.deepEqual(labels(one!), ["Review", "Open in Figma"]);
    assert.equal(one!.actions![1]!.url, FIGMA_A.url, "Open goes to the frame the thread linked");
    assert.doesNotMatch(JSON.stringify(card!.blocks) + card!.text, GATE_WORDS, "no ✅/⛔ footer, no typed answer to teach");
    assert.doesNotMatch(card!.text, /<@bea/, "the publisher is never @-mentioned");

    const staged = await h.threadState.getProposalsByChannel(DESIGN);
    assert.equal(staged.length, 1);
    const proposal = staged[0]!;
    assert.equal(proposal.proposalTs, itemProposalKey(card!.ts, "1"), "the card's own proposal, which its Review opens");
    assert.deepEqual(proposal.item, { messageTs: card!.ts, id: "1" });
    assert.equal(proposal.operations!.length, 1, "one intake operation");
    assert.equal(proposal.operations![0]!.toolName, "notion_create");
    const input = proposal.operations![0]!.input as Record<string, unknown>;
    assert.equal(input.surface, "prd");
    assert.match(String(input.title), /^Update Session Recap in Figma: /);
    assert.equal(proposal.ttlMs, DRIFT_CARD_TTL_MS);
    assert.deepEqual(proposal.confirmers, ["U0BEA", "U0STARTER", "U0ADE"], "the owner plus everyone who posted");
    assert.equal(proposal.replyTs, t.root.ts);
    assert.equal(proposal.sweepRun, undefined, "not a sweep card: it holds no sweep items");
    assert.deepEqual(proposal.stated, driftCardWords(72), "the gate answers in the card's own words");
    assert.equal(proposal.refuseRevision, DRIFT_NO_REVISION, "a turn does not redraft it beside the card");
    assert.match(proposal.proposalText, /^\*<https:\/\/www\.figma\.com\/design\/AbC123xyz\/Session-Recap\?node-id=1-2\|Session Recap>:\* this thread settled /, "what Review shows");
    const sections = (input.sections as Array<{ heading: string; body: string }>).map((s) => s.body).join("\n");
    assert.match(sections, /Last published by bea\.designs on 2026-09-20\./, "the publisher is on the intake");

    const record = await h.threadState.getReport(card!.ts);
    assert.deepEqual(record?.entries.map((e) => [e.id, e.state.kind]), [["1", "open"]], "the report's record, where the card's decision lands");
    const events = await h.proposalEvents.eventsOf(proposal.proposalTs);
    assert.deepEqual(events.map((e) => [e.event, e.via]), [["staged", "worker"]], "staging is on the usage record");
    assert.deepEqual(await drifts.pending(), [], "an asked finding leaves the queue");
    assert.equal(report.asks.length, 1);
    assert.deepEqual(
      m.figma.calls().map((c) => [c.method, c.args[0]]),
      [["versions", FILE_KEY]],
      "one Figma read: the file's versions, for its last change and its publisher",
    );
    assert.equal(m.provider.generated.length, 0, "an unchanged file needs no judgement");
  });

  /** One thread that discussed FIGMA_A, swept, and the morning ready to run. */
  async function sweptRecap() {
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [
      { user: "U0ADE", when: ts(29, 16) },
      { user: "U0BEA", when: ts(29, 17), text: "I'll handle the recap screen." },
    ]);
    const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)], "U0BEA"))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    return { h, drifts, m: morning(h, drifts) };
  }

  it("still asks when Figma will not answer, says the file may not show it yet, and names no one", async () => {
    const { h, m } = await sweptRecap();
    m.figma.failNext("versions", new FigmaRequestError(503, "Figma versions 503: Service unavailable"));
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1, "the report goes out");
    const [card] = cardsOf(m.posted[0]!.blocks);
    assert.match(card!.body!.text, / · the file may not show it yet\.$/);
    assert.equal(card!.subtitle!.text, "<@U0BEA>", "no last change it could not read");
    const [proposal] = await h.threadState.getProposalsByChannel(DESIGN);
    assert.doesNotMatch(JSON.stringify(proposal!.operations), /Last published by/);
    assert.equal(m.figma.calls().length, 1, "a failed read is not tried again for the publisher");
  });

  it("names no one for a file with no named version", async () => {
    const t = await sweptRecap();
    const m = morning(t.h, t.drifts, { publisher: null });
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1);
    const [proposal] = await t.h.threadState.getProposalsByChannel(DESIGN);
    assert.doesNotMatch(JSON.stringify(proposal!.operations), /Last published by/);
  });

  it("stops on a budget stop reading the publisher, and posts nothing", async () => {
    const { m } = await sweptRecap();
    m.figma.failNext("versions", new SubrequestBudgetError(38));
    await assert.rejects(runDriftAsks(MORNING, m.deps), SubrequestBudgetError);
    assert.deepEqual(m.posted, []);
  });

  it("asks two threads about the same file with one intake: a card in the first, a pointer in the other", async () => {
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
    assert.equal(
      m.posted[1]!.text,
      [
        "This thread settled a decision that its Figma file has not caught up with.",
        `The intake for <${FIGMA_B.url}|Session Recap> is drafted <https://plus.slack.com/archives/C0DESIGN/p${m.posted[0]!.ts.replace(".", "")}|in another thread>.`,
      ].join("\n"),
      "no card here: the parent line and a one-line pointer",
    );
    assert.equal(m.posted[1]!.blocks, undefined, "nothing to decide in this thread");
    assert.doesNotMatch(m.posted[1]!.text, /<@U/, "a pointer pings nobody");
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

    assert.match(m.posted[0]!.text, /^This thread settled a decision that the code has not caught up with\.\n/);
    const [card] = cardsOf(m.posted[0]!.blocks);
    assert.equal(card!.subtitle!.text, "<@U0ADE>");
    assert.match(card!.body!.text, / · the code may not show it yet\.$/);
    assert.deepEqual(labels(card!), ["Review", "Open on GitHub"]);
    assert.doesNotMatch(m.posted[0]!.text, GATE_WORDS);
    assert.equal(m.figma.calls().length, 0, "code is not Figma's to look at");
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
    return { input: proposal!.operations![0]!.input as Record<string, unknown>, text: proposal!.proposalText, posted: m.posted[0]!.text };
  }

  it("is a linked card's pillar when the Roadmap offers it", async () => {
    const { input, text } = await askedWith(["Tutor Experience"], ["Tutor Experience", "Universal"]);
    assert.deepEqual(input.properties, { product_pillar: "Tutor Experience" });
    assert.doesNotMatch(text, /Product Pillar:/);
  });

  it("is left out, and noted where Review shows the intake, when the value is not an option", async () => {
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

  it("make one report: a carousel of two cards, each its own proposal with its own Review", async () => {
    const { h, m, t } = await twoFiles();
    assert.equal(m.posted.length, 1, "one report for the thread");
    const [report] = m.posted;
    assert.equal(report!.threadTs, t.root.ts);
    assert.equal(messageBlocksRefusal(report!.blocks!), null);
    assert.equal(report!.text.split("\n")[0], "This thread settled two decisions that their files have not caught up with.");
    assert.equal((report!.blocks![1] as { type: string }).type, "carousel");
    const cards = cardsOf(report!.blocks);
    assert.deepEqual(cards.map((c) => c.title!.text), ["Session Recap", "Button.jsx"]);
    assert.deepEqual(cards.map((c) => c.actions![0]!.action_id), ["uno_decision_review:1", "uno_decision_review:2"], "each Review opens its own card");
    assert.doesNotMatch(report!.text + JSON.stringify(report!.blocks), GATE_WORDS, "no `drop 2`, no footer");

    const staged = (await h.threadState.getProposalsByChannel(DESIGN)).sort((a, b) => a.proposalTs.localeCompare(b.proposalTs));
    assert.deepEqual(
      staged.map((p) => [p.proposalTs, p.operations!.map((op) => op.toolName)]),
      [
        [itemProposalKey(report!.ts, "1"), ["notion_create"]],
        [itemProposalKey(report!.ts, "2"), ["github_issue_create"]],
      ],
      "one intake per card, so deciding one leaves the other",
    );
    for (const p of staged) assert.deepEqual(p.confirmers, ["U0ADE", "U0STARTER"]);
  });

  it("are decided one at a time in Review, and a typed ✅ in the thread decides neither", async () => {
    const { h, m, t } = await twoFiles();
    const [report] = m.posted;
    const typed = await resolveSignal({ kind: "typed", channel: DESIGN, thread: t.root.ts, text: "✅", userId: "U0ADE" }, { threadState: h.threadState });
    assert.equal(typed.outcome, "none");
    assert.equal(renderGateNote(typed.post!.note), "Each card here is decided from its own Review button, so nothing ran.");

    const key = itemProposalKey(report!.ts, "2");
    const approved = await resolveSignal({ kind: "review", messageTs: key, decision: "confirm", userId: "U0ADE" }, { threadState: h.threadState });
    assert.equal(approved.outcome, "won");
    assert.deepEqual(approved.execute?.operations.map((op) => op.toolName), ["github_issue_create"], "Approve files that card's intake alone");
    const message = await settleItem(h.threadState, { messageTs: report!.ts, id: "2" }, { kind: "approved", by: "U0ADE", at: h.clock.now }, h.clock.now);
    const cards = cardsOf(message!.blocks);
    assert.match(cards[1]!.subtitle!.text, /^Approved by <@U0ADE> · written /);
    assert.equal(cards[1]!.body!.text, "Written: an intake to update Button.jsx");
    assert.deepEqual(labels(cards[0]!), ["Review", "Open in Figma"], "the other card is still open");
    assert.equal((await h.threadState.getProposalByTs(itemProposalKey(report!.ts, "1"))).state, "found");
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
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 2);
    assert.equal((await drifts.pending()).length, 1, "the new file waits in the queue");
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

// ── #897: the file, looked at before the ask and while it is live ────────────

/** The recap thread, swept, with the morning ready to run against `file`. */
async function recapMorning(file: Parameters<typeof morning>[2] = {}) {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [
    { user: "U0ADE", when: ts(29, 16) },
    { user: "U0BEA", when: ts(29, 17), text: "I'll handle the recap screen." },
  ]);
  const { h, drifts } = night({ threads: [t], sources: [FIGMA_A], replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)], "U0BEA"))] });
  await runSweepJob(EOD, h.deps);
  h.clock.now = at(30, 13);
  return { h, drifts, t, m: morning(h, drifts, file) };
}

/** The frame once the designer has made the change. */
const UPDATED = ["Recap", "Shared with tutor automatically"];
/** After the decision (Sep 29, 12:00 ET) and before the morning that asks. */
const CHANGED_AFTER = "2026-09-29T21:00:00Z";

/** The re-check over the morning's store, ThreadState, record and file. */
function recheck(
  h: SweepHarness,
  drifts: InMemoryDriftStore,
  figma: InMemoryFigma,
  opts: { judge?: string[] | DriftRecheckDeps["judge"]; dryRun?: boolean } = {},
): { deps: DriftRecheckDeps; edits: Array<{ channel: string; ts: string; text: string; blocks: unknown[] }>; provider: FakeProvider } {
  const edits: Array<{ channel: string; ts: string; text: string; blocks: unknown[] }> = [];
  const provider = fakeProvider({ generateReplies: Array.isArray(opts.judge) ? opts.judge : [] });
  const deps: DriftRecheckDeps = {
    store: drifts,
    figma,
    judge: typeof opts.judge === "function" ? opts.judge : modelFrameJudge(provider),
    async retire(ts) {
      return (await h.threadState.retireProposal(ts)).retired;
    },
    async edit(channel, ts, message) {
      edits.push({ channel, ts, text: message.text, blocks: message.blocks });
    },
    reports: h.threadState,
    async recordWithdrawn(proposalTs) {
      await recordProposalEvents(h.proposalEvents, [proposalEvent(proposalTs, "cancelled", h.clock.now, "worker")]);
    },
    async cardFiled(proposalTs) {
      return (await h.proposalEvents.eventsOf(proposalTs)).some((e) => e.event === "confirmed");
    },
    now: () => h.clock.now,
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  return { deps, edits, provider };
}
const RECHECK = { key: "figma-drift-recheck" };

describe("the drift check, before the ask (#897)", () => {
  it("asks nobody when the file changed after the decision and the frame now shows it", async () => {
    const { h, drifts, m } = await recapMorning({ changedAt: CHANGED_AFTER, frameA: UPDATED, judge: [SHOWS] });
    const report = await runDriftAsks(MORNING, m.deps);

    assert.deepEqual(m.posted, [], "no question");
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 0, "no card staged");
    assert.deepEqual(await drifts.pending(), [], "the finding leaves the queue");
    assert.deepEqual(await drifts.liveAsks(), []);
    assert.deepEqual(report.settled.map((s) => s.fileKey), [`figma:${FILE_KEY}`]);
    assert.match(report.summary, /^no file drift due this morning — 1 file\(s\) already show their decision, so not asked$/);
    assert.deepEqual(m.figma.calls().map((c) => [c.method, c.args[0], c.args[1]]), [
      ["versions", FILE_KEY, undefined],
      ["nodes", FILE_KEY, ["1:2"]],
    ]);
    const [judged] = m.provider.generated;
    assert.equal(judged!.system, FRAME_MATCH_SYSTEM);
    assert.match(judged!.prompt, /^SETTLED: The recap drops the Share button; tutors see it automatically\./);
    assert.match(judged!.prompt, /THE FRAME SHOWED THEN: The recap screen has a Share with tutor button\./);
    assert.match(judged!.prompt, /Recap\nShared with tutor automatically$/);
  });

  it("asks, saying when the file last changed, when the frame doesn't show the decision", async () => {
    const { h, drifts, m } = await recapMorning({ changedAt: CHANGED_AFTER, judge: [NOT_SHOWN] });
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1);
    const [card] = cardsOf(m.posted[0]!.blocks);
    assert.equal(card!.subtitle!.text, "<@U0BEA> · last changed Sep 29");
    assert.match(card!.body!.text, / · the file changed Sep 29, unconfirmed\.$/);
    const [live] = await drifts.liveAsks();
    assert.equal(live!.files[0]!.checkedThrough, Date.parse(CHANGED_AFTER), "the version judged is not judged again");
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 1);
  });

  it("asks when the judge is unsure, off its shape, failing or not configured", async () => {
    const unsure = [JSON.stringify({ shows: true, confidence: 0.5 }), "the frame looks updated", JSON.stringify({ shows: "yes", confidence: 1 })];
    for (const answer of unsure) {
      const { m } = await recapMorning({ changedAt: CHANGED_AFTER, frameA: UPDATED, judge: [answer] });
      await runDriftAsks(MORNING, m.deps);
      assert.equal(m.posted.length, 1, answer);
    }
    for (const provider of [fakeProvider({ generateFailMessage: "Gemini 429" }), fakeProvider({ generateUnavailableMessage: "no key" })]) {
      const { m } = await recapMorning({ changedAt: CHANGED_AFTER, frameA: UPDATED });
      m.deps.judge = modelFrameJudge(provider);
      await runDriftAsks(MORNING, m.deps);
      assert.equal(m.posted.length, 1);
    }
    const { m } = await recapMorning({ changedAt: CHANGED_AFTER, frameA: UPDATED });
    delete m.deps.judge;
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1, "with no judge, nothing is ever found shown");
    assert.deepEqual(m.figma.calls().map((c) => c.method), ["versions"], "and no frame is read for it");
  });

  it("asks without judging a link that names no frame", async () => {
    const whole = figmaFile("1-2", { url: `https://www.figma.com/design/${FILE_KEY}/Session-Recap` });
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [whole.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({ threads: [t], sources: [whole], replies: [reply(fileDrift(whole, [ts(29, 16)], "U0ADE"))] });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts, { changedAt: CHANGED_AFTER, judge: [SHOWS] });
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1);
    assert.match(cardsOf(m.posted[0]!.blocks)[0]!.subtitle!.text, /last changed Sep 29$/);
    assert.equal(m.provider.generated.length, 0);
    assert.deepEqual(m.figma.calls().map((c) => c.method), ["versions"]);
  });

  it("stops on a budget stop reading the frame, and posts nothing", async () => {
    const { m } = await recapMorning({ changedAt: CHANGED_AFTER, frameA: UPDATED, judge: [SHOWS] });
    m.figma.failNext("nodes", new SubrequestBudgetError(38));
    await assert.rejects(runDriftAsks(MORNING, m.deps), SubrequestBudgetError);
    assert.deepEqual(m.posted, []);
  });

  it("asks only the thread whose decision the frame doesn't show, and drafts the intake there", async () => {
    const one = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const two = thread({ user: "U0BEA", when: ts(29, 17), urls: [FIGMA_B.url] }, [{ user: "U0CY", when: ts(29, 18) }]);
    const { h, drifts } = night({
      threads: [one, two],
      sources: [FIGMA_A, FIGMA_B],
      replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)])), reply(fileDrift(FIGMA_B, [ts(29, 18)]))],
    });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    // Node 1-2 was updated; node 3-4 still shows the button.
    const m = morning(h, drifts, { changedAt: CHANGED_AFTER, frameA: UPDATED });
    m.deps.judge = async (input) => (input.frame.texts.includes("Shared with tutor automatically") ? "shows" : "unsure");
    const report = await runDriftAsks(MORNING, m.deps);

    assert.deepEqual(m.posted.map((p) => [p.threadTs, p.card]), [[two.root.ts, true]]);
    assert.deepEqual(report.settled, [{ channel: DESIGN, threadTs: one.root.ts, fileKey: `figma:${FILE_KEY}` }]);
    assert.deepEqual(
      m.figma.calls().map((c) => [c.method, c.args[1]]),
      [
        ["versions", undefined],
        ["nodes", ["1:2"]],
        ["nodes", ["3:4"]],
      ],
      "one versions read for the file, one read per frame",
    );
  });

  it("waits for the drift card a thread already holds before looking at its file", async () => {
    const { h, drifts, m, t } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    const other = figmaFile("9-9", { url: "https://www.figma.com/design/ZzOther9/Onboarding?node-id=9-9", title: "Onboarding" });
    const again = thread({ user: "U0STARTER", when: t.root.ts, urls: [other.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    await drifts.add([{ ...(await pendingOf(h, drifts, again, other))!, detectedAt: at(30, 22) }]);
    h.clock.now = at(31, 13);
    const calls = m.figma.calls().length;
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.figma.calls().length, calls, "no read for a finding that waits");
  });
});

describe("the drift check, while the report is live (#897)", () => {
  it("redraws the file's card in place, retires it, and posts nothing, once the frame shows the decision", async () => {
    const { h, drifts, m, t } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    const [report] = m.posted;
    const key = itemProposalKey(report!.ts, "1");
    const [live] = await drifts.liveAsks();
    assert.deepEqual(
      { role: live!.role, ts: live!.ts, threadTs: live!.threadTs, itemId: live!.files[0]!.itemId },
      { role: "card", ts: report!.ts, threadTs: t.root.ts, itemId: "1" },
    );

    // The designer updates the frame on Sep 30; the end-of-day run looks again.
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    const result = await recheckLiveAsks(RECHECK, r.deps);

    assert.deepEqual(r.edits.map((e) => [e.channel, e.ts]), [[DESIGN, report!.ts]], "the report itself, edited");
    const [card] = cardsOf(r.edits[0]!.blocks);
    assert.equal(card!.subtitle!.text, "Updated Sep 30. Nothing to do.");
    assert.deepEqual(labels(card!), ["Open in Figma"], "no Review: nothing left to decide");
    assert.equal(m.posted.length, 1, "edited, not replied to");
    assert.notEqual((await h.threadState.getProposalByTs(key)).state, "found", "retired: no Approve can file it");
    const events = await h.proposalEvents.eventsOf(key);
    assert.deepEqual(events.map((e) => [e.event, e.via, e.actorId]), [
      ["staged", "worker", null],
      ["cancelled", "worker", null],
    ]);
    assert.deepEqual(await drifts.liveAsks(), []);
    assert.equal(result.withdrawn.length, 1);
    assert.match(result.summary, /^looked at 1 decision\(s\), withdrew 1 question\(s\)$/);
  });

  it("edits the pointer in the other thread too", async () => {
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
    assert.deepEqual(m.posted.map((p) => p.card), [true, false]);

    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, m.figma, { judge: async () => "shows" });
    await recheckLiveAsks(RECHECK, r.deps);
    assert.deepEqual(r.edits.map((e) => e.ts), m.posted.map((p) => p.ts));
    assert.equal(cardsOf(r.edits[0]!.blocks)[0]!.subtitle!.text, "Updated Sep 30. Nothing to do.");
    assert.equal(r.edits[1]!.text, "The file now shows this thread's decision, updated Sep 30. Nothing to do.");
    assert.equal(m.posted.length, 2, "nothing posted");
  });

  it("leaves a card whose frame doesn't show it, judges each change once, and withdraws it when one does", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z" });
    h.clock.now = at(31, 4);
    const first = recheck(h, drifts, m.figma, { judge: [NOT_SHOWN] });
    await recheckLiveAsks(RECHECK, first.deps);
    assert.deepEqual(first.edits, []);
    assert.equal(first.provider.generated.length, 1);

    h.clock.now = at(31, 13);
    const second = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    await recheckLiveAsks(RECHECK, second.deps);
    assert.equal(second.provider.generated.length, 0, "the same version is not judged twice");
    assert.deepEqual(second.edits, []);

    seedFigmaFile(m.figma, { changedAt: "2026-10-01T15:00:00Z", frameA: UPDATED });
    h.clock.now = at(32, 4);
    const third = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    await recheckLiveAsks(RECHECK, third.deps);
    assert.deepEqual(third.edits.map((e) => cardsOf(e.blocks)[0]!.subtitle!.text), ["Updated Oct 1. Nothing to do."]);
  });

  it("withdraws each file's card as its own file catches up", async () => {
    const other = figmaFile("9-9", { url: "https://www.figma.com/design/ZzOther9/Onboarding?node-id=9-9", title: "Onboarding" });
    const t = thread({ user: "U0STARTER", when: ts(29, 15), urls: [FIGMA_A.url, other.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
    const { h, drifts } = night({
      threads: [t],
      sources: [FIGMA_A, other],
      replies: [reply(fileDrift(FIGMA_A, [ts(29, 16)], "U0ADE"), fileDrift(other, [ts(29, 16)], "U0ADE"))],
    });
    await runSweepJob(EOD, h.deps);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    m.figma.seedFile("ZzOther9", {
      versions: { versions: [{ id: "1", label: "v1", description: "", created_at: "2026-09-20T10:00:00Z", user: { handle: "bea.designs" } }] },
      nodes: { "9:9": frame(["Onboarding"]) },
    });
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted[0]!.text.split("\n")[0], "This thread settled two decisions that their Figma files have not caught up with.");

    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const first = recheck(h, drifts, m.figma, { judge: async () => "shows" });
    await recheckLiveAsks(RECHECK, first.deps);
    const after = cardsOf(first.edits[0]!.blocks);
    assert.deepEqual(after.map((c) => c.subtitle!.text), ["Updated Sep 30. Nothing to do.", "<@U0ADE> · last changed Sep 20"]);
    assert.deepEqual(labels(after[1]!), ["Review", "Open in Figma"], "the other file's card stays to decide");

    m.figma.seedFile("ZzOther9", {
      versions: { versions: [{ id: "2", label: null, description: null, created_at: "2026-10-01T15:00:00Z", user: { handle: "bea.designs" } }] },
    });
    h.clock.now = at(32, 4);
    const second = recheck(h, drifts, m.figma, { judge: async () => "shows" });
    await recheckLiveAsks(RECHECK, second.deps);
    assert.deepEqual(cardsOf(second.edits[0]!.blocks).map((c) => c.subtitle!.text), ["Updated Sep 30. Nothing to do.", "Updated Oct 1. Nothing to do."]);
    assert.deepEqual(await drifts.liveAsks(), []);
  });

  it("withdraws a Figma file's card and leaves the code's, which it can't look at", async () => {
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
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, m.figma, { judge: async () => "shows" });
    const result = await recheckLiveAsks(RECHECK, r.deps);
    assert.equal(result.checked, 1, "the Figma file alone is looked at");
    const cards = cardsOf(r.edits[0]!.blocks);
    assert.equal(cards[0]!.subtitle!.text, "Updated Sep 30. Nothing to do.");
    assert.deepEqual(labels(cards[1]!), ["Review", "Open on GitHub"]);
    assert.deepEqual((await drifts.liveAsks())[0]!.files.map((f) => f.kind), ["design-system-code"]);
  });

  it("leaves a card someone already decided", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    await h.threadState.retireProposal(itemProposalKey(m.posted[0]!.ts, "1"));
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    const result = await recheckLiveAsks(RECHECK, r.deps);
    assert.deepEqual(r.edits, [], "the card already says what happened");
    assert.deepEqual(await drifts.liveAsks(), []);
    assert.match(result.note ?? "", /its card is no longer live/);
  });

  it("looks and judges on a dry run, and edits, retires and writes nothing", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    const key = itemProposalKey(m.posted[0]!.ts, "1");
    const before = await drifts.liveAsks();
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS], dryRun: true });
    const result = await recheckLiveAsks(RECHECK, r.deps);
    assert.equal(r.provider.generated.length, 1);
    assert.deepEqual(result.withdrawn.map((w) => w.text), ["Updated Sep 30. Nothing to do."]);
    assert.match(result.summary, /would withdraw 1 question/);
    assert.deepEqual(r.edits, []);
    assert.equal((await h.threadState.getProposalByTs(key)).state, "found");
    assert.deepEqual(await drifts.liveAsks(), before);
  });
});
describe("no re-ping (#897)", () => {
  it("after 72 h with no answer, later mornings ask nothing and the file catching up edits nothing", async () => {
    const { h, drifts, m, t } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    assert.equal(m.posted.length, 1);

    // The thread stays busy, so the sweep finds the same drift on later nights.
    const again = (await pendingOf(h, drifts, t, FIGMA_A))!;
    for (const [found, askedAt] of [
      [at(33, 4), at(35, 13)],
      [at(36, 4), at(37, 13)],
    ] as const) {
      await drifts.add([{ ...again, detectedAt: found }]);
      h.clock.now = askedAt;
      await runDriftAsks(MORNING, m.deps);
      assert.equal(m.posted.length, 1, `nothing posted on ${new Date(askedAt).toISOString().slice(0, 10)}`);
      assert.deepEqual(await drifts.pending(), [], "the thread was asked: the finding leaves");
    }

    // Past its 72 h, the frame finally changes.
    seedFigmaFile(m.figma, { changedAt: "2026-10-06T15:00:00Z", frameA: UPDATED });
    h.clock.now = at(37, 20);
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    const report = await recheckLiveAsks(RECHECK, r.deps);
    assert.deepEqual(r.edits, [], "no edit either");
    assert.equal(r.provider.generated.length, 0);
    assert.equal(report.checked, 0);
    assert.equal(m.posted.length, 1);
    assert.deepEqual(await drifts.liveAsks(), []);
  });
});

describe("the frame judge", () => {
  const input = { threadSays: "The recap drops the Share button.", sourceSays: "It has a Share button.", frame: { name: "Recap", texts: ["Recap"], truncated: false } };

  it("counts only a confident yes", () => {
    assert.equal(parseFrameMatch('{"shows":true,"confidence":0.7}'), "shows");
    assert.equal(parseFrameMatch('```json\n{"shows": true, "confidence": 0.95}\n```'), "shows");
    for (const reply of ['{"shows":true,"confidence":0.69}', '{"shows":true}', '{"shows":false,"confidence":1}', '{"shows":true,"confidence":3}', "yes", ""]) {
      assert.equal(parseFrameMatch(reply), "unsure", reply);
    }
  });

  it("shows the decision, the frame as it was and as it is, and says when the frame was cut", () => {
    assert.equal(
      frameMatchPrompt(input),
      'SETTLED: The recap drops the Share button.\nTHE FRAME SHOWED THEN: It has a Share button.\n\nTHE FRAME NOW — "Recap", its text layers in order:\nRecap',
    );
    assert.match(frameMatchPrompt({ ...input, frame: { name: "Recap", texts: [], truncated: true } }), /\(only the first ones: the frame holds more\):\n\(no text layers\)$/);
  });

  it("asks the detector's tier, and is unsure when the model fails", async () => {
    const provider = fakeProvider({ generateReplies: [SHOWS] });
    assert.equal(await modelFrameJudge(provider)(input), "shows");
    assert.equal(provider.generated[0]!.tier, "chill");
    assert.equal(await modelFrameJudge(fakeProvider({ generateFailMessage: "500" }))(input), "unsure");
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

describe("the drift check's limits (#897 review)", () => {
  it("looks at no more files a morning than its cap, and a thread past it waits whole for tomorrow", async () => {
    const threads = Array.from({ length: MAX_LOOKS_PER_MORNING + 1 }, (_, i) =>
      thread({ user: "U0STARTER", when: ts(29, 8 + i), urls: [FIGMA_A.url] }, [{ user: "U0ADE", when: ts(29, 8 + i, 30) }]),
    );
    const { h, drifts } = night({
      threads,
      sources: [FIGMA_A],
      replies: threads.map((t) => reply(fileDrift(FIGMA_A, [t.messages[1]!.ts]))),
    });
    await runSweepJob(EOD, h.deps);
    assert.equal((await drifts.pending()).length, MAX_LOOKS_PER_MORNING + 1);
    h.clock.now = at(30, 13);
    const m = morning(h, drifts);
    const report = await runDriftAsks(MORNING, m.deps);

    assert.match(report.note ?? "", /1 thread\(s\) wait for tomorrow's look at their files/);
    const newest = threads[threads.length - 1]!;
    assert.ok(
      (await drifts.pending()).some((f) => f.evidence.threadTs === newest.root.ts),
      "the newest thread's finding stays queued for tomorrow",
    );
    assert.ok(!m.posted.some((p) => p.threadTs === newest.root.ts), "and its thread is not asked today");
  });

  it("still looks at one question that names more files than a re-check's cap", async () => {
    const { h, drifts } = await recapMorning();
    const figma = createInMemoryFigma();
    const keys = Array.from({ length: MAX_RECHECKS_PER_RUN + 1 }, (_, i) => `File${i}`);
    for (const key of keys) {
      figma.seedFile(key, {
        versions: { versions: [{ id: "1", label: null, description: null, created_at: "2026-09-30T18:00:00Z", user: { handle: "bea.designs" } }] },
        nodes: { "1:2": frame(UPDATED) },
      });
    }
    await drifts.saveLiveAsk({
      channel: DESIGN,
      ts: ts(30, 13, 0, 1),
      threadTs: ts(29, 15),
      role: "question",
      askedAt: at(30, 13),
      files: keys.map((key) => ({
        fileKey: `figma:${key}`,
        kind: "figma" as const,
        url: `https://www.figma.com/design/${key}/x?node-id=1-2`,
        decidedAt: at(29, 16),
        threadSays: "The recap drops the Share button.",
        sourceSays: "It has a Share button.",
        checkedThrough: at(29, 16),
      })),
    });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, figma, { judge: async () => "shows" });
    const report = await recheckLiveAsks(RECHECK, r.deps);
    assert.equal(report.checked, keys.length);
    assert.deepEqual(r.edits.map((e) => e.text), ["The files now show this thread's decisions, updated Sep 30. Nothing to do."]);
  });
});

describe("a caught-up card's withdrawal and the budget (#897 review)", () => {
  it("stops before the look when the withdrawal after it would not fit, and finishes on the retry", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);

    // Room for the look, and none for the retire, edit and record after it.
    const tight = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    tight.deps.meter = { headroom: () => ({ subrequests: 3, d1Queries: 0 }) };
    await assert.rejects(recheckLiveAsks(RECHECK, tight.deps), SubrequestBudgetError);
    assert.equal((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found", "not retired with its buttons still up");
    assert.deepEqual(tight.edits, []);
    assert.equal(tight.provider.generated.length, 0, "stopped before the judgement, so the retry repeats nothing");

    const retry = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    await recheckLiveAsks(RECHECK, retry.deps);
    assert.deepEqual(retry.edits.map((e) => e.ts), [card!.item!.messageTs], "the report, redrawn");
    assert.notEqual((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found");
  });
});

describe("a question whose card was filed (#897 review)", () => {
  it("is left as it is once the file catches up, since its card's Approve filed an intake", async () => {
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
    // Someone approves the card in Review: the intake is filed.
    await recordProposalEvents(h.proposalEvents, [proposalEvent(card!.proposalTs, "confirmed", at(30, 15), "button")]);
    await h.threadState.retireProposal(card!.proposalTs);

    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(31, 4);
    const r = recheck(h, drifts, m.figma, { judge: async () => "shows" });
    await recheckLiveAsks(RECHECK, r.deps);
    assert.deepEqual(r.edits, [], "neither says there is nothing to do");
    assert.deepEqual(await drifts.liveAsks(), []);
  });
});

describe("a file-change notification (#896)", () => {
  it("withdraws a caught-up question within its own job, the way the scheduled runs do", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    assert.equal(await drifts.liveFileUntil(`figma:${FILE_KEY}`), at(30, 13) + DRIFT_CARD_TTL_MS, "the ask marked its file");
    const [card] = await h.threadState.getProposalsByChannel(DESIGN);

    // The designer updates the frame that afternoon; Figma's FILE_UPDATE follows.
    seedFigmaFile(m.figma, { changedAt: "2026-09-30T18:00:00Z", frameA: UPDATED });
    h.clock.now = at(30, 19);
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    const report = await recheckOnUpdate(FILE_KEY, { ...r.deps, store: drifts });

    assert.ok(report);
    assert.deepEqual(r.edits.map((e) => e.ts), [card!.item!.messageTs]);
    assert.equal(cardsOf(r.edits[0]!.blocks)[0]!.subtitle!.text, "Updated Sep 30. Nothing to do.");
    assert.notEqual((await h.threadState.getProposalByTs(card!.proposalTs)).state, "found");
    assert.equal(m.posted.length, 1, "edited, not replied to");
  });

  it("costs one read for a file no live question names: no list, no Figma call", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    const calls = m.figma.calls().length;
    let listed = 0;
    const store = { ...drifts, liveAsks: async () => ((listed += 1), drifts.liveAsks()) };
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    assert.equal(await recheckOnUpdate("SomeOtherFile9", { ...r.deps, store }), null);
    assert.equal(listed, 0, "no live record was listed");
    assert.equal(m.figma.calls().length, calls, "and Figma was not called");
    assert.equal(r.provider.generated.length, 0);
  });

  it("looks no further once the question's 72 h are up", async () => {
    const { h, drifts, m } = await recapMorning();
    await runDriftAsks(MORNING, m.deps);
    seedFigmaFile(m.figma, { changedAt: "2026-10-03T15:00:00Z", frameA: UPDATED });
    h.clock.now = at(30, 13) + DRIFT_CARD_TTL_MS + 1;
    const r = recheck(h, drifts, m.figma, { judge: [SHOWS] });
    assert.equal(await recheckOnUpdate(FILE_KEY, { ...r.deps, store: drifts }), null);
    assert.deepEqual(r.edits, []);
  });
});
