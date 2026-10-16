// Separate proposals and revisions in one thread (#1318), through the turn.
//
// A new card for a different matter than any waiting one is a SEPARATE
// PROPOSAL: it posts beside them and each is decided on its own. A new card
// for the same matter is a REVISION: it supersedes the waiting card and
// carries what it held. The model says which, by naming the card it revises
// on the gated call (`revises_card`); the Worker overrides it one way only —
// a card aimed at the same Notion page or GitHub issue as a live one is a
// revision of it. Terms: GLOSSARY.md § uno-bot.
//
// Every case runs real turns on one in-memory store (one thread), the way
// `slack/events.ts` hands them over: the thread's live cards, newest first,
// with the newest as `pending`.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type TurnRequest } from "../src/turn/index";
import { resolveSignal } from "../src/gate/index";
import type { ScriptedReply } from "../src/agent/providers/fake";
import { harness, request, REF, CHANNEL, CONVERSATION, type Harness } from "./helpers/turn-harness";

/** A turn in the thread, handed the cards live in it as production hands them. */
async function turn(h: Harness, over: Partial<TurnRequest>) {
  const liveCards = await h.threadState.getProposalsByThread(REF);
  return runTurn(request({ pending: liveCards[0] ?? null, liveCards, ...over }), h.deps);
}

/** A gated call the model makes, with the card it revises named or not. */
function call(name: string, args: Record<string, unknown>, revises?: string): ScriptedReply {
  return { text: "Here's the card.", toolCalls: [{ name, args: revises ? { ...args, revises_card: revises } : { ...args } }] };
}

/** Name the card a scripted call revises, once that card's ts is known: the
 *  script is replayed by reference, so this reaches a reply not yet played. */
function naming(reply: ScriptedReply, cardTs: string): void {
  reply.toolCalls![0]!.args!.revises_card = cardTs;
}

const PRD_A = { surface: "prd", title: "Backup tutor matching", summary: "Match a backup tutor when one calls off." };
const PRD_B = { surface: "prd", title: "Session reflections", summary: "A shorter reflection form." };

async function live(h: Harness): Promise<string[]> {
  return (await h.threadState.getProposalsByThread(REF)).map((p) => p.proposalTs);
}

test("a different idea while a PRD card waits posts a separate card, and says the first still waits", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "different idea — new PRD for session reflections", userMsgTs: "1700000000.000300" });

  assert.equal(second.disposition, "staged");
  const a = first.staged!.proposal.proposalTs;
  const b = second.staged!.proposal.proposalTs;
  assert.deepEqual((await live(h)).sort(), [a, b].sort(), "both cards are live");
  assert.equal((await h.threadState.getProposalByTs(a)).state, "found", "the first is not superseded");
  assert.equal(second.staged!.proposal.revisesProposalTs, undefined, "the new card revises nothing");
  assert.deepEqual(h.delivery.gateNotes.at(-1), { kind: "staged-beside", waiting: ["Backup tutor matching"] });
});

