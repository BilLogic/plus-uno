#!/usr/bin/env node
//
// generate-uno-skill-surfaces.mjs — publish the six uno skills to the two
// surfaces that can't read `skills/` directly.
//
// WHY THIS EXISTS
// ---------------
// The canonical skills live at `skills/uno-*/SKILL.md`. That is a deliberate
// top-level location: this repo is a starting kit people browse. But it is not
// a discovery path for either IDE:
//
//   Claude Code  → `.claude/skills/<name>/SKILL.md`
//   Cursor       → `.cursor/skills/`, `.agents/skills/`, and the Claude/Codex
//                  directories (so `.claude/skills/` covers Cursor too)
//
// Nor for Slack, whose slash commands are declared in the app manifest.
//
// So one scan of the canonical files emits three artifacts. Every surface is
// generated from the same frontmatter, which is why the descriptions can't
// drift apart:
//
//   1. `.claude/skills/<name>/SKILL.md`  — thin stub, real frontmatter, body
//      points at the canonical file. Makes `/uno-prototype` appear in the slash
//      menu of both IDEs.
//   2. `agents/uno-bot/src/generated/slack-commands.ts` — the command → skill
//      map the Worker's /slack/commands route dispatches on.
//   3. `agents/uno-bot/slack-app-manifest-commands.yaml` — paste block for
//      api.slack.com (app manifest → `features.slash_commands`).
//
// Usage:
//   node scripts/generate-uno-skill-surfaces.mjs           # write
//   node scripts/generate-uno-skill-surfaces.mjs --check    # CI: fail on drift

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { directories, frontmatter } from "./lib/corpus.mjs";
import { byRoot, main } from "./lib/findings.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// The slash-command Request URL Slack posts to. Derived from the OAuth redirect
// already in wrangler.toml rather than written twice: the Worker has exactly one
// public origin, and a manifest pointing at the wrong one fails as
// dispatch_failed with nothing in the Worker logs to explain it.
function workerOrigin(root) {
  const toml = readFileSync(join(root, "agents/uno-bot/wrangler.toml"), "utf8");
  const m = /SLACK_OAUTH_REDIRECT_URI\s*=\s*"(https:\/\/[^/"]+)/.exec(toml);
  if (!m) throw new Error("wrangler.toml: no SLACK_OAUTH_REDIRECT_URI to read the Worker origin from");
  return m[1];
}

// Slack shows one short line in the / menu. The canonical `description` is
// written for a MODEL deciding whether to load the skill — it opens with
// capability prose and runs several sentences, and machine-clipping it to width
// produced mid-word stumps ("…grounds the brief against un…"). So the menu line
// is authored here, once, for a human scanning a dropdown. The guard below
// fails the build if a new skill lands without one, which is the only failure
// mode a derived string was protecting against.
const SLACK_MENU_LINE = {
  "uno-research": "Gather context that doesn't exist yet — evidence sweeps, study guides, discovery",
  "uno-synthesize": "Distill gathered context into findings, takeaways, and — on your go — a PRD",
  "uno-prototype": "Turn a PRD into a design artifact at the fidelity you pick, grounded on the blueprint",
  "uno-review": "Diagnose-only design review: design-system, product-intent, and accessibility lenses",
  "uno-publish": "Share finished-enough work for feedback, or hand it off to development",
  "uno-maintain": "File an intake, run a standing sweep, or capture a lesson into the harness",
};
// Slack rejects a slash-command description over 100 characters.
const SLACK_DESC_MAX = 100;

// Line endings are a checkout artifact, not content: this repo has no
// .gitattributes and core.autocrlf is on by default on Windows, so every
// SKILL.md arrives CRLF there. Splitting on "\n" alone left a trailing \r on
// each line, so `lines[0]` was "---\r" and every run on Windows died with
// "no frontmatter" on the first skill — meaning this drift guard could not run
// at all for anyone on Windows, which is precisely who is most likely to cause
// drift. Read through this everywhere endings could leak in.
const LINES = (text) => text.split(/\r?\n/);
/** Normalise for comparison only; what we WRITE stays "\n" as before. */
const NORM = (text) => text.replace(/\r\n/g, "\n");

/**
 * A SKILL.md's frontmatter, both ways this generator needs it: the parsed
 * fields, and the block's own LINES — because artifact 1 re-emits the
 * frontmatter verbatim, and `argument-hint`, `allowed-tools` and `context:
 * fork` are load-bearing there.
 *
 * Both come from `scripts/lib/corpus.mjs`, which is the repo's one frontmatter
 * reader. The parser deleted from here was its own fence search plus its own
 * minimal YAML — including the bracket refusal that `argument-hint: [a] [b]`
 * earned, now a corpus test. Where a fence closes decides the Worker's char
 * budgets (#238) and now also decides what these three surfaces say, so it is
 * answered once.
 */
