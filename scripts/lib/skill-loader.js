/**
 * bot-skills/lib/skill-loader.js
 *
 * Loads a SKILL.md file and returns its content as a runtime system prompt
 * for Claude API calls. Used by scripts/implement-figma-changes.js and
 * (eventually, via copy-paste) Pipedream code steps.
 *
 * Anthropic Agent Skills convention:
 *   bot-skills/{skill}/SKILL.md         — entry point, always loaded
 *   bot-skills/{skill}/references/*.md  — loaded on demand based on context
 *
 * Usage:
 *   import { loadSkill } from '../bot-skills/lib/skill-loader.js';
 *   const systemPrompt = await loadSkill('uno-implement', {
 *     isNewComponent: false
 *   });
 *
 * This loader does three things:
 *   1. Parse the SKILL.md YAML frontmatter (minimal hand-rolled subset)
 *   2. Strip "meta" sections from the body that are for human readers, not
 *      Claude (Cost Profile, Migration TODO, Related Skills, etc.)
 *   3. Conditionally append `references_when` files based on the context flags
 *
 * No external dependencies — pure Node.js fs + path so it runs anywhere the
 * repo runs (CI, local, future Pipedream copy).
 */

import { readFile } from 'fs/promises';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOT_SKILLS_ROOT = resolve(__dirname, '..');

/**
 * Section headings that are metadata for humans and should not appear in the
 * runtime system prompt. The loader strips each section from its `## Heading`
 * line through (but not including) the next `##` heading of the same level.
 */
const META_SECTION_HEADINGS = [
  'Cost Profile',
  'Migration TODO',
  'Migration TODO (Week 2)',
  'TODO Before Production',
  'TODO Before Production (Week 3)',
  'TODO Before Production (Week 4)',
  'Related Skills',
  'Sample Invocations',
];

/**
 * Parse YAML frontmatter. Supports only the subset this repo actually uses:
 *   - Scalars:        `key: value`
 *   - Quoted scalars: `key: "value"` or `key: 'value'`
 *   - Multi-line >:   `key: >\n  line one\n  line two`
 *   - Sequences:      `key:\n  - item\n  - item`
 *   - Nested objects: `key:\n  subkey: value`
 *   - Comments after value: `key: value  # comment` (comment stripped)
 *
 * Not supported (intentionally — keep it small): anchors, references, flow
 * sequences/mappings, complex multi-line literals, type tags.
 */
