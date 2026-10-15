// The Worker's own cards in the Review pop-up's shared anatomy: the Figma
// tidy-up, the Dev Mode links, the DS precedence intake and the sweep's shared
// note (`docs/plans/2026-10-15-review-modal-redesign.md` § 10–13).
//
// Each proposal is the one its real stager writes, so the facts the pop-up
// draws are the stager's own (`PendingProposal.facts`). Each view is held to
// what Slack takes in a modal (`helpers/slack-block-rules.ts`). A card staged
// before the facts rode the proposal is its stager's proposal without them,
// and the pop-up shows its text.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { draftView } from "../src/slack/review-view";
import { OPEN_ACTION_ID } from "../src/slack/card-block";
import { codeStyled } from "../src/slack/review-stated";
import { stagedFinding } from "../src/figma-tidy/run";
import { stagedDevLinks } from "../src/figma-links/run";
import { stagedComponent } from "../src/ds-precedence/jobs";
import { stageSweepShare, SWEEP_SHARE_TOOL } from "../src/sweep/share";
import { raiseCard } from "../src/dm-sweep/copy";
import { renderProposalCard } from "../src/slack/proposal-render";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { createInMemoryProposalEventLog } from "../src/usage/proposal-events-in-memory";
import type { OperationOutcome } from "../src/gate/index";
import type { TidyCard, TidyFinding } from "../src/figma-tidy/checks";
import type { ComponentFinding } from "../src/ds-precedence/report";
import { viewRefusal } from "./helpers/slack-block-rules";

const CHANNEL = "C0SANDBOX1";
const MESSAGE = "1760540000.000100";
const BILL = "U0BILL0001";
const CARD = { channel: CHANNEL, ts: MESSAGE };

type Element = { type: string; text?: string; url?: string; channel_id?: string; style?: { bold?: boolean; code?: boolean }; elements?: Element[] };
type Block = {
  type: string;
  block_id?: string;
  text?: { text: string };
  title?: { text: string };
  body?: { text: string };
  label?: { text: string };
  elements?: Element[];
  actions?: Array<{ url?: string; action_id?: string; text: { text: string } }>;
  element?: { options?: Array<{ value: string; text: { text: string }; description?: { text: string } }> };
};
type View = { title: { text: string }; blocks: Block[] };

const decide = (proposal: PendingProposal, mayDecide = true) => draftView(CARD, proposal, { mayDecide, confirmers: [BILL] }) as unknown as View;
const blocksOf = (view: View) => view.blocks;
const types = (view: View) => blocksOf(view).map((b) => b.type);
const options = (view: View) => blocksOf(view).find((b) => b.block_id === "uno_review_choice")?.element?.options ?? [];
/** Every rich text element in a block, flattened. */
const elementsOf = (block: Block): Element[] => (block.elements ?? []).flatMap((e) => [e, ...(e.elements ?? []).flatMap((c) => [c, ...(c.elements ?? [])])]);
/** A card staged before its facts rode the proposal. */
const stagedBefore = ({ facts: _facts, ...rest }: PendingProposal): PendingProposal => rest;

/** What Slack holds every Review view to, whichever card it draws. */
function assertFits(view: View): void {
  assert.equal(viewRefusal(view), null, "Slack takes the view");
  assert.ok(view.title.text.length <= 24, "the title fits");
  assert.ok(blocksOf(view).length <= 100, "the blocks fit");
  assert.ok(!blocksOf(view).some((b) => ["table", "markdown", "container"].includes(b.type)), "only blocks a modal takes");
  const header = blocksOf(view).find((b) => b.type === "header");
  if (header) assert.ok(header.text!.text.length <= 150);
  for (const card of blocksOf(view).filter((b) => b.type === "card")) assert.ok(!card.body || card.body.text.length <= 200);
  for (const o of options(view)) assert.ok(!o.description || o.description.text.length <= 75, o.value);
  const texts: string[] = [];
  JSON.stringify(view, (key, value) => {
    if (key === "text" && typeof value === "string") texts.push(value);
    return value;
  });
  assert.ok(texts.every((t) => t.length <= 3000), "every text fits");
}

/** The pop-up's fallback for a card it cannot read: its text, under "The draft". */
function assertTextFallback(view: View, text: string): void {
  assert.equal(viewRefusal(view), null);
  assert.equal(blocksOf(view)[0]!.type, "section");
  assert.equal(blocksOf(view)[0]!.text!.text, "*The draft*");
  assert.ok(!types(view).includes("header"), "no anatomy header");
  const json = JSON.stringify(view);
  const firstLine = text.split("\n")[0]!.replace(/[*<>|]/g, " ").split(/\s+/).find((w) => w.length > 4)!;
  assert.ok(json.includes(firstLine), `the card's text is shown: ${firstLine}`);
}

