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
import { Illustration, IllustrationFigure } from './illustrations/Illustration.jsx';
import { ThreeLayers, OpeningARecord, ResponsiveReflow } from './illustrations/compositions.jsx';
import { PAINT } from './illustrations/paint.js';
import {
  Baseline as BaselinePart,
  Columns as ColumnsPart,
  ControlConstruction as ControlConstructionFigure,
  CoreSizeMatrix as CoreSizeMatrixFigure,
  MAX_LABELED_ZONES,
  Measure as MeasurePart,
  ScaleStrip as ScaleStripFigure,
  Zone as ZonePart,
} from './illustrations/construction.jsx';

export default {
  // A test harness, not a page: `!dev` keeps it out of the sidebar while the
  // Storybook tests still run it. The page itself is Get started/Illustration kit.
  title: 'Get started/Illustration kit',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const PAINTED = ['fill', 'stroke'];
const TOKEN_OR_NONE = /^(?:var\(--(?:ds-|chart-)[\w-]+\)|none)$/;

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
    // The Sidebar docks at 1280 (an edge line), collapses at 960, and floats on a Blanket at 768.
    const has = (svg, token) => svg.outerHTML.includes(token);
    await expect(has(svgs[0], '--ds-blanket')).toBe(false);
    await expect(has(svgs[1], '--ds-blanket')).toBe(false);
    await expect(has(svgs[2], '--ds-blanket')).toBe(true);
    await expect(has(svgs[2], '--ds-shadow-overlay')).toBe(true);
    // The Section's side column sits beside the body only at 1280: one Section fewer below.
    const sections = (svg) => svg.querySelectorAll('[data-part="section"]').length;
    await expect(sections(svgs[0])).toBe(2);
    await expect(sections(svgs[1])).toBe(1);
    await expect(sections(svgs[2])).toBe(1);
  },
};

export const Measure = {
  render: () => (
    <IllustrationFigure caption="Measure: magenta brackets for height (size-200) and width (space-500)">
      <Illustration viewBox="0 0 280 120" scale={1} title="Measure brackets on a box for height and width">
        <rect
          x={96}
          y={28}
          width={80}
          height={32}
          fill={PAINT.buttonDefault}
          style={{ rx: 'var(--radius-control-md)', ry: 'var(--radius-control-md)' }}
        />
        <rect
          x={112}
          y={38}
          width={48}
          height={12}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <MeasurePart x={84} y={28} h={32} label="size-200" side="left" />
        <MeasurePart x={96} y={72} w={80} axis="horizontal" label="space-500" side="bottom" />
      </Illustration>
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const box = svg.querySelector('rect');
    await expect(Number(box.getAttribute('width'))).toBe(80);
    await expect(Number(box.getAttribute('height'))).toBe(32);
    const measures = [...svg.querySelectorAll('[data-part="measure"]')];
    await expect(measures.length).toBe(2);
    await expect(measures[0].getAttribute('data-axis')).toBe('vertical');
    await expect(measures[1].getAttribute('data-axis')).toBe('horizontal');
    const line = measures[0].querySelector('line');
    await expect(line.getAttribute('stroke')).toBe('var(--ds-border-accent-magenta)');
    await expect(Math.abs(Number(line.getAttribute('y2')) - Number(line.getAttribute('y1')))).toBe(32);
    const hLine = measures[1].querySelector('line');
    await expect(Math.abs(Number(hLine.getAttribute('x2')) - Number(hLine.getAttribute('x1')))).toBe(80);
    const label = measures[0].querySelector('text');
    await expect(label.getAttribute('fill')).toBe('var(--ds-text-accent-magenta)');
    await expect(parseFloat(getComputedStyle(label).fontSize)).toBe(12);
  },
};

