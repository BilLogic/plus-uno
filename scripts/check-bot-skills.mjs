#!/usr/bin/env node
//
// check:bot-skills — every bot skill keeps the authoring rules a check can see.
//
// A bot skill is a doc under the bundler's `bot-skills` section: its
// `description` ships in the prompt as the skill's pointer line, and its body is
// read by name through `read_reference`. Which docs those are comes from the
// bundler's manifest, in-process (`scripts/lib/bundled-set.mjs`), so this check
// keeps no folder list of its own. For each one it holds:
//
//   the description — present, one line, and within `BUDGETS.botSkillDescription`,
//   because it is the always-loaded half of the skill;
//
//   the tools it names — every backticked snake_case name is a tool in
//   `agents/uno-bot/tool-definitions.json`, so a renamed or imagined tool fails
//   here instead of in a turn;
//
//   the Exit section — a `## Exit` heading whose items each open with one of the
//   three exits: answer (the reply is the deliverable), file (a ✅ card writes or
//   sends), hand off (a ready-to-paste IDE prompt).
//
// THE RETIRED-FACE GUARD is ready and not yet enforced: `retiredFaceHits()`
// finds the vocabulary of the uno skills' Worker faces in live files (plans and
// the archive excluded), and `--retired-faces` prints them. It joins `run()`
// when the faces are deleted; until then every live mention of them is true.
//
// Usage:
//   npm run check:bot-skills
//   node scripts/check-bot-skills.mjs --retired-faces

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents, frontmatter } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { tryHarnessManifest } from './lib/bundled-set.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The bundler section whose docs are bot skills. */
export const SECTION = 'bot-skills';

/** The tool table's schema file, which names every tool the Worker has. */
const TOOL_TABLE = 'agents/uno-bot/tool-definitions.json';

/** The three exits, each the opening word(s) of an Exit item. */
export const EXITS = ['answer', 'file', 'hand off'];

/** Joins `run()` when the uno skills' Worker faces are deleted. */
const ENFORCE_RETIRED_FACES = false;

/** The vocabulary of the retired faces. */
const RETIRED_FACE = /\bbot\.md\b|\bWorker faces?\b/i;

/** Live-file roots the guard skips: history, kept as it was written. */
const HISTORY = ['docs/plans/', 'docs/knowledge/archive/'];

/** This check names the vocabulary it guards, so it skips itself. */
const SELF = ['scripts/check-bot-skills.mjs', 'scripts/check-bot-skills.test.mjs'];

export const REMEDY =
  '  A bot skill names tools exactly as the tool table does, ends in one `## Exit` section\n' +
  `  whose items each open with ${EXITS.join(' / ')}, and carries a one-line description\n` +
  '  within `BUDGETS.botSkillDescription` (agents/uno-bot/scripts/bundle-harness.mjs).';

/** A backticked snake_case name: the shape every tool name has. */
const NAMED_TOOL = /`([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`/g;
/** A list item. Group 1 its text. */
const ITEM = /^\s*[-*]\s+(.*)$/;

