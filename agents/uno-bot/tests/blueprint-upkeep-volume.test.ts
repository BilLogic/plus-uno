// Blueprint upkeep at real volume, at the job → sweep-section seam: a card
// that changes several paths gets one card per path, all on its place's one
// message; past the carousel's ten the opener says how many wait in the
// thread, and they go up there; each draft's gaps are asked of the card's
// owner by tag; a reply in the thread redrafts that card in place; the
// end-of-day work spreads over its numbered jobs without any one passing the
// lookup ceiling, PRD-heavy cards included; and a card is weighed once per
// moment, however often it comes back.
//
// Faked: the Roadmap, the card's words, `search_blueprint`'s rows, the paths,
// the model, and an alarm's subrequest meter (each fake read charges what its
// real one spends). Real: the gate, the drafting, the jobs, the section, the
// sweep's post, the thread job and the redraft.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ModelPrompt, ModelProvider, ModelText } from "../src/agent/model-provider";
import type { ModelTier } from "../src/agent/routing";
import type { BlueprintRow } from "../src/integrations/blueprint";
import {
  DRAFT_JOBS,
  draftMatched,
  handOverRevisions,
  MATCH_JOBS,
  matchShipped,
  postOverflow,
  redraftRevision,
  replanRows,
  revisionSection,
  serviceChangeGate,
  UPKEEP_SECTION,
  type PathToday,
  type PlannedRows,
  type RevisionHanded,
  type RevisionThread,
  type RevisionThreads,
  type ShippedCard,
  type ShippedDeps,
  type UpkeepState,
} from "../src/blueprint-upkeep/index";
import { sectionHandOffIn } from "../src/sweep/sections";
import { runSweepJob } from "../src/sweep/index";
import { memoryRunStorage, sweepHarness } from "./helpers/sweep-harness";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { reportRecord, type DecisionReport } from "../src/slack/decision-cards";
import { SubrequestBudgetError } from "../src/net";
import { LOOKUP_CEILING } from "../src/agent/loop-policy";

const NOW = Date.UTC(2026, 9, 16, 13, 5);
const DATE = "2026-10-16";
const TEAM = "C0TUTORING";
const OWNER = "U0OWNER001";
const BILL = "U0BILL0001";
const STRANGER = "U0SOMEONE1";

const card = (n: number, over: Partial<ShippedCard> = {}): ShippedCard => ({
  pageId: `card${n}`,
  url: `https://www.notion.so/card${n}`,
  title: `Shipped work ${n}`,
  number: 2200 + n,
  stage: "deployed",
  pillars: ["Tutoring"],
  contributors: [{ id: "n-owner", name: "Owner Person" }],
  lastEditedAt: Date.UTC(2026, 9, 15, 18),
  ...over,
});
const TEXT = "Today a supervisor approves every session swap. Tutors now confirm their own swaps in the app, and the supervisor is only told.";

/** Path `i`: the same grid under its own name and ids. */
function path(i: number): PathToday {
  return {
    pathId: `path-${i}`,
    scenario: "Session swap",
    path: `Path ${i}`,
    status: "built",
    lanes: [
      { id: "lane-tutor", name: "Regular Tutor" },
      { id: "lane-sup", name: "Supervisor" },
    ],
    steps: [
      { id: "step-request", name: "Request swap" },
      { id: "step-approve", name: "Approve swap" },
    ],
    cells: [
      { id: `cell-${i}-1`, laneId: "lane-tutor", stepId: "step-request", content: "Tutor asks for a swap", status: "live" },
      { id: `cell-${i}-2`, laneId: "lane-sup", stepId: "step-approve", content: "Supervisor approves the swap", status: "live" },
    ],
    link: `https://plus-uno.netlify.app/blueprint/?cell=cell-${i}-1`,
  };
}
const pathOfCell = (cellId: string) => path(Number(/^cell-(\d+)-/.exec(cellId)?.[1]));

/** Search rows confidently matching paths `from`..`from + count - 1`. */
const rowsFor = (count: number, from = 1): BlueprintRow[] =>
  Array.from({ length: count }, (_, k) => ({
    kind: "cell" as const,
    id: `cell-${from + k}-2`,
    title: "x",
    scenario: "Session swap",
    path: `Path ${from + k}`,
    lane: "Supervisor",
    step: "Approve swap",
    matchedBy: "vector+keyword",
  }));

