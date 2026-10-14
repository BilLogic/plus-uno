// Every Figma message uno-bot's code writes, against the copy Bill approved in
// #886 (2026-09-30) — the weekly precedence report, the drift question and its
// withdrawal, the comment-decision thread (#900), and what each card says at
// the gate.
//
// Two things are pinned, the way tests/share-out.test.ts pins its post:
//   • each renderer's words, as literals: its first line, its counts against
//     its names, and its one footer;
//   • `docs/connectors/slack.md` § Figma messages, read from the file: its
//     Not column is the list of words no message may use, and its checklist
//     is what every message below is held to. A rule rewritten there is a
//     test that changes here.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  byComponent,
  precedenceCard,
  precedenceCardWords,
  precedenceItem,
  precedenceParent,
  precedenceRuleUrl,
  PRECEDENCE_REVISION_REFUSAL,
} from "../src/ds-precedence/report";
import type { Disagreement } from "../src/ds-precedence/compare";
import { allClearText, findingBody, ownerLine, tidyCard, tidyItem, tidyParent, TIDY_REVISION_REFUSAL } from "../src/figma-tidy/copy";
import type { TidyFinding } from "../src/figma-tidy/checks";
import { decisionReport, reportMessage, reportRecord } from "../src/slack/decision-cards";
import type { ReportItemState } from "../src/thread-state/index";
import { PRECEDENCE_CARD_TTL_MS } from "../src/ds-precedence/jobs";
import { CONFIRM_FOOTER, renderProposalCard } from "../src/slack/proposal-render";
import { renderGateNote, statedCancelledNote } from "../src/slack/gate-note";
import {
  caughtUpNote,
  caughtUpText,
  driftCardWords,
  driftItem,
  driftParent,
  driftReview,
  DRIFT_CARD_TTL_MS,
  DRIFT_NO_REVISION,
  DRIFT_NOT_POSTED_TEXT,
  DRIFT_NOT_STAGED,
  elsewhereLine,
  fileName,
  pillarNote,
  type DriftFileWords,
} from "../src/figma-drift/copy";
import type { GateNote } from "../src/turn/index";
import { STANDING_TOO } from "../src/sweep/capture-lines";
import { decisionCard, decisionCardWords, decisionItem, decisionParent, rewordInstead, whichOne } from "../src/figma-comments/copy";
import { DECISION_CARD_TTL_MS } from "../src/figma-comments/post";
import type { QueuedDecision } from "../src/figma-comments/queue";
import { askLeadText, figmaReplyText, type FigmaReply } from "../src/figma-ask/copy";
import {
  DEV_LINKS_REVISION_REFUSAL,
  devLinksCard,
  devLinksCarryOn,
  devLinksComment,
  isDevLinksComment,
  devLinksFinished,
  devLinksGaveUp,
  devLinksItem,
  devLinksNotCarried,
  devLinksParent,
  devLinksStopped,
  type DevLinksSubject,
  type DevLinksWrite,
} from "../src/figma-links/copy";

// ── The doc ──────────────────────────────────────────────────────────────────

const root = join(process.cwd(), "..", "..");
const doc = readFileSync(join(root, "docs", "connectors", "slack.md"), "utf8");
const start = doc.indexOf("## Figma messages");
const section = doc.slice(start, doc.indexOf("<!-- /ide-only -->", start));

/** The Not column: every phrase, one per entry. */
const RETIRED: string[] = section
  .split("\n")
  .filter((line) => /^\|.*\|\s*$/.test(line) && !/^\|\s*-/.test(line) && !/^\|\s*Say\s*\|/.test(line))
  .flatMap((row) => row.split("|")[2]!.split(","))
  .map((w) => w.trim())
  .filter(Boolean);

describe("the doc the messages answer to", () => {
  it("holds the vocabulary table and the eight-point checklist", () => {
    assert.ok(start > -1, "slack.md has a § Figma messages");
    // Guard the guard: an emptied table would let every message pass.
    assert.ok(RETIRED.length >= 12, RETIRED.join(" | "));
    for (const word of ["metadata changed", "dispute", "unmapped", "RM-2482", "Foundation library"]) {
      assert.ok(RETIRED.includes(word), `the Not column still lists "${word}"`);
    }
    const checklist = section.split("\n").filter((l) => /^\d\. /.test(l));
    assert.equal(checklist.length, 8);
    assert.match(section, /Under 1,500 characters/);
    assert.match(section, /one footer/);
  });
});

// ── The checklist, as code ───────────────────────────────────────────────────

/** A message as a person reads it: link labels, no URLs. */
function readable(text: string): string {
  return text.replace(/<([^|>]+)\|([^>]+)>/g, "$2").replace(/https?:\/\/\S+/g, "");
}

