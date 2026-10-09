// Every Figma message uno-bot's code writes, against the copy Bill approved in
// #886 (2026-09-30) — the library publish card, its thread, the post for a
// library edited but not published, the weekly precedence report, the drift
// question and its withdrawal, the comment-decision thread (#900), and what
// each card says at the gate.
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
  componentListMessages,
  draftPublishIntake,
  editedNotPublished,
  libraryCardWords,
  publishCard,
  type ComponentRegistry,
  type LibraryChangeSet,
  type LibraryComponent,
} from "../src/figma-library/draft";
import { libraryCard, LIBRARY_CARD_TTL_MS } from "../src/figma-library/post";
import { expiredCardNote, prClosedLine, prMergedLine, prOpenedLine } from "../src/figma-library/track";
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
import { PRECEDENCE_CARD_TTL_MS } from "../src/ds-precedence/jobs";
import { CONFIRM_FOOTER, renderProposalCard } from "../src/slack/proposal-render";
import { renderGateNote, statedCancelledNote } from "../src/slack/gate-note";
import {
  askLead,
  caughtUpText,
  confirmedText,
  driftCardWords,
  driftFooter,
  DRIFT_CARD_TTL_MS,
  DRIFT_NOT_STAGED_TEXT,
  partlyAnsweredText,
  skippedSharedText,
  skippedText,
  withdrawnElsewhereText,
  type AskItem,
} from "../src/figma-drift/copy";
import type { GateNote } from "../src/turn/index";
import { STANDING_TOO } from "../src/sweep/capture-lines";
import { decisionCard, decisionCardWords, decisionParent, rewordInstead, whichOne } from "../src/figma-comments/copy";
import { DECISION_CARD_TTL_MS } from "../src/figma-comments/post";
import type { QueuedDecision } from "../src/figma-comments/queue";

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

/** The library card's count, against the names under it. */
function countMatchesNames(text: string): void {
  const m = /^(\d+) components? changed: (.+)\.$/m.exec(text);
  assert.ok(m, text);
  const total = Number(m[1]);
  const parts = m[2]!.split(", ").map((p) => Number(p.split(" ")[0]));
  assert.equal(parts.reduce((a, b) => a + b, 0), total, "new + updated + removed is the count");
  let named = 0;
  for (const line of text.split("\n").filter((l) => l.startsWith("• *"))) {
    const list = line.replace(/^• \*[^*]+:\* /, "");
    const more = /(.*) and (\d+) more$/.exec(list);
    named += more ? more[1]!.split(", ").length + Number(more[2]) : list.split(", ").length;
  }
  assert.equal(named, total, `${total} counted, ${named} named:\n${text}`);
}

// ── The library publish card (#886 § 3.1) ────────────────────────────────────

const FILE_KEY = "LIBFILEKEY";
const VERSION = { id: "2210", label: "Button focus ring", description: "Adds a visible focus ring to Button and Badge.", createdAt: "2026-09-29T20:00:00Z", user: "sarah" };

let nodes = 0;
function component(set: string, variant = "Default"): LibraryComponent {
  nodes += 1;
  return { key: `k-${set}-${variant}`, name: variant, description: "", nodeId: `1:${nodes}`, containingFrame: set, setNodeId: `9:${set}` };
}

const REGISTRY: ComponentRegistry = {
  components: Object.fromEntries(
    ["Badge", "Button", "Card"].map((name) => [
      name,
      { code: { mdxPath: `design-system/src/components/${name}/${name}.mdx` }, figma: { sets: [{ name, componentSetNodeId: `9:${name}` }] } },
    ]),
  ),
};

function changeSet(over: Partial<LibraryChangeSet>): LibraryChangeSet {
  return { detectedAt: "2026-09-29T22:00:00Z", fileKey: FILE_KEY, versions: [VERSION], created: [], modified: [], deleted: [], newComponentIds: [], removedComponentIds: [], ...over };
}

