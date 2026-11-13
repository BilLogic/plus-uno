import React from 'react';
import { Illustration, IllustrationFigure } from './Illustration.jsx';
import {
  AnatomyMarker, Backdrop, Breadcrumb, ButtonShape, Card, CountTag, Field, Flag, Frame, Modal, Page, PageHeader, Panel, Popup,
  ProgressTracker, Row, Screen, Section, Sidebar, StickyHeader, Tabs, Tooltip,
} from './primitives.jsx';
import { MOTION_SETS } from './primitives-motion.jsx';
import { SHAPE_SETS } from './shapes.jsx';

/**
 * Every primitive, neutral then accented, at the one scale the compositions use.
 * Later tickets draw with these and reference this page for what exists.
 */
const SETS = [
  ['Frame', (a) => <Frame x={10} y={8} w={140} h={84} accent={a} />],
  ['Sidebar', (a) => (<><Frame x={10} y={8} w={140} h={84} /><Sidebar x={10} y={20} w={44} h={72} accent={a} /></>)],
  ['Page header', (a) => <PageHeader x={16} y={38} w={128} accent={a} />],
  ['Section', (a) => <Section x={16} y={22} w={128} h={56} accent={a} />],
  ['Card', (a) => <Card x={46} y={16} w={68} h={68} accent={a} />],
  ['Row', (a) => (<><Row x={16} y={30} w={128} /><Row x={16} y={44} w={128} accent={a} /><Row x={16} y={58} w={128} /></>)],
  ['Field', (a) => (<><Field x={30} y={28} w={100} accent={a} /><Field x={30} y={54} w={100} /></>)],
  ['Button', (a) => (a
    ? <><ButtonShape x={34} y={42} w={44} label="Cancel" /><ButtonShape x={82} y={42} w={44} appearance="primary" label="Save" /></>
    : <><ButtonShape x={38} y={46} w={40} /><ButtonShape x={82} y={46} w={40} /></>)],
  ['Popup', (a) => (<><ButtonShape x={20} y={18} w={40} /><Popup x={20} y={34} w={80} h={48} accent={a} /></>)],
  ['Tooltip', (a) => (<><Tooltip x={20} y={14} w={72} accent={a} /><ButtonShape x={20} y={34} w={40} /></>)],
  ['Sticky header (overflow)', (a) => <StickyHeader x={20} y={14} w={120} accent={a} />],
  ['Panel', (a) => (<><Frame x={10} y={8} w={140} h={84} /><Panel x={96} y={20} w={54} h={72} accent={a} /></>)],
  ['Modal and backdrop', (a) => (<><Frame x={10} y={8} w={140} h={84} /><Backdrop x={10} y={20} w={140} h={72} /><Modal x={34} y={32} w={92} h={52} accent={a} /></>)],
  ['Page', (a) => (<><Frame x={10} y={8} w={140} h={84} /><Page x={14} y={22} w={132} h={68} header accent={a}><Section x={22} y={52} w={116} h={32} rows={1} /></Page></>)],
  ['Screen', (a) => <Screen x={10} y={8} w={140} h={84} accent={a}><Section x={62} y={44} w={80} h={40} rows={1} /></Screen>],
  ['Tabs', (a) => <Tabs x={20} y={40} w={120} count={4} selected={1} accent={a} />],
  ['Breadcrumb', (a) => <Breadcrumb x={20} y={46} w={120} count={4} accent={a} />],
  ['Progress tracker', (a) => <ProgressTracker x={12} y={44} w={136} count={4} current={1} accent={a} />],
  ['Flag', (a) => <Flag x={30} y={26} w={100} h={48} tone={a ? 'success' : 'neutral'} accent={a} />],
  ['Count tag', (a) => <CountTag x={64} y={44} w={32} h={14} accent={a} />],
  ['Anatomy marker', (a) => (<><Section x={44} y={22} w={100} h={56} /><AnatomyMarker x={20} y={50} tx={44} ty={34} accent={a} /></>)],
  // Motion's own primitives: chart axis and curve, trail, tap ring, pointer.
  ...MOTION_SETS,
  // The cover shapes: timeline, waveform, isometric stack, Logo construction, spring trail, path.
  ...SHAPE_SETS,
];

export const IllustrationKitGallery = () => (
  <div
    data-illustration-kit
    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, var(--card-min-width-sm)), 1fr))', gap: 'var(--stack-lg)' }}
  >
    {SETS.map(([name, draw]) => (
      <IllustrationFigure key={name} caption={name}>
        <Illustration width={160} height={200} capped={false} title={`${name}, neutral above and accented below`}>
          <svg x={0} y={0} width={160} height={100} viewBox="0 0 160 100">{draw(false)}</svg>
          <svg x={0} y={100} width={160} height={100} viewBox="0 0 160 100">{draw(true)}</svg>
        </Illustration>
      </IllustrationFigure>
    ))}
  </div>
);

export const PRIMITIVE_NAMES = SETS.map(([name]) => name);