test("an edit to the waiting card is a revision: one live card, the old one superseded, the new one carrying its terms", async () => {
  const edit = call("notion_create", { ...PRD_A, title: "Backup tutors" });
  const h = harness({ replies: [call("notion_create", PRD_A), edit] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const a = first.staged!.proposal.proposalTs;
  // A card that names who may confirm it: a revision is held to the same set.
  await h.threadState.putProposal({ ...first.staged!.proposal, confirmers: ["U1", "U7"] });
  naming(edit, a);

  const second = await turn(h, { text: "make the title shorter", userMsgTs: "1700000000.000300" });

  assert.equal(second.disposition, "staged");
  const b = second.staged!.proposal;
  assert.deepEqual(await live(h), [b.proposalTs], "one live card");
  assert.equal((await h.threadState.getProposalByTs(a)).state, "superseded");
  assert.equal(b.revisesProposalTs, a);
  assert.deepEqual(b.input, { ...PRD_A, title: "Backup tutors" }, "the edit on the old card's content, without the naming argument");
  assert.deepEqual(b.confirmers, ["U1", "U7"], "the revision keeps who may confirm it");
  assert.deepEqual(h.delivery.gateNotes.at(-1), { kind: "revised", replaced: "Backup tutor matching" });
});

test("the revision turn a Needs changes queued revises the card sent back, even when the model names none", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), call("notion_create", { ...PRD_A, summary: "Shorter." })] });
  const { a, b } = await twoCards(h);
  // Needs changes on the OLDER card: the Review door marks it and queues the
  // asker's turn handed that card (`slack/events.ts`, `event.revises`).
  const sentBack = (await h.threadState.getProposalByTs(a));
  assert.equal(sentBack.state, "found");
  if (sentBack.state !== "found") return;
  await h.threadState.putProposal({ ...sentBack.proposal, revising: { userId: "U1", at: Date.now() } });
  const liveCards = await h.threadState.getProposalsByThread(REF);
  const marked = liveCards.find((p) => p.proposalTs === a)!;

  const third = await runTurn(
    request({ text: "<@U1> asked for changes: shorter summary", userMsgTs: "1700000000.000400", pending: marked, liveCards }),
    h.deps,
  );

  assert.equal(third.staged!.proposal.revisesProposalTs, a);
  assert.deepEqual((await live(h)).sort(), [b, third.staged!.proposal.proposalTs].sort());
});

test("the model is shown every waiting card by id, and no longer told to hold side-effect tools", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), { text: "Both are waiting." }] });
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for session reflections", userMsgTs: "1700000000.000300" });
  await turn(h, { text: "what's waiting?", userMsgTs: "1700000000.000400" });

  const shown = h.provider.started!.system.map((b) => b.text).join("\n");
  for (const staged of [first, second]) {
    assert.ok(shown.includes(staged.staged!.proposal.proposalTs), "each card's id is listed");
  }
  assert.match(shown, /"Backup tutor matching"/);
  assert.match(shown, /"Session reflections"/);
  assert.match(shown, /revises_card/);
  assert.doesNotMatch(shown, /do NOT invoke/);
});

test("a notion_update on the page a waiting card updates is a revision of it, even when the model calls it separate", async () => {
  const page = "https://www.notion.so/plus/Backup-tutors-0123456789abcdef0123456789abcdef";
  const h = harness({
    replies: [
      call("notion_update", { page_url: page, properties: { "Design Status": "Ready for QA" } }),
      call("notion_update", { page_url: "https://www.notion.so/0123456789abcdef0123456789abcdef", properties: { "Design Status": "Done" } }),
    ],
  });
  const first = await turn(h, { text: "mark the backup tutor card ready for QA" });
  const second = await turn(h, { text: "actually mark that card done", userMsgTs: "1700000000.000300" });

  assert.equal(second.staged!.proposal.revisesProposalTs, first.staged!.proposal.proposalTs);
  assert.deepEqual(await live(h), [second.staged!.proposal.proposalTs]);
  assert.equal((await h.threadState.getProposalByTs(first.staged!.proposal.proposalTs)).state, "superseded");
});

test("a change to the issue a waiting card changes is a revision of it, even when the model calls it separate", async () => {
  const h = harness({
    replies: [
      call("github_issue_update", { issue_number: 42, comment: "Seen on staging too." }),
      call("github_issue_update", { repo: "example-org/harness", issue_number: "42", state: "closed" }),
    ],
  });
  const first = await turn(h, { text: "comment on #42 that it's on staging too" });
  const second = await turn(h, { text: "close #42 instead", userMsgTs: "1700000000.000300" });

  assert.equal(second.staged!.proposal.revisesProposalTs, first.staged!.proposal.proposalTs);
  assert.deepEqual(await live(h), [second.staged!.proposal.proposalTs]);
});

