// Figma comment decisions reach #plus-design (#900), through the sweep
// harness (#891, Seam 2): whole nights and mornings against the shared fake
// Figma, fake Notion pages, the real detector over recorded replies, the
// in-memory sweep store and an in-memory ThreadState the cards are staged in.
//
// What a test checks is what a person would see: which comments ever reach
// the detector, what is kept for the morning, the thread and the cards posted
// in #plus-design, what each card's ✅ would run, and who may decide it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fakeProvider } from "../src/agent/providers/fake";
import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import type { FigmaComment } from "../src/figma/client";
import type { FigmaNode } from "../src/integrations/figma-reading";
import { isSubrequestBudgetError, SubrequestBudgetError } from "../src/net";
import { runSweepJob, type SweepSource } from "../src/sweep/index";
import type { ScheduledJob } from "../src/scheduled/runs";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import { COMMENTS_CURSOR, etDatesOf, quoteOf, readCommentsCursor, writeCommentsCursor } from "../src/figma-comments/read";
import { figmaDecisionsSection, MAX_NO_PRD_REPLIES } from "../src/figma-comments/post";
import { candidateThreads, readable } from "../src/figma-comments/threads";
import { dividerSection, pageOf, pagesOf } from "../src/figma-comments/sections";
import { cardNumbersOf } from "../src/figma-comments/title";
import { dueAt, questionsSection } from "../src/figma-comments/triage";
import { modelDecisionDetector, type DecisionInput } from "../src/figma-comments/detector";
import { numberedReply, reviseDecision, rewordCue, type ReviseDeps } from "../src/figma-comments/revise";
import { NEEDS_CHANGES_LEAD, cardSentBack } from "../src/slack/review-door";
import { reportItems } from "../src/slack/decision-cards";
import { runTurn } from "../src/turn/index";
import { harness as turnHarness, request as turnRequest } from "./helpers/turn-harness";
import { isFigmaDecisionCandidate, isFigmaDecisionThread } from "../src/figma-comments/env";
import { replyHandlerAt } from "../src/slack/events";
import type { SlackMessageEvent } from "../src/slack/types";
import type { Env } from "../src/types";
import type { DecisionRow } from "../src/integrations/notion";
import { at, DESIGN, notionPage, ROADMAP_DB, sweepHarness, type SweepHarness, type TriageOptions } from "./helpers/sweep-harness";
import { mentionCount, notified } from "./helpers/notified";
import { activeFrom } from "./helpers/team";
import { NOBODY_ACTIVE, type ActivePeople } from "../src/usage/roles";
import type { FileOwner } from "../src/figma-comments/queue";

/** One card of a decision report, as Slack is handed it. */
type Card = {
  type: string;
  title: { text: string };
  subtitle?: { text: string };
  body: { text: string };
  actions: Array<{ text: { text: string }; url?: string; value?: string }>;
};

const NIGHT: ScheduledJob ={ key: "sweep:figma-comments", kind: "sweep-figma-comments" };
const MORNING: ScheduledJob = { key: "sweep:figma-post", kind: "sweep-figma-post" };
const SWEEP_POST: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };

/** A morning: the hand-over, then the sweep's post with the decisions as its section. */
async function morning(h: SweepHarness) {
  const report = await runSweepJob(MORNING, h.deps);
  h.deps.sections = [figmaDecisionsSection(h.deps.figmaComments!, h.deps.runDate, h.deps.now)!];
  await runSweepJob(SWEEP_POST, h.deps);
  return report;
}

/** The morning's message in #plus-design: the sweep's, at the channel's top. */
function parentOf(h: SweepHarness) {
  const parent = h.posted.filter((p) => p.channel === DESIGN && p.threadTs === null).at(-1);
  assert.ok(parent, "the morning posted in #plus-design");
  return parent;
}

const FILE = "GoalFile1";
const CARD_ID = "24820000000000000000000000000001";
const PRD_ID = "24820000000000000000000000000002";
const CARD_URL = `https://www.notion.so/${CARD_ID}`;
const PRD_URL = `https://www.notion.so/${PRD_ID}`;
/** 2026-09-29 06:00 ET, the switch-on, at an end-of-day run. */
const SWITCH_ON = at(29, 10);
const SWITCHED = `${new Date(SWITCH_ON).toISOString()}|${new Date(SWITCH_ON).toISOString()}||`;

/** A file under How We Fig's dividers: a Cover, Specs with a nested frame, WIP, For Review. */
const DOCUMENT: FigmaNode = {
  id: "0:0",
  name: "Document",
  type: "DOCUMENT",
  children: [
    { id: "0:1", name: "- - - 🖼️ Cover - - -", type: "CANVAS", children: [] },
    { id: "0:2", name: "Cover", type: "CANVAS", children: [{ id: "1:1", name: "Cover frame", type: "FRAME" }] },
    { id: "0:3", name: "- - - 📐 Specs - - -", type: "CANVAS", children: [] },
    {
      id: "0:4",
      name: "Goal states",
      type: "CANVAS",
      children: [{ id: "4:1", name: "Empty state", type: "FRAME", children: [{ id: "4:2", name: "Progress bar", type: "RECTANGLE" }] }],
    },
    { id: "0:5", name: "- - - ⏳ WIP - - -", type: "CANVAS", children: [] },
    { id: "0:6", name: "Explorations", type: "CANVAS", children: [{ id: "6:1", name: "Option B", type: "FRAME" }] },
    { id: "0:7", name: "- - - 🔍 For Review - - -", type: "CANVAS", children: [] },
    { id: "0:8", name: "Review page", type: "CANVAS", children: [{ id: "8:1", name: "Flow", type: "FRAME" }] },
  ],
};

const pin = (node_id: string) => ({ node_id, node_offset: { x: 4, y: 8 } });

/** A comment as Figma lists it: a root unless `parent_id` is set. */
function comment(id: string, fields: Partial<FigmaComment> & { handle?: string }, file = FILE): FigmaComment {
  const { handle = "sarah", ...rest } = fields;
  return {
    id,
    file_key: file,
    parent_id: "",
    user: { id: `u-${handle}`, handle },
    created_at: "2026-09-29T15:00:00Z",
    resolved_at: null,
    message: "a comment",
    client_meta: null,
    ...rest,
  };
}

/** The night's comments: four decisions, an open question, and everything the read must leave alone. */
const COMMENTS: FigmaComment[] = [
  comment("c1", {
    message: "Keep the progress bar hidden until the first goal is set",
    resolved_at: "2026-09-29T18:00:00Z",
    client_meta: pin("4:1"),
  }),
  comment("c1r", { handle: "meryem", parent_id: "c1", created_at: "2026-09-29T16:00:00Z", message: "Agreed, let's do that." }),
  comment("c3", { handle: "meryem", created_at: "2026-09-29T15:30:00Z", message: "States are all in, moving this card to Under Review", client_meta: pin("4:2") }),
  comment("c4", { handle: "bea", created_at: "2026-09-29T17:00:00Z", message: "Goal chips use Badge's pill variant everywhere", client_meta: pin("8:1") }),
  comment("c5", { created_at: "2026-09-29T17:30:00Z", resolved_at: "2026-09-29T18:30:00Z", message: "Go with option B in WIP", client_meta: pin("6:1") }),
  comment("c6", { created_at: "2026-09-29T17:40:00Z", message: "Cover note", client_meta: pin("1:1") }),
  comment("c7", { created_at: "2026-09-29T17:50:00Z", message: "A page-level comment" }),
  comment("c8", { created_at: "2026-09-28T12:00:00Z", message: "An old thought from before the switch", client_meta: pin("4:1") }),
  comment("c9", {
    created_at: "2026-09-28T12:30:00Z",
    resolved_at: "2026-09-29T19:00:00Z",
    message: "Show the bar only once there is a goal",
    client_meta: pin("4:1"),
  }),
  comment("c9a", { parent_id: "c9", created_at: "2026-09-28T13:00:00Z", message: "Before the switch: maybe" }),
  comment("c9b", { handle: "meryem", parent_id: "c9", created_at: "2026-09-29T19:05:00Z", message: "After the switch: yes, settled" }),
  comment("c10", { handle: "meryem", created_at: "2026-09-29T20:00:00Z", message: "Should the bar animate?", client_meta: pin("4:1") }),
];

