// The copy uno-bot's code writes itself — gate notes, the App Home, the
// welcome, the proposal card, sweep cards, the batch result, the failure
// message, the button door, DM watch, follow-through, Figma — held to the
// emoji budget and to one self-name.
//
// The budget, as the persona states it for fixed copy:
//   • ⚠️ ❌ ✅ ⛔ ✏️ are the only signs, and only as a line's first glyph: one
//     per line, at most three in a message. Anything else that was a glyph
//     (📦 🔍 👆 👀 ⏳ 🔄 🔒 …) is said in words.
//   • ✅ and ⛔ may also be named mid-line, because they are the gate's
//     reactions: "A ✅ there files it" is an instruction, not decoration.
//   • 🐐 once on the App Home and once in the welcome, and nowhere else.
//   • The reminder vocabulary 🙌 ⏳ 🙅 🤔 is protocol — a person answers a
//     reminder by reacting with it — so the files that write reminders keep it.
//   • The bot is "le goat" wherever it names itself, never "UNO Bot".
//
// Two checks, the way tests/figma-copy.test.ts pins the Figma messages:
//   • every string literal in every fixed-copy module, read off the source, so
//     a new decorative glyph fails here before any renderer is called;
//   • what the main renderers actually produce, for the position rules a
//     source scan cannot see.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { homeView } from "../src/slack/home";
import { WELCOME } from "../src/slack/assistant";
import { renderGateNote } from "../src/slack/gate-note";
import { renderProposalCard } from "../src/slack/proposal-render";
import { batchResultMessage } from "../src/slack/batch-result";
import { buildFailureMessage } from "../src/slack/failure-message";
import type { GateNote } from "../src/turn/index";
import type { OperationOutcome } from "../src/gate/index";

// ── The budget ───────────────────────────────────────────────────────────────

const SRC = join(process.cwd(), "src");

/** Signs a fixed message may open a line with. */
const STATUS = ["⚠", "❌", "✅", "⛔", "✏"];
/** The two signs that are also the gate's reactions, so may be named mid-line. */
const GATE = ["✅", "⛔"];
/** How a person answers a reminder. */
const REMINDER = ["🙌", "⏳", "🙅", "🤔"];
const GOAT = "🐐";

/** Slack shortcodes the copy writes, as the glyph a person sees. */
const SHORTCODES: Record<string, string> = {
  warning: "⚠",
  x: "❌",
  white_check_mark: "✅",
  no_entry: "⛔",
  pencil2: "✏",
  goat: GOAT,
  tada: "🎉",
  raised_hands: "🙌",
  hourglass_flowing_sand: "⏳",
  no_good: "🙅",
  thinking_face: "🤔",
};

/**
 * Every module that writes copy of its own, and what it may carry beyond the
 * status signs. A module that starts writing fixed copy is added here.
 */
const FIXED_COPY: Record<string, string[]> = {
  // Gate notes and the proposal card
  "slack/gate-note.ts": [],
  "slack/proposal-render.ts": [],
  "slack/button-door.ts": [],
  "slack/review-door.ts": [],
  "slack/review-view.ts": [],
  "slack/interactive.ts": [],
  "slack/review-fields.ts": [],
  "slack/batch-result.ts": [],
  "turn/turn.ts": [],
  // Failure, and the doors a request comes in by
  "slack/failure-message.ts": [],
  "slack/commands.ts": [],
  "slack/events.ts": [],
  "slack/shortcuts.ts": [],
  "slack/session-stop.ts": [],
  "slack/delivery.ts": [],
  "slack/delivery-adapter.ts": [],
  "slack/api.ts": [],
  // App Home and the welcome
  "slack/home.ts": [GOAT],
  "slack/assistant.ts": [GOAT],
  "dm-watch/home.ts": [],
  "oauth/slack.ts": [],
  // End-of-day sweep, DM watch, follow-through, reminders
  "sweep/cards.ts": [],
  "sweep/share.ts": [],
  "sweep/run.ts": [],
  "dm-watch/capture.ts": [],
  "dm-watch/copy.ts": REMINDER,
  "dm-sweep/copy.ts": REMINDER,
  "follow-through/copy.ts": REMINDER,
  "follow-through/run.ts": [],
  "commitments/copy.ts": REMINDER,
  // Figma library, drift and the weekly precedence thread. 🎉 marks a merged
  // PR, the one ship tests/figma-copy.test.ts allows.
  "figma-library/draft.ts": [],
  "figma-library/post.ts": [],
  "figma-library/track.ts": ["🎉"],
  "figma-drift/copy.ts": [],
  "ds-precedence/report.ts": [],
  // What a write tool says once it has run, and what it asks before staging
  "agent/preflight.ts": [],
  "agent/placeholder.ts": [],
  "tools/notion-create.ts": [],
  "tools/notion-update.ts": [],
  "tools/notion-archive.ts": [],
  "tools/send-email.ts": [],
  "tools/relay-dm.ts": [],
  "tools/github-issue.ts": [],
  "tools/github-issue-update.ts": [],
  "tools/github-workflow.ts": [],
};

