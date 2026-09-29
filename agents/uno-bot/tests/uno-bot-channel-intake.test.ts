// A post in #uno-bot, as a drafted intake about uno-bot filed with a ✅.
//
// Two seams, each across its own interface, on the shared Turn harness:
//
// - the TURN — a request marked as #uno-bot carries the intake instruction to
//   the model, and what the model then calls is staged the way any card is: a
//   problem report as one `github_issue_create` card in the post's thread, a
//   report an open intake covers as a `github_issue_update` comment, and a
//   plain question as an answer with no card;
// - the GATE — the poster's ✅ on that card wins the claim, and the executor
//   it hands to files the issue with the `harness-intake` label and posts the
//   link back into the thread.
//
// The event gate that lets the post in with no @mention is
// `message-engagement.test.ts`. Nothing here reaches GitHub or Slack.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn } from "../src/turn/index";
import { intakeChannelInstruction, isIntakeChannel } from "../src/turn/intake-channel";
import { resolveSignal, runOperations } from "../src/gate/index";
import { fileGithubIssue } from "../src/tools/github-issue";
import type { CreatedIssue, GithubIssueClient, NewIssue } from "../src/integrations/github";
import { CHANNEL, harness, postsOf, request } from "./helpers/turn-harness";

const POSTER = "U1";
/** The post itself: a top-level message, so the reply thread is its own ts. */
const POST_TS = "1700000000.000100";

const REPORT =
  "uno-bot answered a card-status question with last week's Design Status — it said WIP when the card is Ready for QA.";

const DRAFT = {
  title: "uno-bot reports a stale Design Status for a Roadmap card",
  body: [
    "**What happened.** Asked for a card's status, uno-bot said WIP.",
    "",
    "**Expected.** The card's current Design Status, Ready for QA.",
    "",
    "**Evidence.** The post in #uno-bot.",
    "",
    "**Reported by.** <@U1>",
    "",
    "**Suggested area.** roadmap_query",
  ].join("\n"),
};

/** A top-level post in #uno-bot, as the Slack adapter builds it. */
const intakePost = (text: string) =>
  request({
    userId: POSTER,
    conversationTs: POST_TS,
    replyTs: POST_TS,
    userMsgTs: POST_TS,
    threaded: false,
    text,
    intakeChannel: true,
  });

/** What the model was handed for this turn: the question block, as sent. */
const sentText = (h: ReturnType<typeof harness>): string =>
  h.provider.started?.conversation.at(-1)?.text ?? "";

// ── which channel it is ──────────────────────────────────────────────────────

test("#uno-bot is the configured channel, and nothing is when the config is unset", () => {
  assert.equal(isIntakeChannel("C0UNOBOT", "C0UNOBOT"), true);
  assert.equal(isIntakeChannel("C0UNOBOT", " C0UNOBOT "), true);
  assert.equal(isIntakeChannel("C0OTHER", "C0UNOBOT"), false);
  assert.equal(isIntakeChannel("C0UNOBOT", undefined), false);
  assert.equal(isIntakeChannel("C0UNOBOT", ""), false);
});

// ── the turn ─────────────────────────────────────────────────────────────────

test("a problem report stages one github_issue_create card, in the post's thread", async () => {
  const h = harness({
    replies: [
      { text: "Checking for an open intake first.", toolCalls: [{ name: "github_intake_search", args: { keywords: "stale Design Status" } }] },
      { text: "Want me to file this?", toolCalls: [{ name: "github_issue_create", args: DRAFT }] },
    ],
    toolResult: JSON.stringify({ ok: true, issues: [] }),
  });

  const outcome = await runTurn(intakePost(REPORT), h.deps);

  // The model was told what a post here is for, after the question itself.
  const sent = sentText(h);
  assert.ok(sent.startsWith(REPORT), sent);
  assert.ok(sent.includes(intakeChannelInstruction({ userId: POSTER, threaded: false })), sent);
  assert.ok(sent.includes(`<@${POSTER}>`), "the reporter is named for the draft");

  // The duplicate check ran, and exactly one card was staged.
  assert.deepEqual(h.executed, ["github_intake_search"]);
  assert.equal(outcome.disposition, "staged");
  const proposal = outcome.staged!.proposal;
  assert.equal(proposal.toolName, "github_issue_create");
  assert.deepEqual(proposal.input, DRAFT);
  assert.equal(proposal.requesterUserId, POSTER);

  // In the post's thread: the card is held on it and posted under it.
  assert.equal(proposal.channel, CHANNEL);
  assert.equal(proposal.replyTs ?? proposal.threadTs, POST_TS);
  assert.equal((await h.threadState.getProposalByThread({ channel: CHANNEL, thread: POST_TS }))?.toolName, "github_issue_create");
  assert.ok(postsOf(h.delivery).some((p) => p.includes("Want me to file this?")), postsOf(h.delivery).join("\n---\n"));
  assert.deepEqual(h.resolved, []);
});

