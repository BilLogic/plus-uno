/**
 * `npm run check:storybook-categories` — component folders and Storybook titles
 * speak Atlassian's categories.
 *
 * WHY IT EXISTS. Components are grouped the way atlassian.design/components
 * groups them: the code folder under `design-system/src/components/` is the
 * category in kebab case, the Storybook group is the same category in sentence
 * case, and the groups sit in Atlassian's order. Three places say it — the
 * folders, every story file's `title:`, and `storybook.taxonomy.json` — and a
 * story copied from an older file carries the old group with it
 * (`Components/Actions/…`, `Components/Status and loading/…`) into a sidebar
 * that no longer has one. Storybook renders such a title happily, as a group of
 * its own, so nothing else goes red.
 *
 * WHAT IT ASSERTS.
 *   1. The taxonomy's component groups are Atlassian categories, in Atlassian's
 *      order, and the sidebar sort lists them in that same order.
 *   2. Every folder directly under `components/` is a category's kebab-case
 *      name, or `_internal`.
 *   3. Every story file under `components/` is titled `Components/<category>/…`,
 *      and a story in a category folder names THAT folder's category. Stories
 *      under `_internal/`, or directly under `components/`, may name any
 *      category.
 *   4. Every segment after `Components/` is in sentence case: "Text field",
 *      not "Text Field". An all-caps acronym (AI, API) is allowed.
 *   5. No tracked file names a retired folder path.
 *
 * The categories are Atlassian's, read live from atlassian.design/components on
 * 2026-10-24. Only the ones with members are used; adding a member to another
 * is adding its folder, its taxonomy group and its sort entry together.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main } from './lib/findings.mjs';
import { metaTitle } from './check-page-outline.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/** atlassian.design/components, in the order the site lists them. */
export const ATLASSIAN_CATEGORIES = [
  'Forms and inputs',
  'Images and icons',
  'Labels',
  'Layout and structure',
  'Loading',
  'Messaging',
  'Navigation',
  'Overlays and layering',
  'Primitives',
  'Status indicators',
  'Text and data display',
];

/**
 * Folders that held components before the move, as the repo path or the `@/`
 * alias, with or without a path after them. Assembled from parts so this file
 * does not name what it searches for.
 */
export const RETIRED_PATHS = ['actions', 'status-and-loading', 'overlays'].map((folder) => ({
  folder,
  re: new RegExp(`(?:design-system/src/|@/)components/${folder}(?![\\w-])`),
}));

/** Story files under `components/`, so a walk that stopped matching finds nothing. */
export const MIN_FILES = 90;

export const folderOf = (category) => category.toLowerCase().replace(/ /g, '-');

/**
 * Sentence case for one title segment: the first word may be capitalized, every
 * later word is lower case unless it is an all-caps acronym. A leading `_`
 * marks an internal story and is ignored.
 */
export function isSentenceCase(segment) {
  const words = segment.replace(/^_/, '').split(/\s+/).filter(Boolean);
  return words.slice(1).every((w) => !/^[A-Z][a-z]/.test(w));
}

/** The Components entries of the sidebar sort, groups only. */
function sortGroups(taxonomy) {
  const order = taxonomy.storySortOrder ?? [];
  const nested = order[order.indexOf('Components') + 1];
  return Array.isArray(nested) ? nested.filter((e) => typeof e === 'string') : [];
}