const CARD: SweepSource = notionPage(CARD_ID, {
  title: "Goal Setting",
  contributors: ["Meryem", "Sarah K"],
  properties: { Name: "Goal Setting", ID: "2482", "Design Status": "WIP", "Dev Status": "Not started" },
  subpages: [{ id: PRD_ID, title: "PRD" }],
  parentDatabaseId: ROADMAP_DB,
  parentType: "database_id",
});
const PRD: SweepSource = notionPage(PRD_ID, {
  title: "PRD",
  blocks: [
    { id: "h-goal", lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Goal states", type: "heading_2" },
    { id: "b-goal-1", lastEditedTime: "2026-09-01T10:00:00.000Z", text: "Show the progress bar on every goal screen.", type: "paragraph" },
    { id: "b-goal-2", lastEditedTime: "2026-09-02T10:00:00.000Z", text: "A goal can be edited until the session ends.", type: "paragraph" },
  ],
  text: "Goal states\nShow the progress bar on every goal screen.\nA goal can be edited until the session ends.",
});

/** The detector's recorded reply for the night: four decisions, and the question passed over. */
const REPLY = JSON.stringify({
  decisions: [
    {
      thread_id: "c1",
      route: "prd",
      decision: "The progress bar stays hidden until the first goal is set.",
      section_block_id: "h-goal",
      text: "The progress bar stays hidden until the first goal is set.",
      confidence: 0.9,
    },
    { thread_id: "c3", route: "card", decision: "The card moves to Under Review.", card: 2482, field: "Design Status", value: "Under Review", confidence: 0.88 },
    {
      thread_id: "c4",
      route: "design-system",
      decision: "Goal chips use the Badge pill variant.",
      title: "Goal chips use the Badge pill variant",
      body: "Agreed in Figma: goal chips use Badge's pill variant everywhere.",
      confidence: 0.8,
    },
    {
      thread_id: "c9",
      route: "prd",
      decision: "The bar shows once the first goal is set.",
      block_id: "b-goal-1",
      replacement: "Show the progress bar once the first goal is set.",
      confidence: 0.85,
    },
    { thread_id: "c10", route: "none", decision: "An open question.", confidence: 0.9 },
  ],
});

const NOTES = [{ key: `figma-notify:commented:2026-09-29:${FILE}`, at: "2026-09-29T15:00:00Z" }];

function seededFigma(): InMemoryFigma {
  const figma = createInMemoryFigma();
  figma.seedFile(FILE, { name: "Goal Setting / Card 2482 / Sarah", document: DOCUMENT, comments: COMMENTS });
  return figma;
}

/** A harness switched on at the watermark, its clock at the next end-of-day run, 06:00 ET. */
async function nightHarness(
  over: {
    figma?: InMemoryFigma;
    replies?: string[];
    notes?: typeof NOTES;
    members?: string[] | null;
    misc?: string;
    sources?: SweepSource[];
    decisionRows?: Record<string, DecisionRow[]>;
    people?: { figma: Record<string, string>; notion: Record<string, string> };
    cards?: Record<number, { url: string; title: string; pillars?: string[] }>;
    triage?: TriageOptions;
    active?: ActivePeople;
  } = {},
) {
  const client = over.figma ?? seededFigma();
  const h = sweepHarness({
    channels: {},
    sources: over.sources ?? [CARD, PRD],
    people: { Meryem: "U0MERYEM", "Sarah K": "U0SARAH" },
    ...(over.active ? { active: over.active } : {}),
    detectorReplies: over.replies ?? [REPLY],
    now: at(30, 10),
    figma: {
      client,
      notes: over.notes ?? NOTES,
      cards: over.cards ?? { 2482: { url: CARD_URL, title: "Goal Setting" } },
      ...(over.triage ? { triage: over.triage } : {}),
      // Meryem is the card's PM, Sarah its designer: the design owner.
      roles: { U0MERYEM: "pm", U0SARAH: "design" },
      ...(over.members !== undefined ? { members: over.members } : {}),
      ...(over.misc ? { miscTeamId: over.misc } : {}),
      ...(over.decisionRows ? { decisionRows: over.decisionRows } : {}),
      ...(over.people ? { people: over.people } : {}),
    },
  });
  await h.store.saveCursor(COMMENTS_CURSOR, SWITCHED, SWITCH_ON);
  return { h, client };
}

/** Sarah's Team Members row, three ways (#1361): active, Past Collaborators,
 *  and none at all. Meryem's row is active throughout. */
const MERYEM_ROW = { name: "Meryem", slack: "U0MERYEM" };
const SARAH_ROWS = {
  active: activeFrom([MERYEM_ROW, { name: "Sarah K", slack: "U0SARAH" }]),
  past: activeFrom([MERYEM_ROW, { name: "Sarah K", slack: "U0SARAH", affiliation: "Past Collaborators" }]),
  missing: activeFrom([MERYEM_ROW], [{ id: "U0SARAH", real_name: "Sarah K" }]),
} as const;

describe("the night's read of Figma comments (#900)", () => {
  it("switches on the first night: it reads nothing, and keeps the watermark (AC 1)", async () => {
    const client = seededFigma();
    const h = sweepHarness({ channels: {}, now: SWITCH_ON, figma: { client, notes: NOTES } });
    const report = await runSweepJob(NIGHT, h.deps);
    assert.equal(
      report.summary,
      "0 Figma file(s) read, 0 decision(s) kept for the morning — switched on: comments created or resolved after 2026-09-29T10:00:00.000Z are read, none before",
    );
    assert.deepEqual(client.calls(), [], "no comment is read on the night it switches on");
    assert.equal(await h.store.cursor(COMMENTS_CURSOR), SWITCHED);
  });

  it("shows the detector only what was said after the watermark, under Specs or For Review (AC 1, AC 2)", async () => {
    const { h, client } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    const prompt = String((h.provider.generated[0] as { prompt?: string }).prompt);

    // Specs and For Review, a nested pin among them, each with its page and layer.
    assert.match(prompt, /^\[thread c1\] Specs › Goal states › Empty state · resolved$/m);
    assert.match(prompt, /^\[thread c3\] Specs › Goal states › Progress bar · open$/m);
    assert.match(prompt, /^\[thread c4\] For Review › Review page › Flow · open$/m);
    assert.match(prompt, /^\[thread c10\] Specs › Goal states › Empty state · open$/m);
    // A root from before the watermark, resolved after it: the root and the
    // reply after the watermark, never the reply before.
    assert.match(prompt, /^\[thread c9\] Specs › Goal states › Empty state · resolved$/m);
    assert.match(prompt, /After the switch: yes, settled/);
    for (const unread of ["Before the switch", "An old thought from before the switch", "Go with option B in WIP", "Cover note", "A page-level comment"]) {
      assert.ok(!prompt.includes(unread), `the detector was shown "${unread}"`);
    }
    // The nested pin was found with one read for its path.
    assert.deepEqual(
      client.calls().map((c) => [c.method, c.args[1]]),
      [
        ["comments", undefined],
        ["file", { depth: 2 }],
        ["file", { ids: ["4:2"] }],
      ],
    );
  });

  it("keeps each decision for the morning with what its ✅ will run (AC 3)", async () => {
    const { h } = await nightHarness();
    const report = await runSweepJob(NIGHT, h.deps);
    assert.equal(report.summary, "1 Figma file(s) read, 4 decision(s) kept for the morning");
    const file = h.figma.queue.get(FILE)!;
    assert.equal(file.title, "Goal Setting / Card 2482 / Sarah");
    assert.deepEqual(file.owner, { slack: "U0SARAH" }, "the card's design owner, not its first Contributor");
    assert.deepEqual(file.confirmers, ["U0MERYEM", "U0SARAH"]);
    assert.deepEqual(
      file.decisions.map((d) => [d.commentId, d.route, d.operation]),
      [
        [
          "c1",
          "prd",
          {
            toolName: "notion_update",
            input: {
              page_url: PRD_URL,
              insert: [{ after_block_id: "b-goal-2", last_edited_time: "2026-09-02T10:00:00.000Z", content: "The progress bar stays hidden until the first goal is set." }],
            },
          },
        ],
        ["c3", "card", { toolName: "notion_update", input: { page_url: CARD_URL, properties: { "Design Status": "Under Review" } } }],
        [
          "c4",
          "design-system",
          {
            toolName: "github_issue_create",
            input: {
              title: "Goal chips use the Badge pill variant",
              body: [
                "Agreed in Figma: goal chips use Badge's pill variant everywhere.",
                "",
                "Decided in a Figma comment on [Goal Setting / Card 2482 / Sarah](https://www.figma.com/design/GoalFile1?node-id=8-1#c4) (For Review › Review page):",
                "> Goal chips use Badge's pill variant everywhere",
                "— bea",
              ].join("\n"),
            },
          },
        ],
        [
          "c9",
          "prd",
          {
            toolName: "notion_update",
            input: {
              page_url: PRD_URL,
              replace: [{ block_id: "b-goal-1", last_edited_time: "2026-09-01T10:00:00.000Z", content: "Show the progress bar once the first goal is set." }],
            },
          },
        ],
      ],
    );
    assert.equal(await h.store.cursor(COMMENTS_CURSOR), `2026-09-29T10:00:00.000Z|2026-09-30T10:00:00.000Z||`, "the next night starts where this one ended");
  });

  it("asks the card's design owner; with none, nobody — never the file's creator", async () => {
    const night = async (roles: Record<string, "pm" | "dev" | "design">, active?: ActivePeople) => {
      const client = createInMemoryFigma();
      client.seedFile(FILE, {
        name: "Goal Setting / Card 2482 / Sarah",
        document: DOCUMENT,
        comments: COMMENTS,
        creator: { id: "u-jade", handle: "Jade Wang" },
      });
      const h = sweepHarness({
        channels: {},
        sources: [{ ...CARD, contributors: ["Nobody Mapped", "Meryem", "Sarah K"] }, PRD],
        people: { Meryem: "U0MERYEM", "Sarah K": "U0SARAH" },
        ...(active ? { active } : {}),
        detectorReplies: [REPLY],
        now: at(30, 10),
        figma: { client, notes: NOTES, cards: { 2482: { url: CARD_URL, title: "Goal Setting" } }, roles },
      });
      await h.store.saveCursor(COMMENTS_CURSOR, SWITCHED, SWITCH_ON);
      await runSweepJob(NIGHT, h.deps);
      assert.equal(client.calls().some((c) => c.method === "fileMeta"), false, "the file's creator is never read");
      return h.figma.queue.get(FILE)!;
    };
    const designed = await night({ U0MERYEM: "pm", U0SARAH: "design" });
    assert.deepEqual(designed.owner, { slack: "U0SARAH" });
    assert.deepEqual(designed.confirmers, ["U0MERYEM", "U0SARAH"], "every Contributor in Slack still decides");
    assert.equal((await night({ U0MERYEM: "pm" })).owner, null, "no designer among them: nobody, never the file's creator");
    assert.equal((await night({})).owner, null, "neither: the parent asks someone on the card");
  });

  it("asks, and lets decide, only Contributors whose Team Members row is active (#1361)", async () => {
    const cases = [
      [SARAH_ROWS.active, { slack: "U0SARAH" }, ["U0MERYEM", "U0SARAH"]],
      [SARAH_ROWS.past, null, ["U0MERYEM"]],
      [SARAH_ROWS.missing, null, ["U0MERYEM"]],
    ] as const;
    for (const [active, owner, confirmers] of cases) {
      const { h } = await nightHarness({ active });
      await runSweepJob(NIGHT, h.deps);
      const queued = h.figma.queue.get(FILE)!;
      assert.deepEqual(queued.owner, owner);
      assert.deepEqual(queued.confirmers, confirmers);
    }
  });

  it("reads nothing on a night whose notes name no file, and nothing twice for one day's activity", async () => {
    const { h, client } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(31, 10);
    const quiet = await runSweepJob(NIGHT, h.deps);
    assert.equal(quiet.summary, "0 Figma file(s) read, 0 decision(s) kept for the morning");
    assert.equal(h.provider.generated.length, 1);
    assert.equal(client.calls().filter((c) => c.method === "comments").length, 1, "no file was a candidate the second night");
    // A note that still names the file, with nothing new in the window, reads its comments and finds nothing to ask.
    h.clock.now = at(32, 10);
    (h.deps.figmaComments!.notes as { list(p: string): Promise<unknown[]> }).list = async () => [
      { key: `figma-notify:changed:${FILE}`, at: "2026-10-01T15:00:00Z" },
    ];
    await runSweepJob(NIGHT, h.deps);
    assert.equal(client.calls().filter((c) => c.method === "comments").length, 2);
    assert.equal(h.provider.generated.length, 1, "nothing in the window, so the detector was not asked");
  });

  it("leaves MISC's files out, listing them at most weekly", async () => {
    const client = seededFigma();
    client.seedFile("MiscFile", { name: "Onboarding workshop", document: DOCUMENT, comments: COMMENTS.map((c) => ({ ...c, file_key: "MiscFile" })) });
    client.seedTeam("999", [{ id: "f1", name: "Workshops" }]);
    client.seedFolder("f1", [{ key: "MiscFile", name: "Onboarding workshop", last_modified: "2026-09-29T15:00:00Z" }]);
    const { h } = await nightHarness({
      figma: client,
      misc: "999",
      notes: [...NOTES, { key: "figma-notify:commented:2026-09-29:MiscFile", at: "2026-09-29T15:00:00Z" }],
    });
    await runSweepJob(NIGHT, h.deps);
    assert.ok(!client.calls().some((c) => c.method === "comments" && c.args[0] === "MiscFile"), "MISC's file was never read");
    assert.deepEqual(h.figma.misc?.files, ["MiscFile"]);
  });

  it("keeps the files done when the budget stops it, and finishes the rest on the retry", async () => {
    const client = seededFigma();
    client.seedFile("AFile", { name: "Plain file", document: DOCUMENT, comments: [] });
    let stopped = false;
    const stopping = {
      ...client,
      async comments(key: string, o?: object) {
        if (key === FILE && !stopped) {
          stopped = true;
          throw new SubrequestBudgetError(38);
        }
        return client.comments(key, o);
      },
    } as InMemoryFigma;
    const { h } = await nightHarness({
      figma: stopping,
      notes: [...NOTES, { key: "figma-notify:changed:AFile", at: "2026-09-29T21:00:00Z" }],
    });
    await assert.rejects(runSweepJob(NIGHT, h.deps), SubrequestBudgetError);
    assert.deepEqual(readCommentsCursor(await h.store.cursor(COMMENTS_CURSOR))?.done, ["AFile"]);
    const retried = await runSweepJob(NIGHT, h.deps);
    assert.equal(retried.summary, "1 Figma file(s) read, 4 decision(s) kept for the morning");
    assert.equal(client.calls().filter((c) => c.method === "comments" && c.args[0] === "AFile").length, 1, "the file done is not read again");
  });

  it("cuts a window longer than the notes last to the last seven days, and says so", async () => {
    const { h } = await nightHarness();
    const old = new Date(at(19, 10)).toISOString();
    await h.store.saveCursor(COMMENTS_CURSOR, `${old}|${old}||`, at(19, 10));
    const report = await runSweepJob(NIGHT, h.deps);
    assert.match(report.summary, /the window ran past the seven days the notes keep, so the last seven were read$/);
  });

  it("reads and detects on a dry run, and writes nothing", async () => {
    const client = seededFigma();
    const h = sweepHarness({
      channels: {},
      sources: [CARD, PRD],
      people: { Meryem: "U0MERYEM", "Sarah K": "U0SARAH" },
      detectorReplies: [REPLY],
      now: at(30, 10),
      dryRun: true,
      figma: { client, notes: NOTES, cards: { 2482: { url: CARD_URL, title: "Goal Setting" } } },
    });
    await h.store.saveCursor(COMMENTS_CURSOR, SWITCHED, SWITCH_ON);
    const report = await runSweepJob(NIGHT, h.deps);
    assert.equal(report.figmaFiles?.[0]?.decisions.length, 4);
    assert.equal(h.figma.queue.size, 0);
    assert.equal(await h.store.cursor(COMMENTS_CURSOR), SWITCHED);
  });
});

describe("the morning's decisions on the sweep's message in #plus-design (#900)", () => {
  async function postedMorning() {
    const { h, client } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    const report = await morning(h);
    return { h, client, report };
  }

  it("hands the decisions over and posts nothing of its own", async () => {
    const { h } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    const report = await runSweepJob(MORNING, h.deps);
    assert.equal(report.summary, "handed 4 Figma decision card(s) on 1 file(s) to the morning post");
    assert.deepEqual(h.figma.messages, []);
    assert.deepEqual(h.posted, []);
    assert.equal(h.figma.queue.size, 1, "queued until the message is up");
  });

  it("goes to the message of the place the posting ladder names: a Toolkit card's file to #plus-toolkit, a Tutoring card's to its Figma team's", async () => {
    const toolkit = await nightHarness({ cards: { 2482: { url: CARD_URL, title: "Goal Setting", pillars: ["Toolkit"] } } });
    await runSweepJob(NIGHT, toolkit.h.deps);
    toolkit.h.clock.now = at(30, 13);
    await morning(toolkit.h);
    assert.deepEqual(toolkit.h.posted.map((p) => [p.channel, p.threadTs]), [["C0TOOLKIT", null]], "one message, in the team's channel");
    assert.equal(toolkit.h.staged.length, 4);
    assert.ok(toolkit.h.staged.every((p) => p.channel === "C0TOOLKIT"));
    const [thread] = [...toolkit.h.figma.threads.values()];
    assert.equal(thread!.channel, "C0TOOLKIT", "a rewording reply finds its thread there");

    const tutoring = await nightHarness({ cards: { 2482: { url: CARD_URL, title: "Goal Setting", pillars: ["Tutoring"] } }, triage: { fileTeams: { [FILE]: "Toolkit" } } });
    await runSweepJob(NIGHT, tutoring.h.deps);
    tutoring.h.clock.now = at(30, 13);
    await morning(tutoring.h);
    assert.deepEqual(tutoring.h.posted.map((p) => p.channel), ["C0TOOLKIT"], "no pillar channel: the file's Figma team decides");
  });

  it("is a section of the one message: its owner's bullet, and a card per decision in the carousel", async () => {
    const { h } = await postedMorning();
    assert.equal(h.posted.length, 1, "one message in #plus-design");
    assert.deepEqual(h.figma.messages, [], "nothing of its own");
    const parent = parentOf(h);
    assert.equal(parent.channel, DESIGN);
    const blocks = parent.blocks as Array<{ type: string; text?: { text: string }; elements?: Card[] }>;
    assert.match(blocks[0]!.text!.text, /<@U0SARAH>, 4 comments in <https:\/\/www\.figma\.com\/design\/GoalFile1\|Goal Setting \/ Card 2482 \/ Sarah> read like decisions\./);
    assert.deepEqual(notified(parent), ["U0SARAH"]);
    assert.equal(mentionCount(parent, "U0SARAH"), 1, "pinged once");
    assert.equal(blocks[1]!.type, "carousel");
    const cards = blocks[1]!.elements!;
    assert.deepEqual(
      cards.map((c) => c.title.text),
      [
        "1 · Keep the progress bar hidden until the first goal is set",
        "2 · States are all in, moving this card to Under Review",
        "3 · Goal chips use Badge's pill variant everywhere",
        "4 · Show the bar only once there is a goal",
      ],
    );
    assert.equal(cards[0]!.subtitle!.text, "<@U0SARAH> · sarah · Specs page · resolved Sep 29");
    assert.equal(cards[0]!.body.text, "PRD › Goal states: add this rule. The progress bar stays hidden until the first goal is set.");
    assert.equal(cards[1]!.body.text, "Card 2482 › Design Status: WIP → Under Review");
    assert.match(cards[2]!.body.text, /^Intake: "Goal chips use the Badge pill variant"\. Agreed in Figma/);
    // Each card is decided from its own Review; Open goes to its comment.
    assert.deepEqual(cards[0]!.actions.map((a) => a.text.text), ["Review", "Open comment", "Open page"]);
    assert.equal(cards[0]!.actions[1]!.url, "https://www.figma.com/design/GoalFile1?node-id=4-1#c1");
    assert.deepEqual(cards[1]!.actions.map((a) => a.text.text), ["Review", "Open comment", "Open card"]);
    assert.deepEqual(cards[2]!.actions.map((a) => a.text.text), ["Review", "Open comment"]);
    // Nothing to type or react: no gate footer anywhere it posted or staged.
    for (const text of [parent.text, JSON.stringify(blocks), ...h.staged.map((p) => p.proposalText)]) {
      assert.doesNotMatch(text, /white_check_mark|no_entry|✅|⛔|\bdrop \d|\bskip\b|react/);
    }
  });

  it("puts the whole text a write makes in Review, and a cut of it on the card", async () => {
    const long = `${"Goal chips use Badge's pill variant on every goal screen, in every state and every cohort. ".repeat(20)}The end.`;
    const reply = JSON.stringify({
      decisions: [{ thread_id: "c4", route: "design-system", decision: "Goal chips use the pill.", title: "Goal chips use the Badge pill variant", body: long, confidence: 0.8 }],
    });
    const { h } = await nightHarness({ replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    await morning(h);
    const posted = parentOf(h);
    assert.ok(h.staged[0]!.proposalText.includes(long), "Review shows every word the write makes");
    const card = (posted.blocks as Card[])[1]!;
    assert.equal(card.body.text.length, 200);
    assert.ok(!JSON.stringify(posted.blocks).includes("The end."), "the card shows a cut of it");
  });

  it("stages each decision on its own, for the card's people, for 24 weekday hours — and writes nothing (AC 3)", async () => {
    const { h, client } = await postedMorning();
    const parent = parentOf(h);
    assert.equal(h.staged.length, 4);
    for (const [i, p] of h.staged.entries()) {
      const id = ["c1", "c3", "c4", "c9"][i]!;
      assert.equal(p.supersedeKey, `report-item:${parent.ts}:${id}`);
      assert.equal(p.proposalTs, `${parent.ts}#${id}`, "its own proposal, on its card in the message");
      assert.equal(p.threadTs, parent.ts);
      assert.deepEqual(p.confirmers, ["U0MERYEM", "U0SARAH"]);
      assert.equal(p.ttlMs, 24 * 3_600_000, "staged Wednesday 09:00 ET, live until Thursday 09:00 ET");
      assert.equal(p.operations?.length, 1);
      assert.equal(p.stated?.cancelled, "Dropped, nothing written");
      assert.equal(p.refuseRevision, `To change decision ${i + 1}'s wording, press Review on its card and choose Needs changes.`);
    }
    // Every card is live at once, each in its own slot of the thread.
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 4);
    // Posting and staging wrote nothing anywhere: each write waits on its card's ✅.
    assert.deepEqual(client.writes(), []);
    assert.deepEqual([...h.figma.carded].sort(), ["c1", "c3", "c4", "c9"]);
    assert.equal(h.figma.queue.size, 0);
    assert.deepEqual(
      h.figma.threads.get(parent.ts)?.decisions.map((d) => [d.n, d.commentId, d.file?.fileKey]),
      [
        [1, "c1", FILE],
        [2, "c3", FILE],
        [3, "c4", FILE],
        [4, "c9", FILE],
      ],
    );
  });

  it("keeps what a change replaces, as the night read it, for Review's Before", async () => {
    const { h } = await postedMorning();
    const [added, card, issue, rewrite] = h.staged;
    assert.deepEqual(rewrite!.before, { "0.replace.0.content": "Show the progress bar on every goal screen." });
    assert.deepEqual(Object.keys(card!.before ?? {}), ["0.properties.Design Status"]);
    // An added line and a new issue replace nothing.
    assert.equal(added!.before, undefined);
    assert.equal(issue!.before, undefined);
    // The decision is the change's reason, for Review's Issue, beside what it replaces.
    assert.equal(rewrite!.issue, "Decided in a Figma comment: The bar shows once the first goal is set.");
    assert.equal(card!.issue, "Decided in a Figma comment: The card moves to Under Review.");
    assert.equal(added!.issue, undefined);
  });

  it("never cards a thread twice, whatever is said in it later", async () => {
    const { h, client } = await postedMorning();
    client.seedFile(FILE, {
      comments: [...COMMENTS, comment("c1s", { handle: "meryem", parent_id: "c1", created_at: "2026-09-30T15:00:00Z", message: "Done in v3" })],
    });
    h.clock.now = at(31, 10);
    (h.deps.figmaComments!.notes as { list(p: string): Promise<unknown[]> }).list = async (prefix: string) =>
      prefix.startsWith("figma-notify:commented:2026-09-30") ? [{ key: `figma-notify:commented:2026-09-30:${FILE}`, at: "2026-09-30T15:00:00Z" }] : [];
    await runSweepJob(NIGHT, h.deps);
    assert.equal(h.provider.generated.length, 1, "the carded thread's new reply asks the detector nothing");
  });

  it("names nobody for a card-less file, never its creator, and #plus-design's members decide", async () => {
    const client = createInMemoryFigma();
    client.seedFile("LibFile1", {
      name: "Design System (S23)",
      document: DOCUMENT,
      creator: { id: "u-bea", handle: "bea" },
      comments: [comment("d1", { handle: "bea", message: "Goal chips use Badge's pill variant everywhere", client_meta: pin("8:1") }, "LibFile1")],
    });
    const reply = JSON.stringify({
      decisions: [
        { thread_id: "d1", route: "design-system", decision: "Goal chips use the pill.", title: "Goal chips use the Badge pill variant", body: "Agreed in Figma.", confidence: 0.8 },
      ],
    });
    const { h } = await nightHarness({
      figma: client,
      replies: [reply],
      notes: [{ key: "figma-notify:commented:2026-09-29:LibFile1", at: "2026-09-29T15:00:00Z" }],
      members: ["U0A", "U0B"],
    });
    await runSweepJob(NIGHT, h.deps);
    assert.equal(h.figma.queue.get("LibFile1")?.owner, null);
    h.clock.now = at(30, 13);
    await morning(h);
    assert.match(parentOf(h).text, /^1 comment in <https:\/\/www\.figma\.com\/design\/LibFile1\|Design System \(S23\)> reads like a decision\./);
    assert.deepEqual(notified(parentOf(h)), []);
    assert.deepEqual(h.staged[0]!.confirmers, ["U0A", "U0B"]);
  });

  it("checks a queued owner and confirmers again at the hand-over: one who has left since is neither tagged nor asked (#1361)", async () => {
    for (const [active, tagged, confirmers] of [
      [SARAH_ROWS.active, ["U0SARAH"], ["U0MERYEM", "U0SARAH"]],
      [SARAH_ROWS.past, [], ["U0MERYEM"]],
      [SARAH_ROWS.missing, [], ["U0MERYEM"]],
    ] as const) {
      const { h } = await nightHarness();
      await runSweepJob(NIGHT, h.deps);
      assert.deepEqual(h.figma.queue.get(FILE)?.owner, { slack: "U0SARAH" }, "everyone active at night");
      h.deps.people.active = async () => active;
      h.clock.now = at(30, 13);
      await morning(h);
      assert.deepEqual(notified(parentOf(h)), tagged);
      for (const p of h.staged) assert.deepEqual(p.confirmers, confirmers);
    }
  });

  it("names nobody for an owner queued by Figma handle before #1361, and falls back to the channel when no Contributor is active", async () => {
    const { h } = await nightHarness({ members: ["U0A", "U0B"] });
    await runSweepJob(NIGHT, h.deps);
    const queued = h.figma.queue.get(FILE)!;
    h.figma.queue.set(FILE, { ...queued, owner: { figma: "Jade Wang" } as unknown as FileOwner });
    h.deps.people.active = async () => NOBODY_ACTIVE;
    h.clock.now = at(30, 13);
    await morning(h);
    assert.doesNotMatch(JSON.stringify(h.posted), /Jade/);
    assert.deepEqual(notified(parentOf(h)), []);
    for (const p of h.staged) assert.deepEqual(p.confirmers, ["U0A", "U0B"], "a failed read names nobody: the channel decides");
  });

  it("keeps a decision whose card did not stage for the next morning, and says so on the card", async () => {
    const { h } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    h.faults.stage = new Error("ThreadState unavailable");
    await morning(h);
    const parent = parentOf(h);
    const cards = (parent.editedBlocks as Array<{ elements?: Card[] }>)[1]!.elements!;
    assert.equal(cards[0]!.subtitle!.text, "Didn't go through, so it's queued again for tomorrow morning.");
    assert.deepEqual(cards[0]!.actions.map((a) => a.text.text), ["Open comment", "Open page"], "nothing to review");
    assert.deepEqual(cards.slice(1).map((c) => c.actions[0]!.text.text), ["Review", "Review", "Review"], "the others stand");
    assert.deepEqual(h.figma.queue.get(FILE)?.decisions.map((d) => d.commentId), ["c1"]);
    // The next morning's message carries it, numbered from 1 there.
    h.clock.now = at(31, 13);
    await morning(h);
    assert.equal(h.posted.length, 2, "one message each morning");
    assert.equal((h.posted[1]!.blocks as Card[])[1]!.title.text, "1 · Keep the progress bar hidden until the first goal is set");
    assert.equal(h.figma.queue.size, 0);
  });

  it("defers the morning's message when the budget left cannot cover the cards' staging", async () => {
    const { h } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    await runSweepJob(MORNING, h.deps);
    h.deps.sections = [figmaDecisionsSection(h.deps.figmaComments!, h.deps.runDate, h.deps.now)!];
    let d1 = 11;
    h.deps.meter = { subrequests: () => 0, d1Queries: () => 0, headroom: () => ({ subrequests: 40, d1Queries: d1 }) };
    await assert.rejects(runSweepJob(SWEEP_POST, h.deps), isSubrequestBudgetError);
    assert.deepEqual(h.posted, [], "nothing posted, so no message is left half done");
    d1 = 40;
    await runSweepJob(SWEEP_POST, h.deps);
    assert.equal(h.posted.length, 1);
    assert.equal(h.staged.length, 4);
  });

  it("counts in its line the cards it carries, and says a decision with no PRD in a line and a reply in the thread", async () => {
    const noPrd: SweepSource = { ...CARD, subpages: [] };
    const reply = JSON.stringify({
      decisions: [
        { thread_id: "c1", route: "prd", decision: "The progress bar stays hidden until the first goal is set.", confidence: 0.9 },
        { thread_id: "c3", route: "card", decision: "The card moves to Under Review.", card: 2482, field: "Design Status", value: "Under Review", confidence: 0.88 },
      ],
    });
    const { h } = await nightHarness({ sources: [noPrd, PRD], replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    await morning(h);
    const parent = parentOf(h);
    const blocks = parent.blocks as Array<{ type: string; text?: { text: string } }>;
    assert.equal(blocks[1]!.type, "card", "the status decision carries the one card");
    assert.match(blocks[0]!.text!.text, /, 1 comment in .* reads like a decision\./);
    assert.match(blocks[0]!.text!.text, /1 comment in .* reads like a PRD change with no PRD page to draft on; the details are in this thread\./);
    assert.equal(h.figma.messages.length, 1, "the PRD decision with no PRD is a plain reply");
    assert.equal(h.figma.messages[0]!.threadTs, parent.ts);
  });

  it("shares the carousel's ten and holds the rest in the file's queue for the next morning", async () => {
    const twelve = Array.from({ length: 12 }, (_, i) =>
      comment(`m${i + 1}`, { created_at: `2026-09-29T16:${String(10 + i).padStart(2, "0")}:00Z`, message: `Decision ${i + 1}`, client_meta: pin("4:2") }),
    );
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { name: "Goal Setting / Card 2482 / Sarah", document: DOCUMENT, comments: twelve });
    const reply = JSON.stringify({
      decisions: twelve.map((c, i) => ({ thread_id: c.id, route: "card", decision: `Status ${i + 1}.`, card: 2482, field: "Design Status", value: "Under Review", confidence: 0.9 })),
    });
    const { h } = await nightHarness({ figma, replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    await morning(h);
    const [first] = h.posted;
    const blocks = first!.blocks as Array<{ text?: { text: string }; elements?: Card[] }>;
    assert.match(blocks[0]!.text!.text, /<@U0SARAH>, 12 comments in .* read like decisions\. Here are 10; 2 more come in the next report\./);
    assert.deepEqual(blocks[1]!.elements!.map((c) => c.title.text), Array.from({ length: 10 }, (_, i) => `${i + 1} · Decision ${i + 1}`));
    assert.equal(h.staged.length, 10);
    assert.deepEqual(h.figma.queue.get(FILE)?.decisions.map((d) => d.commentId), ["m11", "m12"], "held in the file's queue entry");

    h.clock.now = at(31, 13);
    await morning(h);
    const second = h.posted.at(-1)!;
    assert.notEqual(second.ts, first!.ts);
    assert.deepEqual((second.blocks as Array<{ elements?: Card[] }>)[1]!.elements!.map((c) => c.title.text), ["1 · Decision 11", "2 · Decision 12"]);
    assert.equal(h.figma.queue.size, 0);
  });

  it("replies about at most MAX_NO_PRD_REPLIES decisions with no PRD a morning, and keeps the rest queued", async () => {
    const seven = Array.from({ length: MAX_NO_PRD_REPLIES + 2 }, (_, i) =>
      comment(`p${i + 1}`, { created_at: `2026-09-29T16:${String(10 + i).padStart(2, "0")}:00Z`, message: `Behavior ${i + 1}`, client_meta: pin("4:2") }),
    );
    const figma = createInMemoryFigma();
    figma.seedFile(FILE, { name: "Goal Setting / Card 2482 / Sarah", document: DOCUMENT, comments: seven });
    const reply = JSON.stringify({ decisions: seven.map((c, i) => ({ thread_id: c.id, route: "prd", decision: `Behavior ${i + 1}.`, confidence: 0.9 })) });
    const { h } = await nightHarness({ figma, sources: [{ ...CARD, subpages: [] }, PRD], replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    await morning(h);
    assert.equal(h.figma.messages.length, MAX_NO_PRD_REPLIES);
    assert.deepEqual(h.figma.queue.get(FILE)?.decisions.map((d) => d.commentId), ["p6", "p7"], "the rest wait for the next morning");

    h.clock.now = at(31, 13);
    await morning(h);
    assert.equal(h.figma.messages.length, MAX_NO_PRD_REPLIES + 2);
    assert.equal(h.figma.queue.size, 0);
  });

  it("says a behavior decision on a card with no PRD page in the thread, and writes it nowhere", async () => {
    const noPrd: SweepSource = { ...CARD, subpages: [] };
    const reply = JSON.stringify({
      decisions: [{ thread_id: "c1", route: "prd", decision: "The progress bar stays hidden until the first goal is set.", confidence: 0.9 }],
    });
    const { h } = await nightHarness({ sources: [noPrd, PRD], replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    const prompt = String((h.provider.generated[0] as { prompt?: string }).prompt);
    assert.match(prompt, /^PRD: none/m, "the card's own body is not offered as its PRD");
    assert.deepEqual(h.figma.queue.get(FILE)?.decisions.map((d) => [d.update, d.operation]), [[{ kind: "no-prd", card: 2482 }, null]]);
    h.clock.now = at(30, 13);
    await morning(h);
    assert.equal(h.staged.length, 0, "nothing is staged");
    assert.equal(h.posted.length, 1, "the morning's message says it in a line");
    assert.match(h.figma.messages[0]!.text, /This reads like a PRD change, but Card 2482 has no PRD page, so I haven't drafted it anywhere: The progress bar stays hidden/);
    assert.equal(h.figma.messages[0]!.threadTs, h.posted[0]!.ts);
    assert.deepEqual([...h.figma.carded], ["c1"]);
    assert.equal(h.figma.queue.size, 0);
  });
});

describe("an unanswered question, raised after two workdays", () => {
  const TOOLKIT = "C0TOOLKIT";
  const TOOLKIT_CARD = { 2482: { url: CARD_URL, title: "Goal Setting", pillars: ["Toolkit"] } };
  /** Tuesday's question (c10, Specs) waits Wednesday and Thursday: Friday's morning raises it. */
  const THURSDAY = at(31, 13);
  const FRIDAY = at(32, 13);
  const MONDAY = at(35, 13);

  /** A morning: the hand-over, then the sweep's post with the decisions and
   *  the questions as its sections. The summary is both jobs'. */
  async function morning(h: SweepHarness, now: number) {
    h.clock.now = now;
    const report = await runSweepJob(MORNING, h.deps);
    const fc = h.deps.figmaComments!;
    h.deps.sections = [
      figmaDecisionsSection(fc, h.deps.runDate, h.deps.now)!,
      questionsSection(fc.triage!, fc.questionsHandOff!, h.deps.runDate, h.deps.now),
    ];
    const post = await runSweepJob(SWEEP_POST, h.deps);
    return { summary: `${report.summary} | ${post.summary}` };
  }

  /** Each question line on a morning message, with its channel. */
  function posts(h: SweepHarness): Array<{ channel: string; text: string }> {
    return h.posted.flatMap((p) =>
      p.text.split("\n").flatMap((line) => {
        const m = /((?:<@\w+>|[\w.-]+), a question in .*\|Open comment>|A question in .*\|Open comment>)/.exec(line);
        return m ? [{ channel: p.channel, text: m[1]! }] : [];
      }),
    );
  }

  it("is raised once, at two workdays, on the morning message of the card's team channel, tagging its design owner", async () => {
    const { h } = await nightHarness({ cards: TOOLKIT_CARD, triage: {} });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, at(30, 13));
    await morning(h, THURSDAY);
    assert.equal(posts(h).length, 0, "one workday is not two");
    const report = await morning(h, FRIDAY);
    assert.match(report.summary, /handed \d+ Figma decision card\(s\) on \d+ file\(s\) to the morning post, handed 1 unanswered Figma question\(s\)/);
    assert.equal(posts(h).length, 1);
    const [post] = posts(h);
    assert.equal(post!.channel, TOOLKIT);
    assert.equal(
      post!.text,
      "<@U0SARAH>, a question in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> has waited two workdays with no answer: “Should the bar animate?” — meryem, Specs › Goal states. <https://www.figma.com/design/GoalFile1?node-id=4-1#c10|Open comment>",
    );
    await morning(h, MONDAY);
    assert.equal(posts(h).length, 1, "never raised again");
    assert.deepEqual(h.figma.triage.dms, []);
    const [event] = h.figma.triage.events;
    assert.equal(h.figma.triage.events.length, 1, "the card is on the usage record once, as a Worker-staged card");
    assert.equal(event!.event, "staged");
    assert.equal(event!.via, "worker");
    assert.equal(event!.channelId, TOOLKIT);
    assert.deepEqual(event!.tools, [], "a question card runs nothing");
    assert.equal(h.posted.filter((p) => p.channel === TOOLKIT && p.threadTs === null).length, 2, "Friday's one message there, and Monday's for the card's decisions");
  });

  it("keeps a question whose team channel uno-bot is not in", async () => {
    const { h } = await nightHarness({ cards: TOOLKIT_CARD, triage: {} });
    h.notInChannel.add(TOOLKIT);
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(posts(h), []);
    assert.deepEqual(h.figma.triage.events, [], "nothing on the usage record until it is up");
    assert.equal(h.figma.triage.watch.get(FILE)?.questions.length, 1, "never dropped: it waits for the invite");
  });

  it("leaves a question on any other page alone", async () => {
    const client = seededFigma();
    client.seedFile(FILE, {
      comments: [...COMMENTS, comment("c11", { created_at: "2026-09-29T20:10:00Z", message: "Is option B final?", client_meta: pin("6:1") })],
    });
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: {} });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(posts(h).map((p) => p.text.match(/“(.*)”/)?.[1]), ["Should the bar animate?"], "the WIP question is not raised");
  });

  it("raises nothing once someone else answered or the thread was resolved", async () => {
    const { h, client } = await nightHarness({ cards: TOOLKIT_CARD, triage: {} });
    await runSweepJob(NIGHT, h.deps);
    client.seedFile(FILE, {
      comments: [...COMMENTS, comment("c10r", { handle: "sarah", parent_id: "c10", created_at: "2026-09-30T14:00:00Z", message: "No, it stays still." })],
    });
    await morning(h, FRIDAY);
    assert.deepEqual(posts(h), []);
    assert.equal(h.figma.triage.watch.size, 0, "an answered question is no longer watched");

    const second = await nightHarness({ cards: TOOLKIT_CARD, triage: {} });
    await runSweepJob(NIGHT, second.h.deps);
    second.client.seedFile(FILE, {
      comments: COMMENTS.map((c) => (c.id === "c10" ? { ...c, resolved_at: "2026-09-30T14:00:00Z" } : c)),
    });
    await morning(second.h, FRIDAY);
    assert.deepEqual(posts(second.h), []);
  });

  it("is still raised when only its asker replied", async () => {
    const { h, client } = await nightHarness({ cards: TOOLKIT_CARD, triage: {} });
    await runSweepJob(NIGHT, h.deps);
    client.seedFile(FILE, {
      comments: [...COMMENTS, comment("c10b", { handle: "meryem", parent_id: "c10", created_at: "2026-09-30T14:00:00Z", message: "Anyone?" })],
    });
    await morning(h, FRIDAY);
    assert.equal(posts(h).length, 1);
  });

  /** The night's comments with c10 asking `message`, and one by Sarah K, so her Figma id is on the file. */
  const asking = (message: string) => [
    ...COMMENTS.map((c) => (c.id === "c10" ? { ...c, message } : c)),
    comment("c12", { handle: "Sarah K", created_at: "2026-09-29T14:00:00Z", message: "Card states are in", client_meta: pin("8:1") }),
  ];

  it("DMs a person the Team Members Figma map knows through their commenter id, and names an unmapped one on the channel card", async () => {
    const client = seededFigma();
    client.seedFile(FILE, { comments: asking("@Sarah K should the bar animate? cc @bea") });
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-Sarah K": "U0SARAH" } } });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(h.figma.triage.dms.map((d) => d.to), ["U0SARAH"]);
    assert.equal(
      h.figma.triage.dms[0]!.text,
      "meryem asked you a question in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> two workdays ago, and nobody has answered: “@Sarah K should the bar animate? cc @bea” — Specs › Goal states. <https://www.figma.com/design/GoalFile1?node-id=4-1#c10|Open comment>",
    );
    assert.equal(posts(h).length, 1);
    assert.equal(posts(h)[0]!.channel, TOOLKIT);
    assert.match(posts(h)[0]!.text, / It names bea, who isn't matched to a Slack account yet\. /, "bea commented, but the map has no entry for her id");
    assert.doesNotMatch(posts(h)[0]!.text, /names Sarah K/, "the mapped person is DMed, not named");
  });

  it("names on the channel card a handle with no commenter id on the file, whatever the map holds", async () => {
    const client = seededFigma();
    client.seedFile(FILE, { comments: COMMENTS.map((c) => (c.id === "c10" ? { ...c, message: "@dana should the bar animate?" } : c)) });
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-dana": "U0DANA" } } });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(h.figma.triage.dms, [], "no commenter id for @dana on the file, so nobody is DMed");
    assert.equal(posts(h).length, 1);
    assert.match(posts(h)[0]!.text, / It names dana, who isn't matched to a Slack account yet\. /);
  });

  it("names on the channel card a handle two commenters on the file share, even when the map knows one of them", async () => {
    const client = seededFigma();
    const comments = [
      ...asking("@sarah k should the bar animate?"),
      comment("c13", { handle: "sarah k", created_at: "2026-09-29T15:00:00Z", message: "Spacing too", client_meta: pin("8:2") }),
    ];
    client.seedFile(FILE, { comments });
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-Sarah K": "U0SARAH" } } });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(h.figma.triage.dms, [], "two Figma ids answer to @sarah k, so the bot cannot tell whom to DM");
    assert.equal(posts(h).length, 1);
    assert.match(posts(h)[0]!.text, / It names sarah k, who isn't matched to a Slack account yet\. /);
  });

  it("sends only the DM when everyone it names is mapped", async () => {
    const client = seededFigma();
    client.seedFile(FILE, { comments: asking("@sarah k should the bar animate?") });
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-Sarah K": "U0SARAH" } } });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(h.figma.triage.dms.map((d) => d.to), ["U0SARAH"]);
    assert.deepEqual(posts(h), []);
    await morning(h, MONDAY);
    assert.equal(h.figma.triage.dms.length, 1, "never DMed twice");
  });

  it("waits for the invite when the card is refused, and never DMs again the people it already reached", async () => {
    const client = seededFigma();
    client.seedFile(FILE, { comments: asking("@Sarah K should the bar animate? cc @bea") });
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-Sarah K": "U0SARAH" } } });
    h.notInChannel.add(TOOLKIT);
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.deepEqual(h.figma.triage.dms.map((d) => d.to), ["U0SARAH"]);
    assert.deepEqual(posts(h), []);
    assert.equal(h.figma.triage.raised.size, 0, "a refused line is not raised");
    assert.equal(h.figma.triage.watch.get(FILE)?.questions.length, 1, "still watched");

    await morning(h, MONDAY);
    assert.equal(h.figma.triage.dms.length, 1, "Sarah is not DMed again while the card waits");
    assert.deepEqual(posts(h), []);

    h.notInChannel.delete(TOOLKIT);
    const invited = await morning(h, at(36, 13));
    assert.equal(posts(h).length, 1, "the line goes once uno-bot is invited");
    assert.equal(h.figma.triage.dms.length, 1, "and Sarah still has one DM");
    assert.match(invited.summary, /handed 1 unanswered Figma question\(s\)/);
    assert.equal(h.figma.triage.watch.size, 0);
  });

  it("retries next morning only the mapped person whose DM failed", async () => {
    const client = seededFigma();
    client.seedFile(FILE, { comments: asking("@Sarah K @bea should the bar animate?") });
    const dmFails = ["U0BEA"];
    const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-Sarah K": "U0SARAH", "u-bea": "U0BEA" }, dmFails } });
    await runSweepJob(NIGHT, h.deps);
    const friday = await morning(h, FRIDAY);
    assert.deepEqual(h.figma.triage.dms.map((d) => d.to), ["U0SARAH"]);
    assert.doesNotMatch(friday.summary, /handed 1 unanswered/);
    assert.equal(h.figma.triage.watch.get(FILE)?.questions.length, 1, "bea is still owed her DM");

    dmFails.length = 0;
    await morning(h, MONDAY);
    assert.deepEqual(h.figma.triage.dms.map((d) => d.to), ["U0SARAH", "U0BEA"], "only bea is DMed on the retry");
    assert.deepEqual(posts(h), []);
    assert.equal(h.figma.triage.watch.size, 0);
    await morning(h, at(36, 13));
    assert.equal(h.figma.triage.dms.length, 2);
  });

  it("with a card whose pillars have no channel, goes to the Figma file's team channel, tagging its design owner", async () => {
    const tutoring = { 2482: { url: CARD_URL, title: "Goal Setting", pillars: ["Tutoring"] } };
    const { h } = await nightHarness({ cards: tutoring, triage: { fileTeams: { [FILE]: "Toolkit" } } });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.equal(posts(h).length, 1);
    assert.equal(posts(h)[0]!.channel, TOOLKIT);
    assert.match(posts(h)[0]!.text, /^<@U0SARAH>, a question/);
  });

  it("with no card, goes to the Figma file's team channel and names nobody, never its creator", async () => {
    const client = createInMemoryFigma();
    client.seedFile("ToolFile1", {
      name: "Session notes",
      document: DOCUMENT,
      creator: { id: "u-bea", handle: "bea" },
      comments: [comment("q1", { handle: "meryem", created_at: "2026-09-29T20:00:00Z", message: "Who signs off on this?", client_meta: pin("8:1") }, "ToolFile1")],
    });
    const notes = [{ key: "figma-notify:commented:2026-09-29:ToolFile1", at: "2026-09-29T20:00:00Z" }];
    const none = JSON.stringify({ decisions: [] });
    const { h } = await nightHarness({ figma: client, notes, replies: [none], triage: { fileTeams: { ToolFile1: "Toolkit" } } });
    await runSweepJob(NIGHT, h.deps);
    await morning(h, FRIDAY);
    assert.equal(posts(h).length, 1);
    assert.equal(posts(h)[0]!.channel, TOOLKIT);
    assert.match(posts(h)[0]!.text, /^A question in <https:\/\/www\.figma\.com\/design\/ToolFile1\|Session notes> has waited/);
    assert.doesNotMatch(posts(h)[0]!.text, /bea/);

    const elsewhere = await nightHarness({ figma: client, notes, replies: [none], triage: { fileTeams: { ToolFile1: "MISC" } } });
    await runSweepJob(NIGHT, elsewhere.h.deps);
    await morning(elsewhere.h, FRIDAY);
    assert.equal(posts(elsewhere.h)[0]!.channel, DESIGN, "a team with no channel → #plus-design");
  });

  it("tags the design owner on a question's line only while their row is active (#1361)", async () => {
    const tutoring = { 2482: { url: CARD_URL, title: "Goal Setting", pillars: ["Tutoring"] } };
    for (const [active, opens] of [
      [SARAH_ROWS.active, /^<@U0SARAH>, a question/],
      [SARAH_ROWS.past, /^A question/],
      [SARAH_ROWS.missing, /^A question/],
    ] as const) {
      const { h } = await nightHarness({ cards: tutoring, triage: { fileTeams: { [FILE]: "Toolkit" } } });
      await runSweepJob(NIGHT, h.deps);
      h.deps.figmaComments!.triage!.active = async () => active;
      await morning(h, FRIDAY);
      assert.match(posts(h)[0]!.text, opens);
    }
  });

  it("DMs, or names on the line, a person a question names only while their row is active (#1361)", async () => {
    for (const [active, dms, named] of [
      [activeFrom([MERYEM_ROW, { name: "Sarah K", slack: "U0SARAH" }, { name: "bea" }]), ["U0SARAH"], true],
      [activeFrom([MERYEM_ROW, { name: "Sarah K", slack: "U0SARAH", affiliation: "Past Collaborators" }, { name: "bea", affiliation: "Past Collaborators" }]), [], false],
      [activeFrom([MERYEM_ROW]), [], false],
    ] as const) {
      const client = seededFigma();
      client.seedFile(FILE, { comments: asking("@Sarah K @bea should the bar animate?") });
      const { h } = await nightHarness({ figma: client, cards: TOOLKIT_CARD, triage: { people: { "u-Sarah K": "U0SARAH" } }, active });
      await runSweepJob(NIGHT, h.deps);
      await morning(h, FRIDAY);
      assert.deepEqual(h.figma.triage.dms.map((d) => d.to), dms);
      assert.equal(posts(h).length, 1, "someone named was not reached, so the channel triages");
      if (named) assert.match(posts(h)[0]!.text, / It names bea, who isn't matched to a Slack account yet\. /);
      else assert.doesNotMatch(posts(h)[0]!.text, /It names/);
    }
  });

  it("counts workdays only: a Friday question waits Monday and Tuesday, and Wednesday's morning raises it", () => {
    const friday = Date.parse("2026-10-02T18:00:00Z");
    assert.ok(dueAt(friday) > Date.parse("2026-10-07T03:59:00Z"), "not before Wednesday");
    assert.ok(dueAt(friday) <= Date.parse("2026-10-07T13:00:00Z"), "by Wednesday's morning run");
  });

  it("keeps no hand-kept handle map: the Team Members Figma map is the one people map", () => {
    for (const file of ["wrangler.toml", "src/types.ts"]) {
      assert.doesNotMatch(readFileSync(resolve(process.cwd(), file), "utf8"), /FIGMA_HANDLE_SLACK_IDS/, file);
    }
  });

  it("keeps nothing on a dry run", async () => {
    const { h } = await nightHarness({ cards: TOOLKIT_CARD, triage: {} });
    h.deps.dryRun = true;
    await runSweepJob(NIGHT, h.deps);
    assert.equal(h.figma.triage.watch.size, 0);
  });
});

describe("what decides what the read sees", () => {
  it("reads a comment created after the watermark, or a root resolved after it, and nothing else", () => {
    const w = SWITCH_ON;
    assert.equal(readable({ created_at: "2026-09-29T11:00:00Z", resolved_at: null, parent_id: "", message: "" }, w), true);
    assert.equal(readable({ created_at: "2026-09-28T11:00:00Z", resolved_at: "2026-09-29T11:00:00Z", parent_id: "", message: "" }, w), true);
    assert.equal(readable({ created_at: "2026-09-28T11:00:00Z", resolved_at: "2026-09-29T11:00:00Z", parent_id: "c1", message: "" }, w), false);
    assert.equal(readable({ created_at: "2026-09-28T11:00:00Z", resolved_at: null, parent_id: "", message: "" }, w), false);
    const threads = candidateThreads(COMMENTS, { watermark: w, from: w, until: at(30, 10) });
    assert.deepEqual(
      threads.map((t) => [t.root.id, t.replies.map((r) => r.id)]),
      [
        ["c1", ["c1r"]],
        ["c3", []],
        ["c4", []],
        ["c5", []],
        ["c6", []],
        ["c9", ["c9b"]],
        ["c10", []],
      ],
    );
  });

  it("reads a reply after the watermark on an older open thread, by that reply alone", async () => {
    const old = comment("o1", { handle: "bea", created_at: "2026-09-20T12:00:00Z", message: "An old open question about the bar", client_meta: pin("4:1") });
    const answer = comment("o1r", { handle: "meryem", parent_id: "o1", created_at: "2026-09-29T16:30:00Z", message: "Settled: the bar waits for a goal" });
    const window = { watermark: SWITCH_ON, from: SWITCH_ON, until: at(30, 10) };
    const [thread] = candidateThreads([old, answer], window);
    assert.equal(thread?.root.id, "o1");
    assert.equal(thread?.rootRead, false);
    assert.deepEqual(thread?.replies.map((r) => r.id), ["o1r"]);
    assert.deepEqual(candidateThreads([old], window), [], "an old root alone stays unread");

    const client = createInMemoryFigma();
    client.seedFile(FILE, { name: "Goal Setting / Card 2482 / Sarah", document: DOCUMENT, comments: [old, answer] });
    const reply = JSON.stringify({
      decisions: [
        { thread_id: "o1", route: "card", decision: "The card moves to Under Review.", card: 2482, field: "Design Status", value: "Under Review", confidence: 0.9 },
      ],
    });
    const { h } = await nightHarness({ figma: client, replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    const prompt = String((h.provider.generated[0] as { prompt?: string }).prompt);
    assert.match(prompt, /^\[thread o1\] Specs › Goal states › Empty state · open\n {2}meryem \(2026-09-29\): Settled: the bar waits for a goal$/m);
    assert.ok(!prompt.includes("An old open question"), "the root from before the watermark is never shown");
    const [d] = h.figma.queue.get(FILE)!.decisions;
    assert.deepEqual([d!.commentId, d!.quote, d!.by], ["o1", "Settled: the bar waits for a goal", "meryem"], "carded by the thread, quoting the reply");
  });

  it("offers and accepts only a card's status, owner and timing fields", async () => {
    const wide: SweepSource = {
      ...CARD,
      properties: { ...CARD.properties, Priority: "Med", "Product Pillar": "Goal-Setting", "Design Timeline": "Oct 1 → Oct 20" },
    };
    const reply = JSON.stringify({
      decisions: [
        { thread_id: "c1", route: "card", decision: "Priority goes up.", card: 2482, field: "Priority", value: "High", confidence: 0.9 },
        { thread_id: "c3", route: "card", decision: "Design runs to Oct 27.", card: 2482, field: "Design Timeline", value: "Oct 1 → Oct 27", confidence: 0.9 },
      ],
    });
    const { h } = await nightHarness({ sources: [wide, PRD], replies: [reply] });
    await runSweepJob(NIGHT, h.deps);
    const prompt = String((h.provider.generated[0] as { prompt?: string }).prompt);
    const fields = /^fields: (.*)$/m.exec(prompt)?.[1] ?? "";
    assert.match(fields, /Design Status: WIP/);
    assert.match(fields, /Design Timeline: Oct 1 → Oct 20/);
    assert.match(fields, /Contributor: Meryem, Sarah K/);
    assert.doesNotMatch(fields, /Priority|Product Pillar|Name|ID/);
    assert.deepEqual(
      h.figma.queue.get(FILE)?.decisions.map((d) => [d.commentId, d.operation?.input]),
      [["c3", { page_url: CARD_URL, properties: { "Design Timeline": "Oct 1 → Oct 27" } }]],
      "a Priority change is refused at draft time, not left to the write",
    );
    // The parse refuses it too, even from a card read with every field.
    const detected = await modelDecisionDetector(fakeProvider({ generateReplies: [reply] })).detect({
      file: { title: "x", url: "https://www.figma.com/design/x" },
      threads: ["c1", "c3"].map((id) => ({ id, section: "Specs" as const, page: "p", resolved: true, comments: [{ by: "a", at: "2026-09-29", text: "t" }] })),
      cards: [{ number: 2482, title: "Goal Setting", url: CARD_URL, fields: { Priority: "Med", "Design Timeline": "Oct 1 → Oct 20" } }],
      prd: null,
    });
    assert.deepEqual(detected.ok && detected.decisions.map((d) => d.card?.field), ["Design Timeline"]);
  });

  it("names a section by the last divider above a page, emoji or not", () => {
    assert.equal(dividerSection("- - - 📐 Specs - - -"), "Specs");
    assert.equal(dividerSection("- - - 🔍 For Review - - -"), "For Review");
    assert.equal(dividerSection("- - - 🖼 Cover - - -"), "Cover", "without the variation selector");
    assert.equal(dividerSection("---Archive---"), "Archive");
    assert.equal(dividerSection("Specs notes"), null);
    assert.deepEqual(
      pagesOf(DOCUMENT).map((p) => [p.name, p.section]),
      [
        ["- - - 🖼️ Cover - - -", "Cover"],
        ["Cover", "Cover"],
        ["- - - 📐 Specs - - -", "Specs"],
        ["Goal states", "Specs"],
        ["- - - ⏳ WIP - - -", "WIP"],
        ["Explorations", "WIP"],
        ["- - - 🔍 For Review - - -", "For Review"],
        ["Review page", "For Review"],
      ],
    );
    assert.deepEqual(pagesOf({ children: [{ id: "0:1", name: "Page 1" }] }), [{ id: "0:1", name: "Page 1", section: null }]);
    assert.deepEqual(pageOf(DOCUMENT, "4:2"), { pageId: "0:4", name: "Progress bar", isPage: false });
    assert.deepEqual(pageOf(DOCUMENT, "0:8"), { pageId: "0:8", name: "Review page", isPage: true });
    assert.equal(pageOf(DOCUMENT, "9:9"), null);
  });

  it("reads a file's cards off its title, as How We Fig writes it and the variants it corrects", () => {
    assert.deepEqual(cardNumbersOf("AI Indicator / Card 733 & 1002 / Bea"), [733, 1002]);
    assert.deepEqual(cardNumbersOf("Goal Setting / Card #2482 / Sarah"), [2482]);
    assert.deepEqual(cardNumbersOf("Goal Setting / 2204 & 2251 / Sarah"), [2204, 2251]);
    assert.deepEqual(cardNumbersOf("Goal Setting / Card # / Sarah"), []);
    assert.deepEqual(cardNumbersOf("Design System (S23)"), []);
    assert.deepEqual(cardNumbersOf("Reports / Legacy / weekly"), []);
    assert.deepEqual(cardNumbersOf("2024"), [], "a bare number with no title around it is no card");
  });

  it("keeps its place as one string, and quotes a comment on one short line", () => {
    const c = { watermark: SWITCH_ON, from: SWITCH_ON, until: at(30, 10), done: ["A", "B"] };
    assert.deepEqual(readCommentsCursor(writeCommentsCursor(c)), c);
    assert.equal(readCommentsCursor(null), null);
    assert.deepEqual(etDatesOf(SWITCH_ON, at(30, 10)), ["2026-09-29", "2026-09-30"]);
    assert.equal(quoteOf("Keep it\n  hidden"), "Keep it hidden");
    assert.equal(quoteOf("x".repeat(300)).length, 200);
  });
});

// The detector's eval cases, replayed through the real detector.
interface DecisionCase {
  id: string;
  name: string;
  judgeNote: string;
  input: DecisionInput;
  recording: { source: "authored" | "captured"; reply: string };
  expect: { decisions: Array<Record<string, unknown>> };
}
const FIXTURE = resolve(process.cwd(), "../..", "docs/evals/fixtures/figma-decision-cases.json");
const cases = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: DecisionCase[] }).cases;

describe("the comment-decision detector's eval cases", () => {
  it("holds each shape the ticket names, each with a rubric and a recorded reply, withheld from the bot", () => {
    assert.deepEqual(
      cases.map((c) => c.id),
      ["FD1", "FD2", "FD3", "FD4", "FD5"],
    );
    assert.equal(isWithheldRepoPath("docs/evals/fixtures/figma-decision-cases.json"), true);
    for (const c of cases) assert.ok(c.judgeNote.trim() && c.recording.reply, `${c.id} has a rubric and a reply`);
  });

  for (const c of cases) {
    it(`eval ${c.id}: ${c.name}`, async () => {
      const result = await modelDecisionDetector(fakeProvider({ generateReplies: [c.recording.reply] })).detect(c.input);
      assert.equal(result.ok, true);
      if (!result.ok) return;
      const kept = result.decisions.map((d) => ({
        threadId: d.threadId,
        route: d.route,
        ...(d.prd
          ? {
              prd:
                d.prd.kind === "change"
                  ? { kind: "change", blockId: d.prd.block.id, replacement: d.prd.replacement, section: d.prd.section }
                  : { kind: "add", anchorId: d.prd.anchorId, anchorEditedTime: d.prd.anchorEditedTime, section: d.prd.section, text: d.prd.text },
            }
          : {}),
        ...(d.card ? { card: { card: d.card.card.number, field: d.card.field, from: d.card.from, to: d.card.to } } : {}),
        ...(d.intake ? { intake: d.intake } : {}),
      }));
      assert.deepEqual(kept, c.expect.decisions);
    });
  }
});

describe("a reply with new wording revises a decision's draft (#900 AC 4)", () => {
  /** A morning's thread posted, and the revision's dependencies over the same harness. */
  async function revisable(replies: string[] = []) {
    const { h, client } = await nightHarness({ replies: [REPLY, ...replies] });
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    await morning(h);
    h.clock.now = at(30, 15);
    const parent = parentOf(h);
    const fc = h.deps.figmaComments!;
    const deps: ReviseDeps = {
      thread: { read: () => fc.threads!.read(parent.ts), write: (t) => fc.threads!.write(t) },
      async card(ts) {
        const found = await h.threadState.getProposalByTs(ts);
        return found.state === "found" ? found.proposal : null;
      },
      page: (url) => h.deps.sources.read(url, "notion"),
      detector: modelDecisionDetector(h.provider),
      post: (m) => fc.slack!.post(m),
      edit: (ts, m) => fc.slack!.edit(ts, m),
      reports: h.threadState,
      stage: (p) => fc.slack!.stage(p),
      async restore(p) {
        await h.threadState.putProposal(p);
      },
      async retire(ts) {
        await h.threadState.retireProposal(ts);
      },
      clearRevising: (ts) => h.threadState.clearRevising(ts),
      superseded: async () => {},
      now: () => h.clock.now,
    };
    const reply = (text: string, user = "U0MERYEM", mentionsBot = false) =>
      reviseDecision(deps, { channel: DESIGN, threadTs: parent.ts, user, text, mentionsBot });
    return { h, client, parent, deps, reply };
  }
  const cardReply = (value: string) =>
    JSON.stringify({ decisions: [{ thread_id: "c3", route: "card", decision: `The card moves to ${value}.`, card: 2482, field: "Design Status", value, confidence: 0.9 }] });

  it("restages decision 2 in its own slot with the new wording, the same people and the time left", async () => {
    const { h, parent, reply } = await revisable([cardReply("Ready for Dev")]);
    const before = h.figma.threads.get(parent.ts)!.decisions[1]!;
    assert.equal(await reply("2: Move it to Ready for Dev instead"), true);

    const prompt = String((h.provider.generated.at(-1) as { prompt?: string }).prompt);
    assert.match(prompt, /^REWORDING: a teammate rewrote thread c3's decision as: "Move it to Ready for Dev instead"$/m);
    const revised = h.staged.at(-1)!;
    assert.equal(revised.supersedeKey, before.proposalKey.replace(/^(.*)#c3$/, "report-item:$1:c3"), "the slot its card had");
    assert.deepEqual(revised.operations, [{ toolName: "notion_update", input: { page_url: CARD_URL, properties: { "Design Status": "Ready for Dev" } } }]);
    assert.deepEqual(revised.confirmers, ["U0MERYEM", "U0SARAH"]);
    assert.equal(revised.ttlMs, at(31, 13) - at(30, 15), "the Thursday 09:00 ET deadline the thread started with, less the two hours since");
    // The revised card replaces the old one in place, under the same number:
    // no new message.
    assert.equal(h.figma.messages.filter((m) => m.threadTs === parent.ts).length, 0);
    const shown = (parent.editedBlocks as Array<{ elements?: Card[] }>)[1]!.elements!;
    assert.equal(shown.length, 4);
    assert.equal(shown[1]!.title.text, "2 · States are all in, moving this card to Under Review");
    assert.equal(shown[1]!.body.text, "Card 2482 › Design Status: WIP → Ready for Dev");
    assert.equal(shown[1]!.actions[0]!.value, "c3~1", "a new proposal behind it");
    assert.match(revised.proposalText, /• \*Card 2482 › Design Status:\* WIP → Ready for Dev · </);
    // The old card is out of reach, and the thread's record names the new one.
    assert.notEqual((await h.threadState.getProposalByTs(before.proposalKey)).state, "found");
    assert.equal(h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey, `${parent.ts}#c3~1`);
    // The other decisions are untouched.
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 4);
  });

  it("drafts a PRD decision again against the page as it reads now", async () => {
    const reworded = JSON.stringify({
      decisions: [
        {
          thread_id: "c1",
          route: "prd",
          decision: "The bar waits for a saved goal.",
          section_block_id: "h-goal",
          text: "The progress bar stays hidden until a goal is saved.",
          confidence: 0.9,
        },
      ],
    });
    const { h, reply } = await revisable([reworded]);
    const reads = h.sourceReads.filter((u) => u === PRD_URL).length;
    assert.equal(await reply("1. Hide the bar until a goal is saved"), true);
    assert.equal(h.sourceReads.filter((u) => u === PRD_URL).length, reads + 1, "the PRD was read again");
    assert.deepEqual((h.staged.at(-1)!.operations![0]!.input as { insert: unknown[] }).insert, [
      { after_block_id: "b-goal-2", last_edited_time: "2026-09-02T10:00:00.000Z", content: "The progress bar stays hidden until a goal is saved." },
    ]);
    assert.match(h.staged.at(-1)!.proposalText, /^> The progress bar stays hidden until a goal is saved\.$/m);
  });

  it("asks which one when a reword names no number and several are open, and rewords the only one left without", async () => {
    const { h, parent, reply } = await revisable([cardReply("Ready for Dev")]);
    assert.equal(await reply("reword: Move it to Ready for Dev instead"), true);
    assert.equal(
      h.figma.messages.at(-1)!.text,
      "Which one? Press Review on that decision's card and choose Needs changes, or start the reply with its number, like `1: …`.",
    );
    for (const d of h.figma.threads.get(parent.ts)!.decisions.filter((x) => x.n !== 2)) await h.threadState.retireProposal(d.proposalKey);
    assert.equal(await reply("Reword to: Move it to Ready for Dev instead"), true);
    assert.equal(h.staged.at(-1)!.supersedeKey, `report-item:${parent.ts}:c3`);
  });

  it("leaves the thread's talk alone: chat, questions for uno-bot, numbers in passing, thank-yous", async () => {
    const { h, parent, reply } = await revisable();
    const posted = h.figma.messages.length;
    const staged = h.staged.length;
    for (const text of [
      "Looks good to me",
      "Move it to Ready for Dev instead",
      "1.5px feels tight",
      "2024 was a good year",
      "thanks!",
      "✅",
      "1: ✅",
      "We need 2 more states here before this ships",
    ]) {
      assert.equal(await reply(text), false, text);
    }
    assert.equal(await reply("<@U0UNOBOT> what does the PRD say?", "U0MERYEM", true), false);
    assert.equal(await reply("<@U0UNOBOT> 2: Ready for Dev", "U0MERYEM", true), false, "a mention is the turn's, whatever it starts with");
    assert.equal(h.figma.messages.length, posted, "nothing said");
    assert.equal(h.staged.length, staged, "nothing restaged");
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 4, "every card still live");
    assert.equal(h.figma.threads.get(parent.ts)!.decisions.length, 4);
  });

  it("takes Review's Needs changes as the new wording for the card it was pressed on", async () => {
    const { h, parent, reply } = await revisable([cardReply("Ready for Dev")]);
    const card = h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey;
    assert.equal(await h.threadState.markRevising(card, "U0SARAH"), "marked");
    assert.equal(await reply(`${NEEDS_CHANGES_LEAD}Move it to Ready for Dev instead`, "U0SARAH"), true);
    const prompt = String((h.provider.generated.at(-1) as { prompt?: string }).prompt);
    assert.match(prompt, /^REWORDING: a teammate rewrote thread c3's decision as: "Move it to Ready for Dev instead"$/m);
    assert.equal(h.staged.at(-1)!.supersedeKey, `report-item:${parent.ts}:c3`);
    assert.notEqual((await h.threadState.getProposalByTs(card)).state, "found", "the card sent back is replaced");
    assert.equal((parent.editedBlocks as Array<{ elements?: Card[] }>)[1]!.elements![1]!.title.text.startsWith("2 · "), true);
  });

  it("revises on its own path after Review's Needs changes, with a turn answering beside it reopening nothing", async () => {
    const { h, parent, reply } = await revisable([cardReply("Ready for Dev")]);
    const card = h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey;
    assert.equal(await h.threadState.markRevising(card, "U0SARAH"), "marked");

    // A turn on the same card that answers rather than redrafting, as the
    // general path would run one — wired to reopen report items.
    const t = turnHarness({ threadState: h.threadState, now: () => h.clock.now, replies: [{ text: "Its own thread is rewording that one." }] });
    const redrawn: string[] = [];
    t.deps.reportItems = reportItems(h.threadState, async (ts) => void redrawn.push(ts), () => h.clock.now);
    const pending = await cardSentBack(h.threadState, card);
    const outcome = await runTurn(
      turnRequest({ userId: "U0SARAH", channel: DESIGN, conversationTs: parent.ts, replyTs: parent.ts, text: `${NEEDS_CHANGES_LEAD}Move it to Ready for Dev instead`, pending }),
      t.deps,
    );
    assert.equal(outcome.disposition, "answered");
    assert.deepEqual(redrawn, [], "the card is not reopened");
    const held = await h.threadState.getProposalByTs(card);
    assert.equal(held.state === "found" && held.proposal.revising?.userId, "U0SARAH", "its lock is its own revision's");

    // Its own revision still runs, and replaces the card in place.
    assert.equal(await reply(`${NEEDS_CHANGES_LEAD}Move it to Ready for Dev instead`, "U0SARAH"), true);
    assert.equal(h.staged.at(-1)!.supersedeKey, `report-item:${parent.ts}:c3`);
    assert.notEqual((await h.threadState.getProposalByTs(card)).state, "found", "the card sent back is replaced");
    assert.equal((parent.editedBlocks as Array<{ elements?: Card[] }>)[1]!.elements![1]!.actions[0]!.value, "c3~1");
  });

  it("lifts the Needs changes lock when the new wording cannot be drafted", async () => {
    const { h, parent, reply } = await revisable(['{"decisions":[]}']);
    const card = h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey;
    await h.threadState.markRevising(card, "U0SARAH");
    assert.equal(await reply(`${NEEDS_CHANGES_LEAD}something nobody can place`, "U0SARAH"), true);
    assert.equal(h.figma.messages.at(-1)!.text, "I couldn't draft decision 2 with that wording, so its card stays as it is.");
    const found = await h.threadState.getProposalByTs(card);
    assert.equal(found.state === "found" && found.proposal.revising, undefined, "decidable again");
  });

  it("stops at a budget stop while staging the revision, rather than reporting it as a failure", async () => {
    const { h, reply } = await revisable([cardReply("Ready for Dev")]);
    h.faults.stage = new SubrequestBudgetError(38);
    await assert.rejects(reply("2: Move it to Ready for Dev instead"), SubrequestBudgetError);
  });

  it("refuses someone who may not decide, a number not in the thread, and a card already closed", async () => {
    const { h, parent, reply } = await revisable();
    assert.equal(await reply("2: Ready for Dev", "U0OTHER"), true);
    assert.equal(
      h.figma.messages.at(-1)!.text,
      ":warning: <@U0OTHER> Only <@U0MERYEM> or <@U0SARAH> can change this proposal, so it stays as it is — ask one of them if it needs a change.",
    );
    assert.equal(await reply("9: anything at all"), true);
    assert.equal(h.figma.messages.at(-1)!.text, "There's no decision 9 in this thread.");
    await h.threadState.retireProposal(h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey);
    assert.equal(await reply("2: Ready for Dev"), true);
    assert.equal(h.figma.messages.at(-1)!.text, "Decision 2's card has already been decided or has closed, so there's nothing to change.");
  });

  it("keeps the card as it is when the wording cannot be drafted, or the revision does not stage", async () => {
    const { h, parent, reply } = await revisable(['{"decisions":[]}', cardReply("Ready for Dev")]);
    const old = h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey;
    assert.equal(await reply("2: something the detector cannot place"), true);
    assert.equal(h.figma.messages.at(-1)!.text, "I couldn't draft decision 2 with that wording, so its card stays as it is.");
    assert.equal((await h.threadState.getProposalByTs(old)).state, "found");

    h.faults.stage = new Error("ThreadState unavailable");
    assert.equal(await reply("2: Move it to Ready for Dev instead"), true);
    assert.equal(h.figma.messages.at(-1)!.text, "That revised card didn't go through, so decision 2's card before it still stands. Try again from its Review button.");
    assert.equal((await h.threadState.getProposalByTs(old)).state, "found", "the old card is back in place");
    assert.equal(h.figma.threads.get(parent.ts)!.decisions[1]!.proposalKey, old);
  });

  it("reads a reword only on an explicit cue: a number first, or a reword verb", () => {
    assert.deepEqual(numberedReply("2: Ready for Dev"), { n: 2, wording: "Ready for Dev" });
    assert.deepEqual(numberedReply("3) keep it hidden"), { n: 3, wording: "keep it hidden" });
    assert.deepEqual(numberedReply("1. shorter copy"), { n: 1, wording: "shorter copy" });
    assert.deepEqual(numberedReply("#2 Ready for Dev"), { n: 2, wording: "Ready for Dev" });
    assert.equal(numberedReply("1.5px feels tight"), null);
    assert.equal(numberedReply("2 - 3 days seems right"), null);
    assert.equal(numberedReply("2024 was a good year"), null);
    assert.deepEqual(rewordCue("reword 2: Ready for Dev"), { n: 2, wording: "Ready for Dev" });
    assert.deepEqual(rewordCue("Rephrase to keep it hidden"), { n: null, wording: "keep it hidden" });
    assert.equal(rewordCue("Keep it hidden please"), null);
    assert.equal(rewordCue("Looks good to me"), null);
  });

  it("queues a reply in a decision thread for its own handler, and leaves one elsewhere alone", async () => {
    const record = { channel: DESIGN, ts: "1790700000.000100", fileKey: FILE, title: "x", confirmers: [], expiresAt: 0, decisions: [] };
    const kv = { get: async (key: string) => (key === `figma-decisions:thread:${record.ts}` ? record : null), put: async () => {} };
    const env = { PLUS_DESIGN_CHANNEL_ID: DESIGN, HARNESS_KV: kv } as unknown as Env;
    const event = { type: "message", channel: DESIGN, thread_ts: record.ts, ts: "1790700100.000100", user: "U0MERYEM", text: "2: Ready for Dev" } as SlackMessageEvent;
    assert.equal(isFigmaDecisionCandidate(env, event), true);
    assert.equal(await isFigmaDecisionThread(env, DESIGN, record.ts), true);
    assert.equal(await replyHandlerAt(env, event), "figma-decisions");
    assert.equal(await replyHandlerAt(env, { ...event, thread_ts: "1790700000.000999" }), null, "another #plus-design thread");
    assert.equal(isFigmaDecisionCandidate(env, { ...event, bot_id: "B1" }), false, "never a bot's own post");
    assert.equal(isFigmaDecisionCandidate(env, { ...event, channel: "C0ELSE" }), false);
  });
});

describe("a key decision gets a Decisions DB row tagged with its card", () => {
  const SARAH_N = "11111111111111111111111111111111";
  const MERYEM_N = "22222222222222222222222222222222";
  const PEOPLE = { figma: { "u-sarah": "U0SARAH", "u-meryem": "U0MERYEM" }, notion: { [SARAH_N]: "U0SARAH", [MERYEM_N]: "U0MERYEM" } };
  const ROW = { id: "row1", url: "https://www.notion.so/row1", name: "Progress bar visibility", status: "Accepted", signOff: [MERYEM_N] };
  const C1_URL = "https://www.figma.com/design/GoalFile1?node-id=4-1#c1";
  const DECISION = "The progress bar stays hidden until the first goal is set.";

  /** c1 — sarah's resolved comment, meryem's "Agreed" — as a key decision with this row. */
  const keyReply = (row: Record<string, unknown>) =>
    JSON.stringify({
      decisions: [{ thread_id: "c1", route: "prd", decision: DECISION, section_block_id: "h-goal", text: DECISION, confidence: 0.9, row }],
    });

  async function night(row: Record<string, unknown>, rows: (typeof ROW)[] = []) {
    const { h } = await nightHarness({ replies: [keyReply(row)], decisionRows: { [CARD_URL]: rows }, people: PEOPLE });
    await runSweepJob(NIGHT, h.deps);
    return { h, decision: h.figma.queue.get(FILE)?.decisions[0] };
  }

  it("shows the detector the card's rows, and drafts a new one with Owner the proposer, Sign-off the approver and the comment as Evidence", async () => {
    const { h, decision } = await night({ name: "Progress bar visibility", stage: "Accepted", proposer: "sarah", approvers: ["meryem"], relation: "new" });
    assert.match(String((h.provider.generated[0] as { prompt?: string }).prompt), /DECISIONS DB — Card 2482: none yet/);
    assert.deepEqual(decision?.row?.operations, [
      {
        toolName: "notion_create",
        input: {
          surface: "decision",
          title: "Progress bar visibility",
          properties: { roadmap_card: CARD_URL, status: "Accepted", evidence: C1_URL, owner: [SARAH_N], sign_off: [MERYEM_N] },
          sections: [
            { heading: "Decision", body: DECISION },
            { heading: "Source / Evidence", body: C1_URL },
          ],
        },
      },
    ]);
  });

  it("widens the row a decision belongs to rather than adding one, keeping its Owner and Evidence", async () => {
    const { h, decision } = await night(
      { name: "Progress bar visibility and animation", stage: "Accepted", proposer: "sarah", approvers: ["meryem"], relation: "widen", row_id: "row1" },
      [ROW],
    );
    assert.match(String((h.provider.generated[0] as { prompt?: string }).prompt), /\[row row1\] Progress bar visibility · Accepted/);
    assert.deepEqual(decision?.row?.operations, [
      {
        toolName: "notion_update",
        input: {
          page_url: ROW.url,
          properties: { Name: "Progress bar visibility and animation" },
          append: { text: `Widened 2026-09-30: ${DECISION} Evidence: ${C1_URL}` },
        },
      },
    ]);
  });

  it("supersedes an older row: marks it Superseded, and the new row links it", async () => {
    const { decision } = await night(
      { name: "Progress bar shows from the first goal", stage: "Accepted", proposer: "sarah", approvers: ["meryem"], relation: "supersede", row_id: "row1" },
      [ROW],
    );
    const [create, mark] = decision!.row!.operations;
    assert.equal(create!.toolName, "notion_create");
    assert.deepEqual((create!.input as { sections: unknown[] }).sections.at(-1), { heading: "Supersedes", body: ROW.url });
    assert.deepEqual(mark, {
      toolName: "notion_update",
      input: { page_url: ROW.url, properties: { Status: "Superseded" }, append: { text: `Superseded 2026-09-30 by: ${DECISION} Evidence: ${C1_URL}` } },
    });
  });

  it("adds no row for a decision the card already records", async () => {
    const same = await night({ name: "Progress bar visibility", stage: "Accepted", proposer: "sarah", approvers: ["meryem"], relation: "same", row_id: "row1" }, [ROW]);
    assert.equal(same.decision?.row, undefined);
    const renamed = await night({ name: "progress bar visibility", stage: "Accepted", proposer: "sarah", approvers: [], relation: "new" }, [ROW]);
    assert.equal(renamed.decision?.row, undefined, "a new row named as an existing one is that row");
  });

  it("signs off only someone the thread shows approving, never on a proposal, and owns only a mapped proposer", async () => {
    const outsider = await night({ name: "Progress bar visibility", stage: "Accepted", proposer: "sarah", approvers: ["bill", "sarah"], relation: "new" });
    const props = (op: { input: unknown } | undefined) => (op?.input as { properties: Record<string, unknown> }).properties;
    assert.equal(props(outsider.decision?.row?.operations[0]).sign_off, undefined, "nobody in the thread approved it but its proposer");
    const proposed = await night({ name: "Progress bar visibility", stage: "Proposed", proposer: "sarah", approvers: ["meryem"], relation: "new" });
    assert.equal(props(proposed.decision?.row?.operations[0]).status, "Proposed");
    assert.equal(props(proposed.decision?.row?.operations[0]).sign_off, undefined, "a proposal has no sign-off yet");
    const stranger = await night({ name: "Progress bar visibility", stage: "Accepted", proposer: "nobody", approvers: [], relation: "new" });
    assert.equal(stranger.decision?.row, undefined, "a proposer the thread never shows is a guess");
  });

  it("puts the row on the decision's own card, decided by the same Review", async () => {
    const { h } = await night({ name: "Progress bar visibility", stage: "Accepted", proposer: "sarah", approvers: ["meryem"], relation: "new" });
    h.clock.now = at(30, 13);
    await morning(h);
    assert.equal(h.staged.length, 1, "one card per decision");
    assert.deepEqual(
      h.staged[0]!.operations?.map((o) => o.toolName),
      ["notion_update", "notion_create"],
    );
    assert.match(h.staged[0]!.proposalText, /Decisions DB: new row "Progress bar visibility" · Accepted/);
    const card = (parentOf(h).blocks as Card[])[1]!;
    assert.match(card.body.text, /Decisions DB: new row "Progress bar visibility" · Accepted/);
  });
});
