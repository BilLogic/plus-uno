// A whole Slack turn, without Slack.
//
// Every case here drives `runTurn` across its own interface — one request in,
// one outcome out — on the three fakes the refactor exists to make possible:
// the recording Delivery, the in-memory ThreadState and the fake
// ModelProvider behind the real agent loop. So the model round-trip, the
// proposal gate, the judges and the history write are all exercised, and
// nothing is stubbed that a designer in Slack would rely on.
//
// What each case asserts is what the turn OBSERVABLY did: what was posted, what
// was staged, what was resolved, what the conversation now remembers.
//
// The harness itself lives in `tests/helpers/turn-harness.ts`, shared with the
// flow tests that drive a turn and then ask Gate what a person was told (#583).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  recordingDelivery,
  runTurn,
  HISTORY_COMPACT_AT,
  HISTORY_KEEP_RECENT,
  type RecordingDelivery,
  type TurnDeps,
  type TurnOutcome,
  type TurnDisposition,
  type TurnRequest,
  type TurnSettlement,
} from "../src/turn/index";
import { batchResultMessage } from "../src/slack/batch-result";
import { renderProposalCard } from "../src/slack/proposal-render";
import { executeRelayDm, type RelaySlack } from "../src/tools/relay-dm";
import {
  createInMemoryThreadState,
  type HistoryTurn,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";
import {
  CHANNEL,
  CONVERSATION,
  DEFAULT_CONFIRM_NOTE,
  ISSUE_REPO,
  PENDING,
  REF,
  harness,
  postsOf,
  request,
  stage,
  type Harness,
} from "./helpers/turn-harness";


// ── (a) a pending proposal, and the reply that resolves it ───────────────────

test("a typed ✅ against a pending proposal resolves it and posts exactly once", async () => {
  const h = harness();
  await stage(h);
  const outcome: TurnOutcome = await runTurn(
    request({ text: ":white_check_mark:", pending: PENDING }),
    h.deps,
  );

  assert.equal(outcome.disposition, "resolved");
  // ONE resolution, through the same claim every other confirmation path uses.
  assert.deepEqual(h.resolved, [
    {
      toolName: "notion_create",
      decision: "confirm",
      note: DEFAULT_CONFIRM_NOTE,
      executed: true,
    },
  ]);
  // The gate's own verdict, said once, through Delivery — as the MEANING the
  // turn handed over, not the line Slack spells from it (#623).
  assert.deepEqual(h.delivery.gateNotes, [DEFAULT_CONFIRM_NOTE]);
  // And the card is gone: the claim took it.
  assert.equal(await h.threadState.getProposalByThread(REF), null);
  // And nothing else was said: no answer, no second card, no model call.
  assert.equal(h.provider.sends.length, 0);
  assert.equal(
    h.delivery.calls.filter((c) => c.kind === "answer" || c.kind === "proposal").length,
    0,
  );
  // The exchange is still remembered, both halves.
  const stored = await h.threadState.readHistory(REF);
  assert.deepEqual(
    stored.map((t) => t.role),
    ["user", "assistant"],
  );
  assert.match(stored[1]!.content, /confirmed/);
});

test("a typed reply the model reads as approval resolves the card once", async () => {
  // "yes please" is not an emoji, so it goes to the model — which reads the
  // pending proposal in context and calls `proposal_resolve`. The turn must
  // execute that, not stage a second card.
  const h = harness({
    replies: [
      {
        toolCalls: [
          {
            name: "proposal_resolve",
            args: { decision: "confirm", message_to_user: "Filing it now." },
          },
        ],
      },
    ],
  });
  await stage(h);
  const outcome = await runTurn(request({ text: "yes please", pending: PENDING }), h.deps);

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved, [
    {
      toolName: "notion_create",
      decision: "confirm",
      note: { kind: "said", text: "Filing it now." },
      executed: true,
    },
  ]);
  assert.equal(outcome.posted, "Filing it now.");
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 0);
});

// ── (b) an image reaches the provider ────────────────────────────────────────

test("an image on the request reaches the model, and the tier routed in Turn goes with it", async () => {
  const h = harness();
  const outcome = await runTurn(
    request({
      text: "what's wrong with this frame?",
      images: [{ media_type: "image/png", data: "aGVsbG8=" }],
    }),
    h.deps,
  );

  assert.equal(outcome.disposition, "answered");
  const started = h.provider.started;
  assert.ok(started, "the loop opened the turn on the provider");
  const withImages = started.conversation.filter((t) => (t.images?.length ?? 0) > 0);
  assert.equal(withImages.length, 1);
  assert.equal(withImages[0]!.images![0]!.data, "aGVsbG8=");
  // Routing happened HERE and travelled down as an opaque name.
  assert.equal(started.tier, "default");
  assert.equal(outcome.telemetry.tier, "default");
  assert.equal(outcome.telemetry.route, "default-tier");
});

// ── (c) a draft the judge rejects ────────────────────────────────────────────

test("a draft-judge rejection posts the revision, not the draft", async () => {
  const h = harness({
    replies: [{ text: "The blueprint says nothing about call-offs." }],
    judge: ({ draft }) => ({
      text: `${draft} (revised: scoped to the paths I read.)`,
      verdict: "fail",
    }),
  });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(h.judged.length, 1, "the judge saw the draft");
  assert.match(outcome.posted ?? "", /revised: scoped to the paths I read/);
  assert.deepEqual(postsOf(h.delivery), [outcome.posted]);
  assert.equal(outcome.telemetry.judge, "fail");
  // What was posted is what is remembered — not the draft that lost.
  const stored = await h.threadState.readHistory(REF);
  assert.match(stored[1]!.content, /revised/);
});

// ── (c2) the pre-send chain, as the judge actually receives it ───────────────
//
// The five checks a draft passes before it ships are pure and thoroughly
// tested one by one (`tests/confidence.test.ts`, `tests/absence.test.ts`,
// `tests/draft-judge.test.ts`). The rules that FAIL are in the call, and they
// were unobservable until #625: the harness kept the draft and threw every
// other argument away, so nothing could see whether two repairs competed as
// two calls, what force reason bypassed the length floor, or what the judge
// was told the turn had fetched.
//
// A SEARCH THAT FOUND NOTHING. Scripted as a real loop tool call — the ledger
// is production's — with the empty-search signal injected, because production
// derives that from the tool result inside `run-agent.ts` and this harness
// runs a fake tool table.
const SEARCH_REPLY = {
  text: "Looking for a deadline.",
  toolCalls: [{ name: "slack_search", args: { query: "reflection deadline" } }],
};
const FOUND_NOTHING = { visibility: "bot-token", searchedSurfaces: "public channels" };

