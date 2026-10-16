// The blueprint cards in the Review pop-up and in the thread
// (`docs/plans/2026-10-15-review-modal-redesign.md` § Blueprint cards): the
// revision from shipped work (A3–A6) and the idea offered as a proposal
// (B1–B4), each drawn from the facts its real stager puts on the proposal.
//
// Real: the drafting reader, the stagers, the facts, the readings, the
// fields and their guards, the writer (on a fake RPC) and the Gate's
// confirmer and Review-only rules. Each view is held to what Slack takes in a
// modal (`helpers/slack-block-rules.ts`).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { draftView, stateView } from "../src/slack/review-view";
import { reviewFields, checkEdits, FIELD_BLOCK_PREFIX, FIELD_ACTION_ID, type ReviewViewState } from "../src/slack/review-fields";
import { MAX_EDITABLE_ROWS } from "../src/slack/review-blueprint-fields";
import { renderProposalCard } from "../src/slack/proposal-render";
import {
  comparisonText,
  ownersOf,
  proposalOfferCard,
  readDraft,
  readProposalDraft,
  retirementDraft,
  REVISION_SENT_BACK,
  revisionItem,
  stagedProposalOffer,
  stagedRevision,
  type Comparison,
  type Draft,
  type PathToday,
  type RevisionSource,
  type WaitingRevision,
} from "../src/blueprint-upkeep/index";
import { readRevision, writeRevision } from "../src/blueprint-write/index";
import { resolveSignal } from "../src/gate/index";
import { createInMemoryThreadState, proposalOperations, type PendingProposal } from "../src/thread-state/index";
import { messageBlocksRefusal, viewRefusal } from "./helpers/slack-block-rules";

const CHANNEL = "C0PLUSDES1";
const REPORT = "1760540000.000100";
const SURAJ = "U0SURAJ001";
const JOSE = "U0JOSE0001";
const BILL = "U0BILL0001";
const STRANGER = "U0SOMEONE1";
const CARD = { channel: CHANNEL, ts: REPORT };

const LANES = [
  { id: "l-tutor", name: "Regular Tutor" },
  { id: "l-fsa", name: "Front Stage Actions" },
  { id: "l-fst", name: "Front Stage Touchpoints" },
  { id: "l-bsa", name: "Back Stage Actions" },
  { id: "l-bst", name: "Back Stage Touchpoints" },
];

const TODAY: PathToday = {
  pathId: "path-12h",
  scenarioId: "scn-calloff",
  scenario: "Call-off Request",
  path: "12+ hours ahead",
  status: "live",
  lanes: LANES,
  steps: [
    { id: "s-files", name: "Files call-off (12h+, auto-approved)" },
    { id: "s-late", name: "Files late call-off (<12h, immediate removal)" },
    { id: "s-after", name: "After the session" },
  ],
  cells: [
    { id: "c-1", laneId: "l-tutor", stepId: "s-files", content: "Files a one-time call-off 12 or more hours before the session.", status: "live" },
    { id: "c-2", laneId: "l-fst", stepId: "s-files", content: "PLUS App", status: "live" },
    { id: "c-3", laneId: "l-bsa", stepId: "s-files", content: "Takes no action on auto-approved call-offs.", status: "live" },
    { id: "c-4", laneId: "l-tutor", stepId: "s-late", content: "If it is less than 12 hours before session, tutor emails supervisor.", status: "live" },
    { id: "c-5", laneId: "l-fst", stepId: "s-late", content: "Email", status: "live" },
    { id: "c-6", laneId: "l-tutor", stepId: "s-after", content: "Sees the session removed from My Sessions.", status: "live" },
  ],
  link: "https://plus-uno.netlify.app/blueprint/?cell=c-1",
};

const SOURCE: RevisionSource = {
  pageId: "rm2567",
  url: "https://app.notion.com/p/Transactional-email-2a-call-off-submitted-3b2b",
  title: "Transactional email — 2a call-off submitted",
  number: 2567,
  status: { property: "Dev Status", value: "Deployed" },
  quote: "Confirm a one-time or recurring call-off after the request is saved.",
};

/** Two added and one changed row in the first step, and one inferred
 *  deprecation in the second, with one thing unverified. */
const DRAFT_REPLY = JSON.stringify({
  rows: [
    { change: "added", step_id: "s-files", lane_id: "l-fsa", content: "Emails the tutor that the call-off was received and excused." },
    { change: "added", step_id: "s-files", lane_id: "l-bst", content: "Call-off received email" },
    { change: "changed", step_id: "s-files", lane_id: "l-tutor", content: "Files a one-time call-off 12 or more hours before the session and gets an email confirming it." },
    { change: "deprecated", step_id: "s-late", lane_id: "l-tutor", inferred: true },
  ],
  confidence: 0.8,
  gaps: ["The email covers recurring withdrawals too. Is there a `path` for them, or leave them off?"],
});

