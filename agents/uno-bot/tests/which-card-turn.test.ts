// "Approve which one?" when several proposal cards wait in one thread (#1319),
// through the turn.
//
// A thread can hold several live cards (#1318). A typed ✅ / ⛔, or a "yes"
// the model reads as a decision, says nothing about WHICH card it means, and
// two cards are two different writes — so with more than one waiting, the
// decision resolves nothing and the bot asks which, one button per card. With
// a single card waiting, a decision resolves it directly, as it always has.
// The buttons themselves are driven in `tests/which-card-buttons.test.ts`.
//
// Every case runs real turns on one in-memory store (one thread), handed the
// thread's live cards the way `slack/events.ts` hands them over.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type TurnRequest } from "../src/turn/index";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness, request, REF, type Harness } from "./helpers/turn-harness";

/** A turn in the thread, handed the cards live in it as production hands them. */
async function turn(h: Harness, over: Partial<TurnRequest>) {
  const liveCards = await h.threadState.getProposalsByThread(REF);
  return runTurn(request({ pending: liveCards[0] ?? null, liveCards, ...over }), h.deps);
}

function call(name: string, args: Record<string, unknown>): ScriptedReply {
  return { text: "Here's the card.", toolCalls: [{ name, args: { ...args } }] };
}

const PRD_A = { surface: "prd", title: "Backup tutor matching", summary: "Match a backup tutor when one calls off." };
const PRD_B = { surface: "prd", title: "Session reflections", summary: "A shorter reflection form." };

/** Two separate cards in the thread: A, then B beside it. */
async function twoCards(h: Harness): Promise<{ a: string; b: string }> {
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  return { a: first.staged!.proposal.proposalTs, b: second.staged!.proposal.proposalTs };
}

async function live(h: Harness): Promise<string[]> {
  return (await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs).sort();
}

test("a typed ✅ with two live cards runs nothing and asks which, one numbered button per card", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b } = await twoCards(h);

  const outcome = await turn(h, { text: "✅", userMsgTs: "1700000000.000400" });

  assert.deepEqual(h.resolved, [], "nothing ran");
  assert.deepEqual(await live(h), [a, b].sort(), "both cards still live");
  assert.deepEqual(h.delivery.gateNotes.at(-1), {
    kind: "which-card",
    decision: "confirm",
    cards: [
      { ts: b, headline: "Session reflections" },
      { ts: a, headline: "Backup tutor matching" },
    ],
  });
  assert.equal(outcome.disposition, "asked", "the turn asked something, so the thread waits on the person");
});

test("a typed ⛔ with two live cards cancels nothing and asks \"Cancel which one?\"", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const { a, b } = await twoCards(h);

  await turn(h, { text: "⛔", userMsgTs: "1700000000.000400" });

  assert.deepEqual(h.resolved, []);
  assert.deepEqual(await live(h), [a, b].sort());
  const note = h.delivery.gateNotes.at(-1);
  assert.equal(note?.kind === "which-card" && note.decision, "cancel");
});

test("a typed \"yes\" with one live card approves it, as it always has", async () => {
  const h = harness({
    replies: [call("notion_create", PRD_A), { toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm" } }] }],
  });
  await turn(h, { text: "draft a PRD for backup tutor matching" });

  const outcome = await turn(h, { text: "yes", userMsgTs: "1700000000.000400" });

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["confirm", true]]);
  assert.deepEqual(await live(h), []);
});