// ── Figma tidy-up ───────────────────────────────────────────────────────────

const FILE_KEY = "W0qzhXWxFsMwSJzkdV2yal";
const TIDY_FINDING: TidyFinding = {
  fingerprint: `unknown-card|${FILE_KEY}|412`,
  file: { team: "Design", folderId: "F1", key: FILE_KEY, name: "Card 412 · Session sign-up" },
  folder: { team: "Design", id: "F1", name: "In progress" },
  owner: null,
  check: "unknown-card",
  card: 412,
};
const LIKELY: TidyCard = { number: 421, title: "Session sign-up waitlist", url: "https://www.notion.so/421", designStatus: null, devStatus: null, owner: null, designers: [] };
const tidy = () => stagedFinding(CHANNEL, MESSAGE, { finding: TIDY_FINDING, likely: LIKELY }, [BILL]);

describe("a Figma tidy-up card in Review", () => {
  it("is the file as the header and the finding as a card with Open file, then what answering does", () => {
    const view = decide(tidy());
    assertFits(view);
    assert.equal(view.title.text, "Figma tidy-up");
    assert.deepEqual(types(view), ["header", "card", "context", "divider", "input", "input"]);
    assert.equal(blocksOf(view)[0]!.text!.text, "Card 412 · Session sign-up");
    const card = blocksOf(view)[1]!;
    assert.equal(card.title!.text, "Unknown card");
    assert.equal(card.body!.text, 'Card 412 isn\'t on the Roadmap. Likely Card 421, "Session sign-up waitlist".');
    assert.match(JSON.stringify(blocksOf(view)[2]), /Your answer records what you did/);
  });

  it("opens the file from the facts' link", () => {
    const proposal = tidy();
    const moved = { ...proposal, facts: { ...proposal.facts!, fileUrl: "https://www.figma.com/design/OTHERKEY" } as PendingProposal["facts"] };
    const button = blocksOf(decide(moved))[1]!.actions![0]!;
    assert.equal(button.text.text, "Open file");
    assert.equal(button.url, "https://www.figma.com/design/OTHERKEY");
    assert.equal(blocksOf(decide(proposal))[1]!.actions![0]!.url, `https://www.figma.com/design/${FILE_KEY}`);
  });

  it("offers its own answers under Your answer, each saying what it does, with values Submit reads", () => {
    const view = decide(tidy());
    const choice = blocksOf(view).find((b) => b.block_id === "uno_review_choice")!;
    assert.equal(choice.label!.text, "Your answer");
    assert.deepEqual(
      options(view).map((o) => [o.value, o.text.text, o.description?.text]),
      [
        ["choice:cancel:moved", "Moved it", "Next week's tidy-up checks the file again."],
        ["choice:confirm:leave", "Leave as is", "Not raised again until the file's cards change."],
      ],
    );
  });

  it("keeps the body under the card when the finding is longer than a card holds", () => {
    const proposal = tidy();
    const long = { ...proposal, facts: { ...proposal.facts!, finding: "x".repeat(260) } as PendingProposal["facts"] };
    const view = decide(long);
    assertFits(view);
    assert.equal(blocksOf(view)[1]!.body, undefined);
    assert.equal(blocksOf(view)[2]!.type, "section");
  });

  it("staged before its facts, shows the card's text", () => {
    const proposal = stagedBefore(tidy());
    const view = decide(proposal);
    assertTextFallback(view, proposal.proposalText);
    assert.equal(blocksOf(view).find((b) => b.block_id === "uno_review_choice")!.label!.text, "Your answer", "its answers still decide it");
  });
});

// ── Dev Mode links ──────────────────────────────────────────────────────────

const FIGMA_URL = `https://www.figma.com/design/${FILE_KEY}?node-id=1-2`;
const CODE_URL = "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Button/Button.jsx";
const STORYBOOK_URL = "https://plus-uno.netlify.app/storybook/?path=/docs/button";
const LINKS = [
  { file_key: FILE_KEY, node_id: "1:2", name: "Code (plus-uno): Button", url: CODE_URL },
  { file_key: FILE_KEY, node_id: "1:2", name: "Storybook: Button", url: STORYBOOK_URL },
];
const devLinks = (introduce = true) =>
  stagedDevLinks(
    CHANNEL,
    MESSAGE,
    MESSAGE,
    { kind: "component", component: "Button", figmaUrl: FIGMA_URL, storybook: STORYBOOK_URL },
    { links: LINKS, introduce: introduce ? [{ file_key: FILE_KEY, node_id: "1:2", component: "Button" }] : [] },
    [BILL],
  );