// ── Reading the copy off the source ──────────────────────────────────────────

/**
 * Every string literal in a TypeScript file, comments left out. A template's
 * substitutions read as `${}`, and the strings inside them are read on their
 * own, so `${channel}:raise:` is a key and not a `:raise:` emoji.
 */
export function stringLiterals(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  let last = "";

  function quoted(q: string): string {
    let s = "";
    i++;
    while (i < src.length && src[i] !== q) {
      if (src[i] === "\\") {
        s += src.slice(i, i + 2);
        i += 2;
        continue;
      }
      s += src[i++];
    }
    i++;
    return s;
  }

  function template(): string {
    let s = "";
    i++;
    while (i < src.length && src[i] !== "`") {
      if (src[i] === "\\") {
        s += src.slice(i, i + 2);
        i += 2;
      } else if (src[i] === "$" && src[i + 1] === "{") {
        i += 2;
        code(true);
        s += "${}";
      } else s += src[i++];
    }
    i++;
    return s;
  }

  function regex(): void {
    let inClass = false;
    i++;
    while (i < src.length) {
      const c = src[i]!;
      if (c === "\\") i += 2;
      else if (c === "[") (inClass = true), i++;
      else if (c === "]") (inClass = false), i++;
      else if (c === "/" && !inClass) {
        i++;
        while (/[a-z]/.test(src[i] ?? "")) i++;
        return;
      } else i++;
    }
  }

  /** Code until the `}` that closes a substitution, or the end. */
  function code(inSubstitution: boolean): void {
    let depth = 0;
    while (i < src.length) {
      const c = src[i]!;
      if (c === "/" && src[i + 1] === "/") {
        while (i < src.length && src[i] !== "\n") i++;
      } else if (c === "/" && src[i + 1] === "*") {
        i = src.indexOf("*/", i + 2) + 2;
        if (i === 1) i = src.length;
      } else if (c === '"' || c === "'") {
        out.push(quoted(c));
        last = "x";
      } else if (c === "`") {
        out.push(template());
        last = "x";
      } else if (c === "/" && (last === "" || /[(,=:[!&|?{};]/.test(last) || /\breturn$/.test(src.slice(0, i).trimEnd()))) {
        regex();
        last = "x";
      } else {
        if (c === "{") depth++;
        if (c === "}") {
          if (inSubstitution && depth === 0) {
            i++;
            return;
          }
          depth--;
        }
        if (!/\s/.test(c)) last = c;
        i++;
      }
    }
  }

  code(false);
  return out;
}

/** Every emoji in a piece of copy, as the glyph a person sees. */
function emojiIn(text: string): string[] {
  const glyphs = (text.replace(/\uFE0F/g, "").match(/\p{Extended_Pictographic}/gu) ?? []).filter((g) => !"©®™↔↩↪".includes(g));
  const codes = [...text.matchAll(/(?<![\w}$-]):([a-z][a-z0-9_+-]*):(?![\w])/g)].map((m) => SHORTCODES[m[1]!] ?? `:${m[1]}:`);
  return [...glyphs, ...codes];
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "generated" ? [] : filesUnder(path);
    return name.endsWith(".ts") ? [path] : [];
  });
}