const SERVICE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor approves session swap",
  quote: "Tutors now confirm their own swaps in the app, and the supervisor is only told.",
});
const draftReply = (content = "Tutor confirms the swap in the app", gaps: string[] = []) =>
  JSON.stringify({
    rows: [
      { change: "changed", step_id: "step-approve", lane_id: "lane-tutor", content },
      { change: "deprecated", step_id: "step-approve", lane_id: "lane-sup" },
    ],
    confidence: 0.8,
    gaps,
  });

/** A model that answers each tier's prompts with a function of the prompt. */
function model(answer: Partial<Record<ModelTier, (p: ModelPrompt) => string>>) {
  const asked: ModelPrompt[] = [];
  const provider = {
    name: "fake",
    async generate(prompt: ModelPrompt): Promise<ModelText> {
      asked.push(prompt);
      const fn = answer[prompt.tier];
      return fn ? { ok: true, model: prompt.tier, text: fn(prompt) } : { ok: false, model: prompt.tier, message: "no reply" };
    },
  } as unknown as ModelProvider;
  return { provider, asked };
}

function box<T>(value: T) {
  const b = { value };
  return { b, store: { read: async () => structuredClone(b.value), write: async (v: T) => void (b.value = structuredClone(v)) } };
}

/** An alarm's meter: each fake read charges its real cost, and the call that
 *  would pass the ceiling throws as `countedFetch` does. */
function meter() {
  const m = { used: 0, peak: 0, stops: 0 };
  const spend = (n: number) => {
    if (m.used + n > LOOKUP_CEILING) throw new SubrequestBudgetError(LOOKUP_CEILING);
    m.used += n;
    m.peak = Math.max(m.peak, m.used);
  };
  return { m, spend, alarm: () => void (m.used = 0), headroom: () => ({ subrequests: LOOKUP_CEILING - m.used }) };
}

function world(opts: { cards: () => ShippedCard[]; rows: (card: string) => BlueprintRow[]; prdHeavy?: boolean; gaps?: string[] }) {
  const state = box<UpkeepState>({ cursor: "2026-10-15T10:00:00.000Z", waiting: [] });
  const marks = new Set<string>();
  const meterOf = meter();
  const ai = model({ default: () => SERVICE, grind: () => draftReply(undefined, opts.gaps ?? []) });
  let current = "";
  const deps: ShippedDeps = {
    roadmap: {
      shippedSince: async () => {
        meterOf.spend(1);
        return opts.cards();
      },
    },
    evidence: async (c) => {
      current = c.pageId;
      // The card's page and three block pages, then its PRD's the same.
      meterOf.spend(opts.prdHeavy ? 8 : 4);
      return TEXT;
    },
    gate: serviceChangeGate({
      provider: {
        name: "metered",
        generate: async (p: ModelPrompt) => (meterOf.spend(1), ai.provider.generate(p)),
      } as unknown as ModelProvider,
      search: async () => (meterOf.spend(3), opts.rows(current)),
    }),
    readPath: async (cellId) => (meterOf.spend(5), pathOfCell(cellId)),
    provider: { name: "metered", generate: async (p: ModelPrompt) => (meterOf.spend(1), ai.provider.generate(p)) } as unknown as ModelProvider,
    ownerOf: async () => (meterOf.spend(2), OWNER),
    placeOf: () => TEAM,
    leadId: BILL,
    state: state.store,
    weighed: { has: async (k) => marks.has(k), add: async (k) => void marks.add(k) },
    meter: { headroom: meterOf.headroom },
    now: () => NOW,
  };
  return { deps, state, marks, meter: meterOf, ai };
}

/** One end of day as the runner plays it: each job on an alarm of its own,
 *  a job the ceiling stops deferred and run again. The peak any alarm spent,
 *  and how many times the ceiling stopped a job part-way. */
async function endOfDay(w: ReturnType<typeof world>, runDate: string): Promise<number> {
  let peak = 0;
  w.meter.m.stops = 0;
  const jobs = [...Array.from({ length: MATCH_JOBS }, () => matchShipped), ...Array.from({ length: DRAFT_JOBS }, () => draftMatched)];
  for (const job of jobs) {
    for (let tries = 0; tries < 3; tries++) {
      w.meter.alarm();
      try {
        await job(w.deps, { runDate });
        break;
      } catch (err) {
        if (!(err instanceof SubrequestBudgetError)) throw err;
        w.meter.m.stops += 1;
      } finally {
        peak = Math.max(peak, w.meter.m.used);
      }
    }
  }
  return peak;
}

function memoryThreads(): RevisionThreads & { all: Map<string, RevisionThread> } {
  const all = new Map<string, RevisionThread>();
  return {
    all,
    read: async (channel, ts) => structuredClone(all.get(`${channel}:${ts}`) ?? null),
    write: async (t) => void all.set(`${t.channel}:${t.ts}`, structuredClone(t)),
  };
}

