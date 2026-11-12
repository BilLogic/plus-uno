import React from 'react';
import { PAINT, HAIRLINE } from './paint.js';
import { Illustration } from './Illustration.jsx';
import {
  Backdrop, ButtonShape, Frame, Modal, Panel, Popup, Rect, Rule, Screen, Section, SkeletonBar, pageBody, screenLayout,
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
    <ButtonShape x={126} y={88} w={34} label="Cancel" />
    <ButtonShape x={164} y={88} w={34} appearance="primary" label="Save" />
    <Link x1={214} x2={234} y={80} />
    <Rect x={236} y={26} w={76} h={108} fill={PAINT.frameSunken} stroke={PAINT.frameDivider} corner="window" />
    <Section x={242} y={32} w={64} h={46} rows={1} />
    <ButtonShape x={274} y={56} w={28} appearance="primary" label="Save" />
    <Section x={242} y={82} w={64} h={46} rows={1} />
    <ButtonShape x={274} y={106} w={28} label="Edit" />
  </Illustration>
);

/** Popup, panel, modal, page: the lowest step that fits, left to right. */
export const OpeningARecord = ({
  title = 'Four ways to open a record, from lightest to heaviest: a popup, a side panel, a modal and its own page',
}) => (
  <Illustration width={336} height={154} viewBox="-8 12 336 154" title={title}>
    {[0, 1, 2, 3].map((i) => {
      const x = 8 + i * 78;
      const y = 28;
      const w = 70;
      const h = 104;
      if (i === 3) {
        return (
          <g key={i}>
            <Frame x={x} y={y} w={w} h={h} accent />
            <SkeletonBar x={x + 6} y={y + 22} w={w * 0.5} h={6} accent />
            <SkeletonBar x={x + 6} y={y + 34} w={w * 0.7} />
            <Section x={x + 6} y={y + 46} w={w - 12} h={48} rows={2} />
          </g>
        );
      }
      return (
        <g key={i}>
          <Frame x={x} y={y} w={w} h={h} />
          {[0, 1, 2, 3].map((k) => (
            <SkeletonBar key={k} x={x + 6} y={y + 20 + k * 9} w={w * 0.6} />
          ))}
          {i === 0 && <Popup x={x + 18} y={y + 40} w={44} h={34} accent />}
          {i === 1 && <Panel x={x + w - 30} y={y + 12} w={30} h={h - 12} accent />}
          {i === 2 && (
            <>
              <Backdrop x={x} y={y + 12} w={w} h={h - 12} />
              <Modal x={x + 8} y={y + 34} w={w - 16} h={50} accent />
            </>
          )}
        </g>
      );
    })}
    <Rule x1={8} x2={312} y1={146} y2={146} stroke={PAINT.annotation} />
    <path d="M306 142 L312 146 L306 150" fill="none" stroke={PAINT.annotation} style={HAIRLINE} />
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
export const ResponsiveReflow = ({ width = 1280, title }) => {
  const { sidebar, title: defaultTitle } = REFLOW[width];
  const box = { x: 8, y: 6, w: width / 8, h: 100 };
  const { content } = screenLayout({ ...box, sidebar });
  const body = pageBody({ ...content, header: true });
  // The side column holds only while the Section is wide enough: with the Sidebar docked.
  const split = sidebar === 'docked';
  const mainW = split ? body.w * 0.62 : body.w;
  return (
    <Illustration width={176} height={112} title={title ?? defaultTitle}>
      <Screen {...box} sidebar={sidebar} accentSidebar={sidebar === 'overlay'}>
        <Section x={body.x} y={body.y} w={mainW} h={body.h} rows={2} accent={sidebar !== 'overlay'} />
        {split && <Section x={body.x + mainW + 6} y={body.y} w={body.w - mainW - 6} h={body.h} rows={2} />}
      </Screen>
    </Illustration>
  );
};
