/**
 * The render half of the illustration kit: what a reader or screen reader gets
 * from the drawings, run in the Storybook tests. The token-only rule itself is
 * `npm run check:docs-token-literals`; this checks the result in a browser.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/IllustrationKit.stories.jsx
 */
import React from 'react';
import { expect } from 'storybook/test';

import { IllustrationKitGallery, PRIMITIVE_NAMES } from './illustrations/IllustrationKitGallery.jsx';
import { IllustrationFigure } from './illustrations/Illustration.jsx';
import { ThreeLayers, OpeningARecord, ResponsiveReflow } from './illustrations/compositions.jsx';

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it. The page itself is Get started/Illustration kit.
  title: 'Get started/Illustration kit',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const PAINTED = ['fill', 'stroke'];
const TOKEN_OR_NONE = /^(?:var\(--ds-[\w-]+\)|none)$/;

const everyPaintIsAToken = (svg) =>
  [...svg.querySelectorAll('*')].every((el) =>
    PAINTED.every((attr) => !el.hasAttribute(attr) || TOKEN_OR_NONE.test(el.getAttribute(attr))),
  );

export const Primitives = {
  render: () => <IllustrationKitGallery />,
  play: async ({ canvasElement }) => {
    const figures = canvasElement.querySelectorAll('[data-illustration-kit] figure');
    await expect(figures.length).toBe(PRIMITIVE_NAMES.length);
    for (const figure of figures) {
      const svg = figure.querySelector('svg[role="img"]');
      await expect(svg.getAttribute('aria-label')).toMatch(/neutral above and accented below/);
      // Words appear only on a real-fidelity subject.
      await expect(svg.querySelectorAll('text:not([data-fidelity="real"] text)').length).toBe(0);
      await expect(everyPaintIsAToken(svg)).toBe(true);
      // The accented half paints the brand token; the neutral half never does.
      const [neutral, accented] = svg.querySelectorAll(':scope > svg');
      const usesAccent = (node) => node.outerHTML.includes('--ds-background-brand-bold');
      await expect(usesAccent(neutral)).toBe(false);
      await expect(usesAccent(accented)).toBe(true);
      await expect(figure.querySelector('figcaption').textContent.length).toBeGreaterThan(0);
    }
  },
};

const Compositions = () => (
  <>
    <IllustrationFigure caption="Three layers">
      <ThreeLayers />
    </IllustrationFigure>
    <IllustrationFigure caption="Opening a record">
      <OpeningARecord />
    </IllustrationFigure>
  </>
);

export const OpeningPageDrawings = {
  render: () => <Compositions />,
  play: async ({ canvasElement }) => {
    const figures = [...canvasElement.querySelectorAll('figure')];
    await expect(figures.length).toBe(2);
    for (const figure of figures) {
      const svg = figure.querySelector('svg[role="img"]');
      // A name for screen readers, a caption outside the drawing, and no words inside it.
      await expect(svg.getAttribute('aria-label').length).toBeGreaterThan(20);
      await expect(svg.querySelector('title').textContent).toBe(svg.getAttribute('aria-label'));
      await expect(svg.querySelectorAll('text:not([data-fidelity="real"] text)').length).toBe(0);
      await expect(figure.querySelector('figcaption').closest('svg')).toBeNull();
      await expect(everyPaintIsAToken(svg)).toBe(true);
    }
    // One accent marks only the subject: the three-layers button repeats, the rest stay neutral.
    const accentCount = (svg) => svg.outerHTML.split('--ds-background-brand-bold').length - 1;
    await expect(accentCount(figures[0].querySelector("svg"))).toBe(3);
    await expect(accentCount(figures[1].querySelector('svg'))).toBeGreaterThanOrEqual(4);
  },
};

export const ResponsiveReflowDrawings = {
  render: () => (
    <>
      {[1280, 960, 768].map((width) => (
        <IllustrationFigure key={width} caption={`${width} wide`}>
          <ResponsiveReflow width={width} />
        </IllustrationFigure>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    const figures = [...canvasElement.querySelectorAll('figure')];
    await expect(figures.length).toBe(3);
    const svgs = figures.map((figure) => figure.querySelector('svg[role="img"]'));
    for (const svg of svgs) {
      await expect(svg.querySelectorAll('text').length).toBe(0);
      await expect(everyPaintIsAToken(svg)).toBe(true);
    }
    // The Sidebar docks at 1280 (an edge line), collapses at 960, and floats on a Backdrop at 768.
    const has = (svg, token) => svg.outerHTML.includes(token);
    await expect(has(svgs[0], '--ds-blanket')).toBe(false);
    await expect(has(svgs[1], '--ds-blanket')).toBe(false);
    await expect(has(svgs[2], '--ds-blanket')).toBe(true);
    await expect(has(svgs[2], '--ds-shadow-overlay')).toBe(true);
    // The Section's side column sits beside the body only at 1280: one Section fewer below.
    const sections = (svg) => svg.querySelectorAll('rect[fill="var(--ds-surface-sunken)"][style*="--section-radius"]').length;
    await expect(sections(svgs[0])).toBe(2);
    await expect(sections(svgs[1])).toBe(1);
    await expect(sections(svgs[2])).toBe(1);
  },
};