export const Zone = {
  render: () => (
    <IllustrationFigure caption="Zone: tinted gap and translucent pad overlay with outside labels joined by dashed leaders">
      <Illustration viewBox="0 0 360 156" scale={1} title="A card with translucent pad overlay and gap zone">
        <rect
          x={24}
          y={16}
          width={200}
          height={120}
          fill={PAINT.cardSurface}
          stroke={PAINT.pageEdge}
          style={{ rx: 'var(--card-radius)', ry: 'var(--card-radius)' }}
        />
        <rect
          x={40}
          y={32}
          width={120}
          height={16}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <ZonePart
          x={40}
          y={48}
          w={168}
          h={12}
          label="space-075"
          labelPos={{ x: 244, y: 54, anchor: 'start' }}
          leader={{ x1: 208, y1: 54, x2: 238, y2: 54 }}
        />
        <rect
          x={40}
          y={60}
          width={140}
          height={12}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <ZonePart
          kind="pad"
          x={24}
          y={16}
          w={200}
          h={120}
          radius="var(--card-radius)"
          inner={{ x: 40, y: 32, w: 168, h: 88 }}
          label="space-100"
          labelPos={{ x: 244, y: 24, anchor: 'start' }}
          leader={{ x1: 216, y1: 24, x2: 238, y2: 24 }}
        />
      </Illustration>
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const zones = [...svg.querySelectorAll('[data-part="zone"]')];
    await expect(zones.length).toBe(2);
    const pad = svg.querySelector('[data-zone-kind="pad"] path');
    await expect(pad).not.toBeNull();
    await expect(pad.getAttribute('fill')).toBe('var(--ds-background-accent-magenta-subtler)');
    await expect(pad.getAttribute('fill-rule')).toBe('evenodd');
    await expect(Number(pad.getAttribute('opacity'))).toBeLessThan(1);
    const labels = svg.querySelectorAll('[data-zone-label]');
    await expect(labels.length).toBeLessThanOrEqual(MAX_LABELED_ZONES);
  },
};

export const ZoneLabelCap = {
  render: () => (
    <IllustrationFigure caption="Zone label cap: two Zone instances inside one figure stay capped at three labels total">
      <Illustration viewBox="0 0 360 156" scale={1} title="Two Zone instances in one figure capped at three labels total">
        <rect
          x={24}
          y={16}
          width={200}
          height={120}
          fill={PAINT.cardSurface}
          stroke={PAINT.pageEdge}
          style={{ rx: 'var(--card-radius)', ry: 'var(--card-radius)' }}
        />
        <ZonePart
          x={40}
          y={44}
          w={168}
          h={12}
          labels={[
            { text: 'space-075', x: 244, y: 50, anchor: 'start', leader: { x1: 208, y1: 50, x2: 238, y2: 50 } },
            { text: 'space-100', x: 244, y: 74, anchor: 'start', leader: { x1: 208, y1: 74, x2: 238, y2: 74 } },
          ]}
        />
        <ZonePart
          kind="pad"
          x={24}
          y={16}
          w={200}
          h={120}
          radius="var(--card-radius)"
          inner={{ x: 40, y: 32, w: 168, h: 88 }}
          labels={[
            { text: 'space-150', x: 244, y: 24, anchor: 'start', leader: { x1: 216, y1: 24, x2: 238, y2: 24 } },
            { text: 'space-200', x: 244, y: 100, anchor: 'start', leader: { x1: 216, y1: 100, x2: 238, y2: 100 } },
          ]}
        />
      </Illustration>
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const zones = [...svg.querySelectorAll('[data-part="zone"]')];
    await expect(zones.length).toBeGreaterThanOrEqual(2);
    const labels = [...svg.querySelectorAll('[data-zone-label]')];
    await expect(labels.length).toBeLessThanOrEqual(MAX_LABELED_ZONES);
    await expect(labels.length).toBe(MAX_LABELED_ZONES);
  },
};

export const Baseline = {
  render: () => (
    <IllustrationFigure caption="Baseline: a 4-unit hairline grid behind skeleton lines (16 body, 12 small)">
      <Illustration viewBox="0 0 280 96" scale={1} title="Skeleton text lines resting on a 4-unit baseline grid">
        <BaselinePart x={0} y={0} w={280} h={96} step={4} />
        <rect
          x={24}
          y={16}
          width={200}
          height={16}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <rect
          x={24}
          y={40}
          width={180}
          height={16}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <rect
          x={24}
          y={64}
          width={120}
          height={12}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
      </Illustration>
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const grid = svg.querySelector('[data-part="baseline"]');
    await expect(grid).not.toBeNull();
    const lines = grid.querySelectorAll('line');
    await expect(lines.length).toBe(25);
    await expect(lines[0].getAttribute('stroke')).toBe('var(--ds-background-accent-magenta-subtler)');
  },
};

export const Columns = {
  render: () => (
    <IllustrationFigure caption="Columns: twelve grid columns laid over two cards in --ds-background-accent-blue-subtler">
      <Illustration viewBox="0 0 460 120" scale={1} title="Two cards spanned across twelve grid columns">
        <rect
          x={16}
          y={16}
          width={206}
          height={88}
          fill={PAINT.cardSurface}
          stroke={PAINT.pageEdge}
          style={{ rx: 'var(--card-radius)', ry: 'var(--card-radius)' }}
        />
        <rect
          x={238}
          y={16}
          width={206}
          height={88}
          fill={PAINT.cardSurface}
          stroke={PAINT.pageEdge}
          style={{ rx: 'var(--card-radius)', ry: 'var(--card-radius)' }}
        />
        <rect
          x={32}
          y={36}
          width={140}
          height={16}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <rect
          x={254}
          y={36}
          width={120}
          height={12}
          fill={PAINT.placeholderText}
          style={{ rx: 'var(--radius-md)', ry: 'var(--radius-md)' }}
        />
        <ColumnsPart x={16} y={0} w={428} h={120} columns={12} gutter={16} />
      </Illustration>
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const cols = svg.querySelector('[data-part="columns"]');
    await expect(cols).not.toBeNull();
    const rects = cols.querySelectorAll('rect');
    await expect(rects.length).toBe(12);
    await expect(rects[0].getAttribute('fill')).toBe('var(--ds-background-accent-blue-subtler)');
  },
};

