// The Review pop-up for the archive and the three GitHub writes, drawn in the
// shared anatomy (`docs/plans/2026-10-15-review-modal-redesign.md` § 3, 4, 5
// and 8, and Decision 7).
//
// Driven at the review door, as `tests/review-shareout.test.ts` drives the
// share-out: the in-memory ThreadState and a views client that refuses what
// Slack refuses. Each card's text is the one `renderProposalCard` writes for
// the card the turn stages, so the reader is held to what a card says. Each
// case asserts what Slack was handed, or what Approve ran.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { recordingDelivery, type ProposalCard } from "../src/turn/index";
import { runReviewDecision, runReviewOpen, type ReviewDoorDeps, type ReviewViewState } from "../src/slack/review-door";
import { reviewSubmitOf } from "../src/slack/review-view";
import { renderProposalCard } from "../src/slack/proposal-render";
import { issueUpdateFromInput } from "../src/tools/github-issue-update-render";
import { recordingViews } from "./helpers/recording-slack";
import { cardWords } from "./helpers/card-message";

const CHANNEL = "D0ASKER01";
const THREAD = "1760540000.000050";
const CARD_TS = "1760540000.000100";
const CONFIRMER = "U0BILL0001";

/** The card's text, as the turn stages it. */
function cardText(card: Omit<ProposalCard, "kind" | "operations"> & { toolName: string; input: Record<string, unknown> }): string {
  const { toolName, input, ...rest } = card;
  return renderProposalCard({ kind: "confirm", operations: [{ toolName, input }], ...rest }).text;
}

function proposalOf(toolName: string, input: Record<string, unknown>, text: string): PendingProposal {
  return {
    toolName,
    input,
    channel: CHANNEL,
    threadTs: THREAD,
    replyTs: THREAD,
    userMsgTs: "1760540000.000040",
    proposalTs: CARD_TS,
    proposalText: text,
    requesterUserId: "U0ASKER001",
    confirmers: [CONFIRMER],
  };
}

type Option = { value: string; text: { text: string }; description?: { text: string } };
type Block = {
  type: string;
  block_id?: string;
  optional?: boolean;
  label?: { text: string };
  hint?: { text: string };
  element?: { type: string; initial_value?: string; multiline?: boolean; options?: Option[] };
  text?: { text: string };
  level?: string;
  title?: { text: string };
  subtitle?: { text: string };
  actions?: Array<{ url?: string; text: { text: string } }>;
  fields?: Array<{ text: string }>;
  elements?: Array<{ elements: Array<Record<string, string>> }>;
};
type View = { title: { text: string }; submit?: unknown; blocks: Block[] };

const blocksOf = (view: unknown) => (view as View).blocks;
const zones = (view: unknown) => blocksOf(view).map((b) => (b.block_id?.startsWith("uno_field:") ? `field:${b.block_id.slice(10)}` : b.type));
const inputById = (view: unknown, key: string) => blocksOf(view).find((b) => b.block_id === `uno_field:${key}`);
const whereOf = (view: unknown) => blocksOf(view)[1]!.elements![0]!.elements;
const decisionOf = (view: unknown) =>
  blocksOf(view)
    .find((b) => b.block_id === "uno_review_choice")!
    .element!.options!.map((o) => [o.value, o.description?.text]);

async function open(proposal: PendingProposal, userId = CONFIRMER) {
  const store = createInMemoryThreadState();
  await store.putProposal(proposal);
  const views = recordingViews({ alreadyOpen: ["V1"] });
  const ran: GateVerdict[] = [];
  const cardUpdates: Array<{ text: string; note: string }> = [];
  const deps: ReviewDoorDeps = {
    threadState: store,
    views: views.client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (verdict) => void ran.push(verdict),
    updateCard: async (_channel, _ts, message) => void cardUpdates.push(cardWords(message)),
    restage: async () => {},
    revise: async () => {},
  };
  await runReviewOpen({ triggerId: "T.trigger", channel: CHANNEL, messageTs: CARD_TS, userId }, deps);
  return { deps, views, ran, cardUpdates, draft: views.calls.at(-1)!.view };
}