test("a typed \"yes\" with two live cards: the model's approval naming no card is refused, and the bot asks which", async () => {
  const h = harness({
    replies: [
      call("notion_create", PRD_A),
      call("notion_create", PRD_B),
      { toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm" } }] },
      { text: "Which one do you mean?" },
    ],
  });
  const { a, b } = await twoCards(h);

  const outcome = await turn(h, { text: "yes", userMsgTs: "1700000000.000400" });

  assert.deepEqual(h.resolved, [], "nothing ran");
  assert.deepEqual(await live(h), [a, b].sort());
  // The refusal went back to the model as its call's result.
  const refusal = h.provider.transcript
    .flatMap((t) => (t.kind === "results" ? t.results : []))
    .find((r) => r.name === "proposal_resolve");
  assert.ok(refusal?.isError, "the call was refused");
  assert.match(refusal!.text, /card/);
  // And the person is asked, with a button per card — not in the model's words.
  assert.deepEqual(h.delivery.gateNotes.at(-1), {
    kind: "which-card",
    decision: "confirm",
    cards: [
      { ts: b, headline: "Session reflections" },
      { ts: a, headline: "Backup tutor matching" },
    ],
  });
  assert.ok(!h.delivery.posted.includes("Which one do you mean?"));
  assert.equal(outcome.disposition, "asked");
});

test("the model's approval naming one of two cards approves that card only, and the thread still waits on the other", async () => {
  const resolve = { toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm", card: "" } as Record<string, unknown> }] };
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), resolve] });
  const { a, b } = await twoCards(h);
  resolve.toolCalls[0]!.args.card = a;
  const before = h.delivery.calls.length;

  // On the default tier, so the turn raises the working signal and settles it.
  const outcome = await turn(h, { text: "yes to the backup tutor one", userMsgTs: "1700000000.000400", tierOverride: "default" });

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved.map((r) => [r.decision, r.executed]), [["confirm", true]]);
  assert.deepEqual(await live(h), [b], "card A was the one claimed; the other stays live");
  const cleared = h.delivery.calls.slice(before).find((c) => c.kind === "working-clear");
  assert.equal(cleared?.kind === "working-clear" && cleared.settlement, "waiting-on-person");
});

test("the model's approval naming a card that is not waiting is refused back to it", async () => {
  const h = harness({
    replies: [
      call("notion_create", PRD_A),
      call("notion_create", PRD_B),
      { toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm", card: "9999999999.000000" } }] },
      { text: "I couldn't find that card." },
    ],
  });
  const { a, b } = await twoCards(h);

  await turn(h, { text: "approve the old one", userMsgTs: "1700000000.000400" });

  assert.deepEqual(h.resolved, []);
  assert.deepEqual(await live(h), [a, b].sort());
  const refusal = h.provider.transcript
    .flatMap((t) => (t.kind === "results" ? t.results : []))
    .find((r) => r.name === "proposal_resolve");
  assert.match(refusal!.text, /no waiting card has the id/);
});

test("a worded cancel after \"Cancel which one?\" closes the card it named, and only that card", async () => {
  // Live 2026-10-17: ⛔ alone asked which; the person then said which in words,
  // and the model's `proposal_resolve` canceled that card — but its message
  // kept its Review button and no outcome line, where a press would have
  // edited it to both.
  const resolve = { toolCalls: [{ name: "proposal_resolve", args: { decision: "cancel", card: "" } as Record<string, unknown> }] };
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), resolve] });
  const { a, b } = await twoCards(h);

  await turn(h, { text: "⛔", userMsgTs: "1700000000.000400" });
  assert.equal(h.delivery.gateNotes.at(-1)?.kind, "which-card", "asked which");

  resolve.toolCalls[0]!.args.card = a;
  const outcome = await turn(h, {
    text: "Cancel the backup tutor one. Leave the session reflections one waiting.",
    userMsgTs: "1700000000.000500",
  });

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(await live(h), [b], "only the card named was decided");
  const closed = h.delivery.calls.flatMap((c) => (c.kind === "close-card" ? [c] : []));
  assert.deepEqual(
    closed.map((c) => [c.card.ts, c.outcome]),
    [[a, { decision: "cancel", by: "U1" }]],
    "the canceled card is edited to its outcome, as a press edits it",
  );
});

test("the model re-staging the waiting card byte for byte approves it, and closes it", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_A)] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });

  const outcome = await turn(h, { text: "go ahead", userMsgTs: "1700000000.000400" });

  assert.equal(outcome.disposition, "resolved");
  const closed = h.delivery.calls.flatMap((c) => (c.kind === "close-card" ? [c] : []));
  assert.deepEqual(
    closed.map((c) => [c.card.ts, c.outcome]),
    [[first.staged!.proposal.proposalTs, { decision: "confirm", by: "U1" }]],
  );
});

