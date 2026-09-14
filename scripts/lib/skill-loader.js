/**
 * scripts/lib/skill-loader.js
 *
 * Loads a SKILL.md file and returns its content as a runtime system prompt
 * for Claude API calls. Used by scripts/implement-figma-changes.js and
 * (eventually, via copy-paste) Pipedream code steps.
 *
 * Anthropic Agent Skills convention:
 *   scripts/prompts/{skill}/SKILL.md         — entry point, always loaded
 *   scripts/prompts/{skill}/references/*.md  — loaded on demand based on context
 *
 * Usage:
 *   import { loadSkill } from './lib/skill-loader.js';
 *   const systemPrompt = await loadSkill('uno-implement', {
 *     isNewComponent: false
 *   });
 *
 * This loader does three things:
 *   1. Read the SKILL.md YAML frontmatter through the corpus reader
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

import { frontmatter } from './corpus.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOT_SKILLS_ROOT = resolve(__dirname, '../prompts');

/**
 * The prompts' root, exported so the sweeps that cover the Actions embodiment
 * (`scripts/lib/actions-prompts.mjs`) walk the directory THIS loader reads
 * rather than a copy of its name (#425).
 */
export const PROMPTS_ROOT = BOT_SKILLS_ROOT;

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
 * Split a SKILL.md into frontmatter and body, through the corpus reader.
 *
 * There is ONE frontmatter parser in this repo (`scripts/lib/corpus.mjs`), and
 * this used to be the fifth: a hand-rolled YAML subset with its own fence
 * search, its own quote stripping and its own bracket handling. Where a fence
 * closes is one fact — the bundler measures the Worker's char budgets on the
 * body side of it — and a second answer to it is a second answer that can
 * disagree (#503). The two shapes this loader alone needed, a block sequence
 * (`trigger_types:`) and a nested mapping (`references_when:`), are what
 * `structured: true` asks for; every other caller keeps the scalar reading.
 *
 * Deliberately NOT kept from the parser this replaces: the throw on an
 * unterminated block. Corpus treats it as content, which is what the bundler
 * has always done, and a prompt file is no place for a different rule.
 *
 * @param {string} rawText the file's whole contents.
 * @returns {{frontmatter: Record<string, unknown>, body: string}}
 */
export function splitFrontmatter(rawText) {
  const { meta, body } = frontmatter(rawText, { structured: true });
  return { frontmatter: meta, body };
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
 *   1. Read scripts/prompts/{skillName}/SKILL.md
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

  const { frontmatter: meta, body } = splitFrontmatter(raw);
  const cleanBody = stripMetaSections(body);

  const parts = [cleanBody];

  const refsWhen = meta.references_when;
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
  const { frontmatter: meta } = splitFrontmatter(raw);
  return meta;
}
