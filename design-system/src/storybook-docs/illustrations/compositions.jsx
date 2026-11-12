import React from 'react';
import { PAINT, HAIRLINE } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, ButtonShape, Frame, Modal, Panel, Popup, Rect, Rule, Section, SkeletonBar } from './primitives.jsx';

/** One dotted joint between two layers. */
const Link = ({ x1, x2, y }) => <Rule x1={x1} x2={x2} y1={y} y2={y} stroke={PAINT.ink} dash="2 3" />;

/**
 * Component, then template, then pattern. The accent follows one button
 * through all three layers.
 */
export const ThreeLayers = ({
  title = 'The same primary button as a component, inside a Section template, and placed on a Frame by a pattern',
}) => (
  <Illustration width={312} height={132} viewBox="12 14 312 132" title={title}>
    <ButtonShape x={28} y={74} w={48} accent primary />
    <Link x1={92} x2={112} y={80} />
    <Section x={118} y={50} w={84} h={60} rows={2} />
    <ButtonShape x={130} y={94} w={28} />
    <ButtonShape x={162} y={94} w={28} accent primary />
    <Link x1={214} x2={234} y={80} />
    <Rect x={236} y={30} w={72} h={100} fill={PAINT.sunken} stroke={PAINT.line} corner="md" />
    <Section x={242} y={38} w={60} h={40} rows={1} />
    <ButtonShape x={270} y={64} w={26} accent primary />
    <Section x={242} y={84} w={60} h={40} rows={1} />
    <ButtonShape x={270} y={110} w={26} primary />
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
    <Rule x1={8} x2={312} y1={146} y2={146} stroke={PAINT.ink} />
    <path d="M306 142 L312 146 L306 150" fill="none" stroke={PAINT.ink} style={HAIRLINE} />
  </Illustration>
);

