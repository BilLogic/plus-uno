// Blueprint upkeep from shipped work, at the job → sweep-section seam: a
// Roadmap card that reached `Dev Status: Deployed` since the last run goes
// through the service-change gate, gets one blueprint revision drafted, and
// shows as one card in its place's one morning message — whose ✅ only the
// card's owner or Bill may give, and whose rows are written `live`.
//
// Faked: the Roadmap (deployed cards and their text), `search_blueprint`'s
// rows, the path the match sits on, and the model (one scripted reply per
// tier). Real: the gate, the drafting, the card, the section, the sweep's post
// and the Gate's confirmer rule.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ModelPrompt, ModelProvider, ModelText } from "../src/agent/model-provider";
import type { ModelTier } from "../src/agent/routing";
import type { BlueprintRow } from "../src/integrations/blueprint";
import {
  handOverRevisions,
  revisionSection,
  runShippedRevisions,
  serviceChangeGate,
  UPKEEP_SECTION,
  type PathToday,
  type RevisionHanded,
  type ShippedCard,
  type ShippedDeps,
  type UpkeepState,
} from "../src/blueprint-upkeep/index";
import { sectionHandOffIn } from "../src/sweep/sections";
import { runSweepJob } from "../src/sweep/index";
import { memoryRunStorage, sweepHarness } from "./helpers/sweep-harness";
import { resolveSignal, type GateSignal } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";

const NOW = Date.UTC(2026, 9, 16, 13, 5);
const DATE = "2026-10-16";
const TEAM = "C0TUTORING";
const DESIGN = "C0DESIGN";
const OWNER = "U0OWNER001";
const BILL = "U0BILL0001";
const STANDING = "U0STAND001";

const CARD: ShippedCard = {
  pageId: "card1",
  url: "https://www.notion.so/card1",
  title: "Tutors confirm their own session swaps",
  number: 2292,
  stage: "deployed",
  pillars: ["Tutoring"],
  contributors: [{ id: "n-owner", name: "Owner Person" }],
  lastEditedAt: Date.UTC(2026, 9, 15, 18),
};
const CARD_TEXT =
  "Today a supervisor approves every session swap. Tutors now confirm their own swaps in the app, and the supervisor is only told. Shipped behind no flag.";

const DS_CARD: ShippedCard = { ...CARD, pageId: "card2", url: "https://www.notion.so/card2", title: "Button tokens to v2", number: 2300 };

const PATH: PathToday = {
  pathId: "path-swap",
  scenario: "Session swap",
  path: "Happy Path",
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
    { id: "cell-1", laneId: "lane-tutor", stepId: "step-request", content: "Tutor asks for a swap", status: "live" },
    { id: "cell-2", laneId: "lane-sup", stepId: "step-approve", content: "Supervisor approves the swap", status: "live" },
  ],
  link: "https://plus-uno.netlify.app/blueprint/?cell=cell-1",
};

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "x", scenario: "Session swap", path: "Happy Path", lane: "Supervisor", step: "Approve swap", matchedBy: "vector+keyword" },
];
const WEAK: BlueprintRow[] = [{ kind: "cell", id: "cell-9", title: "x", scenario: "Onboarding", path: "Happy Path", score: 0.55, matchedBy: "vector" }];