const inputs = byRoot((repoRoot) => {
  const taxonomy = JSON.parse(fs.readFileSync(path.join(repoRoot, 'storybook.taxonomy.json'), 'utf8'));
  const componentsDir = path.join(repoRoot, 'design-system', 'src', 'components');
  const folders = fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const stories = tracked
    .filter((rel) => rel.startsWith('design-system/src/components/') && /\.stories\.[jt]sx?$/.test(rel))
    .map((rel) => ({ rel, title: metaTitle(fs.readFileSync(path.join(repoRoot, rel), 'utf8')) }));
  return { taxonomy, folders, tracked, stories };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { taxonomy, folders, tracked, stories } = inputs(repoRoot);
  const found = [];

  if (stories.length < MIN_FILES) {
    return [
      {
        message:
          `found ${stories.length} story file(s) under design-system/src/components — expected at ` +
          `least ${MIN_FILES}.\n  -> The corpus moved or the walk broke.`,
      },
    ];
  }

  // (1) The taxonomy's groups: Atlassian categories, Atlassian order, sort agrees.
  const groups = Object.keys(taxonomy.componentGroups ?? {});
  const unknown = groups.filter((g) => !ATLASSIAN_CATEGORIES.includes(g));
  for (const g of unknown) {
    found.push(`storybook.taxonomy.json  component group "${g}" is not an Atlassian category.`);
  }
  const known = groups.filter((g) => ATLASSIAN_CATEGORIES.includes(g));
  const ordered = [...known].sort((a, b) => ATLASSIAN_CATEGORIES.indexOf(a) - ATLASSIAN_CATEGORIES.indexOf(b));
  if (known.join('|') !== ordered.join('|')) {
    found.push(
      `storybook.taxonomy.json  componentGroups are out of Atlassian's order.\n` +
        `      -> Expected ${ordered.join(' · ')}.`,
    );
  }
  if (sortGroups(taxonomy).join('|') !== groups.join('|')) {
    found.push(
      'storybook.taxonomy.json  storySortOrder lists different Components groups from componentGroups.\n' +
        '      -> Make them agree, then run `node scripts/sync-storybook-sort.mjs`.',
    );
  }

  // (2) Folders.
  const byFolder = new Map(groups.map((g) => [folderOf(g), g]));
  for (const folder of folders) {
    if (folder !== '_internal' && !byFolder.has(folder)) {
      found.push(
        `design-system/src/components/${folder}/  is not a category folder.\n` +
          `      -> Folders are the taxonomy's component groups in kebab case: ${[...byFolder.keys()].join(', ')}.`,
      );
    }
  }

  // (3) and (4) Titles.
  for (const { rel, title } of stories) {
    if (title === null) {
      found.push(`${rel}  has no \`title:\` on its default export.`);
      continue;
    }
    const [root, category, ...rest] = title.split('/');
    const parts = rel.split('/');
    const folder = parts.length > 4 ? parts[3] : '_internal';
    if (root !== 'Components' || !groups.includes(category)) {
      found.push(
        `${rel}  is titled "${title}", outside every component category.\n` +
          `      -> Title it Components/<category>/…, with a category from storybook.taxonomy.json.`,
      );
      continue;
    }
    if (folder !== '_internal' && byFolder.get(folder) !== category) {
      found.push(
        `${rel}  lives in ${folder}/ but is titled under "${category}".\n` +
          `      -> A story's group is its folder's category: Components/${byFolder.get(folder)}/….`,
      );
    }
    for (const segment of rest) {
      if (!isSentenceCase(segment)) {
        found.push(`${rel}  title segment "${segment}" is not sentence case.`);
      }
    }
  }

  // (5) Retired paths.
  const self = new Set(['scripts/check-storybook-categories.mjs', 'scripts/check-storybook-categories.test.mjs']);
  for (const rel of tracked) {
    if (self.has(rel) || rel.startsWith('docs/plans/') || rel.startsWith('docs/adr/')) continue;
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).size > 2_000_000) continue;
    const src = fs.readFileSync(abs, 'utf8');
    if (src.includes('\u0000')) continue;
    for (const { folder, re } of RETIRED_PATHS) {
      if (re.test(src)) {
        found.push(`${rel}  names the retired folder components/${folder}/.`);
        break;
      }
    }
  }

  return found.map((message) => ({ message }));
}

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { taxonomy, stories } = inputs(repoRoot);
  const groups = Object.keys(taxonomy.componentGroups ?? {});
  return `${stories.length} component story file(s) across ${groups.length} Atlassian categories, folders and titles agree.`;
}

main(import.meta.url, 'check:storybook-categories', { run, summary });
