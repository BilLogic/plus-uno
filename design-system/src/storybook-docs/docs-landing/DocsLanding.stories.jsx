/**
 * The render half of the docs landing: what a reader or a screen reader gets,
 * run in the Storybook tests in a real browser, where the hero's size and the
 * two color-mode panes are real. The jsdom half is `DocsLanding.test.jsx`.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/docs-landing/DocsLanding.stories.jsx
 */
import React from 'react';
import { expect } from 'storybook/test';

import { DocsLanding } from './DocsLanding.jsx';
import { HEROES } from './hero-registry.jsx';

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it. Every covered page opens with this block.
  title: 'Get started/Docs landing',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const Page = ({ children }) => (
  <div className="sbdocs">
    <DocsLanding
      page="foundations-visual-color"
      eyebrow="Foundation"
      title="Color"
      purpose="Every color is a --ds token named for its job."
      links={{ label: 'Tokens', items: [{ title: 'Roles', href: '#foundation-roles' }] }}
    />
    {children}
  </div>
);

/** Browser-only checks: the hero is a 5:2 frame, draws no text, shows both color modes, and the landing keeps its own gap below. (Order and names are in DocsLanding.test.jsx.) */
export const Hero = {
  render: () => (
    <Page>
      <div className="sb-docs-section" data-testid="next" />
    </Page>
  ),
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector('[data-hero="foundations-visual-color"]');
    const landing = canvasElement.querySelector('[data-docs-landing]');
    const next = canvasElement.querySelector('[data-testid="next"]');
    const gap = next.getBoundingClientRect().top - landing.getBoundingClientRect().bottom;
    const probe = Object.assign(document.createElement('div'), { style: 'position:absolute;block-size:var(--page-stack-lg)' });
    document.body.append(probe);
    await expect(Math.abs(gap - probe.getBoundingClientRect().height)).toBeLessThan(1);
    probe.remove();
    const { width, height } = hero.getBoundingClientRect();
    await expect(Math.abs(width / height - 2.5)).toBeLessThan(0.02);
    await expect(document.createTreeWalker(hero, NodeFilter.SHOW_TEXT).nextNode()).toBeNull();
    await expect(hero.querySelector('[data-color-mode="light"]')).not.toBeNull();
    await expect(hero.querySelector('[data-color-mode="dark"]')).not.toBeNull();
    // Each half paints its own ground, so neither disappears in the other mode.
    const [light, dark] = ['light', 'dark'].map((m) => getComputedStyle(hero.querySelector(`[data-color-mode="${m}"]`)).backgroundColor);
    await expect(light).not.toBe(dark);
  },
};