test("a report an open intake already covers stages a comment on that issue instead", async () => {
  const open = {
    number: 802,
    title: "uno-bot quotes a stale Design Status",
    url: "https://github.com/BilLogic/plus-uno/issues/802",
  };
  const comment = {
    issue_number: open.number,
    comment: "Another report from #uno-bot: said WIP for a card that is Ready for QA.",
  };
  const h = harness({
    replies: [
      { toolCalls: [{ name: "github_intake_search", args: { keywords: "stale Design Status" } }] },
      { text: `This looks like <${open.url}|#802> — want me to add your report there?`, toolCalls: [{ name: "github_issue_update", args: comment }] },
    ],
    toolResult: JSON.stringify({ ok: true, issues: [open] }),
  });

  const outcome = await runTurn(intakePost(REPORT), h.deps);

  assert.deepEqual(h.executed, ["github_intake_search"]);
  assert.equal(outcome.disposition, "staged");
  assert.equal(outcome.staged!.proposal.toolName, "github_issue_update");
  assert.deepEqual(outcome.staged!.proposal.input, comment);
  const staged = await h.threadState.getProposalByThread({ channel: CHANNEL, thread: POST_TS });
  assert.equal(staged?.toolName, "github_issue_update", "no new-issue card sits beside it");
  assert.ok(postsOf(h.delivery).some((p) => p.includes(open.url)), "the match is linked");
});

test("a plain question in #uno-bot gets an answer and no card", async () => {
  const h = harness({ replies: [{ text: "I read the Roadmap board every time you ask, so status is live." }] });

  const outcome = await runTurn(intakePost("how often do you read the Roadmap board?"), h.deps);

  assert.equal(outcome.disposition, "answered");
  assert.equal(outcome.staged, undefined);
  assert.equal(await h.threadState.getProposalByThread({ channel: CHANNEL, thread: POST_TS }), null);
  // Still told where it is: the offer is the model's call, on the post's content.
  assert.match(sentText(h), /INTAKE CHANNEL/);
});

test("a post anywhere else carries no intake instruction", async () => {
  const h = harness();
  await runTurn(request({ text: REPORT }), h.deps);
  assert.doesNotMatch(sentText(h), /INTAKE CHANNEL/);
});

test("a reply in the intake thread names the thread's opener as the reporter, not the replier", () => {
  const block = intakeChannelInstruction({ userId: "U2", threaded: true });
  assert.doesNotMatch(block, /<@U2>/);
  assert.match(block, /the person who opened this thread/);
});

// ── the gate ─────────────────────────────────────────────────────────────────

test("✅ from the poster files the issue with the harness-intake label and replies with its link", async () => {
  const h = harness({
    replies: [{ text: "Want me to file this?", toolCalls: [{ name: "github_issue_create", args: DRAFT }] }],
  });
  const outcome = await runTurn(intakePost(REPORT), h.deps);
  const cardTs = outcome.staged!.proposal.proposalTs;

  const verdict = await resolveSignal(
    {
      kind: "reaction",
      messageTs: cardTs,
      channel: CHANNEL,
      thread: POST_TS,
      glyph: "white_check_mark",
      userId: POSTER,
    },
    { threadState: h.threadState },
  );
  assert.equal(verdict.outcome, "won");
  assert.ok(verdict.execute, "the ✅ carries the card to run");

  // The executor production's gate hands to, on a fake client.
  const filed: CreatedIssue = { number: 811, url: "https://github.com/BilLogic/plus-uno/issues/811" };
  const sent: NewIssue[] = [];
  const github: GithubIssueClient = {
    repo: "BilLogic/plus-uno",
    async createIssue(issue) {
      sent.push(issue);
      return filed;
    },
  };
  const posted: string[] = [];
  const outcomes = await runOperations(verdict.execute!.operations, (op) =>
    fileGithubIssue(op.input, {
      github,
      requesterName: async () => "Poster",
      requestedInDm: false,
      threadPermalink: async () => `https://plus.slack.com/archives/${CHANNEL}/p1700000000000100`,
      postToThread: async (text) => {
        posted.push(text);
      },
    }),
  );

  assert.equal(outcomes[0]!.ok, true);
  assert.equal(sent.length, 1);
  assert.ok(sent[0]!.labels.includes("harness-intake"), String(sent[0]!.labels));
  assert.ok(sent[0]!.body.startsWith(DRAFT.body));
  assert.equal(posted.length, 1);
  assert.ok(posted[0]!.includes(filed.url), posted[0]!);
  // Consumed: a second ✅ finds nothing to file.
  assert.equal((await h.threadState.getProposalByTs(cardTs)).state, "none");
});
