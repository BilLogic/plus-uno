#!/usr/bin/env node
/**
 * Pointer sweep over the always-loaded router (#420).
 *
 * A POINTER is a line held in context that names material outside it and the
 * branch that should reach it — a row in AGENTS.md § Progressive loading, a
 * backticked path beside a hard rule. Its wording, not its target, decides
 * whether the agent gets there. Two ways a pointer fails silently, both caught
 * here on every run:
 *
 *   1. It does not resolve. A path renamed under a pointer leaves the agent
 *      told to load a document that is not there; nothing errors, the agent
 *      guesses. Same failure as a stale schema name in prose (#409), one layer
 *      up. Where the pointer names a section (`path.md` § Heading), the heading
 *      is checked too, case-insensitively, so a section renamed under a pointer
 *      is caught the same way.
 *   2. It leads with filler. An always-loaded pointer is scanned, not read; the
 *      first word is where it does its triggering work. "Any DS implementation
 *      task" makes the agent read "Any" before it learns the row is about DS.
 *      The trigger cell of every § Progressive loading row must lead with a
 *      word that carries the branch.
 *
 * SUBJECTS are the always-loaded router(s); the sweep is by structure, not by a
 * list of pointers, so a pointer added tomorrow is swept tomorrow.
 *
 * Run: npm run check:pointers
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');

/** The always-loaded routers. */
export const SUBJECTS = ['AGENTS.md'];

/** Words that carry no branch. A pointer that opens with one has buried its trigger. */
export const FILLER = new Set(['a', 'an', 'the', 'any', 'when', 'if', 'need', 'needs', 'you', 'to', 'for', 'please', 'also', 'some']);

/** `path.ext` inside backticks, optionally followed by ` § Heading`. */
const POINTER = /`([A-Za-z0-9_@./-]+\.(?:md|json|mjs|js|ts|yml|yaml|toml|sh))`(?:\s*§\s*([^`|\n(—–:;]+))?/g;

/** A section name ends where the sentence resumes. */
function sectionName(raw) {
  if (!raw) return null;
  const cut = raw.search(/\s(is|are|has|have|says|for|and|or|then|which|that)\s|\s[-,.]|$/);
  return raw.slice(0, cut === -1 ? undefined : cut).replace(/[.,]$/, '').trim() || null;
}

/** A pointer names a PLACE in this repo: its first path segment is a real top-level entry.
 *  `references/method.md` beside "a skill loads its own" is prose about a shape, not a pointer. */
function isRepoRelative(root, rel) {
  const first = rel.split('/')[0];
  return existsSync(path.join(root, first));
}

function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, '');
}

export function pointersIn(text, root = REPO_ROOT) {
  const out = [];
  for (const m of stripFences(text).matchAll(POINTER)) {
    const rel = m[1];
    if (/[*{}<>]/.test(rel)) continue; // a glob or a placeholder, not a pointer
    // A bare filename (`SKILL.md`, `bot.md`) names a SHAPE every skill has, not a place;
    // it is a pointer only if it sits at the repo root (AGENTS.md, CONTEXT.md).
    if (!rel.includes('/') && !existsSync(path.join(root, rel))) continue;
    if (rel.includes('/') && !isRepoRelative(root, rel)) continue; // a relative fragment, not a place
    // "when `path` exists" / "when the gate is active, load `path`" is a CONDITIONAL
    // pointer to a file a hook creates at runtime; its absence now is the normal
    // state, not rot. The condition word sits in the same clause, before or after.
    const before = text.slice(Math.max(0, m.index - 60), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 30);
    if (/\b(when|if)\b[^.|\n]*$/i.test(before) || /^[^.|\n]*\b(when|if|exists)\b/i.test(after)) continue;
    out.push({ rel, section: sectionName(m[2]), index: m.index });
  }
  return out;
}

/** Rows of `## Progressive loading`: the first cell of each is the trigger. */
export function triggersIn(text) {
  const at = text.indexOf('## Progressive loading');
  if (at === -1) return [];
  const body = text.slice(at);
  const end = body.indexOf('\n## ', 3);
  const section = end === -1 ? body : body.slice(0, end);
  return section
    .split('\n')
    .filter((l) => l.startsWith('|') && !/^\|\s*-+/.test(l) && !/^\|\s*Trigger\s*\|/i.test(l))
    .map((l) => l.split('|')[1].trim())
    .filter(Boolean);
}

export function headingExists(fileText, heading) {
  const want = heading.toLowerCase().replace(/[`*]/g, '').trim();
  return fileText
    .split('\n')
    .some((l) => /^#{1,6}\s/.test(l) && l.replace(/^#+\s*/, '').replace(/[`*]/g, '').toLowerCase().trim().startsWith(want));
}

export function sweep(root = REPO_ROOT, subjects = SUBJECTS) {
  const failures = [];
  let pointers = 0;
  let triggers = 0;
  for (const rel of subjects) {
    const text = readFileSync(path.join(root, rel), 'utf8');
    for (const p of pointersIn(text, root)) {
      pointers += 1;
      const abs = path.join(root, p.rel);
      if (!existsSync(abs)) {
        failures.push(`${rel}: pointer to \`${p.rel}\` does not resolve — no such file`);
        continue;
      }
      if (p.section && !headingExists(readFileSync(abs, 'utf8'), p.section)) {
        failures.push(`${rel}: pointer to \`${p.rel}\` § ${p.section} — no heading starts with that`);
      }
    }
    for (const t of triggersIn(text)) {
      triggers += 1;
      const first = t.replace(/^[*_`]+/, '').split(/\s+/)[0].toLowerCase().replace(/[^a-z-]/g, '');
      if (FILLER.has(first)) {
        failures.push(`${rel}: § Progressive loading trigger "${t}" leads with "${first}" — front-load the word that carries the branch`);
      }
    }
  }
  return { failures, pointers, triggers };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { failures, pointers, triggers } = sweep();
  if (failures.length) {
    console.error(`[check-pointers] ${failures.length} pointer(s) failed:\n` + failures.map((f) => `  ${f}`).join('\n'));
    console.error('  -> a pointer that does not resolve, or buries its trigger, is a document the agent will not reach.');
    process.exit(1);
  }
  console.log(`[check-pointers] OK — ${pointers} pointers resolve, ${triggers} triggers lead with their word (${SUBJECTS.join(', ')})`);
}