test("both repairs ride ONE judge call, and the forced reason names the confidence kind", async () => {
  const h = harness({
    absence: FOUND_NOTHING,
    replies: [
      SEARCH_REPLY,
      // Unscoped absence AND no word about what it rests on: both pre-checks
      // fire on the same draft.
      { text: "Nobody has mentioned a hard deadline for the reflection redesign." },
    ],
  });
  const outcome = await runTurn(request({ text: "has anyone set a deadline?" }), h.deps);

  assert.equal(outcome.disposition, "answered");
  // ONE call. Sent as two sibling instructions the repairs compete and the
  // model does one of them.
  assert.equal(h.judged.length, 1);
  const call = h.judged[0]!;
  assert.match(call.extraInstruction ?? "", /never says what was\s+checked/);
  assert.match(call.extraInstruction ?? "", /ABSENCE SCOPE/);
  // The force reason is the CONFIDENCE kind when confidence is what fired —
  // the absence scope is carried by the instruction, not by a second reason.
  assert.equal(call.forceReason, "absent");
  assert.equal(outcome.telemetry.confidence, "absent");
  // And the judge is told what actually ran, which is what makes D9 judgeable.
  assert.deepEqual(call.toolsUsedThisTurn, ["slack_search"]);
  assert.equal(call.correction, false);
});

test("an absence-only failure forces the judge under its own reason", async () => {
  const h = harness({
    absence: FOUND_NOTHING,
    replies: [
      SEARCH_REPLY,
      // Calibrated ("I checked …") but still absolute about the world.
      { text: "Nobody has mentioned a hard deadline. I checked the Roadmap board and it lists no date." },
    ],
  });
  const outcome = await runTurn(request({ text: "has anyone set a deadline?" }), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(h.judged.length, 1);
  const call = h.judged[0]!;
  assert.equal(outcome.telemetry.confidence, "ok", "confidence had nothing to repair");
  assert.equal(call.forceReason, "absence-scope");
  assert.match(call.extraInstruction ?? "", /^ABSENCE SCOPE/);
  // The scope is the one the search REPORTED, never a hardcoded "public".
  assert.match(call.extraInstruction ?? "", /visibility "bot-token" over: public channels/);
});

test("a cache-served receipt escalates a freshness claim", async () => {
  const h = harness({
    replies: [
      {
        text: "Checking the blueprint.",
        toolCalls: [{ name: "search_blueprint", args: { query: "call-off" } }],
      },
      { text: "I checked the blueprint just now — a call-off opens the slot a fill-in claims." },
    ],
    // The rows came from the short-lived cache, so "just now" is a false
    // claim rather than a missing one — the 2026-08-17 shape.
    receipt: { tool: "search_blueprint", query: "call-off", count: 3, scenarios: [], cached: true },
  });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(outcome.telemetry.confidence, "false-freshness");
  const call = h.judged[0]!;
  assert.equal(call.forceReason, "false-freshness");
  assert.match(call.extraInstruction ?? "", /claims its information is current/);
  // Nothing else fired, so nothing else was asked for.
  assert.doesNotMatch(call.extraInstruction ?? "", /ABSENCE SCOPE/);
  assert.deepEqual(call.toolsUsedThisTurn, ["search_blueprint"]);
});

test("the same draft over a LIVE read is not escalated", async () => {
  // The control for the case above: same claim, same tool, receipt not cached
  // — and the chain has nothing to repair, so the judge is not forced.
  const h = harness({
    replies: [
      {
        text: "Checking the blueprint.",
        toolCalls: [{ name: "search_blueprint", args: { query: "call-off" } }],
      },
      { text: "I checked the blueprint just now — a call-off opens the slot a fill-in claims." },
    ],
    receipt: { tool: "search_blueprint", query: "call-off", count: 3, scenarios: [] },
  });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.telemetry.confidence, "ok");
  assert.equal(h.judged[0]!.forceReason, undefined);
  assert.equal(h.judged[0]!.extraInstruction, undefined);
});

test("a reply Slack never accepted is reported as a failure and never remembered as posted", async () => {
  const h = harness({ delivery: recordingDelivery({ answerFails: true }) });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "failed");
  assert.deepEqual(outcome.failure, { stage: "delivery" });
  const stored = await h.threadState.readHistory(REF);
  assert.deepEqual(
    stored.map((t) => t.role),
    ["user"],
    "the user half is recorded; the assistant half is not invented",
  );
});

// ── (d) history: both halves, and compaction at the cap ──────────────────────

test("the exchange is appended with both halves, and compacted once the store is full", async () => {
  const threadState = createInMemoryThreadState();
  // Fill the conversation to just short of the compaction point, so this turn's
  // pair crosses it. The opening turn is the one the store's own cap would drop
  // first, which is why compaction happens before the cap is reached.
  await threadState.appendHistory(REF, { role: "user", content: "the opening question" });
  for (let i = 1; i < HISTORY_COMPACT_AT - 2; i++) {
    await threadState.appendHistory(REF, {
      role: i % 2 ? "assistant" : "user",
      content: `filler ${i}`,
    });
  }
  const before = await threadState.readHistory(REF);
  assert.equal(before.length, HISTORY_COMPACT_AT - 2);

  const h = harness({ threadState, replies: [{ text: "Here is the answer." }] });
  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.deepEqual(
    outcome.wrote.turns.map((t) => t.role),
    ["user", "assistant"],
    "both halves of the exchange are reported as written",
  );
  assert.ok(outcome.wrote.compacted > 0, "compaction ran and said how much it dropped");

  const after = await threadState.readHistory(REF);
  assert.equal(after.length, HISTORY_KEEP_RECENT + 1);
  assert.equal(after[0]!.content, "the opening question", "the goal of the conversation survives");
  assert.equal(after.at(-1)!.content, "Here is the answer.");
});

test("the user turn carries this turn's retrieval receipt", async () => {
  // The receipt rides the USER turn because the user message's ts is the only
  // key the reply path has to merge on.
  const h = harness();
  const withReceipt: TurnDeps = {
    ...h.deps,
    async runAgent(req) {
      const run = await h.deps.runAgent(req);
      return {
        ...run,
        receipt: { tool: "search_blueprint", query: "call-off", count: 3, scenarios: ["Call-Off"] },
      };
    },
  };
  await runTurn(request(), withReceipt);

  const stored: HistoryTurn[] = await h.threadState.readHistory(REF);
  assert.equal(stored[0]!.retrieval?.query, "call-off");
  assert.equal(stored[0]!.ts, "1700000000.000200");
  assert.equal(stored[1]!.retrieval, undefined);
});

// ── (e) a proposal to stage ──────────────────────────────────────────────────