/** The Exit section's lines, or null when the body has none. */
function exitSection(body) {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => /^##+\s+Exit\b/i.test(l));
  if (start === -1) return null;
  const level = lines[start].match(/^#+/)[0].length;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => {
    const h = l.match(/^(#+)\s/);
    return h && h[1].length <= level;
  });
  return end === -1 ? rest : rest.slice(0, end);
}

/** The exit an item opens with, or null. */
function exitOf(item) {
  const lead = item.replace(/^[*_`]+/, '').toLowerCase();
  return EXITS.find((e) => lead.startsWith(e) && !/[a-z]/.test(lead.charAt(e.length))) ?? null;
}

/**
 * Every finding over the bot skills the manifest names. Pure apart from reading them.
 *
 * @param {{repoRoot: string, manifest: {budgets: Record<string, number>, members: {path: string, section: string, delivery: string}[]}}} ctx
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function compare({ repoRoot, manifest }) {
  const skills = manifest.members.filter((m) => m.section === SECTION && m.delivery !== 'ide-only');
  if (!skills.length) return [];
  const tools = new Set(JSON.parse(fs.readFileSync(path.join(repoRoot, TOOL_TABLE), 'utf8')).map((t) => t.name));
  const limit = manifest.budgets.botSkillDescription;
  const findings = [];
  for (const { path: rel } of skills) {
    const { meta, body } = frontmatter(fs.readFileSync(path.join(repoRoot, rel), 'utf8').replace(/\r\n/g, '\n'));
    const say = (message) => findings.push({ file: rel, severity: 'error', message });

    const description = typeof meta.description === 'string' ? meta.description.trim() : '';
    if (!description) say('carries no `description`; it is the pointer line that makes the skill reachable');
    else if (description.includes('\n')) say('has a description over more than one line; the pointer is one line');
    else if (description.length > limit) {
      say(`has a ${description.length}-char description; \`BUDGETS.botSkillDescription\` holds it to ${limit}`);
    }

    for (const m of body.matchAll(NAMED_TOOL)) {
      if (!tools.has(m[1])) say(`names \`${m[1]}\`, which is not a tool in ${TOOL_TABLE}`);
    }

    const exit = exitSection(body);
    if (!exit) {
      say('has no `## Exit` section; every bot skill ends in answer, file or hand off');
      continue;
    }
    const items = exit.map((l) => l.match(ITEM)?.[1]).filter(Boolean);
    if (!items.length) say(`has an Exit section with no items; list each exit as ${EXITS.join(' / ')}`);
    for (const item of items) {
      if (!exitOf(item)) say(`has an Exit item "${item}"; each opens with ${EXITS.join(' / ')}`);
    }
  }
  return findings;
}

/**
 * Every live line still using the retired faces' vocabulary.
 *
 * @param {{repoRoot?: string}} [ctx]
 * @returns {{file: string, line: number, text: string}[]}
 */
export function retiredFaceHits({ repoRoot = REPO_ROOT } = {}) {
  const hits = [];
  for (const rel of documents('', { root: repoRoot, ext: ['.md', '.mjs', '.js', '.ts'] })) {
    if (HISTORY.some((h) => rel.startsWith(h)) || SELF.includes(rel)) continue;
    fs.readFileSync(path.join(repoRoot, rel), 'utf8')
      .split('\n')
      .forEach((text, i) => {
        if (RETIRED_FACE.test(text)) hits.push({ file: rel, line: i + 1, text: text.trim().slice(0, 160) });
      });
  }
  return hits;
}

/** The manifest the caller gave, or the bundler's, or the report of why there is none. */
function manifestFor(manifest, repoRoot) {
  if (manifest) return { manifest };
  return tryHarnessManifest({ tag: 'bot-skills', notThis: 'the bot skills', repoRoot });
}

/**
 * @param {{repoRoot?: string, manifest?: object}} [ctx]
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT, manifest } = {}) {
  const asked = manifestFor(manifest, repoRoot);
  if (asked.error) return [{ message: asked.error, severity: 'error' }];
  const findings = compare({ repoRoot, manifest: asked.manifest });
  if (ENFORCE_RETIRED_FACES) {
    for (const { file, line, text } of retiredFaceHits({ repoRoot })) {
      findings.push({ file, line, severity: 'error', message: `names a retired Worker face: ${text}` });
    }
  }
  return findings;
}

/** The green line: how many bot skills were held to the rules. */
export function summary({ repoRoot = REPO_ROOT, manifest } = {}) {
  const asked = manifestFor(manifest, repoRoot);
  if (asked.error) return 'the manifest could not be read';
  const n = asked.manifest.members.filter((m) => m.section === SECTION && m.delivery !== 'ide-only').length;
  return `${n} bot skill(s) name real tools, end in ${EXITS.join(' / ')}, and carry a one-line description.`;
}

/** Print the retired-face hits, for the run that decides when to enforce them. */
function printRetiredFaces() {
  const hits = retiredFaceHits();
  for (const { file, line, text } of hits) console.log(`${file}:${line}  ${text}`);
  console.log(`[bot-skills] ${hits.length} live line(s) name a retired Worker face (not yet enforced).`);
}

// Imported by the harness runner, so it must do nothing on import.
main(import.meta.url, 'check:bot-skills', {
  run,
  summary,
  remedy: REMEDY,
  flags: { '--retired-faces': printRetiredFaces },
});
