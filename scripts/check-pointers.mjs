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
 *      is checked too — case-insensitively, and by its whole name rather than a
 *      prefix of it, so a section renamed under a pointer is caught the same
 *      way even when only its tail changed.
 *   2. It leads with filler. An always-loaded pointer is scanned, not read; the
 *      first word is where it does its triggering work. "Any DS implementation
 *      task" makes the agent read "Any" before it learns the row is about DS.
 *      The trigger cell of every § Progressive loading row must lead with a
 *      word that carries the branch.
 *
 * SUBJECTS are the always-loaded router and the agent files it routes into;
 * the sweep is by structure, not by a list of pointers, so a pointer added
 * tomorrow is swept tomorrow and an agent file added tomorrow is swept too.
 *
 * Run: npm run check:pointers
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents, GENERATED_BUNDLE } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');

export const REMEDY =
  '  -> a pointer that does not resolve, or buries its trigger, is a document the agent will not reach.';

/**
 * The always-loaded router, and the agent files that answer to it.
 *
 * A subject is a path or a glob, and the glob is walked by the corpus rather
 * than by a reader of this file's own: that is what keeps an installed
 * dependency out of the sweep, since `IGNORED_DIRS` already holds
 * `node_modules` and a private walk would have had to be told again.
 */
export const SUBJECTS = ['AGENTS.md', 'agents/**/*.md'];

/**
 * The files a subject list names: a literal path, or a glob the corpus walks.
 *
 * The generated harness bundle is not one of them: its pointers belong to the
 * documents it was assembled from and are checked at their paths, not its.
 * `GENERATED_BUNDLE` is the corpus's, so this check and `check-doc-links.mjs`
 * exclude the same file by the same rule rather than by two spellings of it.
 */
export function subjectFiles(root = REPO_ROOT, subjects = SUBJECTS) {
  const seen = new Set();
  for (const subject of subjects) {
    for (const rel of documents(subject, { root, ext: ['.md'], strict: true })) {
      if (!GENERATED_BUNDLE.test(rel)) seen.add(rel);
    }
  }
  return [...seen].sort();
}

/** Words that carry no branch. A pointer that opens with one has buried its trigger. */
export const FILLER = new Set(['a', 'an', 'the', 'any', 'when', 'if', 'need', 'needs', 'you', 'to', 'for', 'please', 'also', 'some']);

/**
 * `path.ext` inside backticks, optionally followed by ` § Heading`.
 *
 * The heading runs to the first character that belongs to the SENTENCE rather
 * than to the section: a bracket either side of it, a dash or an arrow handing
 * over to the instruction, a colon or a semicolon. A pointer written inside a
 * parenthetical — "(the values: `CONTEXT.md` § Two vocabularies)" — ends at the
 * bracket that closes it, which the opening bracket's absence used not to say.
 */
const POINTER = /`([A-Za-z0-9_@./-]+\.(?:md|json|mjs|js|ts|yml|yaml|toml|sh))`(?:\s*§\s*([^`|\n()—–→:;]+))?/g;

/**
 * What a `§` citation might be naming, longest first.
 *
 * A section name ends where the sentence resumes: at a connective word, or at
 * the punctuation that belongs to the sentence rather than to the heading —
 * `, . ;`, the same set `scripts/check-doc-links.mjs` strips off a backticked
 * path before resolving it. One convention for where a pointer ends, not two.
 *
 * But a comma is the one terminator a HEADING also uses ("Two sources, one
 * time axis"), so cutting at one and checking only the stub would stop checking
 * the tail — which is exactly the half a rename edits. So the cut is a FALLBACK,
 * never the first answer: the whole captured name is tried first, and the cut
 * only if the file has no such heading. A pointer whose tail has gone stale
 * fails on both, because `headingExists` matches a whole heading rather than a
 * prefix of one.
 */
function sectionNames(raw) {
  if (!raw) return [];
  const tidy = (s) => s.trim().replace(/[,.;]+$/, '');
  const full = tidy(raw);
  const at = raw.search(/\s(is|are|has|have|says|for|and|or|then|which|that)\s|\s[-,.]|[,.;](?=\s)|$/);
  const cut = tidy(raw.slice(0, at === -1 ? undefined : at));
  return [...new Set([full, cut])].filter(Boolean);
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
    out.push({ rel, sections: sectionNames(m[2]), index: m.index });
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

/**
 * Whether a heading of that name exists — the WHOLE heading, not a prefix of it.
 *
 * Prefix matching was what made cutting at a comma cheap and made it lossy:
 * `§ Two` matched "Two vocabularies", so a stub named a section it had not
 * read and a renamed tail cost nothing.
 *
 * The one thing a citation may leave off is the heading's trailing ASIDE, and
 * the house writes two: a bracket ("Writing style (all Slack output)") and a
 * dash gloss ("Two vocabularies — the blueprint speaks service-blueprint…").
 * Both are the heading explaining itself, and a citation carries the name. So
 * a heading is compared as written AND with its aside dropped — that, and
 * nothing else, is the slack in the match.
 */
export function headingExists(fileText, heading) {
  const tidy = (s) => s.replace(/[`*]/g, '').toLowerCase().trim();
  const want = tidy(heading);
  return fileText.split('\n').some((l) => {
    if (!/^#{1,6}\s/.test(l)) return false;
    const has = tidy(l.replace(/^#+\s*/, '').replace(/\s*#+\s*$/, ''));
    const named = tidy(has.replace(/\s*\([^()]*\)$/, '').replace(/\s+[—–-]\s+.*$/, ''));
    return has === want || named === want;
  });
}

export function sweep(root = REPO_ROOT, subjects = SUBJECTS) {
  const failures = [];
  let pointers = 0;
  let triggers = 0;
  for (const rel of subjectFiles(root, subjects)) {
    const text = readFileSync(path.join(root, rel), 'utf8');
    for (const p of pointersIn(text, root)) {
      pointers += 1;
      const abs = path.join(root, p.rel);
      if (!existsSync(abs)) {
        failures.push(`${rel}: pointer to \`${p.rel}\` does not resolve — no such file`);
        continue;
      }
      if (p.sections.length > 0) {
        const file = readFileSync(abs, 'utf8');
        // The whole captured name first, the cut only as a fallback: see
        // `sectionNames`. Named by the longest, which is what the author wrote.
        if (!p.sections.some((s) => headingExists(file, s))) {
          failures.push(`${rel}: pointer to \`${p.rel}\` § ${p.sections[0]} — no heading by that name`);
        }
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

/** One sweep of the routers, shared by the findings and the green line. */
const swept = byRoot((repoRoot) => sweep(repoRoot));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  return swept(repoRoot).failures.map((message) => ({ message }));
}

/** The green line, which carries how much of the router was actually swept. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { pointers, triggers } = swept(repoRoot);
  return `${pointers} pointers resolve, ${triggers} triggers lead with their word (${SUBJECTS.join(', ')})`;
}

main(import.meta.url, 'check:pointers', { run, summary, remedy: REMEDY });