function readSkillFrontmatter(path) {
  const { meta, raw } = frontmatter(readFileSync(path, "utf8"));
  if (raw === null) throw new Error(`${path}: no frontmatter, or a block that never closes`);
  return { fields: meta, fmLines: LINES(raw) };
}

function slackDescription(name) {
  const line = SLACK_MENU_LINE[name];
  if (!line) {
    throw new Error(
      `no Slack menu line for "${name}" — add one to SLACK_MENU_LINE in this script. ` +
        `It is the text teammates read in the / dropdown, so it is written, not derived.`,
    );
  }
  if (line.length > SLACK_DESC_MAX) {
    throw new Error(`Slack menu line for "${name}" is ${line.length} chars; Slack's limit is ${SLACK_DESC_MAX}`);
  }
  return line;
}

// The canonical skills, and the origin the manifest points at. Read through
// `byRoot` rather than at module scope: the harness runner IMPORTS this module
// to call `run` below, and a scan that ran on import would read wrangler.toml
// and six SKILL.mds inside the runner's own process — and throw there, not
// here, when one of them is malformed (#509).
const inputs = byRoot((root) => {
  const skills = directories("skills", { root, recursive: false })
    .map((dir) => dir.slice("skills/".length))
    .filter((name) => name.startsWith("uno-"))
    .filter((name) => existsSync(join(root, "skills", name, "SKILL.md")))
    .map((name) => {
      const canonical = `skills/${name}/SKILL.md`;
      const { fields, fmLines } = readSkillFrontmatter(join(root, canonical));
      if (fields.name !== name) {
        throw new Error(`${canonical}: frontmatter name "${fields.name}" != directory "${name}"`);
      }
      if (!fields.description) throw new Error(`${canonical}: no description`);
      return { name, canonical, fmLines, fields };
    });

  if (skills.length === 0) throw new Error("no skills/uno-* found — refusing to emit empty surfaces");

  return { skills, requestUrl: `${workerOrigin(root)}/slack/commands` };
});

// ── artifact 1: IDE stubs ────────────────────────────────────────────────────
//
// The stub carries the canonical frontmatter VERBATIM (argument-hint,
// allowed-tools, context: fork are all load-bearing) minus `user-invocable`,
// which defaults to true — declaring it did nothing, and leaving it next to a
// file whose whole job is invocability invites the reader to think it's the
// mechanism.
function stubFor(skill) {
  const fm = skill.fmLines.filter((line) => !/^user-invocable:/.test(line));
  return [
    "---",
    ...fm,
    "---",
    "",
    `<!-- GENERATED by scripts/generate-uno-skill-surfaces.mjs — do not edit.`,
    `     Source of truth: ${skill.canonical}`,
    `     Regenerate: npm run generate:skill-surfaces -->`,
    "",
    `Read \`${skill.canonical}\` and follow it. That file is the skill — its`,
    `routing table, its constraints, and the reference docs it loads on demand.`,
    "",
    `This stub exists only because \`skills/\` is not a discovery path for the`,
    `IDEs: Claude Code reads \`.claude/skills/\`, and Cursor reads that directory`,
    `too. Without it \`/${skill.name}\` never appears in the slash menu.`,
    "",
  ].join("\n");
}

// ── artifact 2: the Worker's command map ─────────────────────────────────────
function commandsModule(skills) {
  const rows = skills
    .map(
      (s) =>
        `  "/${s.name}": {\n` +
        `    skill: ${JSON.stringify(s.name)},\n` +
        `    usageHint: ${JSON.stringify(s.fields["argument-hint"] ?? "")},\n` +
        `  },`,
    )
    .join("\n");
  return [
    "// GENERATED by scripts/generate-uno-skill-surfaces.mjs — do not edit.",
    "// Source of truth: skills/uno-*/SKILL.md frontmatter.",
    "// Regenerate: npm run generate:skill-surfaces",
    "//",
    "// The map the /slack/commands route dispatches on. Keys match the commands",
    "// declared in slack-app-manifest-commands.yaml — if they drift, Slack posts",
    "// to a command the Worker doesn't know and the caller gets the unknown-command",
    "// reply, so both artifacts come from the same scan.",
    "",
    "export interface SlashCommandTarget {",
    "  /** Skill name, as the harness knows it. */",
    "  skill: string;",
    "  /** argument-hint from the canonical SKILL.md; shown in the usage reply. */",
    "  usageHint: string;",
    "}",
    "",
    "export const SLASH_COMMANDS: Record<string, SlashCommandTarget> = {",
    rows,
    "};",
    "",
  ].join("\n");
}

