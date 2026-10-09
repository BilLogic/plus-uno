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
import { SubrequestBudgetError } from "../src/net";
import { runSweepJob, type SweepSource } from "../src/sweep/index";
import type { ScheduledJob } from "../src/scheduled/runs";
import { isWithheldRepoPath } from "../src/integrations/repo-read-guard";
import { COMMENTS_CURSOR, etDatesOf, quoteOf, readCommentsCursor, writeCommentsCursor } from "../src/figma-comments/read";
import { DECISION_CARD_TTL_MS } from "../src/figma-comments/post";
import { candidateThreads, readable } from "../src/figma-comments/threads";
import { dividerSection, pageOf, pagesOf } from "../src/figma-comments/sections";
import { cardNumbersOf } from "../src/figma-comments/title";
import { modelDecisionDetector, type DecisionInput } from "../src/figma-comments/detector";
import { at, DESIGN, notionPage, ROADMAP_DB, sweepHarness } from "./helpers/sweep-harness";

const NIGHT: ScheduledJob = { key: "sweep:figma-comments", kind: "sweep-figma-comments" };
const MORNING: ScheduledJob = { key: "sweep:figma-post", kind: "sweep-figma-post" };

const FILE = "GoalFile1";
const CARD_ID = "24820000000000000000000000000001";
const PRD_ID = "24820000000000000000000000000002";
const CARD_URL = `https://www.notion.so/${CARD_ID}`;
const PRD_URL = `https://www.notion.so/${PRD_ID}`;
/** 2026-09-29 00:00 ET, the switch-on. */
const SWITCH_ON = at(29, 4);
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

/** A harness switched on at the watermark, its clock at the next midnight. */
async function nightHarness(over: { figma?: InMemoryFigma; replies?: string[]; notes?: typeof NOTES; members?: string[] | null; misc?: string } = {}) {
  const client = over.figma ?? seededFigma();
  const h = sweepHarness({
    channels: {},
    sources: [CARD, PRD],
    people: { Meryem: "U0MERYEM", "Sarah K": "U0SARAH" },
    detectorReplies: over.replies ?? [REPLY],
    now: at(30, 4),
    figma: {
      client,
      notes: over.notes ?? NOTES,
      cards: { 2482: { url: CARD_URL, title: "Goal Setting" } },
      ...(over.members !== undefined ? { members: over.members } : {}),
      ...(over.misc ? { miscTeamId: over.misc } : {}),
    },
  });
  await h.store.saveCursor(COMMENTS_CURSOR, SWITCHED, SWITCH_ON);
  return { h, client };
}

