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
const companionMd = path.join(here, "..", "harness-bundle.md");
const referencesTs = path.join(here, "..", "src", "generated", "references.ts");

/** The baked reference map: name → text, the second output of the same assembly (#423). */
const references = () => {
  const ts = readFileSync(referencesTs, "utf8");
  return JSON.parse(ts.slice(ts.indexOf("= ") + 2, ts.lastIndexOf(";")));
};

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

test("a skill's method.md precedes its bot.md, or is disclosed behind read_reference", () => {
  // Two deliveries, one rule per skill (#423): a method that ships in the prompt
  // loads before its face, because it is meaningless read second; a method
  // that declares `disclosure: reference` leaves the prompt entirely and is
  // reachable only through the baked map, under the skill's own name.
  const members = memberOrder(assembled());
  const map = references();
  for (const skill of ["research", "synthesize", "prototype", "publish", "review", "maintain"]) {
    const method = members.indexOf(`skills/uno-${skill}/references/method.md`);
    const bot = members.indexOf(`skills/uno-${skill}/bot.md`);
    assert.ok(bot !== -1, `uno-${skill} is missing its Worker face`);
    if (`uno-${skill}/method` in map) {
      assert.equal(method, -1, `uno-${skill}: a disclosed method must be absent from the prompt`);
    } else {
      assert.ok(method !== -1, `uno-${skill} is missing a method — neither bundled nor disclosed`);
      assert.ok(method < bot, `uno-${skill}: method.md must load before bot.md`);
    }
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

// ── The floor (#418) ─────────────────────────────────────────────────────────
//
// The ceiling stops a bundle from growing past what the model can attend to.
// The floor stops it from SHRINKING past what the Gemini lane can cache: under
// Vertex's explicit-cache minimum the prompt silently ships inline at full
// price. Three connector docs emptied to their frontmatter take the committed
// bundle from ~167k to under the provisional 131k floor — three, not one,
// because no single member is large enough, and because a floor that one
// missing doc could trip would be a ceiling in disguise.

/** A doc reduced to its frontmatter: still a member (embodiment intact), zero body. */
const frontmatterOnly = (abs, original) => {
  const end = original.indexOf("\n---", 4);
  writeFileSync(abs, original.slice(0, end + 4) + "\n");
};

test("an assembled bundle under its char floor fails the build", () => {
  const before = readFileSync(harnessTs, "utf8");
  const result = withFile("docs/connectors/notion.md", frontmatterOnly, () =>
    withFile("docs/connectors/slack.md", frontmatterOnly, () =>
      withFile("docs/connectors/supabase/blueprint-navigation.md", frontmatterOnly, () => runBundler(["--check"])),
    ),
  );
  assert.equal(result.code, 1, "a bundle under the floor must fail the build");
  assert.match(result.out, /under its char floor/i);
  assert.match(result.out, /floor of 131,072/, "the failure must name the floor");
  assert.match(result.out, /margin of 4,000/, "the failure must name the margin");
  assert.match(result.out, /short by [\d,]+/, "the failure must name the shortfall");
  assert.equal(readFileSync(harnessTs, "utf8"), before, "a failing floor must not write the artifact");
});

test("the committed bundle is above its floor today", () => {
  const len = assembled().length;
  assert.ok(len >= 131_072 + 4_000, `the committed harness (${len} chars) must clear the floor plus margin`);
});

test("the manifest states the floor beside the budget", () => {
  const md = readFileSync(companionMd, "utf8");
  assert.match(md, /a floor of 131,072 plus a 4,000 margin \([\d,]+ above it\)/);
});

test("every budgeted file is under its budget today", () => {
  const result = runBundler(["--check"]);
  assert.equal(result.code, 0, `the committed harness must be within budget:\n${result.out}`);
});

// ── The readable companion (#160) ────────────────────────────────────────────
//
// harness.ts can only hold the prompt as one escaped string, so the companion is
// the half a reviewer can actually read. These tests hold it to the same bar as
// the .ts: same assembly, and the same staleness guard — a companion that could
// rot while the guard stayed green would be worse than no companion, because it
// would be quoted.

test("the companion carries the assembled prompt verbatim", () => {
  const md = readFileSync(companionMd, "utf8");
  assert.ok(md.includes(assembled()), "the companion must contain the exact string baked into harness.ts");
});

test("the companion is headed so nobody hand-edits it", () => {
  const md = readFileSync(companionMd, "utf8");
  assert.match(md, /GENERATED by scripts\/bundle-harness\.mjs/, "the companion must announce that it is generated");
  assert.match(md, /do not edit/i, "the companion must say not to edit it");
  assert.match(md, /npm run bundle:harness/, "the companion must name the command that regenerates it");
});

test("the manifest lists every member in load order, ending at the assembled length", () => {
  const md = readFileSync(companionMd, "utf8");
  const manifest = md.slice(md.indexOf("## Manifest"), md.indexOf("## The assembled prompt"));
  const rows = [...manifest.matchAll(/^\| (\d+) \| \S+ \| \[`([\w/.-]+\.md)`\]\([^)]+\) \|(.*)\|$/gm)];

  const order = ["AGENTS.md", ...memberOrder(assembled())];
  assert.equal(rows.length, order.length, "the manifest must carry one row per bundled file");
  rows.forEach((row, i) => {
    assert.equal(Number(row[1]), i + 1, "manifest rows must be numbered in load order");
    assert.equal(row[2], order[i], `manifest row ${i + 1} must name the file loaded in that position`);
  });

  // The running total is the assembled prompt's length through that row, so the
  // last one is the whole prompt. That is what ties the manifest to the text
  // below it: a manifest whose arithmetic did not land on the real total would
  // be a table of plausible numbers.
  const cells = rows[rows.length - 1][3].split("|").map((c) => c.trim());
  assert.equal(
    Number(cells[1].replace(/,/g, "")),
    assembled().length,
    "the last running total must equal the assembled prompt's length",
  );
});

test("--check fails on a stale companion, names it, and writes nothing", () => {
  const before = readFileSync(companionMd, "utf8");
  const result = withFile(
    "agents/uno-bot/harness-bundle.md",
    (abs, original) => writeFileSync(abs, `${original}\nhand-edited\n`),
    () => {
      const r = runBundler(["--check"]);
      return { ...r, after: readFileSync(companionMd, "utf8") };
    },
  );
  assert.equal(result.code, 1, "--check must fail on a stale companion");
  assert.match(result.out, /STALE/);
  assert.match(result.out, /harness-bundle\.md/, "the failure must name the companion");
  assert.match(result.after, /hand-edited\n$/, "--check must not write the companion");
  assert.equal(readFileSync(companionMd, "utf8"), before, "the companion was not restored");
});

test("a bundled doc changed without regenerating fails and names the companion", () => {
  const result = withFile(
    "docs/connectors/figma.md",
    (abs, original) => writeFileSync(abs, `${original}\nA probe line.\n`),
    () => runBundler(["--check"]),
  );
  assert.equal(result.code, 1, "an edited bundled doc must fail --check");
  assert.match(result.out, /harness-bundle\.md/, "the companion must be covered by the same guard as harness.ts");
  assert.match(result.out, /src\/generated\/harness\.ts/, "harness.ts must still be covered too");
});

// ── Disclosure (#423) ────────────────────────────────────────────────────────
//
// A doc declares `disclosure: reference` and the bundler routes it into a
// second artifact — the reference map the Worker's `read_reference` tool reads
// — instead of the prompt. Membership stays a property of the document; the
// bundler gains one more place to put it. These hold the map to the same bar
// as the prompt: same assembly, same staleness guard, listed in the manifest.

test("uno-maintain's method is disclosed: absent from the prompt, present in the map by the skill's name", () => {
  const src = readFileSync(path.join(repoRoot, "skills/uno-maintain/references/method.md"), "utf8");
  assert.match(src, /^disclosure:\s*reference$/m, "method.md must declare its delivery");
  assert.equal(embodimentOf("skills/uno-maintain/references/method.md"), "all", "the IDE still loads it from disk");
  assert.ok(!memberOrder(assembled()).includes("skills/uno-maintain/references/method.md"));
  const map = references();
  assert.ok("uno-maintain/method" in map, `map holds ${Object.keys(map).join(", ")}`);
  assert.ok(map["uno-maintain/method"].startsWith("<!-- Shared core"), "the map carries the body, frontmatter stripped");
  assert.ok(map["uno-maintain/method"].includes("## 4 · Tier classification"), "the map carries the whole method");
});

test("the manifest lists disclosed references in their own table with chars", () => {
  const md = readFileSync(companionMd, "utf8");
  const section = md.slice(md.indexOf("## Disclosed references"), md.indexOf("## The assembled prompt"));
  assert.ok(section.length > 0, "the manifest must carry a disclosed-references section");
  assert.match(section, /^\| `uno-maintain\/method` \| \[`skills\/uno-maintain\/references\/method\.md`\]\([^)]+\) \| [\d,]+ \|$/m);
});

test("the companion carries each disclosed reference verbatim, after the prompt", () => {
  // The names sweep (tests/harness-blueprint-names.test.ts) reads the companion
  // from the prompt marker down; a disclosed doc is prose the bot reads too, so
  // it rides there rather than escaping the sweep by leaving the prompt.
  const md = readFileSync(companionMd, "utf8");
  const tail = md.slice(md.indexOf("## The assembled prompt"));
  for (const [name, text] of Object.entries(references())) {
    assert.ok(tail.includes(`<!-- reference: ${name} -->`), `the companion must mark ${name}`);
    assert.ok(tail.includes(text), `the companion must carry ${name} verbatim`);
  }
});

test("the census names the disclosed count beside the bundled and ide-only ones", () => {
  const result = runBundler(["--check"]);
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /embodiment census: [\d,]+ declared doc\(s\) under the section roots — [\d,]+ bundled, 1 disclosed, [\d,]+ ide-only/);
  assert.match(result.out, /--check OK \([\d,]+ chars from [\d,]+ files; 1 reference\(s\)/);
});

test("--check fails on a stale reference map, names it, and writes nothing", () => {
  const before = readFileSync(referencesTs, "utf8");
  const result = withFile(
    "agents/uno-bot/src/generated/references.ts",
    (abs) => writeFileSync(abs, "export const REFERENCES = {};\n"),
    () => {
      const r = runBundler(["--check"]);
      return { ...r, after: readFileSync(referencesTs, "utf8") };
    },
  );
  assert.equal(result.code, 1, "--check must fail on a stale reference map");
  assert.match(result.out, /STALE/);
  assert.match(result.out, /src\/generated\/references\.ts/, "the failure must name the map");
  assert.equal(result.after, "export const REFERENCES = {};\n", "--check must not write the map");
  assert.equal(readFileSync(referencesTs, "utf8"), before, "the map was not restored");
});

test("a disclosed doc edited without regenerating fails --check and names the map", () => {
  const result = withFile(
    "skills/uno-maintain/references/method.md",
    (abs, original) => writeFileSync(abs, `${original}\nA probe line.\n`),
    () => runBundler(["--check"]),
  );
  assert.equal(result.code, 1, "an edited disclosed doc must fail --check");
  assert.match(result.out, /src\/generated\/references\.ts/, "the map must be covered by the staleness guard");
});

test("disclosure on a doc the Worker never reads fails the build", () => {
  // `disclosure` names a WORKER delivery. On an `embodiment: ide` doc it names
  // a delivery for a reader that does not exist, which is a doc nobody loads.
  const rel = "docs/conventions/zz-test-disclosed-ide.md";
  const result = withFile(
    rel,
    (abs) => writeFileSync(abs, "---\nembodiment: ide\ndisclosure: reference\n---\n\n# probe\n"),
    () => runBundler(["--check"]),
  );
  assert.equal(result.code, 1);
  assert.match(result.out, /zz-test-disclosed-ide\.md/);
  assert.match(result.out, /disclosure/);
});

test("an unknown disclosure value fails the build", () => {
  const rel = "docs/conventions/zz-test-disclosed-typo.md";
  const result = withFile(
    rel,
    (abs) => writeFileSync(abs, "---\nembodiment: uno-bot\ndisclosure: referance\n---\n\n# probe\n"),
    () => runBundler(["--check"]),
  );
  assert.equal(result.code, 1);
  assert.match(result.out, /zz-test-disclosed-typo\.md/);
  assert.match(result.out, /disclosure/);
});

test("a disclosed doc does not count toward the assembled prompt, and the prompt stays above the floor", () => {
  const map = references();
  const len = assembled().length;
  const disclosedChars = Object.values(map).reduce((n, t) => n + t.length, 0);
  assert.ok(disclosedChars > 0);
  assert.ok(!assembled().includes(map["uno-maintain/method"]));
  assert.ok(len >= 131_072 + 4_000, `the prompt (${len}) must stay above the floor after the cut`);
});