/**
 * The checks #886 holds every message to that can be read off the text.
 *
 * @param gate - The message carries the ✅/⛔ footer
 * @param ship - The message marks a ship, the one place 🎉 belongs
 */
function passesChecklist(text: string, { gate = false, ship = false } = {}): void {
  assert.ok(text.length <= 1500, `${text.length} chars:\n${text}`);
  assert.ok(text.split("\n")[0]!.trim(), "a first line that says something");
  assert.doesNotMatch(text, /<!(here|channel|everyone)>/);
  assertVocabulary(text);
  // Emoji only as the gate, and one 🎉 on a ship.
  const emoji = text.match(/:[a-z_]+:/g) ?? [];
  const allowed = new Set(["white_check_mark", "no_entry", ...(ship ? ["tada"] : [])].map((e) => `:${e}:`));
  for (const e of emoji) assert.ok(allowed.has(e), `${e} is not a gate or a ship`);
  // One footer: one line says what ✅ does, and it says what ⛔ does too.
  const footers = text.split("\n").filter((l) => l.includes(":white_check_mark:"));
  if (gate) {
    assert.equal(footers.length, 1, text);
    assert.match(footers[0]!, /:no_entry:/);
  } else {
    assert.equal(footers.length, 0, text);
    assert.doesNotMatch(text, /:no_entry:/);
  }
  assert.ok(!text.includes(CONFIRM_FOOTER), "no second, shared footer");
  assert.doesNotMatch(text, /About to/);
}

/**
 * A retired phrase as a whole word, so "unmapped" never matches inside another.
 * "the Figma" retires a name for the file, not the word before "file": #886's
 * own drift question (§ 3.3) asks "Is the Figma file still current?".
 */
function retiredPattern(retired: string): RegExp {
  const phrase = retired.toLowerCase();
  const notBefore = phrase === "the figma" ? "(?! file)" : "";
  return new RegExp(`(^|[^\\w-])${phrase.replace(/[.*+?^${}()|[\]\\#]/g, "\\$&")}${notBefore}($|[^\\w-])`);
}

/** One vocabulary: no word from the Not column. */
function assertVocabulary(text: string): void {
  const words = readable(text).toLowerCase();
  for (const retired of RETIRED) {
    assert.doesNotMatch(words, retiredPattern(retired), `"${retired}" is retired (slack.md § Figma messages)`);
  }
}

// ── The weekly precedence report (shared decision card) ──────────────────────

const FILE_KEY = "LIBFILEKEY";
const REPO = "BilLogic/plus-uno";
const RULE_URL = precedenceRuleUrl(REPO);

function item(n: number, component: string, summary: string): Disagreement {
  return {
    key: `${component}:${n}`,
    component,
    kind: "axis-values",
    summary,
    codeUrl: `https://github.com/${REPO}/blob/main/${component}.md`,
    figmaUrl: `https://www.figma.com/design/${FILE_KEY}?node-id=1-${n}`,
    winner: "code",
    loser: "library",
  };
}

const THREE = byComponent([
  item(1, "Button", 'code has `size="xs"`, the library doesn\'t'),
  item(2, "Badge", 'the library has `tone="neon"`, code doesn\'t'),
  item(3, "Card", "code has it, the library has no published component for it"),
]);