function card(cs: LibraryChangeSet): string {
  const intake = draftPublishIntake(cs, REGISTRY);
  return renderProposalCard(libraryCard(cs, intake)).text;
}

describe("the library publish card", () => {
  // #886's own example: seven components, two of them new, three with code.
  const SEVEN = changeSet({
    created: [component("Chip"), component("Tag")],
    modified: ["Badge", "Button", "Card", "Toast", "Tooltip"].map((s) => component(s)),
    newComponentIds: ["9:Chip", "9:Tag"],
  });

  it("reads as #886 § 3.1: the publish, every component under its group, one footer", () => {
    const text = card(SEVEN);
    assert.equal(
      text,
      [
        `*Library published: "Button focus ring"* by sarah · <https://www.figma.com/design/${FILE_KEY}?version-id=2210|view version>`,
        "> Adds a visible focus ring to Button and Badge.",
        "",
        "7 components changed: 2 new, 5 updated.",
        "• *Has code:* Badge, Button, Card",
        "• *No code mapping yet:* Chip, Tag, Toast, Tooltip",
        "",
        ":white_check_mark: files the intake and drafts the code for Badge, Button and Card. :no_entry: files the intake only.",
        "Anyone in this channel can decide, for the next 72 h.",
      ].join("\n"),
    );
    countMatchesNames(text);
    passesChecklist(text, { gate: true });
  });

  it("names two components that share a name twice, so the count still matches", () => {
    const twins = changeSet({
      modified: [component("Button"), { ...component("Button", "Other"), setNodeId: "9:Button-2" }],
    });
    const text = card(twins);
    assert.match(text, /^2 components changed: 2 updated\.$/m);
    countMatchesNames(text);
  });

  it("says plainly when nothing has code, and both buttons file the intake", () => {
    const text = card(changeSet({ created: [component("Chip"), component("Tag")], newComponentIds: ["9:Chip", "9:Tag"] }));
    assert.match(text, /^2 components changed: 2 new\.$/m);
    assert.equal(
      text.split("\n").at(-2),
      ":white_check_mark: and :no_entry: both file the intake. Nothing here has code yet, so there's nothing to draft.",
    );
    countMatchesNames(text);
    passesChecklist(text, { gate: true });
  });

  it("says so when a version changed no component it can see", () => {
    const text = card(changeSet({}));
    assert.match(text, /^No changed components found\. The version has the details\.$/m);
    assert.equal(text.split("\n").at(-2), ":white_check_mark: and :no_entry: both file the intake. There's nothing to draft.");
    passesChecklist(text, { gate: true });
  });

  it("counts a removed component, and only when none of it is left", () => {
    const text = card(changeSet({ deleted: [component("Toast")], modified: [component("Badge")], removedComponentIds: ["9:Toast"] }));
    assert.match(text, /^2 components changed: 1 updated, 1 removed\.$/m);
    countMatchesNames(text);
  });

  it("past 1,500 characters, ends each group with \"and N more\" and puts the whole list in the thread", () => {
    const many = Array.from({ length: 80 }, (_, i) => component(`Extra component ${String(i).padStart(2, "0")}`));
    const big = changeSet({ created: many, newComponentIds: many.map((c) => c.setNodeId!) });
    const text = card(big);
    passesChecklist(text, { gate: true });
    countMatchesNames(text);
    assert.match(text, / and \d+ more$/m);
    const intake = draftPublishIntake(big, REGISTRY);
    assert.deepEqual(publishCard(big, intake, 72).overflow, componentListMessages(intake));
    const thread = componentListMessages(intake).join("\n");
    assert.match(thread, /^All 80 components in this publish:/);
    for (const c of many) assert.ok(thread.includes(c.containingFrame), c.containingFrame);
  });

  it("keeps its 72 hours where the card says them", () => {
    assert.equal(LIBRARY_CARD_TTL_MS, 72 * 60 * 60 * 1000);
  });
});

