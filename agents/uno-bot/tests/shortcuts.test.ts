import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SHORTCUTS } from "../src/slack/shortcut-specs";
import { GRIND, CHILL, EFFORT_COMMANDS } from "../src/slack/effort";

// The manifest declares the menu label; shortcuts.ts declares what each one
// actually asks. They are two files that must agree, and the failure is silent
// in the worst direction: a shortcut declared with no handler entry STILL
// APPEARS in the context menu and quietly does nothing useful.
//
// Parsed with a regex rather than a YAML dependency — the file is ours and the
// shape is fixed, and a test that needs a parser is a test people delete.
function manifestCallbackIds(): string[] {
  const yaml = readFileSync(resolve(process.cwd(), "slack-app-manifest.yaml"), "utf8");
  const section = yaml.split("\n  shortcuts:")[1]?.split("\n  slash_commands:")[0] ?? "";
  return [...section.matchAll(/callback_id:\s*(\S+)/g)].map((m) => m[1]!);
}

test("every manifest shortcut has a handler", () => {
  for (const id of manifestCallbackIds()) {
    assert.ok(SHORTCUTS[id], `manifest declares ${id} with no entry in SHORTCUTS`);
  }
});

test("every handler is declared in the manifest", () => {
  const declared = new Set(manifestCallbackIds());
  for (const id of Object.keys(SHORTCUTS)) {
    assert.ok(declared.has(id), `SHORTCUTS has ${id} but the manifest never declares it`);
  }
});

test("all five are present", () => {
  assert.deepEqual(
    Object.keys(SHORTCUTS).sort(),
    ["catchup", "draft", "grind", "verify", "where_decided"],
  );
});

test("every ask embeds the permalink — the anchor is the whole point", () => {
  const link = "https://example.slack.com/archives/C1/p123";
  for (const [id, spec] of Object.entries(SHORTCUTS)) {
    assert.ok(spec.ask(link).includes(link), `${id} ask drops the link`);
    assert.ok(spec.anchor(link).includes(link), `${id} anchor drops the link`);
  }
});

test("titles are short enough to read in a timeline", () => {
  for (const [id, spec] of Object.entries(SHORTCUTS)) {
    assert.ok(spec.title.length > 0 && spec.title.length <= 24, `${id} title: "${spec.title}"`);
  }
});

test("the draft shortcut tells the agent not to post it", () => {
  // Its deliverable is deliberately NOT sent — the value is attribution, and a
  // bot posting "your" reply destroys exactly that.
  const ask = SHORTCUTS.draft!.ask("https://x/y");
  assert.match(ask, /do not post it/i);
});

test("where-decided refuses to invent provenance", () => {
  const ask = SHORTCUTS.where_decided!.ask("https://x/y");
  assert.match(ask, /never construct/i);
  assert.match(ask, /no record/i);
});

// ── one grind, two surfaces ──────────────────────────────────────────────────
// /grind and the "think harder" shortcut are not duplicates — slash commands do
// not work in threads, so neither reaches the other's surface. But they must
// mean the SAME thing, and two copies of the wording would diverge the first
// time one was edited.

test("the grind shortcut and /grind share one definition", () => {
  assert.equal(EFFORT_COMMANDS["/grind"], GRIND, "/grind must use the shared GRIND mode");
  assert.equal(SHORTCUTS.grind!.tier, GRIND.tier);
  assert.ok(
    SHORTCUTS.grind!.ask("https://x/y").includes(GRIND.instruction),
    "the shortcut must carry the shared instruction, not a second copy of it",
  );
});

test("effort modes name a tier that is not the default", () => {
  assert.equal(GRIND.tier, "grind");
  assert.equal(CHILL.tier, "chill");
});