const draftOf = (reply = DRAFT_REPLY, today = TODAY): Draft => readDraft(reply, { title: SOURCE.title, text: SOURCE.quote, today, target: "live" })!;

function waiting(over: Partial<WaitingRevision> = {}): WaitingRevision {
  return {
    source: SOURCE,
    today: TODAY,
    draft: draftOf(),
    channel: CHANNEL,
    owner: SURAJ,
    owners: [{ slack: SURAJ, name: "Suraj Andrews" }, { name: "Jose Deleon" }],
    confirmers: [SURAJ, BILL],
    view: "https://plus-uno.netlify.app/blueprint/?cell=c-2",
    ...over,
  };
}

type Element = { type: string; text?: string; url?: string; user_id?: string; style?: Record<string, boolean>; elements?: Element[] };
type Block = {
  type: string;
  block_id?: string;
  level?: string;
  text?: { type?: string; text: string };
  title?: { text: string };
  subtitle?: { text: string };
  body?: { text: string };
  label?: { text: string };
  hint?: { text: string };
  elements?: Element[];
  actions?: Array<{ url?: string; text: { text: string } }>;
  element?: { initial_value?: string; options?: Array<{ value: string; text: { text: string }; description?: { text: string } }> };
};
type View = { title: { text: string }; submit?: unknown; blocks: Block[] };

const view = (proposal: PendingProposal, access: Partial<Parameters<typeof draftView>[2]> = {}) =>
  draftView(CARD, proposal, { mayDecide: true, confirmers: proposal.confirmers ?? [], ...access }) as unknown as View;
const staged = (r = waiting()) => stagedRevision(CHANNEL, REPORT, r);
const types = (v: View) => v.blocks.map((b) => b.type);
const json = (x: unknown) => JSON.stringify(x);
/** Every rich text element in a block, flattened. */
const flat = (e: { elements?: Element[] }): Element[] => (e.elements ?? []).flatMap((c) => [c, ...flat(c)]);
/** The words of a block's rich text, its sections and lists left out. */
const leaves = (b: { elements?: Element[] }) => flat(b).filter((e) => ["text", "link", "user"].includes(e.type));
const textOf = (b: Block) => leaves(b).map((e) => e.text ?? (e.user_id ? `@${e.user_id}` : "")).join("");
const inputs = (v: View) => v.blocks.filter((b) => b.block_id?.startsWith(FIELD_BLOCK_PREFIX));
const options = (v: View) => v.blocks.find((b) => b.block_id === "uno_review_choice")?.element?.options ?? [];

/** A line led by an emoji, as a shortcode or the character. */
const LEADING_EMOJI = /^\s*(?::[a-z0-9_+-]+:|\p{Extended_Pictographic})/u;

/** What Slack holds every view to, and the house rule that no line leads
 *  with an emoji. */
function assertFits(v: View): void {
  assert.equal(viewRefusal(v), null, "Slack takes the view");
  assert.ok(v.title.text.length <= 24);
  assert.ok(v.blocks.length <= 100, `${v.blocks.length} blocks`);
  assert.ok(!v.blocks.some((b) => ["table", "markdown", "container"].includes(b.type)), "only blocks a modal takes");
  for (const b of v.blocks.filter((b) => b.type === "alert")) assert.ok(b.text!.text.length <= 200);
  for (const o of options(v)) assert.ok(!o.description || o.description.text.length <= 75, o.value);
  const texts: string[] = [];
  JSON.stringify(v, (key, value) => {
    if (key === "text" && typeof value === "string") texts.push(value);
    return value;
  });
  assert.ok(texts.every((t) => t.length <= 3000), "every text fits");
  assert.deepEqual(texts.filter((t) => LEADING_EMOJI.test(t)), [], "no line leads with an emoji");
}

// ── A3: the revision's Review pop-up ────────────────────────────────────────