/** One morning: the hand-over, the sweep's post with the section, then the
 *  thread job. What a person sees, and what was staged. */
async function morning(state: ReturnType<typeof box<UpkeepState>>) {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const handOff = sectionHandOffIn<RevisionHanded>(memoryRunStorage(), UPKEEP_SECTION);
  const staged: PendingProposal[] = [];
  const lines: Array<{ channel: string; threadTs: string; text: string }> = [];
  const threadReports: Array<{ channel: string; threadTs: string; report: DecisionReport; ts: string }> = [];
  const threads = memoryThreads();
  const stage = async (proposal: PendingProposal) => {
    staged.push(proposal);
    await threadState.putProposal(proposal);
  };
  const post = async (channel: string, threadTs: string, text: string) => void lines.push({ channel, threadTs, text });
  const section = revisionSection({ state: state.store, stage, threads, post, now: () => NOW }, handOff, DATE);
  const h = sweepHarness({ channels: {}, now: NOW, runDate: DATE, threadState });
  h.deps.sections = [section];
  await handOverRevisions({ state: state.store, handOff, date: DATE });
  await runSweepJob({ key: "sweep-post", kind: "sweep-post" }, h.deps);
  await postOverflow({
    state: state.store,
    async postReport(channel, threadTs, report, ttlMs) {
      const ts = `${threadTs.split(".")[0]}.9${String(threadReports.length).padStart(5, "0")}`;
      threadReports.push({ channel, threadTs, report, ts });
      await threadState.putReport(reportRecord(channel, ts, report, ttlMs));
      return ts;
    },
    stage,
    threads,
    post,
    date: DATE,
    now: () => NOW,
  });
  return { posts: h.posted, staged, lines, threadReports, threads, threadState, stage };
}

describe("a card that changes several paths", () => {
  it("gets one card per path, all in its place's one message", async () => {
    const w = world({ cards: () => [card(1)], rows: () => rowsFor(3) });
    await endOfDay(w, DATE);
    const m = await morning(w.state);
    assert.equal(m.posts.length, 1, "one message");
    assert.equal(m.posts[0]!.channel, TEAM);
    assert.deepEqual(
      m.staged.map((p) => (p.input as { pathId: string }).pathId),
      ["path-1", "path-2", "path-3"],
    );
    assert.equal(new Set(m.staged.map((p) => p.proposalTs)).size, 3, "each its own proposal");
    assert.deepEqual(m.threadReports, [], "nothing past the carousel");
  });

  it("past ten, shows ten and says how many more are in the thread, where they then go up", async () => {
    const w = world({ cards: () => [card(1)], rows: () => rowsFor(12) });
    await endOfDay(w, DATE);
    const m = await morning(w.state);
    assert.equal(m.posts.length, 1, "one message at the channel's top");
    assert.match(m.posts[0]!.text, /\+2 more in the thread/);
    assert.equal(m.threadReports.length, 1, "one report in its thread");
    const inThread = m.threadReports[0]!;
    assert.equal(inThread.threadTs, m.posts[0]!.ts, "in the morning message's thread");
    assert.equal(inThread.report.shown.length, 2);
    assert.match(inThread.report.shown[0]!.title, /^11\. Session swap › Path 11/, "numbered on from the carousel");
    assert.equal(m.staged.length, 12, "every card decidable");
    assert.deepEqual(w.state.b.value.waiting, [], "nothing left waiting");
  });
});

describe("what a draft could not verify", () => {
  it("is asked of the card's owner by tag in the thread", async () => {
    const w = world({ cards: () => [card(1)], rows: () => rowsFor(1), gaps: ["whether the supervisor is told by email or in the app"] });
    await endOfDay(w, DATE);
    const m = await morning(w.state);
    assert.equal(m.lines.length, 1);
    const ask = m.lines[0]!;
    assert.equal(ask.threadTs, m.posts[0]!.ts);
    assert.match(ask.text, new RegExp(`^<@${OWNER}> On 1\\. \\*Session swap › Path 1\\*`));
    assert.match(ask.text, /whether the supervisor is told by email or in the app/);
  });

  it("asks nothing when every draft verified", async () => {
    const w = world({ cards: () => [card(1)], rows: () => rowsFor(2) });
    await endOfDay(w, DATE);
    assert.deepEqual((await morning(w.state)).lines, []);
  });
});

