// Capture beyond a thread's linked page: decisions in running notes and on
// Roadmap cards (C4), an answer given only in chat (C3), and a page a thread
// names without linking, found by search.
//
// Whole sweep days in memory, as tests/sweep-run.test.ts runs them: in-memory
// Notion readers, recorded detector replies through the real detectors, the
// in-memory store and the real card renderer.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob, type SweepSource } from "../src/sweep/index";
import { FOUND_BY_SEARCH } from "../src/sweep/capture-lines";
import { recordSweepResolution } from "../src/sweep/outcomes";
import { isTeamNote, type EditedRecordRow } from "../src/sweep/records";
import { isTeamSurface } from "../src/sweep/surfaces";
import { operationKinds } from "../src/slack/proposal-render";
import {
  at,
  DESIGN,
  drift,
  msg,
  NOTES_DB,
  notionPage,
  reply,
  ROADMAP_DB,
  sweepHarness,
  ts,
  UNIVERSAL,
  type FakeChannel,
} from "./helpers/sweep-harness";

const NOTES: ScheduledJob = { key: "sweep:notes", kind: "sweep-notes" };
const CARDS: ScheduledJob = { key: "sweep:cards", kind: "sweep-cards" };
const END_OF_DAY: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const MORNING: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };

const OLD = "2026-09-01T10:00:00.000Z";
const TONIGHT = "2026-09-29T20:00:00.000Z";

const PRD = notionPage("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", { title: "Reflection PRD", contributors: ["Ade Okafor"] });
const NOTE_ID = "cccccccccccccccccccccccccccccccc";
const NOTE_URL = `https://www.notion.so/${NOTE_ID}`;

function notePage(blocks: SweepSource["blocks"]): SweepSource {
  return notionPage(NOTE_ID, { title: "Design sync", blocks, pillars: [], contributors: [] });
}

function noteRow(over: Partial<EditedRecordRow> = {}): EditedRecordRow {
  return {
    id: NOTE_ID,
    url: NOTE_URL,
    title: "Design sync 2026-09-29",
    lastEditedTime: TONIGHT,
    parentDatabaseId: NOTES_DB,
    properties: {},
    people: { "Note Takers": ["Bea Note"] },
    ...over,
  };
}

function recordReply(o: { source: SweepSource; block: string; evidence: string[]; replacement?: string }): string {
  return JSON.stringify({
    findings: [
      {
        source_url: o.source.url,
        block_id: o.block,
        source_says: "Launch is October 15.",
        record_says: "Launch moved to November 1.",
        replacement: o.replacement ?? "Launch date: November 1",
        evidence_ids: o.evidence,
        confidence: 0.9,
      },
    ],
  });
}

const PEOPLE = { "Ade Okafor": "U0ADE", "Bea Note": "U0BEA", "Cy Contributor": "U0CY" };
const quiet: Record<string, FakeChannel> = {};

test("a note's decision that contradicts a PRD becomes one card in #plus-design, citing the note block", async () => {
  const note = notePage([
    { id: "n-old", lastEditedTime: OLD, text: "Kickoff notes from last month." },
    { id: "n-dec", lastEditedTime: TONIGHT, text: "Decided: reflection launch moves to Nov 1.", links: [PRD.url] },
  ]);
  const h = sweepHarness({
    channels: quiet,
    sources: [PRD, note],
    capture: true,
    notion: { notes: [noteRow()] },
    people: PEOPLE,
    detectorReplies: [recordReply({ source: PRD, block: PRD.blocks[0]!.id, evidence: ["n-dec"] })],
    now: at(29, 22),
  });

  const night = await runSweepJob(NOTES, h.deps);
  assert.equal(night.findings.length, 1);
  assert.equal(h.posted.length, 0, "the end of day posts nothing");
  const prompt = String((h.provider.generated[0] as { prompt: string }).prompt);
  assert.match(prompt, /n-dec · Decided/);
  assert.doesNotMatch(prompt, /Kickoff notes/, "only what changed since the cursor is the record");

  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.equal(h.posted.length, 1);
  const [card] = h.posted;
  assert.equal(card!.channel, DESIGN, "no thread, not the design system: #plus-design");
  assert.equal(card!.threadTs, null);
  assert.match(card!.text, /<@U0ADE>/, "the PRD card's Contributor is the owner");
  assert.ok(card!.text.includes(`${NOTE_URL}#ndec`), "the card cites the note block");
  assert.match(card!.text, /note says/);
  const [staged] = h.staged;
  assert.deepEqual((staged!.operations![0]!.input.replace as unknown[])[0], {
    block_id: PRD.blocks[0]!.id,
    last_edited_time: PRD.blocks[0]!.lastEditedTime,
    content: "Launch date: November 1",
  });
  assert.deepEqual(staged!.confirmers, ["U0ADE", "U0BEA"], "the owner and the note takers");
  assert.equal(await h.store.cursor("notion:running-notes"), `${TONIGHT}|${NOTE_ID}`);
});

