import React, { createContext, useEffect, useRef } from 'react';
import { devWarn } from '../../lib/devWarn.js';

export const MAX_LABELED_ZONES = 3;
export const ZoneBudgetContext = createContext(null);

const warnIllustration = devWarn('Illustration');

/**
 * The one SVG wrapper every kit drawing sits in. A drawing carries no visible
 * text, so its meaning travels in `title` (read by screen readers) and in the
 * caption beside it, which lives outside the SVG.
 */
export const Illustration = ({ width, height, viewBox, title, capped = true, scale = 2, children }) => {
  const box = viewBox ?? `0 0 ${width} ${height}`;
  // One viewBox unit is 2px of product UI for half-scale drawings (`scale = 2`),
  // or 1px for 1:1 construction diagrams (`scale = 1`).
  const natural = Number(box.split(/\s+/)[2]) * scale;
  const svgRef = useRef(null);
  const zoneRegistry = new Map();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const count = svgRef.current?.querySelectorAll('[data-zone-label]').length ?? 0;
    if (count > MAX_LABELED_ZONES) {
      warnIllustration(`found ${count} labeled zones in one figure; keep to at most ${MAX_LABELED_ZONES}.`);
    }
  });

  return (
    <ZoneBudgetContext.Provider value={zoneRegistry}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={box}
        role="img"
        aria-label={title}
        style={{
          display: 'block',
          inlineSize: '100%',
          blockSize: 'auto',
          ...(capped ? { maxInlineSize: `${natural}px`, marginInline: 'auto' } : null),
        }}
      >
        <title>{title}</title>
        {children}
      </svg>
    </ZoneBudgetContext.Provider>
  );
};

/** A drawing over its caption, on the raised surface the docs use for figures. */
export const IllustrationFigure = ({ caption, children }) => (
  <figure
    style={{
      margin: 0,
      padding: 'var(--card-pad)',
      background: 'var(--ds-surface)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--ds-shadow-raised)',
    }}
  >
    {children}
    {caption && (
      <figcaption
        style={{ marginBlockStart: 'var(--stack-sm)', font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}
      >
        {caption}
      </figcaption>
    )}
  </figure>
);