test("a side-effect call comes back as a proposal to stage, and the card was delivered", async () => {
  const h = harness({
    replies: [
      {
        text: "I'll file a Roadmap card for the reflection redesign.",
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.ok(outcome.staged, "the outcome carries the proposal");
  assert.equal(outcome.staged.proposal.toolName, "notion_create");
  assert.deepEqual(outcome.staged.proposal.input, { title: "Reflection redesign" });
  // The card went out through Delivery, and its ts is the proposal's identity.
  const cards = h.delivery.calls.filter((c) => c.kind === "proposal");
  assert.equal(cards.length, 1);
  assert.equal(outcome.staged.proposal.proposalTs, h.delivery.stagedAt[0]);
  // WHAT THE CARD MEANS, not how Slack spells it: the staged title is a field
  // on the card the turn handed over (#623).
  assert.deepEqual(outcome.staged.card.fields, [
    { label: "title", value: "Reflection redesign" },
  ]);
  assert.equal(outcome.staged.card.kind, "confirm");
  // And it is confirmable the moment it posts: the store has it.
  const staged = await h.threadState.getProposalByThread(REF);
  assert.equal(staged?.proposalTs, h.delivery.stagedAt[0]);
});

// A GitHub intake is a gated write to a PUBLIC repo, so the card is where a
// person reads exactly what goes public: the title and body verbatim, and the
// fact that anyone can read it. Nothing reaches GitHub until the ✅.
test("'track this on GitHub' stages an issue card showing the title, the body and the public repo", async () => {
  const title = "uno-bot can't open a GitHub issue from Slack";
  const body =
    "**Problem.** Asked to track a gap on GitHub, uno-bot says it can't.\n\n" +
    "**Expected.** It files the issue after a ✅.";
  const filed: string[] = [];
  const h = harness({
    replies: [
      {
        text: "I'll file this as a GitHub intake.",
        toolCalls: [{ name: "github_issue_create", args: { title, body } }],
      },
    ],
    executeOperation: async (operation) => {
      filed.push(operation.toolName);
      return JSON.stringify({ ok: true });
    },
  });
  const outcome = await runTurn(
    request({ text: "the bot can't file GitHub issues — track this on GitHub for someone to fix" }),
    h.deps,
  );

  assert.equal(outcome.disposition, "staged");
  assert.equal(outcome.staged!.proposal.toolName, "github_issue_create");
  assert.deepEqual(outcome.staged!.proposal.input, { title, body });

  const card = outcome.staged!.card;
  // The heading names the repo the Worker files into — read, never a literal.
  assert.equal(card.verb, `file a GitHub issue on ${ISSUE_REPO}`);
  assert.deepEqual(card.fields, [
    { label: "title", value: title },
    { label: "body", value: body },
  ]);
  assert.deepEqual(card.caveats, [{ kind: "repo-visibility", repo: ISSUE_REPO, visibility: "public" }]);
  // And as a person reads it: both verbatim, and the repo named public, once.
  const text = renderProposalCard(card).text;
  assert.ok(text.includes(`About to *file a GitHub issue on ${ISSUE_REPO}*`), text);
  assert.ok(text.includes(title), text);
  assert.ok(text.includes(body), text);
  assert.ok(text.includes(`${ISSUE_REPO}* is public`), text);
  assert.equal(text.match(/public/gi)?.length, 1, text);

  // Staged, not filed: the store holds the card and nothing was executed.
  assert.equal((await h.threadState.getProposalByThread(REF))?.toolName, "github_issue_create");
  assert.deepEqual(filed, []);
  assert.deepEqual(h.ran, []);
  assert.deepEqual(h.resolved, []);
});
// A marketing-site bug belongs on the marketing site's repo: the model names
// it, and the card's heading and notice are the resolved repo's, read.
test("a marketing-site 'track this' stages a card naming plus-marketing-website and its visibility", async () => {
  const SITE = "BilLogic/plus-marketing-website";
  const input = { title: "Hero CTA links nowhere", body: "The hero button on the home page 404s.", repo: SITE };
  const asked: Array<Record<string, unknown>> = [];
  const h = harness({
    replies: [{ text: "Filing it on the marketing site.", toolCalls: [{ name: "github_issue_create", args: input }] }],
    issueTarget(staged) {
      asked.push(staged);
      return { repo: String(staged.repo), visibility: "public" };
    },
    executeOperation: async () => {
      throw new Error("nothing reaches GitHub before the ✅");
    },
  });
  const outcome = await runTurn(
    request({ text: "the hero button on the marketing site 404s — track this on GitHub" }),
    h.deps,
  );

  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(outcome.staged!.proposal.input, input);
  assert.deepEqual(asked, [input], "the card read the staged repo");
  const card = outcome.staged!.card;
  assert.equal(card.verb, `file a GitHub issue on ${SITE}`);
  assert.deepEqual(card.caveats, [{ kind: "repo-visibility", repo: SITE, visibility: "public" }]);
  assert.ok(renderProposalCard(card).text.includes(`${SITE}* is public`));
  assert.deepEqual(h.ran, []);
});

// The requester stays in control of routing: "put it on plus-uno instead"
// retires the first card and stages one naming the new repo.
test("redirecting an intake's repo supersedes its card with one naming the new repo", async () => {
  const SITE = "BilLogic/plus-marketing-website";
  const HARNESS = "BilLogic/plus-uno";
  const draft = { title: "Hero CTA links nowhere", body: "The hero button on the home page 404s." };
  const h = harness({
    replies: [
      { text: "Filing it on the marketing site.", toolCalls: [{ name: "github_issue_create", args: { ...draft, repo: SITE } }] },
      { text: "Moving it to plus-uno.", toolCalls: [{ name: "github_issue_create", args: { ...draft, repo: HARNESS } }] },
    ],
    issueTarget: (staged) => ({ repo: String(staged.repo), visibility: "public" }),
  });

  const first = await runTurn(request({ text: "the hero button 404s — track this on GitHub" }), h.deps);
  assert.equal(first.staged!.card.verb, `file a GitHub issue on ${SITE}`);
  const firstTs = first.staged!.proposal.proposalTs;

  const second = await runTurn(
    request({ text: "put it on plus-uno instead", pending: first.staged!.proposal }),
    h.deps,
  );
  assert.equal(second.disposition, "staged");
  assert.equal(second.staged!.card.verb, `file a GitHub issue on ${HARNESS}`);
  assert.deepEqual(second.staged!.card.caveats, [{ kind: "repo-visibility", repo: HARNESS, visibility: "public" }]);
  assert.equal((await h.threadState.getProposalByTs(firstTs)).state, "superseded");
  assert.equal((await h.threadState.getProposalByThread(REF))?.proposalTs, second.staged!.proposal.proposalTs);
  assert.deepEqual(h.ran, []);
});

test("an intake card says a private repo is private, and a repo it couldn't check may be public", async () => {
  for (const [visibility, words] of [
    ["private", "* is private"],
    ["unknown", "* may be public"],
  ] as const) {
    const h = harness({
      replies: [{ text: "Filing it.", toolCalls: [{ name: "github_issue_create", args: { title: "A gap", body: "Details." } }] }],
      issueTarget: () => ({ repo: ISSUE_REPO, visibility }),
    });
    const outcome = await runTurn(request({ text: "track this on GitHub" }), h.deps);
    const text = renderProposalCard(outcome.staged!.card).text;
    assert.ok(text.includes(`${ISSUE_REPO}${words}`), text);
    if (visibility === "private") assert.doesNotMatch(text, /public/i);
  }
});


// A revised card retires the one it replaces (#573) — and a turn that stages
// nothing retires nothing. Someone asking a question while a card is pending
// must come back to a card that still resolves.
test("a turn that stages nothing leaves the pending card alone", async () => {
  const h = harness({ replies: [{ text: "The blueprint says nothing about call-offs." }] });
  await stage(h);

  const outcome = await runTurn(request({ text: "what does the blueprint say?" }), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal((await h.threadState.getProposalByTs(PENDING.proposalTs)).state, "found");
  assert.equal((await h.threadState.getProposalByThread(REF))?.proposalTs, PENDING.proposalTs);
});

// The second card is the one the person is looking at, so it is the one that
// resolves; the first is retired rather than left live for its full hour with
// the input they pushed back on still loaded.
//
// THE REQUEST CARRIES `pending`, and that is load-bearing (#583). This case
// passed `pending: null` for two releases, so the staging path's retirement of
// the card it is revising never ran in it — and that retirement, done by
// CLAIMING (which deletes), is exactly what made the replaced-card message
// unreachable in production while this test stayed green. With the real
// argument in, the store-level assertion below pins the retire call.
test("staging a revised card supersedes the one it replaces", async () => {
  const h = harness({
    replies: [
      {
        text: "Filing the revised card.",
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign v2" } }],
      },
    ],
  });
  await stage(h);

  const outcome = await runTurn(
    request({ text: "make it about reflections only", pending: PENDING }),
    h.deps,
  );

  assert.equal(outcome.disposition, "staged");
  const revisedTs = outcome.staged!.proposal.proposalTs;
  assert.equal((await h.threadState.getProposalByTs(PENDING.proposalTs)).state, "superseded");
  // And the thread's live card is the new one.
  assert.equal((await h.threadState.getProposalByThread(REF))?.proposalTs, revisedTs);
});

test("a rewrite ask stages a replace, and never a silent append", async () => {
  // The Calendar Sync shape (2026-09-15): a page said something that had stopped
  // being true, and append-only meant the correction could only land BELOW the
  // stale text, leaving the page holding both readings. A replace carries the
  // block id and the stamp the read reported, so the gate card and the write
  // are about ONE block rather than about the bottom of the page.
  const REPLACE = {
    page_url: "https://notion.so/Calendar-Sync-2a2a2a2a",
    replace: [
      {
        block_id: "1f2e3d4c-5b6a-7980-1234-56789abcdef0",
        last_edited_time: "2026-09-15T14:02:00.000Z",
        content: "Sync runs hourly, not nightly.",
      },
    ],
  };
  const h = harness({
    replies: [
      {
        text: "I'll correct that line in place.",
        toolCalls: [{ name: "notion_update", args: REPLACE }],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "the TLDR on the Calendar Sync page is wrong — fix it" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.equal(outcome.staged?.proposal.toolName, "notion_update");
  // The whole operation reaches the store intact — the stamp included, because
  // it is what the write checks before it touches the block.
  assert.deepEqual(outcome.staged?.proposal.input, REPLACE);
  assert.equal((outcome.staged?.proposal.input as Record<string, unknown>).append, undefined);
});

test("several side-effect calls in one reply stage ONE proposal that holds all of them", async () => {
  const h = harness({
    replies: [
      {
        text: "Reconciling the four docs after the scope change.",
        toolCalls: [
          { name: "notion_update", args: { title: "Calendar Sync hub", heading: "TLDR" } },
          { name: "notion_update", args: { title: "Calendar Sync PRD", heading: "Scope" } },
          { name: "notion_create", args: { surface: "decision", title: "Calendar Sync cut" } },
        ],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "update the notion docs accordingly" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.ok(outcome.staged, "the outcome carries the proposal");
  // ONE card, not three, and not one operation with two dropped.
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 1);
  assert.deepEqual(
    outcome.staged.proposal.operations?.map((o) => o.toolName),
    ["notion_update", "notion_update", "notion_create"],
  );
  // The card CARRIES every one of them — the ✅ is consent to the whole batch,
  // so the batch is on the card as data and not as a sentence about it (#623).
  assert.deepEqual(
    outcome.staged.card.operations.map((o) => o.input.title),
    ["Calendar Sync hub", "Calendar Sync PRD", "Calendar Sync cut"],
  );
  // And the store holds the whole batch, so a later ✅ runs all of it.
  const staged = await h.threadState.getProposalByThread(REF);
  assert.equal(staged?.operations?.length, 3);
});

// A relayed DM: the card names the person and shows the words, nobody's inbox
// hears anything until the ✅, and the ✅ reaches each recipient once.
test("'send this to <@…>' stages a relayed DM, and only the ✅ sends it — once per recipient", async () => {
  const text = "RM-2436 Calendar Sync is Ready for QA:\n<https://notion.so/rm-2436|the card>";
  const opened: string[] = [];
  const dms: Array<{ channel: string; text: string }> = [];
  const slack: RelaySlack = {
    async openDm(userId) {
      opened.push(userId);
      return { ok: true, channel: `D-${userId}` };
    },
    async postMessage(message) {
      if (message.channel.startsWith("D-")) dms.push(message);
      return { ok: true };
    },
    async permalink(channel, ts) {
      return `https://plus.slack.com/archives/${channel}/p${ts.replace(".", "")}`;
    },
  };
  const h = harness({
    replies: [
      {
        text: "I'll pass the card along to both of them.",
        toolCalls: [
          { name: "dm_relay", args: { recipient: "<@U0COCO>", text } },
          { name: "dm_relay", args: { recipient: "U0MERYEM", text } },
        ],
      },
    ],
    executeOperation: (op) =>
      executeRelayDm({ slack }, op.input, {
        channel: CHANNEL,
        threadTs: CONVERSATION,
        replyTs: CONVERSATION,
        userMsgTs: "1700000000.000200",
        requestedBy: "U1",
      }),
  });

  const outcome = await runTurn(
    request({ text: "can you send this to <@U0COCO> and <@U0MERYEM>?" }),
    h.deps,
  );

  assert.equal(outcome.disposition, "staged");
  assert.ok(outcome.staged);
  // ONE card for both recipients, one operation each.
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 1);
  assert.deepEqual(
    outcome.staged.proposal.operations?.map((o) => o.toolName),
    ["dm_relay", "dm_relay"],
  );
  // The card names each recipient as a mention and carries the text verbatim.
  const card = renderProposalCard(outcome.staged.card).text;
  assert.match(card, /send a DM on your behalf/);
  assert.ok(card.includes("<@U0COCO>"), card);
  assert.ok(card.includes("<@U0MERYEM>"), card);
  assert.ok(card.includes(text), card);
  // Nothing reached anyone: staging opens no DM.
  assert.equal(opened.length, 0);
  assert.equal(dms.length, 0);

  const pending = await h.threadState.getProposalByThread(REF);
  assert.ok(pending);
  await runTurn(request({ text: ":white_check_mark:", pending }), h.deps);

  assert.deepEqual(opened, ["U0COCO", "U0MERYEM"]);
  assert.deepEqual(dms.map((d) => d.channel), ["D-U0COCO", "D-U0MERYEM"]);
  for (const dm of dms) {
    assert.ok(dm.text.startsWith("<@U1> asked me to pass this on:"), dm.text);
    assert.ok(dm.text.includes(text));
    assert.ok(dm.text.includes("https://plus.slack.com/archives/C1/p1700000000000200"), dm.text);
  }
  assert.deepEqual(h.ran.map((o) => o.ok), [true, true]);
});

test("what the card lists is what ThreadState holds — four pages, mixed kinds, none missing", async () => {
  const operations = [
    {
      name: "notion_update",
      args: {
        page_url: "https://notion.so/hub",
        title: "Calendar Sync hub",
        replace: [
          {
            block_id: "24f0c2410aa1",
            last_edited_time: "2026-09-14T10:00:00.000Z",
            before: "The sync runs nightly.",
            content: "The sync runs hourly.",
          },
        ],
      },
    },
    {
      name: "notion_update",
      args: {
        page_url: "https://notion.so/prd",
        title: "Calendar Sync PRD",
        properties: { design_status: "Ready for QA" },
      },
    },
    {
      name: "notion_update",
      args: {
        page_url: "https://notion.so/runbook",
        title: "Calendar Sync runbook",
        append: { sections: [{ heading: "Rollback", body: "…" }] },
      },
    },
    { name: "notion_create", args: { surface: "decision", title: "Calendar Sync cut" } },
  ];
  const h = harness({
    replies: [{ text: "Reconciling the docs after the scope change.", toolCalls: operations }],
  });

  const outcome = await runTurn(request({ text: "update the notion docs accordingly" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  const stored = await h.threadState.getProposalByThread(REF);
  assert.deepEqual(
    stored?.operations?.map((o) => o.input.title),
    operations.map((o) => o.args.title),
  );
  // The card's numbered list IS the stored batch: same count, same order, and
  // each operation named by the kind it will run.
  // Rendered HERE, through the adapter's one renderer: the turn hands over the
  // batch and Slack's spelling of it is `proposal-render.ts`'s (#623), so what
  // a person reads is asserted against that rendering rather than against a
  // card that no longer carries any.
  const cardText = outcome.staged ? renderProposalCard(outcome.staged.card).text : "";
  const listed = [...cardText.matchAll(/^ {2}(\d+)\. \*(.+?)\*(.*)$/gm)];
  assert.deepEqual(
    listed.map((m) => m[1]),
    ["1", "2", "3", "4"],
  );
  assert.deepEqual(
    listed.map((m) => m[2]),
    ["replace in place", "set properties", "append", "create row"],
  );
  // Grouped by what each one touches — one heading per page, four in all.
  const headings = [
    ...cardText.matchAll(/^\*(?:<[^|]+\|)?([^*>]+)>?\*(?: \(Notion data source\))?$/gm),
  ];
  assert.deepEqual(
    headings.map((m) => m[1]),
    ["Calendar Sync hub", "Calendar Sync PRD", "Calendar Sync runbook", "decision"],
  );
  // And the rewrite shows what the block says now, beside what it will say.
  assert.match(cardText, /_The sync runs nightly\._ → _The sync runs hourly\._/);
});

test("a ✅ on a batch runs every operation in order, and a failure hides none of the others", async () => {
  const operations = [
    { toolName: "notion_update", input: { title: "Calendar Sync hub" } },
    { toolName: "notion_update", input: { title: "Calendar Sync PRD" } },
    { toolName: "notion_create", input: { surface: "decision", title: "Calendar Sync cut" } },
  ];
  const order: string[] = [];
  const h = harness({
    async executeOperation(operation) {
      order.push(String(operation.input.title));
      // Operation two fails; one and three are still approved and still run.
      return operation.input.title === "Calendar Sync PRD"
        ? JSON.stringify({ ok: false, error: "the block moved since it was read" })
        : JSON.stringify({ ok: true, message: `updated ${String(operation.input.title)}` });
    },
  });
  const batch = { ...PENDING, operations };
  await h.threadState.putProposal(batch);

  const outcome = await runTurn(
    request({ text: ":white_check_mark:", pending: batch }),
    h.deps,
  );

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(order, ["Calendar Sync hub", "Calendar Sync PRD", "Calendar Sync cut"]);
  assert.deepEqual(
    h.ran.map((o) => o.ok),
    [true, false, true],
  );
  // Both outcomes are reported — a partial result is visible, not hidden behind
  // the operation that worked.
  const message = batchResultMessage(h.ran) ?? "";
  assert.match(message, /2 done, 1 failed/);
  assert.match(message, /the block moved since it was read/);
  assert.match(message, /updated Calendar Sync hub/);
  assert.match(message, /updated Calendar Sync cut/);
});

test("a tool call that is missing what it needs asks instead of staging", async () => {
  // Two replies because the model gets one go at fixing the call itself: the
  // first refusal goes back to it as the call's result, and it is the SECOND
  // refusal that the person hears.
  const h = harness({
    replies: [
      { toolCalls: [{ name: "component_implement", args: { component: "Button" } }] },
      { toolCalls: [{ name: "component_implement", args: { component: "Button" } }] },
    ],
    preflightAsk: "Which PRD is this implementing?",
  });
  const outcome = await runTurn(request({ text: "implement the Button change" }), h.deps);

  assert.equal(outcome.disposition, "asked");
  assert.equal(outcome.posted, "Which PRD is this implementing?");
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 0);
  assert.equal(await h.threadState.getProposalByThread(REF), null);
});

test("a refusal the model can fix never reaches the person — the corrected call is staged", async () => {
  const h = harness({
    replies: [
      { toolCalls: [{ name: "notion_create", args: { surface: "decision", title: "[TBD]" } }] },
      {
        toolCalls: [
          { name: "notion_create", args: { surface: "decision", title: "Calendar Sync scope cut" } },
        ],
      },
    ],
    preflightFor: (_tool, input) =>
      input.title === "[TBD]"
        ? "I won't file that decision record yet — the *title* is still a placeholder (`[TBD]`)."
        : null,
  });

  const outcome = await runTurn(request({ text: "record the scope cut" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(outcome.staged?.proposal.input, {
    surface: "decision",
    title: "Calendar Sync scope cut",
  });
  // The person saw a card, not the bot arguing with itself.
  assert.deepEqual(
    postsOf(h.delivery).filter((p) => p.includes("placeholder")),
    [],
  );
});

test("the same proposal re-staged while one is pending is read as the confirmation", async () => {
  // The 2026-07-10 shape: the person said "go ahead", and the model reached for
  // the tool again instead of `proposal_resolve`.
  const h = harness({
    replies: [
      {
        toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
      },
    ],
  });
  await stage(h);
  const outcome = await runTurn(
    request({ text: "go ahead and do that please", pending: PENDING }),
    h.deps,
  );

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(h.resolved, [
    {
      toolName: "notion_create",
      decision: "confirm",
      note: DEFAULT_CONFIRM_NOTE,
      executed: true,
    },
  ]);
  assert.equal(h.delivery.calls.filter((c) => c.kind === "proposal").length, 0);
});

// ── a stop press ─────────────────────────────────────────────────────────────

test("a stop pressed while a one-iteration turn is in flight suppresses the answer", async () => {
  // The production failure (#589): this turn answers on ITERATION 0, and the
  // flag was only read from iteration 2 — so the press was written, never read,
  // and the answer landed under the stop line that had just promised it would
  // not.
  const h = harness({ cancelKey: REF, replies: [{ text: "Here is the answer." }] });
  await h.threadState.requestCancel(REF);

  const outcome = await runTurn(request(), h.deps);

  assert.equal(outcome.disposition, "stopped");
  // NOTHING was said. The door that took the press posts the confirmation
  // naming who pressed (`slack/session-stop.ts`), so a line from here would be
  // the second stop message for one press.
  assert.deepEqual(postsOf(h.delivery), []);
  assert.equal(h.delivery.calls.filter((c) => c.kind === "answer").length, 0);
  // The press was already standing when the loop took its first look, so the
  // model was never called — and this turn would have answered on iteration 0,
  // where the old rule never looked at all.
  assert.equal(h.provider.sends.length, 0);
  // One press, one stop: the flag is consumed, so the next question in this
  // thread is answered normally.
  assert.equal(await h.threadState.consumeCancel(REF), false);
  // And the thread remembers the exchange, both halves, as the reaction-only
  // turn does — a question with no answer, rather than a gap.
  const stored = await h.threadState.readHistory(REF);
  assert.deepEqual(
    stored.map((t) => t.role),
    ["user", "assistant"],
  );
  assert.match(stored[1]!.content, /stopped/);
});

// ── the effects a turn has along the way ─────────────────────────────────────

test("a channel turn acknowledges with 👀; the assistant surface says it is working instead", async () => {
  const channelTurn = harness();
  await runTurn(request(), channelTurn.deps);
  assert.deepEqual(
    channelTurn.delivery.calls.filter((c) => c.kind === "react"),
    [{ kind: "react", emoji: "eyes" }],
  );

  const panelTurn = harness();
  await runTurn(request({ surface: "assistant", threaded: false }), panelTurn.deps);
  assert.equal(panelTurn.delivery.calls.filter((c) => c.kind === "react").length, 0);
  const working = panelTurn.delivery.calls.find((c) => c.kind === "working");
  assert.equal(working?.status, "is thinking…");
  // A thread this turn opened is the one it may name.
  assert.equal(working?.titleFrom, "how does a call-off reach a fill-in?");
});

test("a trivial turn skips the working signals and the progress surface", async () => {
  const h = harness({ replies: [{ text: "Anytime." }] });
  // `chill` is the short-reply-to-a-proposal route: the one turn shape routing
  // can be sure is cheap.
  const outcome = await runTurn(request({ text: "thanks!", pending: PENDING }), h.deps);

  assert.equal(outcome.telemetry.tier, "chill");
  assert.equal(outcome.telemetry.trivial, true);
  assert.equal(h.delivery.calls.filter((c) => c.kind === "beginProgress").length, 0);
  // And nothing is cleared: the exit funnel takes down what the turn RAISED,
  // so a turn that raised nothing leaves the surface alone.
  assert.deepEqual(workingSignalOf(h.delivery), []);
});

/** The working signal's whole life in one turn, in order. */
const workingSignalOf = (delivery: RecordingDelivery): string[] =>
  delivery.calls
    .filter((c) => c.kind === "working" || c.kind === "working-clear")
    .map((c) => c.kind);

/** What the clear told the surface the thread now needs. */
const clearedWith = (delivery: RecordingDelivery): TurnSettlement | undefined =>
  delivery.calls.find((c) => c.kind === "working-clear")?.settlement;

// Every door the turn can leave by, and what the person's surface says after it.
//
// The incident this pins: a channel thread that showed "is working…" through a
// reply, a pending card and a finished gate run, because the set had nine exits
// and the clear had one — in another file, gated to DMs. So the assertion is
// not "a clear happens somewhere" but the whole sequence, set then clear and
// nothing else, on both surfaces. A door added later that skips it fails here.
//
// `settles` is the second half of the same list (#575): taking the indicator
// down is not the same as saying the thread is ready, and several of these
// doors leave a person owing a decision. The status word each settlement
// becomes is asserted in `working-signal.test.ts`; what is pinned here is that
// a REAL turn through each door reports the right one, on both surfaces.
//
// `disposition` names the door in the turn's own vocabulary, and it is here
// because without it the table asserted only that SOME outcome came back — a
// row could stop exercising the door it is named after and nothing would say
// so. One did: "a clarifying ask" had been answering instead of asking since
// it was written, because it scripted one refusal where the model gets two.
const EXITS: Array<{
  door: string;
  disposition: TurnDisposition;
  settles: TurnSettlement;
  run: (surface: "channel" | "assistant") => Promise<{ h: Harness; outcome: TurnOutcome }>;
}> = [
  {
    door: "an answer",
    disposition: "answered",
    settles: "idle",
    run: async (surface) => {
      const h = harness();
      return { h, outcome: await runTurn(request({ surface }), h.deps) };
    },
  },
  {
    door: "a clarifying ask",
    disposition: "asked",
    settles: "waiting-on-person",
    run: async (surface) => {
      // TWO refusals, because the model gets one go at fixing the call itself
      // and it is the second refusal the person hears. With one reply this
      // door answered instead of asking — which the settlement below is what
      // caught: a check on the clear's presence alone could not see it.
      const h = harness({
        replies: [
          { toolCalls: [{ name: "component_implement", args: { component: "Button" } }] },
          { toolCalls: [{ name: "component_implement", args: { component: "Button" } }] },
        ],
        preflightAsk: "Which PRD is this implementing?",
      });
      return {
        h,
        outcome: await runTurn(request({ surface, text: "implement the Button change" }), h.deps),
      };
    },
  },
  {
    door: "a staged proposal",
    disposition: "staged",
    settles: "waiting-on-person",
    run: async (surface) => {
      const h = harness({
        replies: [
          {
            text: "I'll file a Roadmap card.",
            toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }],
          },
        ],
      });
      return {
        h,
        outcome: await runTurn(
          request({ surface, text: "file a card for the reflection redesign" }),
          h.deps,
        ),
      };
    },
  },
  {
    door: "a card Slack refused",
    disposition: "failed",
    settles: "idle",
    run: async (surface) => {
      const h = harness({
        delivery: recordingDelivery({ stagingFails: true }),
        replies: [
          { toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }] },
        ],
      });
      return {
        h,
        outcome: await runTurn(
          request({ surface, text: "file a card for the reflection redesign" }),
          h.deps,
        ),
      };
    },
  },
  {
    door: "a reply Slack never accepted",
    disposition: "failed",
    settles: "idle",
    run: async (surface) => {
      const h = harness({ delivery: recordingDelivery({ answerFails: true }) });
      return { h, outcome: await runTurn(request({ surface }), h.deps) };
    },
  },
  {
    door: "a resolution the model decided",
    disposition: "resolved",
    settles: "idle",
    run: async (surface) => {
      const h = harness({
        replies: [
          {
            toolCalls: [
              {
                name: "proposal_resolve",
                args: { decision: "confirm", message_to_user: "Filing it now." },
              },
            ],
          },
        ],
      });
      await stage(h);
      return {
        h,
        outcome: await runTurn(
          request({
            surface,
            text: "that all looks right to me, please go ahead and file the card",
            pending: PENDING,
          }),
          h.deps,
        ),
      };
    },
  },
  {
    door: "a reaction and no words",
    disposition: "reacted",
    settles: "idle",
    run: async (surface) => {
      const h = harness({
        replies: [{ toolCalls: [{ name: "slack_react", args: { emoji: "pray" } }] }, { text: "" }],
      });
      return {
        h,
        outcome: await runTurn(request({ surface, text: "thanks, that helps a lot" }), h.deps),
      };
    },
  },
  {
    // The ending the disposition alone gets wrong: the person asked something
    // else while a card was pending, the answer landed, and the card is still
    // sitting there needing a click.
    door: "an answer with a card still live in the thread",
    disposition: "answered",
    settles: "waiting-on-person",
    run: async (surface) => {
      const h = harness({ replies: [{ text: "A call-off reaches a fill-in through the board." }] });
      await stage(h);
      return {
        h,
        outcome: await runTurn(
          request({
            surface,
            text: "different question — how does a call-off reach a fill-in?",
            pending: PENDING,
          }),
          h.deps,
        ),
      };
    },
  },
  {
    // #575's text said `failed` settles `active`; that would let a turn which
    // merely went wrong overwrite the thread's `suspended` while the card it is
    // about sits there. The thread does not stop waiting because a later turn
    // died.
    door: "a dead model with a card still live in the thread",
    disposition: "failed",
    settles: "waiting-on-person",
    run: async (surface) => {
      const h = harness();
      const broken: TurnDeps = {
        ...h.deps,
        async runAgent() {
          throw new Error("vertex 429: resource exhausted");
        },
      };
      await stage(h);
      return {
        h,
        outcome: await runTurn(
          request({
            surface,
            text: "different question — how does a call-off reach a fill-in?",
            pending: PENDING,
          }),
          broken,
        ),
      };
    },
  },
  {
    door: "a stop pressed before the answer was delivered",
    disposition: "stopped",
    settles: "idle",
    run: async (surface) => {
      const h = harness({ cancelKey: REF, replies: [{ text: "Here is the answer." }] });
      await h.threadState.requestCancel(REF);
      return { h, outcome: await runTurn(request({ surface }), h.deps) };
    },
  },
  {
    door: "a dead model",
    disposition: "failed",
    settles: "idle",
    run: async (surface) => {
      const h = harness();
      const broken: TurnDeps = {
        ...h.deps,
        async runAgent() {
          throw new Error("vertex 429: resource exhausted");
        },
      };
      return { h, outcome: await runTurn(request({ surface }), broken) };
    },
  },
];

for (const exit of EXITS) {
  for (const surface of ["channel", "assistant"] as const) {
    test(`the working signal is down after ${exit.door} (${surface})`, async () => {
      const { h, outcome } = await exit.run(surface);
      assert.equal(outcome.disposition, exit.disposition);
      assert.deepEqual(workingSignalOf(h.delivery), ["working", "working-clear"]);
      assert.equal(clearedWith(h.delivery), exit.settles, outcome.disposition);
    });
  }
}

// ── the grain the settle is decided at ───────────────────────────────────────
//
// A DM's CONVERSATION key is the constant "dm", and the card read that feeds
// `pending` is keyed on it — so on that surface a pending card arrives on every
// ask, including the ones it has nothing to do with. The settle, meanwhile, is
// addressed to a reply thread. Deciding it at conversation grain therefore
// suspends a thread that holds no card, and the ✅ that eventually resolves the
// real card settles only ITS thread, so the other one stays suspended with
// nothing in it to click. That is #573's error one layer down, and the
// comparison is the store's own (`proposalReplyThread`, #579).
const DM_CONVERSATION = "dm";
const DM_ASK_A = "1700000000.000500";
const DM_ASK_B = "1700000000.000600";

test("a DM card suspends the ask it was staged under, and leaves the next ask alone", async () => {
  const cardUnderA: PendingProposal = {
    ...PENDING,
    threadTs: DM_CONVERSATION,
    replyTs: DM_ASK_A,
  };
  const dmTurn = (replyTs: string): TurnRequest =>
    request({
      surface: "assistant",
      conversationTs: DM_CONVERSATION,
      replyTs,
      text: "different question — how does a call-off reach a fill-in?",
      pending: cardUnderA,
    });

  const sameAsk = harness();
  const inside = await runTurn(dmTurn(DM_ASK_A), sameAsk.deps);
  assert.equal(inside.disposition, "answered");
  assert.equal(clearedWith(sameAsk.delivery), "waiting-on-person");

  const nextAsk = harness();
  const beside = await runTurn(dmTurn(DM_ASK_B), nextAsk.deps);
  assert.equal(beside.disposition, "answered");
  assert.equal(clearedWith(nextAsk.delivery), "idle");
});

test("a channel thread is unaffected: there, the reply thread IS the conversation", async () => {
  // Both grains are the same value in a channel, so the gate above can only
  // ever agree with itself there — asserted rather than reasoned, because the
  // fix would be worthless if it changed the surface it was not aimed at.
  const h = harness();
  const outcome = await runTurn(request({ pending: PENDING }), h.deps);
  assert.equal(outcome.disposition, "answered");
  assert.equal(clearedWith(h.delivery), "waiting-on-person");
});

test("a card recorded before reply threads existed falls back to the conversation", async () => {
  // `replyTs` post-dates 2026-08-22, and `proposalReplyThread` falls back to
  // the record's conversation key. In a channel that is the thread root, so an
  // old record still suspends its own thread.
  const legacyCard: PendingProposal = {
    toolName: PENDING.toolName,
    input: PENDING.input,
    channel: PENDING.channel,
    threadTs: CONVERSATION,
    userMsgTs: PENDING.userMsgTs,
    proposalTs: PENDING.proposalTs,
    proposalText: PENDING.proposalText,
    requesterUserId: PENDING.requesterUserId,
  };
  const h = harness();
  await runTurn(request({ pending: legacyCard }), h.deps);
  assert.equal(clearedWith(h.delivery), "waiting-on-person");
});

test("a typed gate emoji resolves before anything is raised, so there is nothing to clear", async () => {
  // The one exit above the working signals: a message that is only ✅ never
  // reaches the model, so the indicator is never raised — and a clear with no
  // set would be a second signal saying nothing.
  const h = harness();
  await stage(h);
  const outcome = await runTurn(request({ text: "✅", pending: PENDING }), h.deps);

  assert.equal(outcome.disposition, "resolved");
  assert.deepEqual(workingSignalOf(h.delivery), []);
});

test("the model's narration between lookups reaches the person as interim", async () => {
  const h = harness({
    replies: [
      { text: "Checking the blueprint for call-offs.", toolCalls: [{ name: "search_blueprint" }] },
      { text: "A call-off opens the slot a fill-in claims." },
    ],
  });
  const outcome = await runTurn(request(), h.deps);

  assert.deepEqual(
    h.delivery.calls.filter((c) => c.kind === "interim").map((c) => c.text),
    ["Checking the blueprint for call-offs."],
  );
  assert.equal(outcome.telemetry.interim, 1);
  assert.deepEqual(h.executed, ["search_blueprint"]);
});

test("a model failure is a visible failure, and the progress surface is closed as one", async () => {
  const h = harness();
  const broken: TurnDeps = {
    ...h.deps,
    async runAgent() {
      throw new Error("vertex 429: resource exhausted");
    },
  };
  const outcome = await runTurn(request(), broken);

  assert.equal(outcome.disposition, "failed");
  assert.deepEqual(outcome.failure, { stage: "agent" });
  assert.deepEqual(
    h.delivery.calls.filter((c) => c.kind === "endProgress"),
    [{ kind: "endProgress", outcome: "error" }],
  );
  const failure = h.delivery.calls.find((c) => c.kind === "failure");
  assert.equal(failure?.stage, "agent");
  assert.match(failure?.message ?? "", /429/);
  // Nothing is remembered from a turn that never produced a reply.
  assert.deepEqual(await h.threadState.readHistory(REF), []);
});

test("a reaction and no words is a finished turn", async () => {
  const h = harness({
    replies: [{ toolCalls: [{ name: "slack_react", args: { emoji: "pray" } }] }, { text: "" }],
  });
  const outcome = await runTurn(request({ text: "thanks, that helps" }), h.deps);

  assert.equal(outcome.disposition, "reacted");
  assert.deepEqual(postsOf(h.delivery), []);
  // It posts no answer, so nothing else would close the progress surface — an
  // open one is a plan stream still ticking over a finished turn.
  assert.deepEqual(
    h.delivery.calls.filter((c) => c.kind === "endProgress"),
    [{ kind: "endProgress", outcome: "complete" }],
  );
  const stored = await h.threadState.readHistory(REF);
  assert.equal(stored[1]!.content, "(reacted — no reply)");
});

test("the scope hint and the correction directive land after the question, never before it", async () => {
  const h = harness({
    history: undefined,
    replies: [{ text: "Re-checked: the path is Call-Off → Fill-In." }],
  } as never);
  const history: HistoryTurn[] = [
    { role: "user", content: "does a call-off notify anyone?", ts: "1700000000.000180" },
    { role: "assistant", content: "No, nothing is notified.", ts: "1700000000.000190" },
  ];
  await runTurn(
    request({
      text: "no, that's wrong — check again",
      scopeInstruction: "start in the service blueprint",
      history,
    }),
    h.deps,
  );

  const sent = h.provider.started?.conversation.at(-1)?.text ?? "";
  const question = sent.indexOf("no, that's wrong");
  const scope = sent.indexOf("SCOPE —");
  const directive = sent.indexOf("CORRECTING your previous reply");
  assert.ok(question === 0, "the question opens the block");
  assert.ok(scope > question, "the scope hint follows it");
  assert.ok(directive > scope, "and the correction directive after that");
});

test("a brief staged with no named gap carries that caveat as data, not as Slack copy", async () => {
  // WHETHER the caveat is on the card is the turn's judgement (#623); the
  // words are the adapter's. A test matching `:mag:` here would pass on a
  // recording that spelled the card and fail to notice the judgement moving.
  const h = harness({
    replies: [
      {
        text: "I'll scaffold this.",
        toolCalls: [
          {
            name: "prototype_scaffold",
            args: { figma_url: "https://figma.com/file/x", notes: "Build the roster view." },
          },
        ],
      },
    ],
  });
  const outcome = await runTurn(request({ text: "build this figma" }), h.deps);

  assert.equal(outcome.disposition, "staged");
  assert.deepEqual(outcome.staged?.card.caveats, [{ kind: "no-open-questions" }]);
  assert.equal(outcome.staged?.card.kind, "confirm");
  assert.equal(outcome.staged?.card.verb, "scaffold a new prototype from this Figma design");
});

test("Turn does not import a Slack module", () => {
  // env-deps.ts is the wiring layer: Env becomes TurnDeps, so it names Slack
  // on purpose. The rest of the module — including the antecedent window and
  // the body the judges score — does not (#623).
  const dir = resolve(process.cwd(), "src/turn");
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "env-deps.ts");
  assert.ok(files.includes("turn.ts"), "the turn itself is in the sample");
  for (const file of files) {
    const src = readFileSync(resolve(dir, file), "utf8");
    assert.equal(
      /from ["']\.\.\/slack\//.test(src),
      false,
      `${file} still imports a Slack module`,
    );
  }
});
