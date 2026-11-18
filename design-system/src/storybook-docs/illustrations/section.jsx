import React from 'react';
import { Illustration } from './Illustration.jsx';
import { ButtonShape, Row, SkeletonBar, Tabs } from './primitives.jsx';

/**
 * The Section template's placement drawings for the title row and the header rows.
 * The lesson is where a part sits with every word removed, so both figures are
 * blocked out on one shared canvas.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    {children}
  </Illustration>
);

/** A title row: the title bar and a one-line description under it. */
const TitleRow = ({ y, accent = false, w = 48 }) => (
  <g>
    <SkeletonBar x={X} y={y} w={w} h={6} accent={accent} heading />
    <SkeletonBar x={X} y={y + 10} w={w * 1.5} />
  </g>
);

/** The views row: Tabs hugging the start, the first selected. `y` is the bar's top edge. */
const Pills = ({ x = X, y, count = 2 }) => <Tabs x={x} y={y - 4} w={count * 24} count={count} />;

/** Table rows under the bar. */
const Rows = ({ y, count = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => <Row key={i} x={X} y={y + i * 15} w={INNER} />)}
  </g>
);

/** Title row first, the header rows under it, one left edge. */
export const TitleRowAboveHeaderRows = ({ title = 'A Section with its title row on top and the header rows under it, both starting at one left edge' }) => (
  <Canvas title={title}>
    <TitleRow y={8} accent />
    <Pills y={30} />
    <ButtonShape x={W - X - 28} y={30} w={28} />
    <Rows y={46} />
  </Canvas>
);

/** The title pushed into the views row, fighting the pills for the start. */
export const TitleInViewsRow = ({ title = 'A Section whose title sits inside the views row, crowding the pills, with no room for a description' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={10} w={36} h={6} accent heading />
    <Pills x={X + 42} y={9} />
    <ButtonShape x={W - X - 28} y={9} w={28} />
    <Rows y={26} count={4} />
  </Canvas>
);
