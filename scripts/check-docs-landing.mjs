#!/usr/bin/env node
/**
 * `npm run check:docs-landing` — every covered Foundations, Templates or
 * Patterns docs page opens with the DocsLanding block, and its page id has a
 * hero in the hero registry, carries no body Contents block, and any overview
 * card's `hero="..."` names a registry hero.
 *
 * WHY IT EXISTS. The pages used to open three different ways (a Foundation
 * header, Storybook's title and a lead, or nothing), so a reader could not tell
 * they were in one system. DocsLanding is the one opener; without a gate a new
 * page could ship with the old header or with a landing whose hero was never
 * drawn, and nothing downstream would notice. The hero is picked by page id
 * from `design-system/src/storybook-docs/docs-landing/hero-registry.jsx`, so a
 * page and its drawing are two edits that this holds together.
 *
 * WHAT IT READS. Text only: the page's MDX and the registry source. It does not
 * render anything, so it cannot see whether the hero draws well; the block's
 * own tests and the page's screenshots do that.
 *
 * THE ALLOW-LIST GROWS. `PAGES` below is the set of pages the check covers. It
 * started with Color; each ticket that moves another page onto DocsLanding adds
 * its row here and its hero to the registry in the same change. A registry
 * entry for a page that is not in `PAGES` fails, so the two cannot drift apart.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { byRoot, main } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/** Repo-relative path of the hero registry. */
export const REGISTRY = 'design-system/src/storybook-docs/docs-landing/hero-registry.jsx';

/**
 * The pages covered: the MDX file and the page id, which is the Storybook id of
 * the page (its title, lower-cased and joined with dashes).
 */
