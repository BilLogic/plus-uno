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
import { describe, it, expect } from 'vitest';

import {
  TABS,
  TABBED_EXCEPTIONS,
  isTabbedDocsPage,
  TAB_IDS,
  componentIdentity,
  importLineFor,
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
  it('declares three tabs, with Examples first and unparameterized', () => {
    expect(TABS.map((t) => t.key)).toEqual(['examples', 'code', 'usage']);
    expect(TABS.map((t) => t.title)).toEqual(['Examples', 'Code', 'Usage']);
    // Examples is the DEFAULT tab, so it carries no query param — the addon tabs
    // behaved the same way, and those URLs are still in circulation.
    expect(TABS[0].id).toBeNull();
    expect(TABS.slice(1).map((t) => t.id)).toEqual(['plus-code', 'plus-usage']);
  });

});

describe('importLineFor', () => {
  it('names the component from the barrel, the only public import path', () => {
    expect(importLineFor('Button')).toBe("import { Button } from '@/components';");
  });

  it('falls back to nothing when the meta carries no component', () => {
    expect(importLineFor(undefined)).toBeNull();
    expect(importLineFor('')).toBeNull();
  });
});
