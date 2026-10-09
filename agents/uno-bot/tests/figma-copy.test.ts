// Every Figma message uno-bot's code writes, against the copy Bill approved in
// #886 (2026-09-30) — the library publish card, its thread, the post for a
// library edited but not published, the weekly precedence thread, the drift
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
  publishLead,
  releaseItem,
  releaseParent,
  type ComponentRegistry,
  type LibraryChangeSet,
  type LibraryComponent,
} from "../src/figma-library/draft";
import { libraryCard, LIBRARY_CARD_TTL_MS } from "../src/figma-library/post";
import { expiredCardNote, expiredThreadLine, failedFiledLine, prClosedLine, prMergedLine, prOpenedLine } from "../src/figma-library/track";
import {
  precedenceCard,
  precedenceCardWords,
  precedenceList,
  precedenceOperations,
  precedenceRuleUrl,
  type IntakeTarget,
  type NumberedItem,
} from "../src/ds-precedence/report";
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

/** What Review shows of a publish. */
function card(cs: LibraryChangeSet): string {
  const intake = draftPublishIntake(cs, REGISTRY);
  return renderProposalCard(libraryCard(cs, intake)).text;
}

/** The report's words for a publish: its parent line and its one card. */
function report(cs: LibraryChangeSet) {
  const intake = draftPublishIntake(cs, REGISTRY);
  return { parent: releaseParent(cs, intake), item: releaseItem(cs, intake) };
}