export const PAGES = [
  { file: 'design-system/src/styles/Colors.mdx', id: 'foundations-visual-color' },
  { file: 'design-system/src/styles/Accessibility.mdx', id: 'foundations-accessibility' },
  { file: 'design-system/src/styles/Border.mdx', id: 'foundations-visual-border' },
  { file: 'design-system/src/styles/Elevation.mdx', id: 'foundations-visual-elevation' },
  { file: 'design-system/src/styles/FoundationsOverview.mdx', id: 'foundations-overview' },
  { file: 'design-system/src/styles/Grid.mdx', id: 'foundations-layout-grid' },
  { file: 'design-system/src/styles/Icons.mdx', id: 'foundations-visual-iconography' },
  { file: 'design-system/src/styles/Illustrations.mdx', id: 'foundations-brand-illustrations' },
  { file: 'design-system/src/styles/Logos.mdx', id: 'foundations-brand-logos' },
  { file: 'design-system/src/styles/Radius.mdx', id: 'foundations-visual-radius' },
  { file: 'design-system/src/styles/Spacing.mdx', id: 'foundations-layout-spacing' },
  { file: 'design-system/src/styles/Tokens.mdx', id: 'foundations-tokens' },
  { file: 'design-system/src/styles/Typography.mdx', id: 'foundations-visual-typography' },
  { file: 'design-system/src/storybook-docs/patterns/PatternsOverview.mdx', id: 'patterns-overview' },
  { file: 'design-system/src/storybook-docs/patterns/CommonActions/CommonActions.mdx', id: 'patterns-common-actions' },
  { file: 'design-system/src/storybook-docs/patterns/Forms/Forms.mdx', id: 'patterns-forms' },
  { file: 'design-system/src/storybook-docs/patterns/Filtering/Filtering.mdx', id: 'patterns-filtering' },
  { file: 'design-system/src/storybook-docs/patterns/Navigation/Navigation.mdx', id: 'patterns-navigation' },
  { file: 'design-system/src/storybook-docs/patterns/Search/Search.mdx', id: 'patterns-search' },
  { file: 'design-system/src/storybook-docs/patterns/Indicators/Indicators.mdx', id: 'patterns-indicators' },
  { file: 'design-system/src/storybook-docs/patterns/Notifications/Notifications.mdx', id: 'patterns-notifications' },
  { file: 'design-system/src/storybook-docs/patterns/Disabled/Disabled.mdx', id: 'patterns-states-disabled' },
  { file: 'design-system/src/storybook-docs/patterns/Empty/Empty.mdx', id: 'patterns-states-empty' },
  { file: 'design-system/src/storybook-docs/patterns/Errors/Errors.mdx', id: 'patterns-states-errors' },
  { file: 'design-system/src/storybook-docs/patterns/Loading/Loading.mdx', id: 'patterns-states-loading' },
  { file: 'design-system/src/storybook-docs/patterns/Overflow/Overflow.mdx', id: 'patterns-states-overflow' },
  { file: 'design-system/src/storybook-docs/patterns/ReadOnly/ReadOnly.mdx', id: 'patterns-states-read-only' },
  { file: 'design-system/src/styles/MotionPrinciples.mdx', id: 'foundations-expression-motion-principles' },
  { file: 'design-system/src/styles/MotionPhysics.mdx', id: 'foundations-expression-motion-physics' },
  { file: 'design-system/src/styles/MotionTransitions.mdx', id: 'foundations-expression-motion-transitions' },
  { file: 'design-system/src/styles/MotionChoreography.mdx', id: 'foundations-expression-motion-choreography' },
  { file: 'design-system/src/styles/MotionPlayground.mdx', id: 'foundations-expression-motion-playground' },
  { file: 'design-system/src/styles/MotionLibrary.mdx', id: 'foundations-expression-motion-library' },
  { file: 'design-system/src/styles/SoundOverview.mdx', id: 'foundations-expression-sound-overview' },
  { file: 'design-system/src/styles/SoundWhenToPlay.mdx', id: 'foundations-expression-sound-when-to-play' },
  { file: 'design-system/src/styles/SoundWithMotion.mdx', id: 'foundations-expression-sound-with-motion' },
  { file: 'design-system/src/styles/SoundSounds.mdx', id: 'foundations-expression-sound-sounds' },
  { file: 'design-system/src/styles/SoundSettings.mdx', id: 'foundations-expression-sound-settings-and-accessibility' },
  { file: 'design-system/src/storybook-docs/templates/TemplatesOverview.mdx', id: 'templates-overview' },
  { file: 'design-system/src/patterns/Frame/Frame.mdx', id: 'templates-frame' },
  { file: 'design-system/src/patterns/Page/Page.mdx', id: 'templates-page' },
  { file: 'design-system/src/patterns/PatternSection/PatternSection.mdx', id: 'templates-section-section' },
  { file: 'design-system/src/patterns/PatternCard/PatternCard.mdx', id: 'templates-card' },
  { file: 'design-system/src/patterns/PatternTable/PatternTable.mdx', id: 'templates-table' },
  { file: 'design-system/src/patterns/Form/Form.mdx', id: 'templates-form' },
  { file: 'design-system/src/patterns/PatternModal/PatternModal.mdx', id: 'templates-modal-modal' },
  { file: 'design-system/src/patterns/Panel/Panel.mdx', id: 'templates-panel-panel' },
  { file: 'design-system/src/patterns/Popup/Popup.mdx', id: 'templates-popup-popup' },
];

const OLD_OPENER = /<FoundationHero\b|<Title\b/;
const LANDING = /<DocsLanding\b/;
/** A body Contents block: the right rail lists each page's contents, so the page does not list them twice. */
const BODY_CONTENTS = /<FoundationContents\b|<Contents\b|aria-label="Contents"|^#{1,4}\s+Contents\s*$/m;
/** An overview card's or thumbnail's hero: `<TypeCard hero="page-id" ...>`, `<ThumbTile hero="page-id" ...>`. */
const CARD_HERO = /<(?:TypeCard|ThumbTile)\b[^>]*?\bhero="([a-z0-9-]+)"/g;
const LANDING_PAGE = /<DocsLanding\b[^>]*?\bpage="([^"]+)"/s;

