// A turn that speaks from an earlier answer says so.
//
// Every unthreaded line of a DM is one conversation (`DM_CONVERSATION`), so a
// new top-level ask arrives with the DM's earlier answers in its history. The
// model can answer from them with no lookup at all, and when it does, the
// reply must not claim a blueprint grounding this turn never stood on, and the
// places it carries over are named as a reader reads them: ` › `.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type TurnRequest } from "../src/turn/index";
import type { HistoryTurn } from "../src/thread-state/index";
import { harness, request } from "./helpers/turn-harness";

const EARLIER_DM: HistoryTurn[] = [
  { role: "user", content: "where do tutors struggle during a live session?", ts: "1700000000.000100" },
  {
    role: "assistant",
    content:
      "Two pain points stand out: Session › Live tutoring › Standard › Student goes quiet (Frontstage), " +
      "and Session › Live tutoring › Standard › Log session notes (Backstage).",
    ts: "1700000000.000110",
  },
];

const newDmAsk = (over: Partial<TurnRequest> = {}): TurnRequest =>
  request({
    surface: "assistant",
    conversationTs: "dm",
    replyTs: "1700000000.000500",
    userMsgTs: "1700000000.000500",
    threaded: false,
    text: "im thinking about improving our tutor's in session experience, can u suggest a few ideas?",
    history: EARLIER_DM,
    ...over,
  });

const SEARCH = {
  text: "Checking the blueprint.",
  toolCalls: [{ name: "search_blueprint", args: { query: "live session tutor pain points" } }],
};

test("an answer from history that claims fresh blueprint grounding is sent back to say what it rests on", async () => {
  const h = harness({
    replies: [
      {
        text:
          "Here are a few ideas, grounded directly in our current blueprint pain points: " +
          "a nudge when Session › Live tutoring › Standard › Student goes quiet (Frontstage), " +
          "and a faster notes form for Log session notes.",
      },
    ],
  });
  const outcome = await runTurn(newDmAsk(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.deepEqual(h.executed, [], "no lookup ran this turn");
  assert.equal(outcome.telemetry.confidence, "carried");
  const call = h.judged[0]!;
  assert.equal(call.forceReason, "carried");
  assert.match(call.extraInstruction ?? "", /earlier answer/);
});

test("a suggestion that names blueprint places from history owes the same word, opinion or not", async () => {
  const h = harness({
    replies: [
      {
        text:
          "I'd suggest two things: a quiet-student nudge at Session › Live tutoring › Standard › " +
          "Student goes quiet (Frontstage), and a shorter notes form.",
      },
    ],
  });
  const outcome = await runTurn(newDmAsk(), h.deps);

  assert.equal(outcome.telemetry.confidence, "carried");
  assert.equal(h.judged[0]!.forceReason, "carried");
});

test("an answer that says it is going from the earlier answer ships as written", async () => {
  const h = harness({
    replies: [
      {
        text:
          "Going from my earlier answer rather than a fresh look: a quiet-student nudge at " +
          "Session › Live tutoring › Standard › Student goes quiet (Frontstage) would help most.",
      },
    ],
  });
  const outcome = await runTurn(newDmAsk(), h.deps);

  assert.equal(outcome.telemetry.confidence, "ok");
  assert.equal(h.judged[0]!.forceReason, undefined);
});

test("a place carried in the index's labeled form reaches the reader as a › breadcrumb", async () => {
  const h = harness({
    replies: [
      {
        text:
          "Going from my earlier answer: the release step is Phase: Release › Scenario: Version cut › " +
          "Path: Standard (happy) › Step: Tag the release › Layer: Backstage, and the notes follow it " +
          "(Phase: Release · Scenario: Version cut · Step: Publish notes).",
      },
    ],
  });
  await runTurn(newDmAsk({ text: "what happens when we cut a release?" }), h.deps);

  const answer = h.delivery.posted.at(-1) ?? "";
  assert.match(answer, /the release step is Release › Version cut › Standard › Tag the release \(Backstage\), and/);
  assert.match(answer, /\(Release › Version cut › Publish notes\)\./);
  assert.doesNotMatch(answer, /Phase:|Scenario:|Layer:/);
});

test("the same answer over a blueprint lookup of this turn is not sent back", async () => {
  const h = harness({
    replies: [
      SEARCH,
      {
        text:
          "Here are a few ideas, grounded directly in our current blueprint pain points: a nudge when " +
          "Session › Live tutoring › Standard › Student goes quiet (Frontstage).",
      },
    ],
    receipt: { tool: "search_blueprint", query: "live session tutor pain points", count: 3, scenarios: [] },
  });
  const outcome = await runTurn(newDmAsk(), h.deps);

  assert.deepEqual(h.executed, ["search_blueprint"]);
  assert.equal(outcome.telemetry.confidence, "ok");
  assert.equal(h.judged[0]!.forceReason, undefined);
});

const GROUNDED_DRAFT =
  "Here are a few ideas, grounded directly in our current blueprint pain points: " +
  "a nudge when Session › Live tutoring › Standard › Student goes quiet (Frontstage).";

for (const [name, verdict] of [
  ["errors", "error"],
  ["passes unrewritten", "pass"],
] as const) {
  test(`a grounding claim the judge ${name} never reaches the reader`, async () => {
    const h = harness({ replies: [{ text: GROUNDED_DRAFT }], judge: () => ({ text: GROUNDED_DRAFT, verdict }) });
    await runTurn(newDmAsk(), h.deps);

    const answer = h.delivery.posted.at(-1) ?? "";
    assert.doesNotMatch(answer, /grounded directly in our current blueprint/);
    assert.match(answer, /going from my earlier answer, not a fresh look at the blueprint: a nudge when/);
  });
}

test("a place named with no word on where it came from gets that word when the judge leaves it out", async () => {
  const draft = "A quiet-student nudge at Session › Live tutoring › Standard › Student goes quiet (Frontstage).";
  const h = harness({ replies: [{ text: draft }] });
  await runTurn(newDmAsk(), h.deps);

  assert.match(h.delivery.posted.at(-1) ?? "", /^From my earlier answer, not a fresh look: A quiet-student nudge/);
});

test("a turn that looked only in Notion still owes the word on the blueprint places it carries", async () => {
  const h = harness({
    replies: [
      { text: "Checking the Roadmap.", toolCalls: [{ name: "roadmap_query", args: { query: "release" } }] },
      {
        text:
          "According to our current blueprint, the release step is Release › Version cut › Standard › " +
          "Tag the release (Backstage), and the Roadmap card is In Review.",
      },
    ],
  });
  const outcome = await runTurn(newDmAsk({ text: "where are we on the release?" }), h.deps);

  assert.deepEqual(h.executed, ["roadmap_query"]);
  assert.equal(outcome.telemetry.confidence, "carried");
  assert.equal(h.judged[0]!.forceReason, "carried");
  assert.doesNotMatch(h.delivery.posted.at(-1) ?? "", /According to our current blueprint/);
});

test("a Figma or Notion path is not a blueprint place", async () => {
  const h = harness({
    replies: [
      {
        text:
          "That rule lives on Specs › Goal states › Live session, and the card's field is Card 12 › Status — " +
          "the progress bar stays hidden until the tutor joins.",
      },
    ],
  });
  const outcome = await runTurn(newDmAsk({ text: "where's the progress bar rule?" }), h.deps);

  assert.notEqual(outcome.telemetry.confidence, "carried");
});