describe("the library publish report", () => {
  // #886's own example: seven components, two of them new, three with code.
  const SEVEN = changeSet({
    created: [component("Chip"), component("Tag")],
    modified: ["Badge", "Button", "Card", "Toast", "Tooltip"].map((s) => component(s)),
    newComponentIds: ["9:Chip", "9:Tag"],
  });

  it("says who published what in one plain sentence, and puts the publish on one card", () => {
    const { parent, item } = report(SEVEN);
    assert.equal(parent, 'sarah published "Button focus ring" to the library: 7 components changed, 3 of them have code.');
    passesChecklist(parent);
    assert.deepEqual(item, {
      id: "2210",
      title: "Button focus ring",
      subtitle: "sarah · Sep 29",
      body: "2 new, 5 updated. Badge, Button and Card have code that can be drafted to match.",
      open: { label: "Open library", url: `https://www.figma.com/design/${FILE_KEY}` },
      also: { label: "View version", url: `https://www.figma.com/design/${FILE_KEY}?version-id=2210` },
      done: "the intake, and code drafts started for Badge, Button and Card.",
    });
    passesChecklist(item.body);
    // The library file's name, when Figma gives it, sits between who and when.
    const named = releaseItem(SEVEN, draftPublishIntake(SEVEN, REGISTRY), "PLUS BS4 Foundation");
    assert.equal(named.subtitle, "sarah · PLUS BS4 Foundation · Sep 29");
  });

  it("what Review shows: the publish, every component under its group, and no footer", () => {
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
      ].join("\n"),
    );
    countMatchesNames(text);
    passesChecklist(text);
  });

  it("names two components that share a name twice, so the count still matches", () => {
    const twins = changeSet({
      modified: [component("Button"), { ...component("Button", "Other"), setNodeId: "9:Button-2" }],
    });
    const text = card(twins);
    assert.match(text, /^2 components changed: 2 updated\.$/m);
    countMatchesNames(text);
  });

  it("says plainly when nothing has code, so Approve files the intake alone", () => {
    const cs = changeSet({ created: [component("Chip"), component("Tag")], newComponentIds: ["9:Chip", "9:Tag"] });
    const { parent, item } = report(cs);
    assert.match(parent, /: 2 components changed, none of them has code yet\.$/);
    assert.equal(item.body, "2 new. Nothing here has code yet, so there's nothing to draft.");
    assert.equal(item.done, "the intake.");
    countMatchesNames(card(cs));
    passesChecklist(parent);
  });

  it("says so when a version changed no component it can see", () => {
    const { parent, item } = report(changeSet({}));
    assert.equal(parent, 'sarah published "Button focus ring" to the library, with no changed components found.');
    assert.equal(item.body, "No changed components found. The version has the details.");
    assert.match(card(changeSet({})), /^No changed components found\. The version has the details\.$/m);
  });

  it("counts a removed component, and only when none of it is left", () => {
    const text = card(changeSet({ deleted: [component("Toast")], modified: [component("Badge")], removedComponentIds: ["9:Toast"] }));
    assert.match(text, /^2 components changed: 1 updated, 1 removed\.$/m);
    countMatchesNames(text);
  });

  it("past 1,500 characters, Review ends each group with \"and N more\", and the whole list fits the thread", () => {
    const many = Array.from({ length: 80 }, (_, i) => component(`Extra component ${String(i).padStart(2, "0")}`));
    const big = changeSet({ created: many, newComponentIds: many.map((c) => c.setNodeId!) });
    const text = card(big);
    passesChecklist(text);
    countMatchesNames(text);
    assert.match(text, / and \d+ more$/m);
    const intake = draftPublishIntake(big, REGISTRY);
    assert.equal(publishLead(big, intake), text);
    const thread = componentListMessages(intake).join("\n");
    assert.match(thread, /^All 80 components in this publish:/);
    for (const c of many) assert.ok(thread.includes(c.containingFrame), c.containingFrame);
  });

  it("names how many have code when their names would not fit the card", () => {
    const names = Array.from({ length: 30 }, (_, i) => `Mapped component number ${i}`);
    const registry: ComponentRegistry = {
      components: Object.fromEntries(names.map((name) => [name, { code: { mdxPath: `x/${name}/${name}.mdx` }, figma: { sets: [{ name, componentSetNodeId: `9:${name}` }] } }])),
    };
    const cs = changeSet({ modified: names.map((n) => component(n)) });
    const item = releaseItem(cs, draftPublishIntake(cs, registry));
    assert.equal(item.body, "30 updated. 30 components have code that can be drafted to match.");
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
  it("the library card names both of its operations as fields, and carries no footer", () => {
    const seven = changeSet({ modified: [component("Button"), component("Toast")] });
    const intake = draftPublishIntake(seven, REGISTRY);
    const built = libraryCard(seven, intake);
    assert.deepEqual(built.operations.map((o) => o.toolName), ["github_issue_create", "component_implement"]);
    assert.deepEqual(built.fields, [
      { label: "intake", value: intake.title },
      { label: "implement", value: "Button" },
    ]);
    assert.equal(built.footer, "");

    const noCode = changeSet({ modified: [component("Toast")] });
    const alone = libraryCard(noCode, draftPublishIntake(noCode, REGISTRY));
    assert.deepEqual(alone.operations.map((o) => o.toolName), ["github_issue_create"]);
    assert.deepEqual(alone.fields.map((f) => f.label), ["intake"]);
  });

  it("the precedence card names its one write", () => {
    for (const target of [{ kind: "create" }, { kind: "update", issue: 9, url: "https://github.com/o/r/issues/9" }] as IntakeTarget[]) {
      const operations = precedenceOperations(THREE, target, "2026-09-28");
      assert.equal(operations.length, 1);
      const built = precedenceCard(THREE, [], target, operations, 144);
      assert.match(built.footer!, target.kind === "create" ? /files items 1, 2 and 3 as the weekly intake/ : /adds items 1, 2 and 3 to the/);
    }
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

  it("tells an expired card's thread what it filed, in one plain sentence", () => {
    const line = expiredThreadLine(INTAKE.url);
    assert.equal(line, "No decision in 72 h. I filed the <https://github.com/o/r/issues/45|intake> so the publish isn't lost.");
    passesChecklist(line);
  });

  it("tells the thread when it filed an intake an approved write had failed to", () => {
    const line = failedFiledLine(INTAKE.url);
    assert.equal(line, "The approved filing didn't go through, so I filed the <https://github.com/o/r/issues/45|intake> now.");
    passesChecklist(line);
  });

  it("closes a card posted before the shared card with #886's last line", () => {
    const note = expiredCardNote(INTAKE.url);
    assert.equal(note, "_No decision in 72 h. Filed the <https://github.com/o/r/issues/45|intake> so it isn't lost._");
    passesChecklist(note);
  });
});

// ── The weekly precedence thread (#886 § 3.4) ────────────────────────────────

const REPO = "BilLogic/plus-uno";
const RULE_URL = precedenceRuleUrl(REPO);

function item(n: number, component: string, summary: string): NumberedItem {
  return {
    n,
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

const THREE: NumberedItem[] = [
  item(1, "Button", 'code has `size="xs"`, the library doesn\'t'),
  item(2, "Badge", 'the library has `tone="neon"`, code doesn\'t'),
  item(3, "Card", "code has it, the library has no published component for it"),
];

describe("the weekly precedence thread", () => {
  it("leads with the finding, links the rule, and ends with the `drop` instruction", () => {
    const list = precedenceList(THREE, "2026-09-28", RULE_URL);
    assert.deepEqual(list.overflow, []);
    assert.equal(
      list.text,
      [
        "*Code and the library disagree on 3 components* (week of Sep 28)",
        `Code wins by our <${RULE_URL}|precedence rule>, so the library side needs the fix unless it's deliberate.`,
        "",
        `1. Button: code has \`size="xs"\`, the library doesn't · <https://github.com/${REPO}/blob/main/Button.md|code> · <https://www.figma.com/design/${FILE_KEY}?node-id=1-1|Figma>`,
        `2. Badge: the library has \`tone="neon"\`, code doesn't · <https://github.com/${REPO}/blob/main/Badge.md|code> · <https://www.figma.com/design/${FILE_KEY}?node-id=1-2|Figma>`,
        `3. Card: code has it, the library has no published component for it · <https://github.com/${REPO}/blob/main/Card.md|code> · <https://www.figma.com/design/${FILE_KEY}?node-id=1-3|Figma>`,
        "",
        "Reply `drop 2` for any that's deliberate, and I'll revise the card.",
      ].join("\n"),
    );
    passesChecklist(list.text);
  });

  it("counts components, not items, so the count is the names", () => {
    const twice = [item(1, "Button", "code has `size=\"xs\"`, the library doesn't"), item(2, "Button", "code has a `tone` prop (`a`), and no variant in the library carries it")];
    const { text } = precedenceList(twice, "2026-09-28", RULE_URL);
    assert.match(text.split("\n")[0]!, /^\*Code and the library disagree on 1 component\* /);
    const named = new Set(text.split("\n").flatMap((l) => /^\d+\. ([^:]+):/.exec(l)?.slice(1) ?? []));
    assert.equal(named.size, 1);
  });

  it("past 1,500 characters, counts the rest and lists them in the thread under their own numbers", () => {
    const many = Array.from({ length: 30 }, (_, i) => item(i + 1, `Component${i + 1}`, "code has it, the library has no published component for it"));
    const { text, overflow } = precedenceList(many, "2026-09-28", RULE_URL);
    passesChecklist(text);
    const shown = text.split("\n").filter((l) => /^\d+\. /.test(l)).length;
    const rest = Number(/^and (\d+) more, listed in the thread\.$/m.exec(text)?.[1]);
    assert.equal(shown + rest, 30);
    assert.match(overflow.join("\n"), new RegExp(`^${shown + 1}\\. Component${shown + 1}: `, "m"));
    assert.match(overflow.join("\n"), /^30\. Component30: /m);
    assert.equal(text.split("\n").at(-1), "Reply `drop 2` for any that's deliberate, and I'll revise the card.");
  });

  const cardText = (items: NumberedItem[], dropped: number[], target: IntakeTarget, hours = 144) =>
    renderProposalCard(precedenceCard(items, dropped, target, precedenceOperations(items, target, "2026-09-28"), hours)).text;

  it("puts the one footer on the card, beside its buttons", () => {
    const text = cardText(THREE, [], { kind: "create" });
    assert.equal(
      text,
      ":white_check_mark: files items 1, 2 and 3 as the weekly intake. :no_entry: files nothing.\nAnyone in this channel can decide, for the next 6 days.",
    );
    passesChecklist(text, { gate: true });
  });

  it("links the open weekly intake when the ✅ adds to it", () => {
    const text = cardText(THREE, [], { kind: "update", issue: 900, url: "https://github.com/o/r/issues/900" });
    assert.equal(text.split("\n")[0], ":white_check_mark: adds items 1, 2 and 3 to the <https://github.com/o/r/issues/900|weekly intake>. :no_entry: files nothing.");
    passesChecklist(text, { gate: true });
  });

  it("a revision leads with what it left out, and states its time left", () => {
    const text = cardText([THREE[0]!, THREE[2]!], [2], { kind: "create" }, 30);
    assert.equal(
      text,
      [
        "Revised without item 2.",
        "",
        ":white_check_mark: files items 1 and 3 as the weekly intake. :no_entry: files nothing.",
        "Anyone in this channel can decide, for the next 30 h.",
      ].join("\n"),
    );
    passesChecklist(text, { gate: true });
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

  it("the library card: Reject files nothing, and a late decision is told the intake still lands", () => {
    assert.equal(drafting.cancelled, "Rejected, nothing filed");
    assert.equal(
      drafting.expired,
      "That card closed after 72 h with no decision, so nothing was drafted. I file its intake the morning after, so the publish isn't lost.",
    );
    // Nothing had code, so there was nothing to draft and the line says less.
    assert.equal(noCode.expired, "That card closed after 72 h with no decision. I file its intake the morning after, so the publish isn't lost.");
  });

  it("the precedence card: a ⛔ files nothing, and its window is the whole six days", () => {
    assert.deepEqual(weekly, {
      cancelled: "Nothing filed this week",
      expired: "That card closed after 6 days with no decision, so nothing was filed.",
    });
  });

  it("a ⛔ closes either card with what it did and who decided", () => {
    assert.equal(statedCancelledNote(drafting, "U0AAAAAA2"), ":no_entry: Rejected, nothing filed, decided by <@U0AAAAAA2>.");
    assert.equal(statedCancelledNote(weekly, "U0AAAAAA2"), ":no_entry: Nothing filed this week, decided by <@U0AAAAAA2>.");
    // Only a Slack id is mentioned; anything else would blank the post.
    assert.equal(statedCancelledNote(weekly, "someone"), ":no_entry: Nothing filed this week.");
    passesGateAnswer(statedCancelledNote(drafting, "U0AAAAAA2"), [":no_entry:"]);
    passesGateAnswer(statedCancelledNote(weekly, "U0AAAAAA2"), [":no_entry:"]);
  });

  it("every answer the gate gives a stated card holds to the copy rules, and names no tool", () => {
    const answers: Array<[GateNote, string[]]> = [
      [{ kind: "resolved", decision: "cancel", cancelled: drafting.cancelled }, []],
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
    assert.equal(renderGateNote(answers[0]![0]), "Rejected, nothing filed.");
    assert.equal(renderGateNote(answers[1]![0]), "Nothing filed this week.");
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

  it("each file's card: the file, its owner and last change, what the thread settled, and Open to the frame", () => {
    const item = driftItem({ id: "1", ...one, owner: MERYEM, lane: "roadmap" });
    assert.deepEqual(item, {
      id: "1",
      title: "Goal Setting — Goal states",
      subtitle: "<@U0MERYEM1> · last changed Sep 20",
      body: 'Thread settled "tooltips on option chips" on Sep 24 · the file has not changed since Sep 20.',
      open: { label: "Open in Figma", url: FILE.url },
      done: "a Roadmap card to update Goal Setting — Goal states",
    });
    const changed = driftItem({ id: "2", ...one, change: { kind: "changed", at: Date.UTC(2026, 8, 26, 18) }, owner: null, lane: "roadmap" });
    assert.equal(changed.subtitle, "last changed Sep 26");
    assert.equal(changed.body, 'Thread settled "tooltips on option chips" on Sep 24 · the file changed Sep 26, unconfirmed.');
    const code = driftItem({ id: "3", ...one, file: CODE, change: { kind: "unknown" }, owner: MERYEM, lane: "maintain" });
    assert.equal(code.subtitle, "<@U0MERYEM1>");
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