/**
 * The page ids a registry source declares: the quoted keys that open an entry
 * (`'foundations-visual-color': {`), in order.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function heroIds(source) {
  return [...source.matchAll(/^\s{2}'([a-z0-9-]+)':\s*\{/gm)].map((m) => m[1]);
}

/**
 * One page's findings, as sentences.
 *
 * @param {{file: string, source: string, id: string, heroes: string[]}} page
 * @returns {string[]}
 */
export function checkPage({ file, source, id, heroes }) {
  const found = [];
  if (!LANDING.test(source)) {
    found.push(`${file}: has no <DocsLanding>. Open the page with it, in place of the old header.`);
  } else {
    const named = LANDING_PAGE.exec(source)?.[1];
    if (named !== id) {
      found.push(`${file}: <DocsLanding> has page="${named ?? ''}" but this page's id is ${id}.`);
    }
    if (OLD_OPENER.test(source)) {
      found.push(`${file}: still renders <FoundationHero> or <Title> beside the landing; the landing replaces it.`);
    }
    if (BODY_CONTENTS.test(source)) {
      found.push(`${file}: renders a body Contents block beside the landing; drop it, the right rail lists the page's contents.`);
    }
    for (const [, card] of source.matchAll(CARD_HERO)) {
      if (!heroes.includes(card)) {
        found.push(`${file}: a card shows hero="${card}", which has no hero in the registry (${REGISTRY}).`);
      }
    }
  }
  if (!heroes.includes(id)) {
    found.push(`${file}: page id ${id} has no hero in the registry (${REGISTRY}).`);
  }
  return found;
}

/**
 * The registry's own findings: an entry for a page the check does not cover,
 * and an entry with no description (the hero's accessible name).
 *
 * @param {{heroes: string[], pages: {id: string}[], source?: string}} input
 * @returns {string[]}
 */
export function checkRegistry({ heroes, pages, source }) {
  const found = [];
  const covered = new Set(pages.map((p) => p.id));
  for (const id of heroes) {
    if (!covered.has(id)) {
      found.push(`${REGISTRY}: names ${id}, a page check:docs-landing does not cover. Add it to PAGES in scripts/check-docs-landing.mjs, or remove the entry.`);
    }
  }
  if (source !== undefined) {
    for (const id of heroes) {
      const entry = new RegExp(`^\\s{2}'${id}':\\s*\\{[\\s\\S]*?^\\s{2}\\},?$`, 'm').exec(source)?.[0] ?? '';
      if (!/\bdescription:\s*['"`]/.test(entry)) {
        found.push(`${REGISTRY}: ${id} has no description; it is the hero's accessible name.`);
      }
    }
  }
  return found;
}

const inputs = byRoot((repoRoot) => {
  const source = fs.readFileSync(path.join(repoRoot, REGISTRY), 'utf8');
  return { source, heroes: heroIds(source) };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { source, heroes } = inputs(repoRoot);
  const sentences = [...checkRegistry({ heroes, pages: PAGES, source })];
  for (const { file, id } of PAGES) {
    const abs = path.join(repoRoot, file);
    if (!fs.existsSync(abs)) {
      sentences.push(`${file}: the page does not exist, but PAGES lists it.`);
      continue;
    }
    sentences.push(...checkPage({ file, source: fs.readFileSync(abs, 'utf8'), id, heroes }));
  }
  return sentences.map((sentence) => {
    const located = /^([\w./-]+\.(?:mdx|jsx)): ([\s\S]*)$/.exec(sentence);
    return located ? { file: located[1], message: located[2] } : { message: sentence };
  });
}

export const REMEDY =
  '  -> Open the page with <DocsLanding page="<id>" eyebrow title purpose links />\n'
  + '     (or section="<id>" for a section tab strip), and add the\n'
  + `     page's hero to ${REGISTRY} with its one-sentence description.\n`
  + '     A new page is also added to PAGES in scripts/check-docs-landing.mjs.';

export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { heroes } = inputs(repoRoot);
  return `${PAGES.length} page(s) open with DocsLanding; ${heroes.length} hero(s) in the registry.`;
}

main(import.meta.url, 'check:docs-landing', { run, summary, remedy: REMEDY });