describe("the weekly precedence report", () => {
  it("opens with one plain line: the count, and the rule linked", () => {
    const parent = precedenceParent(3, RULE_URL);
    assert.equal(parent, `Code and the library disagree on 3 components. <${RULE_URL}|Code wins> unless a difference is deliberate.`);
    assert.equal(precedenceParent(1, RULE_URL).split(".")[0], "Code and the library disagree on 1 component");
    passesChecklist(parent);
  });

  it("gives each component a card: its name, the side that needs the fix, and what differs, plainly", () => {
    const button = precedenceItem(THREE[0]!);
    assert.deepEqual(button, {
      id: "Button",
      title: "Button",
      subtitle: "Library side",
      body: 'Code has size="xs", the library doesn\'t.',
      open: { label: "Code", url: `https://github.com/${REPO}/blob/main/Button.md` },
      also: { label: "Figma", url: `https://www.figma.com/design/${FILE_KEY}?node-id=1-1` },
      done: "added to this week's DS precedence intake.",
    });
    for (const f of THREE) passesChecklist([precedenceItem(f).title, precedenceItem(f).body].join("\n"));
  });

  it("Review shows the whole item, and says nothing to type or react", () => {
    const text = renderProposalCard(precedenceCard(THREE[0]!, "2026-09-28")).text;
    assert.equal(
      text,
      [
        `*Button* · library side needs the fix · <https://github.com/${REPO}/blob/main/Button.md|code> · <https://www.figma.com/design/${FILE_KEY}?node-id=1-1|Figma>`,
        '• code has `size="xs"`, the library doesn\'t',
        "Approving adds it to the DS precedence intake for the week of Sep 28, filing the intake if this is the week's first. Needs changes puts your note on the intake instead, for a library that is right or a difference that is deliberate.",
      ].join("\n"),
    );
    passesChecklist(text);
    assert.doesNotMatch(text, /\bdrop\b|\bskip\b|[Rr]eply/);
  });

  it("every state a card can show — its subtitle and body — holds to the vocabulary", () => {
    const report = decisionReport(THREE.map(precedenceItem), precedenceParent(3, RULE_URL));
    const states: ReportItemState[] = [
      { kind: "open" },
      { kind: "changes-asked", by: "U03FYQJRQHX" },
      { kind: "approved", by: "U03FYQJRQHX", at: Date.UTC(2026, 9, 5, 15, 0) },
      { kind: "failed", by: "U03FYQJRQHX", at: Date.UTC(2026, 9, 5, 15, 0), reason: "GitHub answered 502" },
      { kind: "rejected", by: "U03FYQJRQHX", reason: "the library is ahead on purpose" },
      { kind: "noted", by: "U03FYQJRQHX", note: "ghost is library-only on purpose" },
      { kind: "expired" },
      { kind: "not-staged", note: "Didn't go through, so it posts again tomorrow morning." },
    ];
    for (const state of states) {
      const record = reportRecord("C1", "1759500000.000001", report, 1);
      record.entries[0] = { ...record.entries[0]!, state };
      const card = (reportMessage(record).blocks[1] as { elements: Array<{ title: { text: string }; subtitle?: { text: string }; body: { text: string } }> }).elements[0]!;
      const words = [card.title.text, card.subtitle?.text ?? "", card.body.text].join("\n");
      assertVocabulary(words);
      // A retired single word in any form: "Disputed" retires with "dispute".
      for (const retired of RETIRED.filter((w) => /^[\w-]+$/.test(w))) {
        assert.doesNotMatch(words.toLowerCase(), new RegExp(`(^|[^\\w-])${retired.toLowerCase()}`), `${state.kind}: "${retired}" is retired`);
      }
      assert.doesNotMatch(words, /:[a-z_]+:/, `${state.kind}: no emoji on a card`);
    }
  });

  it("a turn that would change a card is pointed at its Review", () => {
    passesChecklist(PRECEDENCE_REVISION_REFUSAL);
    assert.match(PRECEDENCE_REVISION_REFUSAL, /press Review/);
    assert.doesNotMatch(PRECEDENCE_REVISION_REFUSAL, /\bdrop\b|`/);
  });
});

// ── What a stated card says at the gate ──────────────────────────────────────
//
// The gate's generic lines assume a card someone asked for: "tell me what to
// change", "ask me again", "the newest :warning: card". These are the lines the
// library and precedence cards say instead (`PendingProposal.stated`), and the
// stated variants the gate keeps for a replaced card and a gesture beside one.
// #886 had no words for them; they follow its register and are Bill's to confirm.

/** One line a person reads after a press or a reaction on a stated card. */
function passesGateAnswer(text: string, glyphs: readonly string[] = []): void {
  assert.ok(text.length <= 1500, text);
  assertVocabulary(text);
  for (const e of text.match(/:[a-z_]+:/g) ?? []) assert.ok(glyphs.includes(e), `${e} is not this answer's gate glyph`);
  for (const generic of [/tell me what to change/i, /ask me again/i, /:warning:/, /About to/, /stage it again/]) {
    assert.doesNotMatch(text, generic);
  }
}

describe("what a stated card says at the gate", () => {
  const weekly = precedenceCardWords(PRECEDENCE_CARD_TTL_MS / 3_600_000);

  it("a precedence card: a Reject leaves the difference as deliberate, and its window is the whole six days", () => {
    assert.deepEqual(weekly, {
      cancelled: "Left as deliberate, nothing filed",
      expired: "That card closed after 6 days with no decision, so nothing was filed.",
    });
  });

  it("a ⛔ closes the card with what it did and who decided", () => {
    assert.equal(statedCancelledNote(weekly, "U0AAAAAA2"), ":no_entry: Left as deliberate, nothing filed, decided by <@U0AAAAAA2>.");
    // Only a Slack id is mentioned; anything else would blank the post.
    assert.equal(statedCancelledNote(weekly, "someone"), ":no_entry: Left as deliberate, nothing filed.");
    passesGateAnswer(statedCancelledNote(weekly, "U0AAAAAA2"), [":no_entry:"]);
  });

  it("every answer the gate gives a stated card holds to the copy rules, and names no tool", () => {
    const answers: Array<[GateNote, string[]]> = [
      [{ kind: "resolved", decision: "cancel", cancelled: weekly.cancelled }, []],
      [{ kind: "expired", ttlMs: PRECEDENCE_CARD_TTL_MS, words: weekly.expired }, []],
      [{ kind: "superseded", stated: true }, []],
      [{ kind: "not-on-the-card", toolName: "github_issue_create", glyph: "no_entry", userId: "U0AAAAAA2", stated: true }, [":no_entry:"]],
    ];
    for (const [note, glyphs] of answers) {
      const text = renderGateNote(note);
      passesGateAnswer(text, glyphs);
      assert.doesNotMatch(text, /github_issue_create|an issue/, text);
    }
    assert.equal(renderGateNote(answers[0]![0]), "Left as deliberate, nothing filed.");
  });
});

// ── The drift card (#886 § 3.3, on the shared decision card) ────────────────
//
// § 3.3's question now reads as the shared card's parent line, and each file
// it names is a card of its own, decided from Review alone: no line says what
// ✅ or ⛔ does, and nothing asks for a typed `skip`, "yes" or `drop N`.

describe("the drift card (#886 § 3.3)", () => {
  const FILE = { title: "Goal states", url: "https://www.figma.com/design/K/Goal-Setting?node-id=1-2", kind: "figma" as const };
  const CODE = { title: "Button.jsx", url: "https://github.com/o/r/blob/main/b.jsx", kind: "design-system-code" as const };
  const SEP_24 = Date.UTC(2026, 8, 24, 16);
  const one: DriftFileWords = { file: FILE, threadSays: "tooltips on option chips", decidedAt: SEP_24, change: { kind: "unchanged", at: Date.UTC(2026, 8, 20, 15) } };
  const MERYEM = "U0MERYEM1";
  const GATE_WORDS = /:white_check_mark:|:no_entry:|✅|⛔|`skip`|\bskip\b|\bdrop \d|reply "?yes/i;

  it("the parent says what the thread settled that its files have not caught up with, in one plain sentence", () => {
    assert.equal(driftParent(["figma"]), "This thread settled a decision that its Figma file has not caught up with.");
    assert.equal(driftParent(["figma", "figma-library"]), "This thread settled two decisions that their Figma files have not caught up with.");
    assert.equal(driftParent(["design-system-code"]), "This thread settled a decision that the code has not caught up with.");
    assert.equal(driftParent(["storybook"]), "This thread settled a decision that Storybook has not caught up with.");
    assert.equal(driftParent(["figma", "storybook", "github"]), "This thread settled three decisions that their files have not caught up with.");
    for (const kinds of [["figma"], ["figma", "storybook"]] as const) {
      const text = driftParent([...kinds]);
      passesChecklist(text);
      assert.doesNotMatch(text, GATE_WORDS);
    }
  });

  it("a file drafted in another thread is a one-line pointer, linked when the link could be read", () => {
    assert.equal(
      elsewhereLine(FILE, "https://plus.slack.com/archives/C0/p1"),
      "The intake for <https://www.figma.com/design/K/Goal-Setting?node-id=1-2|Goal Setting — Goal states> is drafted <https://plus.slack.com/archives/C0/p1|in another thread>.",
    );
    assert.match(elsewhereLine(FILE, null), /is drafted in another thread\.$/);
    passesChecklist(elsewhereLine(FILE, null));
  });

  it("each file's card: the file and last change, its owner to ping, what the thread settled, and Open to the frame", () => {
    const item = driftItem({ id: "1", ...one, owner: MERYEM, lane: "roadmap" });
    assert.deepEqual(item, {
      id: "1",
      title: "Goal Setting — Goal states",
      subtitle: "last changed Sep 20",
      owners: [{ slack: "U0MERYEM1" }],
      body: 'Thread settled "tooltips on option chips" on Sep 24 · the file has not changed since Sep 20.',
      open: { label: "Open in Figma", url: FILE.url },
      done: "a Roadmap card to update Goal Setting — Goal states",
    });
    const changed = driftItem({ id: "2", ...one, change: { kind: "changed", at: Date.UTC(2026, 8, 26, 18) }, owner: null, lane: "roadmap" });
    assert.equal(changed.subtitle, "last changed Sep 26");
    assert.equal(changed.owners, undefined, "no owner, nobody to ping");
    assert.equal(changed.body, 'Thread settled "tooltips on option chips" on Sep 24 · the file changed Sep 26, unconfirmed.');
    const code = driftItem({ id: "3", ...one, file: CODE, change: { kind: "unknown" }, owner: MERYEM, lane: "maintain" });
    assert.equal(code.subtitle, undefined);
    assert.deepEqual(code.owners, [{ slack: "U0MERYEM1" }]);
    assert.equal(code.body, 'Thread settled "tooltips on option chips" on Sep 24 · the code may not show it yet.');
    assert.deepEqual(code.open, { label: "Open on GitHub", url: CODE.url });
    assert.equal(code.done, "an intake to update Button.jsx");
    for (const i of [item, changed, code]) assert.doesNotMatch(JSON.stringify(i), GATE_WORDS);
  });

  it("names a linked frame after its file, and anything else by the title read", () => {
    assert.equal(fileName(FILE), "Goal Setting — Goal states", "the file off the link, the frame off its read");
    assert.equal(fileName({ ...FILE, title: "Goal Setting" }), "Goal Setting", "a frame read under the file's own name says it once");
    assert.equal(fileName({ ...FILE, url: "https://www.figma.com/design/K/Goal-Setting" }), "Goal states", "a link to no frame");
    assert.equal(fileName(CODE), "Button.jsx");
  });

  it("a long paraphrase is cut inside the quote, so the card's body keeps what the file did", () => {
    const item = driftItem({ id: "1", ...one, threadSays: "word ".repeat(80), owner: null, lane: "roadmap" });
    assert.ok(item.body.length <= 200, `${item.body.length}`);
    assert.match(item.body, /…" on Sep 24 · the file has not changed since Sep 20\.$/);
  });

  it("what Review shows: the file linked, what was settled and when, and no footer", () => {
    const text = renderProposalCard(driftReview({ ...one, lane: "roadmap", note: null }, { toolName: "notion_create", input: {} })).text;
    assert.equal(
      text,
      '*<https://www.figma.com/design/K/Goal-Setting?node-id=1-2|Goal Setting — Goal states>:* this thread settled "tooltips on option chips" on Sep 24, and the file hasn\'t changed since Sep 20.',
    );
    passesChecklist(text);
    const noted = renderProposalCard(driftReview({ ...one, lane: "roadmap", note: pillarNote("left unset") }, { toolName: "notion_create", input: {} })).text;
    assert.match(noted, /\n_Product Pillar: left unset_$/);
  });

  it("is withdrawn in place once its file catches up, and a card that didn't stage says so", () => {
    assert.equal(caughtUpNote(Date.UTC(2026, 8, 30, 18)), "Updated Sep 30. Nothing to do.");
    assert.equal(caughtUpText(1, Date.UTC(2026, 8, 30, 18)), "The file now shows this thread's decision, updated Sep 30. Nothing to do.");
    assert.equal(caughtUpText(2, Date.UTC(2026, 9, 1, 18)), "The files now show this thread's decisions, updated Oct 1. Nothing to do.");
    for (const text of [caughtUpNote(Date.UTC(2026, 8, 30, 18)), caughtUpText(2, SEP_24), DRIFT_NOT_STAGED, DRIFT_NOT_POSTED_TEXT, DRIFT_NO_REVISION]) {
      passesChecklist(text);
      assert.doesNotMatch(text, GATE_WORDS);
    }
    assert.match(DRIFT_NO_REVISION, /Review/);
  });

  it("answers the gate in its own words: a Reject files nothing, and a late decision is told nothing was filed", () => {
    const words = driftCardWords(DRIFT_CARD_TTL_MS / 3_600_000);
    assert.deepEqual(words, { cancelled: "No intake filed", expired: "That card closed after 72 h with no decision, so nothing was filed." });
    assert.equal(statedCancelledNote(words, "U0AAAAAA2"), ":no_entry: No intake filed, decided by <@U0AAAAAA2>.");
    passesGateAnswer(statedCancelledNote(words, "U0AAAAAA2"), [":no_entry:"]);
    for (const note of [
      { kind: "resolved", decision: "cancel", cancelled: words.cancelled },
      { kind: "expired", ttlMs: DRIFT_CARD_TTL_MS, words: words.expired },
    ] as GateNote[]) {
      passesGateAnswer(renderGateNote(note));
    }
    assert.equal(renderGateNote({ kind: "expired", ttlMs: DRIFT_CARD_TTL_MS, words: words.expired }), words.expired);
  });
});

// ── The comment-decision thread (#886 § 3.5, #900) ──────────────────────────
//
// § 3.5 gives the parent and one reply. Where the code goes past it — the
// number on each card, the whole drafted text under the update line in what
// Review shows, the commenter by Figma handle — follows its register. The
// cards are the shared decision card's, decided from Review alone, so no line
// says what ✅ or ⛔ does.

describe("the comment-decision thread (#886 § 3.5)", () => {
  const FILE = { title: "Goal Setting / Card 2482 / Sarah", url: "https://www.figma.com/design/GoalFile1" };
  const PRD = { title: "PRD", url: "https://www.notion.so/24820000000000000000000000000002" };
  const COMMENT = "https://www.figma.com/design/GoalFile1?node-id=4-1#c1";
  const base: QueuedDecision = {
    commentId: "c1",
    nodeId: "4:1",
    quote: "Keep the progress bar hidden until the first goal is set",
    by: "sarah",
    section: "Specs",
    page: "Goal states",
    createdAt: "2026-09-29T15:00:00Z",
    resolvedAt: "2026-09-29T18:00:00Z",
    decision: "The progress bar stays hidden until the first goal is set.",
    route: "prd",
    operation: {
      toolName: "notion_update",
      input: { page_url: PRD.url, insert: [{ after_block_id: "b2", last_edited_time: "2026-09-02T10:00:00.000Z", content: "The progress bar stays hidden until the first goal is set." }] },
    },
    update: { kind: "prd", change: "add", section: "Goal states", page: PRD },
    confidence: 0.9,
  };
  const status: QueuedDecision = {
    ...base,
    commentId: "c3",
    quote: "Moving this card to Under Review",
    resolvedAt: null,
    route: "card",
    operation: { toolName: "notion_update", input: { page_url: "https://www.notion.so/c", properties: { "Design Status": "Under Review" } } },
    update: { kind: "card", card: 2482, field: "Design Status", from: "WIP", to: "Under Review", url: "https://www.notion.so/c" },
  };
  const intake: QueuedDecision = {
    ...base,
    commentId: "c4",
    quote: "Goal chips use Badge's pill variant everywhere",
    route: "design-system",
    operation: { toolName: "github_issue_create", input: { title: "Goal chips use the Badge pill variant", body: "…" } },
    update: { kind: "intake", title: "Goal chips use the Badge pill variant" },
  };

  it("the parent names the file and the count in one plain sentence, and each card names whom it is for", () => {
    const three = decisionParent(FILE, 3);
    assert.equal(three, "3 comments in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> read like decisions.");
    passesChecklist(three);
    const one = decisionParent(FILE, 1);
    assert.equal(one, "1 comment in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> reads like a decision.");
    passesChecklist(one);
    assert.deepEqual(decisionItem(1, base, COMMENT, { slack: "U0AAAAAA1" }).owners, [{ slack: "U0AAAAAA1" }]);
    assert.deepEqual(decisionItem(1, base, COMMENT, { figma: "bea" }).owners, [{ name: "bea" }], "a Figma handle, never tagged");
    assert.equal(decisionItem(1, base, COMMENT, null).owners, undefined);
  });

  it("what Review shows leads with the number and the quote, says who said it where and when, and has no footer", () => {
    const prdCard = renderProposalCard(decisionCard(1, base, COMMENT)).text;
    assert.equal(
      prdCard,
      [
        '*1 · "Keep the progress bar hidden until the first goal is set"*',
        `sarah on the Specs page, resolved Sep 29 · <${COMMENT}|see comment>`,
        `• *PRD › Goal states:* add this rule · <${PRD.url}|page>`,
        "> The progress bar stays hidden until the first goal is set.",
      ].join("\n"),
    );
    const statusCard = renderProposalCard(decisionCard(2, status, COMMENT)).text;
    assert.match(statusCard, /^sarah on the Specs page, commented Sep 29 · /m);
    assert.match(statusCard, /^• \*Card 2482 › Design Status:\* WIP → Under Review · <https:\/\/www\.notion\.so\/c\|card>$/m);
    const intakeCard = renderProposalCard(decisionCard(3, intake, COMMENT)).text;
    assert.match(intakeCard, /^• \*Intake:\* "Goal chips use the Badge pill variant"\n> …$/m, "with the body it files");
    for (const text of [prdCard, statusCard, intakeCard]) passesChecklist(text);
  });

  it("a ⛔ closes a decision card with what it did and who decided, and a late answer says nothing was written", () => {
    const words = decisionCardWords();
    assert.equal(statedCancelledNote(words, "U0AAAAAA2"), ":no_entry: Dropped, nothing written, decided by <@U0AAAAAA2>.");
    assert.equal(words.expired, "That card closed after 72 h with no decision, so nothing was written.");
    passesGateAnswer(statedCancelledNote(words, "U0AAAAAA2"), [":no_entry:"]);
    passesGateAnswer(renderGateNote({ kind: "expired", ttlMs: DECISION_CARD_TTL_MS, words: words.expired }));
  });

  it("the lines a reply gets hold to the vocabulary, and point at Review", () => {
    for (const text of [rewordInstead(2), whichOne([1, 3])]) {
      assert.match(text, /press Review on .* card and choose Needs changes/i);
      assertVocabulary(text);
      assert.ok(text.length < 200, text);
    }
  });
});

describe("@uno in a Figma comment (#903)", () => {
  const REPLIES: FigmaReply[] = [
    { kind: "answer", lines: ["Hidden until the first goal is set."], source: { name: "Goal Setting PRD", url: "https://www.notion.so/prd" } },
    { kind: "answer", lines: ["Probably hidden."], source: null },
    { kind: "question", lines: ["Which card is this for?"] },
    { kind: "drafted", link: "https://plus.slack.com/archives/C1/p1" },
    { kind: "not-teammate" },
    { kind: "not-drafted" },
    { kind: "failed" },
  ];

  it("every reply leads with the label, the one emoji, and holds to the vocabulary", () => {
    for (const reply of REPLIES) {
      const text = figmaReplyText(reply);
      assert.match(text, /^🐐: \S/u, text);
      passesChecklist(text);
      assert.equal([...text.matchAll(/\p{Extended_Pictographic}/gu)].length, 1, `🐐 only in the label:\n${text}`);
    }
  });

  it("a change that could not be drafted says so, and points at #plus-design", () => {
    assert.equal(
      figmaReplyText({ kind: "not-drafted" }),
      "🐐: I couldn't draft this change, so nothing was drafted or written. Ask in #plus-design.",
    );
  });

  const LEAD = {
    asker: "U1",
    owner: "U2",
    file: { title: "Goal Setting / Card 2482 / Meryem", url: "https://www.figma.com/design/F" },
    quote: "please add to the PRD: hide the bar until the first goal",
    commentUrl: "https://www.figma.com/design/F?node-id=1-2#3",
  };

  it("the #plus-design lead asks one named person, the design owner, for one action, in one line", () => {
    const text = askLeadText(LEAD);
    passesChecklist(text);
    assert.equal(text.split("\n").length, 1);
    assert.equal(
      text,
      "<@U2>, <@U1> asked in a Figma comment on <https://www.figma.com/design/F|Goal Setting / Card 2482 / Meryem>: “please add to the PRD: hide the bar until the first goal” (<https://www.figma.com/design/F?node-id=1-2#3|comment>). Can you review the draft below?",
    );
  });

  it("with no design owner, the lead asks the asker", () => {
    const text = askLeadText({ ...LEAD, owner: "U1" });
    passesChecklist(text);
    assert.match(text, /^<@U1>, you asked in a Figma comment on .*\. Can you review the draft below\?$/);
    assert.equal(text.match(/<@/g)!.length, 1, "one person, named once");
  });
});

describe("the weekly Figma tidy-up (#886 § 3.6)", () => {
  const folder = (name: string) => ({ team: "Universal", id: name, name });
  const tidyFile = { team: "Universal", folderId: "⏳ WIP", key: "F1", name: "AI Indicator / Card 733 / Sarah" };
  const findings: TidyFinding[] = [
    {
      fingerprint: "F1|wrong-folder|733",
      check: "wrong-folder",
      file: tidyFile,
      folder: folder("⏳ WIP"),
      card: 733,
      known: { number: 733, title: "AI Indicator", url: "https://www.notion.so/733", designStatus: "Shipped", devStatus: null, owner: "U1", designers: [] },
      moveTo: { stage: "Specs", folder: folder("📐 Specs") },
      owner: "U1",
    },
    { fingerprint: "F1|unknown-card|9", check: "unknown-card", file: tidyFile, folder: folder("⏳ WIP"), card: 9, owner: null },
    {
      fingerprint: "F2|no-active-card|-",
      check: "no-active-card",
      file: { ...tidyFile, key: "F2", name: "Old / Legacy / flows" },
      folder: folder("⏳ WIP"),
      card: null,
      moveTo: { stage: "Archive", folder: folder("🗂️ Archive") },
      owner: null,
    },
  ];

  it("the parent, each owner's bullet and the all-clear hold to the checklist", () => {
    passesChecklist(tidyParent("2026-10-12", 9, 3));
    passesChecklist(ownerLine("U1", 7, 5));
    passesChecklist(ownerLine("U1", 2, 1));
    passesChecklist(ownerLine("U1", 2, 0));
    passesChecklist(ownerLine(null, 2, 2));
    const clear = allClearText(12);
    assert.equal(clear, "*Figma tidy-up: all clear* 🎉 Last week's 12 items are fixed. Nice work.");
    passesChecklist(clear, { ship: true });
  });

  it("every card and what Review shows say no gate words, and use Card <n>", () => {
    for (const f of findings) {
      const item = tidyItem(f, null);
      passesChecklist([item.title, item.subtitle ?? "", item.body].join("\n"));
      passesChecklist(renderProposalCard(tidyCard(f, null)).text);
      assert.doesNotMatch(`${item.subtitle} ${item.body}`, /RM-\d|card #/i);
    }
    passesChecklist(TIDY_REVISION_REFUSAL);
    assert.equal(findingBody(findings[2]!, null), "Not on an active card, and not in 🗂️ Archive. Move it to Universal › 🗂️ Archive.");
  });
});

describe("Dev Mode links (#904)", () => {
  const button: DevLinksSubject = { kind: "component", component: "Button", figmaUrl: "https://www.figma.com/design/L?node-id=33-2470", storybook: "https://sb/button" };
  const links = (name: string) => [
    { file_key: "L", node_id: "33:2470", name: `Code (plus-uno): ${name}`, url: "https://gh/code" },
    { file_key: "L", node_id: "979:1", name: `Code (plus-uno): ${name}`, url: "https://gh/code" },
  ];
  const first = { links: links("Button"), introduce: [{ file_key: "L", node_id: "33:2470", component: "Button" }] };
  const batch: DevLinksSubject = {
    kind: "batch",
    figmaUrl: "https://www.figma.com/design/L?node-id=25-568",
    components: [
      { component: "Badge", adds: [{ name: "Code (plus-uno): Badge", url: "https://gh/badge" }, { name: "Storybook: Badge", url: "https://sb/badge" }], renamed: false },
      { component: "Button", adds: [], renamed: true },
    ],
  };

  it("the parent lines, the cards and what Review shows hold to the checklist", () => {
    passesChecklist(devLinksParent(button));
    passesChecklist(devLinksParent(batch));
    for (const line of [
      devLinksCarryOn(12, 2),
      devLinksNotCarried("the runner refused it (500)"),
      devLinksFinished({ links: 198, components: 67, comments: 66 }),
      devLinksFinished({ links: 198, components: 67, comments: 66 }, "1 link(s) held back"),
      devLinksGaveUp(),
      devLinksStopped("Figma 403"),
    ]) passesChecklist(line);
    const cases: Array<[DevLinksSubject, DevLinksWrite]> = [
      [button, first],
      [button, { links: links("Button"), introduce: [], renames: 2 }],
      [batch, { links: [...links("Badge"), ...links("Button")], introduce: [{ file_key: "L", node_id: "25:568", component: "Badge" }], renames: 2 }],
    ];
    for (const [subject, write] of cases) {
      const item = devLinksItem(subject, write);
      passesChecklist([item.title, item.subtitle ?? "", item.body].join("\n"));
      passesChecklist(renderProposalCard(devLinksCard(subject, write)).text);
    }
    passesChecklist(DEV_LINKS_REVISION_REFUSAL);
    assert.equal(devLinksItem(button, first).body, "Adds 2 links in Dev Mode to 2 library components, and one comment on the first saying what they are.");
    assert.equal(devLinksParent(button), "Dev Mode links for Button are ready for Review.");
    const item = devLinksItem(batch, cases[2]![1]);
    assert.ok(item.title.length <= 150 && item.body.length <= 200, item.body);
    assert.equal(item.body, "Adds 2 links and renames 2 in Dev Mode on 2 library components, and one comment on each new component's first saying what they are.");
  });

  it("the one comment written into Figma leads with the label, the one emoji", () => {
    const text = devLinksComment("Button");
    assert.match(text, /^🐐: Added Dev Mode links to Button: /u);
    passesChecklist(text);
    assert.equal([...text.matchAll(/\p{Extended_Pictographic}/gu)].length, 1, text);
  });

  it("knows the Dev Mode links comment as Figma reads it back, in each label it has had", () => {
    assert.equal(isDevLinksComment(":goat:: Added Dev Mode links to Button: Code (plus-uno) opens…", "Button"), true);
    assert.equal(isDevLinksComment(":goat:\nAdded Dev Mode links to Button: Code (plus-uno) opens…", "Button"), true);
    assert.equal(isDevLinksComment(":goat:: Added Dev Mode links to Badge: Code (plus-uno) opens…", "Button"), false);
    assert.equal(isDevLinksComment("Added Dev Mode links to Button: by hand", "Button"), false);
  });
});