describe("a library edited, not published", () => {
  it("says so plainly, offers no ✅, and promises the next post", () => {
    const cs = changeSet({ versions: [], modified: [component("Button")] });
    const text = editedNotPublished(cs, draftPublishIntake(cs, REGISTRY));
    assert.equal(
      text,
      [
        `*Library edited, not published.* 1 component's name or description changed in the <https://www.figma.com/design/${FILE_KEY}|library>, with no new version: Button.`,
        "Nothing to build yet. I'll post again when a version is published.",
      ].join("\n"),
    );
    passesChecklist(text);
  });

  it("counts components plainly when some were added or removed, and names them", () => {
    const cs = changeSet({ versions: [], modified: [component("Button")], created: [component("Chip")] });
    const text = editedNotPublished(cs, draftPublishIntake(cs, REGISTRY));
    assert.match(text, /^\*Library edited, not published\.\* 2 components changed in the <[^>]+\|library>, with no new version: Button and Chip\.$/m);
    passesChecklist(text);
  });

  it("past 1,500 characters, names as many as fit and counts the rest", () => {
    const many = Array.from({ length: 90 }, (_, i) => component(`Edited component ${String(i).padStart(2, "0")}`));
    const cs = changeSet({ versions: [], modified: many });
    const text = editedNotPublished(cs, draftPublishIntake(cs, REGISTRY));
    passesChecklist(text);
    const m = /no new version: (.*) and (\d+) more\.$/m.exec(text);
    assert.ok(m, text);
    assert.equal(m[1]!.split(", ").length + Number(m[2]), 90);
  });
});

describe("the consent a stated card's footer carries", () => {
  // The footer stands in for the operation plan, so it names every operation
  // the ✅ runs — pinned here, where a new operation would have to be named.
  it("the library card names both of its operations, and only those", () => {
    const seven = changeSet({ modified: [component("Button"), component("Toast")] });
    const intake = draftPublishIntake(seven, REGISTRY);
    const built = libraryCard(seven, intake);
    assert.deepEqual(built.operations.map((o) => o.toolName), ["github_issue_create", "component_implement"]);
    assert.match(built.footer!, /^:white_check_mark: files the intake and drafts the code for Button\. :no_entry: files the intake only\./);

    const noCode = changeSet({ modified: [component("Toast")] });
    const alone = libraryCard(noCode, draftPublishIntake(noCode, REGISTRY));
    assert.deepEqual(alone.operations.map((o) => o.toolName), ["github_issue_create"]);
    assert.doesNotMatch(alone.footer!, /drafts the code/);
  });
});

describe("the full list in the card's thread", () => {
  it("never ends a reply on an empty group heading, and never opens one on a blank line", () => {
    // Enough Has-code names to fill most of a reply, then a few without code:
    // the second group's heading lands right at the boundary.
    const registry: ComponentRegistry = {
      components: Object.fromEntries(
        Array.from({ length: 400 }, (_, i) => {
          const name = `Mapped component ${String(i).padStart(3, "0")}`;
          return [name, { code: { mdxPath: `x/${i}/${i}.mdx` }, figma: { sets: [{ name, componentSetNodeId: `9:${name}` }] } }];
        }),
      ),
    };
    for (const mapped of [150, 160, 170, 400]) {
      const rows = [
        ...Array.from({ length: mapped }, (_, i) => component(`Mapped component ${String(i).padStart(3, "0")}`)),
        ...Array.from({ length: 300 }, (_, i) => component(`Loose component ${String(i).padStart(3, "0")}`)),
      ];
      const intake = draftPublishIntake(changeSet({ modified: rows }), registry);
      const replies = componentListMessages(intake);
      for (const reply of replies) {
        assert.ok(reply.length <= 3500, `${reply.length} chars`);
        assert.doesNotMatch(reply, /^\n/);
        assert.doesNotMatch(reply, /:\* $/m, "a heading with no names after it");
      }
      const named = replies.join("\n").split("\n").flatMap((l) => (l.startsWith("• *") ? l.replace(/^• \*[^*]+:\* /, "").split(", ") : []));
      assert.equal(named.length, rows.length, `${mapped} mapped`);
      assert.equal(new Set(named).size, rows.length);
    }
  });
});

