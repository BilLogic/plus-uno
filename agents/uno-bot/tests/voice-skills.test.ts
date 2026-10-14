// The persona owns the voice; a bot skill owns the steps.
//
// Tone used to leak into the per-skill Slack docs — a "warm one-line lead-in"
// here, a 🔍 critique header there, a `❌ Couldn't …` error format, scripted
// offer lines — and each contradicted the persona somewhere, so there was no
// one place to change how uno-bot sounds. This guard reads every bot skill
// (`agents/uno-bot/skills/*/SKILL.md`) from disk and holds it to the split: the
// shapes a skill hands the model carry no emoji (AGENT.md § Emoji budget), and
// no skill scripts tone or an offer's wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { emojiIn } from "../src/voice/emoji";

// Resolved from the package dir (npm test runs from agents/uno-bot).
const SKILLS = path.resolve(process.cwd(), "skills");

const skills = readdirSync(SKILLS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(SKILLS, d.name, "SKILL.md"));

/** Every fenced block and inline code span: the shapes a skill asks for. */
function shapesIn(text: string): string[] {
  const fenced = [...text.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
  const rest = text.replace(/```[\s\S]*?```/g, "");
  const inline = [...rest.matchAll(/`[^`\n]+`/g)].map((m) => m[0]);
  return [...fenced, ...inline];
}

test("there are bot skills to read", () => {
  assert.ok(skills.length >= 7, `found ${skills.length} bot skills under ${SKILLS}`);
});

test("no bot skill's output shape carries an emoji", () => {
  for (const skill of skills) {
    const shapes = shapesIn(readFileSync(skill, "utf8"));
    const withEmoji = shapes.filter((s) => emojiIn(s).length > 0);
    assert.deepEqual(withEmoji, [], `${path.relative(SKILLS, skill)} asks for an emoji in a shape`);
  }
});

test("no bot skill scripts tone or an offer's wording", () => {
  for (const skill of skills) {
    const text = readFileSync(skill, "utf8");
    const rel = path.relative(SKILLS, skill);
    assert.doesNotMatch(text, /\bwarm/i, `${rel} sets a tone`);
    assert.doesNotMatch(text, /want me to/i, `${rel} scripts an offer`);
  }
});