describe("a blueprint revision in Review", () => {
  it("is the path as the header, where and what changes, why now, the gaps, today's card and one section per changed step", () => {
    const v = view(staged());
    assertFits(v);
    assert.equal(v.title.text, "Blueprint revision");
    assert.equal(v.blocks[0]!.type, "header");
    assert.equal(v.blocks[0]!.text!.text, "Call-off Request › 12+ hours ahead");

    const where = v.blocks[1]!;
    assert.equal(where.type, "rich_text");
    const said = textOf(where);
    assert.match(said, /^Call-off Request · written as live · 2 added, 1 changed, 1 deprecated\n/);
    const code = flat(where).filter((e) => e.style?.code).map((e) => e.text);
    assert.deepEqual(code, ["live", "Dev Status: Deployed"], "frame words in code, where rich text takes it");
    assert.ok(flat(where).some((e) => e.type === "link" && e.text === "RM-2567" && e.url === SOURCE.url), "the RM-ID links the card");
    assert.ok(flat(where).some((e) => e.type === "user" && e.user_id === SURAJ), "the owner as a pill");
    assert.match(said, /Jose Deleon/, "a contributor Slack does not know is named");
    assert.match(said, /“Confirm a one-time or recurring call-off after the request is saved\.”/);

    const alert = v.blocks[2]!;
    assert.equal(alert.type, "alert");
    assert.equal(alert.level, "warning");
    assert.equal(alert.text!.text, "1 thing unverified and 1 row inferred. The owner is asked below.");

    const card = v.blocks[3]!;
    assert.equal(card.type, "card");
    assert.equal(card.title!.text, "Today: 12+ hours ahead");
    assert.equal(card.subtitle!.text, "Call-off Request · 6 rows, all live");
    assert.equal(card.actions![0]!.text.text, "View slice");
    assert.equal(card.actions![0]!.url, "https://plus-uno.netlify.app/blueprint/?cell=c-2");
  });

  it("draws only the steps the revision touches, each closed by a divider, its rows today then its changes", () => {
    const v = view(staged());
    const all = json(v.blocks);
    assert.ok(all.includes("Files call-off (12h+, auto-approved)"));
    assert.ok(all.includes("Files late call-off (<12h, immediate removal)"));
    assert.ok(!all.includes("After the session"), "an untouched step stays on the blueprint");
    assert.ok(!all.includes("Sees the session removed"), "and so do its rows");

    const steps = v.blocks.filter((b) => b.type === "rich_text" && leaves(b)[0]?.style?.bold && leaves(b)[1]?.style?.italic);
    assert.deepEqual(
      steps.map((b) => leaves(b)[0]!.text),
      ["Files call-off (12h+, auto-approved)", "Files late call-off (<12h, immediate removal)"],
    );
    for (const step of steps) assert.equal(leaves(step)[1]!.text, "Today");
    // Each step's section is closed by a divider before the next one opens.
    const at = steps.map((s) => v.blocks.indexOf(s));
    assert.ok(v.blocks.slice(at[0]!, at[1]!).some((b) => b.type === "divider"));
    assert.equal(v.blocks[at[0]! - 1]!.type, "divider", "a divider opens the first step");
  });

  it("labels the changes plainly — Added, Changed, Deprecated — with no emoji, the old text struck through", () => {
    const v = view(staged());
    const labels = v.blocks.flatMap((b) => leaves(b)).filter((e) => e.style?.bold).map((e) => e.text);
    assert.ok(labels.includes("Added") && labels.includes("Changed") && labels.includes("Deprecated"));
    assert.ok(!json(v.blocks).match(/:heavy_plus_sign:|:pencil2:|:heavy_minus_sign:|➕|✏️|➖/));
    const struck = v.blocks.flatMap((b) => leaves(b)).filter((e) => e.style?.strike).map((e) => e.text);
    assert.deepEqual(struck, [
      "Files a one-time call-off 12 or more hours before the session.",
      "If it is less than 12 hours before session, tutor emails supervisor.",
    ]);
    assert.ok(v.blocks.flatMap((b) => leaves(b)).some((e) => e.style?.italic && e.text?.trim() === "inferred"), "the inferred row is marked");
  });

  it("offers the added and changed rows' text as prefilled inputs, labelled by lane, and nothing else", () => {
    const v = view(staged());
    const fields = inputs(v);
    assert.deepEqual(
      fields.map((b) => [b.block_id, b.label!.text, b.element!.initial_value]),
      [
        [`${FIELD_BLOCK_PREFIX}0.rows.0.content`, "Front Stage Actions", "Emails the tutor that the call-off was received and excused."],
        [`${FIELD_BLOCK_PREFIX}0.rows.1.content`, "Back Stage Touchpoints", "Call-off received email"],
        [`${FIELD_BLOCK_PREFIX}0.rows.2.content`, "Regular Tutor, new text", "Files a one-time call-off 12 or more hours before the session and gets an email confirming it."],
      ],
    );
    assert.match(fields[0]!.hint!.text, /Step and lane are locked/);
    // No input for the deprecated row, nor for any step, lane or status.
    assert.ok(!fields.some((b) => /rows\.3|stepId|laneId|\.to$|\.from$/.test(b.block_id!)));
  });

  it("asks the owners its questions, then says who writes it, then the decision in its own words", () => {
    const v = view(staged());
    const questions = v.blocks.find((b) => b.type === "rich_text" && textOf(b).includes("before this is written:"))!;
    assert.ok(flat(questions).some((e) => e.type === "user" && e.user_id === SURAJ));
    const list = (questions.elements ?? []).find((e) => e.type === "rich_text_list") as Element & { style?: unknown };
    assert.equal((list as unknown as { style: string }).style, "ordered");
    assert.ok(flat(questions).some((e) => e.style?.code && e.text === "path"), "frame words in code");
    const contexts = v.blocks.filter((b) => b.type === "context").map((b) => json(b));
    assert.ok(contexts.some((c) => c.includes("Answer in Needs changes' note, or in the thread naming this path. Either redrafts this card.")));
    assert.ok(contexts.some((c) => c.includes("Written by uno-bot's blueprint identity, each row logged with its undo.")));
    assert.deepEqual(
      options(v).map((o) => [o.text.text, o.description?.text]),
      [
        ["Approve", "Writes the 4 changes to the blueprint now."],
        ["Needs changes", "I redraft the rows from your note, on this card."],
        ["Reject", "Nothing is written."],
      ],
    );
    assert.ok(v.submit, "a confirmer has Submit");
  });

  it("caps what it draws in full: twelve steps, twenty inputs, forty rows a step; the later steps' rows listed as text; the decision always on the view", () => {
    const steps = Array.from({ length: 14 }, (_, i) => ({ id: `s${i}`, name: `Step ${i + 1}` }));
    const lanes = Array.from({ length: 3 }, (_, i) => ({ id: `l${i}`, name: `Lane ${i + 1}` }));
    const big: PathToday = {
      ...TODAY,
      steps,
      lanes,
      cells: [
        ...steps.map((s, i) => ({ id: `c${i}`, laneId: "l0", stepId: s.id, content: `Today's row ${i + 1}`, status: "live" as const })),
        // Forty-five more rows in the first step, on lanes of their own.
        ...Array.from({ length: 45 }, (_, k) => ({ id: `x${k}`, laneId: `lx${k}`, stepId: "s0", content: `Extra ${k}`, status: "live" as const })),
      ],
    };
    const wide: PathToday = { ...big, lanes: [...lanes, ...Array.from({ length: 45 }, (_, k) => ({ id: `lx${k}`, name: `Extra lane ${k}` }))] };
    // Two additions in every step: 28 editable rows.
    const reply = JSON.stringify({
      rows: steps.flatMap((s) => [
        { change: "added", step_id: s.id, lane_id: "l1", content: `New in ${s.name}` },
        { change: "added", step_id: s.id, lane_id: "l2", content: `Also new in ${s.name}` },
      ]),
      confidence: 0.6,
      gaps: [],
    });
    const v = view(staged(waiting({ today: wide, draft: draftOf(reply, wide) })));
    assertFits(v);
    assert.equal(inputs(v).length, MAX_EDITABLE_ROWS, "twenty inputs");
    assert.equal(v.blocks.filter((b) => b.type === "rich_text" && /^Step \d+Today/.test(textOf(b))).length, 12, "twelve steps");
    const later = v.blocks.find((b) => b.type === "rich_text" && textOf(b).startsWith("2 more steps, as text"));
    assert.ok(later, "the steps past twelve are one block of text");
    for (const s of ["Step 13", "Step 14"]) {
      assert.ok(textOf(later!).includes(`${s}: Added Lane 2 New in ${s}`), `${s}'s rows are in sight before Approve`);
      assert.ok(textOf(later!).includes(`${s}: Added Lane 3 Also new in ${s}`));
    }
    assert.ok(json(v.blocks).includes("and 6 more on the blueprint"), "a step's rows past forty are counted");
    assert.equal(v.blocks.at(-2)!.block_id, "uno_review_choice", "the decision is on the view");
  });
});