describe("a Dev Mode links card in Review", () => {
  it("names the component in the header, says what Approve adds where, and lists the links as link elements", () => {
    const view = decide(devLinks());
    assertFits(view);
    assert.equal(view.title.text, "Review Dev Mode links");
    assert.deepEqual(types(view), ["header", "rich_text", "rich_text", "context", "divider", "input", "input"]);
    assert.equal(blocksOf(view)[0]!.text!.text, "Add Dev Mode links to Button");
    const where = elementsOf(blocksOf(view)[1]!).filter((e) => e.type === "text" || e.type === "link");
    assert.deepEqual(
      where.map((e) => e.text),
      ["Adds 2 links in Dev Mode to 1 library component in ", "Figma", ", and one comment saying what they are."],
    );
    assert.equal(where.find((e) => e.type === "link")!.url, FIGMA_URL);
    const links = elementsOf(blocksOf(view)[2]!).filter((e) => e.type === "link");
    assert.deepEqual(
      links.map((l) => [l.text, l.url]),
      [
        ["Code (plus-uno)", CODE_URL],
        ["Storybook", STORYBOOK_URL],
      ],
    );
    assert.doesNotMatch(JSON.stringify(view), /•|\|open in Figma>/, "no mrkdwn bullets or links");
  });

  it("says what Approve and Reject do, and leaves the comment out where none is left", () => {
    assert.deepEqual(
      options(decide(devLinks())).map((o) => o.description?.text),
      ["Adds the links and the comment in Figma.", "I redraft it from your note and post a new card.", "Adds nothing."],
    );
    const quiet = decide(devLinks(false));
    assert.equal(options(quiet)[0]!.description!.text, "Adds the links in Figma.");
    assert.doesNotMatch(JSON.stringify(blocksOf(quiet)[1]), /comment/);
  });

  it("on a batch, lists each component with its links", () => {
    const proposal = stagedDevLinks(
      CHANNEL,
      MESSAGE,
      MESSAGE,
      {
        kind: "batch",
        figmaUrl: FIGMA_URL,
        components: [
          { component: "Button", adds: LINKS.map(({ name, url }) => ({ name, url })), renamed: false },
          { component: "Badge", adds: [{ name: "Storybook: Badge", url: "https://plus-uno.netlify.app/storybook/?path=/docs/badge" }], renamed: true },
        ],
      },
      { links: [...LINKS, { file_key: FILE_KEY, node_id: "3:4", name: "Storybook: Badge", url: "https://plus-uno.netlify.app/storybook/?path=/docs/badge" }], introduce: [] },
      [BILL],
    );
    const view = decide(proposal);
    assertFits(view);
    assert.equal(blocksOf(view)[0]!.text!.text, "Add Dev Mode links to 2 components");
    const list = (blocksOf(view)[2]!.elements![1]!.elements ?? []) as Element[];
    assert.equal(list.length, 2);
    assert.deepEqual(list[0]!.elements!.filter((e) => e.type === "link").map((e) => e.text), ["Code (plus-uno)", "Storybook"]);
    assert.match(JSON.stringify(list[1]), /Badge.*renames its Code link/);
    assert.match(JSON.stringify(blocksOf(view)[3]), /writes in steps/);
  });

  it("caps a long batch's list and says how many more", () => {
    const components = Array.from({ length: 60 }, (_, i) => ({ component: `C${i}`, adds: [{ name: `Storybook: C${i}`, url: `https://plus-uno.netlify.app/storybook/?path=/docs/c${i}` }], renamed: false }));
    const proposal = stagedDevLinks(
      CHANNEL,
      MESSAGE,
      MESSAGE,
      { kind: "batch", figmaUrl: FIGMA_URL, components },
      { links: components.map((c, i) => ({ file_key: FILE_KEY, node_id: `${i}:1`, name: c.adds[0]!.name, url: c.adds[0]!.url })), introduce: [] },
      [BILL],
    );
    const view = decide(proposal);
    assertFits(view);
    const list = blocksOf(view)[2]!.elements![1]!.elements!;
    assert.equal(list.length, 41);
    assert.match(JSON.stringify(list.at(-1)), /and 20 more/);
  });

  it("staged before its facts, shows the card's text", () => {
    const proposal = stagedBefore(devLinks());
    assertTextFallback(decide(proposal), proposal.proposalText);
  });
});