describe("the reader the guard depends on", () => {
  it("reads strings, not comments, keys or regexes", () => {
    const src = [
      "// :mag: a comment",
      "/* 🔒 a block comment */",
      'const a = "⚠️ one";',
      "const re = /['\\u2019]/g;",
      "const k = `${channel}:raise:${n}`;",
      "const t = `:x: ${n === 1 ? \"it\" : `all ${n}`} done`;",
    ].join("\n");
    const strings = stringLiterals(src);
    assert.deepEqual(strings, ["⚠️ one", "${}:raise:${}", "it", "all ${}", ":x: ${} done"]);
    assert.deepEqual(strings.flatMap(emojiIn), ["⚠", "❌"]);
  });

  it("knows every fixed-copy module it names", () => {
    for (const file of Object.keys(FIXED_COPY)) {
      assert.ok(statSync(join(SRC, file)).isFile(), `${file} exists`);
    }
  });
});

describe("the per-file emoji allowlist", () => {
  for (const [file, extra] of Object.entries(FIXED_COPY)) {
    it(`${file} carries only its own signs`, () => {
      const allowed = new Set([...STATUS, ...extra]);
      const strings = stringLiterals(readFileSync(join(SRC, file), "utf8"));
      for (const s of strings) {
        for (const e of emojiIn(s)) assert.ok(allowed.has(e), `${file}: ${e} in ${JSON.stringify(s.slice(0, 120))}`);
      }
      if (extra.includes(GOAT)) {
        const goats = strings.flatMap(emojiIn).filter((e) => e === GOAT).length;
        assert.equal(goats, 1, `${file}: ${GOAT} once`);
      }
    });
  }
});

describe("the self-name", () => {
  it('is "le goat" everywhere the code names the bot, never "UNO Bot"', () => {
    for (const path of filesUnder(SRC)) {
      for (const s of stringLiterals(readFileSync(path, "utf8"))) {
        assert.doesNotMatch(s, /\buno bot\b/i, `${path.slice(SRC.length + 1)}: ${JSON.stringify(s.slice(0, 120))}`);
      }
    }
  });

  it("is what the App Home, the welcome and an untitled chat say", () => {
    const home = JSON.stringify(homeView({ connectUrl: "https://example.test/link", viewer: { connected: false, on: [] } }));
    assert.match(home, /le goat 🐐/);
    assert.match(home, /@le goat/);
    assert.match(WELCOME, /I'm le goat :goat:/);
  });
});

// ── The rendered copy ────────────────────────────────────────────────────────

/** A message held to the budget: its signs, where they sit, how many. */
function assertBudget(text: string, extra: string[] = []): void {
  const allowed = new Set([...STATUS, ...extra]);
  let signs = 0;
  for (const line of text.split("\n")) {
    const found = emojiIn(line);
    for (const e of found) assert.ok(allowed.has(e), `${e} is not in the budget:\n${text}`);
    const lead = emojiIn(line.replace(/^\s+/, "").slice(0, 24))[0];
    const opens = lead !== undefined && STATUS.includes(lead) && new RegExp(`^(${Object.entries(SHORTCODES).filter(([, g]) => g === lead).map(([c]) => `:${c}:`).join("|")}|${lead}\uFE0F?)`).test(line);
    if (opens) signs++;
    // Past the first glyph, only the gate's reactions may be named.
    for (const e of found.slice(opens ? 1 : 0)) {
      if (STATUS.includes(e)) assert.ok(GATE.includes(e), `${e} mid-line:\n${line}`);
    }
  }
  assert.ok(signs <= 3, `${signs} signs in one message:\n${text}`);
}

/** Every text a Block Kit view shows, and every button's label. */
function viewTexts(view: unknown): { texts: string[]; buttons: string[] } {
  const texts: string[] = [];
  const buttons: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (o.type === "button") buttons.push((o.text as { text: string }).text);
    else if (typeof o.text === "string") texts.push(o.text);
    for (const v of Object.values(o)) walk(v);
  };
  walk(view);
  return { texts, buttons };
}