// ── artifact 3: the manifest paste block ─────────────────────────────────────
function manifestYaml(skills, requestUrl) {
  const rows = skills
    .map((s) => {
      const hint = s.fields["argument-hint"] ?? "";
      return [
        `  - command: /${s.name}`,
        `    url: ${requestUrl}`,
        `    description: ${JSON.stringify(slackDescription(s.name))}`,
        ...(hint ? [`    usage_hint: ${JSON.stringify(hint)}`] : []),
        `    should_escape: false`,
      ].join("\n");
    })
    .join("\n");
  return [
    "# THIS IS A FRAGMENT, NOT A MANIFEST. Pasting the whole file into Slack's",
    "# App Manifest editor fails with:  Invalid additional property: slash_commands",
    "# — because `slash_commands` belongs UNDER `features:`, and at the top level",
    "# there is no such key. Paste slack-app-manifest.yaml instead; it already",
    "# carries these commands in the right place.",
    "#",
    "# GENERATED by scripts/generate-uno-skill-surfaces.mjs — do not edit.",
    "# Source of truth: skills/uno-*/SKILL.md frontmatter.",
    "# Regenerate: npm run generate:skill-surfaces",
    "#",
    "# What it is FOR: the rows to merge under `features:` when a uno-* skill is",
    "# added or renamed, so the manifest and the skills cannot drift.",
    "# Declaring a slash command also requires the `commands` bot scope; adding",
    "# it prompts a workspace reinstall.",
    "#",
    "# The Worker must be deployed with the /slack/commands route BEFORE these",
    "# land, or every invocation returns Slack's dispatch_failed to the caller.",
    "slash_commands:",
    rows,
    "",
  ].join("\n");
}

/**
 * The would-be bytes of all three surfaces, rendered and not written.
 *
 * Same split as `scripts/generate-check-scripts.mjs`: this renders, `run`
 * compares, and only the CLI entry writes. A `--check` that regenerated its own
 * targets would answer "are the committed files stale?" with the bytes it had
 * just written.
 *
 * @returns {{path: string, content: string}[]}
 */
export function artifacts({ repoRoot = ROOT } = {}) {
  const { skills, requestUrl } = inputs(repoRoot);
  return [
    ...skills.map((s) => ({ path: `.claude/skills/${s.name}/SKILL.md`, content: stubFor(s) })),
    { path: "agents/uno-bot/src/generated/slack-commands.ts", content: commandsModule(skills) },
    { path: "agents/uno-bot/slack-app-manifest-commands.yaml", content: manifestYaml(skills, requestUrl) },
  ];
}

/**
 * One artifact against what is committed.
 *
 * Compare on normalised endings. The generated `content` is always "\n",
 * while `current` comes off a working copy that may be CRLF — without this
 * every artifact reads as drifted on Windows even when byte-identical in the
 * repository. Nothing is lost: endings are normalised on commit, so a
 * difference that survives only in the working copy is not drift anyone can
 * act on. (A missing file leaves `current` null, which falls through to drift.)
 */
function matches(abs, content) {
  const current = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  return current !== null && NORM(current) === NORM(content);
}

/**
 * The drift check. Reports and never writes.
 *
 * A malformed source — a name that disagrees with its directory, a missing
 * description, a wrangler.toml with no redirect URI — comes back as a finding
 * rather than a thrown stack, because the runner calls this in its own process
 * and a throw there says nothing about which surface is wrong.
 *
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = ROOT } = {}) {
  let rendered;
  try {
    rendered = artifacts({ repoRoot });
  } catch (error) {
    return [{ message: error.message }];
  }
  return rendered
    .filter(({ path, content }) => !matches(join(repoRoot, path), content))
    .map(({ path }) => ({ file: path, message: "is stale — run: npm run generate:skill-surfaces" }));
}

/** The green line, which carries how many surfaces were compared. */
export function summary({ repoRoot = ROOT } = {}) {
  return `${artifacts({ repoRoot }).length} skill surfaces match their sources`;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (process.argv.includes("--check")) {
    main(import.meta.url, "check:skill-surfaces", { run, summary });
  } else {
    // The write path, unchanged: every surface whose bytes already match is
    // left alone, so a run that changed nothing says so.
    const rendered = artifacts();
    for (const { path, content } of rendered) {
      const abs = join(ROOT, path);
      if (matches(abs, content)) continue;
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
      console.log(`[write] ${path}`);
    }
    console.log(`[ok] ${inputs(ROOT).skills.length} skills → ${rendered.length} artifacts`);
  }
}