/** Approve, pressed with these values in the fields in place. */
async function approve(proposal: PendingProposal, values: Record<string, string> = {}) {
  const h = await open(proposal);
  const state: ReviewViewState = { uno_review_choice: { uno_review_choice_input: { selected_option: { value: "confirm" } } } };
  for (const [key, value] of Object.entries(values)) state[`uno_field:${key}`] = { value: { type: "plain_text_input", value } };
  const submit = reviewSubmitOf({ ...(h.draft as object), state: { values: state } });
  assert.ok(submit.ok);
  await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: CONFIRMER, ...submit.request }, h.deps);
  return { ...h, executed: h.ran[0]?.execute?.input as Record<string, unknown> | undefined };
}

/** Every text Slack is handed, for the 3,000-character cap. */
function texts(view: unknown): string[] {
  const out: string[] = [];
  JSON.stringify(view, (key, value) => {
    if ((key === "text" || key === "initial_value") && typeof value === "string") out.push(value);
    return value;
  });
  return out;
}

function assertFits(view: unknown, refused: readonly unknown[]) {
  assert.equal(refused.length, 0, "Slack took the view");
  assert.ok(blocksOf(view).length <= 100);
  assert.ok((view as View).title.text.length <= 24);
  assert.ok(texts(view).every((t) => t.length <= 3000));
  for (const b of blocksOf(view).filter((b) => b.type === "alert")) assert.ok(b.text!.text.length <= 200);
  for (const [, description] of decisionOf(view)) assert.ok((description ?? "").length <= 75);
}

// ── Archive ─────────────────────────────────────────────────────────────────

const ARCHIVE_INPUT = { page_url: "https://www.notion.so/Old-waitlist-idea-2fc01241bbbb" };
const ARCHIVE = proposalOf(
  "notion_archive",
  ARCHIVE_INPUT,
  cardText({
    toolName: "notion_archive",
    input: ARCHIVE_INPUT,
    verb: "archive this Notion card",
    target: { title: "Old waitlist idea", parent: "Roadmap" },
    fields: [{ label: "page_url", value: ARCHIVE_INPUT.page_url }],
    caveats: [],
  }),
);

describe("the archive draft", () => {
  it("orders the zones: header, where, the restore alert, the card, then the decision", async () => {
    const { draft, views } = await open(ARCHIVE);
    assert.equal((draft as View).title.text, "Review archive");
    assert.deepEqual(zones(draft), ["header", "rich_text", "alert", "card", "divider", "input", "input"]);
    assert.equal(blocksOf(draft)[0]!.text!.text, "Archive a Notion card");
    assertFits(draft, views.refused);
  });

  it("says it can be restored, in an info alert", async () => {
    const { draft } = await open(ARCHIVE);
    const alert = blocksOf(draft).find((b) => b.type === "alert")!;
    assert.equal(alert.level, "info");
    assert.equal(alert.text!.text, "Archived pages can be restored from Notion's trash.");
  });

  it("names the page in a card with Open in Notion, and says where it goes", async () => {
    const { draft } = await open(ARCHIVE);
    const card = blocksOf(draft).find((b) => b.type === "card")!;
    assert.equal(card.title!.text, "Old waitlist idea");
    assert.equal(card.subtitle!.text, "Roadmap");
    assert.deepEqual(card.actions!.map((a) => [a.text.text, a.url]), [["Open in Notion", ARCHIVE_INPUT.page_url]]);
    assert.equal(whereOf(draft).map((e) => e.text).join(""), "Moves this card from the Roadmap to Notion's trash.");
    const json = JSON.stringify(draft);
    assert.doesNotMatch(json, /\*Target:\*|\*Page link:\*/);
  });

  it("says what each decision does", async () => {
    const { draft } = await open(ARCHIVE);
    assert.deepEqual(decisionOf(draft), [
      ["confirm", "Archives it now."],
      ["revise", "I redraft it from your note and post a new card."],
      ["cancel", "Nothing is archived."],
    ]);
  });

  it("names a page the card could not resolve by its link alone, still with the alert", async () => {
    const text = cardText({ toolName: "notion_archive", input: ARCHIVE_INPUT, verb: "archive this Notion card", fields: [{ label: "page_url", value: ARCHIVE_INPUT.page_url }], caveats: [] });
    const { draft } = await open(proposalOf("notion_archive", ARCHIVE_INPUT, text));
    assert.deepEqual(zones(draft).slice(0, 4), ["header", "rich_text", "alert", "card"]);
    const card = blocksOf(draft).find((b) => b.type === "card")!;
    assert.equal(card.title!.text, "This Notion card");
    assert.equal(whereOf(draft).map((e) => e.text).join(""), "Moves this card to Notion's trash.");
  });
});