test("a change to a different issue is a separate proposal", async () => {
  const h = harness({
    replies: [
      call("github_issue_update", { issue_number: 42, comment: "Seen on staging too." }),
      call("github_issue_update", { issue_number: 43, comment: "Same here." }),
    ],
  });
  await turn(h, { text: "comment on #42" });
  const second = await turn(h, { text: "and on #43", userMsgTs: "1700000000.000300" });

  assert.equal(second.staged!.proposal.revisesProposalTs, undefined);
  assert.equal((await live(h)).length, 2);
});

test("an issue named \"#42\", \" #42\" or 42 is one issue: a change to it is a revision of the waiting card", async () => {
  for (const named of ["#42", " #42"]) {
    const h = harness({
      replies: [
        call("github_issue_update", { issue_number: 42, comment: "Seen on staging too." }),
        call("github_issue_update", { issue_number: named, state: "closed" }),
      ],
    });
    const first = await turn(h, { text: "comment on #42 that it's on staging too" });
    const second = await turn(h, { text: "close it instead", userMsgTs: "1700000000.000300" });

    assert.equal(second.staged!.proposal.revisesProposalTs, first.staged!.proposal.proposalTs, `issue_number ${JSON.stringify(named)}`);
    assert.deepEqual(await live(h), [second.staged!.proposal.proposalTs]);
  }
});

test("a card the Worker staged is touched by a change to its issue, read as a turn card's is: the same number in another repo is not it", async () => {
  for (const [repo, issue, revises] of [["example-org/harness", "#42", true], ["example-org/other", 42, false]] as const) {
    const h = harness({ replies: [call("github_issue_update", { repo, issue_number: issue, state: "closed" })] });
    // A follow-up card on issue 42, under a key of the Worker's own.
    const input = { repo: "example-org/harness", issue_number: 42, comment: "Following up." };
    await h.threadState.putProposal({
      operations: [{ toolName: "github_issue_update", input }],
      toolName: "github_issue_update",
      input,
      channel: CHANNEL,
      threadTs: CONVERSATION,
      userMsgTs: "1700000000.000100",
      proposalTs: "worker-1",
      proposalText: "Follow up on #42",
      requesterUserId: "U1",
      supersedeKey: "follow-through:42",
    });
    const second = await turn(h, { text: "close #42", userMsgTs: "1700000000.000300" });

    assert.equal(second.staged!.proposal.revisesProposalTs, revises ? "worker-1" : undefined, repo);
  }
});

/** Two separate PRD cards live in the thread: backup tutors, then reflections. */
async function twoCards(h: Harness): Promise<{ a: string; b: string }> {
  const first = await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "different idea — session reflections", userMsgTs: "1700000000.000300" });
  return { a: first.staged!.proposal.proposalTs, b: second.staged!.proposal.proposalTs };
}

for (const order of ["first", "second"] as const) {
  test(`approve one card and cancel the other, approving the ${order} card first: each acts only on itself`, async () => {
    const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B)] });
    const { a, b } = await twoCards(h);
    const [approve, cancel] = order === "first" ? [a, b] : [b, a];
    const deps = { threadState: h.threadState, standingConfirmers: [] };

    // A button on one card…
    const approved = await resolveSignal({ kind: "button", messageTs: approve, decision: "confirm", userId: "U1" }, deps);
    assert.equal(approved.outcome, "won");
    assert.equal(approved.proposal?.proposalTs, approve);
    assert.deepEqual(await live(h), [cancel], "the other card is still live");

    // …and a reaction on the other.
    const cancelled = await resolveSignal(
      { kind: "reaction", messageTs: cancel, channel: CHANNEL, thread: CONVERSATION, glyph: "no_entry", userId: "U1" },
      deps,
    );
    assert.equal(cancelled.outcome, "won");
    assert.equal(cancelled.decision, "cancel");
    assert.equal(cancelled.proposal?.proposalTs, cancel);
    assert.deepEqual(await live(h), []);
  });
}

