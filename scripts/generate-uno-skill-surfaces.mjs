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

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// The slash-command Request URL Slack posts to. Derived from the OAuth redirect
// already in wrangler.toml rather than written twice: the Worker has exactly one
// public origin, and a manifest pointing at the wrong one fails as
// dispatch_failed with nothing in the Worker logs to explain it.
function workerOrigin() {
  const toml = readFileSync(join(ROOT, "agents/uno-bot/wrangler.toml"), "utf8");
  const m = /SLACK_OAUTH_REDIRECT_URI\s*=\s*"(https:\/\/[^/"]+)/.exec(toml);
  if (!m) throw new Error("wrangler.toml: no SLACK_OAUTH_REDIRECT_URI to read the Worker origin from");
  return m[1];
}
const REQUEST_URL = `${workerOrigin()}/slack/commands`;

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

/** Split a SKILL.md into [frontmatterLines, bodyStartIndex]. */
function readFrontmatter(path) {
  const lines = LINES(readFileSync(path, "utf8"));
  if (lines[0] !== "---") throw new Error(`${path}: no frontmatter`);
  const end = lines.indexOf("---", 1);
  if (end === -1) throw new Error(`${path}: unterminated frontmatter`);
  return lines.slice(1, end);
}

/**
 * Minimal YAML read for the shapes this repo actually uses: `key: value` and
 * `key: >` folded blocks. Not a general parser — a real one would be a
 * dependency for four fields, and an unsupported shape throws rather than
 * silently returning undefined.
 */
function parseFields(fmLines) {
  const out = {};
  for (let i = 0; i < fmLines.length; i++) {
    const m = /^([a-zA-Z][\w-]*):\s*(.*)$/.exec(fmLines[i]);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (rawValue === ">" || rawValue === "|") {
      const folded = [];
      while (i + 1 < fmLines.length && /^\s+\S/.test(fmLines[i + 1])) {
        folded.push(fmLines[++i].trim());
      }
      out[key] = folded.join(" ");
    } else {
      out[key] = unquote(key, rawValue.trim());
    }
  }
  return out;
}

/**
 * Strip surrounding quotes, and refuse the shapes YAML would silently reinterpret.
 *
 * `argument-hint: [prd-required] [fidelity]` was invalid YAML for months — `[…]`
 * opens a flow sequence, so two of them on one line is a parse error that takes
 * the WHOLE frontmatter down with it. Nothing noticed, because nothing loaded
 * these as skills until `.claude/skills/` existed; the skill then registered
 * with its description missing. The single-bracket hints were no better, just
 * quieter: they parsed as a one-item list where a string was meant.
 */
function unquote(key, raw) {
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  if (/^[[{]/.test(raw)) {
    throw new Error(
      `frontmatter \`${key}: ${raw}\` starts with ${raw[0]} — YAML reads that as a ` +
        `sequence/mapping, not text. Quote the value.`,
    );
  }
  return raw;
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

const skills = readdirSync(join(ROOT, "skills"))
  .filter((name) => name.startsWith("uno-"))
  .filter((name) => existsSync(join(ROOT, "skills", name, "SKILL.md")))
  .sort()
  .map((name) => {
    const canonical = `skills/${name}/SKILL.md`;
    const fmLines = readFrontmatter(join(ROOT, canonical));
    const fields = parseFields(fmLines);
    if (fields.name !== name) {
      throw new Error(`${canonical}: frontmatter name "${fields.name}" != directory "${name}"`);
    }
    if (!fields.description) throw new Error(`${canonical}: no description`);
    return { name, canonical, fmLines, fields };
  });

if (skills.length === 0) throw new Error("no skills/uno-* found — refusing to emit empty surfaces");

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
function commandsModule() {
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
function manifestYaml() {
  const rows = skills
    .map((s) => {
      const hint = s.fields["argument-hint"] ?? "";
      return [
        `  - command: /${s.name}`,
        `    url: ${REQUEST_URL}`,
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

const artifacts = [
  ...skills.map((s) => ({ path: `.claude/skills/${s.name}/SKILL.md`, content: stubFor(s) })),
  { path: "agents/uno-bot/src/generated/slack-commands.ts", content: commandsModule() },
  { path: "agents/uno-bot/slack-app-manifest-commands.yaml", content: manifestYaml() },
];

let drift = 0;
for (const { path, content } of artifacts) {
  const abs = join(ROOT, path);
  const current = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  // Compare on normalised endings. The generated `content` is always "\n",
  // while `current` comes off a working copy that may be CRLF — without this
  // every artifact reads as drifted on Windows even when byte-identical in git.
  // Nothing is lost: git normalises endings on commit, so a difference that
  // survives only in the working copy is not drift anyone can act on.
  // (A missing file leaves `current` null, which falls through to drift.)
  if (current !== null && NORM(current) === NORM(content)) continue;
  if (CHECK) {
    console.error(`[drift] ${path} is stale — run: npm run generate:skill-surfaces`);
    drift++;
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log(`[write] ${path}`);
}

if (CHECK) {
  if (drift > 0) {
    console.error(`[fail] ${drift} generated skill surface(s) out of date`);
    process.exit(1);
  }
  console.log(`[ok] ${artifacts.length} skill surfaces match their sources`);
} else {
  console.log(`[ok] ${skills.length} skills → ${artifacts.length} artifacts`);
}
