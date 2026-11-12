import React from 'react';

/**
 * The one SVG wrapper every kit drawing sits in. A drawing carries no visible
 * text, so its meaning travels in `title` (read by screen readers) and in the
 * caption beside it, which lives outside the SVG.
 */
export const Illustration = ({ width, height, viewBox, title, capped = true, children }) => {
  const box = viewBox ?? `0 0 ${width} ${height}`;
  // One viewBox unit is 2px of product UI, so a drawing stops growing at its
  // natural width times two and sits centered in its figure. The gallery passes
  // `capped={false}` and fills its grid cell instead.
  const natural = Number(box.split(/\s+/)[2]) * 2;
  return (
  <svg
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
  );
};

/** A drawing over its caption, on the raised surface the docs use for figures. */
export const IllustrationFigure = ({ caption, children }) => (
  <figure
    style={{
      margin: 0,
      padding: 'var(--card-pad-default)',
      background: 'var(--ds-surface)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--ds-shadow-raised)',
    }}
  >
    {children}
    <figcaption
      style={{ marginBlockStart: 'var(--stack-sm)', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}
    >
      {caption}
    </figcaption>
  </figure>
);
