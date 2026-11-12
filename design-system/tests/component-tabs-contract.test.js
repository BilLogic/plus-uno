/**
 * The component tabs' pure half (#168).
 *
 * The tabs themselves are React and only exist inside a running
 * Storybook. Everything that can be wrong without a browser is in
 * `../src/storybook-docs/lib/component-tabs-contract.js`: which entries count as
 * components, where their files sit, and the tab shape. That is what this file
 * holds to.
 *
 * It lives in the design-system package because `npm test` is the only test
 * command the repo has; it asserts properties of a ROOT-level module, the same
 * arrangement `storybook-vitest-project.test.js` uses.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

import {
  TABS,
  TABBED_EXCEPTIONS,
  isTabbedDocsPage,
  TAB_IDS,
  componentIdentity,
  importLineFor,
  importSourceFor,
  generatedDocPathFor,
  repoPathOfGlobKey,
  agentViewEntry,
  reportProblemUrl,
  agentViewMarkdown,
  agentViewSlug,
} from '../src/storybook-docs/lib/component-tabs-contract.js';

describe('componentIdentity', () => {
  it('reads a nested component out of its story path', () => {
    expect(
      componentIdentity({
        title: 'Components/Forms and inputs/Button',
        importPath: './design-system/src/components/forms-and-inputs/Button/Button.stories.jsx',
      }),
    ).toEqual({
      name: 'Button',
      group: 'forms-and-inputs',
      dir: 'design-system/src/components/forms-and-inputs/Button',
      source: 'design-system/src/components/forms-and-inputs/Button/Button.jsx',
      generatedDoc: 'design-system/src/components/forms-and-inputs/Button/index.md',
      groupIndex: 'design-system/src/components/forms-and-inputs/index.md',
      entryFile: 'design-system/src/components/forms-and-inputs/Button/Button.stories.jsx',
    });
  });

  it('reads the same component out of its MDX page', () => {
    const fromMdx = componentIdentity({
      title: 'Components/Forms and inputs/Button',
      importPath: './design-system/src/components/forms-and-inputs/Button/Button.mdx',
    });
    expect(fromMdx.name).toBe('Button');
    expect(fromMdx.generatedDoc).toBe('design-system/src/components/forms-and-inputs/Button/index.md');
  });

  it('reads a flat component, whose generated doc is <Name>.md beside the source', () => {
    expect(
      componentIdentity({
        title: 'Components/Forms and inputs/Toggle',
        importPath: './design-system/src/components/forms-and-inputs/Toggle.stories.jsx',
      }),
    ).toEqual({
      name: 'Toggle',
      group: 'forms-and-inputs',
      dir: 'design-system/src/components/forms-and-inputs',
      source: 'design-system/src/components/forms-and-inputs/Toggle.jsx',
      generatedDoc: 'design-system/src/components/forms-and-inputs/Toggle.md',
      groupIndex: 'design-system/src/components/forms-and-inputs/index.md',
      entryFile: 'design-system/src/components/forms-and-inputs/Toggle.stories.jsx',
    });
  });

  it('returns null for anything outside the components tree', () => {
    expect(
      componentIdentity({
        title: 'Foundations/Color',
        importPath: './design-system/src/styles/Colors.stories.jsx',
      }),
    ).toBeNull();
    expect(
      componentIdentity({
        title: 'Data visualizations/Temporal/Line chart',
        importPath: './design-system/src/dataviz/temporal/LineChart/LineChart.stories.jsx',
      }),
    ).toBeNull();
  });

  it('returns null rather than guessing when there is no import path', () => {
    expect(componentIdentity(undefined)).toBeNull();
    expect(componentIdentity({ title: 'Components/Forms and inputs/Button' })).toBeNull();
  });
});

describe('the tab contract', () => {
  it('declares four tabs, with Examples first and unparameterized and Agent view last', () => {
    expect(TABS.map((t) => t.key)).toEqual(['examples', 'code', 'usage', 'agent']);
    expect(TABS.map((t) => t.title)).toEqual(['Examples', 'Code', 'Usage', 'Agent view']);
    // Examples is the DEFAULT tab, so it carries no query param — the addon tabs
    // behaved the same way, and those URLs are still in circulation.
    expect(TABS[0].id).toBeNull();
    expect(TABS.slice(1).map((t) => t.id)).toEqual(['plus-code', 'plus-usage', 'plus-agent-view']);
    expect(TABS.at(-1)).toEqual({ key: 'agent', id: TAB_IDS.agent, title: 'Agent view' });
  });

});

describe('which docs pages are tabbed', () => {
  it('tabs every component page', () => {
    expect(isTabbedDocsPage('design-system/src/components/messaging/Modal/Modal.mdx')).toBe(true);
  });

  it('tabs a pattern page in its own folder', () => {
    expect(isTabbedDocsPage('design-system/src/patterns/PatternModal/PatternModal.mdx')).toBe(true);
    expect(isTabbedDocsPage('./design-system/src/patterns/PageTemplates/PageTemplates.mdx')).toBe(true);
  });

  it('tabs a docs-only pattern page in its own folder under storybook-docs/patterns', () => {
    expect(isTabbedDocsPage('design-system/src/storybook-docs/patterns/Filtering/Filtering.mdx')).toBe(true);
    expect(isTabbedDocsPage('design-system/src/storybook-docs/patterns/PatternsOverview.mdx')).toBe(false);
  });

  it('leaves the flat pattern reading pages and the foundations untabbed', () => {
    expect(isTabbedDocsPage('design-system/src/patterns/Introduction.mdx')).toBe(false);
    expect(isTabbedDocsPage('design-system/src/patterns/HeadingOutline.mdx')).toBe(false);
    expect(isTabbedDocsPage('design-system/src/styles/Colors.mdx')).toBe(false);
    expect(TABBED_EXCEPTIONS).toEqual([]);
  });
});

describe('importLineFor', () => {
  it('names the component from the barrel, the only public import path', () => {
    expect(importLineFor('Button')).toBe("import { Button } from '@/components';");
  });

  it('names a pattern from the patterns barrel', () => {
    const from = importSourceFor({ importPath: './design-system/src/patterns/PatternModal/PatternModal.stories.jsx' });
    expect(from).toBe('@/patterns');
    expect(importLineFor('PatternModal', from)).toBe("import { PatternModal } from '@/patterns';");
    expect(importSourceFor({ importPath: './design-system/src/components/messaging/Modal/Modal.stories.jsx' })).toBe('@/components');
    expect(importSourceFor(undefined)).toBe('@/components');
  });

  it('shows no import line on a docs-only pattern page, whose props are not its own export', () => {
    const from = importSourceFor({ importPath: './design-system/src/patterns/PageTemplates/PageTemplates.stories.jsx' }, false);
    expect(from).toBeNull();
    expect(importLineFor('PageLayout', from)).toBeNull();
  });

  it('falls back to nothing when the meta carries no component', () => {
    expect(importLineFor(undefined)).toBeNull();
    expect(importLineFor('')).toBeNull();
  });
});

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (repoPath) => fs.readFileSync(path.join(REPO_ROOT, repoPath), 'utf8');

/**
 * The glob the tabs module runs, rebuilt from disk with the same keys Vite
 * gives it (paths relative to `docs-tabs.jsx`) and the raw text as the value.
 */
