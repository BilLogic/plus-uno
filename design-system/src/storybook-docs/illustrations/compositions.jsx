import React from 'react';
import { PAINT, HAIRLINE } from './paint.js';
import { Illustration } from './Illustration.jsx';
import {
  Backdrop, ButtonShape, Frame, Modal, Panel, Rect, Rule, Row, Screen, Section, SkeletonBar, pageBody, screenLayout,
} from './primitives.jsx';

/** One dotted joint between two layers. */
const Link = ({ x1, x2, y }) => <Rule x1={x1} x2={x2} y1={y} y2={y} stroke={PAINT.annotation} dash="2 3" />;

/**
 * Component, then template, then pattern, drawn real: the drawing is about
 * which element travels. The accent follows one button
 * through all three layers.
 */
export const ThreeLayers = ({
  title = 'The same primary button as a component, inside a Section template, and placed on a Frame by a pattern',
}) => (
  <Illustration width={312} height={132} viewBox="12 14 312 132" title={title}>
    {/* About which element travels, so the button is drawn real and its context blocked out. */}
    <ButtonShape x={24} y={72} w={56} appearance="primary" label="Save" />
    <Link x1={92} x2={112} y={80} />
    <Section x={118} y={46} w={88} h={66} rows={2} />
    <ButtonShape x={118} y={88} w={34} label="Cancel" />
    <ButtonShape x={156} y={88} w={34} appearance="primary" label="Save" />
    <Link x1={214} x2={234} y={80} />
    <Rect x={236} y={26} w={76} h={108} fill={PAINT.frameSunken} stroke={PAINT.frameDivider} corner="window" />
    <Section x={242} y={32} w={64} h={46} rows={1} />
    <ButtonShape x={274} y={56} w={28} appearance="primary" label="Save" />
    <Section x={242} y={82} w={64} h={46} rows={1} />
    <ButtonShape x={274} y={106} w={28} label="Edit" />
  </Illustration>
);

/**
 * Opening a record, least room to most: expand the row, Section detail, Details
 * Panel, Modal, its own page. Left to right, the lowest step that fits. The
 * lesson is how much of the page each step takes, so the screens are blocked out.
 */
export const OpeningARecord = ({
  title = 'Five ways to open a record, from least room to most: expand the row, a Section detail, a Details Panel, a Modal and its own page',
}) => (
  <Illustration width={364} height={154} viewBox="-8 12 364 154" title={title}>
    {[0, 1, 2, 3, 4].map((i) => {
      const x = 8 + i * 68;
      const y = 28;
      const w = 60;
      const h = 104;
      return (
        <g key={i}>
          <Frame x={x} y={y} w={w} h={h} accent={i === 4} />
          {i === 0 && (
            <>
              <Row x={x + 6} y={y + 10} w={w - 12} />
              <Row x={x + 6} y={y + 24} w={w - 12} accent />
              <SkeletonBar x={x + 10} y={y + 42} w={w * 0.6} />
              <SkeletonBar x={x + 10} y={y + 51} w={w * 0.5} />
              <Row x={x + 6} y={y + 62} w={w - 12} />
              <Row x={x + 6} y={y + 76} w={w - 12} />
            </>
          )}
          {i === 1 && (
            <>
              {[0, 1, 2, 3, 4].map((k) => (
                <SkeletonBar key={k} x={x + 6} y={y + 12 + k * 12} w={w * 0.26} />
              ))}
              <Rect x={x + 6 + w * 0.36} y={y + 8} w={w * 0.64 - 12} h={h - 16} fill={PAINT.sectionSubtleSurface} stroke={PAINT.accent} />
              <SkeletonBar x={x + 12 + w * 0.36} y={y + 16} w={w * 0.3} h={5} accent heading />
              {[0, 1, 2].map((k) => (
                <SkeletonBar key={k} x={x + 12 + w * 0.36} y={y + 30 + k * 9} w={w * 0.32} />
              ))}
            </>
          )}
          {i === 2 && (
            <>
              {[0, 1, 2, 3].map((k) => (
                <SkeletonBar key={k} x={x + 6} y={y + 20 + k * 9} w={w * 0.6} />
              ))}
              <Panel x={x + w - 28} y={y + 6} w={24} h={h - 12} floating accent />
            </>
          )}
          {i === 3 && (
            <>
              {[0, 1, 2, 3].map((k) => (
                <SkeletonBar key={k} x={x + 6} y={y + 20 + k * 9} w={w * 0.6} />
              ))}
              <Backdrop x={x} y={y} w={w} h={h} />
              <Modal x={x + 6} y={y + 26} w={w - 12} h={50} accent />
            </>
          )}
          {i === 4 && (
            <>
              <SkeletonBar x={x + 6} y={y + 12} w={w * 0.5} h={6} accent />
              <SkeletonBar x={x + 6} y={y + 24} w={w * 0.7} />
              <Section x={x + 6} y={y + 38} w={w - 12} h={56} rows={3} />
            </>
          )}
        </g>
      );
    })}
    <Rule x1={8} x2={336} y1={146} y2={146} stroke={PAINT.annotation} />
    <path d="M330 142 L336 146 L330 150" fill="none" stroke={PAINT.annotation} style={HAIRLINE} />
  </Illustration>
);


const REFLOW = {
  1280: {
    sidebar: 'docked',
    title: 'At 1280 wide the Sidebar is docked and the Section keeps its side column beside the body',
  },
  960: {
    sidebar: 'none',
    title: 'At 960 wide the Sidebar is collapsed and the Section drops its side column, which takes over the body when opened',
  },
  768: {
    sidebar: 'overlay',
    title: 'At 768 wide the Sidebar opens as an overlay on a Backdrop over the same single-column Section',
  },
};

/**
 * One Screen at a breakpoint, drawn to a common canvas (1 unit = 16px of
 * viewport), so three of them side by side show the reflow. The rules are the
 * Frame layout resolver's (the Sidebar docks from 1024, a Section holds its
 * side from 960 of its own width), not a restated copy.
 */
/** The drawing inside the canvas, without its wrapper, so a motion scene can animate between widths. */
export const ReflowScreen = ({ width = 1280, neutral = false }) => {
  const { sidebar } = REFLOW[width];
  const box = { x: 8, y: 6, w: width / 8, h: 100 };
  const { content } = screenLayout({ ...box, sidebar });
  const body = pageBody({ ...content, header: true });
  // The side column holds only while the Section is wide enough: with the Sidebar docked.
  const split = sidebar === 'docked';
  const mainW = split ? body.w * 0.62 : body.w;
  return (
    <Screen {...box} sidebar={sidebar} accentSidebar={!neutral && sidebar === 'overlay'}>
      <Section x={body.x} y={body.y} w={mainW} h={body.h} rows={2} accent={!neutral && sidebar !== 'overlay'} />
      {split && <Section x={body.x + mainW + 6} y={body.y} w={body.w - mainW - 6} h={body.h} rows={2} subtle />}
    </Screen>
  );
};

export const ResponsiveReflow = ({ width = 1280, title }) => (
  <Illustration width={176} height={112} title={title ?? REFLOW[width].title}>
    <ReflowScreen width={width} />
  </Illustration>
);
