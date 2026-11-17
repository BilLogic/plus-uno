import React from 'react';
import { Illustration } from './Illustration.jsx';
import { PAINT } from './paint.js';
import { Breadcrumb, Row, Section, SkeletonBar } from './primitives.jsx';

/**
 * The Page template's do and don't drawings. Each lesson is about where a part
 * sits in the page header, so every drawing is blocked out: no words, buttons
 * as flat strips, one accent on the subject. Every pair shares one canvas, so
 * a do and its don't compare at one scale.
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

/** The page's title: one heading bar, with an optional description line under it. */
const Title = ({ y, accent = false, description = true, w = 52 }) => (
  <g>
    <SkeletonBar x={X} y={y} w={w} h={8} accent={accent} heading />
    {description && <SkeletonBar x={X} y={y + 13} w={w * 1.4} />}
  </g>
);

const Rows = ({ y, count = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => <Row key={i} x={X} y={y + i * 15} w={INNER} />)}
  </g>
);

/** One h1 in the page header; the Section under it opens at h2. */
export const HeaderIsTheH1 = ({ title = 'A page header holding the one large title, with a Section under it whose heading is smaller' }) => (
  <Canvas title={title}>
    <Title y={8} accent />
    <Section x={X} y={40} w={INNER} h={56} rows={3} />
  </Canvas>
);

/** Sections standing in for the title: two headings the size of a page title, no header. */
export const SectionsAsTitles = ({ title = 'Two Sections whose headings are as large as a page title, and no page header above them' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={10} w={52} h={8} accent heading />
    <Rows y={24} count={2} />
    <SkeletonBar x={X} y={62} w={52} h={8} heading />
    <Rows y={76} count={1} />
  </Canvas>
);

/** An area page: the title alone, with nothing above it. */
export const AreaPageTitleAlone = ({ title = 'An area page whose header is the title alone, with nothing above it' }) => (
  <Canvas title={title}>
    <Title y={12} accent description={false} />
    <Section x={X} y={36} w={INNER} h={56} rows={3} />
  </Canvas>
);

/** A breadcrumb on an area page, repeating the Sidebar's place. */
export const BreadcrumbOnAreaPage = ({ title = 'An area page with a breadcrumb row above its title, repeating the place the sidebar already shows' }) => (
  <Canvas title={title}>
    <Breadcrumb x={X} y={8} w={64} count={2} accent />
    <Title y={22} description={false} />
    <Section x={X} y={46} w={INNER} h={50} rows={3} />
  </Canvas>
);

/** One detail line under the title. */
export const OneLineDescription = ({ title = 'A page title with one short line of description under it, then the first Section' }) => (
  <Canvas title={title}>
    <Title y={8} />
    <Section x={X} y={40} w={INNER} h={56} rows={3} />
  </Canvas>
);

/** A paragraph under the title: three lines pushing the Sections down. */
export const ParagraphUnderTitle = ({ title = 'A page title with a three-line paragraph under it that pushes the first Section down the page' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={8} w={52} h={8} heading />
    <SkeletonBar x={X} y={21} w={INNER * 0.9} accent />
    <SkeletonBar x={X} y={29} w={INNER * 0.85} accent />
    <SkeletonBar x={X} y={37} w={INNER * 0.5} accent />
    <Section x={X} y={54} w={INNER} h={44} rows={2} />
  </Canvas>
);