describe("the night's read of Figma comments (#900)", () => {
  it("switches on the first night: it reads nothing, and keeps the watermark (AC 1)", async () => {
    const client = seededFigma();
    const h = sweepHarness({ channels: {}, now: SWITCH_ON, figma: { client, notes: NOTES } });
    const report = await runSweepJob(NIGHT, h.deps);
    assert.equal(
      report.summary,
      "0 Figma file(s) read, 0 decision(s) kept for the morning — switched on: comments created or resolved after 2026-09-29T04:00:00.000Z are read, none before",
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
    assert.deepEqual(file.owner, { slack: "U0MERYEM" });
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
    assert.equal(await h.store.cursor(COMMENTS_CURSOR), `2026-09-29T04:00:00.000Z|2026-09-30T04:00:00.000Z||`, "the next night starts where this one ended");
  });

  it("asks the card's first Contributor who is a Slack person", async () => {
    const client = seededFigma();
    const h = sweepHarness({
      channels: {},
      sources: [{ ...CARD, contributors: ["Nobody Mapped", "Meryem"] }, PRD],
      people: { Meryem: "U0MERYEM" },
      detectorReplies: [REPLY],
      now: at(30, 4),
      figma: { client, notes: NOTES, cards: { 2482: { url: CARD_URL, title: "Goal Setting" } } },
    });
    await h.store.saveCursor(COMMENTS_CURSOR, SWITCHED, SWITCH_ON);
    await runSweepJob(NIGHT, h.deps);
    assert.deepEqual(h.figma.queue.get(FILE)?.owner, { slack: "U0MERYEM" });
    assert.deepEqual(h.figma.queue.get(FILE)?.confirmers, ["U0MERYEM"]);
  });

  it("reads nothing on a night whose notes name no file, and nothing twice for one day's activity", async () => {
    const { h, client } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(31, 4);
    const quiet = await runSweepJob(NIGHT, h.deps);
    assert.equal(quiet.summary, "0 Figma file(s) read, 0 decision(s) kept for the morning");
    assert.equal(h.provider.generated.length, 1);
    assert.equal(client.calls().filter((c) => c.method === "comments").length, 1, "no file was a candidate the second night");
    // A note that still names the file, with nothing new in the window, reads its comments and finds nothing to ask.
    h.clock.now = at(32, 4);
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
    const old = new Date(at(19, 4)).toISOString();
    await h.store.saveCursor(COMMENTS_CURSOR, `${old}|${old}||`, at(19, 4));
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
      now: at(30, 4),
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

describe("the morning's thread in #plus-design (#900)", () => {
  async function postedMorning() {
    const { h, client } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    const report = await runSweepJob(MORNING, h.deps);
    return { h, client, report };
  }

  it("opens one thread for the file, naming the file and the count and asking its owner once", async () => {
    const { h, report } = await postedMorning();
    assert.equal(report.summary, "posted 1 Figma decision thread(s), 4 card(s)");
    const [parent, ...replies] = h.figma.messages;
    assert.equal(parent!.threadTs, null);
    assert.equal(
      parent!.text,
      "*4 comments in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> read like decisions*\n<@U0MERYEM>, can you check the updates I've drafted below?",
    );
    assert.equal(replies.length, 4);
    assert.ok(replies.every((r) => r.threadTs === parent!.ts));
    assert.equal(
      replies[0]!.text,
      [
        '*1 · "Keep the progress bar hidden until the first goal is set"*',
        "sarah on the Specs page, resolved Sep 29 · <https://www.figma.com/design/GoalFile1?node-id=4-1#c1|see comment>",
        `• *PRD › Goal states:* add this rule · <${PRD_URL}|page>`,
        "> The progress bar stays hidden until the first goal is set.",
        "",
        ':white_check_mark: writes it · :no_entry: drops it · reply "1: …" to change the wording',
      ].join("\n"),
    );
    assert.match(replies[1]!.text, /^\*2 · "States are all in, moving this card to Under Review"\*\nmeryem on the Specs page, commented Sep 29 · /);
    assert.match(replies[1]!.text, /• \*Card 2482 › Design Status:\* WIP → Under Review · </);
    assert.match(replies[2]!.text, /• \*Intake:\* "Goal chips use the Badge pill variant"\n\n:white_check_mark: files the intake · :no_entry: drops it · reply "3: …" to change the wording$/);
  });

  it("stages each decision on its own, for the card's people, for 72 hours — and writes nothing (AC 3)", async () => {
    const { h, client } = await postedMorning();
    const parent = h.figma.messages[0]!;
    assert.equal(h.staged.length, 4);
    for (const [i, p] of h.staged.entries()) {
      const id = ["c1", "c3", "c4", "c9"][i]!;
      assert.equal(p.supersedeKey, `figma-decision:${id}`);
      assert.equal(p.threadTs, parent.ts);
      assert.deepEqual(p.confirmers, ["U0MERYEM", "U0SARAH"]);
      assert.equal(p.ttlMs, DECISION_CARD_TTL_MS);
      assert.equal(p.operations?.length, 1);
      assert.equal(p.stated?.cancelled, "Dropped, nothing written");
      assert.equal(p.refuseRevision, `To change decision ${i + 1}'s wording, reply with its number and the new wording, like \`${i + 1}: …\`.`);
    }
    // Every card is live at once, each in its own slot of the thread.
    assert.equal((await h.threadState.getProposalsByChannel(DESIGN)).length, 4);
    // Posting and staging wrote nothing anywhere: each write waits on its card's ✅.
    assert.deepEqual(client.writes(), []);
    assert.deepEqual([...h.figma.carded].sort(), ["c1", "c3", "c4", "c9"]);
    assert.equal(h.figma.queue.size, 0);
    assert.deepEqual(
      h.figma.threads.get(parent.ts)?.decisions.map((d) => [d.n, d.commentId]),
      [
        [1, "c1"],
        [2, "c3"],
        [3, "c4"],
        [4, "c9"],
      ],
    );
  });

  it("never cards a thread twice, whatever is said in it later", async () => {
    const { h, client } = await postedMorning();
    client.seedFile(FILE, {
      comments: [...COMMENTS, comment("c1s", { handle: "meryem", parent_id: "c1", created_at: "2026-09-30T15:00:00Z", message: "Done in v3" })],
    });
    h.clock.now = at(31, 4);
    (h.deps.figmaComments!.notes as { list(p: string): Promise<unknown[]> }).list = async (prefix: string) =>
      prefix.startsWith("figma-notify:commented:2026-09-30") ? [{ key: `figma-notify:commented:2026-09-30:${FILE}`, at: "2026-09-30T15:00:00Z" }] : [];
    await runSweepJob(NIGHT, h.deps);
    assert.equal(h.provider.generated.length, 1, "the carded thread's new reply asks the detector nothing");
  });

  it("asks a card-less file's creator by Figma handle, and #plus-design's members decide", async () => {
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
    assert.deepEqual(h.figma.queue.get("LibFile1")?.owner, { figma: "bea" });
    h.clock.now = at(30, 13);
    await runSweepJob(MORNING, h.deps);
    assert.equal(
      h.figma.messages[0]!.text,
      "*1 comment in <https://www.figma.com/design/LibFile1|Design System (S23)> reads like a decision*\nbea, can you check the update I've drafted below?",
    );
    assert.deepEqual(h.staged[0]!.confirmers, ["U0A", "U0B"]);
  });

  it("keeps a decision whose card did not stage for the next morning, and says so on the card", async () => {
    const { h } = await nightHarness();
    await runSweepJob(NIGHT, h.deps);
    h.clock.now = at(30, 13);
    h.faults.stage = new Error("ThreadState unavailable");
    const report = await runSweepJob(MORNING, h.deps);
    assert.match(report.summary, /1 decision\(s\) on GoalFile1 did not go through and wait for tomorrow$/);
    assert.equal(h.figma.messages[1]!.edited, "This decision didn't go through, so it's queued again for tomorrow morning.");
    assert.deepEqual(
      h.figma.queue.get(FILE)?.decisions.map((d) => d.commentId),
      ["c1"],
    );
  });
});

describe("what decides what the read sees", () => {
  it("reads a comment created after the watermark, or a root resolved after it, and nothing else", () => {
    const w = SWITCH_ON;
    assert.equal(readable({ created_at: "2026-09-29T05:00:00Z", resolved_at: null, parent_id: "" }, w), true);
    assert.equal(readable({ created_at: "2026-09-28T05:00:00Z", resolved_at: "2026-09-29T05:00:00Z", parent_id: "" }, w), true);
    assert.equal(readable({ created_at: "2026-09-28T05:00:00Z", resolved_at: "2026-09-29T05:00:00Z", parent_id: "c1" }, w), false);
    assert.equal(readable({ created_at: "2026-09-28T05:00:00Z", resolved_at: null, parent_id: "" }, w), false);
    const threads = candidateThreads(COMMENTS, { watermark: w, from: w, until: at(30, 4) });
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
    const c = { watermark: SWITCH_ON, from: SWITCH_ON, until: at(30, 4), done: ["A", "B"] };
    assert.deepEqual(readCommentsCursor(writeCommentsCursor(c)), c);
    assert.equal(readCommentsCursor(null), null);
    assert.deepEqual(etDatesOf(SWITCH_ON, at(30, 4)), ["2026-09-29", "2026-09-30"]);
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