// ── DS precedence intake ────────────────────────────────────────────────────

const BADGE_CODE = "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Badge/Badge.jsx";
const BADGE_FIGMA = "https://www.figma.com/design/W0qz?node-id=3-4";
const BADGE: ComponentFinding = {
  component: "Badge",
  items: [
    { key: "Badge|size|value", component: "Badge", kind: "axis-values", summary: 'code has `size="xs"`, the library doesn\'t', codeUrl: BADGE_CODE, figmaUrl: BADGE_FIGMA, winner: "code", loser: "library" },
    { key: "Badge|pill|variant", component: "Badge", kind: "axis-values", summary: "the library has a `pill` variant code doesn't", codeUrl: BADGE_CODE, figmaUrl: BADGE_FIGMA, winner: "code", loser: "library" },
  ],
};
const precedence = () => stagedComponent(CHANNEL, MESSAGE, BADGE, "2026-10-12", [BILL]);

describe("a DS precedence card in Review", () => {
  it("is the finding as the header, the week's intake as the where line, and what differs with props in code style", () => {
    const view = decide(precedence());
    assertFits(view);
    assert.equal(view.title.text, "Review DS intake");
    assert.deepEqual(types(view), ["header", "rich_text", "rich_text", "actions", "divider", "input", "input"]);
    assert.equal(blocksOf(view)[0]!.text!.text, "Badge: the library needs the fix");
    const week = elementsOf(blocksOf(view)[1]!).find((e) => e.style?.bold);
    assert.equal(week!.text, "Oct 12");
    const code = elementsOf(blocksOf(view)[2]!).filter((e) => e.style?.code).map((e) => e.text);
    assert.deepEqual(code, ['size="xs"', "pill"]);
    const lines = (blocksOf(view)[2]!.elements![1]!.elements ?? []).map((l) => (l.elements ?? []).map((e) => e.text).join(""));
    assert.deepEqual(lines, ['Code has size="xs", the library doesn\'t', "The library has a pill variant code doesn't"]);
    assert.doesNotMatch(JSON.stringify(blocksOf(view)[2]), /`/, "no backticks left in the list");
  });

  it("has Code and Figma buttons whose links are the facts'", () => {
    const view = decide(precedence());
    const row = blocksOf(view)[3]! as unknown as { elements: Array<{ action_id: string; text: { text: string }; url: string }> };
    assert.deepEqual(
      row.elements.map((b) => [b.text.text, b.url]),
      [
        ["Code", BADGE_CODE],
        ["Figma", BADGE_FIGMA],
      ],
    );
    assert.ok(row.elements.every((b) => b.action_id.startsWith(`${OPEN_ACTION_ID}_`)), "the Open buttons' ids, which the endpoint acks");
    const proposal = precedence();
    const moved = { ...proposal, facts: { ...proposal.facts!, codeUrl: "https://github.com/o/r/blob/main/X.jsx", figmaUrl: "https://www.figma.com/design/Y" } as PendingProposal["facts"] };
    const urls = (blocksOf(decide(moved))[3]! as unknown as { elements: Array<{ url: string }> }).elements.map((b) => b.url);
    assert.deepEqual(urls, ["https://github.com/o/r/blob/main/X.jsx", "https://www.figma.com/design/Y"]);
  });

  it("says what each decision does, Needs changes writing the note on the intake", () => {
    assert.deepEqual(
      options(decide(precedence())).map((o) => o.description?.text),
      ["Adds it to this week's intake.", "Your note goes on the intake: the library is right, or it is deliberate.", "Left as deliberate. Nothing is filed."],
    );
  });

  it("staged before its facts, shows the card's text", () => {
    const proposal = stagedBefore(precedence());
    assertTextFallback(decide(proposal), proposal.proposalText);
  });
});

describe("a difference's code style", () => {
  it("styles each backticked stretch, and leaves an unmatched backtick as text", () => {
    assert.deepEqual(codeStyled("has `a` and `b`"), [
      { type: "text", text: "has " },
      { type: "text", text: "a", style: { code: true } },
      { type: "text", text: " and " },
      { type: "text", text: "b", style: { code: true } },
    ]);
    assert.deepEqual(codeStyled("one ` only"), [{ type: "text", text: "one ` only" }]);
  });
});

// ── The sweep's shared note ─────────────────────────────────────────────────

const PAGE_URL = "https://www.notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const applied: OperationOutcome = {
  toolName: "notion_update",
  input: { page_url: PAGE_URL, replace: [] },
  ok: true,
  result: JSON.stringify({ ok: true }),
  message: "updated",
};

/** A group DM's share card, as `stageSweepShare` stages it. */
async function shareCard(): Promise<PendingProposal> {
  const fix: PendingProposal = {
    toolName: "notion_update",
    input: {},
    channel: "G0MPIM",
    threadTs: "1760540000.000010",
    replyTs: "1760540000.000010",
    userMsgTs: "1760540000.000010",
    proposalTs: "1760540000.000020",
    proposalText: "",
    requesterUserId: "",
    confirmers: [BILL],
    sweepShare: { pages: [{ url: PAGE_URL, title: "Tutor guide & FAQ <draft>", to: "plus-design" }] },
  };
  const staged = await stageSweepShare(fix, [applied], {
    channels: { plusDesign: "C0PLUSDES1" },
    async post(_to, card) {
      return { ok: true, ts: MESSAGE, text: renderProposalCard(card).text };
    },
    threadState: createInMemoryThreadState(),
    proposalEvents: createInMemoryProposalEventLog(),
    now: () => 1_760_540_000_000,
  });
  assert.ok(staged, "the share card staged");
  return staged;
}

describe("a sweep's shared note in Review", () => {
  it("names the channel as a pill, then quotes the note exactly as it posts", async () => {
    const proposal = await shareCard();
    const view = decide(proposal);
    assertFits(view);
    assert.equal(view.title.text, "Review shared note");
    assert.deepEqual(types(view), ["header", "rich_text", "rich_text", "context", "divider", "input", "input"]);
    assert.equal(blocksOf(view)[0]!.text!.text, "Share what was settled");
    const where = elementsOf(blocksOf(view)[1]!);
    assert.deepEqual(where.find((e) => e.type === "channel"), { type: "channel", channel_id: "C0PLUSDES1" });
    assert.match(where.at(-1)!.text!, /Nothing else leaves this group DM\./);
    const quote = blocksOf(view)[2]!.elements![0]!;
    assert.equal(quote.type, "rich_text_quote");
    const posted = proposal.input.text as string;
    assert.equal(quote.elements![0]!.text, posted.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    assert.match(quote.elements![0]!.text!, /Tutor guide & FAQ <draft>/, "shown as the post reads, not as escaped mrkdwn");
    assert.deepEqual(options(view).map((o) => o.description?.text), ["Posts exactly this note.", "I redraft it from your note and post a new card.", "Nothing posts."]);
  });

  it("draws the DM sweep's raise note the same way, from its own facts", () => {
    const { operations, facts } = raiseCard({ when: "Yesterday", topic: "the warning colour", sources: ["Figma", "the code"], channel: "C0UNIVERSAL", to: "plus-universal" });
    const proposal: PendingProposal = {
      operations,
      toolName: SWEEP_SHARE_TOOL,
      input: operations[0]!.input,
      channel: "D0MAYA",
      threadTs: "1",
      userMsgTs: "1",
      proposalTs: MESSAGE,
      proposalText: "",
      requesterUserId: "U0MAYA",
      facts,
    };
    const view = decide(proposal);
    assertFits(view);
    assert.equal(blocksOf(view)[0]!.text!.text, "Raise a disagreement");
    assert.deepEqual(elementsOf(blocksOf(view)[1]!).find((e) => e.type === "channel"), { type: "channel", channel_id: "C0UNIVERSAL" });
    assert.match(JSON.stringify(blocksOf(view)[1]), /Nothing else leaves this DM/);
    assert.match(JSON.stringify(blocksOf(view)[2]), /disagree on the warning colour/);
  });

  it("is read-only for someone who can't decide: the same zones, no decision", async () => {
    const view = decide(await shareCard(), false);
    assertFits(view);
    assert.ok(!types(view).includes("input"));
    // Who can decide opens the view as an info alert (§ The shared anatomy,
    // Read-only); the draft's zones follow from the header.
    assert.deepEqual(types(view).slice(0, 2), ["alert", "header"]);
    assert.equal((view.blocks[0] as { level?: string }).level, "info");
  });

  it("staged before its facts, shows the card's text", async () => {
    const proposal = stagedBefore(await shareCard());
    assertTextFallback(decide(proposal), proposal.proposalText);
  });
});
