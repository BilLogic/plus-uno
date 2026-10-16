// Bill's rulings on the blueprint cards (2026-10-15, on #1279), at the seams
// that decide them: a deploy promotes `built` rows to `live` as well as
// `planned` ones; a drafter may infer a deprecation and never an addition;
// and every Roadmap Contributor confirms a revision beside the lead, one
// Slack does not know named on the card, not tagged.
//
// Faked: the Roadmap, the card's words, `search_blueprint`'s rows, the path
// and the model. Real: the gate, the drafting, the promotion, the section,
// the sweep's post and the staging.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ModelPrompt, ModelProvider, ModelText } from "../src/agent/model-provider";
import {
  handOverRevisions,
  promotionDraft,
  readDraft,
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
import { createInMemoryThreadState, type CardOwner, type PendingProposal } from "../src/thread-state/index";

const NOW = Date.UTC(2026, 9, 16, 13, 5);
const DATE = "2026-10-16";
const TEAM = "C0TUTORING";
const SURAJ = "U0SURAJ001";
const JOSE = "U0JOSE0001";
const BILL = "U0BILL0001";

const PATH: PathToday = {
  pathId: "path-swap",
  scenario: "Session swap",
  path: "Happy Path",
  status: "live",
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

describe("a deploy's promotion", () => {
  it("moves a hand-off's cell that is `built` now to `live`, as it does a `planned` one", () => {
    const today: PathToday = {
      ...PATH,
      cells: [
        { id: "c-a", laneId: "lane-tutor", stepId: "step-approve", content: "Tutor confirms the swap", status: "built" },
        { id: "c-b", laneId: "lane-tutor", stepId: "step-request", content: "Tutor asks in the app", status: "planned" },
        { id: "c-c", laneId: "lane-sup", stepId: "step-request", content: "Supervisor is told", status: "live" },
      ],
    };
    const draft = promotionDraft(
      {
        pageId: "card1",
        cellId: "c-a",
        quote: "",
        rows: [
          { stepId: "step-approve", laneId: "lane-tutor" },
          { stepId: "step-request", laneId: "lane-tutor" },
          { stepId: "step-request", laneId: "lane-sup" },
        ],
        deprecate: [],
      },
      today,
    )!;
    assert.deepEqual(
      draft.revision.rows.map((r) => [r.stepId, r.from, r.to]),
      [
        ["step-approve", "built", "live"],
        ["step-request", "planned", "live"],
      ],
    );
    assert.match(draft.gaps[0]!, /1 cell\(s\) drafted at planned are no longer planned or built/, "a cell already `live` is left out, and said");
  });
});

describe("an inferred row", () => {
  const input = { title: "Swaps", text: "Tutors confirm their own swaps.", today: PATH, target: "live" as const };

  it("may be a deprecation the work did not cause, marked and asked of the owner", () => {
    const reply = JSON.stringify({
      rows: [
        { change: "added", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap" },
        { change: "deprecated", step_id: "step-approve", lane_id: "lane-sup", inferred: true },
      ],
      confidence: 0.8,
      gaps: [],
    });
    const draft = readDraft(reply, input)!;
    assert.equal(draft.changes[1]!.kind, "deprecated");
    assert.equal(draft.changes[1]!.inferred, true);
    assert.equal(draft.changes[0]!.inferred, undefined);
    assert.match(draft.gaps.join(" "), /Approve swap \(Supervisor\) contradicts the path's own rows.*Retire it\?/);
  });

  it("is never an addition or a change: it is left out and said", () => {
    const reply = JSON.stringify({
      rows: [
        { change: "added", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap" },
        { change: "changed", step_id: "step-request", lane_id: "lane-tutor", content: "Tutor asks in the app", inferred: true },
      ],
      confidence: 0.8,
      gaps: [],
    });
    const draft = readDraft(reply, input)!;
    assert.deepEqual(draft.revision.rows.map((r) => r.stepId), ["step-approve"]);
    assert.match(draft.gaps.join(" "), /an inferred change at Request swap \(Regular Tutor\) was left out/);
  });
});

// ── Every Contributor confirms ──────────────────────────────────────────────

const CARD: ShippedCard = {
  pageId: "card1",
  url: "https://www.notion.so/card1",
  title: "Tutors confirm their own session swaps",
  number: 2567,
  stage: "deployed",
  pillars: ["Tutoring"],
  contributors: [
    { id: "n-suraj", name: "Suraj Andrews" },
    { id: "n-jose", name: "Jose Deleon" },
    { id: "n-kai", name: "Kai Unmapped" },
  ],
  lastEditedAt: Date.UTC(2026, 9, 15, 18),
};
const SERVICE = JSON.stringify({ changes_service: true, confidence: 0.9, query: "supervisor approves swap", quote: "Tutors confirm their own swaps." });
const DRAFT = JSON.stringify({
  rows: [{ change: "added", step_id: "step-approve", lane_id: "lane-tutor", content: "Tutor confirms the swap in the app" }],
  confidence: 0.8,
  gaps: [],
});

function scripted() {
  const replies: Record<string, string[]> = { default: [SERVICE], grind: [DRAFT] };
  return {
    name: "scripted",
    async generate(prompt: ModelPrompt): Promise<ModelText> {
      const next = replies[prompt.tier]?.shift();
      return next ? { ok: true, model: prompt.tier, text: next } : { ok: false, model: prompt.tier, message: "no reply" };
    },
  } as unknown as ModelProvider;
}

function box<T>(value: T) {
  const b = { value };
  return { b, store: { read: async () => b.value, write: async (v: T) => void (b.value = v) } };
}

/** A night and a morning with these Contributors: what was staged and what posted. */
async function shipped(owners: CardOwner[]) {
  const provider = scripted();
  const state = box<UpkeepState>({ cursor: "2026-10-15T10:00:00.000Z", waiting: [] });
  const marks = new Set<string>();
  const deps: ShippedDeps = {
    roadmap: { shippedSince: async () => [CARD] },
    evidence: async () => "Tutors confirm their own swaps.",
    gate: serviceChangeGate({
      provider,
      search: async () => [{ kind: "cell", id: "cell-2", title: "x", scenario: "Session swap", path: "Happy Path", matchedBy: "vector+keyword" }],
    }),
    readPath: async () => PATH,
    provider,
    ownersOf: async () => owners,
    placeOf: () => TEAM,
    leadId: BILL,
    state: state.store,
    weighed: { has: async (k) => marks.has(k), add: async (k) => void marks.add(k) },
    views: { cell: (id) => `https://plus-uno.netlify.app/blueprint/?cell=${id}`, slice: async () => null },
    now: () => NOW,
  };
  await runShippedRevisions(deps);

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
  return { staged, posts: h.posted };
}

describe("a revision's confirmers", () => {
  it("are every Contributor in Slack and the lead; one Slack does not know is named on the card, never tagged", async () => {
    const { staged, posts } = await shipped([{ slack: SURAJ, name: "Suraj Andrews" }, { slack: JOSE, name: "Jose Deleon" }, { name: "Kai Unmapped" }]);
    assert.equal(staged.length, 1);
    assert.deepEqual(staged[0]!.confirmers, [SURAJ, JOSE, BILL]);
    assert.equal(staged[0]!.exclusiveConfirmers, true, "the standing confirmers are not added");
    const posted = JSON.stringify(posts[0]!.blocks);
    assert.ok(posted.includes(`<@${SURAJ}>`) && posted.includes(`<@${JOSE}>`), "both tagged where Slack notifies");
    assert.ok(posted.includes("Kai Unmapped"), "the unmapped one named");
    assert.ok(!posted.includes("<@Kai"), "and never tagged");
    assert.match(posts[0]!.text, /`RM-2567` is deployed: 1 blueprint `path` to revise\./);
    const facts = staged[0]!.facts;
    assert.equal(facts?.kind, "blueprint_revision");
    assert.deepEqual(facts!.kind === "blueprint_revision" ? facts.owners : [], [{ slack: SURAJ, name: "Suraj Andrews" }, { slack: JOSE, name: "Jose Deleon" }, { name: "Kai Unmapped" }]);
  });

  it("are the lead alone when no Contributor is in Slack, and Bill is always one", async () => {
    const { staged } = await shipped([{ name: "Kai Unmapped" }]);
    assert.deepEqual(staged[0]!.confirmers, [BILL]);
  });

  it("open View slice on the first row the revision changes", async () => {
    const { staged } = await shipped([{ slack: SURAJ }]);
    const facts = staged[0]!.facts;
    // The draft adds a row, which has no cell yet, and changes none: the
    // path's own link stands.
    assert.equal(facts?.kind === "blueprint_revision" ? facts.today.view : null, PATH.link);
  });
});
