/**
 * The component tabs' pure half (#168).
 *
 * The tabs themselves are manager-side React and only exist inside a running
 * Storybook. Everything that can be wrong without a browser is in
 * `.storybook/addons/component-tabs/contract.js`: which entries count as
 * components, where their files sit, and what a changelog entry has to look
 * like before it is rendered. That is what this file holds to.
 *
 * It lives in the design-system package because `npm test` is the only test
 * command the repo has; it asserts properties of a ROOT-level module, the same
 * arrangement `storybook-vitest-project.test.js` uses.
 */
import { describe, it, expect } from 'vitest';

import {
  CHANGELOG_ADOPTED,
  CHANGELOG_KINDS,
  PREVIEW_TABS,
  TAB_IDS,
  componentIdentity,
  normaliseChangelog,
} from '../../.storybook/addons/component-tabs/contract.js';

describe('componentIdentity', () => {
  it('reads a nested component out of its story path', () => {
    expect(
      componentIdentity({
        title: 'Components/Actions/Button',
        importPath: './design-system/src/components/actions/Button/Button.stories.jsx',
      }),
    ).toEqual({
      name: 'Button',
      group: 'actions',
      dir: 'design-system/src/components/actions/Button',
      source: 'design-system/src/components/actions/Button/Button.jsx',
      generatedDoc: 'design-system/src/components/actions/Button/index.md',
      groupIndex: 'design-system/src/components/actions/index.md',
      entryFile: 'design-system/src/components/actions/Button/Button.stories.jsx',
    });
  });

  it('reads the same component out of its MDX page', () => {
    const fromMdx = componentIdentity({
      title: 'Components/Actions/Button',
      importPath: './design-system/src/components/actions/Button/Button.mdx',
    });
    expect(fromMdx.name).toBe('Button');
    expect(fromMdx.generatedDoc).toBe('design-system/src/components/actions/Button/index.md');
  });

  it('reads a flat component, whose generated doc is <Name>.md beside the source', () => {
    expect(
      componentIdentity({
        title: 'Components/Forms and inputs/Switch',
        importPath: './design-system/src/components/forms-and-inputs/Switch.stories.jsx',
      }),
    ).toEqual({
      name: 'Switch',
      group: 'forms-and-inputs',
      dir: 'design-system/src/components/forms-and-inputs',
      source: 'design-system/src/components/forms-and-inputs/Switch.jsx',
      generatedDoc: 'design-system/src/components/forms-and-inputs/Switch.md',
      groupIndex: 'design-system/src/components/forms-and-inputs/index.md',
      entryFile: 'design-system/src/components/forms-and-inputs/Switch.stories.jsx',
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
    expect(componentIdentity({ title: 'Components/Actions/Button' })).toBeNull();
  });
});

describe('normaliseChangelog', () => {
  it('is empty for a component that has declared nothing', () => {
    expect(normaliseChangelog(undefined)).toEqual([]);
    expect(normaliseChangelog([])).toEqual([]);
    expect(normaliseChangelog('2026-08-26 shipped')).toEqual([]);
  });

  it('orders entries newest first', () => {
    const entries = normaliseChangelog([
      { date: '2026-08-01', kind: 'added', summary: 'first' },
      { date: '2026-09-01', kind: 'fixed', summary: 'second' },
    ]);
    expect(entries.map((e) => e.summary)).toEqual(['second', 'first']);
  });

  it('drops an entry that is missing a date or a summary', () => {
    expect(
      normaliseChangelog([
        { kind: 'added', summary: 'no date' },
        { date: 'last Tuesday', summary: 'no ISO date' },
        { date: '2026-08-26', summary: '   ' },
        { date: '2026-08-26', summary: 'kept' },
      ]).map((e) => e.summary),
    ).toEqual(['kept']);
  });

  it('leaves an unrecognised kind off rather than inventing one', () => {
    const [entry] = normaliseChangelog([
      { date: '2026-08-26', kind: 'refactored', summary: 'moved' },
    ]);
    expect(entry.kind).toBeNull();
    expect(CHANGELOG_KINDS).toContain('added');
  });
});

describe('the tab contract', () => {
  it('declares four tabs, in Atlassian order, with the canvas renamed', () => {
    expect(Object.keys(PREVIEW_TABS)).toEqual([
      'canvas',
      TAB_IDS.code,
      TAB_IDS.usage,
      TAB_IDS.changelog,
    ]);
    expect(Object.values(PREVIEW_TABS).map((t) => t.title)).toEqual([
      'Examples',
      'Code',
      'Usage',
      'Changelog',
    ]);
    expect(Object.values(PREVIEW_TABS).map((t) => t.index)).toEqual([0, 1, 2, 3]);
  });

  it('states the adoption date once, as an ISO date', () => {
    expect(CHANGELOG_ADOPTED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