// ── Edits, locks and the write ──────────────────────────────────────────────

/** A pop-up state holding these values, as Slack sends one. */
const stateWith = (values: Record<string, string>): ReviewViewState =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [`${FIELD_BLOCK_PREFIX}${key}`, { [FIELD_ACTION_ID]: { value } }]));

describe("a revision's edits", () => {
  it("reach the rows the Approve writes, through the writer", async () => {
    const proposal = staged();
    const fields = await reviewFields(proposal, undefined);
    const checked = checkEdits(proposal, fields, stateWith({ "0.rows.1.content": "Call-off confirmation email" }));
    assert.ok(checked.ok);
    assert.deepEqual(checked.edited, ["Back Stage Touchpoints"]);
    const revision = readRevision(checked.operations[0]!.input);
    assert.ok(!("error" in revision));
    const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
    const result = await writeRevision(revision, {
      sessionId: "session-1",
      async rpc(fn, args) {
        calls.push({ fn, args });
        if (fn === "upsert_cell_at_status") {
          const cell = TODAY.cells.find((c) => c.stepId === args.step_id && c.laneId === args.lane_id);
          return { id: cell?.id ?? `new-${calls.length}`, inserted: !cell, previous: cell ? { id: cell.id, content: cell.content, status: cell.status } : null };
        }
        return {};
      },
    });
    assert.equal(result.ok, true);
    const written = calls.filter((c) => c.fn === "upsert_cell_at_status").map((c) => [c.args.lane_id, c.args.content, c.args.status]);
    assert.deepEqual(written, [
      ["l-fsa", "Emails the tutor that the call-off was received and excused.", "live"],
      ["l-bst", "Call-off confirmation email", "live"],
      ["l-tutor", "Files a one-time call-off 12 or more hours before the session and gets an email confirming it.", "live"],
      ["l-tutor", "If it is less than 12 hours before session, tutor emails supervisor.", "deprecated"],
    ]);
  });

  it("ignore a forged value for a locked field: step, lane, status, or a deprecated row's text", async () => {
    const proposal = staged();
    const fields = await reviewFields(proposal, undefined);
    const checked = checkEdits(
      proposal,
      fields,
      stateWith({
        "0.rows.0.laneId": "l-bsa",
        "0.rows.0.stepId": "s-late",
        "0.rows.0.to": "planned",
        "0.rows.3.content": "Keep it",
        "0.pathId": "another-path",
      }),
    );
    assert.ok(checked.ok);
    assert.deepEqual(checked.edited, [], "nothing it did not offer is read");
    assert.deepEqual(checked.operations, proposalOperations(proposal), "the rows run as staged");
  });

  it("refuse an emptied row: removing a row is Needs changes", async () => {
    const proposal = staged();
    const checked = checkEdits(proposal, await reviewFields(proposal, undefined), stateWith({ "0.rows.0.content": "  " }));
    assert.equal(checked.ok, false);
  });

  it("show in View what was approved", () => {
    const proposal = staged();
    const ops = proposalOperations(proposal);
    const rows = (ops[0]!.input.rows as Array<{ content: string }>).map((r, i) => (i === 1 ? { ...r, content: "Call-off confirmation email" } : r));
    const decided: PendingProposal = { ...proposal, input: { ...ops[0]!.input, rows }, operations: [{ ...ops[0]!, input: { ...ops[0]!.input, rows } }] };
    const v = view(decided, { decided: { decision: "confirm", by: BILL } });
    assert.ok(json(v.blocks).includes("Call-off confirmation email"));
  });
});

