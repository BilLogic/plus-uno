// A drawn proposal joins the shipped lifecycle.
//
// THE LINK. The `prd` surface of `notion_create` creates the Roadmap card
// itself, so the card a thread's PRD becomes is the page its ✅'d PRD wrote.
// Whichever lands first — the PRD or the proposal — the thread's proposals end
// up linked to that card.
//
// THE PROMOTION, at the job → sweep-section seam. A linked card reaching
// `Design Status: Shipped` promotes the proposal's own `proposed` variant path
// and its cells to `planned` — no judgment, no draft; at `Dev Status:
// Deployed`, to `live`, with a second card of its own offering to set today's
// path beside it to `deprecated`. An unlinked card drafts as before.
//
// Faked: the Roadmap, the records, the path reads and the model. Real: the
// link, the job, the promotion, the card, the section and the sweep's post.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ModelPrompt, ModelProvider, ModelText } from "../src/agent/model-provider";
import type { ModelTier } from "../src/agent/routing";
import type { BlueprintRow } from "../src/integrations/blueprint";
import type { OperationOutcome } from "../src/gate/run-batch";
import {
  createInMemoryProposalRecords,
  handOverRevisions,
  keepProposalLinks,
  revisionSection,
  runShippedRevisions,
  serviceChangeGate,
  UPKEEP_SECTION,
  type DrawnProposal,
  type PathToday,
  type RevisionHanded,
  type ShippedCard,
  type ShippedDeps,
  type ThreadCards,
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
const THREAD = "1700000000.000100";
const CARD_PAGE = "0123456789abcdef0123456789abcdef";

const DESIGNED: ShippedCard = {
  // As the Roadmap query returns it: dashed.
  pageId: "01234567-89ab-cdef-0123-456789abcdef",
  url: "https://www.notion.so/0123456789abcdef0123456789abcdef",
  title: "Tutors claim posted call-offs",
  number: 2301,
  stage: "designed",
  pillars: ["Tutoring"],
  contributors: [{ id: "n-owner", name: "Owner Person" }],
  lastEditedAt: Date.UTC(2026, 9, 15, 18),
};
const DEPLOYED: ShippedCard = { ...DESIGNED, stage: "deployed" };

const LANES = [
  { id: "lane-tutor", name: "Regular Tutor" },
  { id: "lane-sup", name: "Supervisor" },
];
const STEPS = [
  { id: "step-post", name: "Post call-off" },
  { id: "step-claim", name: "Claim call-off" },
];
/** Today's path, the proposal drawn beside it. */
const TODAY: PathToday = {
  pathId: "path-today",
  scenarioId: "scn-calloff",
  scenario: "Call-off",
  path: "Standard",
  status: "live",
  lanes: LANES,
  steps: STEPS,
  cells: [
    { id: "cell-t1", laneId: "lane-tutor", stepId: "step-post", content: "Tutor posts the call-off", status: "live" },
    { id: "cell-t2", laneId: "lane-sup", stepId: "step-claim", content: "Supervisor finds a cover", status: "live" },
  ],
  link: "https://plus-uno.netlify.app/blueprint/?cell=cell-t1",
};
/** The proposal's own `proposed` variant path. */
const VARIANT: PathToday = {
  pathId: "path-variant",
  scenarioId: "scn-calloff",
  scenario: "Call-off",
  path: "Self-serve call-offs",
  status: "proposed",
  lanes: LANES,
  steps: STEPS,
  cells: [
    { id: "cell-v1", laneId: "lane-tutor", stepId: "step-claim", content: "Free tutor claims the posted call-off", status: "proposed" },
    { id: "cell-v2", laneId: "lane-sup", stepId: "step-claim", content: "Supervisor sees who claimed it", status: "proposed" },
  ],
  link: "https://plus-uno.netlify.app/blueprint/?cell=cell-v1",
};
const at = (path: PathToday, status: PathToday["status"]): PathToday => ({
  ...path,
  status,
  cells: path.cells.map((c) => ({ ...c, status })),
});

const PROPOSAL: DrawnProposal = {
  proposalTs: "1700000000.000500",
  channel: TEAM,
  threadTs: THREAD,
  replyTs: THREAD,
  requesterId: "U0MAYA",
  pathId: VARIANT.pathId,
  todayPathId: TODAY.pathId,
  cellIds: ["cell-v1", "cell-v2"],
  writtenAt: NOW - 86_400_000,
  cardId: null,
};

// What an unlinked card's gate and draft see.
const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-t2", title: "x", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Claim call-off", matchedBy: "vector+keyword" },
];
const SERVICE = JSON.stringify({ changes_service: true, confidence: 0.9, query: "call-off cover", quote: "Free tutors claim posted call-offs." });
const DRAFT = JSON.stringify({
  rows: [{ change: "added", step_id: "step-claim", lane_id: "lane-tutor", content: "Free tutor claims the posted call-off" }],
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

async function world(model: ReturnType<typeof scripted>, cards: ShippedCard[], opts: { linked?: boolean } = {}) {
  const state = box<UpkeepState>({ cursor: "2026-10-15T10:00:00.000Z", waiting: [] });
  const records = createInMemoryProposalRecords();
  await records.record(PROPOSAL);
  if (opts.linked !== false) await records.linkCard(TEAM, THREAD, CARD_PAGE);
  const blueprint: { today: PathToday; variant: PathToday | null } = { today: TODAY, variant: VARIANT };
  const roadmap = { cards };
  const byCell = (cellId: string) => {
    if (blueprint.variant?.cells.some((c) => c.id === cellId)) return blueprint.variant;
    return blueprint.today.cells.some((c) => c.id === cellId) ? blueprint.today : null;
  };
  const deps: ShippedDeps = {
    roadmap: { shippedSince: async () => roadmap.cards },
    evidence: async () => "Free tutors claim posted call-offs.",
    gate: serviceChangeGate({ provider: model.provider, search: async () => MATCH }),
    readPath: async (cellId) => byCell(cellId),
    readPathById: async (pathId) => (pathId === blueprint.today.pathId ? blueprint.today : pathId === blueprint.variant?.pathId ? blueprint.variant : null),
    proposals: records,
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
  return { deps, state, blueprint, roadmap, records };
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

describe("a linked card's design hand-off", () => {
  it("promotes the proposal's own variant path and cells `proposed → planned`, drafting nothing", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = await world(model, [DESIGNED]);
    assert.equal((await runShippedRevisions(w.deps)).drafted, 1);
    assert.equal(model.asked.length, 0, "no judgment, no draft: the rows are the proposal's");
    const cards = await morning(w.state);
    assert.equal(cards.length, 1, "one card: the variant path's");
    const [card] = cards;
    assert.equal(card!.input.pathId, VARIANT.pathId);
    assert.equal(card!.input.variant, undefined, "the path exists: nothing is created");
    assert.deepEqual(rowsOf(card!), [
      ["lane-tutor", "proposed", "planned"],
      ["lane-sup", "proposed", "planned"],
    ]);
    assert.deepEqual(card!.input.path, { from: "proposed", to: "planned" });
    assert.equal((card!.input.rows as Row[])[0]!.content, "Free tutor claims the posted call-off", "the rows as drawn");
    assert.match(card!.proposalText, /Call-off › Self-serve call-offs/);
    assert.match(card!.proposalText, /`proposed` → `planned`/);
    assert.match(card!.proposalText, /`Design Status: Shipped`/);
    assert.deepEqual(card!.confirmers, [OWNER, BILL]);
  });

  it("leaves today's path alone at a design hand-off", async () => {
    const w = await world(scripted({}), [DESIGNED]);
    await runShippedRevisions(w.deps);
    const cards = await morning(w.state);
    assert.ok(!cards.some((c) => c.input.pathId === TODAY.pathId));
  });
});

describe("a linked card's deploy", () => {
  it("promotes the variant `planned → live`, and offers today's path `deprecated` on a card of its own", async () => {
    const model = scripted({});
    const w = await world(model, [DEPLOYED]);
    w.blueprint.variant = at(VARIANT, "planned"); // the hand-off card was approved
    assert.equal((await runShippedRevisions(w.deps)).drafted, 2);
    assert.equal(model.asked.length, 0);
    const [promote, retire, ...rest] = await morning(w.state);
    assert.equal(rest.length, 0);
    assert.equal(promote!.input.pathId, VARIANT.pathId);
    assert.deepEqual(rowsOf(promote!), [
      ["lane-tutor", "planned", "live"],
      ["lane-sup", "planned", "live"],
    ]);
    assert.deepEqual(promote!.input.path, { from: "planned", to: "live" });
    assert.match(promote!.proposalText, /`Dev Status: Deployed`/);

    // Today's path is only ever retired on its own card, approved on its own.
    assert.equal(retire!.input.pathId, TODAY.pathId);
    assert.deepEqual(retire!.input.rows, [], "no cell is written");
    assert.deepEqual(retire!.input.path, { from: "live", to: "deprecated" });
    assert.match(retire!.proposalText, /Call-off › Standard/);
    assert.match(retire!.proposalText, /Self-serve call-offs/, "names what replaces it");
    assert.match(retire!.proposalText, /`deprecated`/);
    assert.notEqual(retire!.proposalTs, promote!.proposalTs);
    assert.deepEqual(retire!.confirmers, [OWNER, BILL]);
  });

  it("promotes straight from `proposed` when the hand-off card was never approved", async () => {
    const w = await world(scripted({}), [DEPLOYED]);
    await runShippedRevisions(w.deps);
    const [promote] = await morning(w.state);
    assert.deepEqual(rowsOf(promote!), [
      ["lane-tutor", "proposed", "live"],
      ["lane-sup", "proposed", "live"],
    ]);
  });

  it("offers no retirement when today's path is already `deprecated`", async () => {
    const w = await world(scripted({}), [DEPLOYED]);
    w.blueprint.today = { ...TODAY, status: "deprecated" };
    await runShippedRevisions(w.deps);
    const cards = await morning(w.state);
    assert.deepEqual(cards.map((c) => c.input.pathId), [VARIANT.pathId]);
  });
});

describe("an unlinked card", () => {
  it("drafts as before: the gate, then a draft on today's path", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = await world(model, [DESIGNED], { linked: false });
    assert.equal((await runShippedRevisions(w.deps)).drafted, 1);
    assert.equal(model.asked.length, 2, "one judgment and one draft");
    const [card] = await morning(w.state);
    assert.equal(card!.input.pathId, TODAY.pathId);
    assert.deepEqual(rowsOf(card!), [["lane-tutor", null, "planned"]]);
  });

  it("is what a linked card is when its proposal's path is gone", async () => {
    const model = scripted({ default: [SERVICE], grind: [DRAFT] });
    const w = await world(model, [DESIGNED]);
    w.blueprint.variant = null; // withdrawn
    await runShippedRevisions(w.deps);
    const [card] = await morning(w.state);
    assert.equal(card!.input.pathId, TODAY.pathId);
  });
});

// ── The link ─────────────────────────────────────────────────────────────────

const PRD_URL = `https://www.notion.so/Self-serve-call-offs-${CARD_PAGE}`;

function threadCards(): ThreadCards & { kept: Map<string, string> } {
  const kept = new Map<string, string>();
  return {
    kept,
    cardOf: async (channel, ts) => kept.get(`${channel}:${ts}`) ?? null,
    remember: async (channel, ts, cardId) => void kept.set(`${channel}:${ts}`, cardId),
  };
}

const card = (over: Partial<PendingProposal>): PendingProposal =>
  ({
    proposalTs: "1700000000.000700",
    channel: TEAM,
    threadTs: THREAD,
    userMsgTs: THREAD,
    requesterUserId: "U0MAYA",
    toolName: "notion_create",
    input: {},
    proposalText: "",
    ...over,
  }) as PendingProposal;

const prdOutcome = (ok = true): OperationOutcome => ({
  toolName: "notion_create",
  input: { surface: "prd", title: "Self-serve call-offs" },
  ok,
  result: JSON.stringify(ok ? { ok: true, status: "created", surface: "prd", url: PRD_URL } : { ok: false }),
  message: "",
});

const drawnOutcome = (): OperationOutcome => ({
  toolName: "blueprint_revise",
  ok: true,
  result: JSON.stringify({ ok: true, created_path: VARIANT.pathId, cells: ["cell-v1", "cell-v2"] }),
  message: "",
});

/** The proposal offer card as staged, ready to decide. */
const offerCard = () =>
  card({
    proposalTs: PROPOSAL.proposalTs,
    toolName: "blueprint_revise",
    supersedeKey: "blueprint-proposal:call-off",
    input: {
      pathId: TODAY.pathId,
      label: "Call-off › Standard",
      rows: [{ laneId: "lane-tutor", stepId: "step-claim", content: "Free tutor claims the posted call-off", from: null, to: "proposed" }],
      variant: { scenarioId: "scn-calloff", name: "Self-serve call-offs", status: "proposed", lanes: { "lane-tutor": "Regular Tutor" } },
    },
  });

describe("linking a thread's proposal to the Roadmap card its PRD becomes", () => {
  it("a PRD written after the proposal links it to the card the PRD created", async () => {
    const records = createInMemoryProposalRecords();
    const cards = threadCards();
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, offerCard(), [drawnOutcome()]);
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, card({}), [prdOutcome()]);
    assert.deepEqual((await records.byCard(CARD_PAGE, 5)).map((p) => p.pathId), [VARIANT.pathId]);
  });

  it("a proposal drawn after the thread's PRD is linked as it is kept", async () => {
    const records = createInMemoryProposalRecords();
    const cards = threadCards();
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, card({}), [prdOutcome()]);
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, offerCard(), [drawnOutcome()]);
    assert.deepEqual((await records.inThread(TEAM, THREAD)).map((p) => p.cardId), [CARD_PAGE]);
  });

  it("a PRD that was not written links nothing, and another thread's PRD links nothing here", async () => {
    const records = createInMemoryProposalRecords();
    const cards = threadCards();
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, offerCard(), [drawnOutcome()]);
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, card({}), [prdOutcome(false)]);
    await keepProposalLinks({ records, threadCards: cards, now: () => NOW }, card({ threadTs: "1700000000.999999" }), [prdOutcome()]);
    assert.deepEqual((await records.inThread(TEAM, THREAD)).map((p) => p.cardId), [null]);
  });

  it("the link reaches the job: a card linked this way promotes the proposal", async () => {
    const w = await world(scripted({}), [DESIGNED], { linked: false });
    await keepProposalLinks({ records: w.records, threadCards: threadCards(), now: () => NOW }, card({}), [prdOutcome()]);
    await runShippedRevisions(w.deps);
    const [promoted] = await morning(w.state);
    assert.equal(promoted!.input.pathId, VARIANT.pathId);
  });
});