export function parseFrontmatter(yamlText) {
  const lines = yamlText.split('\n');
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    // Top-level key (no leading whitespace beyond optional empty leading)
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*(?:#.*)?$/);
    if (!m) { i++; continue; }

    const [, key, rawValue] = m;
    const value = rawValue.trim();

    if (value === '>' || value === '|') {
      // Multi-line scalar — collect indented lines that follow
      const collected = [];
      i++;
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
        if (lines[i].trim()) collected.push(lines[i].replace(/^\s+/, ''));
        i++;
      }
      result[key] = collected.join(' ').trim();
      continue;
    }

    if (value === '') {
      // Could be a sequence or a nested object — peek at next indented line
      i++;
      const items = [];
      const nested = {};
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
        const sub = lines[i];
        if (!sub.trim() || sub.trim().startsWith('#')) { i++; continue; }
        const seq = sub.match(/^\s+-\s+(.+?)\s*(?:#.*)?$/);
        if (seq) {
          items.push(stripQuotes(seq[1]));
        } else {
          const kv = sub.match(/^\s+([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*(?:#.*)?$/);
          if (kv) nested[kv[1]] = stripQuotes(kv[2]);
        }
        i++;
      }
      result[key] = items.length > 0 ? items : nested;
      continue;
    }

    result[key] = stripQuotes(value);
    i++;
  }

  return result;
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Split a SKILL.md file into frontmatter and body. Frontmatter is between two
 * `---` lines at the very start of the file. Body is everything after the
 * closing `---`. If no frontmatter, the whole file is body and frontmatter
 * is an empty object.
 */
export function splitFrontmatter(rawText) {
  const trimmed = rawText.replace(/^﻿/, ''); // strip BOM
  if (!trimmed.startsWith('---\n') && !trimmed.startsWith('---\r\n')) {
    return { frontmatter: {}, body: trimmed };
  }
  const endIdx = trimmed.indexOf('\n---\n', 4);
  const endIdxCrlf = trimmed.indexOf('\r\n---\r\n', 5);
  const closingIdx = endIdx !== -1 ? endIdx : endIdxCrlf;
  if (closingIdx === -1) {
    throw new Error('Malformed SKILL.md: opening `---` without closing `---`');
  }
  const fmText = trimmed.slice(4, closingIdx);
  const bodyStart = closingIdx + (endIdx !== -1 ? 5 : 7);
  return {
    frontmatter: parseFrontmatter(fmText),
    body: trimmed.slice(bodyStart).replace(/^\s+/, ''),
  };
}

/**
 * Strip "meta" sections from a SKILL.md body. A meta section runs from a
 * `## {known meta heading}` line through (but not including) the next `##`
 * heading or end-of-file. The HTML-comment fence
 *   `<!-- ==== Sections below ... stripped by the skill-loader ==== -->`
 * if present, strips everything below it as well.
 */
export function stripMetaSections(body) {
  // Fence-based strip: everything below the convention marker comment
  const fenceMatch = body.match(/<!--\s*={2,}\s*Sections below[\s\S]*?-->/);
  let result = fenceMatch ? body.slice(0, fenceMatch.index) : body;

  // Heading-based strip: each known meta heading and its section content
  for (const heading of META_SECTION_HEADINGS) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\n##\\s+${escaped}\\b[\\s\\S]*?(?=\\n##\\s|$)`, 'g');
    result = result.replace(re, '');
  }

  return result.trim() + '\n';
}

/**
 * Load a skill's full system prompt:
 *   1. Read bot-skills/{skillName}/SKILL.md
 *   2. Strip meta sections from the body
 *   3. For each context flag that's true AND keyed in `references_when`,
 *      read the referenced file and append to the prompt
 *
 * Returns: the assembled system prompt string, ready to pass to Claude.
 */
export async function loadSkill(skillName, context = {}) {
  const skillDir = join(BOT_SKILLS_ROOT, skillName);
  const skillPath = join(skillDir, 'SKILL.md');

  let raw;
  try {
    raw = await readFile(skillPath, 'utf8');
  } catch (err) {
    throw new Error(`Skill not found: ${skillPath} (${err.message})`);
  }

  const { frontmatter, body } = splitFrontmatter(raw);
  const cleanBody = stripMetaSections(body);

  const parts = [cleanBody];

  const refsWhen = frontmatter.references_when;
  if (refsWhen && typeof refsWhen === 'object' && !Array.isArray(refsWhen)) {
    for (const [flag, refPath] of Object.entries(refsWhen)) {
      if (context[flag]) {
        const refFull = join(skillDir, refPath);
        try {
          const refRaw = await readFile(refFull, 'utf8');
          // References files may or may not have frontmatter; strip if present
          const { body: refBody } = splitFrontmatter(refRaw);
          parts.push(`\n\n---\n\n${refBody.trim()}\n`);
        } catch (err) {
          console.warn(`⚠️  skill-loader: reference file missing — ${refFull} (${err.message})`);
        }
      }
    }
  }

  return parts.join('').trim();
}

/**
 * Load just the frontmatter metadata for a skill without loading body or
 * references. Useful for the router step (~100 token registry per skill).
 */
export async function loadSkillMetadata(skillName) {
  const skillPath = join(BOT_SKILLS_ROOT, skillName, 'SKILL.md');
  const raw = await readFile(skillPath, 'utf8');
  const { frontmatter } = splitFrontmatter(raw);
  return frontmatter;
}
