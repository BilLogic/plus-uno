// Blueprint upkeep across a card's two shipping moments, at the job →
// sweep-section seam: `Design Status: Shipped` drafts `planned` rows; the same
// card's later `Dev Status: Deployed` promotes those rows to `live` on a
// promotion card instead of drafting them again; and a card weighed at one
// status is never weighed at it again. The evidence is the card and its PRD.
//
// Faked: the Roadmap, the Notion page reads, `search_blueprint`'s rows, the
// path as the blueprint holds it (which a test moves, as a ✅ would), and the
// model. Real: the gate, the drafting, the promotion, the card, the section
// and the sweep's post.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ModelPrompt, ModelProvider, ModelText } from "../src/agent/model-provider";
import type { ModelTier } from "../src/agent/routing";
import type { BlueprintRow } from "../src/integrations/blueprint";
import {
  cardEvidence,
  handOverRevisions,
  revisionSection,
  runShippedRevisions,
  serviceChangeGate,
  UPKEEP_SECTION,
  type EvidencePage,
  type PathToday,
  type RevisionHanded,
  type ShippedCard,
  type ShippedDeps,
  type UpkeepState,
} from "../src/blueprint-upkeep/index";
import { sectionHandOffIn } from "../src/sweep/sections";
import { runSweepJob } from "../src/sweep/index";
import { memoryRunStorage, sweepHarness } from "./helpers/sweep-harness";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";

const NOW = Date.UTC(2026, 9, 16, 13, 5);
const DATE = "2026-10-16";
const TEAM = "C0TUTORING";
const OWNER = "U0OWNER001";
const BILL = "U0BILL0001";