// ── Issue follow-up ─────────────────────────────────────────────────────────

const REPO = "BilLogic/plus-uno";

function updateProposal(input: Record<string, unknown>, visibility: "public" | "private" | "unknown" = "public") {
  const read = issueUpdateFromInput(input);
  assert.ok(read.ok);
  const steps = [
    read.update.comment ? "comment" : "",
    read.update.addLabels.length ? `add label ${read.update.addLabels.map((l) => `\`${l}\``).join(", ")}` : "",
    read.update.state === "closed_completed" ? "close as completed" : read.update.state === "open" ? "reopen" : "",
  ].filter(Boolean);
  const text = cardText({
    toolName: "github_issue_update",
    input,
    verb: "update a GitHub issue",
    fields: [
      { label: "issue", value: `${REPO}#${read.update.issue}` },
      { label: "operations", value: steps.join(" · ") },
      ...(read.update.comment ? [{ label: "comment", value: read.update.comment }] : []),
    ],
    caveats: read.update.comment ? [{ kind: "repo-visibility", repo: REPO, visibility, write: "comment" }] : [],
  });
  return proposalOf("github_issue_update", input, text);
}

const CLOSE_INPUT = { issue_number: 688, comment: "Fixed in #1294.", state: "closed_completed", add_labels: ["bug"] };
const CLOSE = updateProposal(CLOSE_INPUT);
const COMMENT_ONLY = updateProposal({ issue_number: 688, comment: "Shipped in r620; can you confirm?" });