describe("the library card's thread (#886 § 3.2)", () => {
  const PR = { number: 123, url: "https://github.com/o/r/pull/123" };
  const INTAKE = { number: 45, url: "https://github.com/o/r/issues/45" };

  it("links the PR plainly when it opens", () => {
    assert.equal(prOpenedLine(PR, INTAKE), "PR open: <https://github.com/o/r/pull/123|#123>. Linked from the <https://github.com/o/r/issues/45|intake>.");
    assert.equal(prOpenedLine(PR), "PR open: <https://github.com/o/r/pull/123|#123>.");
    passesChecklist(prOpenedLine(PR, INTAKE));
  });

  it("marks the merge with one 🎉 and names what now matches", () => {
    const line = prMergedLine(PR, "Badge, Button, Card", INTAKE);
    assert.equal(
      line,
      ":tada: <https://github.com/o/r/pull/123|#123> merged, so Badge, Button and Card match the library. Closed the <https://github.com/o/r/issues/45|intake>.",
    );
    assert.equal(prMergedLine(PR, "Badge"), ":tada: <https://github.com/o/r/pull/123|#123> merged, so Badge matches the library.");
    passesChecklist(line, { ship: true });
  });

  it("says a PR closed without merging leaves the intake for the next try", () => {
    assert.equal(
      prClosedLine(PR, INTAKE),
      "<https://github.com/o/r/pull/123|#123> closed without merging. The <https://github.com/o/r/issues/45|intake> stays open for the next try.",
    );
    assert.equal(prClosedLine(PR), "<https://github.com/o/r/pull/123|#123> closed without merging.");
    passesChecklist(prClosedLine(PR, INTAKE));
  });

  it("closes an expired card with #886's last line", () => {
    const note = expiredCardNote(INTAKE.url);
    assert.equal(note, "_No decision in 72 h. Filed the <https://github.com/o/r/issues/45|intake> so it isn't lost._");
    passesChecklist(note);
  });
});