test("a typed ✅ on the one live card closes it to its outcome", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A)] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });

  await turn(h, { text: "✅", userMsgTs: "1700000000.000400" });

  const closed = h.delivery.calls.flatMap((c) => (c.kind === "close-card" ? [c] : []));
  assert.deepEqual(
    closed.map((c) => [c.card.ts, c.outcome]),
    [[first.staged!.proposal.proposalTs, { decision: "confirm", by: "U1" }]],
  );
  assert.deepEqual(redraws(h), [], "no question was asked, so none is redrawn");
});

/** Every redraw of an open "which one?" question the turns asked for. */
function redraws(h: Harness) {
  return h.delivery.calls.flatMap((c) => (c.kind === "redraw-which" ? [c.question] : []));
}

test("a card decided in words drops out of the open \"Cancel which one?\": its button goes, its number stays", async () => {
  // Live 2026-10-17: "Cancel the mobile expiry-line one" canceled card 2, and
  // the question above kept its "Cancel 2" button.
  const resolve = { toolCalls: [{ name: "proposal_resolve", args: { decision: "cancel", card: "" } as Record<string, unknown> }] };
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), resolve] });
  const { a, b } = await twoCards(h);
  await turn(h, { text: "⛔", userMsgTs: "1700000000.000400" });
  assert.deepEqual(redraws(h), [], "asking redraws nothing");

  resolve.toolCalls[0]!.args.card = a;
  await turn(h, { text: "Cancel the backup tutor one.", userMsgTs: "1700000000.000500" });

  const [redrawn, ...more] = redraws(h);
  assert.equal(more.length, 0, "one redraw");
  assert.equal(redrawn?.decision, "cancel");
  assert.deepEqual(redrawn?.cards.map((c) => c.ts), [b, a], "the list keeps every card, in its numbered order");
  assert.deepEqual(redrawn?.decided, [a], "the card decided is marked");
  const asked = h.delivery.calls.findIndex((c) => c.kind === "gate-note" && c.note.kind === "which-card");
  const closed = h.delivery.calls.findIndex((c) => c.kind === "close-card");
  const drawn = h.delivery.calls.findIndex((c) => c.kind === "redraw-which");
  assert.ok(asked < closed && closed < drawn, "the card is closed first, then the question redrawn");
});

test("the last card left, decided with a typed ✅, leaves the question with no buttons, and its record goes", async () => {
  const resolve = { toolCalls: [{ name: "proposal_resolve", args: { decision: "cancel", card: "" } as Record<string, unknown> }] };
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), resolve] });
  const { a, b } = await twoCards(h);
  await turn(h, { text: "⛔", userMsgTs: "1700000000.000400" });
  resolve.toolCalls[0]!.args.card = a;
  await turn(h, { text: "Cancel the backup tutor one.", userMsgTs: "1700000000.000500" });

  await turn(h, { text: "✅", userMsgTs: "1700000000.000600" });

  assert.deepEqual(h.resolved.map((r) => r.decision), ["cancel", "confirm"]);
  assert.deepEqual(redraws(h).map((q) => q.decided), [[a], [a, b]]);
  assert.equal(await h.threadState.decideInWhichQuestion(b), null, "nothing is kept once every card is decided");
});

test("the question the model's undirected \"yes\" asked is kept too, and a card later approved by name drops out of it", async () => {
  const resolve = { toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm", card: "" } as Record<string, unknown> }] };
  const h = harness({
    replies: [
      call("notion_create", PRD_A),
      call("notion_create", PRD_B),
      { toolCalls: [{ name: "proposal_resolve", args: { decision: "confirm" } }] },
      { text: "Which one do you mean?" },
      resolve,
    ],
  });
  const { a, b } = await twoCards(h);
  await turn(h, { text: "yes", userMsgTs: "1700000000.000400" });

  resolve.toolCalls[0]!.args.card = b;
  await turn(h, { text: "the session reflections one", userMsgTs: "1700000000.000500" });

  assert.deepEqual(redraws(h).map((q) => [q.decision, q.decided]), [["confirm", [b]]]);
  assert.deepEqual(await live(h), [a]);
});