describe("the issue follow-up draft", () => {
  it("orders the zones: header, where, the public-repo alert, state and labels, the comment, the decision", async () => {
    const { draft, views } = await open(CLOSE);
    assert.equal((draft as View).title.text, "Review issue update");
    assert.deepEqual(zones(draft), ["header", "rich_text", "alert", "section", "field:0.comment", "divider", "input", "input"]);
    assert.equal(blocksOf(draft)[0]!.text!.text, "Comment on and close #688");
    assertFits(draft, views.refused);
  });

  it("links the issue in the where line, and warns that the repo is public", async () => {
    const { draft } = await open(CLOSE);
    assert.deepEqual(whereOf(draft), [
      { type: "text", text: "On " },
      { type: "link", url: `https://github.com/${REPO}/issues/688`, text: `${REPO}#688` },
      { type: "text", text: ", a public repo." },
    ]);
    const alert = blocksOf(draft).find((b) => b.type === "alert")!;
    assert.equal(alert.level, "warning");
    assert.equal(
      alert.text!.text,
      "Anyone can read the comment once it's posted. Check it for anything from a DM or private channel. I add a footer naming you and linking this thread.",
    );
  });

  it("shows state and labels as fields, and no Operations line", async () => {
    const { draft } = await open(CLOSE);
    const facts = blocksOf(draft).find((b) => b.type === "section" && b.fields)!;
    assert.deepEqual(facts.fields!.map((f) => f.text), ["*State*\nClose as completed", "*Labels*\nAdd `bug`"]);
    assert.doesNotMatch(JSON.stringify(draft), /Operations|\*Issue:\*/);
  });

  it("prefills the comment, optional when the update also closes or labels", async () => {
    const { draft } = await open(CLOSE);
    const comment = inputById(draft, "0.comment")!;
    assert.equal(comment.label!.text, "Comment");
    assert.equal(comment.element!.initial_value, "Fixed in #1294.");
    assert.equal(comment.element!.multiline, true);
    assert.equal(comment.optional, true);
    assert.equal(comment.hint!.text, "Posts as written, in GitHub Markdown, with my footer under it. Clear it to close without a comment.");
  });

  it("requires the comment when it is all the update does", async () => {
    const { draft } = await open(COMMENT_ONLY);
    assert.equal(blocksOf(draft)[0]!.text!.text, "Comment on #688");
    assert.deepEqual(zones(draft), ["header", "rich_text", "alert", "field:0.comment", "divider", "input", "input"]);
    const comment = inputById(draft, "0.comment")!;
    assert.equal(comment.optional, false);
    assert.equal(comment.hint!.text, "Posts as written, in GitHub Markdown, with my footer under it.");
  });

  it("says what Approve does on this card, not that it updates the issue", async () => {
    assert.deepEqual(decisionOf((await open(CLOSE)).draft), [
      ["confirm", "Comments, closes and labels #688 now."],
      ["revise", "I redraft it from your note and post a new card."],
      ["cancel", "Nothing happens."],
    ]);
    assert.equal(decisionOf((await open(COMMENT_ONLY)).draft)[0]![1], "Comments on #688 now.");
    const reopen = updateProposal({ issue_number: 12, state: "open" });
    assert.equal(decisionOf((await open(reopen)).draft)[0]![1], "Reopens #12 now.");
  });

  it("reads a reopen with no comment: no alert, no input, the state as a field", async () => {
    const { draft } = await open(updateProposal({ issue_number: 12, state: "open" }));
    assert.equal(blocksOf(draft)[0]!.text!.text, "Reopen #12");
    assert.deepEqual(zones(draft), ["header", "rich_text", "section", "divider", "input", "input"]);
    assert.deepEqual(whereOf(draft).at(-1), { type: "text", text: "." });
  });

  it("says a private repo in the where line and an info alert", async () => {
    const { draft } = await open(updateProposal(CLOSE_INPUT, "private"));
    assert.deepEqual(whereOf(draft).at(-1), { type: "text", text: ", a private repo." });
    const alert = blocksOf(draft).find((b) => b.type === "alert")!;
    assert.equal(alert.level, "info");
    assert.match(alert.text!.text, /^Only people with access to BilLogic\/plus-uno can read the comment\./);
  });

  it("is read-only for someone who can't decide: the comment shown, no input", async () => {
    const { draft } = await open(CLOSE, "U0OTHER001");
    assert.equal(inputById(draft, "0.comment"), undefined);
    assert.equal((draft as View).submit, undefined);
    assert.match(JSON.stringify(draft), /Fixed in #1294\./);
  });

  it("fits a comment at the input's 3,000 characters", async () => {
    const { draft, views } = await open(updateProposal({ ...CLOSE_INPUT, comment: "x".repeat(3000) }));
    assertFits(draft, views.refused);
    assert.equal(inputById(draft, "0.comment")!.element!.initial_value!.length, 3000);
  });
});

describe("Submit carries the comment into the update that runs", () => {
  it("posts the edited comment", async () => {
    const { executed, cardUpdates } = await approve(CLOSE, { "0.comment": "Fixed in #1294; thanks Bryan." });
    assert.equal(executed!.comment, "Fixed in #1294; thanks Bryan.");
    assert.equal(executed!.state, "closed_completed");
    assert.deepEqual(executed!.add_labels, ["bug"]);
    assert.match(cardUpdates.at(-1)!.text, /Fixed in #1294; thanks Bryan\./);
  });

  it("closes and labels without a comment when an optional comment is cleared", async () => {
    const { executed } = await approve(CLOSE, { "0.comment": "  " });
    assert.equal("comment" in executed!, false);
    const read = issueUpdateFromInput(executed!);
    assert.ok(read.ok);
    assert.equal(read.update.comment, null);
    assert.equal(read.update.state, "closed_completed");
  });

  it("refuses to clear a comment that is the whole update, and runs nothing", async () => {
    const h = await approve(COMMENT_ONLY, { "0.comment": "" });
    assert.equal(h.ran.length, 0);
    const redrawn = h.views.calls.at(-1)!.view;
    assert.equal(blocksOf(redrawn)[0]!.type, "alert");
    assert.equal(blocksOf(redrawn)[0]!.level, "error");
    assert.match(blocksOf(redrawn)[0]!.text!.text, /Comment can't be empty/);
  });

  it("refuses a placeholder comment", async () => {
    const h = await approve(CLOSE, { "0.comment": "Fixed in [link to the PR]." });
    assert.equal(h.ran.length, 0);
    assert.match(blocksOf(h.views.calls.at(-1)!.view)[0]!.text!.text, /placeholder/);
  });

  it("ignores a forged value for the issue or repo", async () => {
    const h = await open(CLOSE);
    const state: ReviewViewState = {
      uno_review_choice: { uno_review_choice_input: { selected_option: { value: "confirm" } } },
      "uno_field:0.issue_number": { value: { type: "plain_text_input", value: "1" } },
      "uno_field:0.repo": { value: { type: "plain_text_input", value: "someone/else" } },
    };
    const submit = reviewSubmitOf({ ...(h.draft as object), state: { values: state } });
    assert.ok(submit.ok);
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: CONFIRMER, ...submit.request }, h.deps);
    const executed = h.ran[0]!.execute!.input as Record<string, unknown>;
    assert.equal(executed.issue_number, 688);
    assert.equal("repo" in executed, false);
  });
});

// ── Workflow run ────────────────────────────────────────────────────────────

const RUN_INPUT = { repo: "plus-marketing-website", workflow: "sync-notion.yml" };
function runProposal(branch: string) {
  const text = cardText({
    toolName: "github_workflow_run",
    input: RUN_INPUT,
    verb: "run a GitHub workflow",
    fields: [
      { label: "repo", value: "BilLogic/plus-marketing-website" },
      { label: "workflow", value: "sync-notion.yml" },
      { label: "branch", value: branch },
    ],
    caveats: [],
  });
  return proposalOf("github_workflow_run", RUN_INPUT, text);
}

describe("the workflow run draft", () => {
  it("orders the zones: header, linked repo, the facts, the decision — no preamble", async () => {
    const { draft, views } = await open(runProposal("main"));
    assert.equal((draft as View).title.text, "Review workflow run");
    assert.deepEqual(zones(draft), ["header", "rich_text", "section", "divider", "input", "input"]);
    assert.equal(blocksOf(draft)[0]!.text!.text, "Run sync-notion.yml");
    assert.doesNotMatch(JSON.stringify(draft), /The draft|About to|:warning:/);
    assertFits(draft, views.refused);
  });

  it("links the repo, and puts workflow, branch and inputs in fields", async () => {
    const { draft } = await open(runProposal("main"));
    assert.deepEqual(whereOf(draft), [
      { type: "text", text: "Starts a GitHub Actions run on " },
      { type: "link", url: "https://github.com/BilLogic/plus-marketing-website", text: "BilLogic/plus-marketing-website" },
      { type: "text", text: "." },
    ]);
    const facts = blocksOf(draft).find((b) => b.type === "section" && b.fields)!;
    assert.deepEqual(facts.fields!.map((f) => f.text), ["*Workflow*\n`sync-notion.yml`", "*Branch*\n`main` (the default)", "*Inputs*\nNone"]);
    assert.deepEqual(decisionOf(draft)[0], ["confirm", "Starts the run; its runs page posts in the thread."]);
  });

  it("says a default branch it could not read, rather than naming one", async () => {
    const { draft } = await open(runProposal("couldn't read the default branch — it will run on whatever GitHub's default is"));
    const facts = blocksOf(draft).find((b) => b.type === "section" && b.fields)!;
    assert.equal(facts.fields![1]!.text, "*Branch*\nCouldn't read the default branch — it will run on whatever GitHub's default is");
  });
});

// ── New issue ───────────────────────────────────────────────────────────────

const ISSUE_INPUT = {
  title: "Waitlist state missing from Session card",
  body: "## What\nThe Session card has no waitlist state.\n\n## Why\nThe sign-up prototype needs it.",
};
function createProposal(input: Record<string, unknown> = ISSUE_INPUT, visibility: "public" | "private" | "unknown" = "public") {
  const text = cardText({
    toolName: "github_issue_create",
    input,
    verb: `file a GitHub issue on ${REPO}`,
    fields: Object.entries(input).map(([label, value]) => ({ label, value: String(value) })),
    caveats: [{ kind: "repo-visibility", repo: REPO, visibility }],
  });
  return proposalOf("github_issue_create", input, text);
}

describe("the new issue draft", () => {
  it("orders the zones: header, the repo in the where line, the public-repo alert, then the inputs", async () => {
    const { draft, views } = await open(createProposal());
    assert.equal((draft as View).title.text, "Review new issue");
    assert.deepEqual(zones(draft), ["header", "rich_text", "alert", "field:0.title", "field:0.body", "divider", "input", "input"]);
    assert.equal(blocksOf(draft)[0]!.text!.text, "File a GitHub issue");
    assertFits(draft, views.refused);
  });

  it("names the repo once, as a link in the where line", async () => {
    const { draft } = await open(createProposal());
    assert.deepEqual(whereOf(draft), [
      { type: "text", text: "Files on " },
      { type: "link", url: `https://github.com/${REPO}`, text: REPO },
      { type: "text", text: ", a public repo." },
    ]);
    assert.doesNotMatch(JSON.stringify(draft), /Repository/);
  });

  it("puts the public-repo warning above the inputs, in under 200 characters", async () => {
    const { draft } = await open(createProposal());
    const alert = blocksOf(draft)[2]!;
    assert.equal(alert.level, "warning");
    assert.equal(
      alert.text!.text,
      "Anyone can read the issue once it's filed. Check the body for anything from a DM or private channel. I add a footer naming you and linking this thread.",
    );
    assert.equal(blocksOf(draft).filter((b) => b.type === "context").length, 0, "no caveat line left at the foot");
  });

  it("prefills the title and the body, the body with a GitHub Markdown hint", async () => {
    const { draft } = await open(createProposal());
    assert.equal(inputById(draft, "0.title")!.element!.initial_value, ISSUE_INPUT.title);
    assert.equal(inputById(draft, "0.title")!.optional, false);
    const body = inputById(draft, "0.body")!;
    assert.equal(body.element!.initial_value, ISSUE_INPUT.body);
    assert.equal(body.optional, false);
    assert.equal(body.hint!.text, "GitHub Markdown, as it will read on the issue.");
  });

  it("is read-only for someone who can't decide: the title and the body shown", async () => {
    const { draft } = await open(createProposal(), "U0OTHER001");
    assert.equal(inputById(draft, "0.body"), undefined);
    const json = JSON.stringify(draft);
    assert.ok(json.includes(ISSUE_INPUT.title));
    assert.ok(json.includes("The Session card has no waitlist state."));
  });

  it("shows a body over the input's cap as text, saying why it is not an input, and fits", async () => {
    const long = { ...ISSUE_INPUT, body: "y".repeat(3500) };
    const { draft, views } = await open(createProposal(long));
    assert.equal(inputById(draft, "0.body"), undefined);
    assert.match(JSON.stringify(draft), /over the 3,000 characters/);
    assertFits(draft, views.refused);
  });

  it("files the edited title and body", async () => {
    const { executed } = await approve(createProposal(), { "0.title": "Session card: waitlist state", "0.body": "Needs a waitlist state." });
    assert.equal(executed!.title, "Session card: waitlist state");
    assert.equal(executed!.body, "Needs a waitlist state.");
  });
});