test("with two cards live, a change naming one revises that card only, and so does a revision of the revision", async () => {
  const edit = call("notion_create", { ...PRD_A, title: "Backup tutors, matched" });
  const again = call("notion_create", { ...PRD_A, title: "Backup tutor match" });
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B), edit, again] });
  const { a, b } = await twoCards(h);
  naming(edit, a);

  const third = await turn(h, { text: "change the title of the backup tutor one", userMsgTs: "1700000000.000400" });

  const c = third.staged!.proposal.proposalTs;
  assert.equal(third.staged!.proposal.revisesProposalTs, a);
  assert.equal((await h.threadState.getProposalByTs(a)).state, "superseded");
  assert.deepEqual((await live(h)).sort(), [b, c].sort(), "the reflections card is untouched");
  assert.deepEqual(h.delivery.gateNotes.at(-1), { kind: "revised", replaced: "Backup tutor matching" });

  naming(again, c);
  const fourth = await turn(h, { text: "shorter still", userMsgTs: "1700000000.000500" });
  assert.deepEqual((await live(h)).sort(), [b, fourth.staged!.proposal.proposalTs].sort());
});

test("a model naming a card that is not live stages a separate proposal", async () => {
  const h = harness({ replies: [call("notion_create", PRD_A), call("notion_create", PRD_B, "1699999999.000001")] });
  await turn(h, { text: "draft a PRD for backup tutor matching" });
  const second = await turn(h, { text: "and one for reflections", userMsgTs: "1700000000.000300" });

  assert.equal(second.staged!.proposal.revisesProposalTs, undefined);
  assert.equal((await live(h)).length, 2);
});

// Every kind of card a conversation stages, not only PRDs.
// Each: the first card, a different matter, and an edit to the first.
const KINDS: Array<[string, string, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]> = [
  ["share-out", "shareout_post", { project: "Backup tutors", summary: "First pass." }, { project: "Reflections", summary: "Second pass." }, { summary: "First pass, trimmed." }],
  ["relayed DM", "dm_relay", { recipient: "U7", text: "Can you review the backup flow?" }, { recipient: "U8", text: "Reflections are ready." }, { text: "Can you review it today?" }],
  ["GitHub issue", "github_issue_create", { title: "Backup tutor 404", body: "The match page 404s." }, { title: "Reflection form slow", body: "Takes 9 s." }, { body: "The match page 404s on mobile." }],
  [
    "Notion edit",
    "notion_update",
    { page_url: "https://www.notion.so/0123456789abcdef0123456789abcdef", properties: { "Design Status": "Done" } },
    { page_url: "https://www.notion.so/fedcba9876543210fedcba9876543210", properties: { "Design Status": "Done" } },
    { properties: { "Design Status": "Ready for QA" } },
  ],
];

for (const [label, tool, one, other, change] of KINDS) {
  test(`a ${label} card: a different matter stages beside it, an edit naming it revises it`, async () => {
    const edit = call(tool, { ...one, ...change });
    const h = harness({ replies: [call(tool, one), call(tool, other), edit] });
    const first = await turn(h, { text: `first ${label}` });
    const second = await turn(h, { text: `a different ${label}`, userMsgTs: "1700000000.000300" });
    const a = first.staged!.proposal.proposalTs;
    const b = second.staged!.proposal.proposalTs;
    assert.deepEqual((await live(h)).sort(), [a, b].sort(), `two live ${label} cards`);
    assert.equal(h.delivery.gateNotes.at(-1)?.kind, "staged-beside");

    naming(edit, a);
    const third = await turn(h, { text: `change the first ${label}`, userMsgTs: "1700000000.000400" });
    assert.equal(third.staged!.proposal.revisesProposalTs, a);
    assert.deepEqual((await live(h)).sort(), [b, third.staged!.proposal.proposalTs].sort());
  });
}