/** What a redraft is wired to, over a morning's store: the reply's ports,
 *  the message edits it made, and the model it drafts with. */
function redraftKit(w: ReturnType<typeof world>, m: Awaited<ReturnType<typeof morning>>, grind: () => string) {
  const edits: Array<{ channel: string; ts: string; text: string }> = [];
  const redraftModel = model({ grind });
  const deps = {
    threads: m.threads,
    card: async (key: string) => {
      const found = await m.threadState.getProposalByTs(key);
      return found.state === "found" ? found.proposal : null;
    },
    readPath: (cellId: string) => w.deps.readPath(cellId),
    provider: redraftModel.provider,
    reports: m.threadState,
    edit: async (channel: string, ts: string, message: { text: string }) => void edits.push({ channel, ts, text: message.text }),
    post: async (channel: string, threadTs: string, text: string) => void m.lines.push({ channel, threadTs, text }),
    stage: m.stage,
    restore: async (p: PendingProposal) => void (await m.threadState.putProposal(p)),
    retire: async (ts: string) => void (await m.threadState.retireProposal(ts)),
    clearRevising: (ts: string) => m.threadState.clearRevising(ts),
    superseded: async () => {},
    replan: (record: PlannedRows) => replanRows(w.state.store, record),
    now: () => NOW,
  };
  const reply = (user: string, text: string) => ({ channel: TEAM, threadTs: m.posts[0]!.ts, user, text, mentionsBot: false });
  return { deps, edits, reply, redraftModel };
}

describe("a reply in the card's thread", () => {
  async function upAndRunning(paths = 1) {
    const w = world({ cards: () => [card(1)], rows: () => rowsFor(paths) });
    await endOfDay(w, DATE);
    const m = await morning(w.state);
    return { m, ...redraftKit(w, m, () => draftReply("Tutor confirms the swap; the supervisor gets an email")) };
  }

  it("from the owner redrafts that card's revision on the same card", async () => {
    const { m, deps, edits, reply, redraftModel } = await upAndRunning();
    const old = m.staged[0]!;
    const handled = await redraftRevision(deps, reply(OWNER, "The supervisor is told by email, not in the app."));
    assert.equal(handled, true);
    assert.match(redraftModel.asked[0]!.prompt, /The supervisor is told by email, not in the app\./, "the draft saw the correction");
    const next = m.staged.at(-1)!;
    assert.notEqual(next.proposalTs, old.proposalTs);
    assert.equal(next.item?.messageTs, old.item?.messageTs, "the same report message");
    assert.equal(next.supersedeKey, old.supersedeKey, "the same card's slot");
    assert.match(next.proposalText, /the supervisor gets an email/);
    assert.deepEqual(next.confirmers, old.confirmers);
    assert.equal((await m.threadState.getProposalByTs(old.proposalTs)).state === "found", false, "the old draft can no longer be approved");
    assert.equal(edits.length, 1);
    assert.equal(edits[0]!.ts, m.posts[0]!.ts, "the morning message redrawn in place");
    assert.match(m.lines.at(-1)!.text, /Redrafted 1\. \*Session swap › Path 1\*/);
  });

  it("names the card by number when its writer may approve several", async () => {
    const { m, deps, reply } = await upAndRunning(2);
    assert.equal(await redraftRevision(deps, reply(BILL, "The supervisor is emailed.")), true);
    assert.match(m.lines.at(-1)!.text, /Which revision/, "asked which");
    const before = m.staged.length;
    assert.equal(await redraftRevision(deps, reply(BILL, "2: The supervisor is emailed.")), true);
    assert.equal(m.staged.length, before + 1);
    assert.equal((m.staged.at(-1)!.input as { pathId: string }).pathId, "path-2");
  });

  it("from someone who cannot approve it is left to the thread", async () => {
    const { m, deps, reply } = await upAndRunning();
    const before = m.staged.length;
    assert.equal(await redraftRevision(deps, reply(STRANGER, "Nice one!")), false);
    assert.equal(m.staged.length, before);
  });
});