// ── A4–A6: read-only, decided, sent back ────────────────────────────────────

describe("a revision opened by someone who cannot decide it", () => {
  it("says who can, first, then the same zones with each step one block and no input or Submit", () => {
    const v = view(staged(), { mayDecide: false });
    assertFits(v);
    assert.equal(v.blocks[0]!.type, "alert");
    assert.equal(v.blocks[0]!.text!.text, `Read-only. Only <@${SURAJ}> or <@${BILL}> can decide this proposal.`);
    assert.deepEqual(inputs(v), []);
    assert.equal(v.submit, undefined);
    assert.ok(!v.blocks.some((b) => b.block_id === "uno_review_choice"));
    const first = v.blocks.find((b) => b.type === "rich_text" && textOf(b).startsWith("Files call-off"))!;
    assert.match(textOf(first), /Added.*Changed.*→ Files a one-time call-off 12 or more hours before the session and gets an email/s, "one block, the change after an arrow");
    assert.ok(!json(v.blocks).includes("Either redrafts this card"), "no prompt to answer");
    assert.ok(json(v.blocks).includes("before this is written:"), "the questions still show");
  });
});

describe("a revision decided, opened from View", () => {
  it("says who approved it and what was written, over the steps, without the where line, the gaps or the questions", () => {
    const v = view(staged(), { decided: { decision: "confirm", by: BILL } });
    assertFits(v);
    assert.equal(v.blocks[0]!.type, "alert");
    assert.equal(v.blocks[0]!.level, "success");
    assert.equal(v.blocks[0]!.text!.text, `Approved by <@${BILL}> to write 4 changes to the blueprint.`);
    const all = json(v.blocks);
    assert.ok(!all.includes("written as"), "no where line");
    assert.ok(!v.blocks.some((b) => b.type === "alert" && b.level === "warning"), "no gaps alert");
    assert.ok(!all.includes("before this is written"), "no questions");
    assert.ok(all.includes("Why now"), "why now stays");
    assert.ok(all.includes("Written by uno-bot's blueprint identity"));
    assert.deepEqual(inputs(v), []);
  });
});