const DESIGNED: ShippedCard = {
  pageId: "card1",
  url: "https://www.notion.so/card1",
  title: "Tutors confirm their own session swaps",
  number: 2292,
  stage: "designed",
  pillars: ["Tutoring"],
  contributors: [{ id: "n-owner", name: "Owner Person" }],
  lastEditedAt: Date.UTC(2026, 9, 15, 18),
};
const DEPLOYED: ShippedCard = { ...DESIGNED, stage: "deployed" };
const CARD_TEXT =
  "Today a supervisor approves every session swap. Tutors now confirm their own swaps in the app, and the supervisor is only told.";

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
/** The path once the `planned` card was approved: the tutor's cell written at `planned`. */
const PATH_PLANNED: PathToday = {
  ...PATH,
  cells: [...PATH.cells, { id: "cell-3", laneId: "lane-tutor", stepId: "step-approve", content: "Tutor confirms the swap in the app", status: "planned" }],
};

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "x", scenario: "Session swap", path: "Happy Path", lane: "Supervisor", step: "Approve swap", matchedBy: "vector+keyword" },
];
const SERVICE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor approves session swap",
  quote: "Tutors now confirm their own swaps in the app, and the supervisor is only told.",
});
const DRAFT = JSON.stringify({
  rows: [
    { change: "added", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap in the app" },
    { change: "deprecated", step_id: "step-approve", lane_id: "lane-sup" },
  ],
  confidence: 0.8,
  gaps: [],
});

function scripted(replies: Partial<Record<ModelTier, string[]>>) {
  const asked: ModelPrompt[] = [];
  const provider = {
    name: "scripted",
    async generate(prompt: ModelPrompt): Promise<ModelText> {
      asked.push(prompt);
      const next = replies[prompt.tier]?.shift();
      if (next === undefined) return { ok: false, model: prompt.tier, message: "no scripted reply" };
      return { ok: true, model: `${prompt.tier}-model`, text: next };
    },
  } as unknown as ModelProvider;
  return { provider, asked };
}

function box<T>(value: T) {
  const b = { value };
  return { b, store: { read: async () => b.value, write: async (v: T) => void (b.value = v) } };
}

function world(model: ReturnType<typeof scripted>, cards: ShippedCard[]) {
  const state = box<UpkeepState>({ cursor: "2026-10-15T10:00:00.000Z", seen: [], waiting: [] });
  const blueprint = { path: PATH };
  const roadmap = { cards };
  const deps: ShippedDeps = {
    roadmap: { shippedSince: async () => roadmap.cards },
    evidence: async () => CARD_TEXT,
    gate: serviceChangeGate({ provider: model.provider, search: async () => MATCH }),
    readPath: async (cellId) => (cellId === "cell-2" ? blueprint.path : null),
    provider: model.provider,
    ownersOf: async () => [{ slack: OWNER }],
    placeOf: () => TEAM,
    leadId: BILL,
    state: state.store,
    weighed: (() => {
      const marks = new Set<string>();
      return { has: async (k: string) => marks.has(k), add: async (k: string) => void marks.add(k) };
    })(),
    now: () => NOW,
  };
  return { deps, state, blueprint, roadmap };
}

/** One morning: the hand-over, then the sweep's post with the section. */
async function morning(state: ReturnType<typeof box<UpkeepState>>): Promise<PendingProposal[]> {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const handOff = sectionHandOffIn<RevisionHanded>(memoryRunStorage(), UPKEEP_SECTION);
  const staged: PendingProposal[] = [];
  const section = revisionSection(
    {
      state: state.store,
      threads: { read: async () => null, write: async () => {} },
      post: async () => {},
      now: () => NOW,
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
  await handOverRevisions({ state: state.store, handOff, date: DATE });
  await runSweepJob({ key: "sweep-post", kind: "sweep-post" }, h.deps);
  return staged;
}

type Row = { stepId: string; laneId: string; content: string; from: string | null; to: string };
const rowsOf = (p: PendingProposal) => (p.input.rows as Row[]).map((r) => [r.laneId, r.from, r.to]);

describe("a design hand-off", () => {
  it("yields a `planned` revision card, citing `Design Status: Shipped`", async () => {
    const w = world(scripted({ default: [SERVICE], grind: [DRAFT] }), [DESIGNED]);
    assert.equal((await runShippedRevisions(w.deps)).drafted, 1);
    const [card] = await morning(w.state);
    assert.ok(card, "one card");
    assert.deepEqual(rowsOf(card), [["lane-tutor", null, "planned"]]);
    assert.match(card.proposalText, /`Design Status: Shipped`/);
    assert.match(card.proposalText, /as `planned`/);
  });

  it("holds a deprecation for the deploy: the moment still happens until it ships", async () => {
    const w = world(scripted({ default: [SERVICE], grind: [DRAFT] }), [DESIGNED]);
    await runShippedRevisions(w.deps);
    const [card] = await morning(w.state);
    assert.ok(!rowsOf(card!).some(([, , to]) => to === "deprecated"));
  });
});

describe("the same card's deploy", () => {
  it("promotes the same rows `planned → live` on a promotion card, with no judgement", async () => {
    // The redraft at the deploy finds the card's words unchanged since the hand-off.
    const model = scripted({ default: [SERVICE], grind: [DRAFT, DRAFT] });
    const w = world(model, [DESIGNED]);
    await runShippedRevisions(w.deps);
    await morning(w.state);
    // ✅ wrote the planned row; the card later deploys.
    w.blueprint.path = PATH_PLANNED;
    w.roadmap.cards = [DEPLOYED];
    const asked = model.asked.length;

    assert.equal((await runShippedRevisions(w.deps)).drafted, 1);
    assert.deepEqual(
      model.asked.slice(asked).map((p) => p.tier),
      ["grind"],
      "no judgement — the path is known — and one redraft against the card's words now",
    );
    const [card] = await morning(w.state);
    assert.ok(card);
    assert.deepEqual(rowsOf(card), [
      ["lane-tutor", "planned", "live"],
      ["lane-sup", "live", "deprecated"],
    ]);
    assert.equal((card.input.rows as Row[])[0]!.content, "Tutor confirms the swap in the app", "the same row, as written");
    assert.match(card.proposalText, /`planned` → `live`/);
    assert.match(card.proposalText, /`Dev Status: Deployed`/);
    assert.match(card.proposalText, /“Tutors now confirm their own swaps in the app, and the supervisor is only told\.”/);
  });

  it("adds what changed between the hand-off and the deploy to the same promotion card", async () => {
    const LATER = JSON.stringify({
      rows: [
        { change: "changed", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap in the app; the supervisor gets a notice" },
        { change: "added", step_id: "step-request", lane_id: "lane-sup", content: "Supervisor sees the swap request" },
        { change: "deprecated", step_id: "step-approve", lane_id: "lane-sup" },
      ],
      confidence: 0.7,
      gaps: ["whether the notice is email or in-app"],
    });
    const model = scripted({ default: [SERVICE], grind: [DRAFT, LATER] });
    const w = world(model, [DESIGNED]);
    await runShippedRevisions(w.deps);
    await morning(w.state);
    w.blueprint.path = PATH_PLANNED;
    w.roadmap.cards = [DEPLOYED];

    assert.equal((await runShippedRevisions(w.deps)).drafted, 1, "one promotion card, not a second one");
    assert.ok(model.asked.at(-1)!.prompt.includes(CARD_TEXT), "redrafted on the card's words as they are now");
    const cards = await morning(w.state);
    assert.equal(cards.length, 1);
    const rows = cards[0]!.input.rows as Row[];
    assert.deepEqual(
      rows.map((r) => [r.stepId, r.laneId, r.from, r.to, r.content]),
      [
        ["step-approve", "lane-tutor", "planned", "live", "Tutor confirms the swap in the app; the supervisor gets a notice"],
        ["step-approve", "lane-sup", "live", "deprecated", "Supervisor approves the swap"],
        ["step-request", "lane-sup", null, "live", "Supervisor sees the swap request"],
      ],
    );
    assert.match(cards[0]!.proposalText, /whether the notice is email or in-app/);
  });

  it("promotes alone, and says so, when the job cannot afford the redraft", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT, DRAFT] });
    const w = world(model, [DESIGNED]);
    await runShippedRevisions(w.deps);
    await morning(w.state);
    w.blueprint.path = PATH_PLANNED;
    w.roadmap.cards = [DEPLOYED];
    const asked = model.asked.length;
    // Room for the card (`MATCH_COST`) and its promotion, not for the card's words and a draft.
    let left = 22;
    w.deps.readPath = async (cellId) => {
      left -= 9; // the read, and what else the alarm spent beside it
      return cellId === "cell-2" ? w.blueprint.path : null;
    };
    w.deps.meter = { headroom: () => ({ subrequests: left }) };

    assert.equal((await runShippedRevisions(w.deps)).drafted, 1);
    assert.equal(model.asked.length, asked, "no redraft");
    const [card] = await morning(w.state);
    assert.deepEqual(rowsOf(card!), [
      ["lane-tutor", "planned", "live"],
      ["lane-sup", "live", "deprecated"],
    ]);
    assert.match(card!.proposalText, /not checked against the card's words at the deploy/);
  });

  it("drafts `live` rows afresh when the `planned` card was never approved", async () => {
    const model = scripted({ default: [SERVICE, SERVICE], grind: [DRAFT, DRAFT] });
    const w = world(model, [DESIGNED]);
    await runShippedRevisions(w.deps);
    await morning(w.state);
    w.roadmap.cards = [DEPLOYED]; // the path never moved
    await runShippedRevisions(w.deps);
    const [card] = await morning(w.state);
    assert.deepEqual(rowsOf(card!), [
      ["lane-tutor", null, "live"],
      ["lane-sup", "live", "deprecated"],
    ]);
  });

  it("replaces a `planned` revision still waiting for its morning", async () => {
    const model = scripted({ default: [SERVICE, SERVICE], grind: [DRAFT, DRAFT] });
    const w = world(model, [DESIGNED]);
    await runShippedRevisions(w.deps);
    w.roadmap.cards = [DEPLOYED];
    await runShippedRevisions(w.deps);
    assert.deepEqual(
      w.state.b.value.waiting.map((r) => r.source.status.property),
      ["Dev Status"],
    );
  });
});

describe("a card weighed at a status", () => {
  it("is not weighed at that status again", async () => {
    const model = scripted({ default: [SERVICE, SERVICE], grind: [DRAFT, DRAFT] });
    const w = world(model, [DESIGNED]);
    await runShippedRevisions(w.deps);
    assert.equal((await runShippedRevisions(w.deps)).drafted, 0);
    assert.equal(model.asked.length, 2, "one judgement and one draft, once");
  });

  it("is not weighed at an earlier status once weighed at a later one", async () => {
    const model = scripted({ default: [SERVICE, SERVICE], grind: [DRAFT, DRAFT] });
    const w = world(model, [DEPLOYED]);
    await runShippedRevisions(w.deps);
    w.roadmap.cards = [DESIGNED];
    assert.equal((await runShippedRevisions(w.deps)).drafted, 0);
  });
});

describe("the evidence", () => {
  const page = (over: Partial<EvidencePage>): EvidencePage => ({ title: "", text: "", subpages: [], blocks: [], ...over });
  const PRD_TEXT = "Tutors now confirm their own swaps in the app, and the supervisor is only told.";

  it("is the card and its PRD subpage", async () => {
    const reads: string[] = [];
    const pages: Record<string, EvidencePage> = {
      card1: page({ title: "Swaps", text: "A card about swaps.", subpages: [{ id: "prd1", title: "PRD: self-serve swaps" }, { id: "notes1", title: "Meeting Notes" }] }),
      prd1: page({ title: "PRD: self-serve swaps", text: PRD_TEXT }),
    };
    const text = await cardEvidence(async (id) => (reads.push(id), pages[id]!), "card1");
    assert.deepEqual(reads, ["card1", "prd1"]);
    assert.match(text, /A card about swaps\./);
    assert.match(text, /PRD: self-serve swaps/);
    assert.ok(text.includes(PRD_TEXT));
  });

  it("follows a PRD linked from the card's body", async () => {
    const pages: Record<string, EvidencePage> = {
      card1: page({
        text: "See the PRD.",
        blocks: [
          { text: "Figma file", links: ["https://www.figma.com/design/abc"] },
          { text: "PRD", links: ["https://www.notion.so/Swaps-PRD-0123456789abcdef0123456789abcdef"] },
        ],
      }),
      "0123456789abcdef0123456789abcdef": page({ title: "Swaps PRD", text: PRD_TEXT }),
    };
    const text = await cardEvidence(async (id) => pages[id]!, "card1");
    assert.ok(text.includes(PRD_TEXT));
  });

  it("reaches the gate: a card whose change is only in its PRD is judged on it", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = world(model, [DESIGNED]);
    const pages: Record<string, EvidencePage> = {
      card1: page({ text: "Self-serve swaps.", subpages: [{ id: "prd1", title: "PRD" }] }),
      prd1: page({ title: "PRD", text: PRD_TEXT }),
    };
    w.deps.evidence = (card) => cardEvidence(async (id) => pages[id]!, card.pageId);
    await runShippedRevisions(w.deps);
    assert.ok(model.asked[0]!.prompt.includes(PRD_TEXT), "the judgement saw the PRD");
    const [card] = await morning(w.state);
    assert.match(card!.proposalText, /“Tutors now confirm their own swaps/);
  });

  it("reads one PRD at most, and a PRD that cannot be read leaves the card's own words", async () => {
    const reads: string[] = [];
    const pages: Record<string, EvidencePage> = {
      card1: page({ text: "A card.", subpages: [{ id: "prd1", title: "PRD" }, { id: "prd2", title: "PRD v2" }] }),
    };
    const text = await cardEvidence(async (id) => {
      reads.push(id);
      if (!pages[id]) throw new Error("Notion 404");
      return pages[id]!;
    }, "card1");
    assert.deepEqual(reads, ["card1", "prd1"]);
    assert.equal(text, "A card.");
  });
});
