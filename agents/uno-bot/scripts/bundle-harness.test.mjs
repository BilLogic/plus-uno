/**
 * Membership and ordering tests for the frontmatter-driven bundler (#159).
 *
 * Deliberately dependency-free and run with plain `node --test`: the thing
 * under test is a build script that must work before anything is installed,
 * and a test that needs a toolchain to prove the prompt is correct is a test
 * that stops running the first time the toolchain breaks.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const bundler = path.join(here, "bundle-harness.mjs");
const harnessTs = path.join(here, "..", "src", "generated", "harness.ts");

const assembled = () => {
  const ts = readFileSync(harnessTs, "utf8");
  return JSON.parse(ts.slice(ts.indexOf("= ") + 2, ts.lastIndexOf(";")));
};

/** Member paths, in bundle order. The first member carries no path comment. */
const memberOrder = (text) => [...text.matchAll(/<!-- ([\w/.-]+\.md) -->/g)].map((m) => m[1]);

const embodimentOf = (rel) => {
  const src = readFileSync(path.join(repoRoot, rel), "utf8");
  return (src.match(/^embodiment:\s*(\S+)/m) || [])[1];
};

/** Run the bundler against a temporarily modified repo, then always restore. */
function withFile(rel, mutate, fn) {
  const abs = path.join(repoRoot, rel);
  const original = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  const backup = mkdtempSync(path.join(tmpdir(), "harness-test-"));
  try {
    if (original !== null) writeFileSync(path.join(backup, "orig"), original);
    mutate(abs, original);
    return fn();
  } finally {
    if (original !== null) writeFileSync(abs, original);
    else if (existsSync(abs)) rmSync(abs);
    rmSync(backup, { recursive: true, force: true });
  }
}

