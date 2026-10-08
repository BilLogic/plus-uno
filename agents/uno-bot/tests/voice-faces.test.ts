// The persona owns the voice; a skill's Worker face owns the steps.
//
// Tone used to leak into the faces — a "warm one-line lead-in" here, a 🔍
// critique header there, a `❌ Couldn't …` error format, scripted offer lines —
// and each contradicted the persona somewhere, so there was no one place to
// change how uno-bot sounds. This guard reads every `skills/*/bot.md` from disk
// and holds it to the split: the shapes a face hands the model carry no emoji
// (AGENT.md § Emoji budget), and no face scripts tone or an offer's wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { emojiIn } from "../src/voice/emoji";

// Resolved from the package dir (npm test runs from agents/uno-bot).
const SKILLS = path.resolve(process.cwd(), "../../skills");

const faces = readdirSync(SKILLS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(SKILLS, d.name, "bot.md"))
  .filter((p) => {
    try {
      readFileSync(p);
      return true;
    } catch {
      return false;
    }
  });

/** Every fenced block and inline code span: the shapes a face asks for. */
function shapesIn(text: string): string[] {
  const fenced = [...text.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
  const rest = text.replace(/```[\s\S]*?```/g, "");
  const inline = [...rest.matchAll(/`[^`\n]+`/g)].map((m) => m[0]);
  return [...fenced, ...inline];
}

test("there are faces to read", () => {
  assert.ok(faces.length >= 6, `found ${faces.length} faces under ${SKILLS}`);
});

test("no face's output shape carries an emoji", () => {
  for (const face of faces) {
    const shapes = shapesIn(readFileSync(face, "utf8"));
    const withEmoji = shapes.filter((s) => emojiIn(s).length > 0);
    assert.deepEqual(withEmoji, [], `${path.relative(SKILLS, face)} asks for an emoji in a shape`);
  }
});

test("no face scripts tone or an offer's wording", () => {
  for (const face of faces) {
    const text = readFileSync(face, "utf8");
    const rel = path.relative(SKILLS, face);
    assert.doesNotMatch(text, /\bwarm/i, `${rel} sets a tone`);
    assert.doesNotMatch(text, /want me to/i, `${rel} scripts an offer`);
  }
});
