// A blueprint check's results, acted on (#1323): the results post with the
// action that fits the card as it stands when they arrive, and a press acts
// on the card as it stands when it is pressed.
//
//   • the card still waits → Add these notes to the card stages a revision of
//     the matter's CURRENT card (an edit made while the check ran included)
//     with the notes in, and the card it replaces is superseded;
//   • the card was approved → Update the Roadmap page stages a `notion_update`
//     that appends a "Compared with today's blueprint" section to the page
//     the approval created, and nothing else;
//   • the card was cancelled or expired, or there is no card → the results
//     post with no add action.
//
// The seams are the turn (a real PRD turn stages the card and the offer, and
// a real revision turn edits it) and the button (the Check it door, the job,
// and the results door, whose staging is Turn's own `stageFromButton`). What
// is asserted is what the thread sees — the results message, the cards and
// notes posted, the presser's private replies — and what a ✅ would run, as
// the store holds it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, stageFromButton } from "../src/turn/index";
import { fakeProvider, type ScriptedReply } from "../src/agent/providers/fake";
import {
  draftProposal,
  rememberCreatedPage,
  runBlueprintCheck,
  serviceChangeGate,
  serviceChangeJudgement,
  NOTES_HEADING,
  type MatterPages,
  type PathToday,
} from "../src/blueprint-upkeep/index";
import type { BlueprintRow } from "../src/integrations/blueprint";
import type { OperationOutcome } from "../src/gate/run-batch";
import { createInMemoryThreadState, proposalOperations, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import {
  ADD_NOTES_ACTION_ID,
  UPDATE_PAGE_ACTION_ID,
  resultsMessage,
  runCheckItDoor,
  runResultsDoor,
  type ResultsPress,
} from "../src/slack/blueprint-check";
import type { CardMessage } from "../src/slack/button-door";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { CHANNEL, CONVERSATION, harness, request, type Harness } from "./helpers/turn-harness";
import { cardExpiresAt } from "../src/card-expiry";

const MATCH: BlueprintRow[] = [
  { kind: "cell", id: "cell-2", title: "Supervisor finds a fill-in", scenario: "Call-off", path: "Standard", lane: "Supervisor", step: "Find a fill-in", matchedBy: "vector+keyword" },
];

const TODAY: PathToday = {
  pathId: "path-1",
  scenarioId: "scenario-1",
  scenario: "Call-off",
  path: "Standard",
  status: "live",
  lanes: [
    { id: "l-tutor", name: "Tutor" },
    { id: "l-sup", name: "Supervisor" },
  ],
  steps: [
    { id: "s-1", name: "Call off a session" },
    { id: "s-2", name: "Find a fill-in" },
  ],
  cells: [
    { id: "cell-1", laneId: "l-tutor", stepId: "s-1", content: "Tutor messages the supervisor", status: "live" },
    { id: "cell-2", laneId: "l-sup", stepId: "s-2", content: "Supervisor asks around in Slack", status: "live" },
  ],
  link: "https://blueprint.example/?cell=cell-1",
};

const SERVICE_CHANGE = JSON.stringify({
  changes_service: true,
  confidence: 0.9,
  query: "supervisor finds a fill-in after a call-off",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
});

const DRAFT = JSON.stringify({
  rows: [{ change: "added", step_id: "s-2", lane_id: "l-tutor", content: "Free tutor claims the posted call-off" }],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});

const REQUESTER = "U0REQUEST01";
const BYSTANDER = "U2OTHER1";
/** Wednesday 2026-10-14, 10:00 ET. */
const NOW = Date.parse("2026-10-14T14:00:00Z");
const PAGE_URL = "https://www.notion.so/Self-serve-call-offs-0123456789abcdef0123456789abcdef";

const PRD_INPUT = {
  surface: "prd",
  title: "Self-serve call-offs",
  summary: "Tutors post their own call-off and the first free tutor claims it. The supervisor only sees the result.",
  sections: [{ heading: "Open Questions", body: "Who sees a call-off nobody claims?" }],
};

const stagePrd: ScriptedReply = {
  text: "I've drafted the PRD on a card.",
  toolCalls: [{ name: "notion_create", args: { ...PRD_INPUT } }],
};

/** The created pages a ✅ on a PRD leaves, kept by matter. */
function createdPages(): MatterPages & { kept: Map<string, string> } {
  const kept = new Map<string, string>();
  return {
    kept,
    pageOf: async (channel, matter) => kept.get(`${channel}:${matter}`) ?? null,
    remember: async (channel, matter, url) => void kept.set(`${channel}:${matter}`, url),
  };
}

/** A thread where a PRD turn posted its card and the Check it offer; `more`
 *  are the model's replies to later turns in the same thread. */
async function offered(more: ScriptedReply[] = [], asked: Partial<Parameters<typeof request>[0]> = {}) {
  const clock = { t: NOW };
  const threadState = createInMemoryThreadState({ now: () => clock.t });
  const h = harness({ replies: [stagePrd, ...more], threadState, now: () => clock.t });
  h.deps.serviceChangeJudgement = serviceChangeJudgement({
    gate: serviceChangeGate({ provider: fakeProvider({ generateReplies: [SERVICE_CHANGE] }), search: async () => MATCH }),
    affordable: () => true,
  });
  const outcome = await runTurn(request({ userId: REQUESTER, text: "turn this thread into a PRD", ...asked }), h.deps);
  const at = h.delivery.calls.findIndex((c) => c.kind === "check-offer");
  assert.ok(at >= 0, "the turn offered the check");
  const offerTs = `offer-${at + 1}`;
  const pages = createdPages();
  return { h, threadState, clock, offerTs, cardTs: outcome.staged!.proposal.proposalTs, pages };
}

type World = Awaited<ReturnType<typeof offered>>;

/** The run each world's Check it queued, as its job carries it. */
const queuedRun = new WeakMap<World, string>();

/** Check it pressed; a second press while that check runs queues nothing. */
async function press(w: World): Promise<void> {
  await runCheckItDoor(
    { channel: CHANNEL, offerTs: w.offerTs, userId: REQUESTER },
    {
      store: w.threadState,
      enqueue: async (job) => (job.kind === "blueprint-check" && queuedRun.set(w, job.run), true),
      replaceOffer: async () => {},
      replyEphemeral: async () => {},
      now: () => w.clock.t,
    },
  );
}

/** Check it pressed, and the job run: the results message as Slack gets it. */
async function checked(w: World): Promise<CardMessage> {
  await press(w);
  const posted: CardMessage[] = [];
  await runBlueprintCheck({ offerTs: w.offerTs, run: queuedRun.get(w)! }, {
    store: w.threadState,
    readPath: async () => TODAY,
    draft: draftProposal({ provider: fakeProvider({ generateReplies: [DRAFT] }), affordable: () => true }),
    createdPage: w.pages.pageOf,
    postResults: async (offer, results) => void posted.push(resultsMessage(offer.offerTs, results)),
    postCard: async (_offer, card) => ({ ts: "draw-1", text: card.lead ?? "", ttlMs: cardExpiresAt(w.clock.t) - w.clock.t }),
    recordStaged: async () => {},
    settle: async () => {},
    now: () => w.clock.t,
  });
  assert.equal(posted.length, 1, "the results posted once");
  assert.equal(messageBlocksRefusal(posted[0]!.blocks), null, "Slack takes the results message");
  return posted[0]!;
}

/** The action ids a message carries. */
function actionsOf(message: CardMessage): string[] {
  return [...JSON.stringify(message.blocks).matchAll(/"action_id":"([^"]+)"/g)].map((m) => m[1]!);
}

/** The results door over the thread's store and Turn's own staging. */
function resultsDoor(w: World) {
  const redrawn: CardMessage[] = [];
  const told: string[] = [];
  const press = (userId: string, action: ResultsPress["action"]) =>
    runResultsDoor(
      { channel: CHANNEL, offerTs: w.offerTs, userId, action },
      {
        store: w.threadState,
        createdPage: w.pages.pageOf,
        stage: (ask) => stageFromButton(ask, w.h.deps),
        replaceResults: async (message) => void redrawn.push(message),
        replyEphemeral: async (text) => void told.push(text),
        now: () => w.clock.t,
      },
    );
  return { press, redrawn, told };
}

async function liveCard(threadState: ThreadState, ts: string): Promise<PendingProposal> {
  const found = await threadState.getProposalByTs(ts);
  assert.equal(found.state, "found", `the card ${ts} is live`);
  return (found as Extract<typeof found, { state: "found" }>).proposal;
}

/** The thread's live turn cards, newest first, but not the Draw on blueprint card. */
async function turnCards(h: Harness): Promise<PendingProposal[]> {
  return (await h.threadState.getProposalsByThread({ channel: CHANNEL, thread: CONVERSATION })).filter((p) => p.toolName !== "blueprint_revise");
}

// ── The card still waits ─────────────────────────────────────────────────────

test("card waiting: the results carry Add these notes, which stages a revision of the card with the notes in, superseding it", async () => {
  const w = await offered();
  const results = await checked(w);
  assert.deepEqual(actionsOf(results), [ADD_NOTES_ACTION_ID]);
  assert.match(results.text, /Expires <!date\^/, "the button says its deadline");

  const d = resultsDoor(w);
  await d.press(REQUESTER, "add-notes");

  assert.deepEqual(d.told, []);
  assert.equal((await w.threadState.getProposalByTs(w.cardTs)).state, "superseded", "the earlier card is superseded");
  const [revised] = await turnCards(w.h);
  assert.notEqual(revised!.proposalTs, w.cardTs);
  assert.equal(revised!.revisesProposalTs, w.cardTs);
  assert.equal(revised!.supersedeKey, `card:${w.cardTs}`, "staged in the matter's slot");
  const [op] = proposalOperations(revised!);
  assert.equal(op!.toolName, "notion_create");
  const input = op!.input as typeof PRD_INPUT;
  assert.equal(input.title, PRD_INPUT.title, "everything the card held is kept");
  assert.equal(input.summary, PRD_INPUT.summary);
  assert.equal(input.sections.length, 2);
  assert.deepEqual(input.sections[0], PRD_INPUT.sections[0]);
  assert.equal(input.sections[1]!.heading, NOTES_HEADING);
  assert.match(input.sections[1]!.body, /Free tutor claims the posted call-off/, "the notes are the results");
  // Said just above the new card, as a turn's revision is.
  assert.deepEqual(w.h.delivery.gateNotes.at(-1), { kind: "revised", replaced: "Self-serve call-offs" });
  // The results lose the button: the notes are on the card.
  assert.deepEqual(actionsOf(d.redrawn[0]!), []);
  assert.match(d.redrawn[0]!.text, /Added to the card/);
});

test("the usage record names the channel of a card the notes stage in a channel, and not in a group DM", async () => {
  for (const [conversationType, named] of [["channel", CHANNEL], ["mpim", null]] as const) {
    const w = await offered([], { conversationType });
    await checked(w);
    await resultsDoor(w).press(REQUESTER, "add-notes");
    const [revised] = await turnCards(w.h);
    const staged = w.h.proposalEvents.events().find((e) => e.proposalId === revised!.proposalTs && e.event === "staged");
    assert.equal(staged?.channelId, named, `a ${conversationType} card`);
  }
});

test("card edited while the check ran: the notes land on the edited version, keeping the edit", async () => {
  const edit = { ...PRD_INPUT, title: "Claim a call-off", revises_card: "" };
  const w = await offered([{ text: "Renamed it.", toolCalls: [{ name: "notion_create", args: edit }] }]);
  await press(w);
  // The requester edits the card while the check waits on its runner.
  edit.revises_card = w.cardTs;
  const pending = await w.threadState.getProposalByThread({ channel: CHANNEL, thread: CONVERSATION });
  const editTurn = await runTurn(
    request({ userId: REQUESTER, text: "call it Claim a call-off", userMsgTs: "1700000000.000300", pending, liveCards: pending ? [pending] : [] }),
    w.h.deps,
  );
  const editedTs = editTurn.staged!.proposal.proposalTs;
  assert.equal((await w.threadState.getProposalByTs(w.cardTs)).state, "superseded", "the edit revised the card");

  const results = await checked(w);
  assert.deepEqual(actionsOf(results), [ADD_NOTES_ACTION_ID], "the matter's card still waits");
  await resultsDoor(w).press(REQUESTER, "add-notes");

  assert.equal((await w.threadState.getProposalByTs(editedTs)).state, "superseded", "the edited card is the one replaced");
  const [current] = await turnCards(w.h);
  assert.equal(current!.revisesProposalTs, editedTs);
  assert.equal(current!.supersedeKey, `card:${w.cardTs}`, "still the same matter");
  const input = proposalOperations(current!)[0]!.input as typeof PRD_INPUT;
  assert.equal(input.title, "Claim a call-off", "the edit is kept");
  assert.deepEqual(input.sections.map((s) => s.heading), ["Open Questions", NOTES_HEADING]);
});

test("pressing Add these notes again replaces the notes rather than doubling them", async () => {
  const w = await offered();
  await checked(w);
  const d = resultsDoor(w);
  await d.press(REQUESTER, "add-notes");
  await d.press(REQUESTER, "add-notes");
  const [current] = await turnCards(w.h);
  const input = proposalOperations(current!)[0]!.input as typeof PRD_INPUT;
  assert.deepEqual(input.sections.map((s) => s.heading), ["Open Questions", NOTES_HEADING]);
});

test("someone the card does not admit cannot add the notes to it, and is told so privately", async () => {
  const w = await offered();
  // A card with a confirmer set, as a #uno-bot card or an inherited set has.
  const card = await liveCard(w.threadState, w.cardTs);
  await w.threadState.putProposal({ ...card, confirmers: [REQUESTER], exclusiveConfirmers: true });
  await checked(w);
  const d = resultsDoor(w);
  await d.press(BYSTANDER, "add-notes");
  assert.equal(d.told.length, 1);
  assert.match(d.told[0]!, new RegExp(`<@${REQUESTER}>`));
  assert.equal((await liveCard(w.threadState, w.cardTs)).proposalTs, w.cardTs, "the card stays as it was");
  assert.deepEqual(d.redrawn, []);
});

// ── The card was approved ────────────────────────────────────────────────────

/** The card approved: claimed by its ✅, its PRD written, and the page it
 *  created kept as the approval keeps it. */
async function approve(w: World): Promise<void> {
  const card = await liveCard(w.threadState, w.cardTs);
  assert.ok(await w.threadState.claimProposal(w.cardTs));
  const outcomes = [
    { toolName: "notion_create", input: card.input, ok: true, result: JSON.stringify({ ok: true, surface: "prd", url: PAGE_URL }) },
  ] as unknown as OperationOutcome[];
  await rememberCreatedPage(w.pages, card, outcomes);
}

test("card approved: Update the Roadmap page stages a notion_update that appends the notes section and nothing else", async () => {
  const w = await offered();
  await approve(w);
  const results = await checked(w);
  assert.deepEqual(actionsOf(results), [UPDATE_PAGE_ACTION_ID]);

  const d = resultsDoor(w);
  await d.press(REQUESTER, "update-page");
  assert.deepEqual(d.told, []);
  const [update] = await turnCards(w.h);
  assert.equal(update!.toolName, "notion_update");
  assert.equal(update!.requesterUserId, REQUESTER);
  assert.equal(update!.supersedeKey, `card:${update!.proposalTs}`, "a separate proposal, in a slot of its own");
  const ops = proposalOperations(update!);
  assert.equal(ops.length, 1);
  // Only an append: no property set, no block replaced or inserted.
  assert.deepEqual(Object.keys(ops[0]!.input).sort(), ["append", "page_url"]);
  assert.equal(ops[0]!.input.page_url, PAGE_URL);
  const append = ops[0]!.input.append as { sections: Array<{ heading: string; body: string }> };
  assert.equal(append.sections.length, 1);
  assert.equal(append.sections[0]!.heading, NOTES_HEADING);
  assert.match(append.sections[0]!.body, /Free tutor claims the posted call-off/);
  assert.match(d.redrawn[0]!.text, /Proposed as an update to the Roadmap page/);
  assert.deepEqual(actionsOf(d.redrawn[0]!), []);
});

test("only the requester may propose the page update", async () => {
  const w = await offered();
  await approve(w);
  await checked(w);
  const d = resultsDoor(w);
  await d.press(BYSTANDER, "update-page");
  assert.deepEqual(d.told, [`Only <@${REQUESTER}> can propose this update to the Roadmap page.`]);
  assert.deepEqual(await turnCards(w.h), []);
});

test("a card approved after the results posted: Add these notes proposes the page update instead", async () => {
  const w = await offered();
  await checked(w);
  await approve(w);
  await resultsDoor(w).press(REQUESTER, "add-notes");
  const [update] = await turnCards(w.h);
  assert.equal(update!.toolName, "notion_update");
});

// ── The card was cancelled or expired ────────────────────────────────────────

test("card cancelled: the results post with no add action", async () => {
  const w = await offered();
  assert.ok(await w.threadState.claimProposal(w.cardTs));
  const results = await checked(w);
  assert.deepEqual(actionsOf(results), []);
  assert.match(results.text, /Free tutor claims the posted call-off/);
  assert.doesNotMatch(results.text, /Expires/);
});

test("card expired: the results post with no add action", async () => {
  const w = await offered();
  // Pressed in time; the card expires while the check runs.
  await press(w);
  w.clock.t = cardExpiresAt(NOW) + 1;
  const results = await checked(w);
  assert.deepEqual(actionsOf(results), []);
});

test("an offer with no card (a hand-off) gets results with no add action", async () => {
  const w = await offered();
  const offer = (await w.threadState.getCheckOffer(w.offerTs))!;
  const { cardTs: _card, cardKey: _key, ...handOff } = offer;
  await w.threadState.putCheckOffer({ ...handOff, milestone: "prototype-hand-off" });
  const results = await checked(w);
  assert.deepEqual(actionsOf(results), []);
});

test("a card that closes after the results posted: the press stages nothing, says so, and the button goes", async () => {
  const w = await offered();
  await checked(w);
  assert.ok(await w.threadState.claimProposal(w.cardTs));
  const d = resultsDoor(w);
  await d.press(REQUESTER, "add-notes");
  assert.deepEqual(d.told, ["That card is no longer waiting, so there is nothing to add the notes to."]);
  assert.deepEqual(actionsOf(d.redrawn[0]!), []);
  assert.deepEqual(await turnCards(w.h), []);
});

// ── The deadline ─────────────────────────────────────────────────────────────

test("the results' button follows the 24-weekday-hour rule from when they posted", async () => {
  const w = await offered();
  w.clock.t = NOW + 60_000;
  const results = await checked(w);
  const deadline = cardExpiresAt(NOW + 60_000);
  assert.match(results.text, new RegExp(`Expires <!date\\^${Math.floor(deadline / 1000)}\\^`));

  // The card's own deadline came first, so a press at the button's own is
  // in time for the button, and finds the card closed.
  w.clock.t = deadline;
  const d = resultsDoor(w);
  await d.press(REQUESTER, "add-notes");
  assert.deepEqual(d.told, ["That card is no longer waiting, so there is nothing to add the notes to."]);
});

test("a press past the results' deadline stages nothing: the presser is told, and the results say Expired", async () => {
  const w = await offered();
  await checked(w);
  w.clock.t = cardExpiresAt(NOW) + 1;
  const d = resultsDoor(w);
  await d.press(REQUESTER, "add-notes");
  assert.deepEqual(d.told, ["That button expired, so nothing was added. Your card isn't affected."]);
  assert.match(d.redrawn[0]!.text, /Expired\.$/);
  assert.deepEqual(actionsOf(d.redrawn[0]!), []);
});

// ── Draw on blueprint ────────────────────────────────────────────────────────

test("Draw on blueprint still follows the results as the requester's own card, beside the PRD's", async () => {
  const w = await offered();
  await checked(w);
  const draw = await liveCard(w.threadState, "draw-1");
  assert.equal(draw.toolName, "blueprint_revise");
  assert.deepEqual(draw.confirmers, [REQUESTER]);
  assert.equal(draw.exclusiveConfirmers, true);
  assert.equal((await liveCard(w.threadState, w.cardTs)).toolName, "notion_create");
});