describe("a revision sent back with Needs changes", () => {
  it("says so in the pop-up and that the redraft takes the same card", () => {
    const proposal = staged();
    assert.equal(proposal.afterNeedsChanges, REVISION_SENT_BACK);
    const v = stateView(CARD, "info", proposal.afterNeedsChanges!, "Blueprint revision") as unknown as View;
    assert.equal(v.blocks[0]!.text!.text, "Sent back with your note.");
    assert.match(v.blocks[1]!.text!.text, /replaces this one on the same card; nothing is written until it's approved/);
  });

  it("a card staged before its facts rode the proposal shows its text, as before", () => {
    const { facts: _facts, ...before } = staged();
    const v = view(before);
    assert.equal(viewRefusal(v), null);
    assert.ok(!types(v).includes("header"));
    assert.deepEqual(inputs(v), [], "and offers no row to edit");
  });
});

// ── Approve, not ✅ ──────────────────────────────────────────────────────────

describe("what approves a revision", () => {
  it("is Approve in its Review: a ✅ on the carousel, or a typed one in the thread, decides nothing", async () => {
    const threadState = createInMemoryThreadState();
    const proposal = staged();
    await threadState.putProposal(proposal);
    const deps = { threadState, standingConfirmers: [] };
    const reaction = await resolveSignal({ kind: "reaction", messageTs: REPORT, channel: CHANNEL, thread: REPORT, glyph: "white_check_mark", userId: SURAJ }, deps);
    assert.notEqual(reaction.outcome, "won", "a ✅ on the carousel cannot say which card");
    const typed = await resolveSignal({ kind: "typed", channel: CHANNEL, thread: REPORT, text: ":white_check_mark:", userId: SURAJ }, deps);
    assert.notEqual(typed.outcome, "won", "nor can a typed one");
    const stranger = await resolveSignal({ kind: "review", messageTs: proposal.proposalTs, decision: "confirm", userId: STRANGER }, deps);
    assert.notEqual(stranger.outcome, "won", "nobody else may approve");
    const approved = await resolveSignal({ kind: "review", messageTs: proposal.proposalTs, decision: "confirm", userId: SURAJ }, deps);
    assert.equal(approved.outcome, "won", "the owner's Approve does");
  });
});

// ── A1: the card in the sweep ───────────────────────────────────────────────

describe("a revision's card in the morning sweep", () => {
  it("is titled by its path, its owners and RM-ID in the subtitle, what changes in its body, View slice and the RM-ID beside Review", () => {
    const r = waiting();
    const item = revisionItem(r.source, r.today, r.draft, { owners: ownersOf(r), confirmers: r.confirmers }, r.view);
    assert.equal(item.title, "Call-off Request › 12+ hours ahead");
    assert.equal(item.subtitle, "`RM-2567` deployed · `live`");
    assert.deepEqual(item.owners, [{ slack: SURAJ, name: "Suraj Andrews" }, { name: "Jose Deleon" }]);
    assert.equal(item.body, "2 added, 1 changed, 1 deprecated · 2 questions.", "the inferred row is asked about too");
    assert.deepEqual(item.open, { label: "View slice", url: "https://plus-uno.netlify.app/blueprint/?cell=c-2" });
    assert.deepEqual(item.also, { label: "RM-2567", url: SOURCE.url });
    assert.equal(item.done, "2 added, 1 changed, 1 deprecated.");
    for (const words of [item.title, item.subtitle!, item.body]) assert.doesNotMatch(words, LEADING_EMOJI);
  });

  it("says a design hand-off as handed off, at `planned`", () => {
    const handOff: RevisionSource = { ...SOURCE, status: { property: "Design Status", value: "Shipped" } };
    const draft = readDraft(DRAFT_REPLY, { title: "x", text: "x", today: TODAY, target: "planned" })!;
    const item = revisionItem(handOff, TODAY, draft, { owners: [], confirmers: [BILL] });
    assert.equal(item.subtitle, "`RM-2567` handed off · `planned`");
  });
});

// ── Retiring today's path ───────────────────────────────────────────────────

describe("retiring today's path", () => {
  const replacement = { scenario: "Call-off Request", path: "Self-serve call-offs" };

  it("is one more card: `live` → `deprecated`, one Deprecated group of every row, and only the path's status written", () => {
    const draft = retirementDraft(TODAY, replacement)!;
    assert.deepEqual(draft.revision.rows, [], "the path's status alone, so the Approve fits a press");
    assert.deepEqual(draft.revision.path, { from: "live", to: "deprecated" });
    const r = waiting({ draft });
    const item = revisionItem(r.source, r.today, draft, { owners: ownersOf(r), confirmers: r.confirmers });
    assert.equal(item.subtitle, "`RM-2567` deployed · `live` → `deprecated`");
    assert.equal(item.body, "Retires the path and its 6 rows.");

    const v = view(staged(r));
    assertFits(v);
    assert.match(textOf(v.blocks[1]!), /^Call-off Request · live → deprecated · 6 rows retire with it/);
    const labels = v.blocks.flatMap((b) => leaves(b)).filter((e) => e.style?.bold).map((e) => e.text);
    assert.ok(!labels.includes("Added") && !labels.includes("Changed"));
    assert.equal(v.blocks.flatMap((b) => leaves(b)).filter((e) => e.style?.strike).length, 6, "every row, struck through");
    assert.deepEqual(inputs(v), [], "nothing to edit");
    assert.deepEqual(
      options(v).map((o) => o.description?.text),
      ["Sets the path to deprecated now.", "A retirement isn't redrafted: Reject keeps the path as it is.", "Nothing is written."],
    );
  });
});

// ── B: the proposal ─────────────────────────────────────────────────────────

const COMPARISON: Comparison = {
  milestone: "prd",
  scenario: "Call-off Request",
  path: "12+ hours ahead",
  cellId: "c-1",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
  today: TODAY,
  text: "",
};
const IDEA = { title: "Self-serve call-offs", text: COMPARISON.quote };
const PROPOSAL_REPLY = JSON.stringify({
  rows: [
    { change: "changed", step_id: "s-files", lane_id: "l-tutor", content: "Posts the call-off on the board." },
    { change: "added", step_id: "s-files", lane_id: "l-fst", content: "Call-off board" },
    { change: "added", step_id: "s-after", lane_id: "l-bsa", content: "Offers the seat to the next free tutor." },
  ],
  confidence: 0.7,
  gaps: ["Your PRD doesn't say who offers the freed seat; I put it on Back Stage Actions."],
});
const proposalDraft = () => readProposalDraft(PROPOSAL_REPLY, COMPARISON, IDEA)!;
const offer = () =>
  stagedProposalOffer(proposalDraft(), {
    channel: CHANNEL,
    threadTs: "1760540000.000001",
    userMsgTs: "1760540000.000002",
    requesterUserId: SURAJ,
    proposalTs: "1760540000.000200",
    proposalText: "Draft as a blueprint proposal?",
  });

describe("the inline comparison (B1)", () => {
  it("is one short block per step either side has, lanes in code, touchpoints left out", () => {
    const text = comparisonText(TODAY, COMPARISON.quote, proposalDraft().changes);
    assert.match(text, /^\*\*Your idea changes how \[\*Call-off Request\*\]\(https:\/\/plus-uno\.netlify\.app\/blueprint\/\?cell=c-1\) works today\.\*\* Today's path is \*12\+ hours ahead\*:/);
    assert.match(text, /\*\*Files call-off \(12h\+, auto-approved\)\*\*\n- Today: Files a one-time call-off 12 or more hours before the session \(`Regular Tutor`\); Takes no action on auto-approved call-offs \(`Back Stage Actions`\)\n- Your idea: Posts the call-off on the board \(`Regular Tutor`\)/);
    assert.match(text, /\*\*Files late call-off \(<12h, immediate removal\)\*\*\n- Today: If it is less than 12 hours before session, tutor emails supervisor \(`Regular Tutor`\)\n- Your idea: no such step/);
    assert.doesNotMatch(text, /Front Stage Touchpoints|PLUS App|Call-off board/, "touchpoints are the pop-up's");
    assert.doesNotMatch(text, /\| ---/, "no table");
  });

  it("counts the steps past six", () => {
    const steps = Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, name: `Step ${i}` }));
    const today: PathToday = { ...TODAY, steps, cells: steps.map((s, i) => ({ id: `c${i}`, laneId: "l-tutor", stepId: s.id, content: `Row ${i}`, status: "live" as const })) };
    assert.match(comparisonText(today, "", [{ step: "Step 0", lane: "Regular Tutor", content: "Idea" }]), /…and 3 more steps on the blueprint\.$/);
  });
});

