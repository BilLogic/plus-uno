// Every Figma message uno-bot's code writes, against the copy Bill approved in
// #886 (2026-09-30) — the library publish card, its thread, the post for a
// library edited but not published, and the weekly precedence thread.
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
  publishCard,
  type ComponentRegistry,
  type LibraryChangeSet,
  type LibraryComponent,
} from "../src/figma-library/draft";
import { libraryCard, LIBRARY_CARD_TTL_MS } from "../src/figma-library/post";
import { expiredCardNote, prClosedLine, prMergedLine, prOpenedLine } from "../src/figma-library/track";
import {
  precedenceCard,
  precedenceList,
  precedenceOperations,
  precedenceRuleUrl,
  type IntakeTarget,
  type NumberedItem,
} from "../src/ds-precedence/report";
import { CONFIRM_FOOTER, renderProposalCard } from "../src/slack/proposal-render";

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
  // One vocabulary.
  const words = readable(text).toLowerCase();
  for (const retired of RETIRED) {
    const pattern = new RegExp(`(^|[^\\w-])${retired.toLowerCase().replace(/[.*+?^${}()|[\]\\#]/g, "\\$&")}($|[^\\w-])`);
    assert.doesNotMatch(words, pattern, `"${retired}" is retired (slack.md § Figma messages)`);
  }
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

  it("closes an expired card with #886's last line", () => {
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
