import { test } from "node:test";
import assert from "node:assert/strict";
import { routeRequest } from "../src/agent/routing";
import { GEMINI_TIERS, geminiDials, resolveGeminiModel } from "../src/agent/gemini-tiers";

// A tier on the Gemini lane is one named configuration: model PLUS thinking
// level, moving together (ADR-027). These tests go through routeRequest on
// purpose — the ticket's two scenarios are "a short reply to a pending proposal"
// and "think harder", and what they must prove is the LEVEL the turn is sent
// with, not just which model answered.

function dialsFor(userText: string, hasPending: boolean) {
  const { tier } = routeRequest({ userText, hasPending });
  return { tier, ...geminiDials(tier, resolveGeminiModel(tier, {})) };
}

test("a short reply to a pending proposal runs chill at low", () => {
  const d = dialsFor("yes please", true);
  assert.equal(d.tier, "chill");
  assert.equal(d.model, "gemini-3.5-flash-lite");
  assert.equal(d.thinkingLevel, "low");
});

test("'think harder' runs grind at high", () => {
  const d = dialsFor("Think harder about this: what is the difference between Card and Surface?", false);
  assert.equal(d.tier, "grind");
  assert.equal(d.model, "gemini-3.1-pro-preview");
  assert.equal(d.thinkingLevel, "high");
});

test("an ordinary question runs the default tier at medium", () => {
  const d = dialsFor("What is the difference between Card and Surface?", false);
  assert.equal(d.tier, "default");
  assert.equal(d.thinkingLevel, "medium");
});

test("no tier reads a constant level — the three levels differ", () => {
  const levels = Object.values(GEMINI_TIERS).map((t) => t.level);
  assert.equal(new Set(levels).size, 3, `levels: ${levels.join(", ")}`);
});

test("the level belongs to the tier and survives a model fallback", () => {
  // A mid-turn fallback swaps the model, not the tier. The level is the
  // tier's, so it carries onto the backup model when that model takes the dial.
  assert.equal(geminiDials("grind", "gemini-3.7-flash").thinkingLevel, "high");
  assert.equal(geminiDials("chill", "gemini-3.7-flash").thinkingLevel, "low");
  // 2.5-generation models 400 on thinking_level (probed live 2026-07-16), so
  // the dial recomputes to "none sent" there rather than being carried blind.
  assert.equal(geminiDials("grind", "gemini-2.5-pro").thinkingLevel, null);
  assert.deepEqual(geminiDials("grind", "gemini-2.5-pro").builtinSearchTools, []);
});

test("env overrides the model and never the level", () => {
  const model = resolveGeminiModel("grind", { GEMINI_GRIND_MODEL: "gemini-3.9-pro-preview" });
  assert.equal(model, "gemini-3.9-pro-preview");
  assert.equal(geminiDials("grind", model).thinkingLevel, "high");
  assert.equal(resolveGeminiModel("default", { GEMINI_MODEL: "gemini-3.8-flash" }), "gemini-3.8-flash");
  assert.equal(resolveGeminiModel("chill", { GEMINI_CHILL_MODEL: "gemini-3.5-flash-lite" }), "gemini-3.5-flash-lite");
});

test("no tier level is minimal — flash and pro reject it, and a fallback carries the tier's level onto them", () => {
  // Verified 2026-09-04 at ai.google.dev/gemini-api/docs/thinking: flash-lite
  // accepts minimal|low|medium|high; flash and pro accept low|medium|high and
  // error on minimal. A chill turn that fell back from flash-lite to flash
  // would carry "minimal" onto a model that rejects it.
  for (const [tier, cfg] of Object.entries(GEMINI_TIERS)) {
    assert.notEqual(cfg.level, "minimal", `${tier} is minimal`);
  }
});