describe("the “Draft as a blueprint proposal?” card (B2)", () => {
  it("is short in the thread — its summary, its line, the LLM line and Review — with no leading emoji", () => {
    const rendered = renderProposalCard(proposalOfferCard(proposalDraft()));
    const blocks = rendered.blocks as Block[];
    assert.equal(messageBlocksRefusal(blocks), null);
    assert.deepEqual(blocks.map((b) => b.type), ["section", "context", "context", "actions"]);
    assert.equal(blocks[0]!.text!.text, "*Draft as a blueprint proposal?* _Call-off Request › Self-serve call-offs_ · 3 `proposed` rows");
    assert.equal((blocks[1]!.elements![0] as { text: string }).text, "New `path` beside today's _12+ hours ahead_ · only you can decide");
    for (const b of blocks) assert.doesNotMatch(json(b), /"text":"\s*(?::[a-z0-9_+-]+:|\p{Extended_Pictographic})/u);
  });

  it("keeps ✅: a reaction on its own card from the requester decides it", async () => {
    const threadState = createInMemoryThreadState();
    const proposal = offer();
    await threadState.putProposal(proposal);
    const verdict = await resolveSignal(
      { kind: "reaction", messageTs: proposal.proposalTs, channel: CHANNEL, thread: proposal.threadTs!, glyph: "white_check_mark", userId: SURAJ },
      { threadState, standingConfirmers: [] },
    );
    assert.equal(verdict.outcome, "won");
  });
});

describe("a blueprint proposal in Review (B3)", () => {
  it("is the new path as the header, where it is drawn, its guesses as alerts, today's card, and Today then Proposed per step", () => {
    const v = view(offer());
    assertFits(v);
    assert.equal(v.title.text, "Blueprint proposal");
    assert.equal(v.blocks[0]!.text!.text, "Call-off Request › Self-serve call-offs");
    assert.equal(textOf(v.blocks[1]!), "New path in Call-off Request · written as proposed · nothing live changes");
    assert.deepEqual(flat(v.blocks[1]!).filter((e) => e.style?.code).map((e) => e.text), ["path", "proposed", "live"]);
    const alerts = v.blocks.filter((b) => b.type === "alert");
    assert.equal(alerts[0]!.level, "warning");
    assert.match(alerts[0]!.text!.text, /who offers the freed seat/);
    const card = v.blocks.find((b) => b.type === "card")!;
    assert.equal(card.title!.text, "Today: 12+ hours ahead");
    const steps = v.blocks.filter((b) => b.type === "rich_text" && leaves(b)[0]?.style?.bold);
    assert.deepEqual(
      steps.map((b) => leaves(b)[0]!.text),
      ["Files call-off (12h+, auto-approved)", "Files late call-off (<12h, immediate removal)", "After the session"],
    );
    assert.match(textOf(steps[1]!), /TodayRegular Tutor If it is less.*ProposedNo such step/s);
    for (const s of steps) assert.equal(v.blocks[v.blocks.indexOf(s) + 1]!.type, "divider");
    assert.deepEqual(inputs(v), [], "a proposal's rows are not inputs, even for the requester");
    assert.equal(options(v)[0]!.description!.text, "Writes 3 proposed rows on a new path beside today's.");
  });

  it("decided, is the drawn path and what each step wrote, and how to withdraw it (B4)", () => {
    const v = view(offer(), { decided: { decision: "confirm", by: SURAJ } });
    assertFits(v);
    assert.equal(v.blocks[0]!.text!.text, `Approved by <@${SURAJ}> to draw 3 \`proposed\` rows on the blueprint.`);
    const card = v.blocks.find((b) => b.type === "card")!;
    assert.equal(card.title!.text, "Proposed: Self-serve call-offs");
    assert.equal(card.subtitle!.text, "Call-off Request · new path · 3 rows, proposed");
    const all = json(v.blocks);
    assert.ok(!all.includes("Files late call-off"), "a step it wrote nothing in is left out");
    assert.ok(!all.includes("Takes no action"), "today's rows are not repeated");
    assert.ok(all.includes("Say “remove it” in the thread to withdraw it."));
  });
});