const runBundler = (args = []) => {
  try {
    return { code: 0, out: execFileSync("node", [bundler, ...args], { encoding: "utf8", stderr: "pipe" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` };
  }
};

test("a doc marked `all` is present in the Worker bundle", () => {
  assert.equal(embodimentOf("CONTEXT.md"), "all");
  assert.ok(
    memberOrder(assembled()).includes("CONTEXT.md"),
    "terminology.md declares `all` but is not in the bundle",
  );
});

test("a doc marked `ide` is absent from the Worker bundle", () => {
  for (const rel of ["docs/engineering/coding.md", "docs/engineering/setup.md", "docs/connectors/overview.md"]) {
    assert.equal(embodimentOf(rel), "ide");
    assert.ok(!memberOrder(assembled()).includes(rel), `${rel} declares \`ide\` but reached the Worker bundle`);
  }
});

test("every skill's bot.md is bundled and every SKILL.md is not", () => {
  const members = memberOrder(assembled());
  for (const skill of ["research", "synthesize", "prototype", "publish", "review", "maintain"]) {
    assert.ok(members.includes(`skills/uno-${skill}/bot.md`), `uno-${skill}/bot.md missing from the bundle`);
    assert.ok(!members.includes(`skills/uno-${skill}/SKILL.md`), `uno-${skill}/SKILL.md leaked into the bundle`);
  }
});

test("a skill's method.md precedes its bot.md", () => {
  const members = memberOrder(assembled());
  for (const skill of ["research", "synthesize", "prototype", "publish", "review", "maintain"]) {
    const method = members.indexOf(`skills/uno-${skill}/references/method.md`);
    const bot = members.indexOf(`skills/uno-${skill}/bot.md`);
    assert.ok(method !== -1 && bot !== -1, `uno-${skill} is missing a face`);
    assert.ok(method < bot, `uno-${skill}: method.md must load before bot.md`);
  }
});

test("sections stay in declared order: constitution, persona, skills, then docs", () => {
  const members = memberOrder(assembled());
  // AGENTS.md is member 0 and carries no path comment, so CONTEXT.md — the
  // constitution section's second member — is the first commented one.
  assert.equal(members[0], "CONTEXT.md", "the constitution section must come first");
  assert.equal(members[1], "agents/uno-bot/AGENT.md", "the persona must follow the constitution");

  const lastSkill = members.map((m, i) => (m.startsWith("skills/") ? i : -1)).filter((i) => i >= 0).pop();
  const firstDoc = members.findIndex((m) => m.startsWith("docs/"));
  assert.ok(lastSkill < firstDoc, "a docs/ section member was bundled before the last skill");

  const firstConnector = members.findIndex((m) => m.startsWith("docs/connectors/"));
  const firstEngineering = members.findIndex((m) => m.startsWith("docs/engineering/"));
  assert.ok(firstConnector < firstEngineering, "connectors must precede engineering");
});

test("frontmatter never reaches the prompt", () => {
  const text = assembled();
  assert.ok(!text.includes("\nembodiment:"), "an `embodiment:` line survived into the system prompt");
  assert.ok(!/\n---\nembodiment/.test(text), "a frontmatter block survived into the system prompt");
});

test("a doc under a section root with no embodiment fails the build", () => {
  const rel = "docs/conventions/zz-test-undeclared.md";
  const result = withFile(rel, (abs) => writeFileSync(abs, "# probe\n\nno frontmatter here\n"), () => runBundler());
  assert.equal(result.code, 1, "an undeclared doc must fail the build, not default to unbundled");
  assert.match(result.out, /declare no `embodiment`/);
  assert.match(result.out, /zz-test-undeclared\.md/);
});

test("--check fails on a stale artifact and writes nothing", () => {
  const before = readFileSync(harnessTs, "utf8");
  const result = withFile(
    "agents/uno-bot/src/generated/harness.ts",
    (abs) => writeFileSync(abs, 'export const HARNESS = "stale";\n'),
    () => {
      const r = runBundler(["--check"]);
      return { ...r, after: readFileSync(harnessTs, "utf8") };
    },
  );
  assert.equal(result.code, 1, "--check must fail on a stale artifact");
  assert.equal(result.after, 'export const HARNESS = "stale";\n', "--check must not write");
  assert.equal(readFileSync(harnessTs, "utf8"), before, "the artifact was not restored");
});

test("the bundler names no individual file", () => {
  const src = readFileSync(bundler, "utf8");
  const code = src
    .split("\n")
    .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
    .join("\n");
  assert.ok(!/SKILL_PATHS/.test(code), "SKILL_PATHS must be gone");
  assert.ok(!/NOT_BUNDLED/.test(code), "NOT_BUNDLED must be gone");
  assert.ok(!/["']skills\/uno-\w+/.test(code), "the bundler must not name a skill file");
  assert.ok(!/["']docs\/conventions\/\w+\.md/.test(code), "the bundler must not name a convention file");
});

// ── Char budgets (#161) ──────────────────────────────────────────────────────
//
// Budgets are asserted on the BUNDLED BODY, so these tests pad a file and check
// the bundler refuses. They run `--check` rather than a bare bundle: the budget
// gate sits ahead of the artifact write, so a padded run must fail before it can
// touch `harness.ts` — which is also what these assertions prove.

/** Enough filler to blow a budget, in lines that trip no other guard. */
const padding = (chars) => `\n${"padding padding padding padding\n".repeat(Math.ceil(chars / 32))}`;

test("a persona over its char budget fails the build", () => {
  const rel = "agents/uno-bot/AGENT.md";
  const before = readFileSync(harnessTs, "utf8");
  const result = withFile(rel, (abs, original) => writeFileSync(abs, original + padding(28_000)), () =>
    runBundler(["--check"]),
  );
  assert.equal(result.code, 1, "a persona over budget must fail the build");
  assert.match(result.out, /over its char budget/i);
  assert.match(result.out, /AGENT\.md/);
  assert.match(result.out, /28,000/, "the failure must name the budget");
  assert.match(result.out, /over by [\d,]+/, "the failure must name the overrun");
  assert.equal(readFileSync(harnessTs, "utf8"), before, "a failing budget must not write the artifact");
});

test("a Worker face over its char budget fails the build", () => {
  const rel = "skills/uno-research/bot.md";
  const result = withFile(rel, (abs, original) => writeFileSync(abs, original + padding(7_000)), () =>
    runBundler(["--check"]),
  );
  assert.equal(result.code, 1, "a Worker face over budget must fail the build");
  assert.match(result.out, /uno-research\/bot\.md/);
  assert.match(result.out, /7,000/, "the failure must name the budget");
  assert.match(result.out, /over by [\d,]+/, "the failure must name the overrun");
});

test("an assembled bundle over its char budget fails the build", () => {
  // Padded into a doc that carries no per-file budget of its own, so the bundle
  // budget is what fails — not a file budget standing in for it.
  const rel = "skills/uno-research/references/method.md";
  const result = withFile(rel, (abs, original) => writeFileSync(abs, original + padding(200_000)), () =>
    runBundler(["--check"]),
  );
  assert.equal(result.code, 1, "an oversized bundle must fail the build");
  assert.match(result.out, /assembled bundle/i);
  assert.match(result.out, /over by [\d,]+/, "the failure must name the overrun");
});

test("every budgeted file is under its budget today", () => {
  const result = runBundler(["--check"]);
  assert.equal(result.code, 0, `the committed harness must be within budget:\n${result.out}`);
});