function rawGlob(repoPaths) {
  return Object.fromEntries(
    repoPaths.map((p) => [p.replace(/^design-system\/src\//, '../').replace(/^design-system\//, '../../'), read(p)]),
  );
}

describe('the Agent view tab', () => {
  const MODAL = 'design-system/src/components/messaging/Modal/index.md';
  const FIELDSET = 'design-system/src/components/forms-and-inputs/Fieldset.md';
  const PATTERN = 'design-system/src/patterns/PatternModal/index.md';
  const PATTERN_PAGE = 'design-system/agent-views/pages/patterns/Filtering.md';
  const modules = rawGlob([MODAL, FIELDSET, PATTERN, PATTERN_PAGE]);

  it('shows exactly the generated file for a nested component', () => {
    const entry = agentViewEntry(modules, {
      importPath: './design-system/src/components/messaging/Modal/Modal.stories.jsx',
    });
    expect(entry.path).toBe(MODAL);
    expect(entry.name).toBe('Modal');
    expect(entry.value).toBe(read(MODAL));
    expect(entry.value.startsWith('<!-- DO NOT EDIT BY HAND. Generated by npm run generate:component-docs -->')).toBe(true);
  });

  it('shows exactly the generated file for a flat component', () => {
    const entry = agentViewEntry(modules, {
      importPath: './design-system/src/components/forms-and-inputs/Fieldset.stories.jsx',
    });
    expect(entry).toMatchObject({ path: FIELDSET, name: 'Fieldset' });
    expect(entry.value).toBe(read(FIELDSET));
  });

  it('shows exactly the generated file for a pattern', () => {
    const entry = agentViewEntry(modules, {
      importPath: './design-system/src/patterns/PatternModal/PatternModal.stories.jsx',
    });
    expect(entry).toMatchObject({ path: PATTERN, name: 'PatternModal' });
    expect(entry.value).toBe(read(PATTERN));
  });

  it('shows the generated agent file for a docs-only pattern page', () => {
    const entry = agentViewEntry(modules, {
      importPath: './design-system/src/storybook-docs/patterns/Filtering/Filtering.stories.jsx',
    });
    expect(entry).toMatchObject({ path: PATTERN_PAGE, name: 'Filtering' });
    expect(entry.value).toBe(read(PATTERN_PAGE));
    expect(repoPathOfGlobKey('../../agent-views/pages/patterns/Filtering.md')).toBe(PATTERN_PAGE);
  });

  it('is absent for a pattern page with no generated file beside it', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, 'design-system/src/patterns/PageTemplates/index.md'))).toBe(false);
    expect(
      agentViewEntry(modules, { importPath: './design-system/src/patterns/PageTemplates/PageTemplates.stories.jsx' }),
    ).toBeNull();
  });

  it('is absent when the page has no generated file', () => {
    expect(agentViewEntry(modules, { importPath: './design-system/src/styles/Colors.stories.jsx' })).toBeNull();
    expect(agentViewEntry(modules, {})).toBeNull();
    expect(generatedDocPathFor(undefined)).toBeNull();
  });

  it('maps glob keys back to repo paths', () => {
    expect(repoPathOfGlobKey('../components/messaging/Modal/index.md')).toBe(MODAL);
  });

  it('reports a problem as a new issue naming only the component and its file', () => {
    const url = new URL(reportProblemUrl('Modal', MODAL));
    expect(`${url.origin}${url.pathname}`).toBe('https://github.com/BilLogic/plus-uno/issues/new');
    expect([...url.searchParams.keys()].sort()).toEqual(['body', 'title']);
    expect(url.searchParams.get('title')).toContain('Modal');
    expect(url.searchParams.get('body')).toContain(MODAL);
  });

  it('renders a rule id as a label and leaves every other line as written', () => {
    const text = '## Best practices\n\n### Give the footer a button. {#give-the-footer-a-button}\n\nBody with {braces}.\n';
    expect(agentViewMarkdown(text)).toBe(
      '## Best practices\n\n### Give the footer a button. <span class="sb-ds-agent-view__rule-id">#give-the-footer-a-button</span>\n\nBody with {braces}.\n',
    );
  });

  it('renders every rule id in the Modal file and nothing else', () => {
    const text = read(MODAL);
    const ids = text.match(/\{#[a-z0-9-]+\}$/gm) ?? [];
    expect(ids.length).toBeGreaterThan(0);
    const rendered = agentViewMarkdown(text);
    expect(rendered).not.toMatch(/\{#[a-z0-9-]+\}$/m);
    expect(rendered.split('\n').length).toBe(text.split('\n').length);
  });

  it('anchors a rule heading at its rule id and leaves other headings to the renderer', () => {
    const heading = agentViewMarkdown('### Give the footer a button. {#give-the-footer-a-button}').replace(/^### /, '');
    expect(agentViewSlug(heading, () => 'fallback')).toBe('give-the-footer-a-button');
    expect(agentViewSlug('Best practices', (s) => s.toLowerCase().replace(/ /g, '-'))).toBe('best-practices');
  });
});
