// @vitest-environment node
/**
 * The Foundations pages draw their Color and Typography blocks from the token
 * stylesheets, not from lists typed into the MDX. These tests hold the blocks'
 * data against the token corpus (`tokenCorpus`, the harness's own reader), so a
 * token added to or removed from the generated files shows up on the page, and
 * a hand-typed name that drifts fails here.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokenCorpus } from '../src/lib/tokens-node.mjs';
import { accentGroups, chartGroups, typeGroups } from '../src/storybook-docs/lib/token-data.mjs';

const read = (rel) => readFileSync(resolve(__dirname, '../src/tokens', rel), 'utf8');
const semantic = read('color/_semantic.scss');
const type = read('_type.scss');
const corpus = tokenCorpus({ prefix: '--' });

const tokensOf = (groups) => groups.flatMap((g) => Object.values(g.colors).map((v) => v.slice(4, -1)));

describe('accent palette', () => {
  const tokens = tokensOf(accentGroups(semantic));
  const expected = [...corpus.keys()].filter((n) => /^--ds-background-accent-.+-(subtlest|subtler|subtle|bolder)$/.test(n));

  it('shows exactly the accent backgrounds the token set defines, once each', () => {
    expect(expected).toHaveLength(44);
    expect([...tokens].sort()).toEqual([...expected].sort());
  });

  it('has one row per hue and every value is a var() of a defined token', () => {
    const groups = accentGroups(semantic);
    expect(new Set(groups.map((g) => g.title)).size).toBe(groups.length);
    for (const t of tokens) expect(corpus.has(t)).toBe(true);
  });
});

describe('chart palette', () => {
  const tokens = tokensOf(chartGroups(semantic));
  const expected = [...corpus.keys()].filter((n) => n.startsWith('--ds-chart-') && !n.endsWith('-hovered'));

  it('shows exactly the chart tokens the token set defines, once each', () => {
    expect(expected.length).toBeGreaterThan(40);
    expect([...tokens].sort()).toEqual([...expected].sort());
  });
});

describe('type scale', () => {
  const groups = typeGroups(type);
  const styles = groups.flatMap((g) => g.styles);
  const expected = [...corpus.keys()].filter((n) => /^--(heading|body|metric)-[a-z]+$/.test(n) && !n.endsWith('-tracking'));

  it('lists every text style the type tokens define, once each', () => {
    expect(expected).toHaveLength(13);
    expect(styles.map((s) => s.token).sort()).toEqual([...expected].sort());
  });

  it('carries each style\'s size, family and weight as the token set resolves them', () => {
    for (const g of groups) {
      for (const s of g.styles) {
        const raw = corpus.get(s.token).raw;
        expect(raw).toContain(`var(${g.weightToken})`);
        expect(raw).toContain(`var(${g.familyToken})`);
        expect(s.lineHeight).toBe(corpus.get(corpus.get(s.token).raw.match(/var\((--line-height-\d+)\)/)[1]).value);
        expect(s.size).toBe(corpus.get(s.sizeToken).value);
        expect(raw).toContain(`var(${s.sizeToken})`);
      }
    }
  });
});