const SERVICE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor approves session swap",
  quote: "Tutors now confirm their own swaps in the app, and the supervisor is only told.",
});
const NOT_SERVICE = JSON.stringify({ changes_service: false, confidence: 0.95, query: "", quote: "" });
const DRAFT = JSON.stringify({
  rows: [
    { change: "changed", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap in the app" },
    { change: "deprecated", step_id: "step-approve", lane_id: "lane-sup" },
  ],
  confidence: 0.8,
  gaps: ["whether the supervisor is told by email or in the app"],
});

/** A model scripted by tier: each tier replays its own replies, in order. */
function scripted(replies: Partial<Record<ModelTier, Array<string | { fail: string }>>>) {
  const asked: ModelPrompt[] = [];
  const provider = {
    name: "scripted",
    async generate(prompt: ModelPrompt): Promise<ModelText> {
      asked.push(prompt);
      const next = replies[prompt.tier]?.shift();
      if (next === undefined) return { ok: false, model: prompt.tier, message: "no scripted reply" };
      if (typeof next !== "string") return { ok: false, model: prompt.tier, message: next.fail };
      return { ok: true, model: `${prompt.tier}-model`, text: next };
    },
  } as unknown as ModelProvider;
  return { provider, asked };
}

function box<T>(value: T) {
  const b = { value, writes: 0 };
  return { b, store: { read: async () => b.value, write: async (v: T) => void ((b.value = v), (b.writes += 1)) } };
}

function world(opts: {
  cards?: ShippedCard[];
  text?: Record<string, string>;
  search?: BlueprintRow[];
  model: ReturnType<typeof scripted>;
  state?: UpkeepState;
}) {
  const state = box<UpkeepState>(opts.state ?? { cursor: "2026-10-15T10:00:00.000Z", seen: [], waiting: [] });
  const searched: string[] = [];
  const deps: ShippedDeps = {
    roadmap: { shippedSince: async () => opts.cards ?? [CARD] },
    evidence: async (card) => opts.text?.[card.pageId] ?? CARD_TEXT,
    gate: serviceChangeGate({
      provider: opts.model.provider,
      search: async (q) => {
        searched.push(q);
        return opts.search ?? MATCH;
      },
    }),
    readPath: async (cellId) => (cellId === "cell-2" ? PATH : null),
    provider: opts.model.provider,
    ownerOf: async () => OWNER,
    placeOf: (card) => (card.pillars.includes("Tutoring") ? TEAM : DESIGN),
    billId: BILL,
    state: state.store,
    now: () => NOW,
  };
  return { deps, state, searched };
}

/** The morning: the hand-over, then the sweep's post with the section. */
function morning(state: ReturnType<typeof box<UpkeepState>>) {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const handOff = sectionHandOffIn<RevisionHanded>(memoryRunStorage(), UPKEEP_SECTION);
  const staged: PendingProposal[] = [];
  const section = revisionSection(
    {
      state: state.store,
      stage: async (proposal) => {
        staged.push(proposal);
        await threadState.putProposal(proposal);
      },
    },
    handOff,
    DATE,
  );
  const h = sweepHarness({ channels: {}, now: NOW, runDate: DATE, threadState });
  h.deps.sections = [section];
  return {
    posts: h.posted,
    staged,
    threadState,
    async run() {
      await handOverRevisions({ state: state.store, handOff, date: DATE });
      await runSweepJob({ key: "sweep-post", kind: "sweep-post" }, h.deps);
    },
  };
}

describe("a deployed card that changes the service", () => {
  it("yields exactly one revision card in its place's one morning message", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = world({ model });
    const report = await runShippedRevisions(w.deps);
    assert.equal(report.drafted, 1);

    const m = morning(w.state);
    await m.run();
    assert.equal(m.posts.length, 1, "one message");
    assert.equal(m.posts[0]!.channel, TEAM, "at the card's place: its pillar's team channel");
    assert.equal(m.staged.length, 1, "one card");
    assert.deepEqual(w.state.b.value.waiting, [], "staged, so no longer waiting");
  });

  it("drafts on the grind tier after a default-tier judgement", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    await runShippedRevisions(world({ model }).deps);
    assert.deepEqual(model.asked.map((p) => p.tier), ["default", "grind"]);
  });

  it("shows the six parts, Roadmap words for the card and blueprint words for the rows", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = world({ model });
    await runShippedRevisions(w.deps);
    const m = morning(w.state);
    await m.run();
    const text = m.staged[0]!.proposalText;
    // title: scenario › path and the status change
    assert.match(text, /Session swap › Happy Path/);
    assert.match(text, /`built` → `live`/);
    // why now: RM-ID, its status, one quoted sentence with a link
    assert.match(text, /RM-2292/);
    assert.match(text, /`Dev Status: Deployed`/);
    assert.match(text, /“Tutors now confirm their own swaps in the app, and the supervisor is only told\.”/);
    assert.match(text, /<https:\/\/www\.notion\.so\/card1\|/);
    // today: step (lane) rows with a link into the blueprint
    assert.match(text, /Approve swap \(Supervisor\)/);
    assert.match(text, /plus-uno\.netlify\.app\/blueprint/);
    // proposed: added / changed / deprecated
    assert.match(text, /Added.*Approve swap \(Regular Tutor\)/s);
    assert.match(text, /Deprecated.*Approve swap \(Supervisor\)/s);
    // confidence and gaps
    assert.match(text, /0\.8/);
    assert.match(text, /supervisor is told by email or in the app/);
    // the ask
    assert.match(text, /Approve/);
    // never mixed: no Roadmap status word in the rows, no blueprint status in the why-now
    const whyNow = text.split("\n").find((l) => l.includes("RM-2292"))!;
    assert.doesNotMatch(whyNow, /`live`|`built`/);
  });

  it("writes `live` rows, and only the owner or Bill can confirm", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = world({ model });
    await runShippedRevisions(w.deps);
    const m = morning(w.state);
    await m.run();
    const card = m.staged[0]!;
    assert.equal(card.toolName, "blueprint_revise");
    assert.deepEqual(card.confirmers, [OWNER, BILL]);
    assert.equal(card.exclusiveConfirmers, true);
    const rows = card.input.rows as Array<{ to: string; laneId: string; from: string | null }>;
    assert.deepEqual(
      rows.map((r) => [r.laneId, r.from, r.to]),
      [
        ["lane-tutor", null, "live"],
        ["lane-sup", "live", "deprecated"],
      ],
    );
    assert.deepEqual(card.input.path, { from: "built", to: "live" });

    const tick = (userId: string): GateSignal => ({
      kind: "reaction",
      messageTs: card.proposalTs!,
      channel: card.channel,
      thread: card.threadTs!,
      glyph: "white_check_mark",
      userId,
    });
    const deps = { threadState: m.threadState, standingConfirmers: [STANDING] };
    assert.equal((await resolveSignal(tick(STANDING), deps)).outcome, "none", "a standing confirmer cannot");
    assert.equal((await resolveSignal(tick("U0SOMEONE1"), deps)).outcome, "none", "anyone else cannot");
    assert.equal((await resolveSignal(tick(BILL), deps)).outcome, "won", "Bill can");
  });

  it("is drafted once: the next run passes it over", async () => {
    const model = scripted({ default: [SERVICE, SERVICE], grind: [DRAFT, DRAFT] });
    const w = world({ model });
    await runShippedRevisions(w.deps);
    const again = await runShippedRevisions(w.deps);
    assert.equal(again.drafted, 0);
    assert.equal(w.state.b.value.waiting.length, 1);
  });

  it("falls back to the default tier on a grind capacity failure, and says so on the card", async () => {
    const model = scripted({ default: [SERVICE, DRAFT], grind: [{ fail: "429 RESOURCE_EXHAUSTED" }] });
    const w = world({ model });
    await runShippedRevisions(w.deps);
    const m = morning(w.state);
    await m.run();
    assert.match(m.staged[0]!.proposalText, /default tier/);
  });
});