// ── The weekly precedence report (shared decision card) ──────────────────────

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
  const ttlHours = LIBRARY_CARD_TTL_MS / 3_600_000;
  const drafting = libraryCardWords(draftPublishIntake(changeSet({ modified: [component("Button"), component("Chip")] }), REGISTRY), ttlHours);
  const noCode = libraryCardWords(
    draftPublishIntake(changeSet({ created: [component("Chip")], newComponentIds: ["9:Chip"] }), REGISTRY),
    ttlHours,
  );
  const weekly = precedenceCardWords(PRECEDENCE_CARD_TTL_MS / 3_600_000);

  it("the library card: a ⛔ is the intake only, and a late decision is told the intake still lands", () => {
    assert.equal(drafting.cancelled, "Intake only");
    assert.equal(
      drafting.expired,
      "That card closed after 72 h with no decision, so nothing was drafted. I file its intake the morning after, so the publish isn't lost.",
    );
    // Nothing had code, so there was nothing to draft and the line says less.
    assert.equal(noCode.expired, "That card closed after 72 h with no decision. I file its intake the morning after, so the publish isn't lost.");
  });

  it("a precedence card: a Reject leaves the difference as deliberate, and its window is the whole six days", () => {
    assert.deepEqual(weekly, {
      cancelled: "Left as deliberate, nothing filed",
      expired: "That card closed after 6 days with no decision, so nothing was filed.",
    });
  });

  it("a ⛔ closes either card with what it did and who decided", () => {
    assert.equal(statedCancelledNote(drafting, "U0AAAAAA2"), ":no_entry: Intake only, decided by <@U0AAAAAA2>.");
    assert.equal(statedCancelledNote(weekly, "U0AAAAAA2"), ":no_entry: Left as deliberate, nothing filed, decided by <@U0AAAAAA2>.");
    // Only a Slack id is mentioned; anything else would blank the post.
    assert.equal(statedCancelledNote(weekly, "someone"), ":no_entry: Left as deliberate, nothing filed.");
    passesGateAnswer(statedCancelledNote(drafting, "U0AAAAAA2"), [":no_entry:"]);
    passesGateAnswer(statedCancelledNote(weekly, "U0AAAAAA2"), [":no_entry:"]);
  });

  it("every answer the gate gives a stated card holds to the copy rules, and names no tool", () => {
    const answers: Array<[GateNote, string[]]> = [
      [{ kind: "resolved", decision: "cancel", stillRuns: ["github_issue_create"], cancelled: drafting.cancelled }, []],
      [{ kind: "resolved", decision: "cancel", cancelled: weekly.cancelled }, []],
      [{ kind: "expired", ttlMs: LIBRARY_CARD_TTL_MS, words: drafting.expired }, []],
      [{ kind: "expired", ttlMs: PRECEDENCE_CARD_TTL_MS, words: weekly.expired }, []],
      [{ kind: "superseded", stated: true }, []],
      [{ kind: "not-on-the-card", toolName: "github_issue_create", glyph: "no_entry", userId: "U0AAAAAA2", stated: true }, [":no_entry:"]],
    ];
    for (const [note, glyphs] of answers) {
      const text = renderGateNote(note);
      passesGateAnswer(text, glyphs);
      assert.doesNotMatch(text, /github_issue_create|an issue/, text);
    }
    assert.equal(renderGateNote(answers[0]![0]), "Intake only.");
    assert.equal(renderGateNote(answers[1]![0]), "Left as deliberate, nothing filed.");
  });
});

// ── The drift question (#886 § 3.3) ──────────────────────────────────────────
//
// § 3.3 gives three lines: the question, its two-line body, and the edit that
// withdraws it. The rest — a file that changed but can't be confirmed, code
// and Storybook, several files, the card's footer, the lines a `yes` and a
// `skip` leave, and the gate's words — follow its register and are Bill's to
// confirm.