describe("the end of day's budget", () => {
  it("spreads a busy week of PRD-heavy cards over its jobs, no alarm past the ceiling", async () => {
    const cards = Array.from({ length: 9 }, (_, i) => card(i + 1));
    // Each card changes two paths of its own.
    const w = world({ cards: () => cards, rows: (pageId) => rowsFor(2, Number(pageId.slice(4)) * 2 - 1), prdHeavy: true });
    const peak = await endOfDay(w, DATE);
    assert.ok(peak <= LOOKUP_CEILING, `peak ${peak} within ${LOOKUP_CEILING}`);
    assert.equal(w.meter.m.stops, 0, "no job is stopped part-way: each starts a card only when it fits");
    assert.equal(w.state.b.value.waiting.length, 18, "every card's every path drafted in one night");
  });

  it("carries what one night cannot reach to the next, still within the ceiling", async () => {
    const cards = Array.from({ length: 20 }, (_, i) => card(i + 1));
    const w = world({ cards: () => cards, rows: (pageId) => rowsFor(1, Number(pageId.slice(4))), prdHeavy: true });
    const first = await endOfDay(w, DATE);
    const drafted = w.state.b.value.waiting.length;
    assert.ok(drafted > 0 && drafted < 20, `one night reaches some (${drafted}), not all`);
    const second = await endOfDay(w, "2026-10-17");
    assert.ok(Math.max(first, second) <= LOOKUP_CEILING);
    assert.equal(w.meter.m.stops, 0);
    assert.equal(w.state.b.value.waiting.length, 20, "the next night finishes");
    assert.equal(w.ai.asked.filter((p) => p.tier === "default").length, 20, "each card judged once");
  });
});

describe("a card weighed once", () => {
  it("is not drafted again when it comes back on a later night, even with its state lost", async () => {
    const w = world({ cards: () => [card(1)], rows: () => rowsFor(1) });
    await endOfDay(w, DATE);
    assert.equal(w.state.b.value.waiting.length, 1);
    const asked = w.ai.asked.length;
    // Edited again after it shipped, so the query returns it; the state record is gone.
    w.state.b.value = { cursor: "2026-10-15T10:00:00.000Z", waiting: [] };
    await endOfDay(w, "2026-10-17");
    assert.equal(w.state.b.value.waiting.length, 0, "nothing drafted");
    assert.equal(w.ai.asked.length, asked, "not judged or drafted again");
  });
});

describe("a design hand-off redrafted in its thread", () => {
  it("is promoted at its deploy as redrafted: the rows its Approve wrote", async () => {
    let stage: ShippedCard["stage"] = "designed";
    const w = world({ cards: () => [card(1, { stage })], rows: () => rowsFor(1) });
    let blueprint = path(1);
    w.deps.readPath = async () => structuredClone(blueprint);

    // The hand-off drafts a tutor row at Approve swap; its owner corrects it.
    await endOfDay(w, DATE);
    const m = await morning(w.state);
    const redrafted = "Supervisor is emailed about the request";
    const settled = () =>
      JSON.stringify({
        rows: [
          { change: "added", step_id: "step-request", lane_id: "lane-sup", content: redrafted },
          { change: "deprecated", step_id: "step-approve", lane_id: "lane-sup" },
        ],
        confidence: 0.8,
        gaps: [],
      });
    const kit = redraftKit(w, m, settled);
    assert.equal(await redraftRevision(kit.deps, kit.reply(OWNER, "It's the supervisor who's emailed, at the request.")), true);

    // ✅ on the redrafted card writes its rows, as the writer would.
    const approved = m.staged.at(-1)!;
    type Row = { stepId: string; laneId: string; content: string; to: PathToday["status"] };
    for (const row of approved.input.rows as Row[]) {
      blueprint = {
        ...blueprint,
        cells: [
          ...blueprint.cells.filter((c) => !(c.stepId === row.stepId && c.laneId === row.laneId)),
          { id: `w-${row.stepId}-${row.laneId}`, stepId: row.stepId, laneId: row.laneId, content: row.content, status: row.to },
        ],
      };
    }

    // The card deploys: its promotion lists the redrafted rows, nothing of the first draft.
    stage = "deployed";
    // The card's words now say what the thread settled, so the deploy's
    // redraft of the path finds nothing to add.
    const atDeploy = model({ grind: settled });
    w.deps.provider = atDeploy.provider;
    const asked = w.ai.asked.length;
    await endOfDay(w, "2026-10-17");
    assert.equal(w.ai.asked.length, asked, "a promotion: no judgement");
    assert.equal(atDeploy.asked.length, 1, "one redraft against the card's words now");
    const promoted = (await morning(w.state)).staged;
    assert.equal(promoted.length, 1);
    assert.deepEqual(
      (promoted[0]!.input.rows as Array<Row & { from: string | null }>).map((r) => [r.stepId, r.laneId, r.from, r.to, r.content]),
      [
        ["step-request", "lane-sup", "planned", "live", redrafted],
        ["step-approve", "lane-sup", "live", "deprecated", "Supervisor approves the swap"],
      ],
    );
  });
});