describe("the App Home", () => {
  for (const connected of [false, true]) {
    it(`shows 🐐 once and no emoji in a button (${connected ? "linked" : "not linked"})`, () => {
      const { texts, buttons } = viewTexts(
        homeView({ connectUrl: "https://example.test/link", viewer: { connected, on: [], refused: connected ? { ok: false, reason: "missing-scopes", missing: ["im:history"] } : undefined } }),
      );
      for (const label of buttons) assert.deepEqual(emojiIn(label), [], `button "${label}"`);
      assert.equal(texts.flatMap(emojiIn).filter((e) => e === GOAT).length, 1);
      for (const t of texts) assertBudget(t, [GOAT]);
    });
  }
});

describe("the welcome", () => {
  it("names itself once with 🐐 and keeps to the budget", () => {
    assert.equal(emojiIn(WELCOME).filter((e) => e === GOAT).length, 1);
    assertBudget(WELCOME, [GOAT]);
  });
});

describe("the gate notes", () => {
  const notes: GateNote[] = [
    { kind: "already-resolved" },
    { kind: "expired" },
    { kind: "superseded" },
    { kind: "superseded", stated: true },
    { kind: "resolved", decision: "confirm" },
    { kind: "resolved", decision: "cancel", stillRuns: ["notion_create"] },
    { kind: "not-on-the-card", toolName: "notion_create", glyph: "white_check_mark", userId: "U0000002" },
    { kind: "not-on-the-card", toolName: "notion_create", glyph: "no_entry", userId: "U0000002", stated: true },
    { kind: "which-card", count: 2 },
    { kind: "not-a-confirmer", confirmers: ["U0000007"], userId: "U0000002" },
    { kind: "not-a-confirmer", confirmers: [] },
    { kind: "resolve-failed", glyph: "white_check_mark" },
    { kind: "cut-off", finished: [{ toolName: "notion_create", ok: true }], unfinished: ["notion_update"], restaged: true },
  ];
  for (const note of notes) {
    it(`${note.kind}${"stated" in note && note.stated ? " (stated)" : ""} keeps to the budget`, () => {
      assertBudget(renderGateNote(note));
    });
  }
});

describe("the proposal card", () => {
  it("keeps to the budget with every caveat on it", () => {
    const caveats = [
      { kind: "cut-off-rerun" },
      { kind: "bundle-incomplete", missing: ["Figma link"] },
      { kind: "repo-visibility", repo: "BilLogic/plus-uno", visibility: "public" },
      { kind: "no-open-questions" },
    ] as const;
    for (const caveat of caveats) {
      const card = renderProposalCard({ kind: "confirm", verb: "create a Notion page", fields: [], caveats: [caveat as never], operations: [] });
      assertBudget(card.text);
    }
    for (const visibility of ["private", "unknown"] as const) {
      const card = renderProposalCard({
        kind: "confirm",
        verb: "file a GitHub issue",
        fields: [],
        caveats: [{ kind: "repo-visibility", repo: "BilLogic/plus-uno", visibility } as never],
        operations: [],
      });
      assertBudget(card.text);
    }
  });

  it("keeps to the budget when the plan runs to its own messages", () => {
    const operations = Array.from({ length: 60 }, (_, n) => ({
      toolName: "notion_update",
      input: { page_id: `p${n}`, properties: { Status: "Done" }, body: "x".repeat(400) },
    }));
    const card = renderProposalCard({ kind: "confirm", verb: "update Notion pages", fields: [], caveats: [], operations });
    assertBudget(card.text);
    for (const message of card.followUp ?? []) assertBudget(message);
  });
});

describe("the batch result", () => {
  it("names each operation's result in words, not a sign per row", () => {
    const outcomes: OperationOutcome[] = Array.from({ length: 5 }, (_, n) => ({
      toolName: "notion_update",
      input: { page_id: `p${n}` },
      ok: n !== 2,
      result: "{}",
      message: n === 2 ? "Notion refused it" : "updated",
    }));
    const text = batchResultMessage(outcomes)!;
    assertBudget(text);
    assert.match(text, /failed/);
    const allDone = batchResultMessage(outcomes.map((o) => ({ ...o, ok: true })))!;
    assertBudget(allDone);
  });
});

describe("the failure message", () => {
  for (const capacity of [false, true]) {
    it(`keeps to the budget${capacity ? " at capacity" : ""}`, () => {
      assertBudget(buildFailureMessage({ stage: "agent", capacity, alertChannel: "C0ARJ2A3A69" }));
    });
  }
});