describe("the drift question (#886 § 3.3)", () => {
  const FILE = { title: "Goal Setting / Card 2482", url: "https://www.figma.com/design/K/Goal-Setting?node-id=1-2", kind: "figma" as const };
  const CODE = { title: "Button.jsx", url: "https://github.com/o/r/blob/main/b.jsx", kind: "design-system-code" as const };
  const SEP_24 = Date.UTC(2026, 8, 24, 16);
  const one: AskItem = { file: FILE, threadSays: "tooltips on option chips", decidedAt: SEP_24, change: { kind: "unchanged", at: Date.UTC(2026, 8, 20, 15) } };
  const MERYEM = "U0MERYEM1";

  function driftCard(items: AskItem[], lanes: Array<"roadmap" | "maintain">): string {
    return renderProposalCard({
      kind: "stated",
      verb: "file this Roadmap card",
      lead: askLead({ mentions: [MERYEM], items }),
      footer: driftFooter(lanes),
      fields: [],
      caveats: [],
      operations: [],
    }).text;
  }

  it("reads as § 3.3: the question, what the thread settled and when, the file's last change, one action from one person", () => {
    const text = driftCard([one], ["roadmap"]);
    assert.equal(
      text,
      [
        "*Is the Figma file still current?* This thread settled \"tooltips on option chips\" on Sep 24, and <https://www.figma.com/design/K/Goal-Setting?node-id=1-2|Goal Setting / Card 2482> hasn't changed since Sep 20.",
        "<@U0MERYEM1>, update the frame, or reply `skip` if the decision didn't touch Figma.",
        "",
        ":white_check_mark: files a Roadmap card for the update. :no_entry: files nothing.",
        "The people named here and anyone who posted in this thread can decide, for the next 72 h. The team's standing confirmers can too.",
      ].join("\n"),
    );
    passesChecklist(text, { gate: true });
  });

  it("names the standing confirmers in plain words, and leaves them off a card in a 1:1 DM", () => {
    assert.ok(driftFooter(["roadmap"]).endsWith(`for the next 72 h.${STANDING_TOO}`));
    assert.doesNotMatch(driftFooter(["roadmap"]), /<@|<!/);
    assert.ok(driftFooter(["roadmap"], false).endsWith("for the next 72 h."));
  });

  it("several files, code among them: numbered for `drop`, and one footer naming both intakes", () => {
    const text = driftCard([one, { ...one, file: CODE, change: { kind: "unknown" } }], ["roadmap", "maintain"]);
    assert.match(text, /^\*Are these files still current\?\* This thread settled a decision about each of these files:\n1\. /);
    assert.match(text, /\n2\. <[^>]+\|Button\.jsx>: settled "tooltips on option chips" on Sep 24, and it may not show it yet\.\n/);
    assert.match(text, /\n:white_check_mark: files both intakes; reply `drop 2` to leave one out\. :no_entry: files nothing\.\n/);
    passesChecklist(text, { gate: true });
  });

  it("the question alone points at the card and carries no gate", () => {
    const text = askLead({ mentions: [MERYEM], items: [{ ...one, change: { kind: "changed", at: Date.UTC(2026, 8, 26, 18) }, elsewhere: { cardLink: "https://plus.slack.com/archives/C0/p1" } }] });
    assert.match(text, /, and <[^>]+\|Goal Setting \/ Card 2482> last changed Sep 26\.\n/);
    assert.match(text, /Its intake is drafted <https:\/\/plus\.slack\.com\/archives\/C0\/p1\|in another thread>\.$/);
    passesChecklist(text);
  });

  it("is withdrawn by editing the same message, striking the question through", () => {
    const headline = "Is the Figma file still current?";
    const withdrawn = [
      [caughtUpText(headline, Date.UTC(2026, 8, 30, 18)), "~Is the Figma file still current?~ Yes, updated Sep 30. Nothing to do."],
      [confirmedText(headline, MERYEM), "~Is the Figma file still current?~ Yes, confirmed by <@U0MERYEM1>. Nothing to do."],
      [skippedText(headline, MERYEM), "~Is the Figma file still current?~ Skipped by <@U0MERYEM1>. Nothing to do."],
    ];
    for (const [text, expected] of withdrawn) {
      assert.equal(text, expected);
      passesChecklist(text!);
    }
    for (const text of [withdrawnElsewhereText(1), withdrawnElsewhereText(2), partlyAnsweredText([2]), skippedSharedText([]), skippedSharedText([2]), DRIFT_NOT_STAGED_TEXT]) passesChecklist(text);
    assert.equal(DRIFT_NOT_STAGED_TEXT, "This question didn't go through, so its intake can't be filed from here. I'll ask again.");
  });

  it("answers the gate in its own words: a ⛔ files nothing, and a late decision is told nothing was filed", () => {
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

  it("the parent names the file and the count, for one named person, in one plain sentence", () => {
    const three = decisionParent({ ...FILE, owner: { slack: "U0AAAAAA1" } }, 3);
    assert.equal(three, "<@U0AAAAAA1>, 3 comments in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> read like decisions.");
    passesChecklist(three);
    assert.equal(three.match(/<@U/g)?.length, 1, "the owner, once");
    const one = decisionParent({ ...FILE, owner: { figma: "bea" } }, 1);
    assert.equal(one, "bea, 1 comment in <https://www.figma.com/design/GoalFile1|Goal Setting / Card 2482 / Sarah> reads like a decision.");
    passesChecklist(one);
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