test("a Universal-pillar card's comment contradicting its PRD lands in #plus-universal", async () => {
  const CARD_ID = "dddddddddddddddddddddddddddddddd";
  const card = notionPage(CARD_ID, {
    title: "Button refresh",
    pillars: ["Universal"],
    contributors: ["Cy Contributor"],
    blocks: [{ id: "c-spec", lastEditedTime: OLD, text: "Buttons use the primary style." }],
  });
  const h = sweepHarness({
    channels: quiet,
    sources: [card],
    capture: true,
    notion: {
      cards: [
        {
          id: CARD_ID,
          url: card.url,
          title: card.title,
          lastEditedTime: TONIGHT,
          parentDatabaseId: ROADMAP_DB,
          properties: { "Product Pillar": "Universal" },
          people: { Contributor: ["Cy Contributor"] },
        },
      ],
      comments: {
        [CARD_ID]: [
          { id: "cm-1", createdTime: TONIGHT, text: "Decided in crit: secondary style for buttons.", links: [], byBot: false },
          { id: "cm-0", createdTime: OLD, text: "An old thought.", links: [], byBot: false },
          { id: "cm-2", createdTime: TONIGHT, text: "uno-bot's own note.", links: [], byBot: true },
        ],
      },
    },
    people: PEOPLE,
    detectorReplies: [
      recordReply({ source: card, block: "c-spec", evidence: ["comment:cm-1"], replacement: "Buttons use the secondary style." }),
    ],
    now: at(29, 22),
  });

  await runSweepJob(CARDS, h.deps);
  const prompt = String((h.provider.generated[0] as { prompt: string }).prompt);
  assert.match(prompt, /comment:cm-1 · Decided in crit/);
  assert.doesNotMatch(prompt, /An old thought|uno-bot's own note/);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.equal(h.posted.length, 1);
  assert.equal(h.posted[0]!.channel, UNIVERSAL);
  assert.match(h.posted[0]!.text, /<@U0CY>/);
  assert.match(h.posted[0]!.text, /card says/);
});

test("a thread's answer no page holds becomes a card in that thread naming the page, the section and the text", async () => {
  const training = notionPage("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", {
    title: "Tutor Training PRD",
    blocks: [
      { id: "h-setup", lastEditedTime: OLD, text: "Session setup", type: "heading_2" },
      { id: "b-setup-1", lastEditedTime: OLD, text: "Each session opens with a check-in." },
      { id: "h-pay", lastEditedTime: OLD, text: "Payments", type: "heading_2" },
      { id: "b-pay-1", lastEditedTime: OLD, text: "Tutors are paid per session." },
    ],
  });
  const root = msg("U0ASK", ts(29, 15), "What's the tutor to student ratio for training sessions?", {
    reply_count: 1,
    latest_reply: ts(29, 16),
  });
  const answer = msg("U0ANS", ts(29, 16), "1 tutor to 4–5 students, we settled it last week.", { thread_ts: root.ts });
  const h = sweepHarness({
    channels: { [DESIGN]: { kind: "public", history: [root], threads: { [root.ts]: [root, answer] } } },
    sources: [training],
    capture: true,
    search: {
      "tutor student ratio training session": [
        { url: training.url, title: training.title, kind: "notion", parentDatabaseId: null, parentType: "workspace" },
      ],
    },
    detectorReplies: [
      JSON.stringify({
        answers: [
          {
            question_ts: root.ts,
            answer_ts: [answer.ts],
            answered_by: "U0ANS",
            documented: false,
            source_url: training.url,
            section_block_id: "h-setup",
            new_section: null,
            text: "Ratio is 1 tutor to 4–5 students.",
            confidence: 0.9,
          },
        ],
      }),
    ],
    now: at(29, 22),
  });

  await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(h.provider.generated.length, 1, "no page was pointed at, so only the answer is asked about");
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.equal(h.posted.length, 1);
  const [card] = h.posted;
  assert.equal(card!.channel, DESIGN);
  assert.equal(card!.threadTs, root.ts, "in the source thread");
  assert.match(card!.text, /<@U0ANS>/, "mentions whoever answered");
  assert.doesNotMatch(card!.text, /<@U0ASK>/);
  assert.match(card!.text, /add under .*Tutor Training PRD.* › \*Session setup\*/);
  assert.match(card!.text, /Ratio is 1 tutor to 4–5 students\./);
  assert.ok(card!.text.includes(FOUND_BY_SEARCH), "a page found by search says so");
  const op = h.staged[0]!.operations![0]!;
  assert.equal(op.toolName, "notion_update", "a proposal card that writes the text — never an intake");
  assert.deepEqual(op.input.insert, [
    { after_block_id: "b-setup-1", last_edited_time: OLD, content: "Ratio is 1 tutor to 4–5 students." },
  ]);
  assert.deepEqual(h.staged[0]!.confirmers, ["U0ANS", "U0ASK"], "the owner and everyone who posted");

  // ✅ ran it: the added answer's item is confirmed, found by the block it follows.
  const updated = await recordSweepResolution(
    h.store,
    h.staged[0]!,
    [{ toolName: op.toolName, input: op.input, ok: true, result: "{\"ok\":true}" } as never],
    at(30, 15),
  );
  assert.equal(updated, 1);
  assert.deepEqual(h.store.items().map((i) => [i.blockId, i.status]), [["b-setup-1", "confirmed"]]);
});

test("an added answer's plan line is text, and a new section shows its heading and its line", () => {
  const kinds = operationKinds({
    toolName: "notion_update",
    input: {
      page_url: "https://www.notion.so/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      insert: [{ after_block_id: "b", last_edited_time: OLD, content: "## Access <!channel>\nEvery video has *captions* <@U0X>." }],
    },
  });
  const [detail] = kinds.find((k) => k.label === "add after a block")!.details;
  assert.ok(detail!.includes("Access"), "the heading");
  assert.ok(detail!.includes("Every video has"), "and the line under it");
  assert.doesNotMatch(detail!, /<!channel>|<@U0X>/, "escaped: pings nobody");
});

test("a note of discussion with no decision produces nothing", async () => {
  const note = notePage([
    { id: "n-1", lastEditedTime: TONIGHT, text: "Launch: Oct 15 vs Nov 1? Pros and cons.", links: [PRD.url] },
    { id: "n-2", lastEditedTime: TONIGHT, text: "AI: Ade to check eng capacity." },
  ]);
  const h = sweepHarness({
    channels: quiet,
    sources: [PRD, note],
    capture: true,
    notion: { notes: [noteRow()] },
    people: PEOPLE,
    detectorReplies: [JSON.stringify({ findings: [] })],
    now: at(29, 22),
  });

  const night = await runSweepJob(NOTES, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.equal(night.findings.length, 0);
  assert.deepEqual(h.posted, []);
  assert.deepEqual(h.staged, []);
});

test("private and 1:1 pages are never read as notes, and the cursor still moves past them", async () => {
  const rows = [
    noteRow({ id: "55555555555555555555555555555555", url: "https://www.notion.so/55555555555555555555555555555555", title: "Design sync", properties: { "Note Type": "Team, 1:1" }, lastEditedTime: "2026-09-29T17:00:00.000Z" }),
    noteRow({ id: "66666666666666666666666666666666", url: "https://www.notion.so/66666666666666666666666666666666", title: "<Qi / Bill> 1:1", lastEditedTime: "2026-09-29T17:30:00.000Z" }),
    noteRow({ id: "11111111111111111111111111111111", url: "https://www.notion.so/11111111111111111111111111111111", parentDatabaseId: null, lastEditedTime: "2026-09-29T18:00:00.000Z" }),
    noteRow({ id: "22222222222222222222222222222222", url: "https://www.notion.so/22222222222222222222222222222222", parentDatabaseId: "ffffffffffffffffffffffffffffffff", lastEditedTime: "2026-09-29T18:30:00.000Z" }),
    noteRow({ id: "33333333333333333333333333333333", url: "https://www.notion.so/33333333333333333333333333333333", title: "Ade / Bea 1:1", lastEditedTime: "2026-09-29T19:00:00.000Z" }),
    noteRow({ id: "44444444444444444444444444444444", url: "https://www.notion.so/44444444444444444444444444444444", properties: { Type: "1-on-1" }, lastEditedTime: TONIGHT }),
  ];
  const h = sweepHarness({ channels: quiet, capture: true, notion: { notes: rows }, now: at(29, 22) });

  const night = await runSweepJob(NOTES, h.deps);

  assert.deepEqual(h.sourceReads, [], "no page outside the team notes is opened");
  assert.equal(h.provider.generated.length, 0);
  assert.equal(night.threads, 0);
  assert.equal(await h.store.cursor("notion:running-notes"), `${TONIGHT}|44444444444444444444444444444444`);
  assert.equal(isTeamNote(noteRow({ properties: { "Note Type": "1:1" } }), NOTES_DB), false, "a tagged 1:1");
  assert.equal(isTeamNote(noteRow({ properties: { "Note Type": "Team" } }), NOTES_DB), true);
  assert.equal(isTeamNote(noteRow({ parentDatabaseId: "3ee43141-b0ce-4517-badc-cb52a7b97bdb".replace(/-/g, "") }), "3ee43141-b0ce-4517-badc-cb52a7b97bdb"), true);
});

test("a name nobody linked resolves above the floor, and the card says it was found by search", async () => {
  const booking = notionPage("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", { title: "Booking Flow PRD" });
  const root = msg("U0STARTER", ts(29, 15), "Launch moves to Nov 1 — can someone fix the booking flow PRD", {
    reply_count: 1,
    latest_reply: ts(29, 16),
  });
  const agreed = msg("U0ADE", ts(29, 16), "Agreed, Nov 1. I'll own it.", { thread_ts: root.ts });
  const channels = { [DESIGN]: { kind: "public" as const, history: [root], threads: { [root.ts]: [root, agreed] } } };
  const h = sweepHarness({
    channels,
    sources: [booking],
    search: { "booking flow PRD": [{ url: booking.url, title: booking.title, kind: "notion", parentDatabaseId: null, parentType: "workspace" }] },
    detectorReplies: [reply(drift({ source: booking, evidence: [agreed.ts], claimedBy: "U0ADE" }))],
    now: at(29, 22),
  });

  const night = await runSweepJob(END_OF_DAY, h.deps);
  assert.equal(night.findings[0]?.target.foundBy, "search");
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  assert.ok(h.posted[0]!.text.includes(FOUND_BY_SEARCH));
  assert.deepEqual(h.searches, ["notion booking flow PRD"]);
});

test("below the floor, a search keeps nothing: no page is read, no model is asked, no item is made", async () => {
  const root = msg("U0STARTER", ts(29, 15), "Launch moves to Nov 1 — can someone fix the booking flow PRD", {
    reply_count: 1,
    latest_reply: ts(29, 16),
  });
  const agreed = msg("U0ADE", ts(29, 16), "Agreed.", { thread_ts: root.ts });
  const h = sweepHarness({
    channels: { [DESIGN]: { kind: "public", history: [root], threads: { [root.ts]: [root, agreed] } } },
    search: {
      // One shared word ("booking") is not a match, however short the title.
      "booking flow PRD": [
        { url: "https://www.notion.so/99999999999999999999999999999999", title: "Booking", kind: "notion", parentDatabaseId: null, parentType: "workspace" },
      ],
    },
    now: at(29, 22),
  });

  const night = await runSweepJob(END_OF_DAY, h.deps);

  assert.equal(night.findings.length, 0);
  assert.deepEqual(h.sourceReads, []);
  assert.equal(h.provider.generated.length, 0);
  assert.deepEqual(h.searches, ["notion booking flow PRD", "github booking flow PRD"], "GitHub only once Notion had nothing");
});

/** A thread that names the reflection launch page without linking it. */
function namingThread(link?: string): Record<string, FakeChannel> {
  const root = msg("U0STARTER", ts(29, 15), `Launch moves to Nov 1 — fix the reflection launch page ${link ? `<${link}>` : ""}`, {
    reply_count: 1,
    latest_reply: ts(29, 16),
  });
  const agreed = msg("U0ADE", ts(29, 16), "Agreed, Nov 1.", { thread_ts: root.ts });
  return { [DESIGN]: { kind: "public", history: [root], threads: { [root.ts]: [root, agreed] } } };
}

test("a 1:1 note found by search is refused: never read, never quoted, nothing proposed", async () => {
  const oneOnOne = notionPage("77777777777777777777777777777777", {
    title: "Reflection launch 1:1",
    parentDatabaseId: NOTES_DB,
    properties: { "Note Type": "1:1" },
  });
  const h = sweepHarness({
    channels: namingThread(),
    sources: [oneOnOne],
    search: {
      "reflection launch page": [{ url: oneOnOne.url, title: oneOnOne.title, kind: "notion", parentDatabaseId: NOTES_DB }],
    },
    now: at(29, 22),
  });

  const night = await runSweepJob(END_OF_DAY, h.deps);

  assert.equal(night.findings.length, 0);
  assert.equal(h.searches[0], "notion reflection launch page", "the search ran and found it");
  assert.deepEqual(h.sourceReads, [], "the hit is dropped before it is read");
  assert.equal(h.provider.generated.length, 0);
});

test("a page off the team's surfaces found by search is refused; a Roadmap row is kept", async () => {
  const shared = notionPage("88888888888888888888888888888888", {
    title: "Reflection Launch",
    parentDatabaseId: "ffffffffffffffffffffffffffffffff",
  });
  const loose = notionPage("89898989898989898989898989898989", { title: "Reflection launch scratch" });
  const refused = sweepHarness({
    channels: namingThread(),
    sources: [shared, loose],
    search: {
      "reflection launch page": [
        { url: shared.url, title: shared.title, kind: "notion", parentDatabaseId: shared.parentDatabaseId },
        { url: loose.url, title: loose.title, kind: "notion", parentDatabaseId: null, parentType: "workspace" },
      ],
    },
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, refused.deps);
  assert.equal(refused.searches[0], "notion reflection launch page");
  assert.deepEqual(refused.sourceReads, [], "an unlisted database's row, and a loose page not titled as a spec");

  const card = notionPage("8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a", { title: "Reflection Launch", parentDatabaseId: ROADMAP_DB });
  const kept = sweepHarness({
    channels: namingThread(),
    sources: [card],
    search: { "reflection launch page": [{ url: card.url, title: card.title, kind: "notion", parentDatabaseId: ROADMAP_DB }] },
    detectorReplies: [JSON.stringify({ findings: [] })],
    now: at(29, 22),
  });
  await runSweepJob(END_OF_DAY, kept.deps);
  assert.deepEqual(kept.sourceReads, [card.url]);
});

test("a 1:1 note someone linked is refused after the read, before any model sees it", async () => {
  const oneOnOne = notionPage("7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a", {
    title: "<Qi / Bill> 1:1",
    parentDatabaseId: NOTES_DB,
    properties: { "Note Type": "1:1" },
  });
  const h = sweepHarness({ channels: namingThread(oneOnOne.url), sources: [oneOnOne], now: at(29, 22) });

  const night = await runSweepJob(END_OF_DAY, h.deps);

  assert.equal(night.findings.length, 0);
  assert.equal(h.provider.generated.length, 0, "nothing from the note reaches a detector, or a card");
});

test("forty notes edited in one minute are all read across two nights, none twice", async () => {
  const rows = Array.from({ length: 40 }, (_, i) => {
    const id = i.toString(16).padStart(32, "0");
    return noteRow({ id, url: `https://www.notion.so/${id}`, title: `Team sync ${i}` });
  });
  const h = sweepHarness({ channels: quiet, capture: true, notion: { notes: rows, pageSize: 25 }, now: at(29, 22) });

  const first = await runSweepJob(NOTES, h.deps);
  h.clock.now = at(30, 22);
  const second = await runSweepJob(NOTES, h.deps);
  h.clock.now = at(31, 22);
  const third = await runSweepJob(NOTES, h.deps);

  assert.deepEqual([first.threads, second.threads, third.threads], [25, 15, 0]);
  assert.equal(new Set(h.sourceReads).size, 40);
  assert.equal(h.sourceReads.length, 40, "no note read twice");
});

test("a job retried before its cursor was saved queues the same decision once, whichever block it picks", async () => {
  const note = notePage([{ id: "n-dec", lastEditedTime: TONIGHT, text: "Decided: launch moves to Nov 1.", links: [PRD.url] }]);
  const h = sweepHarness({
    channels: quiet,
    sources: [PRD, note],
    capture: true,
    notion: { notes: [noteRow()] },
    people: PEOPLE,
    detectorReplies: [
      recordReply({ source: PRD, block: PRD.blocks[0]!.id, evidence: ["n-dec"] }),
      recordReply({ source: PRD, block: PRD.blocks[1]!.id, evidence: ["n-dec"], replacement: "Owner: design team, launch Nov 1" }),
    ],
    now: at(29, 22),
  });

  await runSweepJob(NOTES, h.deps);
  // The stop landed between queueing and saving the cursor: the retry reads
  // the note again, and the model picks another block this time.
  await h.store.saveCursor("notion:running-notes", "2026-09-28T22:00:00.000Z", at(29, 22));
  await runSweepJob(NOTES, h.deps);

  const queued = await h.store.pendingFindings();
  assert.equal(queued.length, 1);
  assert.equal(queued[0]!.id, `notes:n-dec:${PRD.url.slice(-32)}`, "keyed by the decision's entry and the page");
});

test("Thursday's new decision on a card about the same page is its own item, after Monday's was carded — and a retry queues it once", async () => {
  const CARD_ID = "9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d9d";
  const card = notionPage(CARD_ID, {
    title: "Button refresh",
    contributors: ["Cy Contributor"],
    blocks: [{ id: "c-spec", lastEditedTime: OLD, text: "Buttons use the primary style." }],
  });
  const row: EditedRecordRow = {
    id: CARD_ID,
    url: card.url,
    title: card.title,
    lastEditedTime: "2026-09-28T20:00:00.000Z",
    parentDatabaseId: ROADMAP_DB,
    properties: {},
    people: { Contributor: ["Cy Contributor"] },
  };
  const comments = [{ id: "cm-1", createdTime: "2026-09-28T20:00:00.000Z", text: "Decided: secondary buttons.", links: [], byBot: false }];
  const decided = (evidence: string, replacement: string) =>
    recordReply({ source: card, block: "c-spec", evidence: [evidence], replacement });
  const h = sweepHarness({
    channels: quiet,
    sources: [card],
    capture: true,
    notion: { cards: [row], comments: { [CARD_ID]: comments } },
    people: PEOPLE,
    detectorReplies: [
      decided("comment:cm-1", "Buttons use the secondary style."),
      decided("comment:cm-2", "Buttons use the tertiary style."),
      decided("comment:cm-2", "Buttons use the tertiary style."),
    ],
    now: at(28, 22),
  });

  // Monday: decided, and carded the next morning.
  await runSweepJob(CARDS, h.deps);
  h.clock.now = at(29, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);
  // ✅ ran it on Tuesday.
  const monday = h.staged[0]!;
  const op = monday.operations![0]!;
  await recordSweepResolution(h.store, monday, [{ toolName: op.toolName, input: op.input, ok: true, result: "{\"ok\":true}" } as never], at(29, 15));
  await h.threadState.retireProposal(monday.proposalTs);

  // Thursday: a new comment on the same card changes the same page again.
  comments.push({ id: "cm-2", createdTime: "2026-10-01T18:00:00.000Z", text: "Decided in crit: tertiary after all.", links: [], byBot: false });
  row.lastEditedTime = "2026-10-01T18:00:00.000Z";
  h.clock.now = at(31, 22);
  await runSweepJob(CARDS, h.deps);
  // A stop landed before the cursor was saved: the retry reads it again.
  await h.store.saveCursor("notion:roadmap-cards", "2026-09-30T00:00:00.000Z", at(31, 22));
  await runSweepJob(CARDS, h.deps);

  const queued = await h.store.pendingFindings();
  assert.deepEqual(queued.map((f) => f.id), [`cards:comment:cm-2:${CARD_ID}`]);
  h.clock.now = at(32, 14);
  const friday = await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 2, `Thursday's decision is proposed (${friday.summary})`);
  assert.match(h.posted[1]!.text, /tertiary/);
});

test("eighty cards edited in one minute are all read across nights, and the job never stalls at the minute", async () => {
  const rows: EditedRecordRow[] = Array.from({ length: 80 }, (_, i) => {
    const id = `c${i.toString(16).padStart(31, "0")}`;
    return {
      id,
      url: `https://www.notion.so/${id}`,
      title: `Card ${i}`,
      lastEditedTime: TONIGHT,
      parentDatabaseId: ROADMAP_DB,
      properties: {},
      people: {},
    };
  });
  const h = sweepHarness({ channels: quiet, capture: true, notion: { cards: rows, pageSize: 25 }, now: at(29, 22) });

  const nights: number[] = [];
  for (let day = 29; day < 35; day++) {
    h.clock.now = at(day, 22);
    nights.push((await runSweepJob(CARDS, h.deps)).threads);
  }

  assert.deepEqual(nights, [25, 25, 25, 5, 0, 0]);
  assert.equal(new Set(h.sourceReads).size, 80);
  assert.equal(h.sourceReads.length, 80, "none read twice");
});

test("a searched page is a team surface only as a database row or a top-level spec, and never when its title reads as a 1:1", () => {
  const config = { runningNotesDb: NOTES_DB, teamSurfaceDbs: [ROADMAP_DB] };
  const hit = (title: string, parentType: string, parentDatabaseId: string | null = null) =>
    isTeamSurface({ kind: "notion", title, parentType, parentDatabaseId }, config);
  assert.equal(hit("Qi / Bill 1:1 – booking flow spec", "workspace"), false, "a 1:1 title, whatever it ends with");
  assert.equal(hit("Qi / Bill 1:1 – booking flow spec", "database_id", ROADMAP_DB), false, "even on a team database");
  assert.equal(hit("Booking flow PRD", "page_id"), false, "a child page — under a 1:1 note or anywhere else");
  assert.equal(hit("Booking flow PRD", "block_id"), false);
  assert.equal(hit("Booking flow PRD", "workspace"), true, "a top-level spec is kept");
  assert.equal(hit("Booking flow notes", "workspace"), false, "a top-level page that is no spec");
});

test("what one note costs: one edited-since read for the job, then the note, the page it links and one model call", async () => {
  const note = notePage([{ id: "n-dec", lastEditedTime: TONIGHT, text: "Decided: launch moves to Nov 1.", links: [PRD.url] }]);
  const h = sweepHarness({
    channels: quiet,
    sources: [PRD, note],
    capture: true,
    notion: { notes: [noteRow()] },
    people: PEOPLE,
    detectorReplies: [recordReply({ source: PRD, block: PRD.blocks[0]!.id, evidence: ["n-dec"] })],
    now: at(29, 22),
  });
  await runSweepJob(NOTES, h.deps);
  // A page read is a page GET and one blocks page (more for a long page): the
  // job's Notion and model spend is 1 + 2 × 2 + 1 = 6 subrequests here.
  assert.deepEqual(h.sourceReads, [NOTE_URL, PRD.url]);
  assert.equal(h.provider.generated.length, 1);
  assert.deepEqual(h.searches, []);
});
