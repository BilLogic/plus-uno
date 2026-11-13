import React, { useId } from 'react';

/** Small drawing helpers the motion scenes share. No paint here: color comes from the kit. */

export const VIEW = '0 0 160 100';
export const mix = (a, b, t) => a + (b - a) * t;

/** A group moved by (`x`, `y`) and faded to `opacity`. */
export const Moved = ({ x = 0, y = 0, opacity = 1, children }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {children}
  </g>
);

/** Shows only what lies inside a rectangle: a layer entering from an edge. */
export const Clip = ({ x, y, w, h, children }) => {
  const id = useId().replace(/:/g, '');
  return (
    <>
      <clipPath id={id}>
        <rect x={x} y={y} width={Math.max(0, w)} height={Math.max(0, h)} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
};