export const ScaleStrip = {
  render: () => (
    <IllustrationFigure caption="Scale strip: the quarter-rem space ladder as bars; core sizes outlined">
      <ScaleStripFigure />
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const steps = svg.querySelectorAll('[data-scale-step]');
    await expect(steps.length).toBe(11);
    const core = svg.querySelectorAll('[data-core-size]');
    await expect(core.length).toBe(5);
  },
};

export const CoreSizeMatrix = {
  render: () => (
    <IllustrationFigure caption="Core-size matrix: 16, 24, 32, 40 and 48 across Step, Button, Field, Row, Media and Icon">
      <CoreSizeMatrixFigure />
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const matrix = canvasElement.querySelector('[data-figure="core-size-matrix"]');
    await expect(matrix).not.toBeNull();
    await expect(matrix.querySelectorAll('[data-matrix-col]').length).toBe(5);
    await expect(matrix.querySelectorAll('[data-matrix-row]').length).toBe(6);
    const buttonRow = matrix.querySelector('[data-matrix-row="button"]');
    const buttonRects = [...buttonRow.querySelectorAll('svg rect')];
    await expect(buttonRects[0].style.rx).toContain('--button-radius-compact');
    await expect(buttonRects[2].style.rx).toContain('--button-radius-default');
    await expect(buttonRects[3].getAttribute('fill')).toBe('var(--ds-skeleton)');
    await expect(buttonRects[3].getAttribute('opacity')).toBeNull();
    await expect(buttonRects[4].style.rx).toContain('--button-radius-spacious');
    const fieldRow = matrix.querySelector('[data-matrix-row="field"]');
    const fieldBars = [...fieldRow.querySelectorAll('svg rect:nth-child(2)')];
    await expect(fieldBars.length).toBe(2);
    for (const bar of fieldBars) {
      await expect(bar.getAttribute('x')).toBe('12');
    }
    const rowGroup = matrix.querySelector('[data-matrix-row="row"]');
    await expect(rowGroup.querySelectorAll('[data-row-edge="top"]').length).toBe(3);
    await expect(rowGroup.querySelectorAll('[data-row-edge="bottom"]').length).toBe(3);
    for (const svg of matrix.querySelectorAll('svg')) {
      await expect(everyPaintIsAToken(svg)).toBe(true);
    }
  },
};

export const ControlConstruction = {
  render: () => (
    <IllustrationFigure caption="Building a control: a 32 Button built from 6 + 20 + 6 with 12 pad-x, and a 20 Tag built from 2 + 16 + 2 with 4 pad-x">
      <ControlConstructionFigure />
    </IllustrationFigure>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(everyPaintIsAToken(svg)).toBe(true);
    const buttonRect = svg.querySelector('[data-control="button"]');
    await expect(buttonRect).not.toBeNull();
    await expect(buttonRect.style.rx).toContain('--button-radius-default');
    const tagRect = svg.querySelector('[data-control="tag"]');
    await expect(tagRect).not.toBeNull();
    await expect(tagRect.getAttribute('height')).toBe('80');
    await expect(tagRect.style.rx).toContain('--radius-md');
    const clipRects = [...svg.querySelectorAll('[data-zone-kind="pad"] clipPath rect')];
    await expect(clipRects.length).toBe(2);
    await expect(clipRects[0].style.rx).toContain('--button-radius-default');
    await expect(clipRects[1].style.rx).toContain('--radius-md');
    await expect(svg.querySelectorAll('[data-part="measure"]').length).toBe(4);
    await expect(svg.querySelectorAll('[data-part="zone"]').length).toBe(2);
    await expect(svg.querySelectorAll('[data-zone-label]').length).toBe(3);
    await expect(svg.textContent).toContain('size-200');
    await expect(svg.textContent).toContain('size-125');
    await expect(svg.textContent).toContain('size-100');
    await expect(svg.textContent).toContain('space-0375');
    await expect(svg.textContent).toContain('space-075');
    await expect(svg.textContent).toContain('space-0125 · space-025');
  },
};