describe("silence", () => {
  it("a card that does not change the service yields nothing, and is not searched for", async () => {
    const model = scripted({ default: [NOT_SERVICE] });
    const w = world({ model, cards: [DS_CARD] });
    const report = await runShippedRevisions(w.deps);
    assert.equal(report.drafted, 0);
    assert.deepEqual(w.searched, []);
    const m = morning(w.state);
    await m.run();
    assert.deepEqual(m.posts, []);
  });

  it("a service change with no confident scenario match yields nothing", async () => {
    const model = scripted({ default: [SERVICE] });
    const w = world({ model, search: WEAK });
    const report = await runShippedRevisions(w.deps);
    assert.equal(report.drafted, 0);
    assert.deepEqual(model.asked.map((p) => p.tier), ["default"], "no draft is asked for");
    const m = morning(w.state);
    await m.run();
    assert.deepEqual(m.posts, []);
  });

  it("a draft that needs a new step or lane shows it as a gap and writes no row for it", async () => {
    const needsLane = JSON.stringify({
      rows: [
        { change: "added", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap" },
        { change: "added", step_id: "step-approve", lane_id: "lane-new", content: "System notifies" },
      ],
      new_steps_or_lanes: ["a System lane"],
      confidence: 0.7,
      gaps: [],
    });
    const model = scripted({ default: [SERVICE], grind: [needsLane] });
    const w = world({ model });
    await runShippedRevisions(w.deps);
    const m = morning(w.state);
    await m.run();
    const card = m.staged[0]!;
    assert.deepEqual((card.input.rows as Array<{ laneId: string }>).map((r) => r.laneId), ["lane-tutor"]);
    assert.match(card.proposalText, /Could not verify:.*a System lane, which uno-bot cannot add/);
  });

  it("a draft whose only rows need a new step or lane yields nothing", async () => {
    const onlyNew = JSON.stringify({
      rows: [{ change: "added", step_id: "step-approve", lane_id: "lane-new", content: "System notifies" }],
      new_steps_or_lanes: ["a System lane"],
      confidence: 0.7,
      gaps: [],
    });
    const model = scripted({ default: [SERVICE], grind: [onlyNew] });
    const report = await runShippedRevisions(world({ model }).deps);
    assert.equal(report.drafted, 0);
  });

  it("a dry run reads and keeps nothing", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = world({ model });
    await runShippedRevisions(w.deps, { dryRun: true });
    assert.equal(w.state.b.writes, 0);
  });
});
