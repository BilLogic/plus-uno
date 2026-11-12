/**
 * The render half of the docs landing: what a reader or a screen reader gets,
 * run in the Storybook tests in a real browser, where the hero's size and the
 * two color-mode panes are real. The jsdom half is `DocsLanding.test.jsx`.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/docs-landing/DocsLanding.stories.jsx
 */
import React from 'react';
import { expect, within } from 'storybook/test';

import { DocsLanding } from './DocsLanding.jsx';
import { HEROES } from './hero-registry.jsx';

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it. Every covered page opens with this block.
  title: 'Get started/Docs landing',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const Page = () => (
  <div className="sbdocs">
    <DocsLanding
      page="foundations-color"
      eyebrow="Foundation"
      title="Color"
      purpose="Every color is a --ds token named for its job."
      links={{ label: 'Tokens', items: [{ title: 'Roles', href: '#foundation-roles' }] }}
    />
  </div>
);

const before = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/** Foundations · Color, in the order a reader meets it. */
export const Color = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const eyebrow = canvas.getByText('Foundation');
    const h1 = canvas.getByRole('heading', { level: 1, name: 'Color' });
    const purpose = canvas.getByText(/Every color is a/);
    const nav = canvas.getByRole('navigation', { name: 'Tokens' });
    const hero = canvas.getByRole('img', { name: HEROES['foundations-color'].description });

    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(before(eyebrow, h1) && before(h1, purpose) && before(purpose, nav) && before(nav, hero)).toBe(true);
    await expect(canvas.getByRole('link', { name: 'Roles' })).toHaveAttribute('href', '#foundation-roles');
  },
};

/** The hero is a 5:2 frame, draws no text, and shows both color modes at once. */
export const Hero = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector('[data-hero="foundations-color"]');
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
